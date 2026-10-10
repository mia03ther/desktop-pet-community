import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { createLocalIpcRequestHandler, type LocalIpcAgentActivity, type LocalIpcMediaOptions, type LocalIpcRequestHandlerDeps, type LocalIpcStateSnapshot } from "../src/local-ipc-request-handler.js";
import type { LeaseSnapshot } from "../src/lease-manager.js";
import { buildCodexHookScript } from "../src/agent-setup-codex.js";
import { defaultPetBehaviorPreferences } from "../src/pet-behavior-config.js";
import { PetBehaviorController, composePetBehaviorDisplay, petExternalActivityLeaseMs } from "../src/pet-behavior.js";
import { resolveReactionSpriteState, type UserSelectableAnimationState } from "../src/reaction-animation-mapping.js";
import type { PetTransientDisplay } from "../src/pet-window-types.js";
import { ExternalAiActivityTracker } from "../src/external-ai-activity.js";

const state: LocalIpcStateSnapshot = {
  preferences: { defaultPetId: "builtin", openDefaultPetOnLaunch: true, speechBubblesEnabled: true },
  pets: { installed: [{ id: "builtin", displayName: "Hoodie Cat", builtIn: true }] },
};

const lease: LeaseSnapshot = {
  leaseId: "lease-1",
  targetKind: "explicit",
  actualTargetPetId: "agent-pet",
  actualTargetPetName: "Agent Pet",
  usingDefaultPet: false,
  expiresAt: 123,
  leaseActive: true,
};

function makeDeps(overrides: Partial<LocalIpcRequestHandlerDeps> = {}): LocalIpcRequestHandlerDeps {
  return {
    getAppVersion: () => "3.5.0",
    getAppStateSnapshot: () => state,
    builtInPet: state.pets.installed[0]!,
    getDefaultPetPaused: () => false,
    isDefaultPetVisible: () => true,
    installPet: async () => state,
    installPetFromFolderWithResult: async () => ({ state, petId: "builtin" }),
    installPetFromZipFileWithResult: async () => ({ state, petId: "builtin" }),
    stat: async () => ({ size: 1, isDirectory: () => false, isFile: () => true }),
    acquireLease: () => lease,
    getLease: () => null,
    heartbeatLease: () => ({ leaseId: "lease-1", expiresAt: 456 }),
    releaseLease: () => ({ released: false }),
    onLeaseAcquired: () => undefined,
    applyAgentPetReaction: () => ({ shown: true }),
    applyAgentPetSay: () => ({ shown: true }),
    applyAgentPetShowMedia: () => ({ shown: true }),
    applyExternalPetReaction: () => ({ shown: true }),
    applyExternalPetSay: () => ({ shown: true }),
    applyExternalPetShowMedia: () => ({ shown: true }),
    broadcastLanPetActivity: () => undefined,
    recordOpenPetsActivity: () => undefined,
    debug: () => undefined,
    logError: () => undefined,
    ...overrides,
  };
}

function request(method: string, params?: unknown, id = "request-1"): string {
  return JSON.stringify({ id, version: 1, token: "token", method, ...(params === undefined ? {} : { params }) });
}

async function handle(raw: string, deps: Partial<LocalIpcRequestHandlerDeps> = {}) {
  return createLocalIpcRequestHandler(makeDeps(deps))(raw, "token");
}

it("会话进度通过已鉴权IPC投影，不落入匿名槽；错误载荷在展示之前拒绝", async () => {
  const tracker = new ExternalAiActivityTracker();
  let effects = 0;
  let anonymous = 0;
  const deps = { applyExternalPetReaction: () => { effects++; return { shown: true }; },
    onUnleasedActivity: () => { anonymous++; }, onExternalAiEvent: (event: Parameters<ExternalAiActivityTracker["record"]>[0]) => { tracker.record(event); } };
  const externalAi = { adapter: "codex", sessionId: "a".repeat(64), event: "tool-start", toolName: "exec", callId: "b".repeat(64), sentAt: Date.now() };
  const result = await handle(request("pet.react", { reaction: "working", externalAi }), deps);
  assert.equal(result.ok, true);
  assert.equal(tracker.petProgress()?.message, "正在调用 JS");
  assert.equal(anonymous, 0);
  assert.equal(effects, 1);
  const invalid = await handle(request("pet.react", { reaction: "working", externalAi: { ...externalAi, tool_input: "secret" } }), deps);
  assert.equal(invalid.ok, false);
  assert.equal(effects, 1);
  const leaseMix = await handle(request("pet.react", { reaction: "working", leaseId: lease.leaseId, externalAi }), { ...deps, getLease: () => lease });
  assert.equal(leaseMix.ok, false);
  assert.equal(effects, 1);
});

