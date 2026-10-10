import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, type TestContext } from "node:test";
import { CompanionToolsService } from "../src/companion-tools.js";
import type { CompanionDiagnosticFinding, CompanionDiagnosticsSnapshot } from "../src/companion-diagnostics-types.js";
import { checkCompanionUninstallDirectory, type CompanionUninstallDirectoryEvidence } from "../src/companion-uninstall-check.js";

const minute = 60_000;
const hour = 60 * minute;
const startingTime = 1_800_000_000_000;

function finding(kind: "disk" | "cpu" | "memory", id = `${kind}:pressure`): CompanionDiagnosticFinding {
  return { id, kind, title: "需要复查", evidence: "本次测量值达到提醒条件。", explanation: "测量值只是调查线索。" };
}

function sample(findings: CompanionDiagnosticFinding[] = [], apps: string[] = ["软件甲"], complete = true): CompanionDiagnosticsSnapshot {
  return {
    version: 1,
    sampledAt: startingTime,
    sampleDurationMs: 1000,
    cpuPercent: 10,
    memory: { totalBytes: 1000, availableBytes: 500, usedPercent: 50 },
    disks: [], processes: [], startupItems: [], windows: [], collectionIssues: [], coverage: [],
    installedApps: apps.map((name) => ({ id: `登记:${name}`, name, version: "1.0", publisher: "", installLocation: "", source: "登记清单" })),
    installedAppsComplete: complete,
    findings,
  };
}

function harness(t: TestContext, initial = sample()) {
  const directory = mkdtempSync(join(tmpdir(), "companion-tools-test-"));
  const statePath = join(directory, "state.json");
  const instances: CompanionToolsService[] = [];
  const state = {
    now: startingTime,
    sample: initial,
    sampleTime: null as number | null,
    failure: null as Error | null,
    visible: true,
    collected: 0,
    attempts: [] as string[],
    notifications: [] as string[],
    checkDirectory: null as typeof checkCompanionUninstallDirectory | null,
  };
  function createService(): CompanionToolsService {
    const service = new CompanionToolsService({
      statePath,
      now: () => state.now,
      collect: async () => {
        state.collected++;
        if (state.failure) throw state.failure;
        return structuredClone({ ...state.sample, sampledAt: state.sampleTime ?? state.now });
      },
      notify: (item) => {
        state.attempts.push(item.id);
        if (state.visible) state.notifications.push(item.id);
        return state.visible;
      },
      checkDirectory: (location, signal) => (state.checkDirectory ?? checkCompanionUninstallDirectory)(location, signal),
    });
    instances.push(service);
    return service;
  }
  t.after(() => {
    for (const service of instances) service.stop();
    rmSync(directory, { recursive: true, force: true });
  });
  const service = createService();
  return { state, service, createService, directory, statePath };
}

function locatedSample(location: string): CompanionDiagnosticsSnapshot {
  const snapshot = sample();
  snapshot.installedApps[0].installLocation = location;
  return snapshot;
}

function deferredDirectoryCheck() {
  let complete!: (value: CompanionUninstallDirectoryEvidence) => void;
  const result = new Promise<CompanionUninstallDirectoryEvidence>((resolve) => { complete = resolve; });
  return { result, complete };
}

async function removedRecord(t: TestContext) {
  const context = harness(t);
  const location = join(context.directory, "安装目录");
  mkdirSync(location);
  context.state.sample = locatedSample(location);
  await context.service.refresh();
  context.state.sample = sample([], []);
  context.state.now += minute;
  const snapshot = await context.service.refresh();
  return { ...context, record: snapshot.uninstallRecords[0], location };
}

async function enable(service: CompanionToolsService): Promise<void> {
  service.setMonitoring(true);
  await service.refresh(true);
}

