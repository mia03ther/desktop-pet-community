import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { CompanionFilesService } from "../src/companion-files.js";
import { CompanionToolsService } from "../src/companion-tools.js";
import { CompanionDownloadsService } from "../src/companion-downloads.js";
import { installControlCenterCompanionIpcHandlers } from "../src/control-center-companion-ipc.js";
import type { CompanionFolderScope } from "../src/companion-tools-types.js";
import type { CompanionFileOperation, CompanionFilePlan, CompanionFileScan } from "../src/companion-files-types.js";
import type { CompanionDiagnosticsSnapshot } from "../src/companion-diagnostics-types.js";

type Dependencies = Parameters<typeof installControlCenterCompanionIpcHandlers>[0];
type Handler = Parameters<Dependencies["registerHandle"]>[1];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

const fixture = await fs.mkdtemp(path.join(process.env.OPENPETS_FILES_TEST_DIR ?? process.cwd(), "openpets-companion-ipc-test-"));
const userData = path.join(fixture, "userdata");
const root = path.join(fixture, "selected");
const outside = path.join(fixture, "outside");
await fs.mkdir(userData);
await fs.mkdir(root);
await fs.mkdir(outside);
await fs.writeFile(path.join(root, "notes.txt"), "桌宠整理夹具");
await fs.writeFile(path.join(root, "program.exe"), "不执行的测试数据");
await fs.writeFile(path.join(outside, "outside.txt"), "范围外数据");
await fs.symlink(outside, path.join(root, "outside-link"), process.platform === "win32" ? "junction" : "dir");

const diagnostics: CompanionDiagnosticsSnapshot = {
  version: 1, sampledAt: Date.now(), sampleDurationMs: 1000, cpuPercent: 10, memory: null,
  disks: [], processes: [], startupItems: [], installedApps: [], installedAppsComplete: true,
  windows: [], collectionIssues: [], coverage: ["仅为测试夹具"], findings: [],
};
const tools = new CompanionToolsService({ statePath: path.join(userData, "tools.json"), collect: async () => diagnostics, notify: () => false });
const downloads = new CompanionDownloadsService({
  statePath: path.join(userData, "downloads.json"),
  inspect: async () => { throw new Error("此文件范围夹具不检查安装程序。"); },
  notify: () => false,
});
const files = new CompanionFilesService({ journalDirectory: path.join(userData, "operations") });
const handlers = new Map<string, Handler>();
const unauthorized = new Error("测试发送方未授权");
const allowedSenders = new Set([1, 2]);
const effects: string[] = [];
let pickFolder: Dependencies["pickFolder"] = async () => root;
let pickFiles: Dependencies["pickFiles"] = async () => [path.join(outside, "outside.txt")];
const lifecycle = installControlCenterCompanionIpcHandlers({
  assertToolAccess: () => undefined,
  registerHandle: (channel, handler) => handlers.set(channel, handler),
  authorizeSender: (event) => {
    if (!allowedSenders.has(event.sender.id)) throw unauthorized;
  },
  tools,
  downloads,
  files,
  inspectInstaller: async () => { throw new Error("此文件范围夹具不检查安装程序。"); },
  pickInstaller: async () => { effects.push("installer-picker"); return null; },
  pickDownloadsFolder: async () => { effects.push("downloads-picker"); return null; },
  captureWindow: async () => {
    effects.push("window");
    return { version: 1, sampledAt: Date.now(), window: null, note: "测试不采集真实窗口。" };
  },
  pickFolder: (senderId) => { effects.push("folder-picker"); return pickFolder(senderId); },
  pickFiles: (senderId) => { effects.push("file-picker"); return pickFiles(senderId); },
  reveal: (target) => { effects.push(`reveal:${target}`); },
  open: async (target) => { effects.push(`open:${target}`); return ""; },
  openSystem: async (uri) => { effects.push(`system:${uri}`); },
  copy: (report) => { effects.push(`copy:${report}`); },
});

async function invoke<T = unknown>(method: string, senderId: number, ...args: unknown[]): Promise<T> {
  const handler = handlers.get(`openpets:companion-${method}`);
  assert.ok(handler, `缺少 ${method} 请求入口`);
  return await handler({ sender: { id: senderId } }, ...args) as T;
}

