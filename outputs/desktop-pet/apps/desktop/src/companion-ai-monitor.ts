import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import type {
  CompanionAiActivitySnapshot, CompanionAiAgentEvidence, CompanionAiAssistantEvidence,
  CompanionAiLeaseEvidence, CompanionAiManualQuotaInput, CompanionAiMonitorSnapshot,
  CompanionAiProfileEvidence, CompanionAiQuotaSnapshot, CompanionAiTaskEvidence, CompanionAiTokenUsage,
  CompanionAiOfficialQuotaSnapshot,
} from "./companion-ai-monitor-types.js";

export type * from "./companion-ai-monitor-types.js";

const eventFreshnessMs = 90_000;
const quotaFreshnessMs = 24 * 60 * 60 * 1000;
const clockSkewMs = 60_000;
const quotaUnits = new Set(["percent", "credits", "requests", "tokens", "CNY", "USD"]);
type SavedQuota = CompanionAiManualQuotaInput & { recordedAt: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function usableTimestamp(value: number | null, now: number): number | null {
  return validTimestamp(value) && value <= now + clockSkewMs ? value : null;
}

export function validateCompanionManualQuotaInput(value: unknown): CompanionAiManualQuotaInput {
  if (!isRecord(value) || typeof value.remaining !== "number" || !Number.isFinite(value.remaining)
    || value.remaining < 0 || value.remaining > 1_000_000_000_000
    || typeof value.unit !== "string" || !quotaUnits.has(value.unit)
    || value.unit === "percent" && value.remaining > 100
    || value.used !== undefined && value.used !== null && (typeof value.used !== "number"
      || !Number.isFinite(value.used) || value.used < 0 || value.used > 1_000_000_000_000
      || value.unit === "percent" && value.used > 100)
    || value.resetsAt !== undefined && value.resetsAt !== null && !validTimestamp(value.resetsAt)) {
    throw new Error("请输入有效的剩余额度、计量单位和重置时间；百分比范围为 0 到 100。");
  }
  return {
    remaining: value.remaining,
    ...(value.used === undefined ? {} : { used: value.used as number | null }),
    unit: value.unit as CompanionAiManualQuotaInput["unit"],
    resetsAt: value.resetsAt === undefined ? null : value.resetsAt as number | null,
  };
}

/** 外部事件的时效独立于心跳；收到心跳不能延长“模型正在工作”的断言。 */
export function deriveCompanionAgentActivity(
  agent: CompanionAiAgentEvidence,
  lease: CompanionAiLeaseEvidence | null | undefined,
  now: number,
): CompanionAiActivitySnapshot {
  const eventAt = usableTimestamp(agent.lastSeenAt, now);
  if (agent.ended) return { state: "disconnected", source: agent.source, reason: "收到该外部会话的结束事件。", lastSeenAt: eventAt };
  if (agent.leaseId && lease === null) {
    return { state: "disconnected", source: "agent-lease", reason: "原桌宠会话租约已结束或失效。", lastSeenAt: eventAt };
  }
  if (agent.leaseId && lease !== undefined && lease !== null && lease.expiresAt <= now) {
    return { state: "disconnected", source: "agent-lease", reason: "桌宠会话心跳租约已过期。", lastSeenAt: usableTimestamp(lease.lastHeartbeatAt, now) };
  }
  if (agent.leaseId && lease === undefined) {
    return { state: "unknown", source: "agent-lease", reason: "尚未接入租约状态，无法确认事件所对应会话仍有效。", lastSeenAt: eventAt };
  }
  if (eventAt === null) {
    return {
      state: "unknown", source: lease ? "agent-lease" : agent.source,
      reason: lease ? "会话已连接，但没有可信的当前工作事件。" : "没有可信的当前工作事件。",
      lastSeenAt: lease ? usableTimestamp(lease.lastHeartbeatAt, now) : null,
    };
  }
  if (now - eventAt > eventFreshnessMs) {
    return { state: "stale", source: agent.source, reason: "工作事件超过 90 秒未更新，当前状态待确认。", lastSeenAt: eventAt };
  }
  return {
    state: agent.activity, source: agent.source,
    reason: agent.activity === "busy" ? "最近收到该会话的工作事件。"
      : agent.activity === "idle" ? "最近收到该会话的停止或空闲事件。" : "收到会话事件，但没有明确工作状态。",
    lastSeenAt: eventAt,
  };
}

function profileActivity(
  profile: CompanionAiProfileEvidence,
  assistant: CompanionAiAssistantEvidence | null,
  tasks: readonly CompanionAiTaskEvidence[],
  now: number,
): CompanionAiActivitySnapshot {
  const running = tasks.filter((task) => task.profileId === profile.id && task.state === "running"
    && usableTimestamp(task.updatedAt, now) !== null);
  if (running.length > 0) {
    return { state: "busy", source: "host-task", reason: "桌宠正在通过该配置处理任务。", lastSeenAt: Math.max(...running.map((task) => task.updatedAt)) };
  }
  if (assistant?.profileId === profile.id) {
    const lastSeenAt = usableTimestamp(assistant.lastSeenAt, now);
    if (assistant.activeTurnId && ["thinking", "acting", "responding"].includes(assistant.activity)) {
      return { state: "busy", source: "host-assistant", reason: "桌宠当前有正在处理的对话回合。", lastSeenAt };
    }
    if (!assistant.activeTurnId) {
      return { state: "idle", source: "host-assistant", reason: "本桌宠当前没有使用该配置的活动对话回合。", lastSeenAt };
    }
    return { state: "unknown", source: "host-assistant", reason: "活动回合与终止状态不一致，等待所有者更新。", lastSeenAt };
  }
  if (profile.configuration !== "ready") {
    return { state: "disconnected", source: "provider-profile", reason: "该配置尚未准备就绪；请检查模型、启用状态和凭据配置。", lastSeenAt: null };
  }
  return { state: "unknown", source: "provider-profile", reason: "配置已就绪，但没有本桌宠的当前工作状态证据。", lastSeenAt: null };
}

function quotaSnapshot(quota: SavedQuota | undefined, now: number): CompanionAiQuotaSnapshot {
  if (!quota) {
    return { status: "unsupported", source: "none", remaining: null, used: null, unit: null, recordedAt: null, resetsAt: null,
      reason: "尚无手动额度记录；不能用 token 使用量推算剩余额度。" };
  }
  const stale = quota.recordedAt > now + clockSkewMs || now - quota.recordedAt > quotaFreshnessMs
    || quota.resetsAt !== undefined && quota.resetsAt !== null && quota.resetsAt <= now;
  return {
    status: stale ? "stale" : "manual", source: "manual", remaining: quota.remaining, used: quota.used ?? null, unit: quota.unit,
    recordedAt: quota.recordedAt, resetsAt: quota.resetsAt ?? null,
    reason: stale ? "手动记录超过 24 小时或已到重置时间，请重新核对；这不是实时额度。"
      : "用户手动记录，按此配置保存；不是提供方的实时账户查询。",
  };
}

/** 只聚合既有所有者的最小状态，持久化仅拥有手动额度；不发网络请求、不读取凭据。 */
export class CompanionAiMonitor {
  #quotas: Record<string, SavedQuota> = Object.create(null) as Record<string, SavedQuota>;
  #loadError: string | null = null;
  constructor(private readonly options: {
    statePath: string;
    getProfiles: () => readonly CompanionAiProfileEvidence[];
    getAssistant: () => CompanionAiAssistantEvidence | null;
    getAgentSessions: () => readonly CompanionAiAgentEvidence[];
    getLease?: (leaseId: string) => CompanionAiLeaseEvidence | null;
    getTasks?: () => readonly CompanionAiTaskEvidence[];
    getTokenUsage?: () => readonly CompanionAiTokenUsage[];
    getOfficialQuota?: () => readonly CompanionAiOfficialQuotaSnapshot[];
    now?: () => number;
  }) {
    try {
      if (!existsSync(options.statePath)) return;
      if (statSync(options.statePath).size > 256 * 1024) throw new Error("记录文件过大。");
      const saved: unknown = JSON.parse(readFileSync(options.statePath, "utf8"));
      if (!isRecord(saved) || saved.version !== 1 || !isRecord(saved.quotas)
        || Object.keys(saved.quotas).length > 100) throw new Error("记录格式无效。");
      const quotas: Record<string, SavedQuota> = Object.create(null) as Record<string, SavedQuota>;
      for (const [id, entry] of Object.entries(saved.quotas)) {
        if (id.length === 0 || id.length > 128 || !isRecord(entry) || !validTimestamp(entry.recordedAt)) throw new Error("记录条目无效。");
        quotas[id] = { ...validateCompanionManualQuotaInput(entry), recordedAt: entry.recordedAt };
      }
      this.#quotas = quotas;
    } catch {
      this.#loadError = "手动额度记录读取失败，请重新记录；没有把读取失败显示成零额度。";
    }
  }

  #now(): number { return this.options.now?.() ?? Date.now(); }

  #save(quotas: Record<string, SavedQuota>): void {
    const temporary = `${this.options.statePath}.tmp`;
    writeFileSync(temporary, JSON.stringify({ version: 1, quotas }), "utf8");
    renameSync(temporary, this.options.statePath);
    this.#quotas = quotas;
    this.#loadError = null;
  }

  setManualQuota(profileId: string, input: CompanionAiManualQuotaInput): CompanionAiMonitorSnapshot {
    if (!this.options.getProfiles().some((profile) => profile.id === profileId)) throw new Error("该 AI 配置已不存在，请刷新配置列表。");
    if (profileId.length === 0 || profileId.length > 128) throw new Error("AI 配置标识无效。");
    const quota = { ...validateCompanionManualQuotaInput(input), recordedAt: this.#now() };
    const quotas = Object.assign(Object.create(null) as Record<string, SavedQuota>, this.#quotas, { [profileId]: quota });
    if (Object.keys(quotas).length > 100) throw new Error("手动额度记录已达到 100 个配置上限。");
    this.#save(quotas);
    return this.getSnapshot();
  }

  clearManualQuota(profileId: string): CompanionAiMonitorSnapshot {
    const quotas = Object.assign(Object.create(null) as Record<string, SavedQuota>, this.#quotas);
    delete quotas[profileId];
    this.#save(quotas);
    return this.getSnapshot();
  }

  getSnapshot(): CompanionAiMonitorSnapshot {
    const now = this.#now();
    try {
      const profiles = this.options.getProfiles().slice(0, 100);
      const assistant = this.options.getAssistant();
      const tasks = (this.options.getTasks?.() ?? []).slice(0, 200);
      const usage = (this.options.getTokenUsage?.() ?? []).slice(0, 200);
      const officialQuotas = (this.options.getOfficialQuota?.() ?? []).slice(0, 100);
      return structuredClone({
        sampledAt: now,
        profiles: profiles.map((profile) => {
          const profileUsage = usage.filter((entry) => entry.profileId === profile.id && usableTimestamp(entry.recordedAt, now) !== null
            && Number.isSafeInteger(entry.inputTokens) && entry.inputTokens >= 0
            && Number.isSafeInteger(entry.outputTokens) && entry.outputTokens >= 0);
          const tokenUsage = [...profileUsage].sort((a, b) => b.recordedAt - a.recordedAt)[0] ?? null;
          const usageTotal = profileUsage.reduce((sum, entry) => ({
            inputTokens: sum.inputTokens + entry.inputTokens,
            outputTokens: sum.outputTokens + entry.outputTokens,
            requestCount: sum.requestCount + 1,
          }), { inputTokens: 0, outputTokens: 0, requestCount: 0 });
          const officialQuota = officialQuotas.find((entry) => entry.profileId === profile.id
            && usableTimestamp(entry.recordedAt, now) !== null);
          return {
            id: profile.id, label: profile.label, adapter: profile.adapter, model: profile.model, configuration: profile.configuration,
            officialQuotaProvider: profile.officialQuotaProvider ?? null,
            activity: profileActivity(profile, assistant, tasks, now),
            quota: quotaSnapshot(this.#quotas[profile.id], now),
            officialQuota: officialQuota ? {
              profileId: officialQuota.profileId,
              provider: officialQuota.provider,
              kind: officialQuota.kind,
              status: now - officialQuota.recordedAt > 5 * 60_000 ? "stale" : officialQuota.status,
              recordedAt: officialQuota.recordedAt,
              balances: officialQuota.balances.map(({ unit, remaining }) => ({ unit, remaining })),
              reason: officialQuota.reason,
            } : null,
            tokenUsage: tokenUsage ? { profileId: tokenUsage.profileId, inputTokens: tokenUsage.inputTokens, outputTokens: tokenUsage.outputTokens, source: tokenUsage.source, recordedAt: tokenUsage.recordedAt } : null,
            tokenUsageTotal: profileUsage.length > 0 && Number.isSafeInteger(usageTotal.inputTokens)
              && Number.isSafeInteger(usageTotal.outputTokens) ? usageTotal : null,
            activeTaskIds: tasks.filter((task) => task.profileId === profile.id && task.state === "running").map((task) => task.id),
          };
        }),
        agents: this.options.getAgentSessions().slice(0, 200).map((agent) => ({
          id: agent.id, label: agent.label,
          activity: deriveCompanionAgentActivity(agent, agent.leaseId ? this.options.getLease?.(agent.leaseId) : undefined, now),
          progress: agent.progress ?? null,
          quota: { status: "unsupported" as const, source: "none" as const,
            reason: agent.progress?.adapter === "codex" ? "本会话的 Hooks 不携带账户归属。官方 CLI 账户窗口单独显示，不能据此假定每个 Codex 会话使用同一账户。"
              : "未知：此外部活动桥接未提供官方账户额度接口；桌宠对话用量不属于该会话。" },
        })),
        lastError: this.#loadError,
        coverage: [
          "仅显示本桌宠对话、任务和已接入活动桥接的会话；不覆盖未连接的外部 AI。",
          "租约心跳只证明会话连接；进程存在、配置就绪和模型已加载均不能证明正在工作。",
          "桌宠对话提供方与外部工具会话分别展示；外部工具额度不能由桌宠对话用量推算。",
          "token 使用量与账户剩余额度分开；手动额度按对话配置隔离，24 小时或重置后标为过期。",
        ],
      });
    } catch {
      return { sampledAt: now, profiles: [], agents: [], lastError: "AI 状态来源暂时不可读取，请刷新；没有把失败显示为空闲或零额度。", coverage: [] };
    }
  }
}
