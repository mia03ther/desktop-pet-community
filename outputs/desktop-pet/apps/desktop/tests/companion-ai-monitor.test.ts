import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it, type TestContext } from "node:test";
import { CompanionAiMonitor, deriveCompanionAgentActivity, validateCompanionManualQuotaInput } from "../src/companion-ai-monitor.js";
import type { CompanionAiAgentEvidence, CompanionAiAssistantEvidence, CompanionAiProfileEvidence, CompanionAiTaskEvidence, CompanionAiTokenUsage, CompanionAiOfficialQuotaSnapshot } from "../src/companion-ai-monitor-types.js";

const now = 1_800_000_000_000;
const profile: CompanionAiProfileEvidence = { id: "profile-a", label: "已选配置", adapter: "openai-compatible", model: "model-a", configuration: "ready" };
const agent: CompanionAiAgentEvidence = { id: "session-a", label: "桥接会话", leaseId: "lease-a", source: "local-ipc", activity: "busy", lastSeenAt: now };

function harness(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "companion-ai-monitor-test-"));
  const statePath = join(directory, "quota.json");
  const inputs = {
    now,
    profiles: [profile] as CompanionAiProfileEvidence[],
    assistant: null as CompanionAiAssistantEvidence | null,
    tasks: [] as CompanionAiTaskEvidence[],
    usage: [] as CompanionAiTokenUsage[],
    agents: [] as CompanionAiAgentEvidence[],
    officialQuotas: [] as CompanionAiOfficialQuotaSnapshot[],
  };
  const create = (path = statePath) => new CompanionAiMonitor({
    statePath: path, now: () => inputs.now, getProfiles: () => inputs.profiles,
    getAssistant: () => inputs.assistant, getAgentSessions: () => inputs.agents,
    getTasks: () => inputs.tasks, getTokenUsage: () => inputs.usage,
    getOfficialQuota: () => inputs.officialQuotas,
  });
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return { inputs, statePath, directory, create, monitor: create() };
}

