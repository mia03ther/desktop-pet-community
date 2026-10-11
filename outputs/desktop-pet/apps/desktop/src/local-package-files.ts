import { lstat, readdir, realpath } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import yauzl from "yauzl";
import type { Entry, ZipFile } from "yauzl";
import { readBoundedRegularFile } from "./pet-file-safety.js";
import { hasSupportedZipMagic } from "./zip-safety.js";

export interface LocalPackageLimits {
  readonly maxBytes: number;
  readonly maxFileBytes: number;
  readonly maxFiles: number;
}

/** 本地导入专用：保留附属文件，但不执行任何包内代码。 */
export async function readLocalPackageFiles(sourcePath: string, limits: LocalPackageLimits): Promise<Map<string, Buffer>> {
  const source = resolve(sourcePath);
  const stat = await lstat(source);
  if (stat.isSymbolicLink() || await realpath(source) !== source) throw new Error("导入路径不能经过链接。");
  if (stat.isFile()) {
    const zip = await readBoundedRegularFile(source, limits.maxBytes, "ZIP");
    if (!hasSupportedZipMagic(zip)) throw new Error("请选择有效的 ZIP 文件或文件夹。");
    return readZipFiles(zip, limits);
  }
  if (!stat.isDirectory()) throw new Error("请选择 ZIP 文件或普通文件夹。");
  const files = new Map<string, Buffer>();
  let total = 0;
  let entries = 0;
  const visit = async (directory: string, depth: number): Promise<void> => {
    if (depth > 12) throw new Error("素材包的目录层级过深。");
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      entries += 1;
      if (entries > limits.maxFiles * 2) throw new Error("素材包的目录和文件条目过多。");
      const fullPath = join(directory, entry.name);
      const name = relative(source, fullPath).split(sep).join("/");
      assertLocalPackagePath(name);
      if (entry.isSymbolicLink() || await realpath(fullPath) !== fullPath) throw new Error("素材包不能包含链接。");
      if (entry.isDirectory()) {
        await visit(fullPath, depth + 1);
      } else {
        if (!entry.isFile()) throw new Error("素材包不能包含特殊文件。");
        const fileStat = await lstat(fullPath);
        if (fileStat.size > limits.maxFileBytes || files.size >= limits.maxFiles || total + fileStat.size > limits.maxBytes) throw new Error("素材包的文件数量或大小超过上限。");
        if (fileStat.size === 0) {
          files.set(name, Buffer.alloc(0));
        } else {
          files.set(name, await readBoundedRegularFile(fullPath, limits.maxFileBytes, name));
        }
        total += fileStat.size;
        if (files.size > limits.maxFiles || total > limits.maxBytes) throw new Error("素材包的文件数量或总大小超过上限。");
      }
    }
  };
  await visit(source, 0);
  assertNoPackageCollisions(files.keys());
  return files;
}

/** 清单可处于下载 ZIP 的外层目录内；多份作品必须由用户单独选择。 */
export function selectLocalPackageRoot(files: ReadonlyMap<string, Buffer>, manifestNames: readonly string[]): { readonly files: Map<string, Buffer>; readonly manifestName: string } {
  const candidates = [...files.keys()].filter((name) => manifestNames.includes(basename(name)));
  const directories = [...new Set(candidates.map((name) => name.slice(0, name.length - basename(name).length)))];
  if (directories.length !== 1) throw new Error(directories.length ? "包内包含多个作品清单，请选择单个作品文件夹。" : `未找到支持的清单：${manifestNames.join("、")}。`);
  const prefix = directories[0]!;
  const selected = rebaseLocalPackageFiles(files, prefix);
  const manifestName = manifestNames.find((name) => selected.has(name))!;
  if (manifestNames.filter((name) => selected.has(name)).length > 1) throw new Error("同一作品包含多个插件清单，请保留一个入口清单。");
  return { files: selected, manifestName };
}

