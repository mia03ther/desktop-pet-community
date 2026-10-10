import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, truncateSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, parse } from "node:path";
import { describe, it, type TestContext } from "node:test";
import { CompanionDownloadsService } from "../src/companion-downloads.js";
import type { CompanionDownloadItem, CompanionInstallerEvidence } from "../src/companion-software-types.js";

const HOUR = 60 * 60_000;
const startingTime = 1_800_000_000_000;

function evidence(filePath: string, checkedAt: number, patch: Partial<CompanionInstallerEvidence> = {}): CompanionInstallerEvidence {
  return {
    checkedAt,
    fileName: basename(filePath),
    sizeBytes: 4,
    sha256: "a".repeat(64),
    signatureStatus: "NotSigned",
    signer: null,
    productName: null,
    fileVersion: null,
    productVersion: null,
    publisher: null,
    fileDescription: null,
    zoneId: null,
    sourceHost: null,
    clues: ["未取得有效签名，需要核对来源。"],
    conclusion: "文件在两轮观察中稳定，不能保证下载完成，也不能判定为捆绑软件。",
    ...patch,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function harness(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), "companion-downloads-test-"));
  const folder = join(directory, "downloads");
  const otherFolder = join(directory, "other-downloads");
  const statePath = join(directory, "state.json");
  mkdirSync(folder);
  mkdirSync(otherFolder);
  const instances: CompanionDownloadsService[] = [];
  const state = {
    now: startingTime,
    visible: true,
    inspections: [] as string[],
    attempts: [] as string[],
    notifications: [] as CompanionDownloadItem[],
    inspect: null as ((filePath: string, signal?: AbortSignal) => Promise<CompanionInstallerEvidence>) | null,
  };
  function createService() {
    const service = new CompanionDownloadsService({
      statePath,
      now: () => state.now,
      inspect: async (filePath, signal) => {
        state.inspections.push(filePath);
        return state.inspect?.(filePath, signal) ?? evidence(filePath, state.now);
      },
      notify: (item) => {
        state.attempts.push(item.id);
        if (state.visible) state.notifications.push(item);
        return state.visible;
      },
    });
    instances.push(service);
    return service;
  }
  t.after(() => {
    for (const service of instances) service.stop();
    rmSync(directory, { recursive: true, force: true });
  });
  const service = createService();
  function add(name: string, content = "data", target = folder) {
    const filePath = join(target, name);
    writeFileSync(filePath, content);
    return filePath;
  }
  async function enable() {
    await service.chooseFolder(folder);
    await service.setEnabled(true);
  }
  async function settle() {
    await service.refresh();
    state.now += 10_000;
    return service.refresh();
  }
  return { directory, folder, otherFolder, statePath, state, service, createService, add, enable, settle };
}