describe("AI 监测的状态来源和额度边界", () => {
  it("外部工具会话保留各自进度且额度未知，不复用桌宠对话消耗", (t) => {
    const { inputs, monitor } = harness(t);
    inputs.usage = [{ profileId: profile.id, inputTokens: 123, outputTokens: 456, source: "provider-response", recordedAt: now }];
    inputs.agents = ["codex", "zcode"].map((adapter, index) => ({ id: `session-${index}`, label: adapter,
      source: "agent-hook", activity: "busy", lastSeenAt: now,
      progress: { adapter: adapter as "codex" | "zcode", sessionId: String(index).repeat(64), phase: "tool-start", toolName: "exec",
        editedFileCount: index + 2, fileCountLimited: false, activeToolCount: 1 } }));
    const snapshot = monitor.getSnapshot();
    assert.equal(snapshot.profiles[0]?.tokenUsage?.inputTokens, 123);
    assert.deepEqual(snapshot.agents.map((row) => row.progress?.editedFileCount), [2, 3]);
    assert.ok(snapshot.agents.every((row) => row.quota.status === "unsupported" && row.quota.source === "none"));
    assert.ok(snapshot.agents.every((row) => !JSON.stringify(row).includes("123")));
  });
  it("配置就绪既不是在线证明也不是工作证明，未接额度为不支持且数值为空", (t) => {
    const { monitor } = harness(t);
    const row = monitor.getSnapshot().profiles[0];
    assert.equal(row.activity.state, "unknown");
    assert.equal(row.activity.source, "provider-profile");
    assert.equal(row.quota.status, "unsupported");
    assert.equal(row.quota.remaining, null);
    assert.equal(row.tokenUsage, null);
  });

  it("未就绪的配置显示未连接，不以零额度伪装缺失", (t) => {
    const { monitor, inputs } = harness(t);
    inputs.profiles = [{ ...profile, configuration: "missing-secret" }];
    assert.equal(monitor.getSnapshot().profiles[0].activity.state, "disconnected");
    assert.equal(monitor.getSnapshot().profiles[0].quota.remaining, null);
  });

  it("官方账户余额与key限制独立保留口径，五分钟过期不覆盖手动记录", (t) => {
    const { monitor, inputs, create } = harness(t);
    inputs.profiles.push({ ...profile, id: "profile-b" });
    inputs.officialQuotas = [
      { profileId: profile.id, provider: "deepseek", kind: "account-balance", status: "fresh", recordedAt: now,
        balances: [{ unit: "CNY", remaining: 5 }], reason: "账户余额夹具" },
      { profileId: "profile-b", provider: "openrouter", kind: "key-spending-limit", status: "fresh", recordedAt: now,
        balances: [{ unit: "USD", remaining: null }], reason: "该key没有支出上限" },
    ];
    monitor.setManualQuota(profile.id, { remaining: 80, unit: "percent" });
    const rows = monitor.getSnapshot().profiles;
    assert.equal(rows[0].officialQuota?.kind, "account-balance");
    assert.equal(rows[1].officialQuota?.kind, "key-spending-limit");
    assert.equal(rows[1].officialQuota?.balances[0].remaining, null);
    assert.equal(rows[0].quota.remaining, 80);
    inputs.now += 5 * 60_000 + 1;
    assert.equal(monitor.getSnapshot().profiles[0].officialQuota?.status, "stale");
    assert.equal(monitor.getSnapshot().profiles[0].quota.status, "manual");
    inputs.officialQuotas = [];
    assert.equal(create().getSnapshot().profiles[0].officialQuota, null);
    assert.equal(create().getSnapshot().profiles[0].quota.remaining, 80);
  });

  it("只根据本桌宠当前活动回合判断忙碌，结束回合后为空闲", (t) => {
    const { monitor, inputs } = harness(t);
    inputs.assistant = { profileId: profile.id, activeTurnId: "turn-a", activity: "thinking", lastSeenAt: now - 600_000 };
    assert.equal(monitor.getSnapshot().profiles[0].activity.state, "busy");
    assert.equal(monitor.getSnapshot().profiles[0].activity.source, "host-assistant");
    inputs.assistant = { profileId: profile.id, activity: "idle", lastSeenAt: now };
    assert.equal(monitor.getSnapshot().profiles[0].activity.state, "idle");
  });

  it("任务排队不算推理，运行任务按具体配置归属", (t) => {
    const { monitor, inputs } = harness(t);
    inputs.profiles.push({ ...profile, id: "profile-b" });
    inputs.tasks = [{ id: "task-a", profileId: profile.id, state: "queued", updatedAt: now }];
    assert.equal(monitor.getSnapshot().profiles[0].activity.state, "unknown");
    inputs.tasks[0].state = "running";
    const result = monitor.getSnapshot();
    assert.equal(result.profiles[0].activity.state, "busy");
    assert.equal(result.profiles[0].activity.source, "host-task");
    assert.deepEqual(result.profiles[0].activeTaskIds, ["task-a"]);
    assert.equal(result.profiles[1].activity.state, "unknown");
  });

  it("心跳仅证明连接；旧工作事件即使续心跳也过期，结束租约为失联", () => {
    const lease = { lastHeartbeatAt: now, expiresAt: now + 15_000 };
    assert.equal(deriveCompanionAgentActivity({ ...agent, lastSeenAt: null }, lease, now).state, "unknown");
    assert.equal(deriveCompanionAgentActivity(agent, lease, now).state, "busy");
    assert.equal(deriveCompanionAgentActivity({ ...agent, lastSeenAt: now - 90_001 }, lease, now).state, "stale");
    assert.equal(deriveCompanionAgentActivity(agent, { ...lease, expiresAt: now }, now).state, "disconnected");
    assert.equal(deriveCompanionAgentActivity(agent, null, now).state, "disconnected");
    assert.equal(deriveCompanionAgentActivity(agent, undefined, now).state, "unknown");
  });

  it("无租约官方 hook 仍需新鲜事件，未来异常时间不显示工作中", () => {
    assert.equal(deriveCompanionAgentActivity({ ...agent, leaseId: undefined, source: "agent-hook", activity: "idle" }, undefined, now).state, "idle");
    assert.equal(deriveCompanionAgentActivity({ ...agent, leaseId: undefined, lastSeenAt: now + 60_001 }, undefined, now).state, "unknown");
  });

  it("手动额度跨重启保存，区分配置和单位，过期或重置后须重新核对", (t) => {
    const { monitor, inputs, create } = harness(t);
    inputs.profiles.push({ ...profile, id: "profile-b" });
    monitor.setManualQuota(profile.id, { remaining: 25, unit: "percent", resetsAt: now + 60_000 });
    const restarted = create();
    const rows = restarted.getSnapshot().profiles;
    assert.equal(rows[0].quota.source, "manual");
    assert.equal(rows[0].quota.remaining, 25);
    assert.equal(rows[0].quota.recordedAt, now);
    assert.equal(rows[1].quota.remaining, null);
    inputs.now += 60_000;
    assert.equal(restarted.getSnapshot().profiles[0].quota.status, "stale");
    restarted.setManualQuota(profile.id, { remaining: 5, unit: "USD" });
    inputs.now += 24 * 60 * 60 * 1000 + 1;
    assert.equal(restarted.getSnapshot().profiles[0].quota.status, "stale");
    restarted.clearManualQuota(profile.id);
    assert.equal(create().getSnapshot().profiles[0].quota.status, "unsupported");
  });

  it("token 变化不会改变手动额度，也不能生成账户余量", (t) => {
    const { monitor, inputs } = harness(t);
    inputs.usage = [{ profileId: profile.id, inputTokens: 100, outputTokens: 20, source: "provider-response", recordedAt: now }];
    assert.equal(monitor.getSnapshot().profiles[0].tokenUsage?.inputTokens, 100);
    assert.equal(monitor.getSnapshot().profiles[0].quota.remaining, null);
    monitor.setManualQuota(profile.id, { remaining: 4, unit: "credits" });
    inputs.usage[0].inputTokens = 900;
    const row = monitor.getSnapshot().profiles[0];
    assert.equal(row.tokenUsage?.inputTokens, 900);
    assert.equal(row.quota.remaining, 4);
    assert.equal(row.quota.source, "manual");
  });

  it("已用与剩余可独立手动记录，旧记录不伪造已用，真实用量按具体配置聚合", (t) => {
    const { monitor, inputs, create } = harness(t);
    monitor.setManualQuota(profile.id, { remaining: 40, used: 60, unit: "percent" });
    assert.equal(create().getSnapshot().profiles[0].quota.used, 60);
    inputs.usage = [
      { profileId: profile.id, inputTokens: 10, outputTokens: 2, source: "provider-response", recordedAt: now },
      { profileId: profile.id, inputTokens: 20, outputTokens: 5, source: "provider-response", recordedAt: now },
      { profileId: "other", inputTokens: 100, outputTokens: 100, source: "provider-response", recordedAt: now },
    ];
    assert.deepEqual(monitor.getSnapshot().profiles[0].tokenUsageTotal, { inputTokens: 30, outputTokens: 7, requestCount: 2 });
    assert.equal(monitor.getSnapshot().profiles[0].quota.remaining, 40);
    monitor.setManualQuota(profile.id, { remaining: 10, unit: "credits" });
    assert.equal(create().getSnapshot().profiles[0].quota.used, null);
    assert.throws(() => validateCompanionManualQuotaInput({ remaining: 1, used: -1, unit: "credits" }));
    assert.throws(() => validateCompanionManualQuotaInput({ remaining: 1, used: 101, unit: "percent" }));
  });

  it("摘要只选安全字段，不转发意外注入的凭据、URL 或对话文字", (t) => {
    const { monitor, inputs, statePath } = harness(t);
    const extraProfile = { ...profile, secret: "测试密钥", baseUrl: "https://example.invalid", prompt: "测试对话" };
    inputs.profiles = [extraProfile];
    const row = monitor.setManualQuota(profile.id, { remaining: 0, unit: "requests" }).profiles[0];
    assert.equal(Object.hasOwn(row, "secret"), false);
    assert.equal(Object.hasOwn(row, "baseUrl"), false);
    assert.equal(Object.hasOwn(row, "prompt"), false);
    const saved = JSON.parse(readFileSync(statePath, "utf8"));
    assert.deepEqual(Object.keys(saved), ["version", "quotas"]);
    assert.equal(row.quota.remaining, 0);
  });

  it("无效额度与百分比拒绝保存，读取损坏或写入失败不替换成零", (t) => {
    const { inputs, statePath, directory, create } = harness(t);
    for (const invalid of [{ remaining: -1, unit: "credits" }, { remaining: NaN, unit: "credits" }, { remaining: 101, unit: "percent" }, { remaining: 1, unit: "unknown" }]) {
      assert.throws(() => validateCompanionManualQuotaInput(invalid));
    }
    writeFileSync(statePath, "{broken", "utf8");
    const corrupt = create();
    assert.ok(corrupt.getSnapshot().lastError);
    assert.equal(corrupt.getSnapshot().profiles[0].quota.remaining, null);
    const unwritable = create(join(directory, "missing-directory", "quota.json"));
    assert.throws(() => unwritable.setManualQuota(profile.id, { remaining: 30, unit: "percent" }));
    assert.equal(unwritable.getSnapshot().profiles[0].quota.remaining, null);
    inputs.profiles = [];
    assert.throws(() => corrupt.setManualQuota(profile.id, { remaining: 30, unit: "percent" }));
  });

  it("状态所有者不可读取时明确报错，不宣称已空闲", (t) => {
    const { directory } = harness(t);
    const monitor = new CompanionAiMonitor({ statePath: join(directory, "other.json"), getProfiles: () => { throw new Error("不可用"); }, getAssistant: () => null, getAgentSessions: () => [] });
    assert.ok(monitor.getSnapshot().lastError);
    assert.deepEqual(monitor.getSnapshot().profiles, []);
  });
});
