import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, lstatSync } from "node:fs";
import { delimiter, isAbsolute, join } from "node:path";
import { runExternalCommand, terminateOwnedProcess } from "./external-command-runner.js";
import type { CodexQuotaSnapshot, CodexQuotaWindow } from "./codex-quota-types.js";

export interface CodexQuotaCommandContext {
  readonly command: string;
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
}
const outputBudget = 256 * 1024;
const lineBudget = 64 * 1024;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function unknownCodexQuota(reason: string, cliVersion: string | null = null, authMode: CodexQuotaSnapshot["authMode"] = "unknown"): CodexQuotaSnapshot {
  return { provider: "codex", enabled: true, status: "unknown", recordedAt: null, cliVersion, authMode, windows: [], reason };
}

/** 只投影百分比窗口；不返回邮件、账户编号、积分复位券、token 或原响应。 */
export function parseCodexQuotaWindows(value: unknown): CodexQuotaWindow[] {
  if (!record(value)) throw new Error("官方额度响应格式不支持。");
  const entries = record(value.rateLimitsByLimitId) ? Object.entries(value.rateLimitsByLimitId)
    : record(value.rateLimits) ? [[typeof value.rateLimits.limitId === "string" ? value.rateLimits.limitId : "codex", value.rateLimits] as const] : [];
  if (entries.length > 100) throw new Error("官方额度窗口数量超过支持范围。");
  const windows: CodexQuotaWindow[] = [];
  for (const [key, limit] of entries) {
    if (!record(limit) || key.length > 128) throw new Error("官方额度窗口格式不支持。");
    const label = typeof limit.limitName === "string" && limit.limitName.length > 0 && limit.limitName.length <= 128 ? limit.limitName : key;
    for (const window of ["primary", "secondary"] as const) {
      const item = limit[window];
      if (item === null || item === undefined) continue;
      if (!record(item) || typeof item.usedPercent !== "number" || !Number.isFinite(item.usedPercent) || item.usedPercent < 0 || item.usedPercent > 100
        || item.windowDurationMins !== null && item.windowDurationMins !== undefined && (!Number.isSafeInteger(item.windowDurationMins) || Number(item.windowDurationMins) <= 0)
        || item.resetsAt !== null && item.resetsAt !== undefined && (!Number.isSafeInteger(item.resetsAt) || Number(item.resetsAt) <= 0 || Number(item.resetsAt) > 8_640_000_000_000)) {
        throw new Error("官方额度窗口包含无效数值。");
      }
      windows.push({
        limitId: key,
        label,
        window,
        usedPercent: item.usedPercent,
        remainingPercent: Math.max(0, 100 - item.usedPercent),
        windowDurationMins: typeof item.windowDurationMins === "number" ? item.windowDurationMins : null,
        resetsAt: typeof item.resetsAt === "number" ? item.resetsAt * 1000 : null,
      });
    }
  }
  return windows;
}

/** 解析直接可执行程序，Windows 不把 .cmd 或任意 shell 命令当作只读服务入口。 */
export function resolveCodexExecutable(command: string, env: NodeJS.ProcessEnv, platform = process.platform): string | null {
  if (!command || /[\0\r\n]/.test(command)) return null;
  const paths = isAbsolute(command) ? [command] : /^[a-zA-Z0-9_.-]+$/.test(command)
    ? (env.PATH ?? env.Path ?? "").split(platform === "win32" ? ";" : delimiter).filter(Boolean)
      .flatMap((directory) => [join(directory, command), ...(platform === "win32" && !command.toLowerCase().endsWith(".exe") ? [join(directory, `${command}.exe`)] : [])]) : [];
  for (const path of paths) {
    if (platform === "win32" && !path.toLowerCase().endsWith(".exe")) continue;
    try {
      if (existsSync(path)) {
        const stat = lstatSync(path);
        if (stat.isFile() && !stat.isSymbolicLink()) return path;
      }
    } catch {
      // 当前入口不可读时继续检查下一个明确的 PATH 入口。
    }
  }
  return null;
}

export async function queryCodexOfficialQuota(context: CodexQuotaCommandContext, signal: AbortSignal): Promise<CodexQuotaSnapshot> {
  const command = resolveCodexExecutable(context.command, context.env);
  if (!command) return unknownCodexQuota("未找到可直接运行的 Codex CLI。请在外部 AI 接入中选择 codex.exe；不执行 .cmd 安装脚本。");
  if (signal.aborted) return unknownCodexQuota("额度查询已取消。");
  const versionResult = await runExternalCommand(command, ["--version"], { ...context, timeoutMs: 2000 });
  const cliVersion = versionResult.ok ? /^codex-cli\s+([\w.+-]{1,64})/.exec(versionResult.stdout.trim())?.[1] ?? null : null;
  if (signal.aborted) return unknownCodexQuota("额度查询已取消。", cliVersion);
  return readCodexAppServerQuota(command, [], context, signal, cliVersion);
}

