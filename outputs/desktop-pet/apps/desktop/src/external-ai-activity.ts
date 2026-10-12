import { IpcProtocolError, isRecord, type OpenPetsReaction } from "./local-ipc-protocol.js";
import { externalAiProgressMessage } from "./external-ai-progress.js";

export const externalAiAdapterLabels = {
  codex: "Codex", zcode: "ZCode", "deepseek-harness": "DeepSeek Harness", doubao: "豆包方舟应用",
  claude: "Claude Code", opencode: "OpenCode", pi: "Pi", openclaw: "OpenClaw", cursor: "Cursor", zed: "Zed",
} as const;
export type ExternalAiAdapter = keyof typeof externalAiAdapterLabels;
export type ExternalAiEventName = "session-start" | "turn-start" | "tool-start" | "tool-complete" | "tool-failed" | "permission" | "turn-end" | "session-end" | "interrupt";
/** Hooks 只传会话/调用/文件摘要，不传提示词、命令、文件路径或工具结果。 */
export interface ExternalAiEvent {
  readonly adapter: ExternalAiAdapter;
  readonly sessionId: string;
  readonly turnId?: string;
  readonly event: ExternalAiEventName;
  readonly toolName?: string;
  readonly callId?: string;
  readonly editedFileIds?: readonly string[];
  readonly sentAt: number;
}
export interface ExternalAiProgress {
  readonly adapter: ExternalAiAdapter;
  readonly sessionId: string;
  readonly phase: ExternalAiEventName;
  readonly toolName: string | null;
  readonly editedFileCount: number;
  readonly fileCountLimited: boolean;
  readonly activeToolCount: number;
}
export interface ExternalAiSession {
  readonly id: string;
  readonly label: string;
  readonly reaction: OpenPetsReaction;
  readonly lastActivityAt: number;
  readonly ended: boolean;
  readonly progress: ExternalAiProgress;
}
export interface ExternalAiPetProgress {
  readonly label: string;
  readonly message: string;
  readonly editedFileCount: number;
  readonly fileCountLimited: boolean;
  readonly otherActiveSessions: number;
}
const events = new Set<string>(["session-start", "turn-start", "tool-start", "tool-complete", "tool-failed", "permission", "turn-end", "session-end", "interrupt"]);
const digestPattern = /^[a-f0-9]{64}$/;
export const externalAiFreshnessMs = 90_000;
const retentionMs = 10 * 60_000;

export function validateExternalAiEvent(value: unknown, now = Date.now()): ExternalAiEvent | undefined {
  if (value === undefined) return undefined;
  const invalid = () => { throw new IpcProtocolError("invalid_params", "外部 AI 活动元数据无效；只接受有界的会话摘要与工具名称。"); };
  if (!isRecord(value) || typeof value.adapter !== "string" || !Object.hasOwn(externalAiAdapterLabels, value.adapter)
    || typeof value.sessionId !== "string" || !digestPattern.test(value.sessionId)
    || typeof value.event !== "string" || !events.has(value.event) || !Number.isSafeInteger(value.sentAt) || Number(value.sentAt) < now - retentionMs
    || Number(value.sentAt) > now + 60_000) return invalid();
  for (const key of Object.keys(value)) {
    if (!["adapter", "sessionId", "turnId", "event", "toolName", "callId", "editedFileIds", "sentAt"].includes(key)) return invalid();
  }
  if (value.turnId !== undefined && (typeof value.turnId !== "string" || !digestPattern.test(value.turnId))) return invalid();
  if (value.callId !== undefined && (typeof value.callId !== "string" || !digestPattern.test(value.callId))) return invalid();
  if (value.toolName !== undefined && (typeof value.toolName !== "string" || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(value.toolName))) return invalid();
  if (value.editedFileIds !== undefined && (!Array.isArray(value.editedFileIds) || value.editedFileIds.length > 100
    || value.editedFileIds.some((id) => typeof id !== "string" || !digestPattern.test(id)) || value.event !== "tool-complete")) return invalid();
  return value as unknown as ExternalAiEvent;
}