{
  const response = await handle(JSON.stringify({ id: "request-1", version: 1, token: "wrong", method: "not-a-method" }));
  assert.deepEqual(response, { id: null, ok: false, error: { code: "invalid_token", message: "Invalid IPC token." } });
}

{
  const response = await handle(request("pet.say"));
  assert.equal(response.id, "request-1");
  assert.deepEqual(response.error, { code: "invalid_params", message: "Message must be a string." });
}

{
  const response = await handle(request("status"), { getAppStateSnapshot: () => { throw new Error("state unavailable"); } });
  assert.deepEqual(response, { id: "request-1", ok: false, error: { code: "internal_error", message: "state unavailable" } });
}

{
  const brokenDefaultState: LocalIpcStateSnapshot = {
    ...state,
    preferences: { ...state.preferences, defaultPetId: "broken-pet" },
    pets: { installed: [...state.pets.installed, { id: "broken-pet", displayName: "Broken Pet", builtIn: false, broken: true }] },
  };
  const status = await handle(request("status"), { getAppStateSnapshot: () => brokenDefaultState });
  assert.deepEqual(status.result, {
    ok: true,
    appRunning: true,
    protocolVersion: 1,
    appVersion: "3.5.0",
    defaultPet: { id: "broken-pet", displayName: "Broken Pet", builtIn: false, broken: true },
    paused: false,
    defaultPetVisible: true,
    openDefaultPetOnLaunch: true,
    speechBubblesEnabled: true,
  });

  let activity: unknown;
  const command = await handle(request("pet.say", { message: "uses fallback" }), {
    getAppStateSnapshot: () => brokenDefaultState,
    recordOpenPetsActivity: (record) => { activity = record; },
  });
  assert.equal(command.ok, true);
  assert.deepEqual(activity, { kind: "say", reaction: undefined, petId: "builtin", surface: "default" });
}

{
  const events: string[] = [];
  const response = await handle(request("lease.acquire", { requestedPetId: "agent-pet", clientPid: 42, sessionNonce: "nonce" }), {
    acquireLease: () => {
      events.push("acquire");
      return lease;
    },
    onLeaseAcquired: (_requestedPetId, acquiredLease, clientPid) => {
      events.push(`hook:${acquiredLease.leaseId}:${clientPid}`);
    },
  });
  assert.deepEqual(events, ["acquire", "hook:lease-1:42"]);
  assert.deepEqual(response.result, lease);
}

{
  const heartbeat = await handle(request("lease.heartbeat", { leaseId: "expired" }), { heartbeatLease: () => { throw new Error("unknown_lease"); } });
  assert.deepEqual(heartbeat.error, { code: "unknown_lease", message: "Unknown or expired lease." });

  const release = await handle(request("lease.release", { leaseId: "missing" }));
  assert.deepEqual(release.result, { released: false });
}

