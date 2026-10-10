import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import { getCodexSetup, installCodexHooks, removeCodexHooks, testCodexHooks, type CodexSetupDependencies } from "../src/agent-setup-codex.js";

function fixture(): { readonly root: string; readonly deps: CodexSetupDependencies; readonly output: string } {
  const root = mkdtempSync(join(tmpdir(), "desktop-pet-codex-"));
  const output = join(root, "events.jsonl");
  const clientEntryPath = join(root, "client.mjs");
  const discoveryPath = join(root, "ipc.json");
  writeFileSync(discoveryPath, "{}");
  writeFileSync(clientEntryPath, `import { appendFileSync } from "node:fs";
export function createOpenPetsClient(options) {
  if (options.remote !== false || options.discoveryPath !== ${JSON.stringify(discoveryPath)}) throw new Error("不能选远程链路");
  return { status: async () => ({ appRunning: true }), react: async (reaction) => {
    appendFileSync(${JSON.stringify(output)}, JSON.stringify({ reaction }) + "\\n");
  } };
}
export function readDiscoveryFile(path) {
  if (path !== ${JSON.stringify(discoveryPath)}) throw new Error("不能切换发现档案");
  return { path };
}
export async function sendRequest(discovery, method, params) {
  if (discovery.path !== ${JSON.stringify(discoveryPath)} || method !== "pet.react") throw new Error("不能切换链路");
  appendFileSync(${JSON.stringify(output)}, JSON.stringify(params) + "\\n");
}`);
  return { root, output, deps: { codexDir: join(root, "Codex 配置 空格"), nodeCommand: process.execPath,
    clientEntryPath, discoveryPath, detected: true, formatUserPath: (path) => path } };
}

function clean(root: string): void {
  const target = resolve(root);
  assert.ok(target.startsWith(resolve(tmpdir()) + "\\") || target.startsWith(resolve(tmpdir()) + "/"));
  rmSync(target, { recursive: true, force: true });
}

async function runHook(deps: CodexSetupDependencies, payload: string, shellCommand?: string): Promise<{ readonly code: number | null; readonly stdout: string; readonly stderr: string }> {
  return new Promise((resolveResult, reject) => {
    const command = shellCommand ? process.env.COMSPEC ?? "cmd.exe" : deps.nodeCommand;
    const args = shellCommand ? ["/d", "/s", "/c", `"${shellCommand}"`]
      : [join(deps.codexDir, "desktop-pet", "codex-hook.mjs"), "--desktop-pet-codex-managed"];
    const child = spawn(command, args, { shell: false, windowsHide: true, ...(shellCommand ? { windowsVerbatimArguments: true } : {}) });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString("utf8"); });
    child.on("error", reject);
    child.on("close", (code) => resolveResult({ code, stdout, stderr }));
    child.stdin.end(payload);
  });
}

test("Codex 安装和移除保留其他 hooks、配置和字节备份，重复安装无改动", () => {
  const { root, deps } = fixture();
  try {
    mkdirSync(deps.codexDir, { recursive: true });
    const original = '\uFEFF{"description":"原配置", "custom":7, "hooks":{"Stop":[{"matcher":"*", "hooks":[{"type":"command","command":"echo keep"}]}]}}';
    const configPath = join(deps.codexDir, "hooks.json");
    const tomlPath = join(deps.codexDir, "config.toml");
    writeFileSync(configPath, original);
    writeFileSync(tomlPath, 'model = "自有配置"\n');
    assert.equal(getCodexSetup(deps).status.state, "needs_setup");
    assert.equal(installCodexHooks(deps).ok, true);
    const status = getCodexSetup(deps).status;
    assert.equal(status.state, "configured");
    assert.equal(status.trust, "requires_review");
    assert.equal(status.canTest, true);
    const backups = readdirSync(deps.codexDir).filter((name) => name.endsWith(".bak"));
    assert.ok(backups.some((name) => readFileSync(join(deps.codexDir, name), "utf8") === original));
    assert.equal(installCodexHooks(deps).changed, false);
    const configured = JSON.parse(readFileSync(configPath, "utf8"));
    assert.equal(configured.hooks.Stop[0].hooks[0].command, "echo keep");
    assert.equal(configured.custom, 7);
    // 用户把两个 handlers 合到同一 matcher 后，卸载仍只移除自有 handler。
    configured.hooks.Stop[0].hooks.push(configured.hooks.Stop.pop().hooks[0]);
    writeFileSync(configPath, JSON.stringify(configured));
    assert.equal(getCodexSetup(deps).status.state, "needs_update");
    assert.equal(removeCodexHooks(deps).ok, true);
    assert.deepEqual(JSON.parse(readFileSync(configPath, "utf8")), JSON.parse(original.slice(1)));
    assert.equal(readFileSync(tomlPath, "utf8"), 'model = "自有配置"\n');
    assert.equal(removeCodexHooks(deps).changed, false);
  } finally { clean(root); }
});

