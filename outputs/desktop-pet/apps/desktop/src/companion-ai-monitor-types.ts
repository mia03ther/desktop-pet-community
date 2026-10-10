import type { ExternalAiProgress } from "./external-ai-activity.js";
import type { CodexQuotaSnapshot } from "./codex-quota-types.js";

export type CompanionAiWorkState = "idle" | "busy" | "stale" | "disconnected" | "unknown";
export type CompanionAiStateSource = "provider-profile" | "host-assistant" | "host-task" | "agent-hook" | "local-ipc" | "agent-lease";

/** 最小配置摘要，不包含密钥、secretRef、请求头、URL 或对话内容。 */
export interface CompanionAiProfileEvidence {
  id: string;
  label: string;
  adapter: string;
  model: string;
  configuration: "ready" | "disabled" | "invalid" | "missing-secret" | "unsupported";
  officialQuotaProvider?: "deepseek" | "openrouter" | null;
}

/** 来自现有 ConversationController 的当前状态，不能由进程存在推断。 */
export interface CompanionAiAssistantEvidence {
  profileId: string | null;
  activeTurnId?: string;
  activity: "idle" | "thinking" | "acting" | "responding" | "cancelled" | "failed";
  lastSeenAt: number | null;
}

/** 新任务所有者注入的当前任务状态；排队不等于正在推理。 */
export interface CompanionAiTaskEvidence {
  id: string;
  profileId: string;
  state: "queued" | "running" | "completed" | "cancelled" | "failed";
  updatedAt: number;
}

export interface CompanionAiAgentEvidence {
  id: string;
  label: string;
  leaseId?: string;
  source: "agent-hook" | "local-ipc";
  activity: "busy" | "idle" | "unknown";
  lastSeenAt: number | null;
  ended?: boolean;
  progress?: ExternalAiProgress;
}

/** 由原 LeaseManager 只读注入；心跳证明连接，不证明模型正在工作。 */
export interface CompanionAiLeaseEvidence {
  lastHeartbeatAt: number;
  expiresAt: number;
}

export interface CompanionAiActivitySnapshot {
  state: CompanionAiWorkState;
  source: CompanionAiStateSource;
  reason: string;
  lastSeenAt: number | null;
}

export interface CompanionAiTokenUsage {
  profileId: string;
  inputTokens: number;
  outputTokens: number;
  source: "provider-response" | "official-client";
  recordedAt: number;
}

/** 官方账户余额与单 key 支出限制各自保留口径，不能合并成统一剩余额度。 */
export interface CompanionAiOfficialQuotaSnapshot {
  profileId: string;
  provider: "deepseek" | "openrouter";
  kind: "account-balance" | "key-spending-limit";
  status: "fresh" | "stale";
  recordedAt: number;
  balances: { unit: "CNY" | "USD"; remaining: number | null }[];
  reason: string;
}

export interface CompanionAiManualQuotaInput {
  remaining: number;
  used?: number | null;
  unit: "percent" | "credits" | "requests" | "tokens" | "CNY" | "USD";
  resetsAt?: number | null;
}

export interface CompanionAiQuotaSnapshot {
  status: "manual" | "stale" | "unsupported";
  source: "manual" | "none";
  remaining: number | null;
  used: number | null;
  unit: CompanionAiManualQuotaInput["unit"] | null;
  recordedAt: number | null;
  resetsAt: number | null;
  reason: string;
}

export interface CompanionAiProfileSnapshot extends CompanionAiProfileEvidence {
  activity: CompanionAiActivitySnapshot;
  quota: CompanionAiQuotaSnapshot;
  officialQuota: CompanionAiOfficialQuotaSnapshot | null;
  tokenUsage: CompanionAiTokenUsage | null;
  tokenUsageTotal: { inputTokens: number; outputTokens: number; requestCount: number } | null;
  activeTaskIds: string[];
}

export interface CompanionAiAgentSnapshot {
  id: string;
  label: string;
  activity: CompanionAiActivitySnapshot;
  progress: ExternalAiProgress | null;
  quota: { status: "unsupported"; source: "none"; reason: string };
}

export interface CompanionAiMonitorSnapshot {
  sampledAt: number;
  profiles: CompanionAiProfileSnapshot[];
  agents: CompanionAiAgentSnapshot[];
  /** 官方 CLI 账户窗口单独记录，不能归给未携带账户身份的 Hooks 会话。 */
  externalQuotas?: CodexQuotaSnapshot[];
  lastError: string | null;
  coverage: string[];
}
