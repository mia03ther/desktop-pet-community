import { createHash } from "node:crypto";
import { resolve } from "node:path";

export type AgentActivityAdapter = "codex" | "zcode" | "deepseek-harness" | "doubao"
  | "claude" | "opencode" | "pi" | "openclaw" | "cursor" | "zed";
export type AgentActivityPhase = "session-start" | "turn-start" | "tool-start" | "tool-complete"
  | "tool-failed" | "permission" | "turn-end" | "session-end" | "interrupt";
export interface AgentActivityEvent {
  readonly adapter: AgentActivityAdapter;
  readonly sessionId: string;
  readonly event: AgentActivityPhase;
  readonly turnId?: string;
  readonly callId?: string;
  readonly toolName?: string;
  readonly editedFileIds?: readonly string[];
  readonly sentAt: number;
}
export interface AgentActivityFields {
  readonly turnId?: string;
  readonly callId?: string;
  readonly toolName?: string;
  /** 仅由执行器在确认工具成功修改文件后提供；禁止解析模型文本猜测。 */
  readonly editedFiles?: readonly string[];
  readonly cwd?: string;
}
const digest = (value: string): string => createHash("sha256").update(value).digest("hex");
const boundedId = (value: string | undefined): boolean => typeof value === "string" && value.length > 0 && value.length <= 512;
const adapters = new Set<string>(["codex", "zcode", "deepseek-harness", "doubao", "claude", "opencode", "pi", "openclaw", "cursor", "zed"]);
const phases = new Set<string>(["session-start", "turn-start", "tool-start", "tool-complete", "tool-failed", "permission", "turn-end", "session-end", "interrupt"]);
const isAdapter = (value: unknown): value is AgentActivityAdapter => typeof value === "string" && adapters.has(value);
const isPhase = (value: unknown): value is AgentActivityPhase => typeof value === "string" && phases.has(value);
const isDigest = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const isToolName = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_.:-]{1,100}$/.test(value);

/** 发送边界重新校验并只复制摘要白名单，调用方额外字段与序列化函数不能进入 IPC。 */
export function sanitizeAgentActivityEvent(value: unknown, now = Date.now()): AgentActivityEvent | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const { adapter, sessionId, event, turnId, callId, toolName, editedFileIds, sentAt } = value as Record<string, unknown>;
  if (!isAdapter(adapter) || !isDigest(sessionId) || !isPhase(event)
    || typeof sentAt !== "number" || !Number.isSafeInteger(sentAt)
    || sentAt < now - 10 * 60_000 || sentAt > now + 60_000) return undefined;
  if (turnId !== undefined && !isDigest(turnId)) return undefined;
  if (callId !== undefined && !isDigest(callId)) return undefined;
  if (toolName !== undefined && !isToolName(toolName)) return undefined;
  let files: string[] | undefined;
  if (editedFileIds !== undefined) {
    if (event !== "tool-complete" || !Array.isArray(editedFileIds) || editedFileIds.length > 100) return undefined;
    files = [];
    for (let index = 0; index < editedFileIds.length; index += 1) {
      const id: unknown = editedFileIds[index];
      if (!isDigest(id)) return undefined;
      files.push(id);
    }
  }
  return { adapter, sessionId, event, sentAt,
    ...(turnId !== undefined ? { turnId } : {}),
    ...(callId !== undefined ? { callId } : {}),
    ...(toolName !== undefined ? { toolName } : {}),
    ...(files !== undefined ? { editedFileIds: files } : {}),
  };
}

/** 在集成进程内摘要化标识，原始路径、命令、工具结果和聊天均不进入 IPC。 */
export function createAgentActivityEvent(adapter: AgentActivityAdapter, sessionId: string,
  event: AgentActivityPhase, fields: AgentActivityFields = {}): AgentActivityEvent | undefined {
  if (!isAdapter(adapter) || !isPhase(event) || !boundedId(sessionId)
    || typeof fields !== "object" || fields === null || Array.isArray(fields)
    || (fields.cwd !== undefined && typeof fields.cwd !== "string")
    || (fields.editedFiles !== undefined && !Array.isArray(fields.editedFiles))) return undefined;
  const files = event === "tool-complete" ? fields.editedFiles?.filter(path => typeof path === "string" && path.length > 0 && path.length <= 4096)
    .slice(0, 100).map(path => digest(resolve(fields.cwd ?? process.cwd(), path).replaceAll("\\", "/"))) : undefined;
  return { adapter, sessionId: digest(sessionId), event, sentAt: Date.now(),
    ...(boundedId(fields.turnId) ? { turnId: digest(fields.turnId!) } : {}),
    ...(boundedId(fields.callId) ? { callId: digest(fields.callId!) } : {}),
    ...(isToolName(fields.toolName) ? { toolName: fields.toolName } : {}),
    ...(files?.length ? { editedFileIds: [...new Set(files)] } : {}),
  };
}
