import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, promises as fs, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { PluginService } from "../src/plugin-service.js";
import { PluginStateStore, type PluginStateRecord } from "../src/plugin-state.js";
import { OPENPETS_PLUGIN_MANIFEST_FILENAME } from "../src/plugin-manifest.js";
import type { PluginLogLevel } from "../src/plugin-sdk-bridge.js";

type LogEntry = { level: PluginLogLevel; message: string; fields?: Record<string, unknown> };

// 沿用插件服务既有夹具的状态存储子类，只在指定插件的提交前模拟锁。
class ThrowingStateStore extends PluginStateStore {
  lockedId: string | null = null;
  failures = 0;
  failureCode = "EPERM";
  attempts = 0;
  onFailure?: () => void;

  override upsertRecord(record: PluginStateRecord): PluginStateRecord {
    if (record.id === this.lockedId) {
      this.attempts += 1;
      if (this.failures > 0) {
        this.failures -= 1;
        this.onFailure?.();
        const error = new Error(`${this.failureCode}: 测试夹具暂时无法提交状态`) as NodeJS.ErrnoException;
        error.code = this.failureCode;
        throw error;
      }
    }
    return super.upsertRecord(record);
  }
}

class FakeRuntime {
  logs: LogEntry[] = [];
  started = false;
  isPluginActive(): boolean { return this.started; }
  async start(): Promise<void> { this.started = true; }
  async stop(): Promise<void> {}
  log(level: PluginLogLevel, message: string, fields?: Record<string, unknown>): void { this.logs.push({ level, message, fields }); }
}

function fixture(ids = ["openpets.virtual-pet", "openpets.fortune-cookie"]) {
  const directory = mkdtempSync(path.join(process.cwd(), "plugin-bundled-seed-test-"));
  const userData = path.join(directory, "data");
  const official = path.join(directory, "official");
  mkdirSync(userData);
  mkdirSync(official);
  const store = new ThrowingStateStore({ userDataPath: userData });
  store.initialize();
  for (const id of ids) writeSource(official, id);
  return { directory, userData, official, store };
}

function writeSource(official: string, id: string, version = "1.0.0"): void {
  const source = path.join(official, id);
  mkdirSync(source, { recursive: true });
  writeFileSync(path.join(source, OPENPETS_PLUGIN_MANIFEST_FILENAME), JSON.stringify({
    manifestVersion: 2, id, name: id, version, runtime: "javascript", sdkVersion: "1.0.0", entry: "index.js",
    permissions: ["pet:speak"], configSchema: { minutes: { type: "number", default: 30 } },
  }), "utf8");
  writeFileSync(path.join(source, "index.js"), "OpenPetsPlugin.register({ start() {} });\n", "utf8");
}

function removeFixture(directory: string): void {
  const resolved = path.resolve(directory);
  assert.equal(path.dirname(resolved), path.resolve(process.cwd()));
  assert.ok(path.basename(resolved).startsWith("plugin-bundled-seed-test-"));
  rmSync(resolved, { recursive: true, force: true });
}

for (const code of ["EPERM", "EACCES"]) {
  test(`Windows ${code} 短暂锁等待后真实提交内置插件，不阻塞事件循环或重复日志`, { skip: process.platform !== "win32" }, async () => {
    const current = fixture();
    const runtime = new FakeRuntime();
    const fallbackLogs: LogEntry[] = [];
    const service = new PluginService({
      userDataPath: current.userData, stateStore: current.store, runtime: runtime as never,
      currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official],
      runtimeLogger: (level, message, fields) => fallbackLogs.push({ level, message, fields }),
    });
    try {
      let timerRanBeforeSecondAttempt = false;
      let secondAttemptObservedTimer = false;
      current.store.lockedId = "openpets.virtual-pet";
      current.store.failures = 2;
      current.store.failureCode = code;
      current.store.onFailure = () => {
        if (current.store.attempts === 1) setTimeout(() => { timerRanBeforeSecondAttempt = true; }, 0);
        if (current.store.attempts === 2) secondAttemptObservedTimer = timerRanBeforeSecondAttempt;
      };
      await service.start();
      assert.equal(current.store.attempts, 3);
      assert.equal(secondAttemptObservedTimer, true, "重试前允许定时器运行，不能同步忙等");
      assert.equal(runtime.started, true);
      const virtual = current.store.getRecord("openpets.virtual-pet");
      assert.equal(virtual?.bundled, true);
      assert.equal(virtual?.enabled, true);
      assert.equal(current.store.getRecord("openpets.fortune-cookie")?.enabled, false);
      const persisted = new PluginStateStore({ userDataPath: current.userData });
      persisted.read();
      assert.deepEqual(persisted.listRecords(), current.store.listRecords(), "不是仅写内存或仅复制安装目录");
      assert.equal(existsSync(path.join(current.userData, "plugins", "openpets.virtual-pet", "index.js")), true);
      assert.equal(runtime.logs.filter((entry) => entry.fields?.pluginId === "openpets.virtual-pet" && entry.message.includes("稍后重试")).length, 2);
      assert.equal(runtime.logs.some((entry) => entry.level === "error"), false);
      assert.deepEqual(fallbackLogs, [], "已有 runtime.log 时不向备用日志重复记录");
    } finally {
      await service.stop();
      removeFixture(current.directory);
    }
  });
}

