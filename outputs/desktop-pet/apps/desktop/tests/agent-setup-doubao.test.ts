import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { createDoubaoBridgeSource, getDoubaoSetup, installDoubaoBridge, removeDoubaoBridge, testDoubaoBridge } from "../src/agent-setup-doubao.js";

// 保护真实桥接脚本的白名单、档案隔离与非官方客户端连接状态。
test("方舟本机桥只转发六种工作状态，并固定本地档案", async () => {
  const temporaryRoot = realpathSync(tmpdir());
  const directory = mkdtempSync(join(temporaryRoot, "desktop-pet-doubao-"));
  const clientEntryPath = join(directory, "client.mjs");
  const resultPath = join(directory, "result.json");
  const dependencies = {
    integrationDir: join(directory, "integration"),
    nodeCommand: process.execPath,
    clientEntryPath,
    discoveryPath: join(directory, "discovery.json"),
    runCommand: async (command: string, args: readonly string[]) => ({
      ok: spawnSync(command, [...args], { encoding: "utf8" }).status === 0,
    }),
  };
  try {
    writeFileSync(clientEntryPath, [
      "import { writeFileSync } from 'node:fs';",
      "export function createOpenPetsClient(options) {",
      `  return { react: async reaction => writeFileSync(${JSON.stringify(resultPath)}, JSON.stringify({ options, reaction })) };`,
      "}",
      "export function readDiscoveryFile(path) { return { path }; }",
      "export async function sendRequest() { throw new Error('六状态自测不可发送会话事件'); }",
    ].join("\n"));

    const initial = getDoubaoSetup(dependencies);
    assert.equal(initial.status.canInstall, true);
    assert.equal(initial.status.canRemove, false);
    const firstInstall = installDoubaoBridge(dependencies);
    assert.equal(firstInstall.ok, true);
    assert.equal(firstInstall.changed, true);
    assert.equal(installDoubaoBridge(dependencies).changed, false);
    const prepared = getDoubaoSetup(dependencies);
    assert.equal(prepared.status.label, "本机桥已准备");
    assert.match(prepared.status.details, /客户端自动监测未支持/);

    const bridgePath = prepared.preview.bridgePath;
    const states = {
      started: "thinking",
      working: "working",
      waiting: "waiting",
      completed: "success",
      failed: "error",
      idle: "idle",
    };
    for (const [state, reaction] of Object.entries(states)) {
      const result = spawnSync(process.execPath, [bridgePath, state], {
        encoding: "utf8",
        env: { ...process.env, OPENPETS_REMOTE_ENDPOINT: "wss://example.invalid", OPENPETS_REMOTE_TOKEN: "must-not-leave-local" },
      });
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(JSON.parse(readFileSync(resultPath, "utf8")), {
        options: { discoveryPath: dependencies.discoveryPath, remote: false },
        reaction,
      });
    }

    writeFileSync(resultPath, "未执行");
    for (const args of [["__proto__"], ["working; echo secret"], ["working", "extra"], []]) {
      const result = spawnSync(process.execPath, [bridgePath, ...args], { encoding: "utf8" });
      assert.equal(result.status, 2);
      assert.equal(readFileSync(resultPath, "utf8"), "未执行");
    }

    const localTest = await testDoubaoBridge(dependencies);
    assert.equal(localTest.ok, true);
    assert.match(localTest.message, /未调用豆包 API/);
    assert.match(localTest.message, /不代表豆包客户端已连接/);

    writeFileSync(join(dependencies.integrationDir, "user-notes.txt"), "保留资料");
    writeFileSync(bridgePath, "用户修改过的桥接文件");
    assert.equal(getDoubaoSetup(dependencies).status.state, "conflict");
    assert.equal(installDoubaoBridge(dependencies).ok, false);
    assert.equal(removeDoubaoBridge(dependencies).ok, false);
    assert.equal(readFileSync(bridgePath, "utf8"), "用户修改过的桥接文件");
    writeFileSync(bridgePath, createDoubaoBridgeSource(dependencies));
    assert.equal(removeDoubaoBridge(dependencies).changed, true);
    assert.equal(removeDoubaoBridge(dependencies).changed, false);
    assert.equal(readFileSync(join(dependencies.integrationDir, "user-notes.txt"), "utf8"), "保留资料");
  } finally {
    const ownedPath = relative(temporaryRoot, directory);
    assert.ok(ownedPath.startsWith("desktop-pet-doubao-") && !ownedPath.includes(".."));
    rmSync(directory, { recursive: true, force: true });
  }
});

