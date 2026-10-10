import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import type {
  CompanionCursorWindowSnapshot,
  CompanionDiagnosticFinding,
  CompanionDiagnosticsSnapshot,
  CompanionWindowEvidence,
} from "./companion-diagnostics-types.js";

export type * from "./companion-diagnostics-types.js";

const execFileAsync = promisify(execFile);
const activeCollectors = new Set<AbortController>();
const windowNote = "这里只识别窗口所属进程。系统通知可能由宿主承载，浏览器广告只能定位到浏览器，不能据此判定具体通知应用、网站或恶意软件。";

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("电脑诊断返回了无效的数据结构。");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, limit = 2048): string {
  return typeof value === "string" ? value.slice(0, limit) : "";
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("电脑诊断返回了无效的测量值。");
  }
  return value;
}

function percent(value: unknown): number | null {
  return value === null || value === undefined ? null : Math.min(100, number(value));
}

function rows(value: unknown, maximum: number): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error("电脑诊断返回的数据超过范围或列表无效。");
  }
  return value.map(record);
}

function strings(value: unknown, maximum: number): string[] {
  if (!Array.isArray(value) || value.length > maximum) {
    throw new Error("电脑诊断返回了无效的说明列表。");
  }
  return value.map((entry) => text(entry));
}

function parseWindow(value: unknown): CompanionWindowEvidence {
  const row = record(value);
  return {
    handle: text(row.handle, 32),
    title: text(row.title, 512),
    pid: number(row.pid),
    processName: text(row.processName, 256),
    executablePath: row.executablePath === null ? null : text(row.executablePath),
    isForeground: row.isForeground === true,
  };
}

/** 一次短采样只能给出复查线索，不声称已经找到了持续卡顿的原因。 */
export function deriveCompanionDiagnosticFindings(
  snapshot: Pick<CompanionDiagnosticsSnapshot, "disks" | "memory" | "cpuPercent">,
): CompanionDiagnosticFinding[] {
  const findings: CompanionDiagnosticFinding[] = [];
  for (const disk of snapshot.disks) {
    const freePercent = 100 - disk.usedPercent;
    if (freePercent >= 10) continue;
    findings.push({
      id: `disk:${disk.name.toUpperCase()}`,
      kind: "disk",
      title: `${disk.name} 空间偏少`,
      evidence: `剩余 ${(disk.freeBytes / 1024 ** 3).toFixed(1)} GB，约 ${freePercent.toFixed(1)}%。`,
      explanation: "空间紧张可能影响系统更新和应用缓存。先扫描自己选择的目录，核对占用；容量统计无法判断哪些文件可以删除。",
    });
  }
  if (snapshot.memory !== null && snapshot.memory.usedPercent >= 85) {
    findings.push({
      id: "memory:pressure",
      kind: "memory",
      title: "本次采样的内存占用偏高",
      evidence: `物理内存使用约 ${snapshot.memory.usedPercent.toFixed(1)}%。`,
      explanation: "查看工作集较大的程序并重新采样。进程工作集包含共享页，不能简单相加，也不能据此决定结束程序。",
    });
  }
  if (snapshot.cpuPercent !== null && snapshot.cpuPercent >= 85) {
    findings.push({
      id: "cpu:pressure",
      kind: "cpu",
      title: "本次采样的 CPU 占用偏高",
      evidence: `短采样内 CPU 使用约 ${snapshot.cpuPercent.toFixed(1)}%。`,
      explanation: "安装、编译和游戏都可能暂时占用 CPU。需要多次复查，不能把一次峰值当作持续卡顿或恶意程序的证据。",
    });
  }
  return findings;
}

