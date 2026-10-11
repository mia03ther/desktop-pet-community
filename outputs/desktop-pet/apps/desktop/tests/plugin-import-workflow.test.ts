import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setImmediate as turn } from "node:timers/promises";
import yazl from "yazl";
import { inspectOriginalProject, OriginalProjectStore } from "../src/original-projects.js";
import { loadLocalPluginSnapshot } from "../src/plugin-local-loader.js";
import { PluginService } from "../src/plugin-service.js";
import type { PluginJsHost, PluginJsHostStartOptions } from "../src/plugin-js-host.js";
import type { PluginSdkApi } from "../src/plugin-sdk-bridge.js";
import { readLocalPackageFiles } from "../src/local-package-files.js";
import { packageImportLimits } from "../src/package-import-limits.js";

const root = await mkdtemp(join(tmpdir(), "desktop-pet-plugin-import-workflow-"));
const publicZip = await readFile(new URL("../../../community-web/dist/assets/openpets.water-reminder.zip", import.meta.url));
const zipPath = join(root, "openpets.water-reminder.zip");
const events: string[] = [];
const scheduled: Array<{ active: boolean; callback: () => void; delay: number }> = [];
let permissionRequests = 0;
let stopped = 0;
let approve = false;

// 仅执行仓库公开的喝水提醒夹具；实际插件代码和 SDK 都参与测试，不执行用户下载的未知代码。
const fixtureHost: PluginJsHost = {
  async startPlugin(options: PluginJsHostStartOptions) {
    const entry = await readFile(options.entryPath);
    const original = originalFiles.get("index.js")!;
    assert.equal(createHash("sha256").update(entry).digest("hex"), createHash("sha256").update(original).digest("hex"));
    let lifecycle: { start(ctx: PluginSdkApi): Promise<void>; stop(): Promise<void> } | undefined;
    const module = await import(`data:text/javascript;base64,${entry.toString("base64")}`) as { register(host: { register(value: typeof lifecycle): void }): void };
    module.register({ register(value) { lifecycle = value; } });
    assert.ok(lifecycle);
    assert.ok(options.sdk);
    const sdk = options.sdk;
    // 无界面测试只桥接 preload 的资源引用和气泡句柄包装；校验、权限、调度及对话仍走真实 SDK。
    const rendererSdk = {
      ...sdk,
      assets: { icon: (name: string) => sdk.assets.resolve("icon", name) },
      ui: { ...sdk.ui, alert: async (spec: unknown) => {
        const handle = await sdk.ui.alert(spec);
        return {
          onDismiss: (callback: (...args: never[]) => void) => sdk.ui.bubbleSubscribe(handle.bubbleId, "dismiss", callback),
          onAction: (callback: (...args: never[]) => void) => sdk.ui.bubbleSubscribe(handle.bubbleId, "action", callback),
        };
      } },
    };
    await lifecycle.start(rendererSdk as unknown as PluginSdkApi);
    return { stop() { stopped += 1; void lifecycle!.stop(); } };
  },
};
let originalFiles: Map<string, Buffer>;
const service = new PluginService({
  userDataPath: join(root, "profile"),
  seedBundledPlugins: false,
  disableCatalog: true,
  petApi: { speak(message) { events.push(message); }, react() {}, moveBy() {}, wander() {}, moveToHome() {} },
  scheduler: { setTimeout(callback, delay) { const timer = { active: true, callback, delay }; scheduled.push(timer); return { cancel() { timer.active = false; } }; } },
  jsHost: fixtureHost,
  showOpenDialog: async () => ({ canceled: false, filePaths: [zipPath] }),
  confirmPermissions: async manifest => { permissionRequests += 1; assert.ok(manifest.permissions.includes("pet:speak")); return approve; },
});
try {
  await writeFile(zipPath, publicZip);
  originalFiles = await readLocalPackageFiles(zipPath, packageImportLimits);
  assert.ok(originalFiles.get("index.js"));
  await service.start();
  const canceled = await service.loadLocal();
  assert.equal(canceled.ok, true);
  assert.deepEqual(service.stateStore.listRecords(), [], "取消授权不得安装或启用插件");
  assert.equal(permissionRequests, 1);
  assert.deepEqual(events, []);

  approve = true;
  const loaded = await service.loadLocal();
  assert.equal(loaded.ok, true);
  assert.equal(permissionRequests, 2);
  const snapshot = await service.getSnapshot();
  assert.equal(snapshot.plugins[0]?.id, "openpets.water-reminder");
  assert.equal(snapshot.plugins[0]?.enabled, true);
  assert.equal(snapshot.plugins[0]?.active, true);
  assert.ok(snapshot.plugins[0]?.approvedPermissions.includes("pet:speak"));
  assert.ok(snapshot.plugins[0]?.commands?.some(command => command.id === "test-reminder"));
  assert.ok(scheduled.some(timer => timer.active && timer.delay > 0));
  await service.runtime.executeCommand("openpets.water-reminder", "test-reminder");
  await turn();
  assert.equal(events.length, 1, "实际喝水提醒代码应通过 SDK 发出对话提醒");
  assert.match(events[0]!, /Water break|喝水|水分|물|Pausa|agua/);
  assert.equal((await service.setEnabled("openpets.water-reminder", false)).ok, true);
  assert.equal(service.runtime.isPluginActive("openpets.water-reminder"), false);
  assert.ok(stopped > 0);
  assert.equal(scheduled.some(timer => timer.active), false);
  await assert.rejects(() => service.runtime.executeCommand("openpets.water-reminder", "test-reminder"));
  assert.equal(events.length, 1);
  console.log("通过：公开喝水提醒 ZIP → 选择 → 授权 → 原生 SDK 启用 → 提醒对话 → 禁用停止；拒绝授权没有执行");

  // 真实单文件超过旧 100 MiB，并超过旧 1000 文件；保留全部原件而不执行其中附件。
  const zip = new yazl.ZipFile();
  for (const [name, bytes] of originalFiles) zip.addBuffer(bytes, `release/${name}`);
  const large = Buffer.alloc(104 * 1024 * 1024, 7);
  zip.addBuffer(large, "release/attachments/original-video.bin");
  for (let index = 0; index < 1100; index++) zip.addBuffer(Buffer.from(`附件 ${index}`), `release/attachments/${index}.txt`);
  const chunks: Buffer[] = [];
  zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
  const complete = new Promise<void>((resolve, reject) => { zip.outputStream.on("end", resolve); zip.outputStream.on("error", reject); });
  zip.end();
  await complete;
  const largeZip = join(root, "large-water-reminder.zip");
  await writeFile(largeZip, Buffer.concat(chunks));
  const inspected = await inspectOriginalProject(largeZip, "plugin");
  assert.equal(inspected.report.status, "native");
  assert.ok(inspected.files.size > 1000);
  const archive = new OriginalProjectStore(join(root, "original-profile"));
  const saved = await archive.archive(inspected);
  const preservedDirectory = await archive.directory(saved.id);
  const installed = await loadLocalPluginSnapshot({ sourceFolder: preservedDirectory, userDataPath: join(root, "large-profile") });
  const copied = await readFile(join(installed.installPath, "attachments/original-video.bin"));
  assert.equal(copied.length, large.length);
  assert.equal(createHash("sha256").update(copied).digest("hex"), createHash("sha256").update(large).digest("hex"));
  assert.equal(await readFile(join(installed.installPath, "attachments/1099.txt"), "utf8"), "附件 1099");
  console.log(`通过：104 MiB 单文件、${inspected.files.size} 文件真实 ZIP → 静态原生识别 → 原件托管 → 本机插件安装，原字节未变`);
} finally {
  await service.stop();
  await rm(root, { recursive: true, force: true });
}
