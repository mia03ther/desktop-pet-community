export interface CodexQuotaWindow {
  readonly limitId: string;
  readonly label: string;
  readonly window: "primary" | "secondary";
  readonly usedPercent: number;
  readonly remainingPercent: number;
  readonly windowDurationMins: number | null;
  readonly resetsAt: number | null;
}
/** Codex 外部账户的只读窗口，与桌宠对话提供方额度及单会话文件计数无关。 */
export interface CodexQuotaSnapshot {
  readonly provider: "codex";
  readonly enabled: boolean;
  readonly status: "disabled" | "checking" | "fresh" | "stale" | "unknown";
  readonly recordedAt: number | null;
  readonly cliVersion: string | null;
  readonly authMode: "chatgpt" | "apiKey" | "amazonBedrock" | "not-logged-in" | "unknown";
  readonly windows: readonly CodexQuotaWindow[];
  readonly reason: string;
}