// 防止跨平台会话、并行工具和失败编辑被误投影为同一条工作气泡。
test("真实应用事件保留调用关联，传输只含摘要，成功编辑才累计文件", () => {
  const temporaryRoot = realpathSync(tmpdir());
  const directory = mkdtempSync(join(temporaryRoot, "desktop-pet-doubao-events-"));
  const clientEntryPath = join(directory, "client.mjs");
  const resultPath = join(directory, "result.json");
  const dependencies = {
    integrationDir: join(directory, "integration"),
    nodeCommand: process.execPath,
    clientEntryPath,
    discoveryPath: join(directory, "discovery.json"),
  };
  try {
    writeFileSync(clientEntryPath, [
      "import { writeFileSync } from 'node:fs';",
      "export function createOpenPetsClient() { throw new Error('结构化事件应使用当前档案'); }",
      "export function readDiscoveryFile(path) { return { path }; }",
      `export async function sendRequest(discovery, method, params) { writeFileSync(${JSON.stringify(resultPath)}, JSON.stringify({ discovery, method, params })); }`,
    ].join("\n"));
    assert.equal(installDoubaoBridge(dependencies).ok, true);
    const bridgePath = getDoubaoSetup(dependencies).preview.bridgePath;
    const hash = (value: string) => createHash("sha256").update(value).digest("hex");
    const identity = { sessionId: "真实应用的会话", turnId: "真实请求编号", callId: "实际工具编号" };
    const send = (input: Record<string, unknown>) => {
      const result = spawnSync(process.execPath, [bridgePath, "--event"], {
        encoding: "utf8",
        input: JSON.stringify(input),
        env: { ...process.env, OPENPETS_REMOTE_ENDPOINT: "wss://example.invalid", OPENPETS_REMOTE_TOKEN: "不可传输" },
      });
      assert.equal(result.status, 0, result.stderr);
      return JSON.parse(readFileSync(resultPath, "utf8")) as {
        discovery: { path: string };
        method: string;
        params: { reaction: string; externalAi: Record<string, unknown> };
      };
    };
    const started = send({ ...identity, event: "tool-start", toolName: "search" });
    assert.equal(started.discovery.path, dependencies.discoveryPath);
    assert.equal(started.method, "pet.react");
    assert.equal(started.params.reaction, "working");
    assert.equal(started.params.externalAi.adapter, "doubao");
    assert.equal(started.params.externalAi.sessionId, hash(identity.sessionId));
    assert.equal(started.params.externalAi.turnId, hash(identity.turnId));
    assert.equal(started.params.externalAi.callId, hash(identity.callId));
    assert.equal(started.params.externalAi.toolName, "search");
    assert.equal(JSON.stringify(started).includes(identity.sessionId), false);

    const file = join(directory, "实际执行器编辑的文件.txt");
    const edited = send({ ...identity, event: "tool-complete", toolName: "Write", succeeded: true, editedFiles: [file, file] });
    assert.deepEqual(edited.params.externalAi.editedFileIds, [hash(file.replaceAll("\\", "/"))]);
    assert.equal(JSON.stringify(edited).includes(file), false);
    const failed = send({ ...identity, event: "tool-complete", succeeded: false, editedFiles: [file] });
    assert.equal(failed.params.reaction, "error");
    assert.equal(failed.params.externalAi.event, "tool-failed");
    assert.equal(failed.params.externalAi.editedFileIds, undefined);
    assert.equal(send({ ...identity, event: "tool-complete", editedFiles: [file] }).params.externalAi.editedFileIds, undefined);

    for (const [event, reaction] of Object.entries({ "session-start": "idle", "turn-start": "thinking", permission: "waiting", "turn-end": "success", "session-end": "idle", interrupt: "idle" })) {
      assert.equal(send({ ...identity, event }).params.reaction, reaction);
    }
    writeFileSync(resultPath, "未执行");
    for (const input of [
      { ...identity, event: "tool-start", prompt: "不可进入监测的数据" },
      { ...identity, event: "tool-start", toolName: "search; secret" },
      { ...identity, event: "tool-start", succeeded: true },
      { ...identity, event: "tool-complete", succeeded: true, editedFiles: ["relative.txt"] },
      { ...identity, event: "turn-end", sessionId: "x".repeat(17 * 1024) },
    ]) {
      const result = spawnSync(process.execPath, [bridgePath, "--event"], { encoding: "utf8", input: JSON.stringify(input) });
      assert.equal(result.status, 1);
      assert.equal(readFileSync(resultPath, "utf8"), "未执行");
    }
    const imported = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(pathToFileURL(bridgePath).href)})`], { encoding: "utf8" });
    assert.equal(imported.status, 0, imported.stderr);
    assert.equal(readFileSync(resultPath, "utf8"), "未执行");
  } finally {
    const ownedPath = relative(temporaryRoot, directory);
    assert.ok(ownedPath.startsWith("desktop-pet-doubao-events-") && !ownedPath.includes(".."));
    rmSync(directory, { recursive: true, force: true });
  }
});

test("不允许外部 Node 使用 ASAR 内客户端，失败链路不会报告成功", async () => {
  const dependencies = {
    integrationDir: join(realpathSync(tmpdir()), "desktop-pet-doubao-not-created"),
    nodeCommand: process.execPath,
    clientEntryPath: join(realpathSync(tmpdir()), "app.asar", "client.js"),
    discoveryPath: join(realpathSync(tmpdir()), "missing-discovery.json"),
  };
  assert.throws(() => createDoubaoBridgeSource(dependencies));
  assert.equal(getDoubaoSetup(dependencies).status.canInstall, false);
  assert.equal((await testDoubaoBridge(dependencies)).ok, false);
});