describe("电脑助手的本地监测和提醒行为", () => {
  it("资源建议从本次证据产生，忽略提醒不删建议，过期后不继续提供操作结论", async (t) => {
    const initial = sample([finding("memory")]);
    initial.memory = { totalBytes: 1000, availableBytes: 100, usedPercent: 90 };
    const { state, service } = harness(t, initial);
    assert.deepEqual(service.getSnapshot().resourceRecommendations, []);
    const refreshed = await service.refresh();
    assert.equal(refreshed.resourceRecommendations[0]?.kind, "memory");
    assert.equal(state.notifications.length, 0);
    service.setFindingDisposition("memory:pressure", "ignore");
    assert.equal(service.getSnapshot().findings.length, 0);
    assert.equal(service.getSnapshot().resourceRecommendations.length, 1);
    state.now += 15 * minute + 1;
    assert.deepEqual(service.getSnapshot().resourceRecommendations, []);
    assert.equal(state.collected, 1);
  });

  it("默认不开后台监测，主动检查可立即展示单次磁盘发现", async (t) => {
    const { state, service } = harness(t, sample([finding("disk", "disk:C:\\")]));
    service.start();
    assert.equal(service.getSnapshot().settings.monitorEnabled, false);
    assert.equal(state.collected, 0);
    assert.equal(service.getSnapshot().diagnostics, null);
    const result = await service.refresh(true);
    assert.equal(state.collected, 1);
    assert.equal(result.findings[0].id, "disk:C:\\");
    assert.equal(state.notifications.length, 0);
  });

  it("忽略、延后一小时和恢复可跨重启保存，后台监测选择也持久化", async (t) => {
    const { state, service, createService } = harness(t, sample([finding("disk", "disk:C:\\"), finding("disk", "disk:D:\\")]));
    await service.refresh();
    service.setFindingDisposition("disk:C:\\", "ignore");
    service.setFindingDisposition("disk:D:\\", "later");
    const restarted = createService();
    await restarted.refresh();
    assert.deepEqual(restarted.getSnapshot().findings, []);
    state.now += hour - 1;
    assert.deepEqual(restarted.getSnapshot().findings, []);
    state.now += 1;
    assert.deepEqual(restarted.getSnapshot().findings.map((item) => item.id), ["disk:D:\\"]);
    assert.deepEqual(restarted.resetIgnoredFindings().findings.map((item) => item.id), ["disk:C:\\", "disk:D:\\"]);
    await enable(restarted);
    assert.equal(createService().getSnapshot().settings.monitorEnabled, true);
  });

  it("不完整软件清单不会误报移除或覆盖完整基线，后续完整清单再比较新增和移除", async (t) => {
    const { state, service } = harness(t, sample([], ["软件甲"]));
    await service.refresh();
    assert.equal(service.getSnapshot().findings.length, 0);
    state.sample = sample([], ["软件乙"], false);
    state.now += 5 * minute;
    assert.equal((await service.refresh()).findings.length, 0);
    state.sample = sample([], ["软件乙"], true);
    state.now += 5 * minute;
    const changed = (await service.refresh()).findings;
    assert.equal(changed.filter((item) => item.kind === "software").length, 2);
    assert.ok(changed.some((item) => item.title.includes("软件乙") && item.title.includes("新增")));
    assert.ok(changed.some((item) => item.title.includes("软件甲") && item.title.includes("移除")));
  });

  for (const kind of ["cpu", "memory"] as const) {
    it(`${kind} 至少两次高占用样本且相隔一分钟才提醒`, async (t) => {
      const { state, service } = harness(t, sample([finding(kind)]));
      await enable(service);
      assert.equal(state.notifications.length, 0);
      state.now += minute;
      await service.refresh(true);
      assert.deepEqual(state.notifications, [`${kind}:pressure`]);
    });

    it(`${kind} 的两次采样过近时不提醒`, async (t) => {
      const { state, service } = harness(t, sample([finding(kind)]));
      await enable(service);
      state.now += minute - 1;
      await service.refresh(true);
      assert.equal(state.notifications.length, 0);
    });

    it(`${kind} 连续采样间隔十五分钟仍可提醒，超过十五分钟须重新确认`, async (t) => {
      const within = harness(t, sample([finding(kind)]));
      await enable(within.service);
      within.state.now += 15 * minute;
      await within.service.refresh(true);
      assert.equal(within.state.notifications.length, 1);

      const outside = harness(t, sample([finding(kind)]));
      await enable(outside.service);
      outside.state.now += 15 * minute + 1;
      await outside.service.refresh(true);
      assert.equal(outside.state.notifications.length, 0);
      outside.state.now += minute;
      await outside.service.refresh(true);
      assert.equal(outside.state.notifications.length, 1);
    });
  }

  it("过旧的测量结果不会发出新的提醒", async (t) => {
    const { state, service } = harness(t, sample([finding("disk", "disk:C:\\"), finding("cpu")]));
    state.sampleTime = state.now - 16 * minute;
    await enable(service);
    state.now += minute;
    await service.refresh(true);
    assert.equal(state.notifications.length, 0);
  });

  it("采样时间只允许有限钟差，明显来自未来的样本不提醒", async (t) => {
    const tolerated = harness(t, sample([finding("disk", "disk:C:\\")]));
    tolerated.state.sampleTime = tolerated.state.now + minute;
    await enable(tolerated.service);
    assert.equal(tolerated.state.notifications.length, 1);

    const future = harness(t, sample([finding("disk", "disk:C:\\")]));
    future.state.sampleTime = future.state.now + minute + 1;
    await enable(future.service);
    assert.equal(future.state.notifications.length, 0);
  });

  it("同一问题一小时内不重复提醒，冷却在重启后仍生效", async (t) => {
    const { state, service, createService } = harness(t, sample([finding("disk", "disk:C:\\")]));
    await enable(service);
    assert.equal(state.notifications.length, 1);
    state.now += hour - 1;
    await service.refresh(true);
    assert.equal(state.notifications.length, 1);
    const restarted = createService();
    await restarted.refresh(true);
    assert.equal(state.notifications.length, 1);
    state.now += 1;
    await restarted.refresh(true);
    assert.equal(state.notifications.length, 2);
  });

  it("隐藏时未实际送达的提醒不消耗冷却，之后仍能提醒", async (t) => {
    const { state, service } = harness(t, sample([finding("disk", "disk:C:\\")]));
    state.visible = false;
    await enable(service);
    assert.equal(state.attempts.length, 1);
    assert.equal(state.notifications.length, 0);
    state.visible = true;
    state.now += minute;
    await service.refresh(true);
    assert.equal(state.attempts.length, 2);
    assert.equal(state.notifications.length, 1);
  });

  it("关闭监测以后仍可主动检查，采集错误会显示且成功重试后清除", async (t) => {
    const { state, service } = harness(t);
    await enable(service);
    service.setMonitoring(false);
    const before = state.collected;
    await service.refresh();
    assert.equal(state.collected, before + 1);
    assert.ok(service.getSnapshot().diagnostics);
    state.failure = new Error("采集超时");
    const failed = await service.refresh();
    assert.ok(failed.lastError?.includes("采集超时"));
    assert.equal(failed.scanning, false);
    state.failure = null;
    assert.equal((await service.refresh()).lastError, null);
  });

  it("同时刷新共用一次采集，完成后不残留扫描状态", async (t) => {
    const directory = mkdtempSync(join(tmpdir(), "companion-tools-shared-test-"));
    let count = 0;
    let complete: ((value: CompanionDiagnosticsSnapshot) => void) | undefined;
    const collector = new Promise<CompanionDiagnosticsSnapshot>((resolve) => { complete = resolve; });
    const service = new CompanionToolsService({
      statePath: join(directory, "state.json"),
      collect: () => { count++; return collector; },
      notify: () => true,
      now: () => startingTime,
    });
    t.after(() => { service.stop(); rmSync(directory, { recursive: true, force: true }); });
    const first = service.refresh();
    const second = service.refresh();
    assert.equal(count, 1);
    assert.equal(service.getSnapshot().scanning, true);
    assert.ok(complete);
    complete(sample());
    const results = await Promise.all([first, second]);
    assert.deepEqual(results[0], results[1]);
    assert.equal(service.getSnapshot().scanning, false);
  });
});

