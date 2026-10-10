import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { CompanionAiHost } from "../src/companion-ai-host.js";
import { defaultPluginPlatformSettings, type PluginPlatformSettings, type ProviderProfile } from "../src/plugin-platform-settings.js";
import { createEmptyPetAssistantConversationSnapshot, type PetAssistantConversationListener, type PetAssistantConversationSnapshot } from "../src/pet-assistant-conversation.js";
import type { CompanionAiOfficialQuotaSnapshot } from "../src/companion-ai-monitor-types.js";
import type { HostProviderOperations } from "../src/provider-service.js";
import type { OpenPetsReaction } from "../src/local-ipc-protocol.js";
import type { CodexQuotaMonitor } from "../src/codex-quota-monitor.js";
import { unknownCodexQuota } from "../src/codex-quota-client.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}
const profile = (id: string): Extract<ProviderProfile, { adapter: "openai-compatible-text" }> => ({
  id, label: `夹具 ${id}`, adapter: "openai-compatible-text", model: "fixture-model",
  baseUrl: "https://api.deepseek.com", secretRef: `fixture-ref-${id}`,
});
function fixture(initialConversation = createEmptyPetAssistantConversationSnapshot(), codexQuota?: ConstructorParameters<typeof CodexQuotaMonitor>[0]) {
  const directory = mkdtempSync(join(tmpdir(), "companion-ai-host-"));
  let settings: PluginPlatformSettings = {
    ...defaultPluginPlatformSettings,
    profiles: { first: profile("first"), second: profile("second") },
    selections: { text: "first", stt: null, tts: null },
  };
  let conversation = initialConversation;
  let ready: ((controller: typeof source) => void) | undefined;
  let listener: PetAssistantConversationListener | null = null;
  let unsubscribed = false;
  const activities: Array<{ source: string; reaction: OpenPetsReaction | null }> = [];
  let hasCredential = async (_ref: string) => true;
  let query = async (id: string): Promise<CompanionAiOfficialQuotaSnapshot> => ({
    profileId: id, provider: "deepseek", kind: "account-balance", status: "fresh", recordedAt: Date.now(),
    balances: [{ unit: "CNY", remaining: 1.5 }], reason: "官方夹具余额",
  });
  const forbidden = async (): Promise<never> => { throw new Error("夹具不允许网络或模型调用"); };
  const provider: HostProviderOperations = {
    snapshot: forbidden, snapshotProfile: forbidden, json: forbidden, binary: forbidden, stream: forbidden,
    transcribe: forbidden, synthesize: forbidden, negotiateRealtime: forbidden,
    queryQuota: (id) => query(id),
  };
  const source = {
    getSnapshot: () => conversation,
    subscribe: (callback: PetAssistantConversationListener) => {
      listener = callback;
      return () => { listener = null; unsubscribed = true; };
    },
  };
  const host = new CompanionAiHost({
    ...(codexQuota ? { codexQuota } : {}),
    onActivity: (source, reaction) => activities.push({ source, reaction }),
    userDataPath: directory, providerOperations: provider,
    hasCredential: (ref) => hasCredential(ref),
    getSettings: () => settings,
    getAgentSessions: () => [], getConversation: () => source,
    onConversationReady: (callback) => { ready = callback; callback(source); return () => {}; },
  });
  return {
    host,
    activities,
    settings: () => settings,
    replaceSettings: (next: PluginPlatformSettings) => { settings = next; },
    setCredentialLookup: (lookup: typeof hasCredential) => { hasCredential = lookup; },
    setQuery: (operation: typeof query) => { query = operation; },
    emit: (next: PetAssistantConversationSnapshot) => {
      conversation = next;
      listener?.({ type: "snapshot", sequence: next.lastSequence, snapshot: next });
    },
    isUnsubscribed: () => unsubscribed,
    replaceConversation: (next: PetAssistantConversationSnapshot) => { conversation = next; ready?.(source); },
    cleanup: () => { host.dispose(); rmSync(directory, { recursive: true, force: true }); },
  };
}

