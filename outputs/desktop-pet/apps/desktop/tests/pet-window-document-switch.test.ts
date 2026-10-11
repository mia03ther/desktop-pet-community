import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const desktopDir = process.env.OPENPETS_DESKTOP_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), "../..");
const sourcePath = join(desktopDir, "src", "pet-window.ts");
const testProfileDir = join(desktopDir, ".test-profile-document-switch");
const require = createRequire(join(desktopDir, "package.json"));
const esbuild = createRequire(require.resolve("vite/package.json"))("esbuild");

let harnessId = 0;
// 使用真实窗口加载流程，只替换 Electron 与渲染输入；取消的导航不能提交缓存。
async function createHarness() {
  const root = globalThis as unknown as Record<string, any>;
  const state = { queue: [] as Array<Promise<unknown>>, files: new Map<string, string>(), loaded: [] as string[], messages: [] as string[], document: "", loading: false };
  root.__petDocumentSwitchTest = state;
  const compiled = (await esbuild.transform(readFileSync(sourcePath, "utf8"), { loader: "ts", format: "esm" })).code as string;
  const providers = new Map<string, Set<string>>();
  for (const match of compiled.matchAll(/(?:import|export)\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g)) {
    const names = providers.get(match[2]!) ?? new Set<string>();
    for (const item of match[1]!.split(",")) names.add(item.trim().split(/\s+as\s+/)[0]!);
    providers.set(match[2]!, names);
  }
  const special: Record<string, string> = {
    app: `{ getPath: () => ${JSON.stringify(testProfileDir)}, commandLine: { getSwitchValue: () => "" } }`,
    BrowserWindow: 'class {}', screen: '{}',
    mkdir: 'async () => {}', stat: 'async () => ({})', writeFile: 'async (file, html) => { h.files.set(file, html); }',
    getAppStateSnapshot: '() => ({ preferences: { petScale: 1, hudScale: 1 }, pets: { installed: [{ id: "test-pet", displayName: "测试" }] } })',
    createDefaultPetRenderContent: '() => h.queue.shift()', createInstalledPetRender: '() => h.queue.shift()',
    builtInPet: '{ id: "builtin" }', createBubbleMarkup: '() => ""',
    computeEffectiveWaylandBackend: '() => false', shouldPetWindowBeFocusable: '() => false',
  };
  const bundle = await esbuild.build({ entryPoints: [sourcePath], bundle: true, write: false, platform: "node", format: "esm", plugins: [{
    name: "窗口文档切换测试宿主",
    setup(builder: any) {
      builder.onResolve({ filter: /.*/ }, (args: any) => {
        if (args.kind === "entry-point") return undefined;
        if (args.path === "./pet-render-lifecycle.js") return { path: join(desktopDir, "src", "pet-render-lifecycle.ts") };
        if (!providers.has(args.path) || (args.path.startsWith("node:") && args.path !== "node:fs/promises")) return undefined;
        return { path: args.path, namespace: "test-provider" };
      });
      builder.onLoad({ filter: /.*/, namespace: "test-provider" }, (args: any) => ({ contents: 'const h = globalThis.__petDocumentSwitchTest;\n' + [...providers.get(args.path)!].map(name => `export const ${name} = ${special[name] ?? '() => undefined'};`).join("\n"), loader: "js" }));
    },
  }] });
  const module = await import("data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].contents).toString("base64") + "#" + ++harnessId);
  const window = {
    id: 1, isDestroyed: () => false, isFocusable: () => false, setFocusable() {}, setIgnoreMouseEvents() {},
    webContents: {
      isDestroyed: () => false, isLoading: () => state.loading, getURL: () => pathToFileURL(join(testProfileDir, "rendered-pets", "default.html")).href,
      executeJavaScript: async () => undefined,
      send(channel: string, payload: { bodyHtml: string }) { if (channel === "openpets:pet-content-state") state.messages.push(`${state.document}->${payload.bodyHtml}`); },
    },
    async loadFile(file: string) { state.document = state.files.get(file)!; state.loaded.push(state.document); },
  };
  const render = (mode: string) => ({ cacheKey: mode, html: mode, bodyHtml: mode, displayName: mode, assetName: mode, reactionState: "idle", codexSpriteVersion: mode === "atlas" ? 2 : 1, paused: false, flipped: false });
  const request = (explicit: boolean) => explicit ? module.loadExplicitPetContent(window, "test-pet") : module.loadDefaultPetContent(window, false);
  return { state, render, request, cleanup() { delete root.__petDocumentSwitchTest; } };
}

for (const explicit of [false, true]) {
  describe(explicit ? "指定桌宠文档切换" : "默认桌宠文档切换", () => {
    it("连续切换图集→媒体→图集时，过期导航不能把新内容塞进旧文档", async () => {
      const h = await createHarness();
      try {
        h.state.queue.push(Promise.resolve(h.render("atlas")));
        await h.request(explicit);
        for (const mode of ["media", "atlas"]) {
          let finishFirst!: (value: unknown) => void, finishSecond!: (value: unknown) => void;
          h.state.queue.push(new Promise(resolve => { finishFirst = resolve; }), new Promise(resolve => { finishSecond = resolve; }));
          const first = h.request(explicit), second = h.request(explicit);
          finishFirst(h.render(mode));
          await first;
          finishSecond(h.render(mode));
          await second;
          assert.equal(h.state.document, mode, "过期导航之后仍须实际导航，刷新样式和 CSP");
          h.state.queue.push(Promise.resolve(h.render(mode)));
          await h.request(explicit);
          assert.equal(h.state.messages.at(-1), `${mode}->${mode}`, "同文档动作更新应继续原位更新");
        }
        assert.deepEqual(h.state.loaded, ["atlas", "media", "atlas"]);
        assert.ok(h.state.messages.every(x => x === "atlas->atlas" || x === "media->media"), "不在旧文档内更新不同类型的内容");
      } finally { h.cleanup(); }
    });
  });
}
