import { createWriteStream } from "node:fs";
import { createHash } from "node:crypto";
import { lstat, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform, Writable } from "node:stream";

import yauzl from "yauzl";
import sharp from "sharp";
import type { Entry, ZipFile } from "yauzl";

import { getAppStateSnapshot, installPetState, removePetState, setDefaultPet, upsertPetState, type OpenPetsStateV1 } from "./app-state.js";
import { getCatalogPet } from "./catalog.js";
import { codexV2SpriteLayout, maxCodexPetJsonBytes, maxCodexSpritesheetBytes, validateCodexPetMetadata, validateCodexPetSpritesheet, type CodexPetSpriteLayout } from "./codex-pets-core.js";
import { builtInPet } from "./built-in-pet.js";
import { readBoundedRegularFile } from "./pet-file-safety.js";
import { exportPetPackageFromDirectory, type PetPackageExportResult } from "./pet-package-export.js";
import { assertInsideRoot, assertSafePetId, getPetsRoot } from "./pet-paths.js";
import { assertNoUnresolvedPetInstallTransaction, createPetInstallCandidate, createPetInstallStagingCandidate, discardPetInstallCandidate, discardPetInstallStagingCandidate, getCanonicalInstalledPetDir, runPetInstallTransaction, withPetInstallLock } from "./pet-install-transaction.js";
import { assertOutputPathInside, hasSupportedZipMagic, ZipEntryPathTracker } from "./zip-safety.js";
import { maxPetShareArchiveBytes, maxPetShareReadmeBytes, type PetPackageExportOptions } from "./pet-sharing-contract.js";
import { assertPetPackageFileWhitelist, readPetPackageAssets, validateInstalledPetMetadata, type InstalledPetMetadata } from "./pet-media-files.js";
import { readLocalPackageFiles, selectLocalPackageRoot } from "./local-package-files.js";
import { convertShimejiPetPackage } from "./shimeji-pet-import.js";

const maxZipDownloadBytes = maxPetShareArchiveBytes;
const maxExtractedTotalBytes = 200 * 1024 * 1024;
const maxFiles = 500;
const maxIndividualFileBytes = 100 * 1024 * 1024;
const downloadTimeoutMs = 30_000;

export interface LocalPetInstallResult {
  readonly state: OpenPetsStateV1;
  readonly petId: string;
  readonly displayName: string;
}