describe("AI 宿主沿用既有所有者", () => {
  it("外部 CLI 账户监测需要明确启用，与桌宠对话来源的 token 和余额分别投影", async () => {
    let enabled = false;
    let queries = 0;
    const f = fixture(undefined, {
      getEnabled: () => enabled,
      setEnabled: (value) => { enabled = value; },
      getContext: () => ({ command: "fixture-codex.exe", cwd: ".", env: {} }),
      query: async () => {
        queries++;
        return { ...unknownCodexQuota("官方 CLI 测试账户"), status: "fresh", recordedAt: Date.now(), authMode: "chatgpt",
          windows: [{ limitId: "codex", label: "Codex", window: "primary", usedPercent: 60, remainingPercent: 40, windowDurationMins: 300, resetsAt: null }] };
      },
    });
    try {
      await assert.rejects(f.host.queryExternalQuota(), /启用/);
      assert.equal(queries, 0);
      f.host.recordTokenUsage("first", { inputTokens: 100, outputTokens: 200, totalTokens: 300 });
      await f.host.queryQuota("first", new AbortController().signal);
      await f.host.setCodexQuotaMonitoring(true);
      const active = await f.host.queryExternalQuota();
      assert.equal(active.monitor.externalQuotas?.[0]?.windows[0]?.remainingPercent, 40);
      const dialog = active.monitor.profiles.find((row) => row.id === "first");
      assert.equal(dialog?.tokenUsageTotal?.inputTokens, 100);
      assert.equal(dialog?.officialQuota?.balances[0]?.remaining, 1.5);
      const disabled = await f.host.setCodexQuotaMonitoring(false);
      assert.equal(disabled.monitor.externalQuotas?.[0]?.status, "disabled");
      assert.deepEqual(disabled.monitor.externalQuotas?.[0]?.windows, []);
    } finally { f.cleanup(); }
  });
  it("只投影官方额度能力，不向控制中心暴露来源地址或凭据引用", async () => {
    const f = fixture();
    try {
      const gateway = { ...profile("second"), baseUrl: "https://custom-gateway.invalid/v1" };
      f.replaceSettings({ ...f.settings(), profiles: { first: profile("first"), second: gateway } });
      await f.host.refreshProfiles();
      const snapshot = await f.host.getSnapshot();
      assert.equal(snapshot.monitor.profiles.find((row) => row.id === "first")?.officialQuotaProvider, "deepseek");
      assert.equal(snapshot.monitor.profiles.find((row) => row.id === "second")?.officialQuotaProvider, null);
      assert.equal(JSON.stringify(snapshot.monitor).includes(gateway.baseUrl), false);
      assert.ok(gateway.secretRef);
      assert.equal(JSON.stringify(snapshot.monitor).includes(gateway.secretRef), false);
    } finally { f.cleanup(); }
  });
  it("接管已忙碌会话立即联动；替换空闲会话和关闭清除原活动", () => {
    const f = fixture({ ...createEmptyPetAssistantConversationSnapshot(), activity: "acting", activeTurnId: "existing-turn" });
    try {
      assert.deepEqual(f.activities, [{ source: "conversation", reaction: "working" }]);
      f.replaceConversation(createEmptyPetAssistantConversationSnapshot());
      assert.equal(f.activities.at(-1)?.reaction, null);
      f.emit({ ...createEmptyPetAssistantConversationSnapshot(), activity: "thinking" });
      f.host.dispose();
      assert.equal(f.activities.at(-1)?.reaction, null);
    } finally { f.cleanup(); }
  });
  it("区分宿主人设与目录加载能力、当前聊天就绪和外部平台原生 Skill 未检测", async () => {
    const f = fixture();
    try {
      const ready = await f.host.getPersonaEnvironment();
      assert.equal(ready.selectedProfile?.id, "first");
      assert.equal(ready.conversationReady, true);
      assert.equal(ready.promptEnvironment, "host-supported");
      assert.equal(ready.directorySkillLoading, "host-supported");
      assert.equal(ready.externalNativeSkillLoading, "not-detected");
      assert.equal(ready.modelRoleplay, "not-verified");
      assert.equal(ready.appliesEveryTurn, true);
      f.setCredentialLookup(async () => false);
      assert.equal((await f.host.getPersonaEnvironment()).conversationReady, false);
      f.replaceSettings({ ...f.settings(), selections: { text: null, stt: null, tts: null } });
      const unconfigured = await f.host.getPersonaEnvironment();
      assert.equal(unconfigured.selectedProfile, null);
      assert.equal(unconfigured.conversationReady, false);
    } finally { f.cleanup(); }
  });

  it("额度列出全部已配置来源，聊天真实计数按捕获来源聚合，未知计数不冒充零消耗", async () => {
    const f = fixture();
    try {
      f.replaceSettings({ ...f.settings(), profiles: { ...f.settings().profiles, speech: {
        id: "speech", label: "语音来源", adapter: "openai-compatible-speech", model: "tts-1",
        baseUrl: "https://speech.test", secretRef: "fixture-ref-speech", voice: "alloy",
      } } });
      f.host.recordTokenUsage("first", { inputTokens: 10, outputTokens: 2, totalTokens: 12 });
      f.host.recordTokenUsage("first", { inputTokens: 20, outputTokens: 5, totalTokens: 25 });
      f.host.recordTokenUsage("second", { inputTokens: null, outputTokens: 5, totalTokens: null });
      const rows = (await f.host.getSnapshot()).monitor.profiles;
      assert.deepEqual(rows.find((row) => row.id === "first")?.tokenUsageTotal, { inputTokens: 30, outputTokens: 7, requestCount: 2 });
      assert.equal(rows.find((row) => row.id === "second")?.tokenUsageTotal, null);
      assert.equal(rows.find((row) => row.id === "speech")?.configuration, "ready");
      assert.equal(rows.find((row) => row.id === "speech")?.quota.remaining, null);
    } finally { f.cleanup(); }
  });

  it("配置来源本身不冒充工作；真实对话开始、执行、终态和取消联动动作", () => {
    const f = fixture();
    try {
      assert.equal(f.activities.length, 0);
      for (const activity of ["thinking", "acting", "responding", "idle"] as const) {
        f.emit({ ...createEmptyPetAssistantConversationSnapshot(), activity });
      }
      assert.deepEqual(f.activities, [
        { source: "conversation", reaction: "thinking" },
        { source: "conversation", reaction: "working" },
        { source: "conversation", reaction: "thinking" },
        { source: "conversation", reaction: null },
      ]);
      f.emit({ ...createEmptyPetAssistantConversationSnapshot(), activity: "thinking" });
      f.emit(createEmptyPetAssistantConversationSnapshot());
      assert.equal(f.activities.at(-1)?.reaction, null, "取消后依据真实空闲快照复位");
    } finally { f.cleanup(); }
  });
  it("回合固定原配置归属，设置中途切换不冒认新配置；动作行沿用原投影", async () => {
    const f = fixture();
    try {
      f.host.captureAssistantProfile();
      f.replaceSettings({ ...f.settings(), selections: { text: "second", stt: null, tts: null } });
      f.emit({ ...createEmptyPetAssistantConversationSnapshot(), activeTurnId: "original-turn", activity: "thinking", lastSequence: 1,
        items: [{ kind: "message", id: "u1", turnId: "original-turn", role: "user", source: "typed", text: "原消息" },
          { kind: "action", id: "a1", turnId: "original-turn", toolName: "fixture-tool", label: "真实动作", status: "completed" }] });
      const snapshot = await f.host.getSnapshot();
      assert.equal(snapshot.conversation.canSend, true);
      assert.equal(snapshot.conversation.canCancel, false);
      assert.equal(snapshot.monitor.profiles.find((entry) => entry.id === "first")?.activity.state, "busy");
      assert.notEqual(snapshot.monitor.profiles.find((entry) => entry.id === "second")?.activity.state, "busy");
      assert.deepEqual(snapshot.conversation.items.map((item) => item.role), ["user", "action"]);
      assert.equal(snapshot.conversation.items[0].text, "原消息");
      f.host.dispose();
      assert.equal(f.isUnsubscribed(), true);
    } finally { f.cleanup(); }
  });

  it("只有当前所选文本来源可用时允许发送，其他就绪配置不能替代当前选择", async () => {
    const f = fixture();
    try {
      assert.equal((await f.host.getSnapshot()).conversation.canSend, true);
      f.replaceSettings({ ...f.settings(), selections: { text: null, stt: null, tts: null } });
      const disabled = await f.host.getSnapshot();
      assert.equal(disabled.monitor.profiles.some((entry) => entry.configuration === "ready"), true);
      assert.equal(disabled.conversation.canSend, false);
      f.replaceSettings({ ...f.settings(), selections: { text: "missing", stt: null, tts: null } });
      assert.equal((await f.host.getSnapshot()).conversation.canSend, false);
      f.replaceSettings({ ...f.settings(), selections: { text: "first", stt: null, tts: null } });
      f.setCredentialLookup(async () => false);
      assert.equal((await f.host.getSnapshot()).conversation.canSend, false);
    } finally { f.cleanup(); }
  });

  it("官方缓存只存查询元数据，配置及凭据变更让在途结果和已有结果失效", async () => {
    const f = fixture();
    try {
      const initial = await f.host.queryQuota("first", new AbortController().signal);
      assert.equal(initial.monitor.profiles.find((entry) => entry.id === "first")?.officialQuota?.balances[0].remaining, 1.5);
      assert.equal(initial.monitor.profiles.find((entry) => entry.id === "first")?.quota.remaining, null);
      f.host.invalidateQuota();
      assert.equal((await f.host.getSnapshot()).monitor.profiles.find((entry) => entry.id === "first")?.officialQuota, null);

      const waiting = deferred<CompanionAiOfficialQuotaSnapshot>();
      f.setQuery(() => waiting.promise);
      const stale = f.host.queryQuota("first", new AbortController().signal);
      f.host.invalidateQuota();
      waiting.resolve({ profileId: "first", provider: "deepseek", kind: "account-balance", status: "fresh", recordedAt: Date.now(), balances: [], reason: "迟到结果" });
      await assert.rejects(stale);
      assert.equal((await f.host.getSnapshot()).monitor.profiles.find((entry) => entry.id === "first")?.officialQuota, null);

      const changed = deferred<CompanionAiOfficialQuotaSnapshot>();
      f.setQuery(() => changed.promise);
      const oldConfiguration = f.host.queryQuota("first", new AbortController().signal);
      f.replaceSettings({ ...f.settings(), profiles: { ...f.settings().profiles, first: { ...profile("first"), model: "new-model" } } });
      changed.resolve({ profileId: "first", provider: "deepseek", kind: "account-balance", status: "fresh", recordedAt: Date.now(), balances: [], reason: "旧配置结果" });
      await assert.rejects(oldConfiguration);
    } finally { f.cleanup(); }
  });

  it("官方查询取消或失败只显示通用中文，不缓存数据或暴露原接口错误", async () => {
    const f = fixture();
    try {
      f.setQuery(async () => { throw new Error("原接口错误含 SECRET_SAMPLE 与 URL_SAMPLE"); });
      await assert.rejects(f.host.queryQuota("first", new AbortController().signal), (error: unknown) => {
        return error instanceof Error && !error.message.includes("SECRET_SAMPLE") && !error.message.includes("URL_SAMPLE");
      });
      const waiting = deferred<CompanionAiOfficialQuotaSnapshot>();
      f.setQuery(() => waiting.promise);
      const controller = new AbortController();
      const request = f.host.queryQuota("first", controller.signal);
      controller.abort();
      waiting.resolve({ profileId: "first", provider: "deepseek", kind: "account-balance", status: "fresh", recordedAt: Date.now(), balances: [], reason: "取消夹具" });
      await assert.rejects(request);
      assert.equal((await f.host.getSnapshot()).monitor.profiles.find((entry) => entry.id === "first")?.officialQuota, null);
    } finally { f.cleanup(); }
  });

  it("旧配置读取迟到不能覆盖新配置快照", async () => {
    const f = fixture();
    try {
      const waiting = deferred<boolean>();
      f.setCredentialLookup(() => waiting.promise);
      const old = f.host.refreshProfiles();
      f.replaceSettings({ ...f.settings(), profiles: { second: { ...profile("second"), model: "new-model" } } });
      f.setCredentialLookup(async () => true);
      await f.host.refreshProfiles();
      waiting.resolve(false);
      await old;
      const snapshot = await f.host.getSnapshot();
      assert.deepEqual(snapshot.monitor.profiles.map((entry) => entry.id), ["second"]);
      assert.equal(snapshot.monitor.profiles[0].model, "new-model");
      assert.equal(snapshot.monitor.profiles[0].configuration, "ready");
    } finally { f.cleanup(); }
  });
});
