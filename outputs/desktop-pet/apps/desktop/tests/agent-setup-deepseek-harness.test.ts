import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { getDeepSeekHarnessHome, getDeepSeekHarnessSetup, installDeepSeekHarness, removeDeepSeekHarness, type DeepSeekHarnessSetupDependencies } from "../src/agent-setup-deepseek-harness.js";

test("DSH_HOME 与官方一致：空白不指向当前目录，波浪线按用户目录展开", () => {
  const homeDir = realpathSync(tmpdir());
  assert.equal(getDeepSeekHarnessHome(homeDir, { DSH_HOME: "  " }), join(homeDir, ".dsh"));
  assert.equal(getDeepSeekHarnessHome(homeDir, { DSH_HOME: "~/custom-dsh" }), join(homeDir, "custom-dsh"));
  assert.equal(getDeepSeekHarnessHome(homeDir, { DSH_HOME: "~\\custom-dsh" }), join(homeDir, "custom-dsh"));
});

test("DSH 用官方 plugin 命令安装本机 bundle，仅移除本项目的依赖并保留用户 profile", async () => {
  const homeDir = mkdtempSync(join(realpathSync(tmpdir()), "desktop-pet-dsh-"));
  try {
    const profileDir = join(homeDir, "profiles", "web");
    mkdirSync(profileDir, { recursive: true });
    const configPath = join(profileDir, "package.json");
    const original = { dependencies: { "user-plugin": "1.0.0" }, dsh: { profile: { bundles: ["user-plugin"] } }, custom: "keep" };
    writeFileSync(configPath, JSON.stringify(original));
    const patch = "# 用户配置\n- override:\n    user-plugin:\n      disabled: false\n";
    writeFileSync(join(profileDir, "cordis.patch.yml"), patch);
    const commands: string[][] = [];
    const bundleSourceDir = join(process.cwd(), "assets", "agent-hooks", "deepseek-harness");
    const managedBundleDir = join(homeDir, "desktop-pet", "bundle");
    const dependencies: DeepSeekHarnessSetupDependencies = {
      dshHomeDir: homeDir, profile: "web", bundleSourceDir, managedBundleDir, discoveryPath: join(homeDir, "ipc.json"), preferredCommand: "dsh", detected: true,
      runCommand: async (args) => {
        commands.push([...args]);
        const config = JSON.parse(readFileSync(configPath, "utf8"));
        if (args[3] === "add") {
          config.dependencies["desktop-pet-dsh"] = `link:${managedBundleDir}`;
          config.dsh.profile.bundles.push("desktop-pet-dsh");
          // 模拟官方 CLI 全量整理时挤掉旧 MCP 插件及用户字段。
          config.dsh.profile.bundles = ["desktop-pet-dsh"];
          delete config.dependencies["user-plugin"];
          config.custom = "unexpected-rewrite";
          const installedDir = join(profileDir, "node_modules", "desktop-pet-dsh");
          mkdirSync(installedDir, { recursive: true });
          copyFileSync(join(bundleSourceDir, "package.json"), join(installedDir, "package.json"));
        } else {
          delete config.dependencies["desktop-pet-dsh"];
          config.dsh.profile.bundles = config.dsh.profile.bundles.filter((name: string) => name !== "desktop-pet-dsh");
          config.dsh.profile.bundles = [];
        }
        writeFileSync(configPath, JSON.stringify(config));
        return { ok: true, stdout: "", stderr: "" };
      },
    };
    assert.equal(getDeepSeekHarnessSetup(dependencies).status.state, "needs_setup");
    assert.equal((await installDeepSeekHarness(dependencies)).ok, true);
    assert.equal(getDeepSeekHarnessSetup(dependencies).status.state, "configured");
    assert.deepEqual(commands[0], ["plugin", "--profile", "web", "add", managedBundleDir]);
    assert.equal(JSON.parse(readFileSync(join(managedBundleDir, "settings.json"), "utf8")).discoveryPath, dependencies.discoveryPath);
    writeFileSync(join(managedBundleDir, "index.mjs"), "// 旧版联动\n");
    assert.equal(getDeepSeekHarnessSetup(dependencies).status.state, "needs_setup");
    assert.equal(getDeepSeekHarnessSetup(dependencies).status.canInstall, true);
    copyFileSync(join(bundleSourceDir, "index.mjs"), join(managedBundleDir, "index.mjs"));
    assert.equal((await removeDeepSeekHarness(dependencies)).ok, true);
    assert.deepEqual(JSON.parse(readFileSync(configPath, "utf8")), original);
    assert.equal(readFileSync(join(profileDir, "cordis.patch.yml"), "utf8"), patch);
    assert.deepEqual(commands[1], ["plugin", "--profile", "web", "remove", "desktop-pet-dsh"]);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
});

test("DSH 安装命令中途失败也保留原 MCP 与用户配置", async () => {
  const homeDir = mkdtempSync(join(realpathSync(tmpdir()), "desktop-pet-dsh-failed-"));
  try {
    const profileDir = join(homeDir, "profiles", "web");
    mkdirSync(profileDir, { recursive: true });
    const configPath = join(profileDir, "package.json");
    const original = {
      dependencies: { "user-mcp": "1.0.0" },
      dsh: { profile: { bundles: ["user-mcp"], custom: "保留" } },
    };
    writeFileSync(configPath, JSON.stringify(original));
    const dependencies: DeepSeekHarnessSetupDependencies = {
      dshHomeDir: homeDir,
      profile: "web",
      bundleSourceDir: join(process.cwd(), "assets", "agent-hooks", "deepseek-harness"),
      managedBundleDir: join(homeDir, "bundle"),
      discoveryPath: join(homeDir, "ipc.json"),
      preferredCommand: "dsh",
      detected: true,
      runCommand: async () => {
        writeFileSync(configPath, JSON.stringify({ dependencies: {}, dsh: { profile: { bundles: [] } } }));
        throw new Error("命令中途失败");
      },
    };
    assert.equal((await installDeepSeekHarness(dependencies)).ok, false);
    assert.deepEqual(JSON.parse(readFileSync(configPath, "utf8")), original);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
});

test("DSH 同名外部包不被替换，CLI 成功但未登记 bundle 也不标为已连接", async () => {
  const homeDir = mkdtempSync(join(realpathSync(tmpdir()), "desktop-pet-dsh-unverified-"));
  try {
    const profileDir = join(homeDir, "profiles", "web");
    mkdirSync(profileDir, { recursive: true });
    const configPath = join(profileDir, "package.json");
    const dependencies: DeepSeekHarnessSetupDependencies = { dshHomeDir: homeDir, profile: "web", bundleSourceDir: join(process.cwd(), "assets", "agent-hooks", "deepseek-harness"), managedBundleDir: join(homeDir, "bundle"), discoveryPath: join(homeDir, "ipc.json"), preferredCommand: "dsh", detected: true, runCommand: async () => ({ ok: true, stdout: "", stderr: "" }) };
    writeFileSync(configPath, JSON.stringify({ dependencies: { "desktop-pet-dsh": "1.0.0" } }));
    const before = readFileSync(configPath, "utf8");
    assert.equal(getDeepSeekHarnessSetup(dependencies).status.state, "conflict");
    assert.equal((await installDeepSeekHarness(dependencies)).ok, false);
    assert.equal((await removeDeepSeekHarness(dependencies)).changed, false);
    assert.equal(readFileSync(configPath, "utf8"), before);
    writeFileSync(configPath, "{}");
    assert.equal((await installDeepSeekHarness(dependencies)).ok, false);
    assert.equal(getDeepSeekHarnessSetup(dependencies).status.state, "needs_setup");
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
});