export interface PersonalPetAuthoringInput {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface PreparedPersonalPetSpritesheet {
  readonly path: string;
  readonly sha256: string;
  readonly previewDataUrl: string;
  readonly spriteLayout: CodexPetSpriteLayout;
}

export async function preparePersonalPetSpritesheet(imagePath: string, signal?: AbortSignal): Promise<PreparedPersonalPetSpritesheet> {
  const image = await readPersonalPetSpritesheet(imagePath, signal);
  signal?.throwIfAborted();
  const preview = await sharp(image.bytes, { failOn: "error", limitInputPixels: 50_000_000 })
    .resize({ width: 768, height: 1144, fit: "inside", withoutEnlargement: true })
    .webp()
    .toBuffer();
  signal?.throwIfAborted();
  return {
    path: image.path,
    sha256: image.sha256,
    previewDataUrl: `data:image/webp;base64,${preview.toString("base64")}`,
    spriteLayout: codexV2SpriteLayout,
  };
}

export async function installPetFromSpritesheetFileWithResult(
  imagePath: string,
  input: PersonalPetAuthoringInput,
  options: { readonly signal?: AbortSignal; readonly expectedSha256?: string } = {},
): Promise<LocalPetInstallResult> {
  const { signal, expectedSha256 } = options;
  signal?.throwIfAborted();
  const metadata = validateCodexPetMetadata({
    id: input.id,
    displayName: input.displayName,
    description: input.description,
    spritesheetPath: "spritesheet.webp",
    spriteVersionNumber: 2,
  }, input.id);
  const petJson = `${JSON.stringify(metadata, null, 2)}\n`;
  if (Buffer.byteLength(petJson, "utf8") > maxCodexPetJsonBytes) throw new Error("桌宠描述文件过大。");
  return withPetInstallLock(metadata.id, async () => {
    signal?.throwIfAborted();
    const petsRoot = getPetsRoot();
    await assertNoUnresolvedPetInstallTransaction(petsRoot, metadata.id);
    await assertPersonalPetIdAvailable(petsRoot, metadata.id);
    signal?.throwIfAborted();
    const image = await readPersonalPetSpritesheet(imagePath, signal);
    if (expectedSha256 !== undefined && image.sha256 !== expectedSha256) {
      throw new Error("所选图集已发生变化，请重新选择并预览。");
    }
    signal?.throwIfAborted();
    const candidate = await createPetInstallCandidate(petsRoot, metadata.id);
    let transactionStarted = false;
    try {
      signal?.throwIfAborted();
      await writeFile(join(candidate, "spritesheet.webp"), image.bytes, { mode: 0o600, flag: "wx" });
      signal?.throwIfAborted();
      await writeFile(join(candidate, "pet.json"), petJson, { encoding: "utf8", mode: 0o600, flag: "wx" });
      signal?.throwIfAborted();
      transactionStarted = true;
      const state = await runPetInstallTransaction({
        petsRoot,
        petId: metadata.id,
        candidateDir: candidate,
        lockAlreadyHeld: true,
        createOnly: true,
        validateCandidate: async (directory) => {
          signal?.throwIfAborted();
          await assertPersonalPetIdAvailable(petsRoot, metadata.id);
          await validateExtractedPet(directory);
          signal?.throwIfAborted();
        },
        mutateState: () => {
          signal?.throwIfAborted();
          return installPetState({ id: metadata.id, displayName: metadata.displayName, description: metadata.description });
        },
      });
      // 状态提交之后即使收到迟到取消，也保留成功结果及已安装素材。
      return { state, petId: metadata.id, displayName: metadata.displayName };
    } catch (error) {
      if (!transactionStarted) await discardPetInstallCandidate(petsRoot, metadata.id, candidate);
      throw error;
    }
  });
}

async function readPersonalPetSpritesheet(imagePath: string, signal?: AbortSignal): Promise<{ readonly path: string; readonly sha256: string; readonly bytes: Buffer }> {
  signal?.throwIfAborted();
  if (!isAbsolute(imagePath)) throw new Error("请选择本机图集文件。");
  const path = resolve(imagePath);
  if (await realpath(path) !== path) throw new Error("图集文件不能经过链接或非规范路径。");
  signal?.throwIfAborted();
  const bytes = await readBoundedRegularFile(path, maxCodexSpritesheetBytes, "spritesheet.webp");
  if (bytes.byteLength > maxCodexSpritesheetBytes) throw new Error("图集文件过大。");
  signal?.throwIfAborted();
  await validateCodexPetSpritesheet(bytes, { spriteVersionNumber: 2 });
  signal?.throwIfAborted();
  const decoded = await sharp(bytes, { failOn: "error", limitInputPixels: 50_000_000 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = false;
  let visible = false;
  for (let index = decoded.info.channels - 1; index < decoded.data.length; index += decoded.info.channels) {
    const alpha = decoded.data[index]!;
    if (alpha === 0) transparent = true;
    if (alpha > 0) visible = true;
    if (transparent && visible) break;
  }
  if (!visible) throw new Error("图集没有可见内容，请选择绘制好的宠物图集。");
  if (!transparent) throw new Error("图集需要完全透明的背景像素。");
  signal?.throwIfAborted();
  return { path, sha256: createHash("sha256").update(bytes).digest("hex"), bytes };
}

async function assertPersonalPetIdAvailable(petsRoot: string, petId: string): Promise<void> {
  if (getAppStateSnapshot().pets.installed.some((pet) => pet.id === petId)) throw new Error("桌宠编号已存在，请使用新编号。");
  const finalDir = resolve(petsRoot, petId);
  assertInsideRoot(petsRoot, finalDir);
  try {
    await lstat(finalDir);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  throw new Error("此桌宠编号已有本地素材，请使用新编号。");
}

export type { PetPackageExportResult } from "./pet-package-export.js";

export async function exportInstalledPetPackage(petId: string, parentDir: string, signal?: AbortSignal, options?: PetPackageExportOptions): Promise<PetPackageExportResult> {
  assertSafePetId(petId);
  signal?.throwIfAborted();
  return withPetInstallLock(petId, async () => {
    signal?.throwIfAborted();
    const pet = getAppStateSnapshot().pets.installed.find((entry) => entry.id === petId);
    if (!pet || !pet.installed || pet.builtIn || pet.broken || pet.source?.kind === "team") {
      throw new Error("只能分享已安装且可用的个人宠物。");
    }
    const petsRoot = getPetsRoot();
    await assertNoUnresolvedPetInstallTransaction(petsRoot, petId);
    const sourceDir = await getCanonicalInstalledPetDir(petsRoot, petId);
    signal?.throwIfAborted();
    return exportPetPackageFromDirectory(sourceDir, petId, parentDir, signal, options);
  });
}

export async function installPet(petId: string): Promise<OpenPetsStateV1> {
  assertSafePetId(petId);
  return withPetInstallLock(petId, async () => {
    const petsRoot = getPetsRoot();
    await assertNoUnresolvedPetInstallTransaction(petsRoot, petId);
    if (getAppStateSnapshot().pets.installed.some((pet) => pet.id === petId)) {
      throw new Error(`Pet is already installed: ${petId}`);
    }

    // The lock intentionally covers catalog lookup and download: an install
    // must not recreate a removed or duplicate ID after its preflight check.
    const catalogPet = await getCatalogPet(petId);
    const zip = await downloadPetZip(catalogPet.zip);
    const candidate = await createPetInstallCandidate(petsRoot, petId);
    try {
      await extractPetZip(zip, candidate);
      const metadata = await validateExtractedPet(candidate);
      if (metadata.id !== petId || metadata.id !== catalogPet.id) {
        throw new Error("Catalog pet package id does not match the requested pet.");
      }
      return await runPetInstallTransaction({
        petsRoot,
        petId: metadata.id,
        candidateDir: candidate,
        lockAlreadyHeld: true,
        validateCandidate: async (directory) => {
          const validated = await validateExtractedPet(directory);
          if (validated.id !== catalogPet.id) throw new Error("Catalog pet package id does not match the requested pet.");
        },
        mutateState: () => installPetState({
          id: catalogPet.id,
          displayName: catalogPet.displayName,
          description: catalogPet.description,
          source: {
            catalogVersion: 2,
            zip: catalogPet.zip,
            preview: catalogPet.preview,
          },
        }),
      });
    } catch (error) {
      await rm(candidate, { recursive: true, force: true });
      throw error;
    }
  });
}

export async function installPetFromZipFile(zipPath: string): Promise<OpenPetsStateV1> {
  return (await installPetFromZipFileWithResult(zipPath, true)).state;
}

export async function installPetFromZipFileWithResult(zipPath: string, allowShareReadme = false): Promise<LocalPetInstallResult> {
  // 保留参数以兼容原 IPC 调用，本地导入统一保留作者随包提供的附属文件。
  void allowShareReadme;
  return installLocalPetPackage(zipPath);
}

/** 显式制作转换副本；默认导入不会进入此路径，也不会改写原 Shimeji 工程。 */
export async function installShimejiPetFromFolderWithResult(folderPath: string): Promise<LocalPetInstallResult> {
  return installLocalPetPackage(folderPath, true);
}

async function installLocalPetPackage(sourcePath: string, convertShimeji = false): Promise<LocalPetInstallResult> {
  let files = await readLocalPackageFiles(sourcePath, { maxBytes: 200 * 1024 * 1024, maxFileBytes: maxIndividualFileBytes, maxFiles: 1000 });
  if (![...files.keys()].some((name) => basename(name) === "pet.json")) {
    if (!convertShimeji) throw new Error("此项目需要原宿主。请先检测兼容性并保留原项目；Shimeji 素材转换必须另行明确选择。");
    files = await convertShimejiPetPackage(files, basename(sourcePath).replace(/\.zip$/i, ""));
  }
  const imported = selectLocalPackageRoot(files, ["pet.json"]);
  if (imported.files.size > 1000 || [...imported.files.values()].reduce((total, bytes) => total + bytes.length, 0) > 200 * 1024 * 1024) throw new Error("归档或转换后的素材包超过 1000 文件或 200 MiB。");
  const manifestBytes = imported.files.get("pet.json")!;
  if (manifestBytes.length > maxCodexPetJsonBytes) throw new Error("pet.json 过大。");
  const parsed: unknown = JSON.parse(manifestBytes.toString("utf8"));
  const parsedId = isRecord(parsed) && typeof parsed.id === "string" ? parsed.id : basename(sourcePath);
  const metadata = validateInstalledPetMetadata(parsed, parsedId);
  assertSafePetId(metadata.id);
  const petsRoot = getPetsRoot();
  const candidate = await createPetInstallStagingCandidate(petsRoot);
  let transactionStarted = false;
  try {
    for (const [name, bytes] of imported.files) {
      const output = join(candidate, name);
      assertOutputPathInside(candidate, output);
      await mkdir(dirname(output), { recursive: true });
      await writeFile(output, name === "pet.json" ? `${JSON.stringify(metadata, null, 2)}\n` : bytes, { mode: 0o600, flag: "wx" });
    }
    await validateExtractedPet(candidate, true);
    transactionStarted = true;
    const state = await runPetInstallTransaction({
      petsRoot,
      petId: metadata.id,
      candidateDir: candidate,
      validateCandidate: async (directory) => { await validateExtractedPet(directory, true); },
      mutateState: () => upsertPetState({ id: metadata.id, displayName: metadata.displayName, description: metadata.description }),
    });
    return { state, petId: metadata.id, displayName: metadata.displayName };
  } catch (error) {
    if (!transactionStarted) {
      try {
        await discardPetInstallStagingCandidate(petsRoot, candidate);
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "ZIP 导入失败，暂存归属无法确认，未自动清理。");
      }
    }
    throw error;
  }
}

export async function installPetFromFolder(folderPath: string): Promise<OpenPetsStateV1> {
  return (await installPetFromFolderWithResult(folderPath)).state;
}

export async function installPetFromFolderWithResult(folderPath: string): Promise<LocalPetInstallResult> {
  return installLocalPetPackage(folderPath);
}

export async function removePet(petId: string): Promise<OpenPetsStateV1> {
  return withPetOperation(petId, async () => {
    if (petId === builtInPet.id) {
      throw new Error("Built-in pet cannot be removed.");
    }
    assertSafePetId(petId);
    const petsRoot = getPetsRoot();
    await assertNoUnresolvedPetInstallTransaction(petsRoot, petId);
    const dir = await getCanonicalInstalledPetDir(petsRoot, petId);
    const state = removePetState(petId);
    try {
      await rm(dir, { recursive: true, force: true });
    } catch (error) {
      throw new Error(`Pet was removed from OpenPets state, but local files could not be deleted from ${dir}. You may need to remove them manually. ${error instanceof Error ? error.message : ""}`.trim());
    }
    return state;
  });
}

export async function setDefaultInstalledPet(petId: string): Promise<OpenPetsStateV1> {
  if (petId === builtInPet.id) return setDefaultPet(petId);
  return withPetOperation(petId, async () => {
    assertSafePetId(petId);
    await assertNoUnresolvedPetInstallTransaction(getPetsRoot(), petId);
    return setDefaultPet(petId);
  });
}

export async function withPetOperation<T>(key: string, callback: () => Promise<T>): Promise<T> {
  return withPetInstallLock(key, callback);
}

async function downloadPetZip(zipUrl: string): Promise<Buffer> {
  validateZipUrl(zipUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), downloadTimeoutMs);

  try {
    const response = await fetch(zipUrl, {
      signal: controller.signal,
      redirect: "error",
      credentials: "omit",
    });

    validateZipUrl(response.url);
    if (response.url !== zipUrl) throw new Error("Zip download final URL changed.");
    if (!response.ok) throw new Error(`Zip download failed with HTTP ${response.status}.`);

    const buffer = await readLimitedResponse(response, maxZipDownloadBytes);
    validateZipMagic(buffer);
    return buffer;
  } finally {
    clearTimeout(timeout);
  }
}

function validateZipUrl(value: string): void {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Zip URL must use https.");
  if (url.hostname !== "zip.openpets.dev") throw new Error("Zip URL host is not allowed.");
  if (!url.pathname.startsWith("/pets/")) throw new Error("Zip URL path is not allowed.");
  if (url.username || url.password) throw new Error("Zip URL cannot include credentials.");
  if (url.port) throw new Error("Zip URL cannot include a custom port.");
}

async function readLimitedResponse(response: Response, maxBytes: number): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Zip response body is unavailable for bounded reading.");

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) throw new Error("Zip download is too large.");
    chunks.push(value);
  }

  return Buffer.concat(chunks, total);
}

