import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { testDeepSeekHarness, type DeepSeekHarnessSetupDependencies } from "../src/agent-setup-deepseek-harness.js";

test("真实 ZCode 子进程与 DSH Cordis bundle 只把状态发到本档案 IPC；测试失败不会假报成功", async () => {
  const homeDir = mkdtempSync(join(realpathSync(tmpdir()), "desktop-pet-agent-bridge-"));
  const received: Array<{ method: string; params: { reaction?: string; message?: string } }> = [];
  const server = createServer((socket) => {
    let raw = "";
    socket.on("data", (chunk) => {
      raw += chunk;
      const newline = raw.indexOf("\n");
      if (newline < 0) return;
      const request = JSON.parse(raw.slice(0, newline));
      received.push(request);
      socket.end(`${JSON.stringify({ id: request.id, ok: true, result: { appRunning: true } })}\n`);
    });
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const discoveryPath = join(homeDir, "ipc.json");
    writeFileSync(discoveryPath, JSON.stringify({ protocol: "openpets-ipc", protocolVersion: 1, endpoint: `tcp://127.0.0.1:${address.port}`, token: "local-test-token-123456", appVersion: "4.0.1", pid: process.pid, platform: process.platform }));
    const assetDir = join(process.cwd(), "assets", "agent-hooks");
    const runtimePath = join(assetDir, "deepseek-harness", "runtime.mjs");
    const hookPath = join(assetDir, "zcode-pet-hook.cjs");
    const hookArgs = ["--client-entry", runtimePath, "--discovery-file", discoveryPath];
    const input = JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Edit", prompt: "PRIVATE_PROMPT", tool_input: { file_path: "C:/PRIVATE_PATH", token: "PRIVATE_SECRET" }, tool_response: "PRIVATE_RESULT" });
    assert.equal((await runHook(hookPath, hookArgs, input)).code, 0);
    assert.equal(received.at(-1)?.params.reaction, "editing");
    const success = await runHook(hookPath, ["--test", ...hookArgs], "");
    assert.equal(success.code, 0);
    assert.deepEqual(JSON.parse(success.stdout), { ok: true, localOnly: true });
    const invalidDiscovery = join(homeDir, "missing.json");
    const failure = await runHook(hookPath, ["--test", "--client-entry", runtimePath, "--discovery-file", invalidDiscovery], "");
    assert.notEqual(failure.code, 0);
    assert.equal(failure.stdout, "");
    const quietFailure = await runHook(hookPath, ["--event", "UserPromptSubmit", "--client-entry", runtimePath, "--discovery-file", invalidDiscovery], "{}");
    assert.equal(quietFailure.code, 0);
    const dependencies: DeepSeekHarnessSetupDependencies = { dshHomeDir: homeDir, profile: "web", bundleSourceDir: join(assetDir, "deepseek-harness"), managedBundleDir: join(homeDir, "bundle"), discoveryPath, preferredCommand: "dsh", detected: false, runCommand: async () => { throw new Error("测试禁止运行外部 AI"); } };
    assert.equal((await testDeepSeekHarness(dependencies)).ok, true);
    assert.equal(received.at(-1)?.params.reaction, "thinking");
    assert.equal(received.at(-1)?.params.message, "我在思考中。");
    assert.equal((await testDeepSeekHarness({ ...dependencies, discoveryPath: invalidDiscovery })).ok, false);

    // 验证实际分发包的入口关闭正文流与工具参数，只保留官方状态/权限事件。
    mkdirSync(dependencies.managedBundleDir);
    for (const name of ["package.json", "index.mjs", "runtime.mjs", "cordis.patch.yml"]) copyFileSync(join(dependencies.bundleSourceDir, name), join(dependencies.managedBundleDir, name));
    writeFileSync(join(dependencies.managedBundleDir, "settings.json"), JSON.stringify({ discoveryPath }));
    const module = await import(pathToFileURL(join(dependencies.managedBundleDir, "index.mjs")).href);
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    module.apply({ on: (name: string, handler: (...args: unknown[]) => unknown) => handlers.set(name, handler) });
    const count = received.length;
    handlers.get("agent/assistant-stream")?.({ frame: { type: "chunk", chunk: { type: "text-delta", text: "⏵ PRIVATE_PROMPT\n" } } });
    handlers.get("tools/result")?.({ name: "bash", arguments: { description: "PRIVATE_SECRET" } }, "PRIVATE_RESULT");
    handlers.get("agent/status")?.({ status: "running", prompt: "PRIVATE_PROMPT" });
    const permissionResult = handlers.get("approval/request")?.({ secret: "PRIVATE_SECRET" }, () => "user-decision");
    assert.equal(permissionResult, "user-decision");
    await waitFor(() => received.length === count + 2);
    assert.deepEqual(received.slice(count).map((request) => request.params.reaction).sort(), ["thinking", "waiting"]);
    assert.deepEqual(received.slice(count).map((request) => request.params.message).sort(), ["我在思考中。", "需要你确认一下。"].sort());
    assert.equal(JSON.stringify(received).includes("PRIVATE_"), false);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(homeDir, { recursive: true, force: true });
  }
});

function runHook(path: string, args: readonly string[], input: string): Promise<{ code: number | null; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path, ...args], { windowsHide: true, timeout: 3000, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, OPENPETS_REMOTE_ENDPOINT: "tcp://127.0.0.1:1", OPENPETS_REMOTE_TOKEN: "invalid-remote-token" } });
    let stdout = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.resume();
    child.once("error", reject);
    child.once("exit", (code) => resolve({ code, stdout }));
    child.stdin.end(input);
  });
}

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error("本机 IPC 测试等待超时。");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
