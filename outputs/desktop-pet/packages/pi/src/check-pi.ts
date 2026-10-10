import assert from "node:assert/strict";

import { allowedReactions, createOpenPetsClient, type AgentActivityEvent } from "@open-pets/client";

import extension from "./extension.js";
import { classifyPiEvent, classifyPiToolExecutionStart, createOpenPetsPiExtension, createOpenPetsPiRuntime, getPiOpenPetsHelp, normalizePiEvent, parseOpenPetsCommand, shouldIgnoreOpenPetsTool, validateManualSpeech, type OpenPetsPiExtensionApi } from "./runtime.js";

assert.equal(typeof extension, "function");
assert.equal(typeof getPiOpenPetsHelp(), "string");
assert.deepEqual(normalizePiEvent({ type: "agent_start" }), { type: "agent_start", payload: { type: "agent_start" } });
assert.deepEqual(normalizePiEvent({ type: "agent_start", payload: { reason: "startup" } }), { type: "agent_start", payload: { reason: "startup" } });

assert.deepEqual(classifyPiEvent({ type: "session_start", prompt: "secret" }), { reaction: "waving" });
assert.deepEqual(classifyPiEvent({ type: "agent_start" }), { reaction: "thinking" });
assert.deepEqual(classifyPiEvent({ type: "turn_start" }), { reaction: "working" });
assert.deepEqual(classifyPiEvent({ type: "session_shutdown" }), { reaction: "idle" });
assert.deepEqual(classifyPiEvent({ type: "agent_end" }), { reaction: "success", clearError: true });
assert.deepEqual(classifyPiEvent({ type: "tool_execution_end", isError: true, result: "SECRET_STACK" }), { reaction: "error", speech: "error", markError: true });
assert.equal(classifyPiEvent({ type: "tool_execution_end", isError: false, result: "SECRET_STACK" }), undefined);
assert.equal(classifyPiEvent({ type: "input", text: "do not inspect" }), undefined);
assert.equal(classifyPiEvent({ type: "message_update", message: "do not inspect" }), undefined);
assert.equal(classifyPiEvent({ type: "tool_result", content: "do not inspect" }), undefined);

assert.equal(classifyPiToolExecutionStart("edit", {}), "editing");
assert.equal(classifyPiToolExecutionStart("apply_patch", {}), "editing");
assert.equal(classifyPiToolExecutionStart("bash", { command: "pnpm test -- --secret token=abc" }), "testing");
assert.equal(classifyPiToolExecutionStart("bash", { command: "ls" }), "running");
assert.equal(classifyPiToolExecutionStart("read", {}), "working");
assert.equal(classifyPiToolExecutionStart("openpets_status", {}), undefined);
assert.equal(shouldIgnoreOpenPetsTool("openpets_openpets_say"), true);

assert.deepEqual(parseOpenPetsCommand(""), { kind: "help" });
assert.deepEqual(parseOpenPetsCommand("status"), { kind: "status" });
assert.deepEqual(parseOpenPetsCommand("test"), { kind: "test" });
assert.deepEqual(parseOpenPetsCommand("react success"), { kind: "react", reaction: "success" });
assert.deepEqual(parseOpenPetsCommand("say Ready"), { kind: "say", message: "Ready" });
for (const reaction of allowedReactions) assert.deepEqual(parseOpenPetsCommand(`react ${reaction}`), { kind: "react", reaction });
assert.throws(() => parseOpenPetsCommand("react nope"), /Invalid OpenPets reaction/);
assert.throws(() => parseOpenPetsCommand("status extra"), /Usage/);

assert.equal(validateManualSpeech("  Ready  "), "Ready");
for (const unsafe of [
  "",
  "line one\nline two",
  "x".repeat(141),
  "const token = 1",
  "https://example.com",
  "/Users/alvin/secret.txt",
  "../secret.txt",
  "token=abc123",
  "-----BEGIN PRIVATE KEY-----abc",
]) {
  assert.throws(() => validateManualSpeech(unsafe));
}