test("Codex 拒绝无效配置和脚本冲突，不能覆盖用户文件", () => {
  const { root, deps } = fixture();
  try {
    const folder = join(deps.codexDir, "desktop-pet");
    mkdirSync(folder, { recursive: true });
    const configPath = join(deps.codexDir, "hooks.json");
    writeFileSync(configPath, '{"hooks":{"Stop":{}}}');
    assert.equal(installCodexHooks(deps).ok, false);
    assert.equal(readFileSync(configPath, "utf8"), '{"hooks":{"Stop":{}}}');
    writeFileSync(configPath, "{}");
    const scriptPath = join(folder, "codex-hook.mjs");
    writeFileSync(scriptPath, "这是用户文件");
    assert.equal(getCodexSetup(deps).status.state, "error");
    assert.equal(installCodexHooks(deps).ok, false);
    assert.equal(removeCodexHooks(deps).ok, false);
    assert.equal(readFileSync(scriptPath, "utf8"), "这是用户文件");
    assert.equal(readFileSync(configPath, "utf8"), "{}");
  } finally { clean(root); }
});

test("生成的 Codex 桥接实际处理生命周期、编辑及运行事件，只用本档案本地 IPC", async () => {
  const { root, deps, output } = fixture();
  try {
    assert.equal(installCodexHooks(deps).ok, true);
    for (const payload of [
      { hook_event_name: "UserPromptSubmit", prompt: "不得传出的秘密" },
      { hook_event_name: "PreToolUse", tool_name: "apply_patch", tool_input: { command: "秘密代码" } },
      { hook_event_name: "PreToolUse", tool_name: "Bash" },
      { hook_event_name: "PermissionRequest" },
      { hook_event_name: "PostToolUse" },
      { hook_event_name: "Stop" },
      { hook_event_name: "Interrupt" },
      { hook_event_name: "SessionEnd", transcript_path: "不得读取此文件" },
    ]) {
      const result = await runHook(deps, JSON.stringify(payload));
      assert.deepEqual(result, { code: 0, stdout: "", stderr: "" });
    }
    assert.deepEqual(readFileSync(output, "utf8").trim().split("\n").map((line) => JSON.parse(line)),
      ["thinking", "editing", "running", "waiting", "thinking", "idle", "idle", "idle"].map((reaction) => ({ reaction })));
    const before = readFileSync(output, "utf8");
    for (const bad of ["{", "[]", '{"hook_event_name":"未知"}', '{"hook_event_name":["Stop"]}', " ".repeat(65537)]) {
      assert.deepEqual(await runHook(deps, bad), { code: 0, stdout: "", stderr: "" });
    }
    assert.equal(readFileSync(output, "utf8"), before);
    assert.equal((await testCodexHooks(deps)).ok, true);
    assert.equal(JSON.parse(readFileSync(output, "utf8").trim().split("\n").at(-1)!).reaction, "waving");
  } finally { clean(root); }
});

test("Codex Windows 官方 COMSPEC 执行命令支持中文和空格路径", { skip: process.platform !== "win32" }, async () => {
  const { root, deps, output } = fixture();
  try {
    assert.equal(installCodexHooks(deps).ok, true);
    const command = getCodexSetup(deps).preview.commandWindows;
    const result = await runHook(deps, '{"hook_event_name":"UserPromptSubmit"}', command);
    assert.deepEqual(result, { code: 0, stdout: "", stderr: "" });
    assert.equal(JSON.parse(readFileSync(output, "utf8").trim()).reaction, "thinking");
  } finally { clean(root); }
});

