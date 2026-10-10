import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { test } from "node:test";

import { OPENPETS_PLUGIN_MANIFEST_FILENAME } from "../src/plugin-manifest.js";
import { PluginService } from "../src/plugin-service.js";
import { PluginStateStore, type PluginStateRecord } from "../src/plugin-state.js";

class TestRuntime {
  startedRecords: PluginStateRecord[] = [];
  reloads: string[] = [];
  constructor(readonly store: PluginStateStore) {}
  async start(): Promise<void> { this.startedRecords = this.store.listRecords(); }
  async stop(): Promise<void> {}
  async reloadPlugin(id: string): Promise<void> { this.reloads.push(id); }
  isPluginActive(): boolean { return false; }
  getPluginState(): { commands: []; menuItems: [] } { return { commands: [], menuItems: [] }; }
}

function writePlugin(folder: string, id: string, version = "1.0.0"): void {
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, OPENPETS_PLUGIN_MANIFEST_FILENAME), JSON.stringify({
    manifestVersion: 3, id, name: "测试插件", version, runtime: "javascript", sdkVersion: "3.0.0", entry: "index.js",
    permissions: ["pet:speak", "network"], network: { hosts: ["assets.example.com"] },
    configSchema: { minutes: { type: "number", default: 30 } },
  }));
  writeFileSync(join(folder, "index.js"), `OpenPetsPlugin.register({ start() {} });\n// 测试版本：${version}\n`);
}

function fixture() {
  const directory = mkdtempSync(join(process.cwd(), "plugin-distribution-test-"));
  const userData = join(directory, "data");
  const sources = join(directory, "sources");
  mkdirSync(userData);
  mkdirSync(sources);
  const store = new PluginStateStore({ userDataPath: userData });
  store.initialize();
  const runtime = new TestRuntime(store);
  const service = new PluginService({ userDataPath: userData, stateStore: store, runtime: runtime as never, seedBundledPlugins: false, bundledPluginSourceDirs: [sources] });
  return { directory, userData, sources, store, runtime, service };
}

function cleanup(directory: string): void {
  assert.equal(dirname(resolve(directory)), resolve(process.cwd()));
  assert.ok(basename(directory).startsWith("plugin-distribution-test-"));
  rmSync(directory, { recursive: true, force: true });
}

function installRecord(current: ReturnType<typeof fixture>, id: string, source: "catalog" | "local", bundled = true): PluginStateRecord {
  const installPath = join(current.userData, source === "catalog" ? "plugins" : "plugins-dev", id);
  writePlugin(installPath, id);
  const sourcePath = source === "local" ? join(current.sources, id) : undefined;
  if (sourcePath) writePlugin(sourcePath, id);
  return current.store.upsertRecord({
    id, version: "1.0.0", source, sourcePath, bundled: bundled || undefined,
    installPath, manifestPath: join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME),
    manifestVersion: 3, runtime: "javascript", sdkVersion: "3.0.0", enabled: false,
    approvedPermissions: ["pet:speak", "network"], approvedNetworkHosts: ["assets.example.com"],
    config: { minutes: 45 }, update: { availableVersion: "2.0.0" },
  });
}

test("独立发行新档案不自动安装插件，即使旧内置源目录仍存在", async () => {
  const current = fixture();
  try {
    writePlugin(join(current.sources, "openpets.virtual-pet"), "openpets.virtual-pet");
    await current.service.start();
    assert.deepEqual(current.store.listRecords(), []);
    assert.deepEqual(current.runtime.startedRecords, []);
    assert.equal(existsSync(join(current.userData, "plugins", "openpets.virtual-pet")), false);
  } finally {
    await current.service.stop();
    cleanup(current.directory);
  }
});

test("独立发行解除旧内置标识并保留配置、授权、来源、退役编号及插件文件", async () => {
  const current = fixture();
  try {
    const records = [
      installRecord(current, "openpets.virtual-pet", "catalog"),
      installRecord(current, "openpets.pomodoro", "catalog"),
      installRecord(current, "community.personal", "local"),
      installRecord(current, "community.plain", "local", false),
    ];
    const managed = installRecord(current, "managed.existing", "local");
    records.push(current.store.upsertRecord({
      ...managed, source: "team", teamPolicy: "required",
      teamOwnership: { organizationId: "existing", itemId: "managed", artifactVersionId: "one", releaseId: "one" },
    }));
    writePlugin(join(current.sources, "openpets.virtual-pet"), "openpets.virtual-pet", "9.0.0");
    const storage = join(current.userData, "plugin-storage", "openpets.virtual-pet.json");
    const sound = join(current.userData, "plugin-user-sounds", "openpets.virtual-pet", "tone.ogg");
    mkdirSync(dirname(storage), { recursive: true });
    mkdirSync(dirname(sound), { recursive: true });
    writeFileSync(storage, '{"visits":9}');
    writeFileSync(sound, "保存的自选声音");
    const beforeFiles = records.map((record) => readFileSync(join(record.installPath, "index.js"), "utf8"));
    const beforeRecords = current.store.listRecords();
    await current.service.start();
    const expected = beforeRecords.map((installed) => {
      if (installed.source === "team") return installed;
      const { bundled: _bundled, ...record } = installed;
      return record;
    });
    assert.deepEqual(current.store.listRecords(), expected);
    assert.deepEqual(current.runtime.startedRecords, expected, "运行时启动前已解除内置标识");
    assert.deepEqual(records.map((record) => readFileSync(join(record.installPath, "index.js"), "utf8")), beforeFiles);
    assert.equal(readFileSync(storage, "utf8"), '{"visits":9}');
    assert.equal(readFileSync(sound, "utf8"), "保存的自选声音");
    const persisted = new PluginStateStore({ userDataPath: current.userData });
    persisted.read();
    assert.deepEqual(persisted.listRecords(), expected);
    const next = new PluginService({ userDataPath: current.userData, stateStore: persisted, runtime: new TestRuntime(persisted) as never, seedBundledPlugins: false, bundledPluginSourceDirs: [current.sources] });
    await next.start();
    assert.deepEqual(persisted.listRecords(), expected, "重启不能重新标记、覆盖或删除已有插件");
    await next.stop();
  } finally {
    await current.service.stop();
    cleanup(current.directory);
  }
});

test("迁移后旧插件可正常卸载，本地更新保留用户配置并且重启不重新安装", async () => {
  const current = fixture();
  try {
    const catalog = installRecord(current, "openpets.virtual-pet", "catalog");
    const local = installRecord(current, "community.personal", "local");
    await current.service.start();
    const removal = await current.service.uninstall(catalog.id);
    assert.equal(removal.ok, true);
    assert.equal(current.store.getRecord(catalog.id), undefined);
    assert.equal(existsSync(catalog.installPath), false);
    const sourcePath = local.sourcePath;
    assert.ok(sourcePath);
    writePlugin(sourcePath, local.id, "2.0.0");
    const update = await current.service.loadLocalPath(sourcePath, { autoApprove: false });
    assert.equal(update.ok, true);
    assert.equal(current.store.getRecord(local.id)?.version, "2.0.0");
    assert.equal(current.store.getRecord(local.id)?.enabled, false);
    assert.deepEqual(current.store.getRecord(local.id)?.config, local.config);
    assert.equal(current.store.getRecord(local.id)?.sourcePath, local.sourcePath);
    await current.service.start();
    assert.equal(current.store.getRecord(catalog.id), undefined);
    assert.equal(current.store.getRecord(local.id)?.bundled, undefined);
    assert.equal(current.store.listRecords().length, 1);
  } finally {
    await current.service.stop();
    cleanup(current.directory);
  }
});