{
  const calls: string[] = [];
  const scheduled: Array<() => Promise<void>> = [];
  const runtime = createOpenPetsPiRuntime({
    now: () => 1_000,
    random: () => 0,
    schedule: (work) => { scheduled.push(work); },
    clientFactory: () => ({
      hello: async () => ({}),
      status: async () => ({ ok: true, appRunning: true }),
      listPets: async () => ({ ok: true, defaultPetId: "builtin", pets: [] }),
      installPet: async () => ({ ok: true, petId: "x", displayName: "X", installed: true }),
      installLocalPet: async () => ({ ok: true, petId: "x", displayName: "X", installed: true }),
      acquireLease: async () => { throw new Error("no leases in pi mvp"); },
      heartbeatLease: async () => ({ leaseId: "x", expiresAt: 0 }),
      releaseLease: async () => ({ released: true }),
      react: async (reaction) => { calls.push(`react:${reaction}`); },
      say: async (message, options) => { calls.push(`say:${message}:${options?.reaction ?? "none"}`); },
      showMedia: async () => ({ ok: true, shown: true }),
    }),
  });

  runtime.handleEvent({ type: "tool_execution_start", toolName: "bash", args: { command: "pnpm test /Users/alvin/private" }, prompt: "PRIVATE_PROMPT" });
  assert.equal(calls.length, 0, "automatic handler must schedule without blocking");
  assert.equal(scheduled.length, 1);
  await scheduled.shift()?.();
  assert.deepEqual(calls, ["react:testing"]);

  runtime.handleEvent({ type: "tool_execution_end", isError: true, result: "STACK /Users/alvin/private token=abc" });
  await scheduled.shift()?.();
  assert.equal(calls[1], "say:Something failed:error");
  assert.ok(!calls.join("\n").includes("/Users/alvin/private"));
  assert.ok(!calls.join("\n").includes("token=abc"));

  runtime.handleEvent({ type: "agent_end" });
  assert.equal(scheduled.length, 0, "recent errors suppress success overwrite");
}

{
  const events: string[] = [];
  let commandHandler: ((args: string, ctx?: unknown) => unknown) | undefined;
  const handlers = new Map<string, (event: unknown, ctx?: unknown) => unknown>();
  const calls: string[] = [];
  const api: OpenPetsPiExtensionApi = {
    on: (eventName, handler) => { events.push(eventName); handlers.set(eventName, handler); },
    registerCommand: (_name, command) => { commandHandler = command.handler; },
  };
  const scheduled: Array<() => Promise<void>> = [];
  const runtime = createOpenPetsPiExtension(api, {
    schedule: (work) => { scheduled.push(work); },
    clientFactory: () => ({
      hello: async () => ({}),
      status: async () => ({ ok: true, appRunning: true }),
      listPets: async () => ({ ok: true, defaultPetId: "builtin", pets: [] }),
      installPet: async () => ({ ok: true, petId: "x", displayName: "X", installed: true }),
      installLocalPet: async () => ({ ok: true, petId: "x", displayName: "X", installed: true }),
      acquireLease: async () => { throw new Error("no leases in pi mvp"); },
      heartbeatLease: async () => ({ leaseId: "x", expiresAt: 0 }),
      releaseLease: async () => ({ released: true }),
      react: async (reaction) => { calls.push(`react:${reaction}`); },
      say: async (message) => { calls.push(`say:${message}`); },
      showMedia: async () => ({ ok: true, shown: true }),
    }),
  });
  assert.equal(typeof runtime.handleEvent, "function");
  assert.ok(events.includes("session_start"));
  assert.ok(events.includes("tool_execution_start"));
  assert.equal(typeof commandHandler, "function");
  handlers.get("agent_start")?.({ reason: "payload lacks type", prompt: "PRIVATE_PROMPT" });
  await scheduled.shift()?.();
  assert.deepEqual(calls, ["react:thinking"]);
}

