import { spawn, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { StringDecoder } from "node:string_decoder";

export interface ExternalCommandOptions {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  readonly timeoutMs?: number;
  readonly input?: string;
  readonly platform?: NodeJS.Platform;
}

export interface ExternalCommandResult {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
  readonly overflow?: boolean;
}

const outputLimit = 16 * 1024;

export async function runExternalCommand(command: string, args: readonly string[], options: ExternalCommandOptions): Promise<ExternalCommandResult> {
  const platform = options.platform ?? process.platform;
  const batch = platform === "win32" && command.toLowerCase().endsWith(".cmd");
  if (!command || /[\0\r\n]/.test(command) || args.some((arg) => /[\0\r\n]/.test(arg))
    || batch && [command, ...args].some((arg) => /[%"]/.test(arg))) {
    return { ok: false, stdout: "", stderr: "外部工具命令参数包含无法安全表示的字符，未执行。", timedOut: false, overflow: false };
  }
  const actualCommand = batch ? options.env.COMSPEC || options.env.ComSpec || "cmd.exe" : command;
  const commandLine = batch ? [command, ...args].map((arg) => '"' + arg + '"').join(" ") : "";
  const actualArgs = batch ? ["/d", "/v:off", "/s", "/c", '"' + commandLine + '"'] : [...args];

  return new Promise((resolveResult) => {
    let child: ChildProcess;
    try {
      child = spawn(actualCommand, actualArgs, {
        cwd: options.cwd,
        env: options.env,
        shell: false,
        windowsHide: true,
        windowsVerbatimArguments: batch,
        detached: platform !== "win32",
        stdio: "pipe",
      });
    } catch (error) {
      resolveResult(failedStart(error));
      return;
    }
    let stdout: Buffer = Buffer.alloc(0);
    let stderr: Buffer = Buffer.alloc(0);
    let overflow = false;
    let timedOut = false;
    let settled = false;
    let termination: Promise<void> | undefined;
    const capture = (current: Buffer, chunk: Buffer): Buffer => {
      const remaining = Math.max(0, outputLimit - current.length);
      if (chunk.length > remaining) overflow = true;
      return remaining > 0 ? Buffer.concat([current, chunk.subarray(0, remaining)]) : current;
    };
    const finish = (code: number | null, error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      if (error !== undefined) stderr = capture(stderr, Buffer.from(error instanceof Error ? error.message : "外部工具启动失败。"));
      resolveResult({ ok: code === 0 && !timedOut && !overflow && error === undefined,
        stdout: boundedText(stdout), stderr: boundedText(stderr), timedOut, overflow });
    };
    const deadline = setTimeout(() => {
      timedOut = true;
      termination = terminateOwnedProcess(child, platform, options.env);
      void termination.then(() => finish(null));
    }, options.timeoutMs ?? 6000);
    child.stdout?.on("data", (chunk: Buffer) => { stdout = capture(stdout, chunk); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr = capture(stderr, chunk); });
    child.on("error", (error) => finish(null, error));
    child.on("close", (code) => {
      if (termination) void termination.then(() => finish(code));
      else finish(code);
    });
    // 版本命令可能在读取前关闭 stdin；EPIPE 不应覆盖实际退出码。
    child.stdin?.on("error", () => undefined);
    child.stdin?.end(options.input ?? "");
  });
}

function failedStart(error: unknown): ExternalCommandResult {
  const message = error instanceof Error ? error.message : "外部工具启动失败。";
  return { ok: false, stdout: "", stderr: boundedText(Buffer.from(message)), timedOut: false, overflow: false };
}

export function terminateOwnedProcess(child: ChildProcess, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): Promise<void> {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  const pid = child.pid;
  if (platform !== "win32") {
    // detached 为本次命令创建独立进程组，只向本次启动的组发送信号。
    try { process.kill(-pid, "SIGKILL"); } catch (error) {
      if (!isMissingProcess(error)) child.kill("SIGKILL");
    }
    return Promise.resolve();
  }
  return new Promise((resolveTermination) => {
    // PID 来自仍未退出的自有 ChildProcess；不枚举或匹配用户其他进程。
    const systemRoot = env.SystemRoot || env.SYSTEMROOT || process.env.SystemRoot || "C:\\Windows";
    const killer = spawn(join(systemRoot, "System32", "taskkill.exe"), ["/PID", String(pid), "/T", "/F"], {
      env,
      shell: false,
      windowsHide: true,
      stdio: "ignore",
    });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallback);
      if (child.exitCode === null && child.signalCode === null) child.kill();
      resolveTermination();
    };
    const fallback = setTimeout(() => { killer.kill(); finish(); }, 1500);
    killer.on("error", finish);
    killer.on("close", finish);
  });
}

function isMissingProcess(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ESRCH";
}

function boundedText(value: Buffer): string {
  const decoded = new StringDecoder("utf8").write(value);
  // 无效字节转换成替代字符后可能变长，再约束一次 UTF-8 字节数。
  return new StringDecoder("utf8").write(Buffer.from(decoded).subarray(0, outputLimit));
}