function validateZipMagic(buffer: Buffer): void {
  if (!hasSupportedZipMagic(buffer)) {
    throw new Error("Downloaded file has an unsupported zip signature.");
  }
}

async function extractPetZip(zip: Buffer, tempDir: string, allowShareReadme = false): Promise<void> {
  const zipFile = await openZipFromBuffer(zip);
  const pathTracker = new ZipEntryPathTracker(allowShareReadme);
  const seenRequired = new Set<string>();
  let fileCount = 0;
  let extractedTotal = 0;

  try {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      let settled = false;

      const reject = (error: unknown): void => {
        if (settled) return;
        settled = true;
        zipFile.close();
        rejectPromise(error instanceof Error ? error : new Error("Zip extraction failed."));
      };

      zipFile.on("error", reject);
      zipFile.on("end", () => {
        if (settled) return;
        settled = true;
        resolvePromise();
      });

      zipFile.on("entry", (entry) => {
        void processEntry(entry).then(() => {
          if (!settled) zipFile.readEntry();
        }).catch(reject);
      });

      const processEntry = async (entry: Entry): Promise<void> => {
        validateEntryMetadata(entry);
        const safePath = pathTracker.accept(entry.fileName);

        if (safePath.isDirectory) {
          return;
        }

        if (!safePath.relativeOutputPath) {
          throw new Error("Zip file entry is missing an output path.");
        }

        fileCount += 1;
        if (fileCount > maxFiles) throw new Error("Zip contains too many files.");
        if (safePath.relativeOutputPath === "pet.json" && entry.uncompressedSize > maxCodexPetJsonBytes) throw new Error("pet.json is too large.");
        if (entry.uncompressedSize > maxIndividualFileBytes) throw new Error("Zip entry is too large.");
        extractedTotal += entry.uncompressedSize;
        if (extractedTotal > maxExtractedTotalBytes) throw new Error("Zip extracted total is too large.");

        if (safePath.relativeOutputPath === "SHARE.md") {
          if (entry.uncompressedSize > maxPetShareReadmeBytes) throw new Error("SHARE.md 超过 16 KiB。");
          await readShareReadme(entry, zipFile);
          return;
        }

        const outputPath = resolve(tempDir, safePath.relativeOutputPath);
        assertOutputPathInside(tempDir, outputPath);
        seenRequired.add(safePath.relativeOutputPath);
        await writeEntry(entry, zipFile, outputPath, entry.uncompressedSize, safePath.relativeOutputPath === "pet.json" ? maxCodexPetJsonBytes : maxIndividualFileBytes);
      };

      zipFile.readEntry();
    });
  } finally {
    zipFile.close();
  }

  if (!seenRequired.has("pet.json")) {
    throw new Error("素材 ZIP 必须包含 pet.json。");
  }
}

