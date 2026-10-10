import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { getZCodeSetup, installZCodeGlobal, removeZCodeGlobal } from "../src/agent-setup-zcode.js";

test("ZCode 官方全局配置生命周期保留用户的模型、其他 MCP 与 Hooks，原文件有备份", () => {
  const homeDir = mkdtempSync(join(realpathSync(tmpdir()), "desktop-pet-zcode-"));
  try {
    const configDir = join(homeDir, ".zcode", "cli");
    mkdirSync(configDir, { recursive: true });
    const configPath = join(configDir, "config.json");
    const original = { provider: { model: "glm" }, mcp: { servers: { memory: { command: "memory" } } }, hooks: { enabled: true, timeoutMs: 7000, events: { PreToolUse: [{ hooks: [{ type: "process", command: "user-check", args: [] }] }] } } };
    writeFileSync(configPath, JSON.stringify(original));
    const hookScriptPath = join(homeDir, "hook.cjs");
    const clientEntryPath = join(homeDir, "client.mjs");
    writeFileSync(hookScriptPath, "");
    writeFileSync(clientEntryPath, "");
    const dependencies = { homeDir, detected: true, nodeCommand: "node", hookScriptPath, clientEntryPath, discoveryPath: join(homeDir, "runtime", "ipc.json"), mcpCommand: "node", mcpArgs: [join(homeDir, "mcp.mjs")] };
    assert.equal(getZCodeSetup(dependencies).status.state, "needs_setup");
    assert.equal(installZCodeGlobal(dependencies).ok, true);
    assert.equal(getZCodeSetup(dependencies).status.state, "configured");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    assert.deepEqual(config.provider, original.provider);
    assert.deepEqual(config.mcp.servers.memory, original.mcp.servers.memory);
    assert.equal(config.hooks.events.PreToolUse[0].hooks[0].command, "user-check");
    assert.equal(config.hooks.timeoutMs, 7000);
    assert.equal(config.mcp.servers["desktop-pet"].env.OPENPETS_DISCOVERY_FILE, dependencies.discoveryPath);
    assert.equal(config.hooks.events.Stop[0].hooks[0].type, "process");
    assert.equal(readdirSync(configDir).some((name) => name.endsWith(".bak")), true);
    const stopHook = config.hooks.events.Stop[0].hooks[0];
    stopHook.enabled = false;
    writeFileSync(configPath, JSON.stringify(config));
    assert.equal(getZCodeSetup(dependencies).status.state, "needs_setup");
    stopHook.enabled = true;
    const originalArgs = [...stopHook.args];
    stopHook.args.push("--foreign-argument");
    writeFileSync(configPath, JSON.stringify(config));
    assert.equal(getZCodeSetup(dependencies).status.state, "needs_setup");
    stopHook.args = originalArgs;
    // 用户在同一 Hook 分组追加自己的命令后，卸载也只能删除本项目的命令。
    config.hooks.events.Stop[0].hooks.push({ type: "process", command: "user-stop", args: [] });
    writeFileSync(configPath, JSON.stringify(config));
    stopHook.enabled = false;
    writeFileSync(configPath, JSON.stringify(config));
    assert.equal(installZCodeGlobal(dependencies).ok, true);
    const reinstalled = JSON.parse(readFileSync(configPath, "utf8"));
    assert.equal(reinstalled.hooks.events.Stop.flatMap((group: { hooks: unknown[] }) => group.hooks).length, 2);
    assert.equal(getZCodeSetup(dependencies).status.state, "configured");
    assert.equal(removeZCodeGlobal(dependencies).ok, true);
    const final = JSON.parse(readFileSync(configPath, "utf8"));
    assert.deepEqual(final.hooks.events.Stop, [{ matcher: "*", hooks: [{ type: "process", command: "user-stop", args: [] }] }]);
    delete final.hooks.events.Stop;
    assert.deepEqual(final, original);
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
});

test("ZCode 不覆盖同名用户 MCP、不启用用户主动停用的 Hooks、不改无效 JSON", () => {
  const homeDir = mkdtempSync(join(realpathSync(tmpdir()), "desktop-pet-zcode-conflict-"));
  try {
    const configPath = join(homeDir, ".zcode", "cli", "config.json");
    mkdirSync(join(homeDir, ".zcode", "cli"), { recursive: true });
    const dependencies = { homeDir, detected: true, nodeCommand: "node", hookScriptPath: "missing", clientEntryPath: "missing", discoveryPath: "missing", mcpCommand: "node", mcpArgs: [] };
    for (const content of [JSON.stringify({ mcp: { servers: { "desktop-pet": { command: "other" } } } }), JSON.stringify({ hooks: { enabled: false } }), "{invalid"]) {
      writeFileSync(configPath, content);
      assert.equal(installZCodeGlobal(dependencies).ok, false);
      assert.equal(readFileSync(configPath, "utf8"), content);
    }
  } finally {
    rmSync(homeDir, { recursive: true, force: true });
  }
});
