import assert from "node:assert/strict";
import { createOpenPetsClient, type AgentActivityEvent, type OpenPetsClient } from "@open-pets/client";
import { buildOpenClawCommand, classifyOpenClawStatus, parseOpenClawPluginList, planOpenClawMutation } from "./management.js";
import { createOpenPetsOpenClawRuntime } from "./runtime.js";

const owned = { id: "openpets", enabled: false, version: "3.2.0", install: { source: "npm", spec: "@open-pets/openclaw@3.2.0" } };
assert.deepEqual(buildOpenClawCommand("install", "3.3.0"), { command: "openclaw", args: ["plugins", "install", "npm:@open-pets/openclaw@3.3.0"] });
assert.deepEqual(buildOpenClawCommand("update", "3.3.0"), { command: "openclaw", args: ["plugins", "update", "@open-pets/openclaw@3.3.0"] });
assert.deepEqual(buildOpenClawCommand("remove"), { command: "openclaw", args: ["plugins", "uninstall", "openpets", "--force"] });
const disabled = classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [owned] }, inspect: { plugin: owned, install: owned.install } });
assert.equal(disabled.state, "installed-disabled");
assert.equal(disabled.trackedSource, "official-package");
assert.deepEqual(planOpenClawMutation(disabled, "configure", "3.2.0"), ["enable"]);
const disabledWithoutDuplicatedVersion = classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [owned] }, inspect: { plugin: { id: "openpets", enabled: false }, install: owned.install } });
assert.equal(disabledWithoutDuplicatedVersion.installedVersion, "3.2.0");
assert.deepEqual(planOpenClawMutation(disabledWithoutDuplicatedVersion, "configure", "3.2.0"), ["enable"]);
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [] }, inspect: undefined, inspectMissing: true }).state, "not-installed");
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [] }, inspect: {} }).state, "indeterminate");
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [{ id: "openpets", enabled: true }] }, inspect: { plugin: { id: "openpets", enabled: true }, install: { source: "path", spec: "/tmp/openpets" } } }).state, "conflict");
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [{ id: "openpets", enabled: true }] }, inspect: { plugin: { id: "openpets", enabled: true }, install: { source: "path", spec: "/tmp/openpets" } } }).trackedSource, "custom-source");
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [{ id: "openpets", enabled: true }] }, inspect: { plugin: { id: "openpets", enabled: true } } }).state, "invalid");
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [{ id: "openpets", enabled: true }] }, inspect: { plugin: { id: "openpets", enabled: true } } }).trackedSource, "untracked");
const enabled = classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [{ id: "openpets", enabled: true }] }, inspect: { plugin: { id: "openpets", enabled: true, status: "loaded", dependencyStatus: { requiredInstalled: true }, error: "missing dependency" }, install: { source: "npm", spec: "@open-pets/openclaw@3.2.0" } } });
assert.equal(enabled.state, "installed-enabled");
assert.deepEqual(planOpenClawMutation(enabled, "configure", "3.2.0"), []);
assert.deepEqual(planOpenClawMutation(enabled, "configure", "3.3.0"), ["update", "enable"]);
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: { plugins: [{ id: "openpets", enabled: true, dependencyStatus: { requiredInstalled: false } }] }, inspect: { plugin: { id: "openpets", enabled: true, dependencyStatus: { requiredInstalled: false } }, install: owned.install } }).state, "invalid");
assert.equal(classifyOpenClawStatus({ version: "2026.7.1", list: {}, inspect: {}, nixMode: true }).state, "management-disabled");
assert.equal(classifyOpenClawStatus({ version: "2026.6.0", list: {}, inspect: {} }).state, "unsupported-host");
const largeColdInventory = JSON.stringify({ plugins: Array.from({ length: 3_000 }, (_, index) => ({ id: `other-plugin-${index}`, enabled: false })) });
assert.ok(Buffer.byteLength(largeColdInventory, "utf8") > 16 * 1024, "cold inventory fixture must exceed the old output cap");
assert.deepEqual(parseOpenClawPluginList(JSON.parse(largeColdInventory)), {});
const largeColdStatus = classifyOpenClawStatus({ version: "2026.7.1", list: JSON.parse(largeColdInventory), inspect: undefined, inspectMissing: true });
assert.equal(largeColdStatus.state, "not-installed");
assert.deepEqual(planOpenClawMutation(largeColdStatus, "configure", "3.3.0"), ["install", "enable"]);

