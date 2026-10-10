import { lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { homedir, tmpdir, userInfo } from "node:os";

import { createAgentActivityEvent, createOpenPetsClient, type AgentActivityEvent, type AgentActivityPhase, type OpenPetsClient, type OpenPetsReaction, OpenPetsClientError } from "@open-pets/client";
import { validateHookSpeech as validateSharedHookSpeech } from "@open-pets/agent-events";

import { pickHookSpeech, type HookSpeechCategory } from "./hook-messages.js";

export type ClaudeHookEventName = "SessionStart" | "UserPromptSubmit" | "PreToolUse" | "PostToolUse" | "PostToolUseFailure" | "PermissionRequest" | "Notification" | "Stop" | "StopFailure" | "SessionEnd";

export interface ClaudeHookDecision {
  readonly eventName?: string;
  readonly reaction?: OpenPetsReaction;
  readonly speechCategory?: HookSpeechCategory;
}

export interface ClaudeHookOptions {
  readonly client?: OpenPetsClient;
  readonly configuredPetId?: string;
  readonly projectLocal?: boolean;
  readonly now?: () => number;
  readonly random?: () => number;
  readonly throttlePath?: string;
  readonly debug?: boolean;
}

const maxHookInputBytes = 64 * 1024;
const maxProjectLocalSettingsBytes = 256 * 1024;
const speechCooldownMs = 20_000;
const permissionCooldownMs = 3_000;
const reactionCooldownMs = 10_000;

export async function runClaudeHookFromStdin(stdin: NodeJS.ReadStream = process.stdin, options: ClaudeHookOptions = {}): Promise<number> {
  try {
    const raw = await readLimitedStdin(stdin, maxHookInputBytes);
    await handleClaudeHookPayload(raw, options);
    return 0;
  } catch (error) {
    if (options.debug || process.env.OPENPETS_DEBUG === "1") {
      process.stderr.write(`OpenPets Claude hook ignored error: ${sanitizeDebugError(error)}\n`);
    }
    return 0;
  }
}

export async function handleClaudeHookPayload(raw: string, options: ClaudeHookOptions = {}): Promise<ClaudeHookDecision | null> {
  let parsed: Record<string, unknown>;
  try {
    parsed = parseHookPayload(raw);
  } catch {
    return null;
  }
  const decision = mapClaudeHookEvent(parsed);
  if (!decision) return decision;
  if (!options.projectLocal && hasProjectLocalOpenPetsHook()) return decision;

  // 会话与工具进度必须逐项送达，不能被原有语音／动作冷却吞掉完成或失败事件。
  const activity = options.configuredPetId ? undefined : createClaudeActivity(parsed);
  let client = options.client;
  if (activity) {
    client ??= createOpenPetsClient({ connectTimeoutMs: 500, responseTimeoutMs: 500, remote: false });
    try {
      await client.reportActivity?.(activity);
    } catch (error) {
      if (options.debug) process.stderr.write(`桌宠 Claude 工作事件未送达：${sanitizeDebugError(error)}\n`);
    }
  }
  if (!decision.reaction) return decision;

  const shouldSpeak = decision.speechCategory ? shouldSendSpeech(decision.speechCategory, options) : false;
  const shouldReact = shouldSendReaction(decision.reaction, options);
  if (!shouldSpeak && !shouldReact) return decision;

  client ??= createOpenPetsClient({ connectTimeoutMs: 500, responseTimeoutMs: 500 });
  const lease = options.configuredPetId ? await acquireHookLease(client, options.configuredPetId, options.debug) : undefined;
  try {
    if (decision.speechCategory && shouldSpeak) {
      const message = validateHookSpeech(pickHookSpeech(decision.speechCategory, options.random));
      await client.say(message, { reaction: decision.reaction, leaseId: lease?.leaseId });
    } else {
      await client.react(decision.reaction, { leaseId: lease?.leaseId });
    }
  } catch (error) {
    if (!(error instanceof OpenPetsClientError) && options.debug) {
      process.stderr.write(`OpenPets Claude hook client error: ${sanitizeDebugError(error)}\n`);
    }
  }
  return decision;
}

export function hasProjectLocalOpenPetsHook(projectDir = process.env.CLAUDE_PROJECT_DIR): boolean {
  if (!projectDir || /[\0\r\n]/.test(projectDir)) return false;
  try {
    const projectReal = realpathSync(projectDir);
    const settingsPath = join(projectReal, ".claude", "settings.local.json");
    const settingsReal = realpathSync(settingsPath);
    const rel = relative(projectReal, settingsReal);
    if (rel.startsWith("..") || isAbsolute(rel)) return false;
    const settingsLstat = lstatSync(settingsPath);
    if (settingsLstat.isSymbolicLink()) return false;
    const settingsStat = statSync(settingsPath);
    if (!settingsStat.isFile() || settingsStat.size <= 0 || settingsStat.size > maxProjectLocalSettingsBytes) return false;
    const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as unknown;
    return containsProjectLocalOpenPetsHook(settings);
  } catch {
    return false;
  }
}

function containsProjectLocalOpenPetsHook(value: unknown): boolean {
  if (typeof value === "string") return value.includes("--openpets-managed") && value.includes("--project-local");
  if (Array.isArray(value)) return value.some(containsProjectLocalOpenPetsHook);
  if (isRecord(value)) return Object.values(value).some(containsProjectLocalOpenPetsHook);
  return false;
}

async function acquireHookLease(client: OpenPetsClient, requestedPetId: string, debug = false): Promise<{ readonly leaseId: string } | undefined> {
  try {
    return await client.acquireLease({ requestedPetId });
  } catch (error) {
    if (debug) process.stderr.write(`OpenPets Claude hook lease unavailable: ${sanitizeDebugError(error)}\n`);
    return undefined;
  }
}

export function parseHookPayload(raw: string): Record<string, unknown> {
  if (Buffer.byteLength(raw, "utf8") > maxHookInputBytes) throw new Error("Claude hook payload is too large.");
  const parsed = JSON.parse(raw || "{}") as unknown;
  return isRecord(parsed) ? parsed : {};
}

export function mapClaudeHookEvent(payload: Record<string, unknown>): ClaudeHookDecision | null {
  const eventName = typeof payload.hook_event_name === "string" ? payload.hook_event_name : undefined;
  if (eventName === "SessionStart" || eventName === "SessionEnd") return { eventName };
  if (eventName === "UserPromptSubmit") return { eventName, reaction: "thinking" };
  if (eventName === "PermissionRequest") return { eventName, reaction: "waiting", speechCategory: "permission" };
  if (eventName === "Notification") return { eventName };
  if (eventName === "Stop") return { eventName, reaction: "success" };
  if (eventName === "StopFailure") return { eventName, reaction: "error", speechCategory: "error" };
  if (eventName === "PreToolUse") return { eventName, reaction: classifyToolReaction(payload) };
  if (eventName === "PostToolUseFailure") return { eventName, reaction: "error" };
  if (eventName === "PostToolUse") return { eventName };
  return eventName ? { eventName } : null;
}

function createClaudeActivity(payload: Record<string, unknown>): AgentActivityEvent | undefined {
  if (typeof payload.session_id !== "string") return undefined;
  const phases: Partial<Record<ClaudeHookEventName, AgentActivityPhase>> = {
    SessionStart: "session-start",
    UserPromptSubmit: "turn-start",
    PreToolUse: "tool-start",
    PostToolUse: "tool-complete",
    PostToolUseFailure: "tool-failed",
    PermissionRequest: "permission",
    Stop: "turn-end",
    StopFailure: "tool-failed",
    SessionEnd: "session-end",
  };
  const event = typeof payload.hook_event_name === "string" ? phases[payload.hook_event_name as ClaudeHookEventName] : undefined;
  if (!event) return undefined;
  const tool = typeof payload.tool_name === "string" ? payload.tool_name : undefined;
  const response = isRecord(payload.tool_response) ? payload.tool_response : undefined;
  const failed = response?.is_error === true || response?.isError === true || response?.success === false;
  const input = isRecord(payload.tool_input) ? payload.tool_input : undefined;
  const path = input?.file_path;
  const editedFiles = event === "tool-complete" && !failed && tool && ["Edit", "Write", "MultiEdit"].includes(tool)
    && typeof path === "string" ? [path] : undefined;
  return createAgentActivityEvent("claude", payload.session_id, failed && event === "tool-complete" ? "tool-failed" : event, {
    callId: typeof payload.tool_use_id === "string" ? payload.tool_use_id : undefined,
    toolName: tool,
    editedFiles,
    cwd: typeof payload.cwd === "string" ? payload.cwd : undefined,
  });
}

export function validateHookSpeech(message: string): string {
  return validateSharedHookSpeech(message);
}

export function getDefaultThrottlePath(): string {
  if (process.platform === "win32") {
    const base = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
    return join(base, "OpenPets", "claude-hook-throttle.json");
  }
  const stateHome = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  if (stateHome) return join(stateHome, "openpets", "claude-hook-throttle.json");
  const uid = safeUid();
  return join(tmpdir(), `openpets-${uid}`, "claude-hook-throttle.json");
}

function classifyToolReaction(payload: Record<string, unknown>): OpenPetsReaction | undefined {
  const toolName = typeof payload.tool_name === "string" ? payload.tool_name : "";
  if (toolName === "Edit" || toolName === "Write" || toolName === "MultiEdit") return "editing";
  if (toolName === "Bash") {
    const command = extractBashCommand(payload.tool_input);
    return /\b(test|vitest|jest|pytest|npm\s+test|pnpm\s+test|yarn\s+test|cargo\s+test|go\s+test)\b/i.test(command) ? "testing" : undefined;
  }
  return undefined;
}

function extractBashCommand(value: unknown): string {
  return isRecord(value) && typeof value.command === "string" ? value.command.slice(0, 300) : "";
}

function shouldSendSpeech(category: HookSpeechCategory, options: ClaudeHookOptions): boolean {
  const now = options.now?.() ?? Date.now();
  const cooldown = category === "permission" ? permissionCooldownMs : speechCooldownMs;
  return shouldSendThrottleKey(category, cooldown, now, options.throttlePath ?? getDefaultThrottlePath());
}

function shouldSendReaction(reaction: OpenPetsReaction, options: ClaudeHookOptions): boolean {
  const now = options.now?.() ?? Date.now();
  return shouldSendThrottleKey(`reaction:${reaction}`, reactionCooldownMs, now, options.throttlePath ?? getDefaultThrottlePath());
}

function shouldSendThrottleKey(key: string, cooldown: number, now: number, path: string): boolean {
  const state = readThrottleState(path);
  const previous = typeof state[key] === "number" ? state[key] : 0;
  if (now - previous < cooldown) return false;
  state[key] = now;
  writeThrottleState(path, state);
  return true;
}

function readThrottleState(path: string): Record<string, number> {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    if (!isRecord(parsed)) return {};
    const state: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if ((key === "thinking" || key === "success" || key === "error" || key === "permission" || key.startsWith("reaction:")) && typeof value === "number" && Number.isFinite(value)) state[key] = value;
    }
    return state;
  } catch {
    return {};
  }
}

function writeThrottleState(path: string, state: Record<string, number>): void {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    const tempPath = `${path}.${process.pid}.tmp`;
    writeFileSync(tempPath, `${JSON.stringify(state)}\n`, { encoding: "utf8", mode: 0o600 });
    renameSync(tempPath, path);
  } catch {
    // Best effort only; throttling must never break hooks.
  }
}

function readLimitedStdin(stdin: NodeJS.ReadStream, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk: string) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer, "utf8") > maxBytes) reject(new Error("Claude hook stdin is too large."));
    });
    stdin.on("error", reject);
    stdin.on("end", () => resolve(buffer));
  });
}

function sanitizeDebugError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/(?:[A-Za-z]:)?[\\/][^\s"']{2,}/g, "<path>")
    .replace(/\b(api[_-]?key|secret|password|token)\s*[:=]\s*\S+/gi, "$1=<redacted>").slice(0, 200);
}

function safeUid(): string {
  try { return String(userInfo().uid); } catch { return "user"; }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
