import childProcess from "node:child_process";
import * as fs from "node:fs/promises";
import type { Stats } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { companionInstallerPath, MAX_COMPANION_INSTALLER_BYTES, parseCompanionInstallerEvidence } from "./companion-software-core.js";
import type { CompanionInstallerEvidence } from "./companion-software-types.js";

const activeInspections = new Set<AbortController>();

async function ordinaryInstaller(filePath: string): Promise<Stats> {
  const root = path.parse(filePath).root;
  let current = root;
  let stats = await fs.lstat(current);
  for (const component of filePath.slice(root.length).split(path.sep)) {
    current = path.join(current, component);
    stats = await fs.lstat(current);
    if (stats.isSymbolicLink()) throw new Error("安装文件路径含符号链接或目录联接，已拒绝检查。");
  }
  if (!stats.isFile()) throw new Error("请选择普通安装文件。");
  if (stats.size > MAX_COMPANION_INSTALLER_BYTES) throw new Error("安装文件超过 256 MiB 检查上限。");
  return stats;
}

function cancelled(signal: AbortSignal): void {
  if (signal.aborted) throw new Error("已取消安装文件检查。");
}

function collect(filePath: string, signal: AbortSignal): Promise<string> {
  const scriptPath = fileURLToPath(new URL("../assets/companion/windows-software-inspection.ps1", import.meta.url))
    .replace(/([\\/])app\.asar([\\/])/u, "$1app.asar.unpacked$2");
  const executable = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  return new Promise((resolve, reject) => {
    // 固定脚本和独立参数，不把所选路径拼入 shell，也不执行安装文件。
    childProcess.execFile(executable, [
      "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath,
      "-LiteralPath", filePath,
    ], { timeout: 30_000, maxBuffer: 1024 * 1024, windowsHide: true, encoding: "utf8", signal }, (error, stdout) => {
      if (!error) {
        resolve(stdout);
      } else if (signal.aborted) {
        reject(new Error("已取消安装文件检查。"));
      } else if (error.killed) {
        reject(new Error("安装文件检查超过 30 秒，已停止。"));
      } else {
        // stderr 可能含私人路径，不传入界面或日志。
        reject(new Error("无法完成安装文件只读检查；文件可能不可读、发生变化，或 Windows PowerShell 受到策略限制。"));
      }
    });
  });
}

/** 应用退出或用户取消时停止仍在运行的安装文件采集。 */
export function cancelCompanionSoftwareInspection(): void {
  for (const controller of activeInspections) controller.abort();
}

/** 检查仅有界读取所选 EXE/MSI 的本地静态证据，结果不判定捆绑或有害。 */
export async function inspectCompanionInstaller(filePath: string, signal?: AbortSignal): Promise<CompanionInstallerEvidence> {
  if (process.platform !== "win32") throw new Error("安装文件检查目前仅支持 Windows。");
  const selectedPath = companionInstallerPath(filePath);
  if (activeInspections.size > 0) throw Object.assign(new Error("已有安装文件检查正在进行，请等待完成或取消。"), { code: "COMPANION_INSPECTION_BUSY" });
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  activeInspections.add(controller);
  try {
    cancelled(controller.signal);
    const before = await ordinaryInstaller(selectedPath);
    cancelled(controller.signal);
    const stdout = await collect(selectedPath, controller.signal);
    cancelled(controller.signal);
    const after = await ordinaryInstaller(selectedPath);
    cancelled(controller.signal);
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size
      || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
      throw new Error("安装文件在检查期间发生变化，请等下载完成后重新选择。");
    }
    const evidence = parseCompanionInstallerEvidence(stdout, selectedPath);
    if (evidence.sizeBytes !== before.size) throw new Error("安装文件在检查期间发生变化，请重新选择。");
    return evidence;
  } finally {
    signal?.removeEventListener("abort", abort);
    activeInspections.delete(controller);
  }
}