test("Windows 持续锁只尝试四次，保留旧存档与用户选择并输出失败诊断", { skip: process.platform !== "win32" }, async () => {
  const current = fixture(["openpets.virtual-pet"]);
  const runtime = new FakeRuntime();
  const service = new PluginService({ userDataPath: current.userData, stateStore: current.store, runtime: runtime as never, currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official] });
  try {
    await service.seedBundledPlugins();
    current.store.setEnabled("openpets.virtual-pet", false);
    current.store.replaceConfig("openpets.virtual-pet", { minutes: 45 });
    const beforeRecord = current.store.getRecord("openpets.virtual-pet");
    const beforeBytes = readFileSync(current.store.statePath, "utf8");
    writeSource(current.official, "openpets.virtual-pet", "2.0.0");
    current.store.lockedId = "openpets.virtual-pet";
    current.store.failures = Infinity;
    await service.seedBundledPlugins();
    assert.equal(current.store.attempts, 4, "重试必须有上限");
    assert.deepEqual(current.store.getRecord("openpets.virtual-pet"), beforeRecord);
    assert.equal(readFileSync(current.store.statePath, "utf8"), beforeBytes, "不能把未提交版本当作成功写入");
    const errors = runtime.logs.filter((entry) => entry.level === "error");
    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.fields?.pluginId, "openpets.virtual-pet");
    assert.equal(errors[0]?.fields?.code, "EPERM");
    assert.equal(errors[0]?.fields?.attempts, 4);
    assert.match(String(errors[0]?.fields?.reason), /EPERM/u);
    assert.ok(runtime.logs.some((entry) => entry.message === "Bundled plugin seed failed."), "保留外层初始化失败记录");
    current.store.failures = 0;
    await service.seedBundledPlugins();
    assert.equal(current.store.getRecord("openpets.virtual-pet")?.version, "2.0.0");
    assert.equal(current.store.getRecord("openpets.virtual-pet")?.enabled, false);
    assert.deepEqual(current.store.getRecord("openpets.virtual-pet")?.config, { minutes: 45 }, "后续成功恢复仍尊重用户设置");
  } finally {
    await service.stop();
    removeFixture(current.directory);
  }
});

test("持续失败的新插件不伪装安装成功，其他插件继续初始化，正式备用日志能看到错误", { skip: process.platform !== "win32" }, async () => {
  const current = fixture();
  const logs: LogEntry[] = [];
  const runtime = { async start() {}, async stop() {} };
  const service = new PluginService({
    userDataPath: current.userData, stateStore: current.store, runtime: runtime as never,
    currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official],
    runtimeLogger: (level, message, fields) => logs.push({ level, message, fields }),
  });
  try {
    current.store.lockedId = "openpets.fortune-cookie";
    current.store.failures = Infinity;
    current.store.failureCode = "EACCES";
    await service.start();
    assert.equal(current.store.attempts, 4, `状态提交前的完整阶段日志：${JSON.stringify(logs)}`);
    assert.equal(current.store.getRecord("openpets.fortune-cookie"), undefined);
    assert.equal(current.store.getRecord("openpets.virtual-pet")?.enabled, true, "后面的插件不能被一个失败状态阻断");
    const persisted = new PluginStateStore({ userDataPath: current.userData });
    persisted.read();
    assert.equal(persisted.getRecord("openpets.fortune-cookie"), undefined);
    const errors = logs.filter((entry) => entry.level === "error");
    assert.equal(errors.length, 1, "没有 runtime.log 时调用传入日志函数一次");
    assert.equal(errors[0]?.fields?.pluginId, "openpets.fortune-cookie");
    assert.equal(errors[0]?.fields?.code, "EACCES");
    assert.equal(errors[0]?.fields?.attempts, 4);
    assert.ok(logs.some((entry) => entry.message === "Bundled plugin seed failed."));
  } finally {
    await service.stop();
    removeFixture(current.directory);
  }
});