{
  const events: string[] = [];
  let defaultActivity: unknown;
  const defaultReaction = await handle(request("pet.react", { reaction: "success" }), {
    applyExternalPetReaction: () => {
      events.push("apply");
      return { shown: true };
    },
    broadcastLanPetActivity: () => {
      events.push("broadcast");
    },
    recordOpenPetsActivity: (record) => {
      defaultActivity = record;
      events.push("activity");
      throw new Error("activity unavailable");
    },
  });
  assert.deepEqual(events, ["apply", "broadcast", "activity"]);
  assert.deepEqual(defaultActivity, { kind: "react", reaction: "success", petId: "builtin", surface: "default" });
  assert.deepEqual(defaultReaction.result, { ok: true, reaction: "success", shown: true, reason: undefined });

  const broadcastFailure = await handle(request("pet.react", { reaction: "success" }), {
    applyExternalPetReaction: () => {
      events.push("apply-failure");
      return { shown: true };
    },
    broadcastLanPetActivity: () => { throw new Error("LAN unavailable"); },
    recordOpenPetsActivity: () => { events.push("unexpected-activity"); },
  });
  assert.deepEqual(broadcastFailure.error, { code: "internal_error", message: "LAN unavailable" });
  assert.ok(!events.includes("unexpected-activity"));

  const explicitEvents: string[] = [];
  let explicitActivity: unknown;
  const explicitReaction = await handle(request("pet.react", { reaction: "success", leaseId: "lease-1" }), {
    getLease: () => lease,
    applyAgentPetReaction: () => {
      explicitEvents.push("apply");
      return { shown: true };
    },
    broadcastLanPetActivity: () => { explicitEvents.push("broadcast"); },
    recordOpenPetsActivity: (record) => { explicitEvents.push("activity"); explicitActivity = record; },
  });
  assert.deepEqual(explicitEvents, ["apply", "activity"]);
  assert.deepEqual(explicitActivity, { kind: "react", reaction: "success", petId: "agent-pet", surface: "agent" });
  assert.deepEqual(explicitReaction.result, { ok: true, reaction: "success", shown: true, reason: undefined, leaseId: "lease-1" });
}

{
  let activity: unknown;
  let broadcasts = 0;
  const response = await handle(request("pet.say", { message: "hello", reaction: "waving" }), {
    applyExternalPetSay: (_message, _reaction) => ({ shown: true }),
    recordOpenPetsActivity: (record) => { activity = record; },
    broadcastLanPetActivity: () => { broadcasts++; },
  });
  assert.deepEqual(response.result, { ok: true, shown: true, reason: undefined, reaction: "waving" });
  assert.deepEqual(activity, { kind: "say", reaction: "waving", petId: "builtin", surface: "default" });
  assert.equal(broadcasts, 0);
}

{
  const reaction = await handle(request("pet.react", { reaction: "not-a-reaction", leaseId: "missing" }), {
    getLease: () => { throw new Error("lease lookup should not run"); },
  });
  assert.deepEqual(reaction.error, { code: "invalid_params", message: "Invalid pet reaction." });

  const message = await handle(request("pet.say", { message: "", reaction: "not-a-reaction", leaseId: "missing" }), {
    getLease: () => { throw new Error("lease lookup should not run"); },
  });
  assert.deepEqual(message.error, { code: "invalid_params", message: "Message cannot be empty." });

  const sayReaction = await handle(request("pet.say", { message: "hello", reaction: "not-a-reaction", leaseId: "missing" }), {
    getLease: () => { throw new Error("lease lookup should not run"); },
  });
  assert.deepEqual(sayReaction.error, { code: "invalid_params", message: "Invalid pet reaction." });

  let statCalled = false;
  const media = await handle(request("pet.showMedia", { path: "/tmp/pet.png", durationMs: 100, leaseId: "missing" }), {
    stat: async () => {
      statCalled = true;
      return { size: 1, isDirectory: () => false, isFile: () => true };
    },
  });
  assert.deepEqual(media.error, { code: "invalid_params", message: "Media duration must be a number between 1000 and 30000 milliseconds." });
  assert.equal(statCalled, false);

  let installStatCalled = false;
  const installPath = await handle(request("pets.install-local", { path: "relative/pet.zip", kind: "invalid" }), {
    stat: async () => {
      installStatCalled = true;
      return { size: 1, isDirectory: () => false, isFile: () => true };
    },
  });
  assert.deepEqual(installPath.error, { code: "invalid_params", message: "Path must be absolute." });
  assert.equal(installStatCalled, false);

  installStatCalled = false;
  const installKind = await handle(request("pets.install-local", { path: "/tmp/pet.zip", kind: "invalid" }), {
    stat: async () => {
      installStatCalled = true;
      return { size: 1, isDirectory: () => false, isFile: () => true };
    },
  });
  assert.deepEqual(installKind.error, { code: "invalid_params", message: "Local install kind must be zip or folder." });
  assert.equal(installStatCalled, false);
}

