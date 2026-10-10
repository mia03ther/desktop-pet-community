import { lstat } from "node:fs/promises";
import { homedir } from "node:os";
import { posix, win32 } from "node:path";
import type { CompanionUninstallDirectoryCheck } from "./companion-software-types.js";

export type CompanionUninstallDirectoryEvidence = Pick<CompanionUninstallDirectoryCheck, "status" | "explanation">;

function unsupported(explanation: string): CompanionUninstallDirectoryEvidence {
  return { status: "unsupported", explanation };
}

function checkedPath(installLocation: string): string | null {
  if (!installLocation || installLocation.length > 4096 || /[\x00-\x1f]/.test(installLocation)
    || /^[\\/]{2}/.test(installLocation)) return null;
  if (process.platform === "win32") {
    if (!/^[a-z]:[\\/]/i.test(installLocation) || /[:<>"|?*]/.test(installLocation.slice(2))) return null;
    if (installLocation.slice(3).split(/[\\/]/).some((part) => /[. ]$/.test(part) || /~\d(?:\.|$)/.test(part))) return null;
    const location = win32.normalize(installLocation);
    const root = win32.parse(location).root;
    const key = location.replace(/[\\/]+$/, "").toLowerCase();
    const roots = [
      root, win32.join(root, "Users"), win32.join(root, "Program Files"),
      win32.join(root, "Program Files (x86)"), win32.join(root, "ProgramData"),
      process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.ProgramW6432,
      process.env.ProgramData, process.env.USERPROFILE, process.env.PUBLIC,
      process.env.APPDATA, process.env.LOCALAPPDATA,
    ].filter((value): value is string => Boolean(value));
    if (roots.some((value) => win32.normalize(value).replace(/[\\/]+$/, "").toLowerCase() === key)) return null;
    const systemRoots = [
      win32.join(root, "Windows"), win32.join(root, "$Recycle.Bin"),
      win32.join(root, "System Volume Information"), win32.join(root, "Recovery"),
      process.env.WINDIR, process.env.SystemRoot,
    ]
      .filter((value): value is string => Boolean(value));
    if (systemRoots.some((value) => {
      const systemKey = win32.normalize(value).replace(/[\\/]+$/, "").toLowerCase();
      return key === systemKey || key.startsWith(`${systemKey}\\`);
    })) return null;
    return location;
  }
  if (!posix.isAbsolute(installLocation) || installLocation.includes(":")) return null;
  const location = posix.normalize(installLocation).replace(/\/$/, "") || "/";
  if (["/", "/Users", "/home", "/Applications", "/opt", "/var", homedir()].includes(location)) return null;
  if (["/etc", "/usr", "/bin", "/sbin", "/lib", "/System"].some((root) => location === root || location.startsWith(`${root}/`))) return null;
  return location;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("已取消目录核对。");
}

/** 只逐层读取已保存路径的属性，不枚举子项，也不修改文件。 */
export async function checkCompanionUninstallDirectory(
  installLocation: string,
  signal?: AbortSignal,
): Promise<CompanionUninstallDirectoryEvidence> {
  throwIfAborted(signal);
  const location = checkedPath(installLocation);
  if (!location) return unsupported("登记路径属于系统或共享根目录，或路径格式不受支持；未进行目录核对。");
  const path = process.platform === "win32" ? win32 : posix;
  const root = path.parse(location).root;
  const parts = location.slice(root.length).split(path.sep).filter(Boolean);
  let current = root;
  try {
    for (const part of [null, ...parts]) {
      throwIfAborted(signal);
      if (part !== null) current = path.join(current, part);
      const stats = await lstat(current);
      throwIfAborted(signal);
      if (stats.isSymbolicLink()) return unsupported("登记目录或上级目录是符号链接或目录联接；未越过链接核对。");
      if (!stats.isDirectory()) return unsupported("登记路径或其上级不是普通目录，无法用该路径核对安装目录。");
    }
    return {
      status: "exists",
      explanation: "本次仍可见此前登记的安装目录；其中可能包含残留、用户资料、共享组件或其他版本。未检查内容，不能判断文件可删除。",
    };
  } catch (error) {
    throwIfAborted(signal);
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return {
        status: "absent",
        explanation: "本次未见此前登记的安装目录，路径中的某层不存在；这仅核对了该登记路径，不能证明全盘无残留或卸载干净。",
      };
    }
    return { status: "unreadable", explanation: "本次无法读取登记目录或上级目录的属性；不能判断目录是否存在，也不能据此认定卸载干净。" };
  }
}
