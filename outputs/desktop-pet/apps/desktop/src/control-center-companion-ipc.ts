import { randomUUID } from "node:crypto";
import { lstat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { resolveCompanionScopedPath } from "./companion-files.js";
export { resolveCompanionScopedPath } from "./companion-files.js";
import type { CompanionToolsService } from "./companion-tools.js";
import type { CompanionFilesService } from "./companion-files.js";
import type { CompanionCursorWindowSnapshot } from "./companion-diagnostics-types.js";
import type { CompanionDownloadsService } from "./companion-downloads.js";
import type { CompanionInstallerEvidence } from "./companion-software-types.js";
import type { CompanionToolPluginKind } from "./companion-tool-plugins.js";

type Event = { readonly sender: { readonly id: number } };
type Handler = (event: Event, ...args: unknown[]) => Promise<unknown>;
export interface CompanionIpcLifecycle {
  cancelForSender(senderId: number): void;
  dispose(): void;
  rememberFilePlan(id: string, senderId: number): void;
  revokeAccess(kind: CompanionToolPluginKind): void;
}
const readableExtensions = new Set([".txt", ".md", ".pdf", ".docx", ".xlsx", ".pptx", ".csv", ".rtf", ".odt", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg", ".mp4", ".mkv", ".mov", ".avi", ".webm"]);
function text(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 32_000 || value.includes("\0")) throw new Error("请求参数无效。");
  return value;
}
/** 所有路径授权和执行计划归主进程持有；渲染器只提供范围和计划 ID。 */
export function installControlCenterCompanionIpcHandlers(deps: {
  registerHandle: (channel: string, handler: Handler) => void;
  authorizeSender: (event: Event) => void;
  assertToolAccess: (kind: CompanionToolPluginKind) => void;
  subscribeToolAccess?: (listener: () => void) => () => void;
  tools: CompanionToolsService;
  downloads: Pick<CompanionDownloadsService, "getSnapshot" | "chooseFolder" | "setEnabled" | "refresh" | "setDisposition" | "resetIgnored">;
  files: CompanionFilesService;
  inspectInstaller: (path: string, signal?: AbortSignal) => Promise<CompanionInstallerEvidence>;
  pickInstaller: (senderId: number) => Promise<string | null>;
  pickDownloadsFolder: (senderId: number) => Promise<string | null>;
  captureWindow: () => Promise<CompanionCursorWindowSnapshot>;
  pickFolder: (senderId: number) => Promise<string | null>;
  pickFiles: (senderId: number) => Promise<string[] | null>;
  reveal: (path: string) => void;
  open: (path: string) => Promise<string>;
  openSystem: (uri: string) => Promise<void>;
  copy: (report: string) => void;
  cancelLibraryTask?: (senderId: number) => boolean;
}): CompanionIpcLifecycle {
  const scopes = new Map<string, { senderId: number; path: string }>();
  const plans = new Map<string, number>();
  const generations = new Map<number, number>();
  let task: { senderId: number; controller: AbortController } | null = null;
  let softwareTask: { senderId: number; controller: AbortController } | null = null;
  let disposed = false;
  const accessGenerations = { files: 0, computer: 0 };
  const fileMethods = new Set([
    "choose-folder", "analyze", "search", "preview-organize", "preview-copy", "execute-plan",
    "history", "undo", "cancel", "reveal", "open",
  ]);
  const handle = (method: string, callback: Handler) => deps.registerHandle(`openpets:companion-${method}`, async (event, ...args) => {
    deps.authorizeSender(event);
    if (disposed) throw new Error("电脑助手已退出。");
    const kind = fileMethods.has(method) ? "files" : "computer";
    deps.assertToolAccess(kind);
    const generation = accessGenerations[kind];
    const result = await callback(event, ...args);
    deps.assertToolAccess(kind);
    if (generation !== accessGenerations[kind]) throw new Error("插件访问已撤销，请重新操作。");
    return result;
  });
  const scope = (event: Event, id: unknown) => {
    const selected = scopes.get(text(id));
    if (!selected || selected.senderId !== event.sender.id) throw new Error("目录授权已失效，请重新选择文件夹。");
    return selected.path;
  };
  async function runFile<T>(event: Event, action: (signal: AbortSignal) => Promise<T>): Promise<T> {
    if (task) throw new Error("已有文件任务正在进行，请等待或取消。");
    const current = { senderId: event.sender.id, controller: new AbortController() };
    task = current;
    try {
      return await action(current.controller.signal);
    }
    finally { if (task === current) task = null; }
  }
  async function runSoftware<T>(event: Event, action: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
    if (softwareTask) throw new Error("已有软件检查正在进行，请等待或取消。");
    const current = { senderId: event.sender.id, controller: new AbortController() };
    softwareTask = current;
    try {
      return await action(current.controller.signal);
    } catch (error) {
      if (current.controller.signal.aborted) return null;
      throw error;
    } finally {
      if (softwareTask === current) softwareTask = null;
    }
  }
  function rememberPlan(id: string, owner: number): void {
    plans.set(id, owner);
    if (plans.size > 32) plans.delete(plans.keys().next().value!);
  }
  const cancelForSender = (senderId: number) => {
    generations.set(senderId, (generations.get(senderId) ?? 0) + 1);
    if (task?.senderId === senderId) task.controller.abort();
    if (softwareTask?.senderId === senderId) softwareTask.controller.abort();
    for (const [id, selected] of scopes) if (selected.senderId === senderId) scopes.delete(id);
    for (const [id, owner] of plans) if (owner === senderId) plans.delete(id);
  };
  function revokeAccess(kind: CompanionToolPluginKind): void {
    accessGenerations[kind]++;
    if (kind === "files") {
      task?.controller.abort();
      scopes.clear();
      plans.clear();
      for (const [senderId, generation] of generations) generations.set(senderId, generation + 1);
    } else {
      softwareTask?.controller.abort();
    }
  }
  const unsubscribe = deps.subscribeToolAccess?.(() => {
    for (const kind of ["files", "computer"] as const) {
      try {
        deps.assertToolAccess(kind);
      } catch {
        // 任何不能证明权限有效的状态都撤销本轮临时授权。
        revokeAccess(kind);
      }
    }
  });
  handle("snapshot", async () => deps.tools.getSnapshot());
  handle("refresh", async () => deps.tools.refresh());
  handle("monitor", async (_event, enabled) => {
    if (typeof enabled !== "boolean") throw new Error("监测开关无效。");
    return deps.tools.setMonitoring(enabled);
  });
  handle("disposition", async (_event, id, action) => {
    if (action !== "ignore" && action !== "later") throw new Error("提醒处理方式无效。");
    return deps.tools.setFindingDisposition(text(id), action);
  });
  handle("restore", async () => deps.tools.resetIgnoredFindings());
  handle("installer", async (event) => runSoftware(event, async (signal) => {
    const selected = await deps.pickInstaller(event.sender.id);
    if (!selected || signal.aborted) return null;
    const evidence = await deps.inspectInstaller(selected, signal);
    return signal.aborted ? null : evidence;
  }));
  handle("cancel-software", async (event) => {
    const ownTask = softwareTask?.senderId === event.sender.id ? softwareTask : null;
    ownTask?.controller.abort();
    return { cancelled: ownTask !== null };
  });
  handle("downloads-snapshot", async () => deps.downloads.getSnapshot());
  handle("downloads-choose", async (event) => runSoftware(event, async (signal) => {
    const selected = await deps.pickDownloadsFolder(event.sender.id);
    if (!selected || signal.aborted) return null;
    return deps.downloads.chooseFolder(selected, signal);
  }));
  handle("downloads-monitor", async (_event, enabled) => {
    if (typeof enabled !== "boolean") throw new Error("下载提醒开关无效。");
    return deps.downloads.setEnabled(enabled);
  });
  handle("downloads-refresh", async () => deps.downloads.refresh());
  handle("downloads-disposition", async (_event, id, action) => {
    if (action !== "ignore" && action !== "later") throw new Error("下载提醒处理方式无效。");
    return deps.downloads.setDisposition(text(id), action);
  });
  handle("downloads-restore", async () => deps.downloads.resetIgnored());
  handle("uninstall-check", async (event, id) => {
    const recordId = text(id);
    const result = await runSoftware(event, (signal) => deps.tools.checkUninstallDirectory(recordId, signal));
    return result ?? deps.tools.getSnapshot();
  });
  handle("window", async () => deps.captureWindow());
  handle("choose-folder", async (event) => {
    const generation = generations.get(event.sender.id) ?? 0;
    generations.set(event.sender.id, generation);
    const selected = await deps.pickFolder(event.sender.id);
    if ((generations.get(event.sender.id) ?? 0) !== generation) throw new Error("控制中心已关闭，请重新选择文件夹。");
    if (!selected) return null;
    const id = randomUUID();
    const path = await resolveCompanionScopedPath(resolve(selected), selected);
    if (!(await lstat(path)).isDirectory()) throw new Error("所选位置必须是文件夹。");
    if ((generations.get(event.sender.id) ?? 0) !== generation) throw new Error("控制中心已关闭，请重新选择文件夹。");
    scopes.set(id, { senderId: event.sender.id, path });
    const owned = [...scopes].filter(([, item]) => item.senderId === event.sender.id);
    for (const [oldId] of owned.slice(0, Math.max(0, owned.length - 8))) scopes.delete(oldId);
    return { id, path };
  });
  handle("analyze", async (event, id) => runFile(event, (signal) => deps.files.analyzeDirectory(scope(event, id), { signal })));
  handle("search", async (event, id, query) => runFile(event, (signal) => deps.files.searchNames(scope(event, id), text(query), { signal })));
  handle("preview-organize", async (event, id) => runFile(event, async (signal) => {
    const plan = await deps.files.createOrganizePlan(scope(event, id));
    if (signal.aborted) throw new Error("预览已取消，请重新预览。");
    rememberPlan(plan.id, event.sender.id);
    return plan;
  }));
  handle("preview-copy", async (event, id) => runFile(event, async (signal) => {
    const target = scope(event, id);
    const selected = await deps.pickFiles(event.sender.id);
    if (!selected || signal.aborted) return null;
    const plan = await deps.files.createCopyPlan(selected, target);
    if (signal.aborted) return null;
    rememberPlan(plan.id, event.sender.id);
    return plan;
  }));
  handle("execute-plan", async (event, id) => {
    const planId = text(id);
    if (plans.get(planId) !== event.sender.id) throw new Error("没有这份执行计划的授权，请重新预览。");
    return runFile(event, async (signal) => {
      plans.delete(planId);
      return deps.files.executePlan(planId, { signal });
    });
  });
  handle("history", async () => deps.files.listHistory());
  handle("undo", async (event, id) => runFile(event, (signal) => deps.files.undoOperation(text(id), { signal })));
  handle("cancel", async (event) => {
    const cancelled = task?.senderId === event.sender.id;
    if (cancelled) task!.controller.abort();
    const libraryCancelled = deps.cancelLibraryTask?.(event.sender.id) ?? false;
    return { cancelled: cancelled || libraryCancelled };
  });
  handle("reveal", async (event, id, path) => {
    const target = await resolveCompanionScopedPath(scope(event, id), text(path));
    deps.assertToolAccess("files");
    scope(event, id);
    deps.reveal(target);
  });
  handle("open", async (event, id, path) => {
    const target = await resolveCompanionScopedPath(scope(event, id), text(path));
    if (!readableExtensions.has(extname(target).toLowerCase()) || !(await lstat(target)).isFile()) throw new Error("此类型仅支持定位，请在系统中自行选择打开方式。");
    deps.assertToolAccess("files");
    scope(event, id);
    const error = await deps.open(target);
    if (error) throw new Error(error);
  });
  handle("system", async (_event, page) => {
    const pages = { startup: "ms-settings:startupapps", storage: "ms-settings:storagesense", apps: "ms-settings:appsfeatures", security: "ms-settings:windowsdefender" };
    if (typeof page !== "string" || !Object.hasOwn(pages, page)) throw new Error("系统设置页面无效。");
    if (process.platform !== "win32") throw new Error("此入口目前支持 Windows。");
    await deps.openSystem(pages[page as keyof typeof pages]);
  });
  handle("copy-report", async () => {
    const snapshot = deps.tools.getSnapshot();
    if (!snapshot.diagnostics) throw new Error("请先进行电脑体检。");
    const data = snapshot.diagnostics;
    const report = ["桌宠电脑体检摘要", `采样时间：${new Date(data.sampledAt).toISOString()}`, `CPU：${data.cpuPercent === null ? "读取受限" : `${data.cpuPercent.toFixed(1)}%`}；内存：${data.memory ? `${data.memory.usedPercent.toFixed(1)}%` : "读取受限"}`,
      ...data.disks.map((disk) => `${disk.name} 剩余 ${(disk.freeBytes / 1024 ** 3).toFixed(1)} GB（${(100 - disk.usedPercent).toFixed(1)}%）`),
      ...snapshot.findings.map((finding) => `${finding.title}：${finding.evidence} ${finding.explanation}`),
      ...data.collectionIssues, "此摘要未包含窗口标题、进程路径、自启命令和所选文件夹路径。一次短采样不能确认持续故障。"];
    deps.copy(report.join("\n"));
    return { copied: true };
  });
  return {
    cancelForSender,
    revokeAccess,
    rememberFilePlan: rememberPlan,
    dispose: () => {
      disposed = true;
      unsubscribe?.();
      task?.controller.abort();
      softwareTask?.controller.abort();
      scopes.clear();
      plans.clear();
    },
  };
}
