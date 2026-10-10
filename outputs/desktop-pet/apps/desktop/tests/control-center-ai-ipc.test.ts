import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installControlCenterAiIpcHandlers } from "../src/control-center-ai-ipc.js";
import type { CompanionAiSnapshot, CompanionAiTask, CompanionAiTaskPreview, CompanionPersonaDraft } from "../src/companion-ai-types.js";
import type { PetAssistantConversationTurnResult } from "../src/pet-assistant-conversation.js";

type Dependencies = Parameters<typeof installControlCenterAiIpcHandlers>[0];
type Handler = Parameters<Dependencies["registerHandle"]>[1];
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}
const snapshot: CompanionAiSnapshot = {
  monitor: { sampledAt: 1, profiles: [], agents: [], coverage: [], lastError: null },
  persona: { version: 1, hasPersona: false, enabled: false, format: null, contentBytes: 0, promptBytes: 0, importedAt: null, lastError: null },
  tasks: [], conversation: { activity: "idle", activeTurnId: null, canSend: true, canCancel: false, items: [] },
};
function fixture() {
  const handlers = new Map<string, Handler>();
  const effects: string[] = [];
  let time = 1_000;
  let modality: "typed" | "voice" | null = null;
  let typed = deferred<PetAssistantConversationTurnResult>();
  let pick = async (): Promise<string | null> => null;
  let refresh = async () => {};
  let diagnosticsEnabled = true;
  let accessChanged: (() => void) | undefined;
  let query = async (_id: string, _signal: AbortSignal) => snapshot;
  let imported = async (_path: string, _options: { signal?: AbortSignal } = {}) => snapshot.persona;
  let distill = async (_input: unknown, _signal: AbortSignal): Promise<CompanionPersonaDraft> => ({ mode: "distilled-md", content: "# 草稿\n温和但直接。", usage: null });
  const received: CompanionAiTaskPreview[] = [];
  let nextTaskId = 1;
  const host: ReturnType<Dependencies["getHost"]> = {
    getSnapshot: async () => ({
      ...snapshot,
      conversation: { ...snapshot.conversation, activeTurnId: modality === "typed" ? "fixture-turn" : null },
    }),
    refreshProfiles: () => refresh(),
    getPersonaEnvironment: async () => ({ skillsDirectory: "C:/fixture/skills", activeSkillName: null,
      promptEnvironment: "host-supported", directorySkillLoading: "host-supported", externalNativeSkillLoading: "not-detected",
      modelRoleplay: "not-verified", appliesEveryTurn: true, conversationReady: false, selectedProfile: null }),
    queryQuota: (id, signal) => { effects.push("quota"); return query(id, signal); },
    setCodexQuotaMonitoring: async (enabled) => { effects.push(`external-quota:${enabled}`); return snapshot; },
    queryExternalQuota: async () => { effects.push("external-quota-query"); return snapshot; },
    personaDistillation: {
      generate: (input, signal) => { effects.push("distill"); return distill(input, signal); },
    },
    tasks: {
      previewDiagnostics: (_data, problem) => ({ id: "internal", problem, context: "真实数值夹具", expiresAt: time + 300_000 }),
      startTask: (preview): CompanionAiTask => {
        received.push(preview);
        return { id: `task-${nextTaskId++}`, problem: preview.problem, state: "running", createdAt: time, updatedAt: time, answers: [], summary: null };
      },
      cancelTask: (id) => { effects.push(`cancel:${id}`); return true; },
    },
    persona: {
      getDocument: () => ({ mode: "global-md", content: "# 私人人设正文", format: "character-markdown", enabled: false, importedAt: new Date().toISOString() }),
      saveText: () => { effects.push("save-persona"); return snapshot.persona; },
      importFile: (path, options) => { effects.push("import"); return imported(path, options); },
      importDirectory: (path, options) => { effects.push("import-directory"); return imported(path, options); },
      scanSkills: async () => ({ candidates: [], activated: null, requiresSelection: false }),
      prepareSkillsDirectory: async () => "C:/fixture/skills",
      exportFile: async () => { effects.push("export"); return { exported: true }; },
      setEnabled: () => snapshot.persona,
      clear: () => snapshot.persona,
    },
    monitor: {
      setManualQuota: () => { effects.push("save-quota"); return snapshot.monitor; },
      clearManualQuota: () => snapshot.monitor,
    },
  };
  const lifecycle = installControlCenterAiIpcHandlers({
    registerHandle: (channel, handler) => handlers.set(channel, handler),
    authorizeSender: (event) => { if (![1, 2].includes(event.sender.id)) throw new Error("未授权测试发送方"); },
    getHost: () => host,
    getConversation: () => ({
      sendTypedMessage: () => {
        effects.push("send");
        modality = "typed";
        return typed.promise.finally(() => { modality = null; });
      },
      cancelTypedTurn: () => { effects.push("cancel-typed"); return true; },
    }),
    getActiveModality: () => modality,
    getToolsSnapshot: () => ({ diagnostics: null, findings: [], resourceRecommendations: [], uninstallRecords: [], settings: { monitorEnabled: false, ignoredFindingIds: [], snoozedUntil: {} }, lastError: null, scanning: false }),
    assertDiagnosticsAccess: () => { if (!diagnosticsEnabled) throw new Error("请安装并启用电脑守护插件。"); },
    subscribeDiagnosticsAccess: (listener) => { accessChanged = listener; return () => { accessChanged = undefined; }; },
    pickPersona: (_sender, kind) => { effects.push(kind === "directory" ? "directory-picker" : "picker"); return pick(); },
    openPersonaDirectory: async (directory) => { effects.push(`open:${directory}`); },
    pickPersonaDestination: () => { effects.push("picker"); return pick(); },
    now: () => time,
  });
  return {
    handlers, effects, received, lifecycle,
    invoke: async <T = unknown>(method: string, sender = 1, ...args: unknown[]): Promise<T> => {
      const handler = handlers.get(`openpets:companion-ai-${method}`);
      assert.ok(handler);
      return await handler({ sender: { id: sender } }, ...args) as T;
    },
    setTime: (value: number) => { time = value; },
    setModality: (value: typeof modality) => { modality = value; },
    setRefresh: (value: typeof refresh) => { refresh = value; },
    setDiagnosticsEnabled: (value: boolean) => { diagnosticsEnabled = value; accessChanged?.(); },
    setPick: (value: typeof pick) => { pick = value; },
    setQuery: (value: typeof query) => { query = value; },
    setImport: (value: typeof imported) => { imported = value; },
    setDistill: (value: typeof distill) => { distill = value; },
    finishTyped: (status: PetAssistantConversationTurnResult["status"]) => {
      typed.resolve({ conversationId: "fixture", turnId: "fixture-turn", status });
      typed = deferred<PetAssistantConversationTurnResult>();
    },
  };
}

