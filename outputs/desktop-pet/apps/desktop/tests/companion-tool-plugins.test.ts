import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { companionToolPluginIds, hasCompanionToolPluginAccess, assertCompanionToolPluginAccess, type CompanionToolPluginKind } from "../src/companion-tool-plugins.js";
import { PluginService } from "../src/plugin-service.js";
import { PluginStateStore } from "../src/plugin-state.js";
import type { PluginJsHostInstance } from "../src/plugin-js-host.js";
import { CompanionToolsService } from "../src/companion-tools.js";
import { CompanionDownloadsService } from "../src/companion-downloads.js";
import { CompanionFilesService } from "../src/companion-files.js";
import { CompanionFileLibrary } from "../src/companion-file-library.js";
import { CompanionFileClassification } from "../src/companion-file-classification.js";
import { installControlCenterCompanionIpcHandlers } from "../src/control-center-companion-ipc.js";
import { installControlCenterFileLibraryIpcHandlers } from "../src/control-center-file-library-ipc.js";
import type { CompanionFolderScope } from "../src/companion-tools-types.js";
import type { CompanionFilePlan } from "../src/companion-files-types.js";
import type { CompanionDiagnosticsSnapshot } from "../src/companion-diagnostics-types.js";
import type { CompanionFileLibraryAiDraft, CompanionFileLibraryAiPreview } from "../src/companion-file-library-ai-types.js";
import type { CompanionInstallerEvidence } from "../src/companion-software-types.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function sample(): CompanionDiagnosticsSnapshot {
  return {
    version: 1, sampledAt: Date.now(), sampleDurationMs: 1000, cpuPercent: 10, memory: null,
    disks: [], processes: [], startupItems: [], installedApps: [], installedAppsComplete: true,
    windows: [], collectionIssues: [], coverage: [], findings: [],
  };
}

