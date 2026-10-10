import assert from "node:assert/strict";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

interface ProgressEvent {
  readonly adapter: string;
  readonly sessionId: string;
  readonly turnId?: string;
  readonly event: string;
  readonly toolName?: string;
  readonly callId?: string;
  readonly editedFileIds?: readonly string[];
}
interface Bridge {
  sessionStart(payload: unknown): void;
  sessionEvent(session: unknown, event: unknown): void;
  stream(payload: unknown): void;
  error(payload: unknown): void;
  toolStart(exec: unknown): void;
  toolResult(exec: unknown, result: unknown): void;
  disposed(session: unknown): void;
}
interface ProgressModule {
  createDshProgressBridge(options: { emit(event: ProgressEvent): void; now?: () => number }): Bridge;
  registerDesktopPetDshListeners(ctx: { on(name: string, listener: (...args: unknown[]) => unknown): void }, options: {
    emit(event: ProgressEvent): Promise<unknown>;
  }): { drain(): Promise<unknown> };
}
const progress: ProgressModule = await import(pathToFileURL(join(process.cwd(), "assets", "agent-hooks", "deepseek-harness", "progress.mjs")).href);

test("Harness 真实会话与并行调用身份分别投影，正文与路径不进入气泡事件", () => {
  const events: ProgressEvent[] = [];
  const bridge = progress.createDshProgressBridge({ emit: (event) => events.push(event) });
  const session = { id: "private-session", header: { cwd: process.cwd() } };
  const agent = { session };
  const exec = { agent, callId: "call-private", name: "write", arguments: { file_path: "private.txt", content: "secret text" } };
  bridge.sessionStart({ agent });
  bridge.sessionEvent(session, { type: "turn/start", data: { turn: 1 } });
  bridge.toolStart(exec);
  bridge.toolResult(exec, { isError: false, value: { path: "private.txt", before: null, after: "secret text" } });
  bridge.sessionEvent(session, { type: "turn/end", data: { turn: 1, reason: { kind: "completed" } } });
  assert.deepEqual(events.map((event) => event.event), ["session-start", "turn-start", "tool-start", "tool-complete", "turn-end"]);
  assert.equal(events[2]?.callId, events[3]?.callId);
  assert.equal(events[2]?.adapter, "deepseek-harness");
  assert.equal(events[3]?.editedFileIds?.length, 1);
  assert.doesNotMatch(JSON.stringify(events), /private-session|private\.txt|secret text|call-private/);
  const other = { session: { id: "another-session" } };
  bridge.toolStart({ agent: other, callId: "call-private", name: "read" });
  assert.notEqual(events.at(-1)?.sessionId, events[2]?.sessionId);
  assert.notEqual(events.at(-1)?.callId, events[2]?.callId);
});

test("失败、无操作与 shell 文本不冒充成功编辑；错误回合不显示完成", () => {
  const events: ProgressEvent[] = [];
  const bridge = progress.createDshProgressBridge({ emit: (event) => events.push(event) });
  const session = { id: "failure-session" };
  const agent = { session };
  bridge.sessionEvent(session, { type: "turn/start", data: { turn: 1 } });
  bridge.toolResult({ agent, name: "write", callId: "a" }, { isError: true, value: { path: "a.txt", before: null, after: "text" } });
  bridge.toolResult({ agent, name: "edit", callId: "b" }, { isError: false, value: { path: "a.txt", before: "same", after: "same" } });
  bridge.toolResult({ agent, name: "bash", callId: "c" }, { isError: false, value: { path: "a.txt", before: "old", after: "new" } });
  bridge.error({ agent, error: { message: "private error" } });
  bridge.sessionEvent(session, { type: "turn/end", data: { turn: 1, reason: { kind: "error", error: { message: "private error" } } } });
  assert.equal(events.some((event) => event.editedFileIds), false);
  assert.equal(events.at(-1)?.event, "tool-failed");
  assert.equal(events.some((event) => event.event === "turn-end"), false);
  bridge.sessionEvent(session, { type: "turn/start", data: { turn: 2 } });
  bridge.sessionEvent(session, { type: "turn/end", data: { turn: 2, reason: { kind: "aborted" } } });
  assert.equal(events.at(-1)?.event, "interrupt");
});

test("长时间思考只传有界保活类别；结束会话撤销且新回合身份不同", () => {
  const events: ProgressEvent[] = [];
  let clock = 20_000;
  const bridge = progress.createDshProgressBridge({ emit: (event) => events.push(event), now: () => clock });
  const session = { id: "heartbeat-session" };
  bridge.sessionEvent(session, { type: "turn/start", data: { turn: 1 } });
  bridge.stream({ agent: { session }, frame: { type: "chunk", chunk: { type: "reasoning-delta", text: "private reasoning" } } });
  bridge.stream({ agent: { session }, frame: { type: "chunk", chunk: { type: "text-delta", text: "private reply" } } });
  assert.equal(events.length, 2);
  assert.equal(events[0]?.turnId, events[1]?.turnId);
  clock += 15_000;
  bridge.stream({ agent: { session }, frame: { type: "chunk" } });
  assert.equal(events.length, 3);
  bridge.sessionEvent(session, { type: "turn/start", data: { turn: 2 } });
  assert.notEqual(events.at(-1)?.turnId, events[0]?.turnId);
  bridge.disposed(session);
  assert.equal(events.at(-1)?.event, "session-end");
  assert.doesNotMatch(JSON.stringify(events), /private reasoning|private reply/);
});

test("插件不接管工具与审批流程；桌宠离线后下一条事件仍发送且顺序保持", async () => {
  const listeners = new Map<string, (...args: unknown[]) => unknown>();
  const received: ProgressEvent[] = [];
  let attempted = 0;
  const bridge = progress.registerDesktopPetDshListeners({ on: (name, listener) => { listeners.set(name, listener); } }, {
    emit: async (event) => {
      attempted += 1;
      if (attempted === 1) throw new Error("offline");
      received.push(event);
    },
  });
  const agent = { session: { id: "delegation-session" } };
  const result = { isError: false, value: null };
  const promise = Promise.resolve(result);
  assert.equal(listeners.get("tools/execute")?.({ agent, callId: "one", name: "read" }, () => promise), promise);
  assert.equal(listeners.get("approval/request")?.({ agent }, () => "allowed-once"), "allowed-once");
  listeners.get("tools/result")?.({ agent, callId: "one", name: "read" }, result);
  await bridge.drain();
  assert.equal(attempted, 3);
  assert.deepEqual(received.map((event) => event.event), ["permission", "tool-complete"]);
});