describe("下载目录的有界只读观察", () => {
  it("默认关闭，选择目录不启动观察，启用时现有安装包全部作为基线", async (t) => {
    const h = harness(t);
    h.add("existing.exe");
    h.service.start();
    assert.equal(h.service.getSnapshot().enabled, false);
    assert.equal((await h.service.refresh()).items.length, 0);
    await h.service.chooseFolder(h.folder);
    assert.equal(h.service.getSnapshot().enabled, false);
    await h.service.setEnabled(true);
    h.state.now += HOUR;
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 0);
    assert.equal(h.state.notifications.length, 0);
  });

  it("拒绝磁盘根目录、UNC、目录联接及经过祖先联接的子目录", async (t) => {
    const h = harness(t);
    await assert.rejects(h.service.chooseFolder(parse(h.folder).root));
    await assert.rejects(h.service.chooseFolder("\\\\server\\share\\downloads"));
    mkdirSync(join(h.otherFolder, "child"));
    const linked = join(h.directory, "linked");
    symlinkSync(h.otherFolder, linked, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(h.service.chooseFolder(linked));
    await assert.rejects(h.service.chooseFolder(join(linked, "child")));
    assert.equal(h.service.getSnapshot().folderPath, null);
  });

  it("原生选择被取消时不提交迟到目录，不影响此前保存的范围", async (t) => {
    const h = harness(t);
    await h.service.chooseFolder(h.folder);
    const controller = new AbortController();
    const choosing = h.service.chooseFolder(h.otherFolder, controller.signal);
    controller.abort();
    await assert.rejects(choosing);
    assert.equal(h.service.getSnapshot().folderPath, h.folder);
    assert.equal(h.createService().getSnapshot().folderPath, h.folder);
  });

  it("只观察顶层普通 EXE/MSI，临时扩展名与子目录不检查", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("package.exe.crdownload");
    h.add("package.msi.part");
    h.add("readme.txt");
    const nested = join(h.folder, "nested");
    mkdirSync(nested);
    h.add("nested.exe", "data", nested);
    h.add("valid.EXE");
    h.add("valid.MSI");
    const result = await h.settle();
    assert.deepEqual(result.items.map((item) => item.fileName).sort(), ["valid.EXE", "valid.MSI"]);
    assert.equal(h.state.inspections.length, 2);
    assert.ok(h.state.notifications.every((item) => !JSON.stringify(item).includes(h.folder)));
  });

  it("新增文件两轮间隔不足十秒不检查，写入变化后重新等待稳定", async (t) => {
    const h = harness(t);
    await h.enable();
    const filePath = h.add("new.exe");
    await h.service.refresh();
    h.state.now += 9_999;
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 0);
    writeFileSync(filePath, "changed-size");
    h.state.now += 1;
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 0);
    h.state.now += 10_000;
    assert.equal((await h.service.refresh()).items.length, 1);
  });

  it("每轮至多检查两个文件，其他稳定候选由后续完整观察处理", async (t) => {
    const h = harness(t);
    await h.enable();
    for (let index = 0; index < 5; index++) h.add(`installer-${index}.exe`);
    await h.settle();
    assert.equal(h.state.inspections.length, 2);
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 4);
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 5);
  });

  it("超限清单明确报错，首次完整清单仍作为基线而不会把截断结果当完成", async (t) => {
    const h = harness(t);
    h.add("existing.exe");
    for (let index = 0; index < 200; index++) h.add(`unrelated-${index}.txt`);
    await h.enable();
    assert.ok(h.service.getSnapshot().lastError);
    assert.equal(h.state.inspections.length, 0);
    unlinkSync(join(h.folder, "unrelated-0.txt"));
    assert.equal((await h.service.refresh()).lastError, null);
    h.state.now += 10_000;
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 0);
    unlinkSync(join(h.folder, "unrelated-1.txt"));
    h.add("new.exe");
    assert.equal((await h.settle()).items[0]?.fileName, "new.exe");
  });

  it("完整基线后出现超限清单不会修改候选，新文件恢复完整观察后才确认稳定", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("new.exe");
    for (let index = 0; index < 200; index++) h.add(`unrelated-${index}.txt`);
    assert.ok((await h.service.refresh()).lastError);
    h.state.now += 10_000;
    unlinkSync(join(h.folder, "unrelated-0.txt"));
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 0);
    h.state.now += 10_000;
    assert.equal((await h.service.refresh()).items.length, 1);
  });

  it("同路径替换产生新指纹和独立记录，而不会沿用旧文件处置", async (t) => {
    const h = harness(t);
    await h.enable();
    const filePath = h.add("new.exe");
    const previous = (await h.settle()).items[0];
    h.service.setDisposition(previous.id, "ignore");
    writeFileSync(filePath, "replacement");
    const next = (await h.settle()).items;
    assert.equal(next.length, 1);
    assert.notEqual(next[0].id, previous.id);
    assert.equal(h.state.notifications.length, 2);
  });

  it("有效签名本身不触发提醒，下载器线索和非有效签名才提供待核对提醒", async (t) => {
    const h = harness(t);
    h.state.inspect = async (filePath) => evidence(filePath, h.state.now, {
      signatureStatus: basename(filePath) === "unsigned.exe" ? "UnknownError" : "Valid",
      clues: [],
      fileDescription: basename(filePath) === "downloader.exe" ? "在线安装下载器" : "应用安装程序",
    });
    await h.enable();
    h.add("signed.exe");
    h.add("downloader.exe");
    h.add("unsigned.exe");
    await h.settle();
    await h.service.refresh();
    assert.deepEqual(h.state.notifications.map((item) => item.fileName).sort(), ["downloader.exe", "unsigned.exe"]);
    assert.equal(h.service.getSnapshot().items.length, 3);
  });

  it("隐藏时送达失败保留待提醒状态，显示后送达一次且后续不重复", async (t) => {
    const h = harness(t);
    h.state.visible = false;
    await h.enable();
    h.add("new.exe");
    await h.settle();
    assert.equal(h.state.attempts.length, 1);
    assert.equal(h.state.notifications.length, 0);
    h.state.visible = true;
    await h.service.refresh();
    await h.service.refresh();
    assert.equal(h.state.attempts.length, 2);
    assert.equal(h.state.notifications.length, 1);
  });

  it("关闭后重新启用重新建立基线，先前未送达的现有文件也不补发提醒", async (t) => {
    const h = harness(t);
    h.state.visible = false;
    await h.enable();
    h.add("existing-pending.exe");
    await h.settle();
    await h.service.setEnabled(false);
    h.state.visible = true;
    await h.service.setEnabled(true);
    h.state.now += 10_000;
    await h.service.refresh();
    assert.equal(h.state.notifications.length, 0);
  });

  it("忽略和延后作用于结果与未送达提醒，恢复与到期后可以继续提醒", async (t) => {
    const h = harness(t);
    h.state.visible = false;
    await h.enable();
    h.add("ignored.exe");
    h.add("later.exe");
    const items = (await h.settle()).items;
    const ignored = items.find((item) => item.fileName === "ignored.exe")!;
    const later = items.find((item) => item.fileName === "later.exe")!;
    h.service.setDisposition(ignored.id, "ignore");
    h.service.setDisposition(later.id, "later");
    h.state.visible = true;
    await h.service.refresh();
    assert.equal(h.service.getSnapshot().items.length, 0);
    assert.equal(h.state.notifications.length, 0);
    h.state.now += HOUR;
    await h.service.refresh();
    assert.deepEqual(h.state.notifications.map((item) => item.id), [later.id]);
    h.service.resetIgnored();
    await h.service.refresh();
    assert.deepEqual(h.state.notifications.map((item) => item.id), [later.id, ignored.id]);
  });

  it("已送达安装包选择稍后会在一小时到期后重新提醒一次", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("later-again.exe");
    const item = (await h.settle()).items[0];
    assert.equal(h.state.notifications.length, 1);
    h.service.setDisposition(item.id, "later");
    h.state.now += HOUR - 1;
    await h.service.refresh();
    assert.equal(h.state.notifications.length, 1);
    h.state.now += 1;
    await h.service.refresh();
    await h.service.refresh();
    assert.deepEqual(h.state.notifications.map((notification) => notification.id), [item.id, item.id]);
  });

  it("恢复处置只重提醒被忽略或延后的项，不重提醒其他已送达安装包", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("ignored.exe");
    h.add("snoozed.exe");
    h.add("unchanged.exe");
    await h.settle();
    const items = (await h.service.refresh()).items;
    const ignored = items.find((item) => item.fileName === "ignored.exe")!;
    const snoozed = items.find((item) => item.fileName === "snoozed.exe")!;
    const unchanged = items.find((item) => item.fileName === "unchanged.exe")!;
    assert.equal(h.state.notifications.length, 3);
    h.service.setDisposition(ignored.id, "ignore");
    h.service.setDisposition(snoozed.id, "later");
    h.service.resetIgnored();
    await h.service.refresh();
    await h.service.refresh();
    assert.equal(h.state.notifications.length, 5);
    assert.equal(h.state.notifications.filter((item) => item.id === ignored.id).length, 2);
    assert.equal(h.state.notifications.filter((item) => item.id === snoozed.id).length, 2);
    assert.equal(h.state.notifications.filter((item) => item.id === unchanged.id).length, 1);
  });

  it("处置保存失败时回滚延后和恢复，不丢失原送达状态或已忽略选择", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("rollback.exe");
    const item = (await h.settle()).items[0];
    const blockedTemporary = `${h.statePath}.tmp`;
    mkdirSync(blockedTemporary);
    assert.throws(() => h.service.setDisposition(item.id, "later"));
    assert.deepEqual(h.service.getSnapshot().snoozedUntil, {});
    rmSync(blockedTemporary, { recursive: true });
    await h.service.refresh();
    assert.equal(h.state.notifications.length, 1);
    h.service.setDisposition(item.id, "ignore");
    mkdirSync(blockedTemporary);
    assert.throws(() => h.service.resetIgnored());
    assert.deepEqual(h.service.getSnapshot().ignoredIds, [item.id]);
    rmSync(blockedTemporary, { recursive: true });
    h.service.resetIgnored();
    await h.service.refresh();
    assert.equal(h.state.notifications.length, 2);
  });

  it("目录、开关和处置跨重启保存，重启首次观察现有安装包仍不提醒", async (t) => {
    const h = harness(t);
    h.state.visible = false;
    await h.enable();
    h.add("ignored.exe");
    h.add("later.exe");
    const items = (await h.settle()).items;
    h.service.setDisposition(items[0].id, "ignore");
    h.service.setDisposition(items[1].id, "later");
    h.service.stop();
    h.add("offline.exe");
    const restarted = h.createService();
    assert.equal(restarted.getSnapshot().enabled, true);
    assert.equal(restarted.getSnapshot().folderPath, h.folder);
    assert.deepEqual(restarted.getSnapshot().ignoredIds, [items[0].id]);
    assert.ok(restarted.getSnapshot().snoozedUntil[items[1].id] > h.state.now);
    restarted.start();
    await restarted.refresh();
    h.state.now += HOUR;
    h.state.visible = true;
    await restarted.refresh();
    assert.equal(h.state.inspections.length, 2);
    assert.equal(h.state.notifications.length, 0);
  });

  it("检查失败保留错误证据，大于 256 MiB 不调用检查器也不当作安全结果", async (t) => {
    const h = harness(t);
    h.state.inspect = async () => { throw new Error("签名接口不可用"); };
    await h.enable();
    h.add("failed.exe");
    const large = h.add("large.exe");
    truncateSync(large, 256 * 1024 ** 2 + 1);
    const items = (await h.settle()).items;
    assert.equal(items.length, 2);
    assert.ok(items.every((item) => item.evidence === null && item.error !== null));
    assert.equal(h.state.inspections.length, 1);
    assert.equal(h.state.notifications.length, 0);
  });

  it("手工检查占用检查器时不把后台候选永久记成失败，下轮空闲后继续检查", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("waiting.exe");
    h.state.inspect = async () => {
      throw Object.assign(new Error("检查器正在处理手工选择的文件。"), { code: "COMPANION_INSPECTION_BUSY" });
    };
    const busy = await h.settle();
    assert.deepEqual(busy.items, []);
    assert.equal(busy.lastError, null);
    assert.equal(h.state.notifications.length, 0);
    h.state.inspect = null;
    const retried = await h.service.refresh();
    assert.equal(retried.items[0]?.fileName, "waiting.exe");
    assert.equal(retried.items[0]?.error, null);
    assert.equal(h.state.inspections.length, 2);
    assert.equal(h.state.notifications.length, 1);
  });

  it("检查器异常中的真实路径不会进入安装包的公开错误结果", async (t) => {
    const h = harness(t);
    h.state.inspect = async (filePath) => { throw new Error(`无法读取 ${filePath}`); };
    await h.enable();
    const filePath = h.add("private.exe");
    const item = (await h.settle()).items[0];
    assert.ok(item.error);
    assert.equal(item.evidence, null);
    assert.equal(JSON.stringify(item).includes(JSON.stringify(filePath).slice(1, -1)), false);
  });

  it("并发刷新共享一次任务，检查期间文件变化时不提交旧证据", async (t) => {
    const h = harness(t);
    await h.enable();
    const filePath = h.add("busy.exe");
    await h.service.refresh();
    h.state.now += 10_000;
    const started = deferred<void>();
    const finish = deferred<CompanionInstallerEvidence>();
    h.state.inspect = async () => {
      started.resolve();
      return finish.promise;
    };
    const first = h.service.refresh();
    assert.equal(h.service.refresh(), first);
    await started.promise;
    writeFileSync(filePath, "changed-during-inspection");
    finish.resolve(evidence(filePath, h.state.now));
    await first;
    assert.equal(h.service.getSnapshot().items.length, 0);
    assert.equal(h.state.notifications.length, 0);
    h.state.inspect = null;
    assert.equal((await h.settle()).items.length, 1);
  });

  for (const action of ["stop", "disable", "change-folder"] as const) {
    it(`${action} 撤销正在检查的任务，迟到结果不提交也不提醒`, async (t) => {
      const h = harness(t);
      await h.enable();
      const filePath = h.add("busy.exe");
      await h.service.refresh();
      h.state.now += 10_000;
      const started = deferred<void>();
      const finish = deferred<CompanionInstallerEvidence>();
      let activeSignal: AbortSignal | undefined;
      h.state.inspect = async (_filePath, signal) => {
        activeSignal = signal;
        started.resolve();
        return finish.promise;
      };
      const pending = h.service.refresh();
      await started.promise;
      if (action === "stop") h.service.stop();
      else if (action === "disable") await h.service.setEnabled(false);
      else await h.service.chooseFolder(h.otherFolder);
      assert.equal(activeSignal?.aborted, true);
      finish.resolve(evidence(filePath, h.state.now));
      await pending;
      assert.equal(h.service.getSnapshot().items.length, 0);
      assert.equal(h.state.notifications.length, 0);
      if (action === "stop") assert.equal(h.service.getSnapshot().enabled, true);
      else assert.equal(h.service.getSnapshot().enabled, false);
    });
  }

  it("切换范围清空旧历史与处置，关闭后重新启用不会追补关闭期间的安装包", async (t) => {
    const h = harness(t);
    await h.enable();
    h.add("old.exe");
    const old = (await h.settle()).items[0];
    h.service.setDisposition(old.id, "ignore");
    await h.service.chooseFolder(h.otherFolder);
    assert.deepEqual(h.service.getSnapshot().ignoredIds, []);
    assert.deepEqual(h.service.getSnapshot().items, []);
    h.add("while-disabled.exe", "data", h.otherFolder);
    await h.service.setEnabled(true);
    h.state.now += 10_000;
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 1);
  });

  it("历史只保留最近二十项，保存设置不包含安装文件的真实路径", async (t) => {
    const h = harness(t);
    await h.enable();
    const filePaths = Array.from({ length: 22 }, (_, index) => h.add(`installer-${index}.exe`));
    await h.service.refresh();
    h.state.now += 10_000;
    for (let round = 0; round < 11; round++) await h.service.refresh();
    assert.equal(h.service.getSnapshot().items.length, 20);
    const saved = readFileSync(h.statePath, "utf8");
    assert.ok(filePaths.every((filePath) => !saved.includes(JSON.stringify(filePath).slice(1, -1))));
  });

  it("三十秒定时观察沿同一刷新任务运行，停止后不再自动观察", async (t) => {
    t.mock.timers.enable({ apis: ["setInterval"] });
    const h = harness(t);
    await h.enable();
    h.add("timer.exe");
    h.state.now += 30_000;
    t.mock.timers.tick(30_000);
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 0);
    h.state.now += 30_000;
    t.mock.timers.tick(30_000);
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 1);
    h.service.stop();
    h.add("after-stop.exe");
    h.state.now += 60_000;
    t.mock.timers.tick(60_000);
    await h.service.refresh();
    assert.equal(h.state.inspections.length, 1);
  });

  it("超过处置保存上限的设置被拒绝，重启保持关闭并说明读取失败", (t) => {
    const h = harness(t);
    const ids = Array.from({ length: 501 }, (_, index) => index.toString(16).padStart(64, "0"));
    writeFileSync(h.statePath, JSON.stringify({
      version: 1,
      folderPath: h.folder,
      enabled: true,
      ignoredIds: ids,
      snoozedUntil: {},
      deliveredIds: [],
    }));
    const restarted = h.createService();
    assert.equal(restarted.getSnapshot().enabled, false);
    assert.equal(restarted.getSnapshot().folderPath, null);
    assert.ok(restarted.getSnapshot().lastError);
  });
});