{
  const invalidPath = await handle(request("pet.showMedia", { path: "/tmp/pet.txt", leaseId: "missing" }), {
    getLease: () => { throw new Error("lease lookup should not run"); },
  });
  assert.deepEqual(invalidPath.error, { code: "invalid_params", message: "Media path extension must be one of: .png, .jpg, .jpeg, .webp, .gif." });

  const events: string[] = [];
  const response = await handle(request("pet.showMedia", { path: "/tmp/pet.png", leaseId: "missing" }), {
    stat: async () => {
      events.push("stat");
      return { size: 1, isDirectory: () => false, isFile: () => true };
    },
    getLease: () => {
      events.push("lease");
      return null;
    },
  });
  assert.deepEqual(events, ["stat", "lease"]);
  assert.deepEqual(response.error, { code: "unknown_lease", message: "Unknown or expired lease." });
}

{
  const expectedOptions = {
    mediaPath: "/tmp/pet.png",
    message: "hello",
    reaction: "success",
    durationMs: 1235,
    clickUrl: "https://example.com/media",
  } as const;
  let defaultOptions: unknown;
  let explicitOptions: unknown;
  let broadcasts = 0;
  const dependencies = {
    stat: async () => ({ size: 1, isDirectory: () => false, isFile: () => true }),
    applyExternalPetShowMedia: (options: LocalIpcMediaOptions) => {
      defaultOptions = options;
      return { shown: true };
    },
    applyAgentPetShowMedia: (_petId: string, options: LocalIpcMediaOptions) => {
      explicitOptions = options;
      return { shown: true };
    },
    broadcastLanPetActivity: () => { broadcasts++; },
  } satisfies Partial<LocalIpcRequestHandlerDeps>;

  const defaultResponse = await handle(request("pet.showMedia", {
    path: " /tmp/pet.png ",
    message: " hello ",
    reaction: "success",
    durationMs: 1234.6,
    clickUrl: " https://example.com/media ",
  }), dependencies);
  assert.deepEqual(defaultOptions, expectedOptions);
  assert.deepEqual(defaultResponse.result, { ok: true, shown: true, reason: undefined, reaction: "success" });

  const explicitResponse = await handle(request("pet.showMedia", {
    path: "/tmp/pet.png",
    message: "hello",
    reaction: "success",
    durationMs: 1234.6,
    clickUrl: "https://example.com/media",
    leaseId: "lease-1",
  }), { ...dependencies, getLease: () => lease });
  assert.deepEqual(explicitOptions, expectedOptions);
  assert.deepEqual(explicitResponse.result, { ok: true, shown: true, reason: undefined, reaction: "success", leaseId: "lease-1" });
  assert.equal(broadcasts, 0);
}

{
  let installed = false;
  const response = await handle(request("pets.install-local", { path: "/tmp/pet.zip", kind: "zip" }), {
    stat: async () => { throw new Error("stat failed"); },
    installPetFromZipFileWithResult: async () => {
      installed = true;
      return { state, petId: "builtin" };
    },
  });
  assert.deepEqual(response.error, { code: "internal_error", message: "stat failed" });
  assert.equal(installed, false);
}

console.log("local IPC request handler tests passed.");