describe("控制中心 AI 的授权与资源归属", () => {
  it("外部额度开关校验授权与布尔值，独立查询不调用桌宠对话额度", async () => {
    const f = fixture();
    try {
      await assert.rejects(f.invoke("external-quota-enabled", 9, true), /未授权/);
      await assert.rejects(f.invoke("external-quota-enabled", 1, "true"), /开关/);
      assert.deepEqual(f.effects, []);
      await f.invoke("external-quota-enabled", 1, true);
      await f.invoke("external-quota-query");
      await f.invoke("external-quota-enabled", 1, false);
      assert.deepEqual(f.effects, ["external-quota:true", "external-quota-query", "external-quota:false"]);
    } finally { f.lifecycle.dispose(); }
  });
  it("完整 Skill 入口使用目录选择，扫描和固定目录打开继续要求授权", async () => {
    const f = fixture();
    f.setPick(async () => "C:/fixture/Denia-skill");
    await f.invoke("persona-import-directory");
    assert.equal(f.effects.includes("directory-picker"), true);
    assert.equal(f.effects.includes("import-directory"), true);
    assert.equal(f.effects.includes("import"), false);
    await f.invoke("persona-skills-open");
    assert.equal(f.effects.includes("open:C:/fixture/skills"), true);
    for (const method of ["persona-import-directory", "persona-skills-scan", "persona-skills-open", "persona-environment"]) {
      await assert.rejects(f.invoke(method, 999));
    }
    await assert.rejects(f.invoke("persona-skills-scan", 1, { path: "C:/arbitrary" }));
    const choice = deferred<string | null>();
    f.setPick(() => choice.promise);
    const pending = f.invoke("persona-import-directory", 2);
    f.lifecycle.cancelForSender(2);
    choice.resolve("C:/fixture/late-skill");
    await assert.rejects(pending);
    assert.equal(f.effects.filter((effect) => effect === "import-directory").length, 1, "关窗后的迟到目录选择不能导入");
    f.lifecycle.dispose();
  });

  it("电脑守护未启用时不能预览或派发，人物与额度配置仍可用", async () => {
    const f = fixture();
    f.setDiagnosticsEnabled(false);
    await assert.rejects(f.invoke("preview-diagnostics", 1, "卡顿"), /安装并启用/);
    await assert.rejects(f.invoke("start-task", 1, "unknown", ["model"], "model"), /安装并启用/);
    await f.invoke("persona-document");
    assert.deepEqual(f.received, []);
    f.lifecycle.dispose();
  });

  it("停用电脑守护取消已派任务并撤销未消费预览", async () => {
    const f = fixture();
    const first = await f.invoke<CompanionAiTaskPreview>("preview-diagnostics", 1, "卡顿");
    const task = await f.invoke<CompanionAiTask>("start-task", 1, first.id, ["model"], "model");
    const pending = await f.invoke<CompanionAiTaskPreview>("preview-diagnostics", 1, "磁盘");
    f.setDiagnosticsEnabled(false);
    assert.ok(f.effects.includes(`cancel:${task.id}`));
    f.setDiagnosticsEnabled(true);
    await assert.rejects(f.invoke("start-task", 1, pending.id, ["model"], "model"), /预览已失效/);
    f.lifecycle.dispose();
  });

  it("刷新来源时停用再启用插件，不会派出旧诊断任务", async () => {
    const f = fixture();
    const preview = await f.invoke<CompanionAiTaskPreview>("preview-diagnostics", 1, "卡顿");
    const waiting = deferred<void>();
    f.setRefresh(() => waiting.promise);
    const task = f.invoke("start-task", 1, preview.id, ["model"], "model");
    f.setDiagnosticsEnabled(false);
    f.setDiagnosticsEnabled(true);
    waiting.resolve();
    await assert.rejects(task, /插件状态已变化/);
    assert.deepEqual(f.received, []);
    f.lifecycle.dispose();
  });

  it("所有入口先授权，未授权和伪造预览不触发外部效果", async () => {
    const f = fixture();
    for (const handler of f.handlers.values()) await assert.rejects(handler({ sender: { id: 99 } }));
    assert.equal(f.effects.length, 0);
    await assert.rejects(f.invoke("start-task", 1, { id: "forged", context: "伪造资料" }, ["model"], "model"));
    await assert.rejects(f.invoke("quota-set", 1, "model", { remaining: -1, unit: "percent" }));
    assert.deepEqual(f.received, []);
    f.lifecycle.dispose();
  });

  it("预览仅属于原发送方、内容留在主进程、一次消费且有时效", async () => {
    const f = fixture();
    const preview = await f.invoke<CompanionAiTaskPreview>("preview-diagnostics", 1, "卡顿");
    await assert.rejects(f.invoke("start-task", 2, preview.id, ["model"], "model"));
    preview.context = "界面篡改内容";
    const task = await f.invoke<CompanionAiTask>("start-task", 1, preview.id, ["model"], "model");
    assert.equal(f.received[0].context, "真实数值夹具");
    await assert.rejects(f.invoke("start-task", 1, preview.id, ["model"], "model"));
    assert.deepEqual(await f.invoke("cancel-task", 2, task.id), { cancelled: false });
    assert.deepEqual(await f.invoke("cancel-task", 1, task.id), { cancelled: true });
    const old = await f.invoke<CompanionAiTaskPreview>("preview-diagnostics", 1, "磁盘");
    f.setTime(old.expiresAt);
    await assert.rejects(f.invoke("start-task", 1, old.id, ["model"], "model"));
    f.lifecycle.dispose();
  });

  it("配置刷新期间关窗使启动失效，不能在迟到结果后派出任务", async () => {
    const f = fixture();
    const preview = await f.invoke<CompanionAiTaskPreview>("preview-diagnostics", 1, "卡顿");
    const waiting = deferred<void>();
    f.setRefresh(() => waiting.promise);
    const start = f.invoke("start-task", 1, preview.id, ["model"], "model");
    f.lifecycle.cancelForSender(1);
    waiting.resolve();
    await assert.rejects(start);
    assert.equal(f.received.length, 0);
    f.lifecycle.dispose();
  });

  it("控制中心只取消自己发起的 typed 回合，已有桌宠回合不被关窗影响", async () => {
    const f = fixture();
    f.setModality("typed");
    await assert.rejects(f.invoke("send", 1, "不能抢占原回合"));
    f.lifecycle.cancelForSender(1);
    assert.equal(f.effects.includes("cancel-typed"), false);
    f.setModality(null);
    const send = f.invoke("send", 1, "测试对话");
    assert.equal((await f.invoke<CompanionAiSnapshot>("snapshot", 1)).conversation.canCancel, true);
    assert.equal((await f.invoke<CompanionAiSnapshot>("snapshot", 2)).conversation.canCancel, false);
    assert.deepEqual(await f.invoke("cancel-message", 2), { cancelled: false });
    f.lifecycle.cancelForSender(2);
    assert.equal(f.effects.includes("cancel-typed"), false);
    f.lifecycle.cancelForSender(1);
    assert.equal(f.effects.filter((effect) => effect === "cancel-typed").length, 1);
    f.finishTyped("cancelled");
    await assert.rejects(send);
    f.lifecycle.dispose();
  });

  it("对话失败清除原发送方归属，后续请求可继续使用同一个原控制器", async () => {
    const f = fixture();
    const failed = f.invoke("send", 1, "失败夹具");
    f.finishTyped("failed");
    await assert.rejects(failed);
    const next = f.invoke("send", 2, "后续夹具");
    f.finishTyped("completed");
    await next;
    assert.equal(f.effects.filter((effect) => effect === "send").length, 2);
    f.lifecycle.dispose();
  });

  it("关窗后迟到原生选择不导入或导出，选择与额度请求同发送方有界", async () => {
    const f = fixture();
    const choice = deferred<string | null>();
    f.setPick(() => choice.promise);
    const importing = f.invoke("persona-import");
    await assert.rejects(f.invoke("persona-export"));
    await assert.rejects(f.invoke("quota-query", 1, "model"));
    f.lifecycle.cancelForSender(1);
    choice.resolve("C:/fixture/persona.md");
    await assert.rejects(importing);
    assert.equal(f.effects.includes("import"), false);
    assert.equal(f.effects.includes("export"), false);
    f.lifecycle.dispose();
  });

  it("关窗取消在途官方查询，不取消其他发送方；退出拒绝新增工作", async () => {
    const f = fixture();
    const waiting = deferred<CompanionAiSnapshot>();
    let querySignal: AbortSignal | null = null;
    f.setQuery((_id, signal) => { querySignal = signal; return waiting.promise; });
    const querying = f.invoke("quota-query", 1, "model");
    f.lifecycle.cancelForSender(2);
    assert.ok(querySignal);
    assert.equal((querySignal as AbortSignal).aborted, false);
    f.lifecycle.cancelForSender(1);
    assert.equal((querySignal as AbortSignal).aborted, true);
    waiting.resolve(snapshot);
    await assert.rejects(querying);
    f.lifecycle.dispose();
    await assert.rejects(f.invoke("preview-diagnostics", 1, "关闭后的任务"));
  });

  it("人设正文仅由明确编辑请求返回，非法保存和提炼在效果前拒绝，生成不保存", async () => {
    const f = fixture();
    const normal = await f.invoke<CompanionAiSnapshot>("snapshot");
    assert.equal(JSON.stringify(normal).includes("私人人设正文"), false);
    const document = await f.invoke<{ content: string }>("persona-document");
    assert.equal(document.content, "# 私人人设正文");
    for (const invalid of [null, { mode: "unknown", content: "正文" }, { mode: "global-md", content: "正文", path: "C:/private" }]) {
      await assert.rejects(f.invoke("persona-save", 1, invalid));
    }
    await assert.rejects(f.invoke("persona-import", 1, "unknown"));
    await assert.rejects(f.invoke("persona-distill", 1, { profileId: "model", name: "人物", focus: "", material: "中".repeat(10_923) }));
    assert.equal(f.effects.length, 0);
    const input = { profileId: "model", name: "人物", focus: "", material: "本人写的有限素材" };
    const draft = await f.invoke<CompanionPersonaDraft>("persona-distill", 1, input);
    assert.equal(draft.mode, "distilled-md");
    assert.equal(f.effects.includes("save-persona"), false);
    await f.invoke("persona-save", 1, { mode: draft.mode, content: draft.content });
    assert.equal(f.effects.includes("save-persona"), true);
    f.lifecycle.dispose();
  });

  it("人设提炼同发送方不并发，取消和关窗只影响自己，迟到草稿不能交付", async () => {
    const f = fixture();
    const waiting = deferred<CompanionPersonaDraft>();
    let captured: AbortSignal | null = null;
    f.setDistill((_input, signal) => { captured = signal; return waiting.promise; });
    const input = { profileId: "model", name: "人物", focus: "", material: "素材" };
    const generating = f.invoke("persona-distill", 1, input);
    const rejected = assert.rejects(generating);
    await new Promise<void>((resolve) => setImmediate(resolve));
    await assert.rejects(f.invoke("persona-distill", 1, input));
    assert.deepEqual(await f.invoke("persona-distill-cancel", 2), { cancelled: false });
    f.lifecycle.cancelForSender(2);
    assert.ok(captured);
    assert.equal((captured as AbortSignal).aborted, false);
    assert.deepEqual(await f.invoke("persona-distill-cancel", 1), { cancelled: true });
    assert.equal((captured as AbortSignal).aborted, true);
    await rejected;
    waiting.resolve({ mode: "distilled-md", content: "# 迟到草稿", usage: null });
    assert.equal(f.effects.includes("save-persona"), false);
    f.lifecycle.dispose();
  });

  it("来源刷新期间关闭人设页请求可立即结束，不会等待迟到刷新后发送", async () => {
    const f = fixture();
    const refreshing = deferred<void>();
    f.setRefresh(() => refreshing.promise);
    const generating = f.invoke("persona-distill", 1, { profileId: "model", name: "人物", focus: "", material: "素材" });
    f.lifecycle.cancelForSender(1);
    await assert.rejects(generating);
    assert.equal(f.effects.includes("distill"), false);
    refreshing.resolve();
    f.lifecycle.dispose();
  });
});