type SessionState = { event: ExternalAiEvent; turnId?: string; lastSeenAt: number; files: Set<string>; calls: Map<string, string>; limited: boolean; reaction: OpenPetsReaction; ended: boolean; turnClosed: boolean };
/** 由本机 IPC 所有者持有的有限事件投影，不读取外部聊天文件，也不持久化原始事件。 */
export class ExternalAiActivityTracker {
  readonly #sessions = new Map<string, SessionState>();
  constructor(private readonly now: () => number = Date.now) {}
  record(event: ExternalAiEvent): ExternalAiSession {
    const id = `hook:${event.adapter}:${event.sessionId}`;
    const previous = this.#sessions.get(id);
    const state: SessionState = previous ?? { event, lastSeenAt: this.now(), files: new Set(), calls: new Map(), limited: false, reaction: "idle", ended: false, turnClosed: false };
    if (previous && event.sentAt < previous.event.sentAt) return this.snapshot(id, state);
    // 较晚送达不代表属于当前回合；终态只能由新的正式开始事件重新激活。
    if (previous?.ended && event.event !== "session-start") return this.snapshot(id, state);
    if (previous?.turnClosed && !["session-start", "turn-start", "session-end"].includes(event.event)) return this.snapshot(id, state);
    if (previous?.turnClosed && event.event === "turn-start" && event.turnId && event.turnId === state.turnId) return this.snapshot(id, state);
    if (!["session-start", "turn-start", "session-end"].includes(event.event) && event.turnId && state.turnId && event.turnId !== state.turnId) return this.snapshot(id, state);
    if (event.event === "turn-start" && (!event.turnId || event.turnId !== state.turnId)) {
      state.files.clear(); state.calls.clear(); state.limited = false;
    }
    if (event.event === "session-start") { state.turnId = undefined; state.files.clear(); state.limited = false; }
    if (event.turnId) state.turnId = event.turnId;
    if (["session-start", "turn-start"].includes(event.event)) state.turnClosed = false;
    // Harness 的 agent/error 与失败回合没有 callId，表示整轮终止；单工具失败仍可继续。
    const harnessTurnFailed = event.adapter === "deepseek-harness" && event.event === "tool-failed" && !event.callId;
    if (["turn-end", "session-end", "interrupt"].includes(event.event) || harnessTurnFailed) state.turnClosed = true;
    state.event = event; state.lastSeenAt = Math.min(event.sentAt, this.now()); state.ended = event.event === "session-end";
    if (event.event === "tool-start" && event.callId && event.toolName) {
      if (state.calls.size < 100) state.calls.set(event.callId, event.toolName);
    }
    if (event.event === "tool-complete" || event.event === "tool-failed") {
      if (event.callId) state.calls.delete(event.callId);
      else if (event.event === "tool-failed") state.calls.clear();
      if (event.event === "tool-complete") for (const file of event.editedFileIds ?? []) {
        if (state.files.size < 1000) state.files.add(file);
        else if (!state.files.has(file)) state.limited = true;
      }
    }
    if (["turn-end", "session-end", "interrupt", "session-start"].includes(event.event)) state.calls.clear();
    const pendingTool = [...state.calls.values()].at(-1);
    state.reaction = event.event === "permission" ? "waiting" : pendingTool ? toolReaction(pendingTool)
      : event.event === "tool-start" ? toolReaction(event.toolName ?? "") : event.event === "tool-failed" ? "error"
      : event.event === "turn-end" ? "success" : ["session-end", "interrupt", "session-start"].includes(event.event) ? "idle" : "thinking";
    this.#sessions.delete(id); this.#sessions.set(id, state);
    while (this.#sessions.size > 100) this.#sessions.delete(this.#sessions.keys().next().value!);
    return this.snapshot(id, state);
  }
  sessions(): ExternalAiSession[] {
    const now = this.now();
    for (const [id, state] of this.#sessions) if (now - state.lastSeenAt > retentionMs) this.#sessions.delete(id);
    return [...this.#sessions].map(([id, state]) => this.snapshot(id, state));
  }
  petProgress(): ExternalAiPetProgress | null {
    const now = this.now();
    const sessions = this.sessions().filter((session) => !session.ended && now - session.lastActivityAt < externalAiFreshnessMs);
    const active = sessions.filter((session) => !["idle", "success", "error"].includes(session.reaction));
    const selected = active.at(-1) ?? sessions.filter((session) => now - session.lastActivityAt < 10_000 && session.progress.phase !== "session-start").at(-1);
    if (!selected) return null;
    return { label: `${selected.label} · ${selected.progress.sessionId.slice(0, 6)}`, message: externalAiProgressMessage(selected.progress),
      editedFileCount: selected.progress.editedFileCount, fileCountLimited: selected.progress.fileCountLimited,
      otherActiveSessions: Math.max(0, active.length - (active.includes(selected) ? 1 : 0)) };
  }
  clear(): void { this.#sessions.clear(); }
  private snapshot(id: string, state: SessionState): ExternalAiSession {
    return { id, label: externalAiAdapterLabels[state.event.adapter], reaction: state.reaction,
      lastActivityAt: state.lastSeenAt, ended: state.ended,
      progress: { adapter: state.event.adapter, sessionId: state.event.sessionId, phase: state.event.event,
        toolName: [...state.calls.values()].at(-1) ?? state.event.toolName ?? null, editedFileCount: state.files.size,
        fileCountLimited: state.limited, activeToolCount: state.calls.size } };
  }
}
function toolReaction(tool: string): OpenPetsReaction {
  return /^(apply_patch|edit|write|multiedit|patch)$/i.test(tool) ? "editing"
    : /^(bash|exec_command|shell|shell_command|execute|run_code)$/i.test(tool) ? "running" : "working";
}
