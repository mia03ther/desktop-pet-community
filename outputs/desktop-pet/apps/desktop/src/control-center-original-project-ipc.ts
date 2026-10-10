import { randomUUID } from "node:crypto";
import { inspectOriginalProject, OriginalProjectStore, type InspectedOriginalProject } from "./original-projects.js";
import type { OriginalProjectKind } from "./original-project-types.js";
import type { OriginalProjectRunTarget } from "./original-project-execution.js";

type Event = { readonly sender: { readonly id: number } };
type Channel = "openpets:project-inspect" | "openpets:project-import" | "openpets:project-discard" | "openpets:projects-list" | "openpets:project-open-folder" | "openpets:project-choose-app" | "openpets:project-open-app" | "openpets:project-choose-entry" | "openpets:project-choose-java" | "openpets:project-run-standalone" | "openpets:project-convert-poses" | "openpets:project-remove";

export interface OriginalProjectIpcDependencies {
  readonly registerHandle: (channel: Channel, handler: (event: Event, ...args: unknown[]) => unknown | Promise<unknown>) => void;
  readonly authorizeSender: (event: Event) => void;
  readonly isCurrentSender: (event: Event) => boolean;
  readonly chooseSource: (event: Event, kind: OriginalProjectKind) => Promise<string | null>;
  readonly chooseApplication: (event: Event) => Promise<string | null>;
  readonly chooseEntry: (event: Event, directory: string) => Promise<string | null>;
  readonly chooseJava: (event: Event) => Promise<string | null>;
  readonly launchExecutable: (target: OriginalProjectRunTarget, canLaunch: () => boolean) => Promise<number>;
  readonly openPath: (path: string) => Promise<void>;
  readonly store: OriginalProjectStore;
  readonly installNativePet: (path: string) => Promise<unknown>;
  readonly installNativePlugin: (path: string) => Promise<{ readonly ok: boolean; readonly canceled?: boolean; readonly error?: string }>;
  readonly convertShimeji: (path: string) => Promise<unknown>;
  readonly onNativeChanged: () => void;
}