async function choose(senderId = 1): Promise<CompanionFolderScope> {
  const scope = await invoke<CompanionFolderScope | null>("choose-folder", senderId);
  assert.ok(scope, "原生选择返回夹具目录后应得到范围授权");
  return scope;
}

try {
  // 所有入口必须在参数处理和任何系统／文件副作用前检查发送方授权。
  for (const handler of handlers.values()) {
    await assert.rejects(handler({ sender: { id: 99 } }), (failure: unknown) => failure === unauthorized);
  }
  assert.equal(effects.length, 0, "未授权请求不能打开选择器、系统页、文件或窗口采集");

  // 范围只来自原生选择器且绑定发送方，不能把绝对路径直接当作范围编号。
  const scope = await choose();
  await assert.rejects(invoke("analyze", 2, scope.id));
  await assert.rejects(invoke("analyze", 1, root));
  const scan = await invoke<CompanionFileScan>("analyze", 1, scope.id);
  assert.equal(scan.root, root);
  assert.equal(scan.skippedLinks, 1);
  assert.equal(scan.largestFiles.some((item) => item.path === path.join(outside, "outside.txt")), false);
  const search = await invoke<{ matches: Array<{ path: string }> }>("search", 1, scope.id, "notes");
  assert.deepEqual(search.matches.map((item) => item.path), [path.join(root, "notes.txt")]);

  // 定位／打开只能在当前所选范围内；联接、程序和目录都不能通过查看入口打开。
  const effectsBeforeForbiddenOpen = effects.length;
  await assert.rejects(invoke("reveal", 1, scope.id, path.join(outside, "outside.txt")));
  await assert.rejects(invoke("reveal", 1, scope.id, path.join(root, "outside-link", "outside.txt")));
  await assert.rejects(invoke("open", 1, scope.id, path.join(root, "program.exe")));
  await assert.rejects(invoke("open", 1, scope.id, root));
  assert.equal(effects.length, effectsBeforeForbiddenOpen, "非法路径不能送入系统打开／定位函数");
  await invoke("reveal", 1, scope.id, path.join(root, "notes.txt"));
  await invoke("open", 1, scope.id, path.join(root, "notes.txt"));
  assert.equal(effects.includes(`reveal:${path.join(root, "notes.txt")}`), true);
  assert.equal(effects.includes(`open:${path.join(root, "notes.txt")}`), true);

  // 主进程计划只能归原发送方执行；真实整理后记录可查询，撤销实际恢复文件。
  const organize = await invoke<CompanionFilePlan>("preview-organize", 1, scope.id);
  assert.equal(await fs.readFile(path.join(root, "notes.txt"), "utf8"), "桌宠整理夹具");
  await assert.rejects(invoke("execute-plan", 2, organize.id));
  await assert.rejects(invoke("execute-plan", 1, { id: organize.id, destination: outside }));
  const operation = await invoke<CompanionFileOperation>("execute-plan", 1, organize.id);
  assert.equal(operation.status, "completed");
  assert.equal(await fs.readFile(path.join(root, "文档", "notes.txt"), "utf8"), "桌宠整理夹具");
  await assert.rejects(fs.lstat(path.join(root, "notes.txt")));
  await assert.rejects(invoke("execute-plan", 1, organize.id), "已执行计划不能再次执行");
  const history = await invoke<CompanionFileOperation[]>("history", 1);
  assert.equal(history.some((item) => item.id === operation.id), true);
  const restored = await invoke<CompanionFileOperation>("undo", 1, operation.id);
  assert.equal(restored.status, "undone");
  assert.equal(await fs.readFile(path.join(root, "notes.txt"), "utf8"), "桌宠整理夹具");
  await assert.rejects(fs.lstat(path.join(root, "文档", "notes.txt")));

  // 原生文件选择得到的范围外源只可用于明确的收纳复制，副本撤销不动源文件。
  const copyPlan = await invoke<CompanionFilePlan>("preview-copy", 1, scope.id);
  assert.equal(copyPlan.kind, "copy");
  const copied = await invoke<CompanionFileOperation>("execute-plan", 1, copyPlan.id);
  assert.equal(copied.status, "completed");
  assert.equal(await fs.readFile(path.join(root, "outside.txt"), "utf8"), "范围外数据");
  assert.equal(await fs.readFile(path.join(outside, "outside.txt"), "utf8"), "范围外数据");
  assert.equal((await invoke<CompanionFileOperation>("undo", 1, copied.id)).status, "undone");
  await assert.rejects(fs.lstat(path.join(root, "outside.txt")));
  assert.equal(await fs.readFile(path.join(outside, "outside.txt"), "utf8"), "范围外数据");

  // 即使文件服务中存在有效计划，没经过此 IPC 预览授权也不能执行。
  const foreignPlan = await files.createOrganizePlan(root);
  await assert.rejects(invoke("execute-plan", 1, foreignPlan.id));
  const revokedPlan = await invoke<CompanionFilePlan>("preview-organize", 1, scope.id);
  lifecycle.cancelForSender(1);
  await assert.rejects(invoke("analyze", 1, scope.id));
  await assert.rejects(invoke("execute-plan", 1, revokedPlan.id));
  await choose(2);

  // 取消只属于本发送方；等待原生选择器时取消后不会产生计划或复制文件。
  const cancelScope = await choose();
  const pendingFiles = deferred<string[] | null>();
  const enteredFiles = deferred<void>();
  pickFiles = async () => { enteredFiles.resolve(); return pendingFiles.promise; };
  const previewWhilePicking = invoke<CompanionFilePlan | null>("preview-copy", 1, cancelScope.id);
  await enteredFiles.promise;
  assert.deepEqual(await invoke("cancel", 2), { cancelled: false });
  await assert.rejects(invoke("analyze", 2, (await choose(2)).id), "另一个发送方不能并发启动文件任务");
  assert.deepEqual(await invoke("cancel", 1), { cancelled: true });
  pendingFiles.resolve([path.join(outside, "outside.txt")]);
  assert.equal(await previewWhilePicking, null);
  await assert.rejects(fs.lstat(path.join(root, "outside.txt")));
  assert.deepEqual(await invoke("cancel", 1), { cancelled: false });

  // 窗口在原生目录选择器尚未完成时关闭：迟到选择不能重新复活范围授权。
  const pendingFolder = deferred<string | null>();
  const enteredFolder = deferred<void>();
  pickFolder = async () => { enteredFolder.resolve(); return pendingFolder.promise; };
  const folderWhileClosing = invoke<CompanionFolderScope | null>("choose-folder", 1);
  await enteredFolder.promise;
  lifecycle.cancelForSender(1);
  pendingFolder.resolve(root);
  const lateSelection = await folderWhileClosing.catch((failure: unknown) => failure);
  if (lateSelection && typeof lateSelection === "object" && "id" in lateSelection && typeof lateSelection.id === "string") {
    await assert.rejects(invoke("analyze", 1, lateSelection.id), "窗口关闭期间的迟到选择不能获得新范围");
  }
  assert.equal(lateSelection === null || lateSelection instanceof Error, true, "已关闭窗口的迟到选择应取消或拒绝，不应返回新授权");

  // 关闭时等待文件选择器同样使预览失效，已关闭 owner 的 scope 不再可用。
  pickFolder = async () => root;
  const closeCopyScope = await choose();
  const closingFiles = deferred<string[] | null>();
  const enteredClosingFiles = deferred<void>();
  pickFiles = async () => { enteredClosingFiles.resolve(); return closingFiles.promise; };
  const copyWhileClosing = invoke<CompanionFilePlan | null>("preview-copy", 1, closeCopyScope.id);
  await enteredClosingFiles.promise;
  lifecycle.cancelForSender(1);
  closingFiles.resolve([path.join(outside, "outside.txt")]);
  const lateCopy = await copyWhileClosing.catch((failure: unknown) => failure);
  assert.equal(lateCopy === null || lateCopy instanceof Error, true, "窗口关闭后迟到文件选择不能授权执行计划");
  await assert.rejects(invoke("analyze", 1, closeCopyScope.id));

  console.log("电脑／文件助手 IPC 授权、范围隔离、真实操作、持久记录、取消和迟到选择回归测试通过。");
} finally {
  lifecycle.dispose();
  tools.stop();
  downloads.stop();
  // 只清理 mkdtemp 创建的固定测试夹具，包括其中的测试目录联接。
  await fs.rm(fixture, { recursive: true, force: true });
}
