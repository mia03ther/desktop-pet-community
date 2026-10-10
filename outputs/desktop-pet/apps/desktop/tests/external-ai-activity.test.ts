import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ExternalAiActivityTracker, externalAiFreshnessMs, validateExternalAiEvent, type ExternalAiEvent } from "../src/external-ai-activity.js";
import { externalAiProgressMessage } from "../src/external-ai-progress.js";
import { deriveCompanionAgentActivity } from "../src/companion-ai-monitor.js";
import { PetBehaviorController } from "../src/pet-behavior.js";
import { defaultPetBehaviorPreferences } from "../src/pet-behavior-config.js";
import { resolveReactionSpriteState } from "../src/reaction-animation-mapping.js";

const require = createRequire(import.meta.url);
const { createExternalAiEvent } = require(fileURLToPath(new URL("../../assets/agent-hooks/external-ai-event.cjs", import.meta.url))) as {
  createExternalAiEvent: (payload: Record<string, unknown>, event: string, adapter: string) => ExternalAiEvent | undefined;
};
const time = 1_800_000_000_000;
const hash = (number: number) => number.toString(16).padStart(64, "0");
const event = (extra: Partial<ExternalAiEvent> = {}): ExternalAiEvent => ({ adapter: "codex", sessionId: hash(1), event: "turn-start", sentAt: time, ...extra });

test("多个真实会话分别计数和联动；一个结束后另一会话继续工作", () => {
  const tracker = new ExternalAiActivityTracker(() => time);
  let animation = "idle";
  const behavior = new PetBehaviorController({ getPreferences: () => defaultPetBehaviorPreferences,
    getReactionOverrides: () => undefined, render: (value) => { animation = value; } });
  behavior.start();
  try {
    for (const extra of [
      { event: "tool-start", toolName: "apply_patch", callId: hash(11) },
      { adapter: "zcode", sessionId: hash(2), event: "tool-start", toolName: "Bash", callId: hash(21) },
      { event: "tool-complete", callId: hash(11), editedFileIds: [hash(31), hash(32), hash(33)] },
      { event: "turn-end" },
    ] as Partial<ExternalAiEvent>[]) {
      const session = tracker.record(event(extra));
      behavior.setExternalAiActivity(session.id, session.reaction);
    }
    assert.equal(animation, resolveReactionSpriteState("running", undefined));
    assert.equal(tracker.sessions().find((item) => item.label === "Codex")?.progress.editedFileCount, 3);
    assert.equal(tracker.petProgress()?.label.startsWith("ZCode"), true);
    assert.equal(tracker.petProgress()?.message, "正在调用 Bash");
  } finally { behavior.stop(); }
});

test("并行工具完成不清掉另一工具，重复文件不重复累计，新回合独立计数", () => {
  const tracker = new ExternalAiActivityTracker(() => time);
  tracker.record(event({ turnId: hash(4) }));
  tracker.record(event({ event: "tool-start", callId: hash(5), toolName: "exec" }));
  tracker.record(event({ event: "tool-start", callId: hash(6), toolName: "Write" }));
  let session = tracker.record(event({ event: "tool-complete", callId: hash(6), editedFileIds: [hash(8), hash(8)] }));
  assert.equal(session.progress.activeToolCount, 1);
  assert.equal(session.progress.editedFileCount, 1);
  assert.equal(externalAiProgressMessage(session.progress), "正在调用 JS");
  tracker.record(event({ event: "tool-complete", callId: hash(6), editedFileIds: [hash(8)] }));
  session = tracker.record(event({ event: "tool-failed", callId: hash(5) }));
  assert.equal(session.progress.activeToolCount, 0);
  assert.equal(session.progress.editedFileCount, 1);
  assert.equal(session.reaction, "error");
  session = tracker.record(event({ turnId: hash(9) }));
  assert.equal(session.progress.editedFileCount, 0);
});

test("迟到事件不能假装当前工作，90秒无事件则待确认，结束及有限保留准确", () => {
  let now = time;
  const tracker = new ExternalAiActivityTracker(() => now);
  const session = tracker.record(event({ event: "tool-start", toolName: "exec" }));
  const evidence = { id: session.id, label: session.label, source: "agent-hook" as const,
    activity: "busy" as const, lastSeenAt: session.lastActivityAt };
  now += externalAiFreshnessMs + 1;
  assert.equal(tracker.petProgress(), null);
  assert.equal(deriveCompanionAgentActivity(evidence, undefined, now).state, "stale");
  tracker.record(event({ event: "session-end", sentAt: now }));
  assert.equal(deriveCompanionAgentActivity({ ...evidence, ended: true }, undefined, now).state, "disconnected");
  tracker.record(event({ sentAt: time }));
  assert.equal(tracker.sessions()[0]?.ended, true);
  now += 10 * 60_000 + 1;
  assert.deepEqual(tracker.sessions(), []);
});

test("活动载荷拒绝原始数据、伪会话和超量文件，不接收聊天或账户用量", () => {
  assert.equal(validateExternalAiEvent(event(), time)?.adapter, "codex");
  for (const extra of [{ sessionId: "session-secret" }, { prompt: "secret" }, { tokenUsage: 1 },
    { adapter: ["codex"] }, { sessionId: [hash(1)] }, { event: ["session-end"] }, { turnId: [hash(4)] }, { callId: [hash(5)] },
    { toolName: "JS <script>" }, { editedFileIds: [hash(3)] }, { sentAt: time + 60_001 },
    { event: "tool-complete", editedFileIds: Array.from({ length: 101 }, () => hash(3)) }]) {
    assert.throws(() => validateExternalAiEvent({ ...event(), ...extra }, time));
  }
});

