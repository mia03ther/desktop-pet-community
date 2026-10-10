import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";

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
