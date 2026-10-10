import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { test } from "node:test";

import { getExternalAiSetups, runExternalAiSetupAction, type ExternalAiCommandResult, type ExternalAiSetupDependencies } from "../src/agent-setup-external.js";
import type { ExternalAiSetupAction } from "../src/external-ai-setup-types.js";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "desktop-pet-external-"));
  const desktopDir = resolve(process.cwd());
  const requireDesktop = createRequire(join(desktopDir, "package.json"));
  const cliEntry = requireDesktop.resolve("@open-pets/cli");
  const calls: Array<{ readonly command: string; readonly args: readonly string[]; readonly input?: string }> = [];
  const docs: string[] = [];
  const testResponse: { current: ExternalAiCommandResult } = { current: { ok: false, stdout: "", stderr: "本机测试失败" } };
  const context: ExternalAiSetupDependencies = {
    homeDir: join(root, "home"),
    dataDir: join(root, "data"),
    codexDir: join(root, "custom-codex-home"),
    env: { ...process.env, DSH_HOME: join(root, "custom-dsh-home") },
    platform: process.platform,
    nodeCommand: process.execPath,
    dshCommand: "dsh-test-missing",
    dshProfile: "desktop",
    clientEntryPath: createRequire(cliEntry).resolve("@open-pets/client"),
    mcpEntryPath: requireDesktop.resolve("@open-pets/mcp"),
    discoveryPath: join(root, "data", "runtime", "ipc.json"),
    assetsDir: join(desktopDir, "assets", "agent-hooks"),
    runCommand: async (command, args, _timeoutMs, input) => {
      calls.push({ command, args: [...args], input });
      if (command === process.execPath && args[0] === "-p") {
        return { ok: true, stdout: process.execPath + "\n", stderr: "" };
      }
      if (args.includes("--test")) return testResponse.current;
      return { ok: false, stdout: "", stderr: "测试环境未安装该外部工具" };
    },
    openDocumentation: async (url) => { docs.push(url); },
    formatUserPath: (path) => path,
  };
  mkdirSync(context.homeDir);
  mkdirSync(context.dataDir);
  return { root, context, calls, docs, testResponse };
}

function clean(root: string): void {
  const owned = relative(tmpdir(), root);
  assert.ok(owned.startsWith("desktop-pet-external-") && !owned.includes(".."));
  rmSync(root, { recursive: true, force: true });
}

test("四个新增外部入口的快照只读，未接入客户端不能标为已联动", async () => {
  const { root, context } = fixture();
  try {
    const setups = await getExternalAiSetups(context);
    assert.deepEqual(setups.map((item) => item.id), ["codex", "zcode", "deepseek-harness", "doubao"]);
    assert.ok(setups.every((item) => item.state !== "configured"));
    const doubao = setups.find((item) => item.id === "doubao")!;
    assert.equal(doubao.state, "needs_setup");
    assert.match(doubao.details, /客户端自动监测未支持/);
    assert.equal(doubao.canTest, false);
    const dsh = setups.find((item) => item.id === "deepseek-harness")!;
    assert.equal(dsh.state, "not_detected");
    assert.equal(dsh.canInstall, false);
    assert.equal(dsh.canTest, true);
    assert.ok(dsh.configPath?.startsWith(context.env.DSH_HOME!));
    assert.equal(JSON.parse(dsh.preview!).profile, "desktop");
    assert.deepEqual(readdirSync(context.homeDir), []);
    assert.deepEqual(readdirSync(context.dataDir), []);
    assert.equal(existsSync(context.codexDir), false);
    assert.equal(existsSync(context.env.DSH_HOME!), false);
  } finally { clean(root); }
});

test("四个官方文档动作仅打开固定地址，不运行检测或安装命令", async () => {
  const { root, context, calls, docs } = fixture();
  try {
    const actions: ExternalAiSetupAction[] = ["codex-docs", "zcode-docs", "deepseek-harness-docs", "doubao-docs"];
    for (const action of actions) {
      const result = await runExternalAiSetupAction(action, context);
      assert.equal(result.ok, true);
      assert.equal(result.changed, false);
    }
    assert.deepEqual(docs, [
      "https://learn.chatgpt.com/docs/hooks",
      "https://zcode.z.ai/cn/docs/hooks",
      "https://deepseek-harness.github.io/deepseek-harness/",
      "https://docs.volcengine.com/docs/ark/function-calling?lang=zh",
    ]);
    assert.deepEqual(calls, []);
    assert.deepEqual(readdirSync(context.homeDir), []);
    assert.deepEqual(readdirSync(context.dataDir), []);
  } finally { clean(root); }
});

test("配置文件存在不能代替程序检测，版本可用也不能算真实会话已接入", async () => {
  const { root, context } = fixture();
  try {
    const configPath = join(context.homeDir, ".zcode", "cli", "config.json");
    mkdirSync(join(context.homeDir, ".zcode", "cli"), { recursive: true });
    writeFileSync(configPath, "{}");
    const runCommand = context.runCommand;
    const detected = await getExternalAiSetups({ ...context, runCommand: async (command, args, timeout, input) => {
      if (command === "codex" && args[0] === "--version") return { ok: true, stdout: "codex-cli 0.162.0", stderr: "" };
      return runCommand(command, args, timeout, input);
    } });
    const codex = detected.find((item) => item.id === "codex")!;
    const zcode = detected.find((item) => item.id === "zcode")!;
    assert.equal(codex.program.detected, true);
    assert.equal(codex.state, "needs_setup");
    assert.equal(codex.session.state, "unconfirmed");
    assert.equal(zcode.program.detected, false);
    assert.equal(zcode.state, "needs_setup");
    assert.equal(zcode.session.state, "unconfirmed");
    assert.equal(readFileSync(configPath, "utf8"), "{}", "读取就绪状态不得改写原工具配置");
  } finally { clean(root); }
});