describe("精确租约活动观察器", () => {
  it("无租约动作仅进入匿名动作回调，身份校验失败和显式租约不进入该回调", async () => {
    const reactions: unknown[] = [];
    const deps = { onUnleasedActivity: (reaction: unknown) => reactions.push(reaction) };
    assert.equal((await handle(request("pet.react", { reaction: "thinking" }), deps)).ok, true);
    assert.equal((await handle(request("pet.react", { reaction: "working", leaseId: "lease-1" }), { ...deps, getLease: () => lease })).ok, true);
    assert.equal((await handle(request("pet.react", { reaction: "invalid" }), deps)).ok, false);
    assert.equal((await handle(JSON.stringify({ id: "bad", version: 1, token: "wrong", method: "pet.react", params: { reaction: "thinking" } }), deps)).ok, false);
    assert.deepEqual(reactions, ["thinking"]);
    const raw = request("pet.react", { reaction: "thinking" });
    assert.deepEqual(await handle(raw, { onUnleasedActivity: () => { throw new Error("观察失败"); } }), await handle(raw));
  });
  it("身份或参数校验失败以及无效租约不发布活动", async () => {
    const observed: LocalIpcAgentActivity[] = [];
    const deps = { onAgentActivity: (activity: LocalIpcAgentActivity) => observed.push(activity), getLease: () => null };
    const requests = [
      JSON.stringify({ id: "x", version: 1, token: "wrong", method: "pet.react", params: { reaction: "thinking", leaseId: "lease-1" } }),
      request("pet.react", { reaction: "invalid", leaseId: "lease-1" }),
      request("pet.react", { reaction: "thinking", leaseId: "expired" }),
      request("pet.say", { message: 123, leaseId: "lease-1" }),
    ];
    for (const raw of requests) assert.equal((await handle(raw, deps)).ok, false);
    assert.deepEqual(observed, []);
  });

  it("有效显式和默认租约事件均归属原lease，观察数据不包含聊天内容", async () => {
    const observed: LocalIpcAgentActivity[] = [];
    const observer = (activity: LocalIpcAgentActivity) => observed.push(activity);
    const reaction = await handle(request("pet.react", { reaction: "thinking", leaseId: "lease-1" }), { getLease: () => lease, onAgentActivity: observer });
    assert.equal(reaction.ok, true);
    const defaultLease: LeaseSnapshot = { ...lease, targetKind: "default", usingDefaultPet: true, actualTargetPetId: "builtin" };
    const spoken = await handle(request("pet.say", { message: "不得交给监测器的内容", reaction: "working", leaseId: "lease-1" }), { getLease: () => defaultLease, onAgentActivity: observer });
    assert.equal(spoken.ok, true);
    assert.deepEqual(observed, [{ leaseId: "lease-1", reaction: "thinking" }, { leaseId: "lease-1", reaction: "working" }]);
  });

  it("没有lease的旧客户端请求可照常显示，但不猜测AI归属", async () => {
    const observed: LocalIpcAgentActivity[] = [];
    const deps = { onAgentActivity: (activity: LocalIpcAgentActivity) => observed.push(activity) };
    assert.equal((await handle(request("pet.react", { reaction: "thinking" }), deps)).ok, true);
    assert.equal((await handle(request("pet.say", { message: "旧客户端" }), deps)).ok, true);
    assert.deepEqual(observed, []);
  });

  it("宿主展示调用失败不发布成功活动，隐藏桌宠不影响有效事件归属", async () => {
    const observed: LocalIpcAgentActivity[] = [];
    const deps = { getLease: () => lease, onAgentActivity: (activity: LocalIpcAgentActivity) => observed.push(activity) };
    const failed = await handle(request("pet.react", { reaction: "working", leaseId: "lease-1" }), { ...deps, applyAgentPetReaction: () => { throw new Error("展示调用失败"); } });
    assert.equal(failed.ok, false);
    assert.equal(observed.length, 0);
    const hidden = await handle(request("pet.react", { reaction: "working", leaseId: "lease-1" }), { ...deps, applyAgentPetReaction: () => ({ shown: false, reason: "user-hidden" }) });
    assert.equal(hidden.ok, true);
    assert.deepEqual(observed, [{ leaseId: "lease-1", reaction: "working" }]);
  });

  it("观察器异常不改变原有成功响应", async () => {
    const raw = request("pet.say", { message: "内容", reaction: "success", leaseId: "lease-1" });
    const ordinary = await handle(raw, { getLease: () => lease });
    const unavailable = await handle(raw, { getLease: () => lease, onAgentActivity: () => { throw new Error("观察器不可用"); } });
    assert.deepEqual(unavailable, ordinary);
  });
});