{
  const debugLogs: string[] = [];
  const runtime = createOpenPetsPiRuntime({
    debug: true,
    debugLog: (message) => debugLogs.push(message),
    clientFactory: () => ({
      hello: async () => ({}),
      status: async () => ({ ok: false, appRunning: false, unavailableReason: "/Users/alvin/private.sock" }),
      listPets: async () => ({ ok: true, defaultPetId: "builtin", pets: [] }),
      installPet: async () => ({ ok: true, petId: "x", displayName: "X", installed: true }),
      installLocalPet: async () => ({ ok: true, petId: "x", displayName: "X", installed: true }),
      acquireLease: async () => { throw new Error("no leases in pi mvp"); },
      heartbeatLease: async () => ({ leaseId: "x", expiresAt: 0 }),
      releaseLease: async () => ({ released: true }),
      react: async () => { throw Object.assign(new Error("/Users/alvin/private token=abc"), { code: "ENOENT /Users/alvin/private" }); },
      say: async () => { throw new Error("should not speak"); },
      showMedia: async () => ({ ok: true, shown: true }),
    }),
  });
  runtime.handleEvent({ type: "agent_start", prompt: "PRIVATE_PROMPT" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.ok(debugLogs.some((entry) => entry.includes("ENOENT")));
  assert.ok(!debugLogs.join("\n").includes("/Users/alvin/private"));
  assert.ok(!debugLogs.join("\n").includes("token=abc"));
}

{
  const events: AgentActivityEvent[] = [];
  const handlers = new Map<string, (event: unknown, ctx?: unknown) => unknown>();
  const client = createOpenPetsClient({ remote: false });
  const api: OpenPetsPiExtensionApi = {
    on: (name, handler) => { handlers.set(name, handler); },
  };
  const runtime = createOpenPetsPiExtension(api, {
    clientFactory: () => ({
      ...client,
      react: async () => {},
      say: async () => {},
      reportActivity: async (event) => { events.push(event); },
    }),
  });
  const ctx = { cwd: process.cwd(), sessionManager: { getSessionId: () => "official-session-A" } };
  const emit = (type: string, payload: unknown = {}, context: unknown = ctx): void => {
    handlers.get(type)?.(payload, context);
  };
  const flush = async (): Promise<void> => { await new Promise<void>((resolve) => setImmediate(resolve)); };
  emit("session_start");
  emit("agent_start", { prompt: "PRIVATE_PROMPT" });
  emit("tool_execution_start", { toolCallId: "call-1", toolName: "write", args: { path: "private-a.txt", content: "SECRET" } });
  emit("tool_execution_end", { toolCallId: "call-1", toolName: "write", isError: false, result: "PRIVATE_OUTPUT" });
  emit("turn_start", { turnIndex: 1 });
  emit("tool_execution_start", { toolCallId: "call-2", toolName: "edit", args: { path: "private-a.txt" } });
  emit("tool_execution_end", { toolCallId: "call-2", toolName: "edit", isError: false });
  emit("tool_execution_start", { toolCallId: "call-3", toolName: "write", args: { path: "private-failed.txt" } });
  emit("tool_execution_end", { toolCallId: "call-3", toolName: "write", isError: true });
  emit("tool_execution_end", { toolCallId: "unmatched", toolName: "write", isError: false, args: { path: "invented.txt" } });
  emit("agent_end", { messages: "PRIVATE_TRANSCRIPT" });
  assert.equal(events.length, 0, "自动回调不等待本机 IPC");
  await flush();
  assert.ok(events.every((event) => event.adapter === "pi" && /^[a-f0-9]{64}$/.test(event.sessionId)));
  assert.equal(new Set(events.map((event) => event.sessionId)).size, 1, "同一官方会话保留稳定摘要");
  const successfulFiles = events.filter((event) => event.event === "tool-complete").flatMap((event) => event.editedFileIds ?? []);
  assert.equal(successfulFiles.length, 2);
  assert.equal(new Set(successfulFiles).size, 1, "同一文件重复成功编辑可去重");
  assert.ok(events.filter((event) => event.event === "tool-failed").every((event) => !event.editedFileIds));
  assert.equal(events.some((event) => event.event === "turn-end"), false, "agent_end 尚可能续跑，不能假报完成");
  assert.equal(new Set(events.filter((event) => event.turnId).map((event) => event.turnId)).size, 1, "多个模型迭代属于同一用户工作轮次");
  const serialized = JSON.stringify(events);
  for (const secret of ["PRIVATE", "SECRET", "private-a.txt", "private-failed.txt", "invented.txt", "official-session-A", process.cwd()]) assert.ok(!serialized.includes(secret));

  emit("agent_before_settle", { outcome: "completed", context: "PRIVATE_CONTEXT" });
  emit("agent_settled", { aborted: false });
  await flush();
  assert.equal(events.at(-1)?.event, "turn-end");
  const previousTurnId = events.at(-1)?.turnId;
  emit("agent_start");
  emit("agent_settled", { aborted: true });
  await flush();
  assert.equal(events.at(-1)?.event, "interrupt");
  assert.notEqual(events.at(-1)?.turnId, previousTurnId);
  emit("agent_start");
  emit("agent_before_settle", { outcome: "error" });
  emit("agent_settled", { aborted: false });
  await flush();
  assert.equal(events.at(-1)?.event, "tool-failed", "正式失败结果不变为成功");
  emit("session_shutdown");
  await flush();
  assert.equal(events.at(-1)?.event, "session-end");

  const count = events.length;
  emit("agent_start", {}, { cwd: process.cwd() });
  await runtime.handleCommand("test");
  await flush();
  assert.equal(events.length, count, "缺少官方会话身份和手工连通测试均不制造真实会话记录");
}

console.log("Pi integration package checks passed.");