function pluginAccess() {
  const enabled = new Set<CompanionToolPluginKind>();
  const listeners = new Set<() => void>();
  return {
    enabled,
    assert(kind: CompanionToolPluginKind) {
      assertCompanionToolPluginAccess(kind, {
        id: companionToolPluginIds[kind], enabled: enabled.has(kind), source: "local",
        approvedPermissions: ["files", "system:metrics"],
      }, enabled.has(kind));
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit() {
      for (const listener of listeners) listener();
    },
  };
}

test("工具只在对应插件安装、授权并实际运行时开放", () => {
  const files = { id: companionToolPluginIds.files, enabled: true, approvedPermissions: ["files"], source: "local" };
  assert.equal(hasCompanionToolPluginAccess("files", files, true), true);
  assert.equal(hasCompanionToolPluginAccess("files", undefined, true), false);
  assert.equal(hasCompanionToolPluginAccess("files", files, false), false);
  for (const patch of [
    { id: "unrelated.files" }, { enabled: false }, { brokenReason: "运行失败" },
    { catalogDisabled: true }, { source: "team" }, { approvedPermissions: [] },
  ]) {
    assert.equal(hasCompanionToolPluginAccess("files", { ...files, ...patch }, true), false);
  }
  const computer = { ...files, id: companionToolPluginIds.computer };
  assert.equal(hasCompanionToolPluginAccess("computer", computer, true), false);
  assert.equal(hasCompanionToolPluginAccess("computer", { ...computer, approvedPermissions: ["files", "system:metrics", "status"] }, true), true);
});

test("原插件状态和运行事件覆盖启动、停用、损坏及停止，不以 enabled 冒充运行", async () => {
  const directory = await mkdtemp(join(tmpdir(), "companion-tool-runtime-"));
  const id = companionToolPluginIds.files;
  const installPath = join(directory, "plugins", id);
  await mkdir(installPath, { recursive: true });
  await writeFile(join(installPath, "index.js"), "export default {};");
  const manifestPath = join(installPath, "openpets.plugin.json");
  await writeFile(manifestPath, JSON.stringify({
    manifestVersion: 3, id, name: "文件助手测试", version: "1.0.0", runtime: "javascript",
    sdkVersion: "3.0.0", entry: "index.js", permissions: ["files"],
  }));
  const store = new PluginStateStore({ userDataPath: directory });
  store.initialize();
  store.upsertRecord({ id, version: "1.0.0", installPath, manifestPath, source: "local", runtime: "javascript", manifestVersion: 3, enabled: true, approvedPermissions: ["files"], config: {} });
  const began = deferred<void>();
  const host = deferred<PluginJsHostInstance>();
  let broken: ((reason: string) => void) | undefined;
  const service = new PluginService({
    userDataPath: directory, stateStore: store, seedBundledPlugins: false,
    petApi: { speak() {}, react() {}, moveBy() {}, wander() {}, moveToHome() {} },
    jsHost: { startPlugin: async (options) => {
      broken = options.onBroken;
      began.resolve();
      return host.promise;
    } },
  });
  const allowed = () => hasCompanionToolPluginAccess("files", store.getRecord(id), service.runtime.isPluginActive(id));
  const observed: boolean[] = [];
  const unsubscribe = service.subscribe(() => observed.push(allowed()));
  try {
    const starting = service.start();
    await began.promise;
    assert.equal(allowed(), false);
    host.resolve({ stop() {} });
    await starting;
    assert.equal(allowed(), true);
    assert.equal((await service.getSnapshot()).plugins[0].active, true);
    await service.setEnabled(id, false);
    assert.equal(allowed(), false);
    await service.setEnabled(id, true);
    assert.equal(allowed(), true);
    assert.ok(broken);
    broken("测试运行损坏");
    assert.equal(allowed(), false);
    assert.equal(store.getRecord(id)?.enabled, true);
    assert.ok(observed.includes(true) && observed.at(-1) === false);
    await service.stop();
    assert.equal(service.runtime.isPluginActive(id), false);
    unsubscribe();
    const observedBefore = observed.length;
    store.setEnabled(id, false);
    assert.equal(observed.length, observedBefore);
  } finally {
    unsubscribe();
    await service.stop();
    await rm(directory, { recursive: true, force: true });
  }
});

test("停用文件插件撤销目录和执行计划，停用后再启用也不能接收旧选择", async () => {
  const directory = await mkdtemp(join(process.cwd(), "companion-tool-ipc-"));
  const selected = join(directory, "资料");
  await mkdir(selected);
  await writeFile(join(selected, "notes.txt"), "原始资料");
  const access = pluginAccess();
  type Handler = Parameters<Parameters<typeof installControlCenterCompanionIpcHandlers>[0]["registerHandle"]>[1];
  const handlers = new Map<string, Handler>();
  let picker: () => Promise<string | null> = async () => selected;
  let effects = 0;
  const tools = new CompanionToolsService({ statePath: join(directory, "tools.json"), collect: async () => { effects++; return sample(); }, notify: () => false });
  const downloads = new CompanionDownloadsService({ statePath: join(directory, "downloads.json"), inspect: async () => { effects++; throw new Error("不应检查安装包"); }, notify: () => false });
  const files = new CompanionFilesService({ journalDirectory: join(directory, "operations") });
  const ipc = installControlCenterCompanionIpcHandlers({
    registerHandle: (name, handler) => handlers.set(name, handler), authorizeSender: () => undefined,
    assertToolAccess: (kind) => access.assert(kind), subscribeToolAccess: (listener) => access.subscribe(listener),
    tools, downloads, files,
    pickFolder: () => { effects++; return picker(); }, pickFiles: async () => [],
    pickInstaller: () => { effects++; return picker(); }, pickDownloadsFolder: async () => null,
    inspectInstaller: async () => { effects++; throw new Error("不应检查安装包"); },
    captureWindow: async () => { effects++; return { version: 1, sampledAt: 1, window: null, note: "测试" }; },
    reveal: () => { effects++; }, open: async () => { effects++; return ""; },
    openSystem: async () => { effects++; }, copy: () => { effects++; },
  });
  const call = (name: string, ...args: unknown[]) => handlers.get(`openpets:companion-${name}`)!({ sender: { id: 1 } }, ...args);
  try {
    for (const handler of handlers.values()) await assert.rejects(handler({ sender: { id: 1 } }));
    assert.equal(effects, 0);
    access.enabled.add("files");
    const scope = await call("choose-folder") as CompanionFolderScope;
    const plan = await call("preview-organize", scope.id) as CompanionFilePlan;
    access.enabled.delete("files");
    access.emit();
    access.enabled.add("files");
    access.emit();
    await assert.rejects(call("analyze", scope.id));
    await assert.rejects(call("execute-plan", plan.id));
    assert.equal(await readFile(join(selected, "notes.txt"), "utf8"), "原始资料");
    const choice = deferred<string | null>();
    picker = () => choice.promise;
    const choosing = call("choose-folder");
    const rejected = assert.rejects(choosing);
    access.enabled.delete("files");
    access.emit();
    access.enabled.add("files");
    access.emit();
    choice.resolve(selected);
    await rejected;
    picker = async () => selected;
    assert.ok((await call("choose-folder") as CompanionFolderScope).id);
  } finally {
    ipc.dispose();
    tools.stop();
    downloads.stop();
    await rm(directory, { recursive: true, force: true });
  }
});

test("文件库停用拒绝私有快照、定位和旧 AI 草稿，并取消正在生成的建议", async () => {
  const directory = await mkdtemp(join(tmpdir(), "companion-tool-library-"));
  const root = join(directory, "资料");
  await mkdir(root);
  await writeFile(join(root, "课件.txt"), "原文件不变");
  const library = new CompanionFileLibrary(directory);
  const snapshot = await library.addRoot(root);
  const files = new CompanionFilesService({ journalDirectory: join(directory, "operations") });
  const access = pluginAccess();
  type Handler = Parameters<Parameters<typeof installControlCenterFileLibraryIpcHandlers>[0]["registerHandle"]>[1];
  const handlers = new Map<string, Handler>();
  const response = { type: "text" as const, text: JSON.stringify({ items: [{ entryId: snapshot.entries[0].id, category: "生活" }], summary: "分类建议" }) };
  let pending: ReturnType<typeof deferred<typeof response>> | undefined;
  const modelBegan = deferred<void>();
  let revealed = 0;
  const classification = new CompanionFileClassification({
    getProfiles: () => [{ id: "test-model" }],
    createModel: () => ({ generate: () => {
      if (pending) {
        modelBegan.resolve();
        return pending.promise;
      }
      return response;
    } }),
  });
  const ipc = installControlCenterFileLibraryIpcHandlers({
    registerHandle: (name, handler) => handlers.set(name, handler), authorizeSender: () => undefined,
    assertAccess: () => access.assert("files"), subscribeAccess: (listener) => access.subscribe(listener),
    library, files, getClassification: () => classification,
    getProfiles: async () => [{ id: "test-model", label: "测试模型" }],
    pickFolder: async () => root, reveal: () => { revealed++; }, rememberPlan: () => undefined,
  });
  const call = (name: string, ...args: unknown[]) => handlers.get(`openpets:companion-library-${name}`)!({ sender: { id: 1 } }, ...args);
  try {
    await assert.rejects(call("snapshot"));
    await assert.rejects(call("search", "课件"));
    await assert.rejects(call("reveal", snapshot.entries[0].id));
    assert.equal(revealed, 0);
    access.enabled.add("files");
    const preview = await call("ai-preview", snapshot.roots[0].id) as CompanionFileLibraryAiPreview;
    const draft = await call("ai-generate", preview.id, "test-model") as CompanionFileLibraryAiDraft;
    access.enabled.delete("files");
    access.emit();
    access.enabled.add("files");
    access.emit();
    await assert.rejects(call("ai-apply", draft.id));
    await assert.rejects(call("ai-generate", preview.id, "test-model"));
    const next = await call("ai-preview", snapshot.roots[0].id) as CompanionFileLibraryAiPreview;
    pending = deferred<typeof response>();
    const generating = call("ai-generate", next.id, "test-model");
    const rejected = assert.rejects(generating);
    await modelBegan.promise;
    access.enabled.delete("files");
    access.emit();
    await rejected;
    pending.resolve(response);
    assert.equal(library.getSnapshot().entries[0].category, snapshot.entries[0].category);
    assert.equal(await readFile(join(root, "课件.txt"), "utf8"), "原文件不变");
  } finally {
    ipc.dispose();
    await rm(directory, { recursive: true, force: true });
  }
});

test("电脑插件不可用时不采样，停用清定时器并保留监测偏好", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "companion-tool-monitor-"));
  t.mock.timers.enable({ apis: ["setInterval"] });
  let available = false;
  let collected = 0;
  const statePath = join(directory, "tools.json");
  const tools = new CompanionToolsService({
    statePath, isAvailable: () => available,
    collect: async () => { collected++; return sample(); }, notify: () => false,
  });
  try {
    tools.setMonitoring(true);
    t.mock.timers.tick(10 * 60_000);
    await tools.refresh();
    assert.equal(collected, 0);
    available = true;
    tools.start();
    await tools.refresh();
    assert.equal(collected, 1);
    available = false;
    tools.stop();
    t.mock.timers.tick(10 * 60_000);
    await tools.refresh();
    assert.equal(collected, 1);
    assert.equal(JSON.parse(await readFile(statePath, "utf8")).settings.monitorEnabled, true);
    available = true;
    tools.start();
    await tools.refresh();
    assert.equal(collected, 2);
  } finally {
    tools.stop();
    await rm(directory, { recursive: true, force: true });
  }
});