test("跨回合迟到工具不污染新回合，已结束会话不被迟到结果复活", () => {
  let now = time;
  const tracker = new ExternalAiActivityTracker(() => now);
  tracker.record(event({ turnId: hash(4) }));
  tracker.record(event({ turnId: hash(5), sentAt: ++now }));
  let session = tracker.record(event({ event: "tool-complete", turnId: hash(4), editedFileIds: [hash(8)], sentAt: ++now }));
  assert.equal(session.progress.editedFileCount, 0);
  assert.equal(session.lastActivityAt, time + 1);
  tracker.record(event({ event: "turn-end", turnId: hash(5), sentAt: ++now }));
  session = tracker.record(event({ event: "tool-start", turnId: hash(5), callId: hash(6), toolName: "Write", sentAt: ++now }));
  assert.equal(session.reaction, "success");
  assert.equal(session.progress.activeToolCount, 0);
  tracker.record(event({ event: "session-end", sentAt: ++now }));
  session = tracker.record(event({ event: "tool-complete", editedFileIds: [hash(8)], sentAt: ++now }));
  assert.equal(session.ended, true);
  assert.equal(session.reaction, "idle");
  assert.equal(session.progress.editedFileCount, 0);
  session = tracker.record(event({ event: "session-start", sentAt: ++now }));
  assert.equal(session.ended, false);
  session = tracker.record(event({ turnId: hash(9), sentAt: ++now }));
  assert.equal(session.reaction, "thinking");
});

test("官方 hook 输入只输出摘要；成功补丁准确计数，失败或普通命令不冒充改动", () => {
  const payload = { session_id: "real-session", turn_id: "real-turn", tool_use_id: "real-call", cwd: "C:/private/project",
    prompt: "不能传出去", transcript_path: "不能读取", tool_name: "apply_patch", tool_input: { command: "秘密补丁" },
    tool_response: { output: "Success. Updated the following files:\nM a.ts\nA b.ts\nD c.ts\n" } };
  const value = createExternalAiEvent(payload, "PostToolUse", "codex")!;
  assert.equal(value.editedFileIds?.length, 3);
  assert.match(value.sessionId, /^[a-f0-9]{64}$/);
  const serialized = JSON.stringify(value);
  for (const secret of ["real-session", "real-call", "real-turn", "private", "秘密", "a.ts", "不能"]) assert.equal(serialized.includes(secret), false);
  assert.equal(createExternalAiEvent({ ...payload, tool_response: { is_error: true, output: payload.tool_response.output } }, "PostToolUse", "codex")?.event, "tool-failed");
  assert.equal(createExternalAiEvent({ ...payload, tool_name: "Bash", tool_response: { output: "changed 100 files" } }, "PostToolUse", "codex")?.editedFileIds, undefined);
  assert.equal(createExternalAiEvent({ tool_name: "Write" }, "PreToolUse", "codex"), undefined);
  const zcode = createExternalAiEvent({ sessionId: "z-session", toolName: "Write", cwd: "C:/project", toolInput: { filePath: "src/a.ts", content: "secret" }, toolResponse: {} }, "PostToolUse", "zcode")!;
  assert.equal(zcode.editedFileIds?.length, 1);
});

test("无限会话与文件不会无限保留，文件上限明确显示至少而非准确总数", () => {
  const tracker = new ExternalAiActivityTracker(() => time);
  for (let index = 0; index < 101; index++) tracker.record(event({ sessionId: hash(index) }));
  assert.equal(tracker.sessions().length, 100);
  for (let index = 0; index < 1001; index++) tracker.record(event({ event: "tool-complete", editedFileIds: [hash(index)] }));
  assert.equal(tracker.sessions().at(-1)?.progress.editedFileCount, 1000);
  assert.equal(tracker.sessions().at(-1)?.progress.fileCountLimited, true);
  tracker.clear();
  assert.equal(tracker.petProgress(), null);
});

test("多平台气泡保持独立，成功编辑去重且失败终态清除未完成工具", () => {
  const tracker = new ExternalAiActivityTracker(() => time);
  for (const adapter of ["deepseek-harness", "doubao", "claude", "opencode", "pi", "openclaw"] as const) {
    const start = event({ adapter, event: "tool-start", toolName: "write", callId: hash(12) });
    assert.equal(validateExternalAiEvent(start, time)?.adapter, adapter);
    tracker.record(start);
    tracker.record(event({ adapter, event: "tool-complete", callId: hash(12), editedFileIds: [hash(13), hash(13)] }));
  }
  assert.equal(tracker.sessions().length, 6);
  assert.ok(tracker.sessions().every(session => session.progress.editedFileCount === 1));
  tracker.record(event({ adapter: "deepseek-harness", event: "tool-start", toolName: "bash", callId: hash(14) }));
  assert.match(tracker.petProgress()!.label, /^DeepSeek Harness/);
  assert.equal(tracker.petProgress()?.message, "正在调用 bash");
  const failed = tracker.record(event({ adapter: "deepseek-harness", event: "tool-failed" }));
  assert.equal(failed.progress.activeToolCount, 0);
  assert.equal(failed.reaction, "error");
  assert.equal(failed.progress.editedFileCount, 1);
  assert.throws(() => validateExternalAiEvent({ ...event(), adapter: "__proto__" }, time));
});