/** 校验采集协议并把读取受限保留为显式问题，避免用零伪装读取成功。 */
export function parseCompanionDiagnostics(stdout: string): CompanionDiagnosticsSnapshot {
  const raw = record(JSON.parse(stdout.replace(/^\uFEFF/, "")));
  if (raw.version !== 1) throw new Error("电脑诊断的数据版本不受支持。");
  const memory = raw.memory === null ? null : record(raw.memory);
  const snapshot: CompanionDiagnosticsSnapshot = {
    version: 1,
    sampledAt: number(raw.sampledAt),
    sampleDurationMs: number(raw.sampleDurationMs),
    cpuPercent: percent(raw.cpuPercent),
    memory: memory === null ? null : {
      totalBytes: number(memory.totalBytes),
      availableBytes: number(memory.availableBytes),
      usedPercent: Math.min(100, number(memory.usedPercent)),
    },
    disks: rows(raw.disks, 64).map((row) => ({
      name: text(row.name, 16),
      totalBytes: number(row.totalBytes),
      freeBytes: number(row.freeBytes),
      usedPercent: Math.min(100, number(row.usedPercent)),
    })),
    processes: rows(raw.processes, 500).map((row) => ({
      pid: number(row.pid),
      name: text(row.name, 256),
      executablePath: row.executablePath === null ? null : text(row.executablePath),
      workingSetBytes: number(row.workingSetBytes),
      cpuPercent: percent(row.cpuPercent),
    })),
    startupItems: rows(raw.startupItems, 1000).map((row) => ({
      id: text(row.id),
      name: text(row.name, 256),
      source: text(row.source),
      command: text(row.command),
    })),
    installedApps: rows(raw.installedApps, 1000).map((row) => ({
      id: text(row.id),
      name: text(row.name, 256),
      version: text(row.version, 256),
      publisher: text(row.publisher, 256),
      installLocation: text(row.installLocation),
      source: text(row.source),
    })),
    installedAppsComplete: raw.installedAppsComplete === true,
    windows: rows(raw.windows, 400).map(parseWindow),
    collectionIssues: strings(raw.collectionIssues, 64),
    coverage: strings(raw.coverage, 20),
    findings: [],
  };
  snapshot.findings = deriveCompanionDiagnosticFindings(snapshot);
  return snapshot;
}

export function parseCompanionCursorWindow(stdout: string): CompanionCursorWindowSnapshot {
  const raw = record(JSON.parse(stdout.replace(/^\uFEFF/, "")));
  if (raw.version !== 1) throw new Error("窗口溯源的数据版本不受支持。");
  return {
    version: 1,
    sampledAt: number(raw.sampledAt),
    window: raw.window === null ? null : parseWindow(raw.window),
    note: windowNote,
  };
}

async function runWindowsCollector(mode: "Snapshot" | "Cursor", delaySeconds: number): Promise<string> {
  if (process.platform !== "win32") throw new Error("当前电脑诊断仅支持 Windows。");
  const scriptPath = fileURLToPath(new URL("../assets/companion/windows-diagnostics.ps1", import.meta.url))
    .replace(/([\\/])app\.asar([\\/])/, "$1app.asar.unpacked$2");
  const executable = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const controller = new AbortController();
  activeCollectors.add(controller);
  try {
    // 固定脚本与枚举参数。不会把路径、窗口文字或注册表命令拼进 shell。
    const { stdout } = await execFileAsync(executable, [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath,
      "-Mode", mode, "-DelaySeconds", String(delaySeconds),
    ], { timeout: 30_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true, encoding: "utf8", signal: controller.signal });
    return stdout;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("已取消电脑诊断。");
    const failure = error as NodeJS.ErrnoException & { killed?: boolean };
    if (failure.killed) throw new Error("电脑诊断超过 30 秒，已停止采集。请稍后重试。");
    // 不向日志或界面转发 stderr：系统错误可能包含敏感路径和参数。
    throw new Error("无法完成只读电脑诊断，请检查 Windows PowerShell 是否可用或受到组织策略限制。");
  } finally {
    activeCollectors.delete(controller);
  }
}

let activeSnapshot: Promise<CompanionDiagnosticsSnapshot> | null = null;
let activeCursor: Promise<CompanionCursorWindowSnapshot> | null = null;

/** 应用退出时取消仍在采集的子进程；已经返回的证据不受影响。 */
export function cancelCompanionDiagnostics(): void {
  for (const controller of activeCollectors) controller.abort();
}

/** 多个面板的重复刷新共享一次采集，避免并发启动大量 PowerShell。 */
export async function collectCompanionDiagnostics(): Promise<CompanionDiagnosticsSnapshot> {
  if (activeSnapshot !== null) return activeSnapshot;
  const pending = runWindowsCollector("Snapshot", 0).then(parseCompanionDiagnostics);
  activeSnapshot = pending;
  try {
    return await pending;
  } finally {
    if (activeSnapshot === pending) activeSnapshot = null;
  }
}

export async function captureCompanionWindowUnderCursor(delaySeconds = 3): Promise<CompanionCursorWindowSnapshot> {
  if (!Number.isInteger(delaySeconds) || delaySeconds < 0 || delaySeconds > 10) {
    throw new Error("指认延迟需要是 0 到 10 秒的整数。");
  }
  if (activeCursor !== null) return activeCursor;
  const pending = runWindowsCollector("Cursor", delaySeconds).then(parseCompanionCursorWindow);
  activeCursor = pending;
  try {
    return await pending;
  } finally {
    if (activeCursor === pending) activeCursor = null;
  }
}