const queued: Array<() => Promise<void>> = [];
const calls: string[] = [];
const fakeClient = {
  say: async () => { calls.push("say"); },
  react: async (reaction: string) => { calls.push(reaction); },
} as unknown as OpenPetsClient;
const runtime = createOpenPetsOpenClawRuntime({ clientFactory: () => fakeClient, schedule: (work) => { queued.push(work); }, now: () => 1_000, debug: true });
let payloadRead = false;
const hostilePayload = new Proxy({}, { get() { payloadRead = true; throw new Error("payload accessed"); } });
(runtime.handleModelCallStarted as unknown as (event: unknown) => void)(hostilePayload);
(runtime.handleBeforeToolCall as unknown as (event: unknown) => void)(hostilePayload);
assert.equal(queued.length, 1, "only one OpenPets dispatch may be pending");
assert.equal(payloadRead, false, "OpenClaw hook payloads are observation-only");
await queued.shift()!();
assert.deepEqual(calls, ["say"], "model activity uses curated speech");
runtime.handleModelCallStarted();
assert.equal(queued.length, 0, "thinking activity is cooldown bounded");
const failedQueue: Array<() => Promise<void>> = [];
const debugCodes: string[] = [];
const opaqueError = new Proxy({}, { get() { throw new Error("opaque error property accessed"); } });
const failingClient = { say: async () => {}, react: async () => { throw opaqueError; } } as unknown as OpenPetsClient;
const failingRuntime = createOpenPetsOpenClawRuntime({ clientFactory: () => failingClient, schedule: (work) => { failedQueue.push(work); }, now: () => 1_000, debug: true, debugLog: (code) => { debugCodes.push(code); } });
failingRuntime.handleBeforeToolCall();
await failedQueue.shift()!();
assert.deepEqual(debugCodes, ["dispatch_failed"], "opaque failures use only a closed debug signal");
{
  const events: AgentActivityEvent[] = [];
  const scheduled: Array<() => Promise<void>> = [];
  const client = createOpenPetsClient({ remote: false });
  const observing = createOpenPetsOpenClawRuntime({
    now: () => 1_000,
    schedule: (work) => { scheduled.push(work); },
    clientFactory: () => ({ ...client, reportActivity: async (event) => { events.push(event); } }),
  });
  (observing.handleModelCallStarted as unknown as (event: unknown) => void)(hostilePayload);
  await scheduled.shift()?.();
  (observing.handleBeforeToolCall as unknown as (event: unknown) => void)(hostilePayload);
  await scheduled.shift()?.();
  assert.equal(payloadRead, false, "详细气泡仍不读取任何宿主事件原文");
  assert.deepEqual(events.map((event) => event.event), ["turn-start", "tool-start"]);
  assert.equal(events[0]?.sessionId, events[1]?.sessionId, "同一个本机运行实例使用同一个匿名活动槽");
  assert.ok(events.every((event) => event.adapter === "openclaw" && !event.toolName && !event.callId && !event.editedFileIds && !event.turnId));
  const anotherInstance = createOpenPetsOpenClawRuntime({
    schedule: (work) => { scheduled.push(work); },
    clientFactory: () => ({ ...client, reportActivity: async (event) => { events.push(event); } }),
  });
  anotherInstance.handleModelCallStarted();
  await scheduled.shift()?.();
  assert.notEqual(events[2]?.sessionId, events[0]?.sessionId, "匿名槽不会误合并不同插件实例");
  assert.ok(events.every((event) => event.event !== "turn-end" && event.event !== "session-end"), "没有可靠结束钩子时不制造完成事件");
}
console.error("OpenClaw package contract validation passed.");