/** 固定只读协议。测试可用 Node 启动模拟服务；生产只传经过解析的 Codex 入口。 */
export function readCodexAppServerQuota(command: string, prefixArgs: readonly string[], context: Pick<CodexQuotaCommandContext, "cwd" | "env">,
  signal: AbortSignal, cliVersion: string | null = null, timeoutMs = 20000): Promise<CodexQuotaSnapshot> {
  if (signal.aborted) return Promise.resolve(unknownCodexQuota("额度查询已取消。", cliVersion));
  return new Promise((resolveResult) => {
    let child: ChildProcess;
    try {
      child = spawn(command, [...prefixArgs, "app-server", "--listen", "stdio://"], {
        ...context,
        shell: false,
        windowsHide: true,
        stdio: "pipe",
        detached: process.platform !== "win32",
      });
    } catch {
      resolveResult(unknownCodexQuota("Codex App Server 无法启动。", cliVersion));
      return;
    }
    let pending = "";
    let captured = 0;
    let stderrBytes = 0;
    let completed = false;
    let stage = 1;
    let authMode: CodexQuotaSnapshot["authMode"] = "unknown";
    const finish = (result: CodexQuotaSnapshot) => {
      if (completed) return;
      completed = true;
      clearTimeout(deadline);
      signal.removeEventListener("abort", aborted);
      child.stdin?.end();
      void terminateOwnedProcess(child, process.platform, context.env).then(() => resolveResult(result));
    };
    const fail = (message: string) => finish(unknownCodexQuota(message, cliVersion, authMode));
    const send = (value: unknown) => child.stdin?.write(JSON.stringify(value) + "\n");
    const aborted = () => fail("额度查询已取消。");
    const deadline = setTimeout(() => fail("Codex 官方额度查询超时；当前额度未知。"), timeoutMs);
    signal.addEventListener("abort", aborted, { once: true });
    child.on("error", () => fail("Codex App Server 启动失败；请检查程序路径与版本。"));
    child.on("close", () => {
      if (!completed) fail("Codex App Server 提前结束；当前额度未知。");
    });
    child.stdin?.on("error", () => {
      if (!completed) fail("Codex App Server 协议连接已断开。");
    });
    // 原 stderr 可能含用户路径或账户诊断；只计预算，不展示或存档。
    child.stderr?.on("data", (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes > outputBudget) fail("Codex 诊断输出超限，查询已结束。");
    });
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      if (completed) return;
      captured += Buffer.byteLength(chunk);
      pending += chunk;
      if (captured > outputBudget || Buffer.byteLength(pending) > outputBudget) {
        fail("Codex 协议输出超限，查询已结束。");
        return;
      }
      while (pending.includes("\n") && !completed) {
        const index = pending.indexOf("\n");
        const line = pending.slice(0, index);
        pending = pending.slice(index + 1);
        if (Buffer.byteLength(line) > lineBudget) {
          fail("Codex 协议行超限。");
          return;
        }
        if (!line.trim()) continue;
        let message: unknown;
        try {
          message = JSON.parse(line);
        } catch {
          fail("Codex App Server 返回非兼容 JSON 协议。");
          return;
        }
        if (!record(message)) {
          fail("Codex App Server 响应格式无效。");
          return;
        }
        if (typeof message.method === "string" && message.id !== undefined) {
          fail("Codex 请求认证刷新或交互；此只读监测未执行，请在 Codex 中处理。");
          return;
        }
        if (message.id === undefined) continue;
        if (message.id !== stage || "error" in message || !record(message.result)) {
          fail("Codex 不支持此只读额度协议或官方查询失败；请核对原工具登录状态和版本。");
          return;
        }
        if (stage === 1) {
          send({ method: "initialized", params: {} });
          stage = 2;
          send({ id: 2, method: "account/read", params: { refreshToken: false } });
        } else if (stage === 2) {
          const account = message.result.account;
          if (account === null) {
            authMode = "not-logged-in";
            fail("Codex CLI 当前未登录账户；请在 Codex 登录，桌宠不会发起登录。");
            return;
          }
          if (!record(account) || typeof account.type !== "string") {
            fail("Codex 账户响应格式不支持。");
            return;
          }
          if (account.type !== "chatgpt") {
            authMode = ["apiKey", "amazonBedrock"].includes(account.type) ? account.type as "apiKey" | "amazonBedrock" : "unknown";
            fail("当前 Codex 来源未提供 ChatGPT 订阅额度窗口；不能把 API token 用量换算为此账户额度。");
            return;
          }
          authMode = "chatgpt";
          stage = 3;
          send({ id: 3, method: "account/rateLimits/read" });
        } else {
          try {
            const windows = parseCodexQuotaWindows(message.result);
            if (!windows.length) {
              fail("官方未返回可显示的额度窗口；未知不等于零。");
              return;
            }
            finish({
              provider: "codex", enabled: true, status: "fresh", recordedAt: Date.now(), cliVersion, authMode,
              windows, reason: "官方 App Server 返回的当前 CLI 已登录账户额度；多个会话共享账户窗口，并非逐会话费用。",
            });
          } catch {
            fail("官方额度响应格式或数值不支持；没有推算未知窗口。");
          }
        }
      }
      if (Buffer.byteLength(pending) > lineBudget) fail("Codex 协议行超限。");
    });
    send({ id: 1, method: "initialize", params: { clientInfo: { name: "desktop_pet_quota_monitor", title: "desktop pet 额度监测", version: "1.0.0" }, capabilities: { experimentalApi: false } } });
  });
}