test("程序版本检测超时显示未确认，不能判定为未安装或真实联动", async () => {
  const { root, context } = fixture();
  try {
    const runCommand = context.runCommand;
    const setups = await getExternalAiSetups({ ...context, runCommand: async (command, args, timeout, input) => {
      if (command === "codex" && args[0] === "--version") return { ok: false, stdout: "", stderr: "", timedOut: true };
      return runCommand(command, args, timeout, input);
    } });
    const codex = setups.find((item) => item.id === "codex")!;
    assert.equal(codex.program.detected, false);
    assert.match(codex.program.label, /超时/);
    assert.equal(codex.session.state, "unconfirmed");
    assert.equal(existsSync(context.codexDir), false);
  } finally { clean(root); }
});

test("Codex 编排使用指定隔离 CODEX_HOME，安装移除保留其他 hooks 和默认目录", async () => {
  const { root, context } = fixture();
  try {
    mkdirSync(context.codexDir);
    const defaultCodexDir = join(context.homeDir, ".codex");
    mkdirSync(defaultCodexDir);
    const untouched = '{"description":"默认目录里的用户配置"}';
    writeFileSync(join(defaultCodexDir, "hooks.json"), untouched);
    const original = { description: "保留配置", hooks: { Stop: [{ hooks: [{ type: "command", command: "echo keep" }] }] }, custom: "保留扩展字段" };
    const configPath = join(context.codexDir, "hooks.json");
    writeFileSync(configPath, JSON.stringify(original));
    const installed = await runExternalAiSetupAction("codex-install", context);
    assert.equal(installed.ok, true);
    assert.equal(installed.changed, true);
    const setup = (await getExternalAiSetups(context)).find((item) => item.id === "codex")!;
    assert.equal(setup.state, "configured");
    assert.equal(setup.configPath, configPath);
    assert.match(setup.details, /信任.*无法.*确认/);
    assert.equal((await runExternalAiSetupAction("codex-install", context)).changed, false);
    const removed = await runExternalAiSetupAction("codex-remove", context);
    assert.equal(removed.ok, true);
    assert.equal(removed.changed, true);
    assert.deepEqual(JSON.parse(readFileSync(configPath, "utf8")), original);
    assert.equal(readFileSync(join(defaultCodexDir, "hooks.json"), "utf8"), untouched);
    assert.ok(readdirSync(context.codexDir).some((name) => name.endsWith(".bak")));
  } finally { clean(root); }
});

test("豆包编排只准备本档案的桥，移除保留旁边资料且不声称客户端已连接", async () => {
  const { root, context } = fixture();
  try {
    const installed = await runExternalAiSetupAction("doubao-install", context);
    assert.equal(installed.ok, true);
    assert.equal(installed.changed, true);
    const setup = (await getExternalAiSetups(context)).find((item) => item.id === "doubao")!;
    assert.equal(setup.state, "configured");
    assert.match(setup.label, /本机桥/);
    assert.match(setup.details, /客户端自动监测未支持/);
    assert.ok(setup.configPath?.startsWith(context.dataDir));
    assert.equal(existsSync(setup.configPath!), true);
    const bridgeContent = readFileSync(setup.configPath!, "utf8");
    assert.equal((await runExternalAiSetupAction("doubao-install", context)).changed, false);
    assert.equal(readFileSync(setup.configPath!, "utf8"), bridgeContent);
    const notes = join(context.dataDir, "integrations", "doubao", "user-notes.txt");
    writeFileSync(notes, "用户资料保留");
    assert.equal((await runExternalAiSetupAction("doubao-remove", context)).ok, true);
    assert.equal(existsSync(setup.configPath!), false);
    assert.equal(readFileSync(notes, "utf8"), "用户资料保留");
    assert.deepEqual(readdirSync(context.homeDir), []);
  } finally { clean(root); }
});

test("ZCode 本机测试必须收到有效本地 ACK，安静退出或非 ACK 不能假报成功", async () => {
  const { root, context, calls, testResponse } = fixture();
  try {
    for (const stdout of ["", "普通日志", "null", "{}", '{"ok":true}', '{"ok":true,"localOnly":false}', '{"ok":"true","localOnly":true}']) {
      testResponse.current = { ok: true, stdout, stderr: "" };
      assert.equal((await runExternalAiSetupAction("zcode-test", context)).ok, false);
    }
    testResponse.current = { ok: false, stdout: '{"ok":true,"localOnly":true}', stderr: "执行失败" };
    assert.equal((await runExternalAiSetupAction("zcode-test", context)).ok, false);
    testResponse.current = { ok: true, stdout: '{"ok":true,"localOnly":true}\n', stderr: "" };
    const passed = await runExternalAiSetupAction("zcode-test", context);
    assert.equal(passed.ok, true);
    assert.equal(passed.changed, false);
    const call = calls.filter((item) => item.args.includes("--test")).at(-1)!;
    assert.equal(call.command, process.execPath);
    assert.equal(call.args[0], join(context.assetsDir, "zcode-pet-hook.cjs"));
    assert.equal(call.args[call.args.indexOf("--discovery-file") + 1], context.discoveryPath);
    assert.equal(call.input, "{}");
    assert.deepEqual(readdirSync(context.homeDir), []);
    assert.deepEqual(readdirSync(context.dataDir), []);
  } finally { clean(root); }
});
