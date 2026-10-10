import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { parseCompanionPluginAuthoringInput, type CompanionPluginAuthoringInput } from "../src/companion-plugin-authoring-types.js";
import { readLocalPluginSourceManifest } from "../src/plugin-local-loader.js";
import { validatePluginManifest } from "../src/plugin-manifest.js";
import { PluginService } from "../src/plugin-service.js";

// 保留真实文件系统，在写入完成后注入取消或故障，验证清理边界。
const filesystemMock = `data:text/javascript,${encodeURIComponent(`
  export * from "node:fs/promises";
  import { writeFile as actualWriteFile } from "node:fs/promises";
  let afterWrite;
  export function setAfterWrite(callback) { afterWrite = callback; }
  export async function writeFile(...args) {
    await actualWriteFile(...args);
    await afterWrite?.(args[0]);
  }
`)}`;
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "node:fs/promises" && context.parentURL?.endsWith("/companion-plugin-authoring.js")) {
      return { url: ${JSON.stringify(filesystemMock)}, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);
const { setAfterWrite } = await import(filesystemMock) as {
  setAfterWrite(callback: ((path: string) => void | Promise<void>) | undefined): void;
};
const { createCompanionPluginPackage, buildCompanionPluginManifest } = await import("../src/companion-plugin-authoring.js");

const draft: CompanionPluginAuthoringInput = {
  id: "local.test-reminder", title: "活动提醒", everyMinutes: 5,
  speech: "起来活动一下。", reaction: "waving",
  author: "测试作者", source: "https://example.com/source", license: "作者自述许可",
};

test("制作输入拒绝未知能力、坏文本和不支持的间隔", () => {
  for (const invalid of [
    null, [], { ...draft, command: "执行代码" }, { ...draft, id: "../outside" },
    { ...draft, id: "openpets.life-companion" }, { ...draft, id: "con" },
    { ...draft, everyMinutes: 4 }, { ...draft, everyMinutes: 1441 }, { ...draft, everyMinutes: 5.5 },
    { ...draft, everyMinutes: Number.NaN }, { ...draft, reaction: "unknown" },
    { ...draft, title: "坏\n名称" }, { ...draft, title: "坏\ud800名称" },
    { ...draft, speech: "a".repeat(141) }, { ...draft, speech: "$t:missing" },
    { ...draft, author: "a".repeat(121) }, { ...draft, source: "s".repeat(1001) },
    { ...draft, license: "l".repeat(201) }, { ...draft, source: "来源\u202e" },
    { ...draft, license: { unexpected: true } },
  ]) {
    assert.throws(() => parseCompanionPluginAuthoringInput(invalid));
  }
  assert.equal(parseCompanionPluginAuthoringInput({ ...draft, title: "  小猫 🐱  " }).title, "小猫 🐱");
  const speechOnly = buildCompanionPluginManifest({ ...draft, reaction: undefined });
  assert.equal(validatePluginManifest(speechOnly).ok, true);
  assert.deepEqual(speechOnly.permissions, ["timer", "pet:speak"]);
});

test("共创包不覆盖文件，能通过现有导入、权限确认和真实定时运行", async () => {
  const fixture = await realpath(await mkdtemp(join(tmpdir(), "companion-plugin-package-")));
  const parent = join(fixture, "selected");
  await mkdir(parent);
  await writeFile(join(parent, "keep.txt"), "已有文件");
  const events: string[] = [];
  const timers: Array<{ callback: () => void; active: boolean; delayMs: number }> = [];
  let approve = false;
  const service = new PluginService({
    userDataPath: join(fixture, "user-data"), disableCatalog: true, seedBundledPlugins: false,
    confirmPermissions: async () => approve,
    petApi: {
      speak(message) { events.push(message); },
      react(reaction) { events.push(reaction); },
      moveBy() {}, wander() {}, moveToHome() {},
    },
    scheduler: {
      setTimeout(callback, delayMs) {
        const timer = { callback, delayMs, active: true };
        timers.push(timer);
        return { cancel() { timer.active = false; } };
      },
    },
  });
  try {
    await service.start();
    const first = await createCompanionPluginPackage(draft, parent);
    const second = await createCompanionPluginPackage(draft, parent);
    assert.notEqual(first.directoryPath, second.directoryPath);
    assert.equal(await readFile(join(parent, "keep.txt"), "utf8"), "已有文件");
    assert.deepEqual((await readdir(first.directoryPath)).sort(), ["SHARE.md", "openpets.plugin.json"]);
    const source = await readLocalPluginSourceManifest({ sourceFolder: first.directoryPath });
    assert.equal(source.manifest.runtime, "declarative");
    assert.equal(validatePluginManifest(source.manifest).ok, true);
    assert.equal("author" in source.manifest, false);
    assert.equal("sourcePath" in source.manifest, false);
    const readme = await readFile(join(first.directoryPath, "SHARE.md"), "utf8");
    const readableDeclaration = readme.replace(/\\([\\`*_{}\[\]()#+.!|~\-])/g, "$1");
    assert.ok(readableDeclaration.includes(draft.author!) && readableDeclaration.includes(draft.source!));
    assert.ok(!readme.includes(fixture));
    assert.equal(service.stateStore.getRecord(draft.id), undefined);
    await service.loadLocalPath(first.directoryPath);
    assert.equal(service.stateStore.getRecord(draft.id), undefined);
    assert.equal(timers.length, 0);
    approve = true;
    assert.equal((await service.loadLocalPath(first.directoryPath)).ok, true);
    const installed = service.stateStore.getRecord(draft.id)!;
    assert.deepEqual(JSON.parse(await readFile(join(installed.installPath, "import-source-openpets.plugin.json"), "utf8")), JSON.parse(await readFile(join(first.directoryPath, "openpets.plugin.json"), "utf8")), "导入须保留完整原清单");
    assert.equal(await readFile(join(installed.installPath, "SHARE.md"), "utf8"), readme, "作者与许可声明须随原包保留");
    assert.equal(validatePluginManifest(JSON.parse(await readFile(join(installed.installPath, "openpets.plugin.json"), "utf8"))).ok, true);
    assert.equal(installed.enabled, true);
    const timer = timers.find((entry) => entry.active)!;
    assert.equal(timer.delayMs, 5 * 60_000);
    timer.active = false;
    timer.callback();
    await new Promise<void>((complete) => setImmediate(complete));
    assert.deepEqual(events, [draft.speech, draft.reaction]);
    await service.setEnabled(draft.id, false);
    assert.equal(timers.some((entry) => entry.active), false);
  } finally {
    await service.stop();
    await rm(fixture, { recursive: true, force: true });
  }
});

test("取消和写入故障只清理本次新目录，拒绝网络、数据流和目录链接", async () => {
  const fixture = await realpath(await mkdtemp(join(tmpdir(), "companion-plugin-cancel-")));
  const parent = join(fixture, "selected");
  const outside = join(fixture, "outside");
  await mkdir(parent);
  await mkdir(outside);
  await writeFile(join(parent, "keep.txt"), "保留");
  await writeFile(join(outside, "keep.txt"), "外部保留");
  try {
    const cancelled = new AbortController();
    setAfterWrite(() => cancelled.abort());
    await assert.rejects(createCompanionPluginPackage(draft, parent, cancelled.signal));
    assert.deepEqual(await readdir(parent), ["keep.txt"]);
    setAfterWrite(() => { throw new Error("模拟写入失败"); });
    await assert.rejects(createCompanionPluginPackage(draft, parent));
    assert.deepEqual(await readdir(parent), ["keep.txt"]);
    setAfterWrite(undefined);
    await assert.rejects(createCompanionPluginPackage(draft, "\\\\server\\share"));
    await assert.rejects(createCompanionPluginPackage(draft, `${parent}:stream`));
    const link = join(fixture, "linked-parent");
    await symlink(outside, link, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(createCompanionPluginPackage(draft, link));
    assert.deepEqual(await readdir(outside), ["keep.txt"]);

    const escaped = join(outside, "escaped-package");
    let substituted = "";
    setAfterWrite(async (path) => {
      setAfterWrite(undefined);
      substituted = dirname(path);
      await rename(substituted, escaped);
      await mkdir(substituted);
      await writeFile(join(substituted, "keep.txt"), "替换目录保留");
    });
    await assert.rejects(createCompanionPluginPackage(draft, parent), AggregateError);
    assert.equal(await readFile(join(substituted, "keep.txt"), "utf8"), "替换目录保留");
    assert.equal((await readLocalPluginSourceManifest({ sourceFolder: escaped })).manifest.id, draft.id);
    assert.equal(await readFile(join(outside, "keep.txt"), "utf8"), "外部保留");
  } finally {
    setAfterWrite(undefined);
    await rm(fixture, { recursive: true, force: true });
  }
});