/** 运行根外的许可证与说明也随包归档，不能因 GitHub 下载目录层级而丢失。 */
export function rebaseLocalPackageFiles(files: ReadonlyMap<string, Buffer>, prefix: string): Map<string, Buffer> {
  const selected = new Map([...files].filter(([name]) => name.startsWith(prefix)).map(([name, bytes]) => [name.slice(prefix.length), bytes]));
  const outerFiles = [...files].filter(([name]) => !name.startsWith(prefix));
  if (!outerFiles.length) return selected;
  let archive = "import-wrapper";
  let suffix = 1;
  const selectedNames = [...selected.keys()].map((name) => name.toLowerCase());
  while (selectedNames.some((name) => name === archive || name.startsWith(`${archive}/`))) archive = `import-wrapper-${suffix++}`;
  for (const [name, bytes] of outerFiles) selected.set(`${archive}/${name}`, bytes);
  return selected;
}

export function assertLocalPackagePath(name: string): void {
  if (!name || name.length > 240 || /[\\\u0000-\u001f:]/u.test(name) || name.startsWith("/") || name.endsWith("/")) throw new Error("包内文件路径无效。");
  const parts = name.split("/");
  if (parts.length > 13 || parts.some((part) => !part || part === "." || part === ".." || /[. ]$/.test(part) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part))) throw new Error("包内文件路径不能穿越目录或使用系统保留名。");
}

function assertNoPackageCollisions(names: Iterable<string>): void {
  const entries = new Set<string>();
  for (const name of names) {
    const folded = name.toLowerCase();
    if (entries.has(folded)) throw new Error("包内存在大小写冲突的文件路径。");
    entries.add(folded);
  }
  for (const name of entries) {
    const parts = name.split("/");
    for (let index = 1; index < parts.length; index += 1) {
      if (entries.has(parts.slice(0, index).join("/"))) throw new Error("包内文件与目录路径冲突。");
    }
  }
}

async function readZipFiles(bytes: Buffer, limits: LocalPackageLimits): Promise<Map<string, Buffer>> {
  const zip = await new Promise<ZipFile>((complete, reject) => yauzl.fromBuffer(bytes, { lazyEntries: true, validateEntrySizes: true }, (error, file) => error || !file ? reject(error ?? new Error("无法读取 ZIP。")) : complete(file)));
  const files = new Map<string, Buffer>();
  let total = 0;
  let count = 0;
  try {
    await new Promise<void>((complete, reject) => {
      zip.on("error", reject);
      zip.on("end", complete);
      zip.on("entry", (entry: Entry) => {
        void (async () => {
          count += 1;
          if (count > limits.maxFiles * 2) throw new Error("ZIP 条目过多。");
          const directory = entry.fileName.endsWith("/");
          const name = directory ? entry.fileName.slice(0, -1) : entry.fileName;
          assertLocalPackagePath(name);
          const mode = (entry.externalFileAttributes >>> 16) & 0o170000;
          if (entry.isEncrypted() || (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) || (mode !== 0 && mode !== 0o100000 && mode !== 0o040000)) throw new Error("ZIP 不支持加密或特殊文件。");
          if (directory) return;
          if (files.has(name) || files.size >= limits.maxFiles || entry.uncompressedSize > limits.maxFileBytes) throw new Error("ZIP 文件重复或超过大小上限。");
          total += entry.uncompressedSize;
          if (total > limits.maxBytes) throw new Error("ZIP 解压总大小超过上限。");
          const stream = await new Promise<NodeJS.ReadableStream>((resolveStream, rejectStream) => zip.openReadStream(entry, (error, opened) => error || !opened ? rejectStream(error ?? new Error("无法读取 ZIP 条目。")) : resolveStream(opened)));
          const chunks: Buffer[] = [];
          let read = 0;
          for await (const chunk of stream) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            read += buffer.length;
            if (read > limits.maxFileBytes || read > entry.uncompressedSize) throw new Error("ZIP 条目的实际大小超过声明。");
            chunks.push(buffer);
          }
          if (read !== entry.uncompressedSize) throw new Error("ZIP 条目不完整。");
          files.set(name, Buffer.concat(chunks));
        })().then(() => zip.readEntry()).catch(reject);
      });
      zip.readEntry();
    });
  } finally {
    zip.close();
  }
  assertNoPackageCollisions(files.keys());
  return files;
}
