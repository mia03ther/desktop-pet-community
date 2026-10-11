import { packageImportLimits } from "./package-import-limits.js";
import { createWriteStream, type Stats } from "node:fs";
import { lstat, mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { Transform, type Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import sharp from "sharp";
import yazl from "yazl";

import { readInstalledPetMetadata, readPetPackageAssets } from "./pet-media-files.js";
import { isMediaPetMetadata } from "./pet-media-contract.js";
import { assertSafePetId } from "./pet-paths.js";
import { maxPetShareArchiveBytes, maxPetShareReadmeBytes, parsePetPackageExportOptions, type PetPackageExportOptions, type PetPackageExportResult } from "./pet-sharing-contract.js";
import { readLocalPackageFiles } from "./local-package-files.js";

export type { PetPackageExportResult } from "./pet-sharing-contract.js";

function shareInstructions(options: PetPackageExportOptions): string {
  const describe = (field: string | undefined): string => field ? escapeMarkdown(field) : "待核实。";
  return `# 桌宠本地分享包

本素材包仅包含宠物描述、动画素材和此说明，不包含应用账号、对话、人物设定或养成记录。

## 如何使用

${options.format === "zip"
    ? "在桌宠管理页选择“导入宠物”，选择 ZIP 方式，再选择本 ZIP 文件。"
    : "在桌宠管理页选择“导入宠物”，选择文件夹方式，再选择包含 pet.json 和动画素材的本文件夹。"}
导入会保留本包的作品信息、动画素材和附属文件；只有已声明的动作素材会用于播放。

## 作者、来源与素材许可

作者：${describe(options.author)}
来源：${describe(options.source)}
素材许可：${describe(options.license)}

以上为填写者声明，应用未验证作者、来源或素材许可。

导出工具无法从已安装宠物的规范字段判断作者、来源或分享许可。请在传播前自行核实，并补充正确的署名、来源与许可；应用代码的许可不等于这些素材的许可。
`;
}

function escapeMarkdown(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+.!|~\-]/g, "\\$&");
}

/** 仅写入新建的分享文件夹；安装资格与读取锁由调用方拥有。 */
export async function exportPetPackageFromDirectory(
  sourceDir: string,
  petId: string,
  parentDir: string,
  signal?: AbortSignal,
  options?: PetPackageExportOptions,
): Promise<PetPackageExportResult> {
  assertSafePetId(petId);
  signal?.throwIfAborted();
  const settings = parsePetPackageExportOptions(options);
  const readme = shareInstructions(settings);
  if (Buffer.byteLength(readme, "utf8") > maxPetShareReadmeBytes) throw new Error("分享说明过大。");
  const source = await canonicalDirectory(sourceDir, "宠物来源目录");
  const parent = await canonicalDirectory(parentDir, "分享保存目录");
  signal?.throwIfAborted();
  const metadata = await readInstalledPetMetadata(source, petId);
  signal?.throwIfAborted();
  await canonicalDirectory(source, "宠物来源目录");
  signal?.throwIfAborted();
  await readPetPackageAssets(source, metadata);
  const assets = await readLocalPackageFiles(source, packageImportLimits);
  assets.delete("pet.json");
  const attachedNames = new Set([...assets.keys()].map((name) => name.toLowerCase()));
  let readmeName = "SHARE.md";
  let readmeSuffix = 1;
  while (attachedNames.has(readmeName.toLowerCase())) readmeName = `DESKTOP-PET-SHARE-${readmeSuffix++}.md`;
  signal?.throwIfAborted();
  if (!isMediaPetMetadata(metadata) && metadata.spriteVersionNumber !== 2) {
    // 旧 V1 导入不检查图像；导出至少要求单张 WebP 可以完整解码。
    const image = sharp(assets.get("spritesheet.webp")!, { animated: true, failOn: "error", limitInputPixels: 50_000_000 });
    const imageMetadata = await image.metadata();
    if (imageMetadata.format !== "webp" || (imageMetadata.pages ?? 1) !== 1) {
      throw new Error("分享的 V1 动画素材必须为单张 WebP 图片。");
    }
    await image.raw().toBuffer();
  }
  signal?.throwIfAborted();
  await canonicalDirectory(parent, "分享保存目录");
  signal?.throwIfAborted();

  const directory = await mkdtemp(join(parent, `${petId}-share-`));
  let createdStats: Stats | undefined;
  try {
    createdStats = await lstat(directory);
    const ownedStats = createdStats;
    signal?.throwIfAborted();
    const write = async (name: string, content: string | Buffer): Promise<void> => {
      signal?.throwIfAborted();
      await assertCreatedDirectory(parent, directory, ownedStats);
      signal?.throwIfAborted();
      await mkdir(dirname(join(directory, name)), { recursive: true });
      await writeFile(join(directory, name), content, { flag: "wx", mode: 0o600 });
      signal?.throwIfAborted();
    };
    const petJson = `${JSON.stringify(metadata, null, 2)}\n`;
    const archivePath = settings.format === "zip" ? join(directory, `${petId}.zip`) : undefined;
    if (archivePath) {
      await assertCreatedDirectory(parent, directory, ownedStats);
      signal?.throwIfAborted();
      await writeArchive(archivePath, petJson, assets, readme, readmeName, signal);
    } else {
      await write("pet.json", petJson);
      for (const [file, bytes] of assets) await write(file, bytes);
      await write(readmeName, readme);
    }
    await assertCreatedDirectory(parent, directory, createdStats);
    signal?.throwIfAborted();
    return { petId, displayName: metadata.displayName, directoryPath: directory, ...(archivePath ? { archivePath } : {}) };
  } catch (error) {
    if (createdStats) {
      try {
        await assertCreatedDirectory(parent, directory, createdStats);
        // 只递归清理本次创建、身份未改变且仍在所选父目录内的子目录。
        await rm(directory, { recursive: true, force: true });
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "分享未完成，目录位置或身份发生变化，未自动清理。");
      }
    }
    throw error;
  }
}

