import { join } from "node:path";
import { createHash } from "node:crypto";
import { CompanionAiMonitor } from "./companion-ai-monitor.js";
import type { CompanionAiAgentEvidence, CompanionAiAssistantEvidence, CompanionAiProfileEvidence, CompanionAiOfficialQuotaSnapshot, CompanionAiTokenUsage } from "./companion-ai-monitor-types.js";
import { CompanionAiTasksService } from "./companion-ai-tasks.js";
import type { CompanionAiConversation, CompanionAiSnapshot } from "./companion-ai-types.js";
import { CompanionPersonaService } from "./companion-persona.js";
import { PersonaDistillationService } from "./persona-distillation.js";
import { CompanionFileClassification } from "./companion-file-classification.js";
import type { CompanionAgentSessionSnapshot } from "./local-ipc.js";
import type { PetAssistantConversationController } from "./pet-assistant-conversation.js";
import { getPluginPlatformSettings, profileStatus, profileSupportsRole, type PluginPlatformSettings } from "./plugin-platform-settings.js";
import type { HostProviderOperations } from "./provider-service.js";
import { TextModelClient } from "./text-model-client.js";
import type { OpenPetsReaction } from "./local-ipc-protocol.js";
import type { PetAssistantTokenUsage } from "./pet-assistant-types.js";
import type { CompanionPersonaEnvironment } from "./companion-persona-types.js";
import { getOfficialQuotaProvider } from "./provider-contract.js";
import { CodexQuotaMonitor } from "./codex-quota-monitor.js";

let host: CompanionAiHost | null = null;
const busyReactions = new Set(["thinking", "working", "editing", "running", "testing", "waiting"]);
const idleReactions = new Set(["idle", "success", "error", "celebrating"]);
type ConversationSource = Pick<PetAssistantConversationController, "getSnapshot" | "subscribe"> & Partial<Pick<PetAssistantConversationController, "publishDesktopMessage">>;

/** 只投影原会话的消息与动作行，不持有另一个聊天历史。 */
function projectConversation(controller: ConversationSource | null): CompanionAiConversation {
  if (!controller) return { activity: "unknown", activeTurnId: null, canSend: false, canCancel: false, items: [] };
  const snapshot = controller.getSnapshot();
  return {
    activity: snapshot.activity,
    activeTurnId: snapshot.activeTurnId ?? null,
    canSend: false,
    canCancel: false,
    items: snapshot.items.map((item) => item.kind === "message"
      ? { id: item.id, role: item.role, text: item.text, createdAt: item.createdAt ?? null }
      : { id: item.id, role: "action", text: `${item.label} · ${item.status}${item.reason ? `：${item.reason}` : ""}`, createdAt: item.createdAt ?? null }),
  };
}

/** 聚合既有配置、会话和租约所有者；只持有人物、分析任务与手动额度服务的生命周期。 */
export class CompanionAiHost {
  readonly persona: CompanionPersonaService;
  readonly personaDistillation: PersonaDistillationService;
  readonly fileClassification: CompanionFileClassification;
  readonly tasks: CompanionAiTasksService;
  readonly monitor: CompanionAiMonitor;
  readonly codexQuota: CodexQuotaMonitor | null;
  #profiles: CompanionAiProfileEvidence[] = [];
  #profilesError: string | null = null;
  #assistant: CompanionAiAssistantEvidence | null = null;
  #capturedAssistantProfileId: string | null = null;
  #controller: ConversationSource | null = null;
  #unsubscribeConversation: (() => void) | null = null;
  readonly #unsubscribeReady: () => void;
  #disposed = false;
  #quotaGeneration = 0;
  #profilesGeneration = 0;
  #officialQuotas = new Map<string, { fingerprint: string; snapshot: CompanionAiOfficialQuotaSnapshot }>();
  #conversationUsage: CompanionAiTokenUsage[] = [];