/** 分享说明只消费并检查大小，不进入整体移动的安装候选目录。 */
async function readShareReadme(entry: Entry, zipFile: ZipFile): Promise<void> {
  const source = await new Promise<NodeJS.ReadableStream>((complete, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) reject(error ?? new Error("无法读取 SHARE.md。"));
      else complete(stream);
    });
  });
  let actualBytes = 0;
  await pipeline(source, new Writable({
    write(chunk: Buffer, _encoding, callback) {
      actualBytes += chunk.byteLength;
      callback(actualBytes > maxPetShareReadmeBytes ? new Error("SHARE.md 实际内容超过 16 KiB。") : null);
    },
  }));
  if (actualBytes !== entry.uncompressedSize) throw new Error("SHARE.md 实际大小与归档记录不一致。");
}

function openZipFromBuffer(buffer: Buffer): Promise<ZipFile> {
  return new Promise((resolvePromise, rejectPromise) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true, strictFileNames: true }, (error, zipFile) => {
      if (error) {
        rejectPromise(error);
        return;
      }

      if (!zipFile) {
        rejectPromise(new Error("Zip file could not be opened."));
        return;
      }

      resolvePromise(zipFile);
    });
  });
}

function validateEntryMetadata(entry: Entry): void {
  if (entry.isEncrypted()) throw new Error("Encrypted zip entries are not supported.");
  if (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) {
    throw new Error("Unsupported zip entry compression method.");
  }
  if (entry.compressedSize > maxZipDownloadBytes) throw new Error("Zip entry compressed size is too large.");
  if (entry.uncompressedSize > maxIndividualFileBytes) throw new Error("Zip entry uncompressed size is too large.");

  const unixMode = getUnixMode(entry);
  if (unixMode === null) return;

  const type = unixMode & 0o170000;
  const isKnownFileType = type !== 0;
  const isRegularFile = type === 0o100000;
  const isDirectory = type === 0o040000;
  if (isKnownFileType && !isRegularFile && !isDirectory) {
    throw new Error("Zip entry special files are not supported.");
  }
}

