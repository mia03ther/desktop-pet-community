import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseCodexQuotaWindows, queryCodexOfficialQuota, readCodexAppServerQuota, resolveCodexExecutable } from "../src/codex-quota-client.js";

function fixture(mode = "chatgpt") {
  const root = mkdtempSync(join(tmpdir(), "codex-quota-"));
  const script = join(root, "server.mjs");
  const log = join(root, "requests.jsonl");
  const pidFile = join(root, "pid.txt");
  writeFileSync(script, `import {appendFileSync,writeFileSync} from 'node:fs';
import {createInterface} from 'node:readline';
const mode=${JSON.stringify(mode)};
writeFileSync(${JSON.stringify(pidFile)},String(process.pid));
const reply=(id,result)=>process.stdout.write(JSON.stringify({id,result})+'\\n');
createInterface({input:process.stdin}).on('line',line=>{
 const message=JSON.parse(line);appendFileSync(${JSON.stringify(log)},line+'\\n');
 if(mode==='timeout'){setInterval(()=>{},1000);return;}
 if(mode==='overflow'){process.stdout.write('x'.repeat(300000));return;}
 if(message.method==='initialize'){
  if(mode==='refresh'){process.stdout.write(JSON.stringify({id:20,method:'account/chatgptAuthTokens/refresh',params:{}})+'\\n');return;}
  if(mode==='protocol-error'){process.stdout.write(JSON.stringify({id:1,error:{message:'secret-account-token'}})+'\\n');return;}
  reply(message.id,{userAgent:'fixture'});
 }else if(message.method==='account/read'){
  reply(message.id,{account:mode==='logged-out'?null:{type:mode==='api-key'?'apiKey':'chatgpt',email:'private@example.invalid',accountId:'private-account',token:'private-token'}});
 }else if(message.method==='account/rateLimits/read'){
  reply(message.id,{rateLimits:{primary:{usedPercent:99}},rateLimitsByLimitId:{codex:{limitName:'Codex',primary:{usedPercent:mode==='invalid-window'?101:25,windowDurationMins:300,resetsAt:1800000000},secondary:{usedPercent:40,windowDurationMins:10080,resetsAt:1800000100}}}});
 }
});`);
  return {
    root,
    requests: (): Array<{ method: string; params?: unknown }> => readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line)),
    query: (signal = new AbortController().signal, timeoutMs = 2500) => readCodexAppServerQuota(process.execPath, [script], { cwd: root, env: process.env }, signal, "fixture", timeoutMs),
    assertStopped: async () => {
      const pid = Number(readFileSync(pidFile, "utf8"));
      for (let attempt = 0; attempt < 20; attempt++) {
        try { process.kill(pid, 0); } catch { return; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      assert.fail(`查询自有进程 ${pid} 未结束`);
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

test("官方只读握手不刷新认证，多窗口只返回额度字段，不泄漏账户信息", async () => {
  const f = fixture();
  try {
    const result = await f.query();
    assert.equal(result.status, "fresh");
    assert.equal(result.authMode, "chatgpt");
    assert.equal(result.cliVersion, "fixture");
    assert.deepEqual(result.windows.map((window) => [window.window, window.usedPercent, window.remainingPercent, window.resetsAt]),
      [["primary", 25, 75, 1800000000000], ["secondary", 40, 60, 1800000100000]]);
    assert.deepEqual(f.requests().map((request) => request.method), ["initialize", "initialized", "account/read", "account/rateLimits/read"]);
    assert.deepEqual(f.requests()[2]?.params, { refreshToken: false });
    const text = JSON.stringify(result);
    for (const secret of ["private@example", "private-account", "private-token", "accountId", "email"]) assert.equal(text.includes(secret), false);
    await f.assertStopped();
  } finally { f.cleanup(); }
});

test("未登录与 API key 登录不请求订阅额度，不把未知当成剩余零", async () => {
  for (const mode of ["logged-out", "api-key"]) {
    const f = fixture(mode);
    try {
      const result = await f.query();
      assert.equal(result.status, "unknown");
      assert.deepEqual(result.windows, []);
      assert.equal(result.authMode, mode === "logged-out" ? "not-logged-in" : "apiKey");
      assert.equal(f.requests().some((request) => request.method === "account/rateLimits/read"), false);
      await f.assertStopped();
    } finally { f.cleanup(); }
  }
});

test("认证刷新请求、协议错误和无效额度均停止查询；不回应凭据或传播原错误", async () => {
  for (const mode of ["refresh", "protocol-error", "invalid-window", "overflow"]) {
    const f = fixture(mode);
    try {
      const result = await f.query();
      assert.equal(result.status, "unknown");
      assert.deepEqual(result.windows, []);
      assert.equal(JSON.stringify(result).includes("secret-account-token"), false);
      assert.equal(f.requests().some((request) => !["initialize", "initialized", "account/read", "account/rateLimits/read"].includes(request.method)), false);
      await f.assertStopped();
    } finally { f.cleanup(); }
  }
});

test("超时和用户取消都会结束本次 App Server 子进程", async () => {
  const timeout = fixture("timeout");
  const cancelled = fixture("timeout");
  try {
    assert.equal((await timeout.query(undefined, 400)).status, "unknown");
    await timeout.assertStopped();
    const controller = new AbortController();
    const query = cancelled.query(controller.signal);
    setTimeout(() => controller.abort(), 400);
    const result = await query;
    assert.match(result.reason, /取消/);
    await cancelled.assertStopped();
  } finally { timeout.cleanup(); cancelled.cleanup(); }
});

test("额度响应优先多限制接口，缺少窗口字段保持未知，秒重置时间转毫秒", () => {
  assert.deepEqual(parseCodexQuotaWindows({ rateLimitsByLimitId: {}, rateLimits: { primary: { usedPercent: 5 } } }), []);
  const windows = parseCodexQuotaWindows({ rateLimits: { primary: { usedPercent: 0 }, secondary: null } });
  assert.equal(windows[0]?.remainingPercent, 100);
  assert.equal(windows[0]?.windowDurationMins, null);
  assert.equal(windows[0]?.resetsAt, null);
  for (const usedPercent of [-1, 101, Infinity, "5"]) {
    assert.throws(() => parseCodexQuotaWindows({ rateLimits: { primary: { usedPercent } } }));
  }
});

test("程序入口只解析直接可执行文件，拒绝 shell 字符和 Windows 命令脚本", async () => {
  assert.equal(resolveCodexExecutable(process.execPath, process.env), process.execPath);
  assert.equal(resolveCodexExecutable("codex && secret", process.env), null);
  assert.equal(resolveCodexExecutable("C:/absent/codex.cmd", process.env, "win32"), null);
  const missing = await queryCodexOfficialQuota({ command: "C:/absent/codex.exe", cwd: tmpdir(), env: process.env }, new AbortController().signal);
  assert.equal(missing.status, "unknown");
  assert.equal(missing.cliVersion, null);
});
