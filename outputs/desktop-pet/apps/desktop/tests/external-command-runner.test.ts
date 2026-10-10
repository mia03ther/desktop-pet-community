import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";

import { runExternalCommand } from "../src/external-command-runner.js";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "desktop pet 命令验证 "));
  return { root, options: { cwd: root, env: process.env } };
}

function clean(root: string) {
  const owned = relative(tmpdir(), root);
  assert.ok(owned.startsWith("desktop pet 命令验证 ") && !owned.includes(".."));
  rmSync(root, { recursive: true, force: true });
}

test("新外部工具命令按数组传参，并主动关闭标准输入", async () => {
  const { root, options } = fixture();
  try {
    const script = join(root, "input.mjs");
    writeFileSync(script, 'let text=""; for await(const chunk of process.stdin) text+=chunk; process.stdout.write(JSON.stringify({ text, args:process.argv.slice(2), cwd:process.cwd() }));');
    const empty = await runExternalCommand(process.execPath, [script, "中文 参数"], options);
    assert.equal(empty.ok, true);
    assert.deepEqual(JSON.parse(empty.stdout), { text: "", args: ["中文 参数"], cwd: root });
    const supplied = await runExternalCommand(process.execPath, [script], { ...options, input: "测试输入" });
    assert.equal(supplied.ok, true);
    assert.equal(JSON.parse(supplied.stdout).text, "测试输入");
  } finally { clean(root); }
});

test("stdout 和 stderr 超出 16 KiB 时有界，不能把截断结果报成成功", async () => {
  const { root, options } = fixture();
  try {
    const script = join(root, "output.mjs");
    writeFileSync(script, 'process.stdout.write("a".repeat(20000)); process.stderr.write("b".repeat(20000));');
    const result = await runExternalCommand(process.execPath, [script], options);
    assert.equal(result.ok, false);
    assert.equal(result.overflow, true);
    assert.equal(Buffer.byteLength(result.stdout), 16384);
    assert.equal(Buffer.byteLength(result.stderr), 16384);
    writeFileSync(script, 'process.stdout.write("中文😀".repeat(10000)); process.stderr.write(Buffer.alloc(20000,255));');
    const encoded = await runExternalCommand(process.execPath, [script], options);
    assert.equal(encoded.ok, false);
    assert.equal(encoded.overflow, true);
    assert.ok(Buffer.byteLength(encoded.stdout) <= 16384);
    assert.ok(Buffer.byteLength(encoded.stderr) <= 16384);
  } finally { clean(root); }
});

test("新外部工具超时终止自有命令及其子进程", async () => {
  const { root, options } = fixture();
  try {
    const childScript = join(root, "child.mjs");
    const runnerScript = join(root, "runner.mjs");
    const evidence = join(root, "pids.json");
    writeFileSync(childScript, "setInterval(()=>{},1000);");
    writeFileSync(runnerScript, `import {spawn} from "node:child_process"; import {writeFileSync} from "node:fs";
const child=spawn(process.execPath,[${JSON.stringify(childScript)}],{windowsHide:true,stdio:"ignore"});
writeFileSync(${JSON.stringify(evidence)},JSON.stringify([process.pid,child.pid])); setInterval(()=>{},1000);`);
    const result = await runExternalCommand(process.execPath, [runnerScript], { ...options, timeoutMs: 500 });
    assert.equal(result.ok, false);
    assert.equal(result.timedOut, true);
    const pids: number[] = JSON.parse(readFileSync(evidence, "utf8"));
    for (const pid of pids) {
      let alive = true;
      for (let attempt = 0; attempt < 10 && alive; attempt++) {
        try { process.kill(pid, 0); } catch { alive = false; }
        if (alive) await new Promise((resolvePause) => setTimeout(resolvePause, 50));
      }
      assert.equal(alive, false, `本次启动的 ${pid} 应结束`);
    }
  } finally { clean(root); }
});

test("Windows .cmd 中文空格路径可探测版本并传递安装目录", { skip: process.platform !== "win32" }, async () => {
  const { root, options } = fixture();
  try {
    const command = join(root, "dsh 命令.cmd");
    const record = join(root, "record.json");
    const executable = process.execPath;
    const script = join(root, "record.mjs");
    writeFileSync(script, `import {writeFileSync} from "node:fs";writeFileSync(${JSON.stringify(record)},JSON.stringify(process.argv.slice(2)));process.stdout.write("install-ok");`);
    writeFileSync(command, '@echo off\r\nif "%~1"=="--version" (echo dsh-test-1.0& exit /b 0)\r\n"' + executable + '" "%~dp0record.mjs" %*\r\n');
    const version = await runExternalCommand(command, ["--version"], options);
    assert.equal(version.ok, true, version.stderr);
    assert.equal(version.stdout.trim(), "dsh-test-1.0");
    const installPath = join(root, "桌宠 插件 & 名称!");
    const install = await runExternalCommand(command, ["plugin", "--profile", "desktop", "add", installPath], options);
    assert.equal(install.ok, true, install.stderr);
    assert.deepEqual(JSON.parse(readFileSync(record, "utf8")), ["plugin", "--profile", "desktop", "add", installPath]);
    const previous = readFileSync(record, "utf8");
    for (const unsafe of ["%PATH%", '含"引号', "换\n行", "回\r车", "零\0字符"]) {
      assert.equal((await runExternalCommand(command, [unsafe], options)).ok, false);
      assert.equal(readFileSync(record, "utf8"), previous);
    }
  } finally { clean(root); }
});

test("新外部工具未找到或退出失败时不报告成功", async () => {
  const { root, options } = fixture();
  try {
    assert.equal((await runExternalCommand(join(root, "不存在的程序.exe"), [], options)).ok, false);
    const script = join(root, "failed.mjs");
    writeFileSync(script, 'process.stderr.write("执行失败"); process.exitCode=7;');
    const result = await runExternalCommand(process.execPath, [script], options);
    assert.equal(result.ok, false);
    assert.equal(result.timedOut, false);
    assert.equal(result.stderr, "执行失败");
  } finally { clean(root); }
});
