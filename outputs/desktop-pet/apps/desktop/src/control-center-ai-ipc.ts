import { randomUUID } from "node:crypto";
import { validateCompanionManualQuotaInput } from "./companion-ai-monitor.js";
import type { CompanionAiHost } from "./companion-ai-host.js";
import type { CompanionAiTaskPreview } from "./companion-ai-types.js";
import type { CompanionToolsSnapshot } from "./companion-tools-types.js";
import { validateConversationMessageInput } from "./pet-assistant-conversation.js";
import type { PetAssistantConversationController } from "./pet-assistant-conversation.js";
import { validateCompanionPersonaMode, validateCompanionPersonaTextInput } from "./companion-persona.js";
import type { CompanionPersonaMode } from "./companion-persona-types.js";
import { awaitPersonaOperation, validatePersonaDistillationInput } from "./persona-distillation.js";

type Event = { readonly sender: { readonly id: number } };
type Handler = (event: Event, ...args: unknown[]) => Promise<unknown>;
type Host = Pick<CompanionAiHost, "getSnapshot" | "refreshProfiles" | "queryQuota" | "getPersonaEnvironment">
  & Partial<Pick<CompanionAiHost, "setCodexQuotaMonitoring" | "queryExternalQuota">> & {
  persona: Pick<CompanionAiHost["persona"], "getDocument" | "saveText" | "importFile" | "importDirectory" | "scanSkills" | "prepareSkillsDirectory" | "exportFile" | "setEnabled" | "clear">;
  personaDistillation: Pick<CompanionAiHost["personaDistillation"], "generate">;
  tasks: Pick<CompanionAiHost["tasks"], "previewDiagnostics" | "startTask" | "cancelTask">;
  monitor: Pick<CompanionAiHost["monitor"], "setManualQuota" | "clearManualQuota">;
};
type Conversation = Pick<PetAssistantConversationController, "sendTypedMessage" | "cancelTypedTurn">;
type SenderSession = { closed: boolean; selections: Set<AbortController>; distillation?: AbortController };

export interface CompanionAiIpcLifecycle {
  cancelForSender(senderId: number): void;
  dispose(): void;
}

function identifier(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 128 || value.includes("\0")) {
    throw new Error("AI 请求编号无效。");
  }
  return value;
}