test("停用电脑插件不读取下载目录，取消迟到检查，重新启用先建立基线", async () => {
  const directory = await mkdtemp(join(tmpdir(), "companion-tool-downloads-"));
  const folder = join(directory, "downloads");
  const movedFolder = join(directory, "paused-downloads");
  const statePath = join(directory, "downloads.json");
  await mkdir(folder);
  let available = false;
  let now = Date.now();
  let inspected = 0;
  let notified = 0;
  let inspectionSignal: AbortSignal | undefined;
  const began = deferred<void>();
  const pending = deferred<CompanionInstallerEvidence>();
  const evidence: CompanionInstallerEvidence = {
    checkedAt: now, fileName: "candidate.exe", sizeBytes: 4, sha256: "a".repeat(64),
    signatureStatus: "NotSigned", signer: null, productName: null, fileVersion: null,
    productVersion: null, publisher: null, fileDescription: null, zoneId: null, sourceHost: null,
    clues: ["未取得有效签名，需要核对来源。"], conclusion: "捆绑情况待用户核对。",
  };
  const downloads = new CompanionDownloadsService({
    statePath, isAvailable: () => available, now: () => now,
    inspect: async (_path, signal) => {
      inspected++;
      if (inspected === 1) {
        inspectionSignal = signal;
        began.resolve();
        return pending.promise;
      }
      return evidence;
    },
    notify: () => { notified++; return true; },
  });
  try {
    await downloads.chooseFolder(folder);
    await downloads.setEnabled(true);
    await writeFile(join(folder, "existing.exe"), "data");
    downloads.start();
    await rename(folder, movedFolder);
    assert.equal((await downloads.refresh()).lastError, null);
    assert.equal(inspected, 0);
    await rename(movedFolder, folder);
    available = true;
    downloads.start();
    await downloads.refresh();
    await writeFile(join(folder, "candidate.exe"), "data");
    await downloads.refresh();
    now += 10_000;
    const inspecting = downloads.refresh();
    await began.promise;
    available = false;
    downloads.stop();
    assert.equal(inspectionSignal?.aborted, true);
    pending.resolve(evidence);
    assert.equal((await inspecting).items.length, 0);
    assert.equal(notified, 0);
    const saved = JSON.parse(await readFile(statePath, "utf8"));
    assert.equal(saved.enabled, true);
    assert.equal(saved.folderPath, folder);
    await writeFile(join(folder, "paused.msi"), "data");
    now += 60_000;
    await downloads.refresh();
    assert.equal(inspected, 1);
    available = true;
    downloads.start();
    await downloads.refresh();
    now += 10_000;
    await downloads.refresh();
    assert.equal(inspected, 1);
    await writeFile(join(folder, "resumed.exe"), "data");
    await downloads.refresh();
    now += 10_000;
    assert.equal((await downloads.refresh()).items.length, 1);
    assert.equal(inspected, 2);
    assert.equal(notified, 1);
  } finally {
    downloads.stop();
    await rm(directory, { recursive: true, force: true });
  }
});
