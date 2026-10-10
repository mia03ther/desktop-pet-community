import assert from "node:assert/strict";
import { test } from "node:test";
import { CodexQuotaMonitor, codexQuotaFreshnessMs, codexQuotaPollIntervalMs } from "../src/codex-quota-monitor.js";
import { unknownCodexQuota } from "../src/codex-quota-client.js";
import type { CodexQuotaSnapshot } from "../src/codex-quota-types.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}
const fresh = (recordedAt: number): CodexQuotaSnapshot => ({ ...unknownCodexQuota("官方测试窗口"), status: "fresh", recordedAt,
  windows: [{ limitId: "codex", label: "Codex", window: "primary", usedPercent: 20, remainingPercent: 80, windowDurationMins: 300, resetsAt: null }] });

test("默认关闭不查询；显式启用合并重复查询，关闭后忽略已取消的迟到结果", async () => {
  let enabled = false;
  const calls: AbortSignal[] = [];
  let pending = deferred<CodexQuotaSnapshot>();
  const monitor = new CodexQuotaMonitor({ getEnabled: () => enabled, setEnabled: (value) => { enabled = value; },
    getContext: () => ({ command: "fixture.exe", cwd: ".", env: {} }),
    query: async (_context, signal) => { calls.push(signal); return pending.promise; },
  });
  try {
    assert.equal(monitor.getSnapshot().status, "disabled");
    await monitor.refresh();
    assert.equal(calls.length, 0);
    const enabling = monitor.setEnabled(true);
    const overlap = monitor.refresh();
    await Promise.resolve();
    assert.equal(calls.length, 1);
    assert.equal(monitor.getSnapshot().status, "checking");
    pending.resolve(fresh(Date.now()));
    await Promise.all([enabling, overlap]);
    assert.equal(monitor.getSnapshot().windows[0]?.remainingPercent, 80);
    pending = deferred<CodexQuotaSnapshot>();
    const late = monitor.refresh();
    await Promise.resolve();
    await monitor.setEnabled(false);
    assert.equal(calls.at(-1)?.aborted, true);
    pending.resolve(fresh(Date.now()));
    await late;
    assert.equal(monitor.getSnapshot().status, "disabled");
    assert.deepEqual(monitor.getSnapshot().windows, []);
  } finally { monitor.dispose(); }
});

test("启用后两分钟轮询，关闭与退出清理计时器，过期记录不会当作实时额度", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1800000000000 });
  let enabled = true;
  let calls = 0;
  const monitor = new CodexQuotaMonitor({ getEnabled: () => enabled, setEnabled: (value) => { enabled = value; },
    getContext: () => ({ command: "fixture.exe", cwd: ".", env: {} }),
    query: async () => { calls++; return fresh(Date.now()); },
  });
  try {
    await monitor.refresh();
    assert.equal(calls, 1);
    t.mock.timers.tick(codexQuotaPollIntervalMs);
    await monitor.refresh();
    assert.equal(calls, 2);
    t.mock.timers.setTime(Date.now() + codexQuotaFreshnessMs + 1);
    assert.equal(monitor.getSnapshot().status, "stale");
    await monitor.setEnabled(false);
    t.mock.timers.tick(codexQuotaPollIntervalMs * 2);
    await Promise.resolve();
    assert.equal(calls, 2);
    await monitor.setEnabled(true);
    await monitor.refresh();
    monitor.dispose();
    t.mock.timers.tick(codexQuotaPollIntervalMs * 2);
    await Promise.resolve();
    assert.equal(calls, 3);
  } finally { monitor.dispose(); }
});

test("更换 CLI 清掉旧账户窗口并取消旧查询；原工具失败明确未知", async () => {
  let command = "first.exe";
  const pending = deferred<CodexQuotaSnapshot>();
  let originalSignal: AbortSignal | undefined;
  const monitor = new CodexQuotaMonitor({ getEnabled: () => true, setEnabled: () => {},
    getContext: () => ({ command, cwd: ".", env: {} }),
    query: async (context, signal) => {
      if (context.command === "first.exe") { originalSignal = signal; return pending.promise; }
      throw new Error("不能暴露原始账户诊断");
    },
  });
  try {
    await Promise.resolve();
    const old = monitor.refresh();
    command = "second.exe";
    assert.equal(monitor.getSnapshot().status, "checking");
    assert.equal(originalSignal?.aborted, true);
    const next = await monitor.refresh();
    assert.equal(next.status, "unknown");
    assert.deepEqual(next.windows, []);
    assert.equal(next.reason.includes("不能暴露"), false);
    pending.resolve(fresh(Date.now()));
    await old;
    assert.equal(monitor.getSnapshot().status, "unknown");
  } finally { monitor.dispose(); }
});