/** 预览正文与任务、对话取消归属留在主进程，界面只能引用自己获得的预览编号。 */
export function installControlCenterAiIpcHandlers(deps: {
  registerHandle: (channel: string, handler: Handler) => void;
  authorizeSender: (event: Event) => void;
  getHost: () => Host;
  getConversation: () => Conversation | null;
  getActiveModality: () => "typed" | "voice" | null;
  getToolsSnapshot: () => CompanionToolsSnapshot;
  assertDiagnosticsAccess: () => void;
  subscribeDiagnosticsAccess?: (listener: () => void) => () => void;
  pickPersona: (senderId: number, kind?: "file" | "directory") => Promise<string | null>;
  openPersonaDirectory?: (directory: string) => Promise<void>;
  pickPersonaDestination: (senderId: number) => Promise<string | null>;
  now?: () => number;
}): CompanionAiIpcLifecycle {
  const sessions = new Map<number, SenderSession>();
  const previews = new Map<string, { senderId: number; value: CompanionAiTaskPreview }>();
  const taskOwners = new Map<string, number>();
  let typedOwner: { senderId: number; controller: Conversation } | null = null;
  let disposed = false;
  let diagnosticsGeneration = 0;
  const now = () => deps.now?.() ?? Date.now();
  const unsubscribeDiagnostics = deps.subscribeDiagnosticsAccess?.(() => {
    try { deps.assertDiagnosticsAccess(); }
    catch {
      diagnosticsGeneration += 1;
      previews.clear();
      for (const id of taskOwners.keys()) deps.getHost().tasks.cancelTask(id);
      taskOwners.clear();
    }
  });

  function session(event: Event): SenderSession {
    let current = sessions.get(event.sender.id);
    if (!current) {
      current = { closed: false, selections: new Set() };
      sessions.set(event.sender.id, current);
    }
    return current;
  }
  function assertCurrent(current: SenderSession): void {
    if (disposed || current.closed) throw new Error("控制中心已关闭，请重新打开后操作。");
  }
  const handle = (method: string, callback: Handler) => deps.registerHandle(`openpets:companion-ai-${method}`, async (event, ...args) => {
    deps.authorizeSender(event);
    if (disposed) throw new Error("宠物大脑正在关闭。");
    return callback(event, ...args);
  });
  function prunePreviews(): void {
    for (const [id, preview] of previews) {
      if (preview.value.expiresAt <= now()) previews.delete(id);
    }
    while (previews.size > 32) previews.delete(previews.keys().next().value!);
  }
  function cancelForSender(senderId: number): void {
    const current = sessions.get(senderId);
    if (current) {
      current.closed = true;
      current.distillation?.abort();
      for (const selection of current.selections) selection.abort();
      sessions.delete(senderId);
    }
    if (typedOwner?.senderId === senderId) typedOwner.controller.cancelTypedTurn();
    for (const [id, owner] of taskOwners) {
      if (owner === senderId) {
        deps.getHost().tasks.cancelTask(id);
        taskOwners.delete(id);
      }
    }
    for (const [id, preview] of previews) {
      if (preview.senderId === senderId) previews.delete(id);
    }
  }

  handle("snapshot", async (event) => {
    const snapshot = await deps.getHost().getSnapshot();
    return {
      ...snapshot,
      conversation: {
        ...snapshot.conversation,
        canCancel: typedOwner?.senderId === event.sender.id && snapshot.conversation.activeTurnId !== null,
      },
    };
  });
  handle("send", async (event, value) => {
    const message = validateConversationMessageInput(value);
    const current = session(event);
    if (typedOwner || deps.getActiveModality() !== null) throw new Error("桌宠已有对话正在进行，请等待当前回合结束。");
    const controller = deps.getConversation();
    if (!controller) throw new Error("桌宠对话仍在启动，请稍后重试。");
    const owner = { senderId: event.sender.id, controller };
    typedOwner = owner;
    try {
      const result = await controller.sendTypedMessage(message);
      assertCurrent(current);
      if (result.status === "failed") throw new Error("对话未完成，请检查 AI 来源设置或重试。");
      if (result.status === "cancelled") throw new Error("对话已取消。");
    } finally {
      if (typedOwner === owner) typedOwner = null;
    }
  });
  handle("cancel-message", async (event) => ({
    cancelled: typedOwner?.senderId === event.sender.id ? typedOwner.controller.cancelTypedTurn() : false,
  }));
  handle("preview-diagnostics", async (event, problem) => {
    deps.assertDiagnosticsAccess();
    if (typeof problem !== "string") throw new Error("请描述需要分析的电脑问题。");
    session(event);
    const value = {
      ...deps.getHost().tasks.previewDiagnostics(deps.getToolsSnapshot(), problem),
      id: randomUUID(),
      expiresAt: now() + 5 * 60_000,
    };
    previews.set(value.id, { senderId: event.sender.id, value: structuredClone(value) });
    prunePreviews();
    return structuredClone(value);
  });
  handle("start-task", async (event, previewId, profileIds, leaderId) => {
    deps.assertDiagnosticsAccess();
    const generation = diagnosticsGeneration;
    const id = identifier(previewId);
    if (!Array.isArray(profileIds) || profileIds.length < 1 || profileIds.length > 3) throw new Error("请选择 1 到 3 个 AI 来源。");
    const selected = profileIds.map(identifier);
    const leader = identifier(leaderId);
    const current = session(event);
    const host = deps.getHost();
    await host.refreshProfiles();
    assertCurrent(current);
    deps.assertDiagnosticsAccess();
    if (generation !== diagnosticsGeneration) throw new Error("电脑守护插件状态已变化，请重新预览诊断资料。");
    prunePreviews();
    const preview = previews.get(id);
    if (!preview || preview.senderId !== event.sender.id) throw new Error("诊断预览已失效，请重新预览后确认。");
    const task = host.tasks.startTask(structuredClone(preview.value), selected, leader);
    previews.delete(id);
    taskOwners.set(task.id, event.sender.id);
    while (taskOwners.size > 100) taskOwners.delete(taskOwners.keys().next().value!);
    return task;
  });
  handle("cancel-task", async (event, value) => {
    const id = identifier(value);
    return { cancelled: taskOwners.get(id) === event.sender.id ? deps.getHost().tasks.cancelTask(id) : false };
  });

  async function choosePersona(event: Event, exporting: boolean, mode?: CompanionPersonaMode, kind: "file" | "directory" = "file"): Promise<unknown> {
    const current = session(event);
    if (current.selections.size > 0) throw new Error("另一项人物选择或额度查询正在进行，请等待或关闭控制中心取消。");
    const controller = new AbortController();
    current.selections.add(controller);
    try {
      const selected = await (exporting ? deps.pickPersonaDestination(event.sender.id) : deps.pickPersona(event.sender.id, kind));
      assertCurrent(current);
      if (!selected) return exporting ? { exported: false } : null;
      const persona = deps.getHost().persona;
      const result = exporting ? await persona.exportFile(selected)
        : kind === "directory" ? await persona.importDirectory(selected, { signal: controller.signal, mode })
          : await persona.importFile(selected, { signal: controller.signal, mode });
      assertCurrent(current);
      return result;
    } finally {
      current.selections.delete(controller);
    }
  }
  handle("persona-document", async () => deps.getHost().persona.getDocument());
  handle("persona-save", async (_event, input) => deps.getHost().persona.saveText(validateCompanionPersonaTextInput(input)));
  handle("persona-import", async (event, mode) => choosePersona(event, false,
    mode === undefined ? "global-md" : validateCompanionPersonaMode(mode)));
  handle("persona-import-directory", async (event, mode) => choosePersona(event, false,
    mode === undefined ? "distilled-md" : validateCompanionPersonaMode(mode), "directory"));
  handle("persona-environment", async () => deps.getHost().getPersonaEnvironment());
  handle("persona-skills-scan", async (event, selectedName) => {
    if (selectedName !== undefined && typeof selectedName !== "string") throw new Error("Skill 文件夹名称无效。");
    const current = session(event);
    if (current.selections.size > 0) throw new Error("另一项人物操作正在进行，请等待结束。");
    const controller = new AbortController();
    current.selections.add(controller);
    try {
      const result = await deps.getHost().persona.scanSkills(selectedName, controller.signal);
      assertCurrent(current);
      return result;
    } finally {
      current.selections.delete(controller);
    }
  });
  handle("persona-skills-open", async (event) => {
    const current = session(event);
    const directory = await deps.getHost().persona.prepareSkillsDirectory();
    assertCurrent(current);
    if (!deps.openPersonaDirectory) throw new Error("当前环境无法打开 skills 目录。");
    await deps.openPersonaDirectory(directory);
    return { opened: true };
  });
  handle("persona-export", async (event) => choosePersona(event, true));
  handle("persona-distill", async (event, input) => {
    const normalized = validatePersonaDistillationInput(input);
    const current = session(event);
    if (current.distillation) throw new Error("已有此窗口的人设提炼正在进行，请等待或取消。");
    const controller = new AbortController();
    current.distillation = controller;
    const timer = setTimeout(() => controller.abort(), 120_000);
    try {
      const host = deps.getHost();
      await awaitPersonaOperation(host.refreshProfiles(), controller.signal);
      assertCurrent(current);
      if (controller.signal.aborted) throw new Error("人设提炼已取消。");
      const result = await awaitPersonaOperation(host.personaDistillation.generate(normalized, controller.signal), controller.signal);
      assertCurrent(current);
      if (controller.signal.aborted) throw new Error("人设提炼已取消；草稿未保存。");
      return result;
    } finally {
      clearTimeout(timer);
      if (current.distillation === controller) current.distillation = undefined;
    }
  });
  handle("persona-distill-cancel", async (event) => {
    const active = sessions.get(event.sender.id)?.distillation;
    if (!active) return { cancelled: false };
    active.abort();
    return { cancelled: true };
  });
  handle("persona-enabled", async (_event, enabled) => {
    if (typeof enabled !== "boolean") throw new Error("人物启用开关无效。");
    return deps.getHost().persona.setEnabled(enabled);
  });
  handle("persona-clear", async () => deps.getHost().persona.clear());
  handle("quota-set", async (event, profileId, input) => {
    const id = identifier(profileId);
    const quota = validateCompanionManualQuotaInput(input);
    const current = session(event);
    const host = deps.getHost();
    await host.refreshProfiles();
    assertCurrent(current);
    return host.monitor.setManualQuota(id, quota);
  });
  handle("quota-clear", async (_event, profileId) => deps.getHost().monitor.clearManualQuota(identifier(profileId)));
  handle("quota-query", async (event, profileId) => {
    const id = identifier(profileId);
    const current = session(event);
    if (current.selections.size > 0) throw new Error("另一项人物选择或额度查询正在进行，请等待或关闭控制中心取消。");
    const controller = new AbortController();
    current.selections.add(controller);
    try {
      const snapshot = await deps.getHost().queryQuota(id, controller.signal);
      assertCurrent(current);
      return snapshot;
    } finally {
      current.selections.delete(controller);
    }
  });
  handle("external-quota-enabled", async (event, enabled) => {
    if (typeof enabled !== "boolean") throw new Error("外部额度监测开关无效。");
    const current = session(event);
    const host = deps.getHost();
    if (!host.setCodexQuotaMonitoring) throw new Error("当前宿主未提供外部额度监测。");
    const snapshot = await host.setCodexQuotaMonitoring(enabled);
    assertCurrent(current);
    return snapshot;
  });
  handle("external-quota-query", async (event) => {
    const current = session(event);
    const host = deps.getHost();
    if (!host.queryExternalQuota) throw new Error("当前宿主未提供外部额度监测。");
    const snapshot = await host.queryExternalQuota();
    assertCurrent(current);
    return snapshot;
  });

  return {
    cancelForSender,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      unsubscribeDiagnostics?.();
      for (const senderId of [...sessions.keys()]) cancelForSender(senderId);
      previews.clear();
      taskOwners.clear();
    },
  };
}