/** 原生选择凭证归发送窗口所有；渲染器不能提交任意路径或命令。 */
export function installControlCenterOriginalProjectIpcHandlers(dependencies: OriginalProjectIpcDependencies): {
  cancelForSender(senderId: number): void;
  dispose(): void;
} {
  const selections = new Map<number, { readonly id: string; readonly project: InspectedOriginalProject }>();
  const operations = new Map<number, object>();
  const { registerHandle, authorizeSender, isCurrentSender, store } = dependencies;

  registerHandle("openpets:project-inspect", async (event, input) => {
    authorizeSender(event);
    if (input !== "pet" && input !== "plugin") throw new Error("项目类型无效。");
    if (operations.has(event.sender.id)) throw new Error("请等待当前项目操作完成。");
    selections.delete(event.sender.id);
    const operation = {};
    operations.set(event.sender.id, operation);
    try {
      const source = await dependencies.chooseSource(event, input);
      if (!source || !isCurrentSender(event) || operations.get(event.sender.id) !== operation) return null;
      const project = await inspectOriginalProject(source, input);
      if (!isCurrentSender(event) || operations.get(event.sender.id) !== operation) return null;
      const id = randomUUID();
      selections.set(event.sender.id, { id, project });
      return { selectionId: id, displayName: project.displayName, report: project.report };
    } finally {
      if (operations.get(event.sender.id) === operation) operations.delete(event.sender.id);
    }
  });

  registerHandle("openpets:project-import", async (event, id) => {
    authorizeSender(event);
    const selection = selections.get(event.sender.id);
    if (typeof id !== "string" || selection?.id !== id) throw new Error("请重新检测要导入的项目。");
    if (operations.has(event.sender.id)) throw new Error("请等待当前项目操作完成。");
    const operation = {};
    operations.set(event.sender.id, operation);
    try {
      if (!isCurrentSender(event)) return null;
      let project = await store.archive(selection.project);
      let nativeInstalled = false;
      if (project.report.status === "native" && isCurrentSender(event) && operations.get(event.sender.id) === operation) {
        const directory = await store.directory(project.id);
        if (project.kind === "pet") {
          await dependencies.installNativePet(directory);
          nativeInstalled = true;
        } else {
          const result = await dependencies.installNativePlugin(directory);
          if (!result.ok) throw new Error(result.error ?? "原生插件未能安装；原项目仍已完整保留。");
          if (result.canceled) return null;
          nativeInstalled = true;
        }
        project = await store.setNativeInstalled(project.id);
        dependencies.onNativeChanged();
      }
      selections.delete(event.sender.id);
      return isCurrentSender(event) ? { project, nativeInstalled } : null;
    } finally {
      if (operations.get(event.sender.id) === operation) operations.delete(event.sender.id);
    }
  });

  registerHandle("openpets:project-discard", (event, id) => {
    authorizeSender(event);
    if (selections.get(event.sender.id)?.id === id) selections.delete(event.sender.id);
  });
  registerHandle("openpets:projects-list", async (event) => {
    authorizeSender(event);
    return { projects: await store.list() };
  });
  registerHandle("openpets:project-open-folder", async (event, id) => {
    authorizeSender(event);
    await dependencies.openPath(await store.directory(parseId(id)));
  });
  registerHandle("openpets:project-choose-app", async (event, id) => {
    authorizeSender(event);
    const projectId = parseId(id);
    await store.get(projectId);
    const application = await dependencies.chooseApplication(event);
    if (application && isCurrentSender(event)) await store.setApplication(projectId, application);
  });
  registerHandle("openpets:project-open-app", async (event, id) => {
    authorizeSender(event);
    const { applicationPath } = await store.application(parseId(id));
    // 只打开用户另行选定的应用，不执行工程清单中的命令，也不声称项目已加载。
    await dependencies.openPath(applicationPath);
  });
  registerHandle("openpets:project-choose-entry", async (event, id) => {
    authorizeSender(event);
    const projectId = parseId(id);
    const entry = await dependencies.chooseEntry(event, await store.directory(projectId));
    if (entry && isCurrentSender(event)) await store.setEntry(projectId, entry);
  });
  registerHandle("openpets:project-choose-java", async (event, id) => {
    authorizeSender(event);
    const projectId = parseId(id);
    const project = await store.get(projectId);
    if (!project.report.operations.chooseJava.supported) throw new Error("此项目没有 Java 独立入口。");
    const java = await dependencies.chooseJava(event);
    if (java && isCurrentSender(event)) await store.setJava(projectId, java);
  });
  registerHandle("openpets:project-run-standalone", async (event, id) => {
    authorizeSender(event);
    if (operations.has(event.sender.id)) throw new Error("请等待当前项目操作完成。");
    const operation = {};
    operations.set(event.sender.id, operation);
    try {
      const target = await store.standaloneTarget(parseId(id));
      if (!isCurrentSender(event) || operations.get(event.sender.id) !== operation) throw new Error("控制中心已经关闭，未启动原程序。");
      const pid = await dependencies.launchExecutable(target, () => isCurrentSender(event) && operations.get(event.sender.id) === operation);
      const projectStarted = target.mode === "project-program";
      return {
        mode: target.mode,
        projectStarted,
        pid,
        message: projectStarted
          ? "已请求独立启动项目程序。运行和退出由原程序管理，实际功能以原程序为准。"
          : "已打开原应用，尚未加载此项目。请按原项目说明在原应用中导入保留目录。",
      };
    } finally {
      if (operations.get(event.sender.id) === operation) operations.delete(event.sender.id);
    }
  });
  registerHandle("openpets:project-convert-poses", async (event, id) => {
    authorizeSender(event);
    const projectId = parseId(id);
    const project = await store.get(projectId);
    if (project.report.format !== "shimeji" || project.kind !== "pet") throw new Error("此项目不支持独立姿势转换。");
    await dependencies.convertShimeji(await store.directory(projectId));
    await store.setConvertedCopyInstalled(projectId);
    dependencies.onNativeChanged();
  });
  registerHandle("openpets:project-remove", async (event, id) => {
    authorizeSender(event);
    await store.remove(parseId(id));
  });

  return {
    cancelForSender(senderId) {
      selections.delete(senderId);
      operations.delete(senderId);
    },
    dispose() {
      selections.clear();
      operations.clear();
    },
  };
}

function parseId(value: unknown): string {
  if (typeof value !== "string") throw new Error("原项目编号无效。");
  return value;
}
