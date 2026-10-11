import { constants, createReadStream } from "node:fs";
import { lstat, mkdir, mkdtemp, readdir, realpath, rm, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import yauzl, { type Entry, type ZipFile } from "yauzl";
import { assertLocalPackagePath } from "./local-package-files.js";

export interface PortableUpdatePlan {
  readonly installDir: string;
  readonly workDir: string;
  readonly stagedDir: string;
  readonly backupDir: string;
  readonly profileDir: string;
  readonly parentProcessId: number;
  readonly launchIntent: "--open-studio" | "--show-pet";
  readonly files: readonly { readonly name: string; readonly sha256: string }[];
}
export async function updateFileDigest(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
function inside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || !rel.startsWith("..") && !isAbsolute(rel);
}
async function assertOrdinaryDirectory(path: string): Promise<void> {
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (await realpath(path)).toLowerCase() !== resolve(path).toLowerCase()) throw new Error("自动更新只支持没有链接的本机普通目录。");
}

/** 解压只写新建空目录；保留逐个文件流式处理，避免完整程序包进入内存。 */
export async function extractUpdateZip(zipPath: string, destination: string): Promise<string> {
  await mkdir(destination);
  const zip = await new Promise<ZipFile>((done, reject) => yauzl.open(zipPath, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, opened) => error || !opened ? reject(error ?? new Error("更新 ZIP 无法读取。")) : done(opened)));
  const names = new Set<string>();
  const appRoots = new Set<string>();
  let total = 0;
  let count = 0;
  try {
    await new Promise<void>((done, reject) => {
      zip.on("error", reject);
      zip.on("end", done);
      zip.on("entry", (entry: Entry) => {
        void (async () => {
          if (++count > 40000) throw new Error("更新 ZIP 文件数量超过上限。");
          const directory = entry.fileName.endsWith("/");
          const name = directory ? entry.fileName.slice(0, -1) : entry.fileName;
          assertLocalPackagePath(name);
          const folded = name.toLowerCase();
          if (names.has(folded)) throw new Error("更新 ZIP 包含重复或大小写冲突路径。");
          names.add(folded);
          const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
          if (entry.isEncrypted() || ![0, 8].includes(entry.compressionMethod) || ![0, 0o100000, 0o040000].includes(mode)) throw new Error("更新 ZIP 不支持加密、链接或特殊文件。");
          const output = resolve(destination, name);
          if (!inside(destination, output)) throw new Error("更新 ZIP 路径越界。");
          if (directory) { await mkdir(output, { recursive: true }); return; }
          total += entry.uncompressedSize;
          if (entry.uncompressedSize > 1024 ** 3 || total > 4 * 1024 ** 3) throw new Error("更新 ZIP 解压大小超过上限。");
          if (basename(name) === "desktop-pet.exe") appRoots.add(dirname(name));
          await mkdir(dirname(output), { recursive: true });
          const stream = await new Promise<NodeJS.ReadableStream>((complete, failed) => zip.openReadStream(entry, (error, opened) => error || !opened ? failed(error ?? new Error("更新 ZIP 条目无法读取。")) : complete(opened)));
          await pipeline(stream, createWriteStream(output, { flags: "wx" }));
          if ((await lstat(output)).size !== entry.uncompressedSize) throw new Error("更新 ZIP 条目不完整。");
        })().then(() => zip.readEntry()).catch(reject);
      });
      zip.readEntry();
    });
    if (appRoots.size !== 1) throw new Error("更新 ZIP 必须包含唯一 desktop-pet.exe 程序根。");
    const appRoot = resolve(destination, [...appRoots][0]!);
    for (const name of ["desktop-pet.exe", "resources/app.asar", "LICENSE", "THIRD-PARTY-NOTICES.md"]) {
      const stat = await lstat(join(appRoot, name));
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0) throw new Error(`更新包缺少完整程序或许可：${name}`);
    }
    return appRoot;
  } finally { zip.close(); }
}

export async function preparePortableUpdate(zipPath: string, installDirectory: string, profileDirectory: string, parentProcessId: number, launchIntent: "--open-studio" | "--show-pet" = "--show-pet"): Promise<{ readonly plan: PortableUpdatePlan; readonly manifestPath: string }> {
  const installDir = resolve(installDirectory);
  const profileDir = resolve(profileDirectory);
  const profileReal = await realpath(profileDir);
  if (dirname(installDir) === installDir || inside(installDir, profileDir) || inside(installDir, profileReal)) throw new Error("数据目录位于程序目录内，请使用已核验 ZIP 手动更新并保留该目录。");
  await assertOrdinaryDirectory(installDir);
  await assertOrdinaryDirectory(dirname(installDir));
  await access(join(installDir, "desktop-pet.exe"), constants.R_OK);
  await access(join(installDir, "resources", "app.asar"), constants.R_OK);
  const workDir = await mkdtemp(join(dirname(installDir), ".desktop-pet-update-"));
  try {
    const stagedDir = await extractUpdateZip(zipPath, join(workDir, "expanded"));
    const files: { name: string; sha256: string }[] = [];
    const visit = async (directory: string): Promise<void> => {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const file = join(directory, entry.name);
        if (entry.isSymbolicLink()) throw new Error("更新目录不能包含链接。");
        if (entry.isDirectory()) await visit(file);
        else if (entry.isFile()) files.push({ name: relative(stagedDir, file).replaceAll("\\", "/"), sha256: await updateFileDigest(file) });
        else throw new Error("更新目录不能包含特殊文件。");
      }
    };
    await visit(stagedDir);
    const plan: PortableUpdatePlan = { installDir, workDir, stagedDir, backupDir: join(workDir, "previous-app"), profileDir, parentProcessId, launchIntent, files };
    const manifestPath = join(workDir, "plan.json");
    await writeFile(manifestPath, JSON.stringify(plan), { flag: "wx" });
    return { plan, manifestPath };
  } catch (error) { await rm(workDir, { recursive: true, force: true }); throw error; }
}