it("真实 Codex Hooks 经本机 client 与 IPC 保持工作映射，短气泡结束不回待机，终态与失联有界复位", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const root = await mkdtemp(join(tmpdir(), "desktop-pet-ai-linkage-"));
  const discoveryPath = join(root, "ipc.json");
  const scriptPath = join(root, "codex-hook.mjs");
  const cliEntry = createRequire(import.meta.url).resolve("@open-pets/cli");
  const clientEntryPath = createRequire(cliEntry).resolve("@open-pets/client");
  const overrides = { thinking: "waiting", editing: "running" } as const;
  let display: PetTransientDisplay | null = null;
  let animation: UserSelectableAnimationState = "idle";
  let aiActive = false;
  let randomActive = false;
  let displayTimer: ReturnType<typeof setTimeout> | undefined;
  const visible = () => {
    const composed = composePetBehaviorDisplay(display, animation, aiActive, randomActive);
    return composed?.animation ?? resolveReactionSpriteState(composed?.reaction, overrides);
  };
  const behavior = new PetBehaviorController({ getPreferences: () => defaultPetBehaviorPreferences,
    getReactionOverrides: () => overrides, render: (next, ai, random) => { animation = next; aiActive = ai; randomActive = random; } });
  const deps = makeDeps({ onUnleasedActivity: (reaction) => behavior.setExternalAiActivity("local:default", reaction),
    applyExternalPetReaction: (reaction) => {
      display = { reaction };
      if (displayTimer) clearTimeout(displayTimer);
      displayTimer = setTimeout(() => { display = null; }, 4000);
      return { shown: true };
    } });
  const handleRaw = createLocalIpcRequestHandler(deps);
  const token = "temporary-ai-linkage-token-12345";
  const server = net.createServer((socket) => {
    let pending = "";
    socket.on("data", (chunk: Buffer) => {
      pending += chunk.toString("utf8");
      const newline = pending.indexOf("\n");
      if (newline >= 0) void handleRaw(pending.slice(0, newline), token).then((response) => socket.end(JSON.stringify(response) + "\n"));
    });
  });
  const hook = (event: string, tool_name?: string) => new Promise<void>((resolveRun, reject) => {
    const child = spawn(process.execPath, [scriptPath], { windowsHide: true });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code) => {
      try { assert.equal(code, 0); assert.equal(output, ""); resolveRun(); } catch (error) { reject(error); }
    });
    child.stdin.end(JSON.stringify({ hook_event_name: event, ...(tool_name ? { tool_name } : {}), prompt: "私有内容不传给动作观察器" }));
  });
  try {
    await new Promise<void>((resolveReady, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolveReady); });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    await writeFile(discoveryPath, JSON.stringify({ protocol: "openpets-ipc", protocolVersion: 1,
      endpoint: `tcp://127.0.0.1:${address.port}`, token, appVersion: "test", pid: process.pid, platform: process.platform }));
    await writeFile(scriptPath, buildCodexHookScript({ clientEntryPath, discoveryPath }));
    behavior.start();
    await hook("UserPromptSubmit");
    assert.equal(visible(), "waiting", "真实思考事件使用用户映射");
    t.mock.timers.tick(30_000);
    assert.equal(display, null);
    assert.equal(visible(), "waiting", "四秒气泡结束后 AI 动作仍保持");
    behavior.click();
    assert.equal(visible(), "waiting", "安静模式的点击不会盖过工作");
    await hook("PreToolUse", "apply_patch");
    assert.equal(visible(), "running");
    await handleRaw(JSON.stringify({ id: "message", version: 1, token, method: "pet.say", params: { message: "普通消息" } }), token);
    t.mock.timers.tick(30_000);
    assert.equal(visible(), "running", "没有反应的普通消息不结束工作");
    await hook("Stop");
    assert.equal(visible(), "idle");
    await hook("UserPromptSubmit");
    t.mock.timers.tick(petExternalActivityLeaseMs);
    assert.equal(visible(), "idle", "丢失终态时不会永久卡在工作状态");
  } finally {
    behavior.stop();
    if (displayTimer) clearTimeout(displayTimer);
    await new Promise<void>((resolveClosed) => server.close(() => resolveClosed()));
    await rm(root, { recursive: true, force: true });
  }
});

