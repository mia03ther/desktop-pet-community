import { readdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { maxCodexPetJsonBytes, validateCodexPetMetadata, validateCodexPetSpritesheet, type CodexPetMetadata } from "./codex-pets-core.js";
import { readBoundedRegularFile } from "./pet-file-safety.js";
import { isMediaPetMetadata, maxPetMediaFileBytes, maxPetMediaTotalBytes, uniquePetMediaFiles, validateMediaPetMetadata, type MediaPetMetadata, type PetMediaFile } from "./pet-media-contract.js";

export type InstalledPetMetadata = CodexPetMetadata | MediaPetMetadata;

export function validateInstalledPetMetadata(value: unknown, petId: string): InstalledPetMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("pet.json 必须是对象。");
  const input = value as Record<string, unknown>;
  const described = input.description === undefined ? { ...input, description: input.displayName } : input;
  return isMediaPetMetadata(described) ? validateMediaPetMetadata(described, petId) : { ...described, ...validateCodexPetMetadata(described, petId) };
}

export async function readInstalledPetMetadata(directory: string, petId: string): Promise<InstalledPetMetadata> {
  const parsed: unknown = JSON.parse((await readBoundedRegularFile(join(directory, "pet.json"), maxCodexPetJsonBytes, "pet.json")).toString("utf8"));
  return validateInstalledPetMetadata(parsed, petId);
}

/** 文件名、大小和格式均由宿主校验；不执行素材包内任何脚本。 */
export async function readPetPackageAssets(directory: string, metadata: InstalledPetMetadata): Promise<ReadonlyMap<string, Buffer>> {
  const assets = new Map<string, Buffer>();
  if (!isMediaPetMetadata(metadata)) {
    const bytes = await readBoundedRegularFile(join(directory, metadata.spritesheetPath), maxPetMediaFileBytes, "spritesheet.webp");
    await validateCodexPetSpritesheet(bytes, metadata);
    assets.set("spritesheet.webp", bytes);
    return assets;
  }
  let total = 0;
  for (const file of uniquePetMediaFiles(metadata)) {
    const bytes = await readBoundedRegularFile(join(directory, file), maxPetMediaFileBytes, file);
    total += bytes.byteLength;
    if (total > maxPetMediaTotalBytes) throw new Error("动作媒体总大小超过 1 GiB。");
    await validatePetMediaBytes(bytes, file, metadata);
    assets.set(file, bytes);
  }
  return assets;
}

export async function validatePetMediaBytes(bytes: Buffer, file: PetMediaFile, metadata: MediaPetMetadata): Promise<void> {
  if (file.toLowerCase().endsWith(".webp")) {
    const image = sharp(bytes, { animated: true, failOn: "error", limitInputPixels: 50_000_000 });
    const info = await image.metadata();
    const staticAllowed = metadata.staticActions?.some((action) => metadata.actions[action] === file) === true;
    const frameHeight = info.pageHeight ?? info.height;
    if (info.format !== "webp" || (info.pages ?? 1) < (staticAllowed ? 1 : 2) || (info.pages ?? 1) > 600 || !info.width || !frameHeight || info.width > 2048 || frameHeight > 2048) throw new Error("WebP 动作必须是可解码的有界动画 WebP，静态素材须显式声明 staticActions，最多 600 帧。");
    if (metadata.background.mode === "alpha" && !info.hasAlpha) throw new Error("透明动作 WebP 必须有透明通道。");
    await image.raw().toBuffer();
    return;
  }
  if (file.toLowerCase().endsWith(".mp4")) {
    if (bytes.length < 24 || bytes.toString("ascii", 4, 8) !== "ftyp") throw new Error("MP4 动作的文件头无效。");
  } else if (bytes.length < 16 || bytes.readUInt32BE(0) !== 0x1a45dfa3 || !bytes.subarray(0, Math.min(bytes.length, 4096)).includes(Buffer.from("webm"))) {
    throw new Error("WebM 动作的文件头无效。");
  }
}

export async function assertPetPackageFileWhitelist(directory: string, metadata: InstalledPetMetadata): Promise<void> {
  const allowed = new Set(["pet.json", ...(isMediaPetMetadata(metadata) ? uniquePetMediaFiles(metadata) : ["spritesheet.webp"])]);
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !allowed.has(entry.name)) throw new Error(`素材包包含未声明文件：${entry.name}`);
  }
}