test("非文件锁错误立即失败，不重试、不提交状态并保留原错误代码", async () => {
  const current = fixture(["openpets.virtual-pet"]);
  const runtime = new FakeRuntime();
  const service = new PluginService({ userDataPath: current.userData, stateStore: current.store, runtime: runtime as never, currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official] });
  try {
    const before = readFileSync(current.store.statePath, "utf8");
    current.store.lockedId = "openpets.virtual-pet";
    current.store.failures = Infinity;
    current.store.failureCode = "EIO";
    await service.seedBundledPlugins();
    assert.equal(current.store.attempts, 1);
    assert.equal(current.store.getRecord("openpets.virtual-pet"), undefined);
    assert.equal(readFileSync(current.store.statePath, "utf8"), before);
    const errors = runtime.logs.filter((entry) => entry.level === "error");
    assert.equal(errors.length, 1);
    assert.equal(errors[0]?.fields?.code, "EIO");
    assert.equal(errors[0]?.fields?.attempts, 1);
    assert.equal(runtime.logs.some((entry) => entry.message.includes("稍后重试")), false);
  } finally {
    await service.stop();
    removeFixture(current.directory);
  }
});

for (const phase of ["备份旧目录", "启用新目录"] as const) {
  test(`Windows ${phase}遭遇短暂 rename 锁时重试原子替换，成功后才提交新版本`, { skip: process.platform !== "win32" }, async () => {
    const current = fixture(["openpets.virtual-pet"]);
    const runtime = new FakeRuntime();
    const service = new PluginService({ userDataPath: current.userData, stateStore: current.store, runtime: runtime as never, currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official] });
    const originalRename = fs.rename;
    try {
      await service.seedBundledPlugins();
      assert.equal(current.store.getRecord("openpets.virtual-pet")?.version, "1.0.0");
      const installPath = path.join(current.userData, "plugins", "openpets.virtual-pet");
      writeSource(current.official, "openpets.virtual-pet", "2.0.0");
      let attempts = 0;
      fs.rename = async (source, destination) => {
        const selected = phase === "备份旧目录"
          ? String(source) === installPath && path.basename(String(destination)).startsWith(".bak-bundled-")
          : path.basename(String(source)).startsWith(".tmp-bundled-") && String(destination) === installPath;
        if (selected) {
          attempts += 1;
          if (attempts <= 2) throw Object.assign(new Error("测试夹具短暂目录 rename 锁"), { code: phase === "备份旧目录" ? "EPERM" : "EACCES" });
        }
        return originalRename(source, destination);
      };
      await service.seedBundledPlugins();
      assert.equal(attempts, 3);
      assert.equal(current.store.getRecord("openpets.virtual-pet")?.version, "2.0.0");
      assert.equal(JSON.parse(readFileSync(path.join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME), "utf8")).version, "2.0.0");
      assert.equal(runtime.logs.some((entry) => entry.message === "Bundled plugin seed failed."), false);
    } finally {
      fs.rename = originalRename;
      await service.stop();
      removeFixture(current.directory);
    }
  });
}