  constructor(private readonly options: {
    userDataPath: string;
    providerOperations: HostProviderOperations;
    hasCredential: (secretRef: string) => Promise<boolean>;
    getAgentSessions: () => readonly CompanionAgentSessionSnapshot[];
    getConversation: () => ConversationSource | null;
    onConversationReady: (listener: (controller: ConversationSource) => void) => () => void;
    getSettings?: () => PluginPlatformSettings;
    onActivity?: (source: string, reaction: OpenPetsReaction | null) => void;
    codexQuota?: ConstructorParameters<typeof CodexQuotaMonitor>[0];
  }) {
    this.persona = new CompanionPersonaService({ statePath: join(options.userDataPath, "companion-persona.json") });
    this.personaDistillation = new PersonaDistillationService({
      onActivity: (active) => options.onActivity?.("distillation", active ? "thinking" : null),
      getProfiles: () => this.#readyTextProfiles(),
      createModel: (profileId) => new TextModelClient(options.providerOperations, { profileId }),
    });
    this.fileClassification = new CompanionFileClassification({
      onActivity: (active) => options.onActivity?.("classification", active ? "thinking" : null),
      getProfiles: () => this.#readyTextProfiles(),
      createModel: (profileId) => new TextModelClient(options.providerOperations, { profileId }),
    });
    this.tasks = new CompanionAiTasksService({
      onMessage: (id, text, role) => {
        if (!this.#disposed) {
          const controller = this.#controller ?? options.getConversation();
          controller?.publishDesktopMessage?.({ id, text, ...(role ? { role } : {}) });
        }
      },
      onActivity: (active) => options.onActivity?.("diagnostics", active ? "thinking" : null),
      statePath: join(options.userDataPath, "companion-ai-tasks.json"),
      getProfiles: () => this.#readyTextProfiles(),
      createModel: (profileId) => new TextModelClient(options.providerOperations, { profileId }),
      getPersonaStyle: () => this.persona.getPromptStyle(),
    });
    this.monitor = new CompanionAiMonitor({
      statePath: join(options.userDataPath, "companion-ai-manual-quota.json"),
      getProfiles: () => this.#profiles,
      getAssistant: () => this.#assistant,
      getAgentSessions: () => options.getAgentSessions().map((session): CompanionAiAgentEvidence => ({
        id: session.id ?? session.leaseId!,
        label: session.label,
        leaseId: session.leaseId,
        source: session.progress ? "agent-hook" : "local-ipc",
        activity: session.reaction && busyReactions.has(session.reaction) ? "busy"
          : session.reaction && idleReactions.has(session.reaction) ? "idle" : "unknown",
        lastSeenAt: session.lastActivityAt,
        ...(session.progress ? { progress: session.progress } : {}),
        ...(session.ended ? { ended: true } : {}),
      })),
      getLease: (leaseId) => {
        const session = options.getAgentSessions().find((entry) => entry.leaseId === leaseId);
        return session?.leaseActive
          ? { lastHeartbeatAt: session.lastHeartbeatAt, expiresAt: session.expiresAt }
          : null;
      },
      getTasks: () => [...this.tasks.getEvidence(), ...this.personaDistillation.getEvidence(), ...this.fileClassification.getEvidence()],
      getTokenUsage: () => [...this.#conversationUsage, ...this.tasks.getTokenUsage(), ...this.personaDistillation.getTokenUsage(), ...this.fileClassification.getTokenUsage()],
      getOfficialQuota: () => {
        const settings = this.#getSettings();
        for (const [id, entry] of this.#officialQuotas) {
          const profile = settings.profiles[id];
          if (!profile || this.#fingerprint(profile) !== entry.fingerprint) this.#officialQuotas.delete(id);
        }
        return [...this.#officialQuotas.values()].map((entry) => entry.snapshot);
      },
    });
    this.#unsubscribeReady = options.onConversationReady((controller) => this.#observeConversation(controller));
    this.codexQuota = options.codexQuota ? new CodexQuotaMonitor(options.codexQuota) : null;
  }

  /** 原 Service 在回合开始同步取 composition，此时固定模型配置归属。 */
  captureAssistantProfile(): void {
    this.#capturedAssistantProfileId = this.#getSettings().selections.text;
  }

  recordTokenUsage(profileId: string, usage: PetAssistantTokenUsage): void {
    if (this.#disposed || usage.inputTokens === null || usage.outputTokens === null
      || !Number.isSafeInteger(usage.inputTokens) || usage.inputTokens < 0
      || !Number.isSafeInteger(usage.outputTokens) || usage.outputTokens < 0) return;
    this.#conversationUsage.push({ profileId, inputTokens: usage.inputTokens, outputTokens: usage.outputTokens,
      source: "provider-response", recordedAt: Date.now() });
    this.#conversationUsage = this.#conversationUsage.slice(-100);
  }

  #readyTextProfiles(): CompanionAiProfileEvidence[] {
    return this.#profiles.filter((profile) => profile.configuration === "ready"
      && ["openai-compatible-text", "openai-realtime", "anthropic-text"].includes(profile.adapter));
  }

  #getSettings(): PluginPlatformSettings {
    return this.options.getSettings?.() ?? getPluginPlatformSettings();
  }

  #fingerprint(profile: unknown): string {
    return createHash("sha256").update(JSON.stringify(profile)).digest("hex");
  }

  invalidateQuota(): void {
    this.#quotaGeneration += 1;
    this.#officialQuotas.clear();
  }

  async queryQuota(profileId: string, signal: AbortSignal): Promise<CompanionAiSnapshot> {
    if (this.#disposed || signal.aborted) throw new Error("额度查询已取消。");
    const profile = this.#getSettings().profiles[profileId];
    if (!profile || !this.options.providerOperations.queryQuota) throw new Error("当前 AI 配置不支持官方额度查询。");
    const fingerprint = this.#fingerprint(profile);
    const generation = this.#quotaGeneration;
    let quota: CompanionAiOfficialQuotaSnapshot;
    try {
      quota = await this.options.providerOperations.queryQuota(profileId, signal);
    } catch {
      throw new Error(signal.aborted ? "额度查询已取消。" : "官方额度查询未完成。仅支持配置为 DeepSeek 或 OpenRouter 官方地址且已保存凭据的兼容文本接口；请核对来源设置。");
    }
    const currentProfile = this.#getSettings().profiles[profileId];
    if (this.#disposed || signal.aborted || generation !== this.#quotaGeneration
      || !currentProfile || this.#fingerprint(currentProfile) !== fingerprint) {
      throw new Error("查询期间 AI 配置已变更或窗口已关闭，请重新查询。");
    }
    this.#officialQuotas.delete(profileId);
    this.#officialQuotas.set(profileId, { fingerprint, snapshot: quota });
    while (this.#officialQuotas.size > 100) this.#officialQuotas.delete(this.#officialQuotas.keys().next().value!);
    return this.getSnapshot();
  }

  async setCodexQuotaMonitoring(enabled: boolean): Promise<CompanionAiSnapshot> {
    if (this.#disposed || !this.codexQuota) throw new Error("当前宿主未提供 Codex 官方额度监测。");
    await this.codexQuota.setEnabled(enabled);
    return this.getSnapshot();
  }

  async queryExternalQuota(): Promise<CompanionAiSnapshot> {
    if (this.#disposed || !this.codexQuota) throw new Error("当前宿主未提供 Codex 官方额度监测。");
    if (!this.codexQuota.getSnapshot().enabled) throw new Error("请先启用 Codex 官方额度监测。");
    await this.codexQuota.refresh();
    return this.getSnapshot();
  }

  #observeConversation(controller: ConversationSource): void {
    if (this.#disposed) return;
    const replacing = this.#controller !== null;
    this.#unsubscribeConversation?.();
    this.#controller = controller;
    for (const task of [...this.tasks.getTasks()].reverse()) {
      controller.publishDesktopMessage?.({ id: `analysis:${task.id}:request`, role: "user", text: `协同分析：${task.problem}` });
      for (const answer of task.answers) {
        controller.publishDesktopMessage?.({ id: `analysis:${task.id}:${answer.profileId}`, text: `${answer.label} 的分析\n${answer.text || answer.error || "分析未完成。"}` });
      }
      if (task.summary) controller.publishDesktopMessage?.({ id: `analysis:${task.id}:summary`, text: `协同汇总 · ${task.summary.label}\n${task.summary.text || task.summary.error || "汇总未完成。"}` });
    }
    const initial = controller.getSnapshot();
    if (initial.activity !== "idle" || replacing) this.options.onActivity?.("conversation", initial.activity === "acting" ? "working"
      : initial.activity === "thinking" || initial.activity === "responding" ? "thinking" : null);
    this.#assistant = {
      profileId: initial.activeTurnId ? this.#capturedAssistantProfileId : this.#getSettings().selections.text,
      ...(initial.activeTurnId ? { activeTurnId: initial.activeTurnId } : {}),
      activity: initial.activity,
      lastSeenAt: null,
    };
    this.#unsubscribeConversation = controller.subscribe(({ snapshot }) => {
      this.options.onActivity?.("conversation", snapshot.activity === "acting" ? "working"
        : snapshot.activity === "thinking" || snapshot.activity === "responding" ? "thinking" : null);
      this.#assistant = {
        profileId: snapshot.activeTurnId ? this.#capturedAssistantProfileId : this.#getSettings().selections.text,
        ...(snapshot.activeTurnId ? { activeTurnId: snapshot.activeTurnId } : {}),
        activity: snapshot.activity,
        lastSeenAt: Date.now(),
      };
    });
  }

  async refreshProfiles(): Promise<void> {
    if (this.#disposed) throw new Error("宠物大脑正在关闭。");
    const settings = this.#getSettings();
    const generation = ++this.#profilesGeneration;
    try {
      const refs = [...new Set(Object.values(settings.profiles).flatMap((profile) => profile.secretRef ? [profile.secretRef] : []))];
      const present = new Set<string>();
      await Promise.all(refs.map(async (ref) => {
        if (await this.options.hasCredential(ref)) present.add(ref);
      }));
      if (this.#disposed) throw new Error("宠物大脑正在关闭。");
      if (generation !== this.#profilesGeneration) return;
      if (settings !== this.#getSettings()) {
        this.#profiles = [];
        this.#profilesError = "AI 配置在读取期间已变更，请刷新后重试。";
        return;
      }
      this.#profiles = Object.values(settings.profiles)
        .map((profile) => {
          const role = profileSupportsRole(profile, "text") ? "text" : profileSupportsRole(profile, "stt") ? "stt" : "tts";
          return {
            id: profile.id,
            label: profile.label,
            adapter: profile.adapter,
            model: profile.model,
            configuration: profileStatus({ ...settings, selections: { ...settings.selections, [role]: profile.id } }, role,
              (candidate) => Boolean(candidate.secretRef && present.has(candidate.secretRef))).state,
            officialQuotaProvider: getOfficialQuotaProvider(profile),
          };
        });
      this.#profilesError = null;
    } catch {
      if (generation !== this.#profilesGeneration) return;
      this.#profiles = [];
      this.#profilesError = "AI 配置状态暂时不可读取，请刷新；没有把缺失显示成在线或零额度。";
      if (this.#disposed) throw new Error("宠物大脑正在关闭。");
    }
  }

  async getPersonaEnvironment(): Promise<CompanionPersonaEnvironment> {
    await this.refreshProfiles();
    const selectedId = this.#getSettings().selections.text;
    const selected = this.#profiles.find((profile) => profile.id === selectedId);
    const ready = this.#readyTextProfiles().some((profile) => profile.id === selectedId);
    return {
      skillsDirectory: this.persona.getSkillsDirectory(),
      activeSkillName: this.persona.getSnapshot().skillName ?? null,
      promptEnvironment: "host-supported",
      directorySkillLoading: "host-supported",
      externalNativeSkillLoading: "not-detected",
      modelRoleplay: "not-verified",
      appliesEveryTurn: true,
      conversationReady: ready && (this.#controller ?? this.options.getConversation()) !== null,
      selectedProfile: selected ? { id: selected.id, label: selected.label, model: selected.model, ready } : null,
    };
  }

  async getSnapshot(): Promise<CompanionAiSnapshot> {
    await this.refreshProfiles();
    const monitor = this.monitor.getSnapshot();
    monitor.externalQuotas = this.codexQuota ? [this.codexQuota.getSnapshot()] : [];
    const errors = [monitor.lastError, this.#profilesError, this.tasks.getStorageError()].filter((error): error is string => error !== null);
    monitor.lastError = errors.length > 0 ? errors.join("\n") : null;
    const controller = this.#controller ?? this.options.getConversation();
    const selectedProfileId = this.#getSettings().selections.text;
    const conversation = projectConversation(controller);
    conversation.canSend = controller !== null && this.#readyTextProfiles().some((profile) => profile.id === selectedProfileId);
    return {
      monitor,
      persona: this.persona.getSnapshot(),
      tasks: this.tasks.getTasks(),
      conversation,
    };
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#unsubscribeReady();
    this.#unsubscribeConversation?.();
    this.#unsubscribeConversation = null;
    this.#controller = null;
    this.options.onActivity?.("conversation", null);
    this.tasks.dispose();
    this.personaDistillation.dispose();
    this.fileClassification.dispose();
    this.codexQuota?.dispose();
    this.invalidateQuota();
  }
}

export function initializeCompanionAiHost(options: ConstructorParameters<typeof CompanionAiHost>[0]): CompanionAiHost {
  if (host) throw new Error("宠物大脑宿主已经初始化。");
  host = new CompanionAiHost(options);
  return host;
}

export function getCompanionAiHost(): CompanionAiHost {
  if (!host) throw new Error("宠物大脑仍在初始化，请稍后重试。");
  return host;
}

export function recordCompanionTokenUsage(profileId: string, usage: PetAssistantTokenUsage): void {
  host?.recordTokenUsage(profileId, usage);
}

export function getCompanionPersona(): CompanionPersonaService {
  return getCompanionAiHost().persona;
}