test("生成的 Codex 回调实际发出会话/工具/文件摘要，绝不转发原文与路径", async () => {
  const { root, deps, output } = fixture();
  try {
    assert.equal(installCodexHooks(deps).ok, true);
    const payload = { hook_event_name: "PostToolUse", session_id: "真实会话", turn_id: "真实回合", tool_use_id: "真实调用",
      tool_name: "apply_patch", cwd: "C:/private/project", tool_input: { command: "秘密代码" },
      tool_response: { output: "Success. Updated the following files:\nM a.ts\nA b.ts\nD c.ts\n" } };
    assert.deepEqual(await runHook(deps, JSON.stringify(payload)), { code: 0, stdout: "", stderr: "" });
    const sent = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(sent.externalAi.adapter, "codex");
    assert.equal(sent.externalAi.event, "tool-complete");
    assert.equal(sent.externalAi.editedFileIds.length, 3);
    assert.match(sent.externalAi.sessionId, /^[a-f0-9]{64}$/);
    for (const secret of ["真实", "private", "秘密", "a.ts", "b.ts", "c.ts"]) assert.equal(JSON.stringify(sent).includes(secret), false);
  } finally { clean(root); }
});

test("Codex 链路不可用时报告失败，事件回调仍不阻塞或输出用户数据", async () => {
  const { root, deps } = fixture();
  try {
    writeFileSync(deps.clientEntryPath, 'export function createOpenPetsClient() { return { status: async () => { throw new Error("不可用"); }, react: async () => { throw new Error("不可用"); } }; }');
    assert.equal(installCodexHooks(deps).ok, true);
    assert.equal((await testCodexHooks(deps)).ok, false);
    assert.deepEqual(await runHook(deps, '{"hook_event_name":"UserPromptSubmit","prompt":"秘密"}'), { code: 0, stdout: "", stderr: "" });
    unlinkSync(deps.clientEntryPath);
    assert.deepEqual(await runHook(deps, '{"hook_event_name":"UserPromptSubmit","prompt":"秘密"}'), { code: 0, stdout: "", stderr: "" });
  } finally { clean(root); }
});

test("Codex 生成桥接通过真实 client 协议连接指定档案，不选择远程接口", async () => {
  const { root, deps } = fixture();
  const cliEntry = createRequire(join(process.cwd(), "package.json")).resolve("@open-pets/cli");
  const clientEntryPath = createRequire(cliEntry).resolve("@open-pets/client");
  const requests: Array<Record<string, unknown>> = [];
  const token = "temporary-codex-test-token-12345";
  const server = net.createServer((socket) => {
    let pending = "";
    socket.on("data", (chunk: Buffer) => {
      pending += chunk.toString("utf8");
      const newline = pending.indexOf("\n");
      if (newline < 0) return;
      const request = JSON.parse(pending.slice(0, newline)) as Record<string, unknown>;
      requests.push(request);
      socket.end(JSON.stringify({ id: request.id, ok: true,
        result: request.method === "status" ? { ok: true, appRunning: true } : { ok: true, shown: true } }) + "\n");
    });
  });
  try {
    await new Promise<void>((resolveReady, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolveReady);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    writeFileSync(deps.discoveryPath, JSON.stringify({ protocol: "openpets-ipc", protocolVersion: 1,
      endpoint: `tcp://127.0.0.1:${address.port}`, token, appVersion: "test", pid: process.pid, platform: process.platform }));
    const actualDeps = { ...deps, clientEntryPath };
    assert.equal(installCodexHooks(actualDeps).ok, true);
    assert.deepEqual(await runHook(actualDeps, '{"hook_event_name":"PreToolUse","tool_name":"apply_patch","tool_input":{"command":"私有代码"}}'),
      { code: 0, stdout: "", stderr: "" });
    assert.equal((await testCodexHooks(actualDeps)).ok, true);
    assert.deepEqual(requests.map((request) => request.method), ["pet.react", "status", "pet.react"]);
    assert.deepEqual(requests.map((request) => request.params), [{ reaction: "editing" }, {}, { reaction: "waving" }]);
    assert.ok(requests.every((request) => request.token === token));
    assert.ok(!JSON.stringify(requests).includes("私有代码"));
  } finally {
    await new Promise<void>((resolveClosed) => server.close(() => resolveClosed()));
    clean(root);
  }
});