for (const phase of ["备份旧目录", "启用新目录"] as const) {
  test(`Windows ${phase}持续锁有界失败并保留原目录与存档，恢复也能处理短暂锁`, { skip: process.platform !== "win32" }, async () => {
    const current = fixture(["openpets.virtual-pet"]);
    const logs: LogEntry[] = [];
    const service = new PluginService({
      userDataPath: current.userData, stateStore: current.store, runtime: { async start() {}, async stop() {} } as never,
      currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official],
      runtimeLogger: (level, message, fields) => logs.push({ level, message, fields }),
    });
    const originalRename = fs.rename;
    try {
      await service.seedBundledPlugins();
      assert.equal(current.store.getRecord("openpets.virtual-pet")?.version, "1.0.0");
      const installPath = path.join(current.userData, "plugins", "openpets.virtual-pet");
      const oldManifest = readFileSync(path.join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME), "utf8");
      const oldState = readFileSync(current.store.statePath, "utf8");
      writeSource(current.official, "openpets.virtual-pet", "2.0.0");
      let attempts = 0;
      let rollbackAttempts = 0;
      fs.rename = async (source, destination) => {
        const sourceName = path.basename(String(source));
        const selected = phase === "备份旧目录"
          ? String(source) === installPath && path.basename(String(destination)).startsWith(".bak-bundled-")
          : sourceName.startsWith(".tmp-bundled-") && String(destination) === installPath;
        if (selected) {
          attempts += 1;
          throw Object.assign(new Error("测试夹具持续目录 rename 锁"), { code: "EPERM" });
        }
        if (sourceName.startsWith(".bak-bundled-") && String(destination) === installPath) {
          rollbackAttempts += 1;
          if (rollbackAttempts <= 2) throw Object.assign(new Error("测试夹具恢复目录短暂锁"), { code: "EACCES" });
        }
        return originalRename(source, destination);
      };
      await service.seedBundledPlugins();
      assert.equal(attempts, 4);
      assert.equal(rollbackAttempts, phase === "启用新目录" ? 3 : 0, "备份没有成功就不能删除或恢复原位目录");
      assert.equal(readFileSync(path.join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME), "utf8"), oldManifest);
      assert.equal(readFileSync(current.store.statePath, "utf8"), oldState);
      assert.equal(current.store.getRecord("openpets.virtual-pet")?.version, "1.0.0");
      const failed = logs.find((entry) => entry.message === "Bundled plugin seed failed.");
      assert.equal(failed?.fields?.code, "EPERM");
      assert.equal(failed?.fields?.phase, phase);
      assert.equal(failed?.fields?.attempts, 4);
      assert.match(String(failed?.fields?.reason), new RegExp(phase, "u"));
    } finally {
      fs.rename = originalRename;
      await service.stop();
      removeFixture(current.directory);
    }
  });
}

test("目录 rename 的磁盘错误不重试，失败阶段可见且原目录得到恢复", async () => {
  const current = fixture(["openpets.virtual-pet"]);
  const runtime = new FakeRuntime();
  const service = new PluginService({ userDataPath: current.userData, stateStore: current.store, runtime: runtime as never, currentAppVersion: "4.0.1", bundledPluginSourceDirs: [current.official] });
  const originalRename = fs.rename;
  try {
    await service.seedBundledPlugins();
    const installPath = path.join(current.userData, "plugins", "openpets.virtual-pet");
    const oldManifest = readFileSync(path.join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME), "utf8");
    const oldState = readFileSync(current.store.statePath, "utf8");
    writeSource(current.official, "openpets.virtual-pet", "2.0.0");
    let attempts = 0;
    fs.rename = async (source, destination) => {
      if (path.basename(String(source)).startsWith(".tmp-bundled-") && String(destination) === installPath) {
        attempts += 1;
        throw Object.assign(new Error("测试夹具目录磁盘错误"), { code: "EIO" });
      }
      return originalRename(source, destination);
    };
    await service.seedBundledPlugins();
    assert.equal(attempts, 1);
    assert.equal(readFileSync(path.join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME), "utf8"), oldManifest);
    assert.equal(readFileSync(current.store.statePath, "utf8"), oldState);
    const failed = runtime.logs.find((entry) => entry.message === "Bundled plugin seed failed.");
    assert.equal(failed?.fields?.code, "EIO");
    assert.equal(failed?.fields?.phase, "启用新目录");
    assert.equal(failed?.fields?.attempts, 1);
  } finally {
    fs.rename = originalRename;
    await service.stop();
    removeFixture(current.directory);
  }
});