async function writeArchive(path: string, petJson: string, assets: ReadonlyMap<string, Buffer>, readme: string, readmeName: string, signal?: AbortSignal): Promise<void> {
  const archive = new yazl.ZipFile();
  const source = archive.outputStream as Readable;
  archive.on("error", (error: Error) => source.destroy(error));
  archive.addBuffer(Buffer.from(petJson, "utf8"), "pet.json", { mode: 0o100600 });
  // 动画图片和视频已经压缩，直接存储以避免重复压缩占用资源。
  for (const [file, bytes] of assets) archive.addBuffer(bytes, file, { mode: 0o100600, compress: false });
  archive.addBuffer(Buffer.from(readme, "utf8"), readmeName, { mode: 0o100600 });
  const destination = createWriteStream(path, { flags: "wx", mode: 0o600 });
  const closed = new Promise<void>((complete) => destination.once("close", complete));
  let total = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      total += chunk.byteLength;
      callback(total > maxPetShareArchiveBytes ? new Error(`ZIP 超过 ${Math.round(maxPetShareArchiveBytes / 1024 / 1024)} MiB，请缩小素材包。`) : null, chunk);
    },
  });
  try {
    const writing = pipeline(source, counter, destination, { signal });
    archive.end();
    await writing;
  } finally {
    source.destroy();
    destination.destroy();
    // 失败或取消后先等文件句柄关闭，再由调用方清理本次新目录。
    await closed;
  }
}

async function canonicalDirectory(path: string, label: string): Promise<string> {
  if (!isAbsolute(path)) throw new Error(`${label}必须为绝对路径。`);
  const resolved = resolve(path);
  const stats = await lstat(resolved);
  if (stats.isSymbolicLink() || !stats.isDirectory()) throw new Error(`${label}必须为普通文件夹。`);
  if (await realpath(resolved) !== resolved) throw new Error(`${label}不能经过链接或非规范路径。`);
  return resolved;
}

async function assertCreatedDirectory(parent: string, directory: string, expected: Stats): Promise<void> {
  if (dirname(resolve(directory)) !== parent) throw new Error("分享目录超出所选保存范围。");
  await canonicalDirectory(parent, "分享保存目录");
  await canonicalDirectory(directory, "新建分享目录");
  const actual = await lstat(directory);
  if (actual.dev !== expected.dev || actual.ino !== expected.ino) throw new Error("新建分享目录身份发生变化。");
}