it("实际 Codex 与 ZCode 回调经客户端和鉴权TCP归属两个会话，三文件进度与并行动作保留", async () => {
  const root = await mkdtemp(join(tmpdir(), "desktop-pet-multiple-ai-"));
  const discoveryPath = join(root, "ipc.json");
  const codexScript = join(root, "codex-hook.mjs");
  const zcodeScript = fileURLToPath(new URL("../../assets/agent-hooks/zcode-pet-hook.cjs", import.meta.url));
  const cliEntry = createRequire(import.meta.url).resolve("@open-pets/cli");
  const clientEntryPath = createRequire(cliEntry).resolve("@open-pets/client");
  const tracker = new ExternalAiActivityTracker();
  let animation: UserSelectableAnimationState = "idle";
  const behavior = new PetBehaviorController({ getPreferences: () => defaultPetBehaviorPreferences,
    getReactionOverrides: () => undefined, render: (next) => { animation = next; } });
  const requests: string[] = [];
  const handleRaw = createLocalIpcRequestHandler(makeDeps({ onExternalAiEvent: (event) => {
    const session = tracker.record(event); behavior.setExternalAiActivity(session.id, session.reaction);
  } }));
  const token = "temporary-multiple-ai-test-token-12345";
  const server = net.createServer((socket) => {
    let pending = "";
    socket.on("data", (chunk: Buffer) => {
      pending += chunk.toString("utf8");
      const newline = pending.indexOf("\n");
      if (newline >= 0) {
        const raw = pending.slice(0, newline); requests.push(raw);
        void handleRaw(raw, token).then((response) => socket.end(JSON.stringify(response) + "\n"));
      }
    });
  });
  const hook = (adapter: "codex" | "zcode", payload: Record<string, unknown>) => new Promise<void>((resolveRun, reject) => {
    const args = adapter === "codex" ? [codexScript] : [zcodeScript, "--client-entry", clientEntryPath, "--discovery-file", discoveryPath];
    const child = spawn(process.execPath, args, { windowsHide: true, shell: false });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { output += chunk.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code) => { try { assert.equal(code, 0); assert.equal(output, ""); resolveRun(); } catch (error) { reject(error); } });
    child.stdin.end(JSON.stringify({ session_id: `${adapter}-real-session`, cwd: "C:/private/workspace", ...payload }));
  });
  try {
    await new Promise<void>((ready, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", ready); });
    const address = server.address(); assert.ok(address && typeof address !== "string");
    await writeFile(discoveryPath, JSON.stringify({ protocol: "openpets-ipc", protocolVersion: 1,
      endpoint: `tcp://127.0.0.1:${address.port}`, token, appVersion: "test", pid: process.pid, platform: process.platform }));
    await writeFile(codexScript, buildCodexHookScript({ clientEntryPath, discoveryPath }));
    behavior.start();
    await hook("codex", { hook_event_name: "PreToolUse", tool_name: "exec", tool_use_id: "js-call", tool_input: { code: "secret" } });
    assert.equal(tracker.petProgress()?.message, "正在调用 JS");
    await hook("zcode", { hook_event_name: "PreToolUse", tool_name: "Bash", tool_use_id: "bash-call" });
    assert.equal(tracker.petProgress()?.otherActiveSessions, 1);
    await hook("codex", { hook_event_name: "PostToolUse", tool_name: "apply_patch", tool_use_id: "patch-call",
      tool_response: { output: "Success. Updated the following files:\nM a.ts\nA b.ts\nD c.ts\n" } });
    assert.equal(tracker.sessions().find((session) => session.label === "Codex")?.progress.editedFileCount, 3);
    await hook("codex", { hook_event_name: "Stop" });
    assert.equal(animation, resolveReactionSpriteState("running", undefined));
    assert.equal(tracker.sessions().length, 2);
    assert.ok(requests.every((raw) => !raw.includes("private") && !raw.includes("secret") && !raw.includes("real-session") && !raw.includes("a.ts")));
  } finally {
    behavior.stop();
    await new Promise<void>((closed) => server.close(() => closed()));
    await rm(root, { recursive: true, force: true });
  }
});