describe("卸载登记与原安装目录的证据核对", () => {
  it("仅完整清单消失形成移除记录，并只核对原来保存的安装目录", async (t) => {
    const { state, service, directory } = harness(t);
    const location = join(directory, "原安装目录");
    mkdirSync(location);
    state.sample = locatedSample(location);
    assert.deepEqual((await service.refresh()).uninstallRecords, []);
    state.sample = sample([], [], false);
    state.now += minute;
    assert.deepEqual((await service.refresh()).uninstallRecords, []);
    state.sample = sample([], []);
    state.now += minute;
    const removed = (await service.refresh()).uninstallRecords;
    assert.equal(removed.length, 1);
    assert.equal(removed[0].name, "软件甲");
    assert.equal(removed[0].installLocation, location);
    const checked = await service.checkUninstallDirectory(removed[0].id);
    assert.equal(checked.uninstallRecords[0].result?.status, "exists");
    assert.ok(checked.uninstallRecords[0].result?.explanation.includes("用户资料"));
    assert.ok(checked.uninstallRecords[0].result?.explanation.includes("不能判断文件可删除"));
  });

  it("新增登记不形成卸载记录；同目录其他登记出现时不读取目录", async (t) => {
    const { state, service, record, location } = await removedRecord(t);
    let checked = 0;
    state.checkDirectory = async () => { checked++; return { status: "exists", explanation: "仍可见目录。" }; };
    state.sample = sample([], ["软件乙"]);
    state.sample.installedApps[0].installLocation = location;
    state.now += minute;
    const refreshed = await service.refresh();
    assert.equal(refreshed.uninstallRecords.length, 1);
    const result = await service.checkUninstallDirectory(record.id);
    assert.equal(result.uninstallRecords[0].result?.status, "unsupported");
    assert.equal(checked, 0);
    assert.ok(result.uninstallRecords[0].result?.explanation.includes("其他软件"));
  });

  it("过期或明显来自未来的完整样本不形成移除结论，也不移走基线", async (t) => {
    for (const skew of [-16 * minute, minute + 1]) {
      const { state, service } = harness(t, locatedSample("C:\\Apps\\软件甲"));
      await service.refresh();
      state.sample = sample([], []);
      state.sampleTime = state.now + skew;
      assert.deepEqual((await service.refresh()).uninstallRecords, []);
      assert.equal(service.getSnapshot().findings.length, 0);
      state.sampleTime = null;
      state.now += minute;
      assert.equal((await service.refresh()).uninstallRecords.length, 1);
    }
  });

  it("重新出现的登记即使来自不完整清单也撤下旧移除记录", async (t) => {
    const { state, service, record, location } = await removedRecord(t);
    state.sample = locatedSample(location);
    state.sample.installedAppsComplete = false;
    state.now += minute;
    const reappeared = await service.refresh();
    assert.deepEqual(reappeared.uninstallRecords, []);
    assert.equal(reappeared.findings.some((item) => item.id === record.id), false);
    await assert.rejects(service.checkUninstallDirectory(record.id), /已不在当前结果/);
  });

  it("旧版状态保留偏好和版本，但缺失历史路径时明确证据不足", async (t) => {
    const { state, service, statePath, createService } = harness(t);
    service.stop();
    writeFileSync(statePath, JSON.stringify({
      version: 1,
      settings: { monitorEnabled: false, ignoredFindingIds: ["disk:C:\\"], snoozedUntil: { "disk:D:\\": startingTime + hour } },
      baseline: [{ id: "登记:软件甲", name: "软件甲", version: "1.0" }],
      softwareFindings: [],
      notifiedAt: { "disk:C:\\": startingTime },
    }));
    const migrated = createService();
    state.sample = sample([], []);
    const removed = await migrated.refresh();
    assert.deepEqual(removed.settings.ignoredFindingIds, ["disk:C:\\"]);
    assert.equal(removed.settings.snoozedUntil["disk:D:\\"], startingTime + hour);
    assert.equal(removed.uninstallRecords[0].installLocation, null);
    let checked = false;
    state.checkDirectory = async () => { checked = true; return { status: "absent", explanation: "未见目录。" }; };
    const result = await migrated.checkUninstallDirectory(removed.uninstallRecords[0].id);
    assert.equal(result.uninstallRecords[0].result?.status, "unsupported");
    assert.ok(result.uninstallRecords[0].result?.explanation.includes("证据不足"));
    assert.equal(checked, false);
    const saved = JSON.parse(readFileSync(statePath, "utf8")) as { version: number; notifiedAt: Record<string, number> };
    assert.equal(saved.version, 1);
    assert.equal(saved.notifiedAt["disk:C:\\"], startingTime);
  });

  it("读取需要当前完整新鲜清单，重启、不完整和过期采样均不读取目录", async (t) => {
    const { state, service, createService, record } = await removedRecord(t);
    let count = 0;
    state.checkDirectory = async () => { count++; return { status: "absent", explanation: "仅本次未见该目录。" }; };
    const restarted = createService();
    assert.equal((await restarted.checkUninstallDirectory(record.id)).uninstallRecords[0].result?.status, "unsupported");
    state.sample.installedAppsComplete = false;
    state.now += minute;
    await service.refresh();
    assert.equal((await service.checkUninstallDirectory(record.id)).uninstallRecords[0].result?.status, "unsupported");
    state.sample.installedAppsComplete = true;
    await service.refresh();
    state.now += 15 * minute + 1;
    assert.equal((await service.checkUninstallDirectory(record.id)).uninstallRecords[0].result?.status, "unsupported");
    assert.equal(count, 0);
    await service.refresh();
    assert.equal((await service.checkUninstallDirectory(record.id)).uninstallRecords[0].result?.status, "absent");
    assert.equal(count, 1);
    assert.equal(createService().getSnapshot().uninstallRecords[0].result?.status, "absent");
  });

  it("每次至多记录二十个移除，累计至多一百条且七天后撤下", async (t) => {
    const { state, service } = harness(t, sample([], []));
    await service.refresh();
    for (let group = 0; group < 6; group++) {
      state.sample = sample([], Array.from({ length: 24 }, (_, index) => `软件${group}:${index}`));
      state.now += minute;
      await service.refresh();
      state.sample = sample([], []);
      state.now += minute;
      const removed = await service.refresh();
      assert.equal(removed.uninstallRecords.length, Math.min((group + 1) * 20, 100));
    }
    const record = service.getSnapshot().uninstallRecords[0];
    state.now += 7 * 24 * hour;
    assert.deepEqual(service.getSnapshot().uninstallRecords, []);
    await assert.rejects(service.checkUninstallDirectory(record.id), /已不在当前结果/);
  });

  it("取消中的结果不保存，并明确阻止同一记录并发读取", async (t) => {
    const { state, service, record } = await removedRecord(t);
    const pending = deferredDirectoryCheck();
    let count = 0;
    state.checkDirectory = async () => { count++; return pending.result; };
    const controller = new AbortController();
    const first = service.checkUninstallDirectory(record.id, controller.signal);
    await assert.rejects(service.checkUninstallDirectory(record.id), /正在进行/);
    assert.equal(count, 1);
    controller.abort();
    pending.complete({ status: "exists", explanation: "目录存在。" });
    await assert.rejects(first, /已取消/);
    assert.equal(service.getSnapshot().uninstallRecords[0].result, null);
    state.checkDirectory = async () => ({ status: "absent", explanation: "本次未见该登记路径，不代表全盘干净。" });
    assert.equal((await service.checkUninstallDirectory(record.id)).uninstallRecords[0].result?.status, "absent");
  });

  it("停止后晚到的目录结果不保存，即使服务已重新开始", async (t) => {
    const { state, service, record, createService } = await removedRecord(t);
    const pending = deferredDirectoryCheck();
    state.checkDirectory = async () => pending.result;
    const first = service.checkUninstallDirectory(record.id);
    service.stop();
    service.start();
    pending.complete({ status: "exists", explanation: "目录存在。" });
    assert.equal((await first).uninstallRecords[0].result, null);
    assert.equal(createService().getSnapshot().uninstallRecords[0].result, null);
  });

  it("新快照撤销晚到结果，重新安装后旧结果也不恢复", async (t) => {
    for (const reinstall of [false, true]) {
      const { state, service, record, location } = await removedRecord(t);
      const pending = deferredDirectoryCheck();
      state.checkDirectory = async () => pending.result;
      const first = service.checkUninstallDirectory(record.id);
      state.now += minute;
      if (reinstall) state.sample = locatedSample(location);
      await service.refresh();
      pending.complete({ status: "exists", explanation: "目录存在。" });
      const result = await first;
      if (reinstall) assert.deepEqual(result.uninstallRecords, []);
      else assert.equal(result.uninstallRecords[0].result, null);
    }
  });

  it("读取完成时采样已过期，不保存新目录结论；外部不能改写服务记录", async (t) => {
    const { state, service, record } = await removedRecord(t);
    const pending = deferredDirectoryCheck();
    state.checkDirectory = async () => pending.result;
    const first = service.checkUninstallDirectory(record.id);
    state.now += 15 * minute + 1;
    pending.complete({ status: "absent", explanation: "本次未见该目录。" });
    const result = await first;
    assert.equal(result.uninstallRecords[0].result, null);
    result.uninstallRecords[0].installLocation = "C:\\其他路径";
    assert.equal(service.getSnapshot().uninstallRecords[0].installLocation, record.installLocation);
  });

  it("最近一次采集失败时不借用仍在有效期的旧样本读取目录", async (t) => {
    const { state, service, record } = await removedRecord(t);
    let checked = false;
    state.checkDirectory = async () => { checked = true; return { status: "exists", explanation: "可见目录。" }; };
    state.failure = new Error("登记采集失败");
    await service.refresh();
    const result = await service.checkUninstallDirectory(record.id);
    assert.equal(result.uninstallRecords[0].result?.status, "unsupported");
    assert.equal(checked, false);
    assert.ok(result.lastError?.includes("登记采集失败"));
  });

  it("无法读取仅保存读取受限证据，不改写为目录不存在", async (t) => {
    const { state, service, record } = await removedRecord(t);
    state.checkDirectory = async () => ({ status: "unreadable", explanation: "无法读取目录属性，不能判断是否存在。" });
    const result = await service.checkUninstallDirectory(record.id);
    assert.equal(result.uninstallRecords[0].result?.status, "unreadable");
    assert.ok(result.uninstallRecords[0].result?.explanation.includes("不能判断"));
  });
});