function getUnixMode(entry: Entry): number | null {
  if ((entry.versionMadeBy >> 8) !== 3) {
    return null;
  }

  return (entry.externalFileAttributes >> 16) & 0o177777;
}

function writeEntry(entry: Entry, zipFile: ZipFile, outputPath: string, expectedBytes: number, maxBytes: number): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    zipFile.openReadStream(entry, (error, readStream) => {
      if (error) {
        rejectPromise(error);
        return;
      }

      if (!readStream) {
        rejectPromise(new Error("Zip entry stream could not be opened."));
        return;
      }

      let actualBytes = 0;
      const counter = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          actualBytes += chunk.byteLength;
          if (actualBytes > maxBytes) {
            callback(new Error("Zip entry exceeded individual size limit."));
            return;
          }
          callback(null, chunk);
        },
      });

      pipeline(readStream, counter, createWriteStream(outputPath, { mode: 0o600 }))
        .then(() => {
          if (actualBytes !== expectedBytes) {
            rejectPromise(new Error("Zip entry extracted size did not match metadata."));
            return;
          }

          resolvePromise();
        })
        .catch(rejectPromise);
    });
  });
}

async function validateExtractedPet(tempDir: string, preserveAttachments = false): Promise<InstalledPetMetadata> {
  const petJsonPath = join(tempDir, "pet.json");
  assertOutputPathInside(tempDir, petJsonPath);

  const parsed = JSON.parse((await readBoundedRegularFile(petJsonPath, maxCodexPetJsonBytes, "pet.json")).toString("utf8")) as unknown;
  const parsedId = isRecord(parsed) && typeof parsed.id === "string" ? parsed.id : basename(tempDir);
  const metadata = validateInstalledPetMetadata(parsed, parsedId);
  assertSafePetId(metadata.id);
  if (!preserveAttachments) await assertPetPackageFileWhitelist(tempDir, metadata);
  await readPetPackageAssets(tempDir, metadata);
  return metadata;
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
