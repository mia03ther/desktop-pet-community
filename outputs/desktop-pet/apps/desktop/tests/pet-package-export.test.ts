import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, symlink, truncate, writeFile } from "node:fs/promises";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import sharp from "sharp";
import yauzl from "yauzl";
import yazl from "yazl";
import type { Readable } from "node:stream";

import { maxCodexSpritesheetBytes, validateCodexPetMetadata, validateCodexPetSpritesheet } from "../src/codex-pets-core.js";
import { maxPetShareArchiveBytes, maxPetShareReadmeBytes, type PetPackageExportOptions } from "../src/pet-sharing-contract.js";
import { petMediaActions } from "../src/pet-media-contract.js";
import { readLocalPackageFiles } from "../src/local-package-files.js";
import { packageImportLimits } from "../src/package-import-limits.js";

const fixture = await realpath(await mkdtemp(join(tmpdir(), "openpets-share-test-")));
const source = join(fixture, "source");
const parent = join(fixture, "selected");
const petsRoot = join(fixture, "pets");
const statePath = join(fixture, "fixture-state.json");
await Promise.all([source, parent, petsRoot].map((directory) => mkdir(directory, { mode: 0o700 })));
await writeFile(statePath, JSON.stringify({ pets: { installed: [] } }));

// 保留真实文件、校验和安装事务；只替代 Electron 档案入口，并在真实写入后注入故障。
const stateMock = `data:text/javascript,${encodeURIComponent(`
  import { readFileSync, writeFileSync } from "node:fs";
  const path = ${JSON.stringify(statePath)};
  let beforeInstall;
  let afterInstall;
  export function setBeforeInstall(callback) { beforeInstall = callback; }
  export function setAfterInstall(callback) { afterInstall = callback; }
  export const getAppStateSnapshot = () => JSON.parse(readFileSync(path, "utf8"));
  export function upsertPetState(pet) {
    const state = getAppStateSnapshot();
    state.pets.installed = state.pets.installed.filter((entry) => entry.id !== pet.id);
    state.pets.installed.push({ ...pet, installed: true, builtIn: false, protected: false });
    writeFileSync(path, JSON.stringify(state));
    return state;
  }
  export function installPetState(pet) {
    beforeInstall?.(pet);
    if (getAppStateSnapshot().pets.installed.some((entry) => entry.id === pet.id)) throw new Error("测试档案已有相同编号");
    const state = upsertPetState(pet);
    afterInstall?.(state);
    return state;
  }
  export function removePetState(petId) {
    const state = getAppStateSnapshot();
    state.pets.installed = state.pets.installed.filter((entry) => entry.id !== petId);
    writeFileSync(path, JSON.stringify(state));
    return state;
  }
  export const setDefaultPet = () => getAppStateSnapshot();
`)}`;
const pathOwnerUrl = new URL("../src/pet-paths.js?original", import.meta.url).href;
const pathsMock = `data:text/javascript,${encodeURIComponent(`
  export { assertInsideRoot, assertSafePetId } from ${JSON.stringify(pathOwnerUrl)};
  export const getPetsRoot = () => ${JSON.stringify(petsRoot)};
`)}`;
const catalogMock = `data:text/javascript,${encodeURIComponent(`
  export async function getCatalogPet() { throw new Error("本测试禁止请求目录服务"); }
`)}`;
const filesystemMock = `data:text/javascript,${encodeURIComponent(`
  export * from "node:fs/promises";
  import { writeFile as actualWriteFile } from "node:fs/promises";
  let afterWrite;
  export function setAfterWrite(callback) { afterWrite = callback; }
  export async function writeFile(...args) {
    await actualWriteFile(...args);
    await afterWrite?.(args[0]);
  }
`)}`;
const archiveFilesystemMock = `data:text/javascript,${encodeURIComponent(`
  export * from "node:fs";
  import { createWriteStream as actualCreateWriteStream } from "node:fs";
  let afterArchiveOpen;
  export function setAfterArchiveOpen(callback) { afterArchiveOpen = callback; }
  export function createWriteStream(...args) {
    const stream = actualCreateWriteStream(...args);
    stream.once("open", () => afterArchiveOpen?.(stream));
    return stream;
  }
`)}`;
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith("/pet-installation.js")) {
      const substitutes = {
        "./app-state.js": ${JSON.stringify(stateMock)},
        "./pet-paths.js": ${JSON.stringify(pathsMock)},
        "./catalog.js": ${JSON.stringify(catalogMock)},
      };
      if (substitutes[specifier]) return { url: substitutes[specifier], shortCircuit: true };
    }
    if (specifier === "node:fs/promises" && ["/pet-package-export.js", "/pet-installation.js", "/pet-install-transaction.js"].some((owner) => context.parentURL?.endsWith(owner))) {
      return { url: ${JSON.stringify(filesystemMock)}, shortCircuit: true };
    }
    if (specifier === "node:fs" && context.parentURL?.endsWith("/pet-package-export.js")) {
      return { url: ${JSON.stringify(archiveFilesystemMock)}, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);

const { setAfterWrite } = await import(filesystemMock) as { setAfterWrite(callback: ((path: string) => void | Promise<void>) | undefined): void };
const { setAfterArchiveOpen } = await import(archiveFilesystemMock) as {
  setAfterArchiveOpen(callback: ((stream: import("node:fs").WriteStream) => void) | undefined): void;
};
const { setBeforeInstall, setAfterInstall } = await import(stateMock) as {
  setBeforeInstall(callback: (() => void) | undefined): void;
  setAfterInstall(callback: (() => void) | undefined): void;
};
const { exportPetPackageFromDirectory } = await import("../src/pet-package-export.js");
const { exportInstalledPetPackage, installPetFromFolderWithResult, installPetFromZipFileWithResult, installShimejiPetFromFolderWithResult, installPetFromSpritesheetFileWithResult, preparePersonalPetSpritesheet, removePet } = await import("../src/pet-installation.js");
const { withPetInstallLock } = await import("../src/pet-install-transaction.js");

const metadata = { id: "share-cat", displayName: "分享猫", description: "临时测试宠物", spritesheetPath: "spritesheet.webp", spriteVersionNumber: 2 } as const;
const atlas = await sharp({ create: { width: 1536, height: 2288, channels: 4, background: { r: 20, g: 40, b: 60, alpha: 0 } } }).webp().toBuffer();
const importedMetadata = { ...metadata, author: "素材作者", extensions: { category: "猫咪" } };
await writeFile(join(source, "pet.json"), JSON.stringify(importedMetadata));
await writeFile(join(source, "spritesheet.webp"), atlas);
await writeFile(join(source, "LICENSE.txt"), "素材作者的许可文件");
const existing = join(parent, "share-cat-share-existing");
await mkdir(existing);
await writeFile(join(existing, "keep.txt"), "已有文件保持原样");

async function parentEntries(): Promise<string[]> {
  return (await readdir(parent)).sort();
}

async function replaceFixtureState(entry: Record<string, unknown> | undefined): Promise<void> {
  await writeFile(statePath, JSON.stringify({ pets: { installed: entry ? [entry] : [] } }));
}

try {
  // 导出包可经现有文件夹导入和真实安装事务恢复相同素材。
  await installPetFromFolderWithResult(source);
  const first = await exportInstalledPetPackage(metadata.id, parent);
  const second = await exportInstalledPetPackage(metadata.id, parent);
  assert.notEqual(first.directoryPath, second.directoryPath);
  assert.equal(first.displayName, metadata.displayName);
  assert.deepEqual((await readdir(first.directoryPath)).sort(), ["LICENSE.txt", "SHARE.md", "pet.json", "spritesheet.webp"]);
  const exportedMetadata = JSON.parse(await readFile(join(first.directoryPath, "pet.json"), "utf8")) as unknown;
  assert.deepEqual(exportedMetadata, importedMetadata);
  assert.equal(await readFile(join(first.directoryPath, "LICENSE.txt"), "utf8"), "素材作者的许可文件");
  assert.deepEqual(await readFile(join(first.directoryPath, "spritesheet.webp")), atlas);
  assert.deepEqual(validateCodexPetMetadata(exportedMetadata, metadata.id), metadata);
  await validateCodexPetSpritesheet(await readFile(join(first.directoryPath, "spritesheet.webp")), metadata);
  const instructions = await readFile(join(first.directoryPath, "SHARE.md"), "utf8");
  assert.ok(instructions.includes("待核实"));
  assert.ok(!instructions.includes(source));
  assert.ok(!instructions.includes("测试私密值"));
  await removePet(metadata.id);
  await installPetFromFolderWithResult(first.directoryPath);
  assert.deepEqual(await readFile(join(petsRoot, metadata.id, "spritesheet.webp")), atlas);
  assert.deepEqual(JSON.parse(await readFile(join(petsRoot, metadata.id, "pet.json"), "utf8")), importedMetadata);
  assert.deepEqual((await readdir(join(petsRoot, metadata.id))).sort(), ["LICENSE.txt", "SHARE.md", "pet.json", "spritesheet.webp"]);
  assert.equal(await readFile(join(existing, "keep.txt"), "utf8"), "已有文件保持原样");
  await rm(first.directoryPath, { recursive: true });
  await rm(second.directoryPath, { recursive: true });

  // ZIP 保留原始许可、扩展字段及原说明；再次分享的新说明不覆盖旧文件。
  const sourceBeforeZip = await Promise.all(["pet.json", "spritesheet.webp"].map((name) => readFile(join(source, name))));
  const options = { format: "zip", author: "# 作者 <img> & [姓名]", source: "https://example.test/pet", license: "CC BY 4.0" } as const;
  const zipped = await exportInstalledPetPackage(metadata.id, parent, undefined, options);
  assert.ok(zipped.archivePath);
  assert.deepEqual(await readdir(zipped.directoryPath), [`${metadata.id}.zip`]);
  const entries = await readZip(await readFile(zipped.archivePath));
  assert.deepEqual([...entries.keys()].sort(), ["DESKTOP-PET-SHARE-1.md", "LICENSE.txt", "SHARE.md", "pet.json", "spritesheet.webp"]);
  assert.deepEqual(JSON.parse(entries.get("pet.json")!.toString("utf8")), importedMetadata);
  assert.deepEqual(entries.get("spritesheet.webp"), atlas);
  const zipReadme = entries.get("DESKTOP-PET-SHARE-1.md")!.toString("utf8");
  assert.ok(zipReadme.includes("ZIP 方式"));
  assert.ok(zipReadme.includes("填写者声明，应用未验证"));
  assert.ok(zipReadme.includes("作者：\\# 作者 &lt;img&gt; &amp; \\[姓名\\]"));
  assert.ok(!zipReadme.includes("<img>"));
  assert.ok(!zipReadme.includes("测试私密值"));
  // 本地 IPC/CLI 与控制中心都允许包含附属文件的完整素材包。
  await installPetFromZipFileWithResult(zipped.archivePath!);
  assert.deepEqual((await readdir(petsRoot)).sort(), [metadata.id]);
  assert.deepEqual(await readFile(join(petsRoot, metadata.id, "spritesheet.webp")), atlas);
  await removePet(metadata.id);
  await installPetFromZipFileWithResult(zipped.archivePath, true);
  assert.deepEqual((await readdir(join(petsRoot, metadata.id))).sort(), ["DESKTOP-PET-SHARE-1.md", "LICENSE.txt", "SHARE.md", "pet.json", "spritesheet.webp"]);
  assert.deepEqual(await readFile(join(petsRoot, metadata.id, "spritesheet.webp")), atlas);
  assert.deepEqual(JSON.parse(await readFile(join(petsRoot, metadata.id, "pet.json"), "utf8")), importedMetadata);
  assert.deepEqual(await Promise.all(["pet.json", "spritesheet.webp"].map((name) => readFile(join(source, name)))), sourceBeforeZip);
  await rm(zipped.directoryPath, { recursive: true });
  const filledFolder = await exportInstalledPetPackage(metadata.id, parent, undefined, { ...options, format: "folder", author: " " });
  const folderReadme = await readFile(join(filledFolder.directoryPath, "DESKTOP-PET-SHARE-2.md"), "utf8");
  assert.ok(folderReadme.includes("文件夹方式"));
  assert.ok(folderReadme.includes("作者：待核实。"));
  assert.equal(filledFolder.archivePath, undefined);
  await rm(filledFolder.directoryPath, { recursive: true });

  // 主进程所有者也验证分享选项，超长、控制字符和未知字段不得产生目录。
  for (const invalid of [
    { format: "zip", account: "不支持" }, { format: "exe" },
    { format: "zip", author: "a".repeat(121) }, { format: "zip", license: "新行\n标题" },
  ]) {
    await assert.rejects(() => exportInstalledPetPackage(metadata.id, parent, undefined, invalid as PetPackageExportOptions));
  }
  assert.deepEqual(await parentEntries(), [basename(existing)]);

  // 本地 ZIP 保留说明和附属代码为普通文件；重复路径和损坏容器不能替换原有宠物。
  const localZip = join(fixture, "本地 测试.zip");
  const petEntries = [{ name: "pet.json", data: Buffer.from(JSON.stringify(metadata)) }, { name: "spritesheet.webp", data: atlas }];
  await writeFile(localZip, await createZip(petEntries));
  await installPetFromZipFileWithResult(localZip);
  await writeFile(localZip, await createZip([...petEntries, { name: "SHARE.md", data: Buffer.alloc(maxPetShareReadmeBytes, 65) }]));
  await installPetFromZipFileWithResult(localZip, true);
  assert.deepEqual((await readdir(join(petsRoot, metadata.id))).sort(), ["SHARE.md", "pet.json", "spritesheet.webp"]);
  await writeFile(localZip, await createZip([...petEntries, { name: "extra.js", data: Buffer.from("仅归档，不执行") }]));
  await installPetFromZipFileWithResult(localZip, true);
  assert.equal(await readFile(join(petsRoot, metadata.id, "extra.js"), "utf8"), "仅归档，不执行");
  for (const invalidEntries of [
    [...petEntries, { name: "SHARE.md", data: Buffer.from("说明") }, { name: "SHARE.md", data: Buffer.from("重复") }],
  ]) {
    await writeFile(localZip, await createZip(invalidEntries));
    await assert.rejects(() => installPetFromZipFileWithResult(localZip, true));
    assert.deepEqual(await readFile(join(petsRoot, metadata.id, "spritesheet.webp")), atlas);
    assert.deepEqual((await readdir(petsRoot)).sort(), [metadata.id]);
  }
  const malformedReadme = await createZip([...petEntries, { name: "SHARE.md", data: Buffer.alloc(maxPetShareReadmeBytes + 1, 65), compress: true }]);
  patchCentralEntry(malformedReadme, "SHARE.md", (entry) => entry.writeUInt32LE(maxPetShareReadmeBytes, 24));
  const encryptedReadme = await createZip([...petEntries, { name: "SHARE.md", data: Buffer.from("加密说明") }]);
  patchCentralEntry(encryptedReadme, "SHARE.md", (entry) => entry.writeUInt16LE(entry.readUInt16LE(8) | 1, 8));
  const linkReadme = await createZip([...petEntries, { name: "SHARE.md", data: Buffer.from("链接说明") }]);
  patchCentralEntry(linkReadme, "SHARE.md", (entry) => {
    entry[5] = 3;
    entry.writeUInt32LE((0o120777 * 0x10000) >>> 0, 38);
  });
  for (const invalidZip of [malformedReadme, encryptedReadme, linkReadme]) {
    await writeFile(localZip, invalidZip);
    await assert.rejects(() => installPetFromZipFileWithResult(localZip, true));
    assert.deepEqual(await readFile(join(petsRoot, metadata.id, "spritesheet.webp")), atlas);
    assert.deepEqual((await readdir(petsRoot)).sort(), [metadata.id]);
  }
  await truncate(localZip, maxPetShareArchiveBytes + 1);
  await assert.rejects(() => installPetFromZipFileWithResult(localZip));

  // 写入真实 ZIP 文件后取消或磁盘错误，等待关闭后清除自己的新目录。
  const archiveController = new AbortController();
  setAfterArchiveOpen(() => archiveController.abort());
  await assert.rejects(() => exportInstalledPetPackage(metadata.id, parent, archiveController.signal, { format: "zip" }));
  setAfterArchiveOpen((stream) => stream.destroy(new Error("模拟 ZIP 写入失败")));
  await assert.rejects(() => exportInstalledPetPackage(metadata.id, parent, undefined, { format: "zip" }));
  setAfterArchiveOpen(undefined);
  assert.deepEqual(await parentEntries(), [basename(existing)]);
  assert.equal(await readFile(join(existing, "keep.txt"), "utf8"), "已有文件保持原样");

  // 图集使用专用上限；扩大完整包容量不会放宽图集限制，也不修改原件。
  await truncate(join(source, "spritesheet.webp"), maxCodexSpritesheetBytes + 1);
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent, undefined, { format: "zip" }));
  assert.equal((await stat(join(source, "spritesheet.webp"))).size, maxCodexSpritesheetBytes + 1);
  await writeFile(join(source, "spritesheet.webp"), atlas);
  assert.deepEqual(await parentEntries(), [basename(existing)]);

  // 真实 ZIP 导出覆盖旧总包 200 MiB、单附件 100 MiB 边界；回读使用统一容量规则。
  const attachment = Buffer.alloc(104 * 1024 * 1024, 93);
  const expectedAttachmentHash = createHash("sha256").update(attachment).digest("hex");
  await writeFile(join(source, "large-first.dat"), attachment);
  await writeFile(join(source, "large-second.dat"), attachment);
  const expandedExport = await exportPetPackageFromDirectory(source, metadata.id, parent, undefined, { format: "zip" });
  assert.ok(expandedExport.archivePath);
  assert.ok((await stat(expandedExport.archivePath)).size > 200 * 1024 * 1024);
  const expandedFiles = await readLocalPackageFiles(expandedExport.archivePath, packageImportLimits);
  for (const name of ["large-first.dat", "large-second.dat"]) {
    assert.equal(expandedFiles.get(name)?.byteLength, attachment.byteLength);
    assert.equal(createHash("sha256").update(expandedFiles.get(name)!).digest("hex"), expectedAttachmentHash);
  }
  await rm(expandedExport.directoryPath, { recursive: true });
  await rm(join(source, "large-second.dat"));
  await truncate(join(source, "large-first.dat"), packageImportLimits.maxFileBytes + 1);
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent, undefined, { format: "zip" }));
  assert.equal((await stat(join(source, "large-first.dat"))).size, packageImportLimits.maxFileBytes + 1);
  await rm(join(source, "large-first.dat"));
  assert.deepEqual(await parentEntries(), [basename(existing)]);

  // 内置、团队、损坏或未安装项不能通过导出入口分享。
  const validEntry = { id: metadata.id, displayName: metadata.displayName, builtIn: false, protected: false, installed: true };
  for (const entry of [undefined, { ...validEntry, builtIn: true }, { ...validEntry, installed: false }, { ...validEntry, broken: true }, { ...validEntry, source: { kind: "team" } }]) {
    await replaceFixtureState(entry);
    await assert.rejects(() => exportInstalledPetPackage(metadata.id, parent));
    assert.deepEqual(await parentEntries(), [basename(existing)]);
  }
  await assert.rejects(() => exportInstalledPetPackage("builtin", parent));
  for (const sourceKind of [undefined, { kind: "catalog" }, { kind: "codex", path: join(fixture, "从不读取的原始目录") }]) {
    await replaceFixtureState({ ...validEntry, ...(sourceKind ? { source: sourceKind } : {}) });
    const result = await exportInstalledPetPackage(metadata.id, parent);
    await rm(result.directoryPath, { recursive: true });
  }

  // 等待安装锁期间取消，不能在锁释放后创建迟到分享。
  let releaseLock!: () => void;
  let lockEntered!: () => void;
  const entered = new Promise<void>((complete) => { lockEntered = complete; });
  const held = withPetInstallLock(metadata.id, async () => {
    lockEntered();
    await new Promise<void>((complete) => { releaseLock = complete; });
  });
  await entered;
  const waitingController = new AbortController();
  const waiting = exportInstalledPetPackage(metadata.id, parent, waitingController.signal);
  waitingController.abort();
  releaseLock();
  await held;
  await assert.rejects(waiting);
  assert.deepEqual(await parentEntries(), [basename(existing)]);

  // 内容校验先于创建目录，不合法 ID、图像和超限文件不留下分享。
  await assert.rejects(() => exportPetPackageFromDirectory(source, "different-id", parent));
  await writeFile(join(source, "spritesheet.webp"), "损坏图片");
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent));
  await writeFile(join(source, "spritesheet.webp"), atlas);
  await truncate(join(source, "spritesheet.webp"), maxCodexSpritesheetBytes + 1);
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent));
  await writeFile(join(source, "spritesheet.webp"), atlas);
  assert.deepEqual(await parentEntries(), [basename(existing)]);

  const legacy = { ...metadata, spriteVersionNumber: undefined };
  await writeFile(join(source, "pet.json"), JSON.stringify(legacy));
  await writeFile(join(source, "spritesheet.webp"), "旧版本也不导出损坏图片");
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent));
  await writeFile(join(source, "spritesheet.webp"), atlas);
  const legacyResult = await exportPetPackageFromDirectory(source, metadata.id, parent);
  assert.equal(Object.hasOwn(JSON.parse(await readFile(join(legacyResult.directoryPath, "pet.json"), "utf8")), "spriteVersionNumber"), false);
  await rm(legacyResult.directoryPath, { recursive: true });
  await writeFile(join(source, "pet.json"), JSON.stringify(metadata));

  // 原附件名称大小写不能和宿主新增的分享说明冲突，文件夹与 ZIP 均可再次导入。
  await writeFile(join(source, "share.md"), "保持小写原始说明");
  for (const format of ["folder", "zip"] as const) {
    const result = await exportPetPackageFromDirectory(source, metadata.id, parent, undefined, { format });
    const files = await readLocalPackageFiles(result.archivePath ?? result.directoryPath, packageImportLimits);
    assert.equal(files.get("share.md")?.toString(), "保持小写原始说明");
    assert.ok(files.has("DESKTOP-PET-SHARE-1.md"));
    await rm(result.directoryPath, { recursive: true });
  }
  await rm(join(source, "share.md"));

  const sourceLink = join(fixture, "source-link");
  const parentLink = join(fixture, "parent-link");
  await symlink(source, sourceLink, process.platform === "win32" ? "junction" : "dir");
  await symlink(parent, parentLink, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(() => exportPetPackageFromDirectory(sourceLink, metadata.id, parent));
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parentLink));
  assert.deepEqual(await parentEntries(), [basename(existing)]);

  // 在已经真实写入第一份文件后取消或报错，清理自己的新目录并保留已有内容。
  const preCancelled = new AbortController();
  preCancelled.abort();
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent, preCancelled.signal));
  const controller = new AbortController();
  setAfterWrite((path) => {
    if (basename(path) === "pet.json") controller.abort();
  });
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent, controller.signal));
  setAfterWrite(undefined);
  assert.deepEqual(await parentEntries(), [basename(existing)]);
  setAfterWrite((path) => {
    if (basename(path) === "pet.json") throw new Error("模拟写入完成后设备报错");
  });
  await assert.rejects(() => exportPetPackageFromDirectory(source, metadata.id, parent));
  setAfterWrite(undefined);
  assert.deepEqual(await parentEntries(), [basename(existing)]);
  assert.equal(await readFile(join(existing, "keep.txt"), "utf8"), "已有文件保持原样");

  // 制作从已有图集开始；很少的可见像素也有效，不套用未经约定的比例门槛。
  await replaceFixtureState(undefined);
  await rm(join(petsRoot, metadata.id), { recursive: true });
  const imagePath = join(fixture, "selected.webp");
  const patch = await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 240, g: 90, b: 60, alpha: 1 } } }).png().toBuffer();
  const visibleAtlas = await sharp({ create: { width: 1536, height: 2288, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: patch, left: 192, top: 208 }]).webp({ lossless: true }).toBuffer();
  await writeFile(imagePath, visibleAtlas);
  const prepared = await preparePersonalPetSpritesheet(imagePath);
  assert.equal(prepared.path, imagePath);
  assert.equal(prepared.sha256, createHash("sha256").update(visibleAtlas).digest("hex"));
  assert.equal(prepared.spriteLayout.version, 2);
  assert.ok(prepared.previewDataUrl.startsWith("data:image/webp;base64,"));
  const preview = await sharp(Buffer.from(prepared.previewDataUrl.split(",")[1]!, "base64")).metadata();
  assert.equal(preview.width, 768);
  assert.equal(preview.height, 1144);
  assert.deepEqual(await readFile(imagePath), visibleAtlas, "预览不得改动原图集");
  assert.deepEqual(await readdir(petsRoot), []);
  const input = { id: "created-cat", displayName: "自制猫", description: "自己提供的图集", sourcePath: imagePath, account: "不写进素材", spriteVersionNumber: 1 };
  const created = await installPetFromSpritesheetFileWithResult(imagePath, input, { expectedSha256: prepared.sha256 });
  assert.equal(created.petId, input.id);
  assert.deepEqual(JSON.parse(await readFile(join(petsRoot, input.id, "pet.json"), "utf8")), {
    id: input.id, displayName: input.displayName, description: input.description, spritesheetPath: "spritesheet.webp", spriteVersionNumber: 2,
  });
  assert.deepEqual(await readFile(join(petsRoot, input.id, "spritesheet.webp")), visibleAtlas);

  // 独立动画 WebP 沿同一安装事务和 ZIP 分享边界真实往返。
  const mediaSource = join(fixture, "media-source");
  await mkdir(mediaSource);
  const mediaMetadata = { id: "animated-cat", displayName: "动画媒体猫", description: "测试动画媒体", mediaVersion: 1, actions: Object.fromEntries(petMediaActions.map((action) => [action, "idle.webp"])), background: { mode: "alpha" } };
  const mediaRaw = Buffer.alloc(192 * 416 * 4);
  mediaRaw[10000] = 255;
  mediaRaw[10003] = 255;
  mediaRaw[192 * 208 * 4 + 10002] = 255;
  mediaRaw[192 * 208 * 4 + 10003] = 255;
  const mediaWebp = await sharp(mediaRaw, { raw: { width: 192, height: 416, channels: 4, pageHeight: 208 } }).webp({ delay: [200, 200], loop: 0 }).toBuffer();
  await writeFile(join(mediaSource, "pet.json"), JSON.stringify(mediaMetadata));
  await writeFile(join(mediaSource, "idle.webp"), mediaWebp);
  await installPetFromFolderWithResult(mediaSource);
  const mediaExport = await exportInstalledPetPackage(mediaMetadata.id, parent, undefined, { format: "zip" });
  assert.ok(mediaExport.archivePath);
  await removePet(mediaMetadata.id);
  await installPetFromZipFileWithResult(mediaExport.archivePath, true);
  assert.deepEqual(await readFile(join(petsRoot, mediaMetadata.id, "idle.webp")), mediaWebp);
  assert.equal(JSON.parse(await readFile(join(petsRoot, mediaMetadata.id, "pet.json"), "utf8")).mediaVersion, 1);
  const malformedMediaZip = join(fixture, "malformed-media.zip");
  await writeFile(malformedMediaZip, await createZip([{ name: "pet.json", data: Buffer.from(JSON.stringify({ ...mediaMetadata, id: "broken-media", actions: { ...mediaMetadata.actions, dance: "broken.mp4" }, background: { mode: "chroma", color: "#00ff00" } })) }, { name: "idle.webp", data: mediaWebp }, { name: "broken.mp4", data: Buffer.from("not a movie") }]));
  await assert.rejects(() => installPetFromZipFileWithResult(malformedMediaZip, true));
  assert.equal(JSON.parse(await readFile(statePath, "utf8")).pets.installed.some((pet: { id: string }) => pet.id === "broken-media"), false);
  await removePet(mediaMetadata.id);
  const createdShare = await exportInstalledPetPackage(input.id, parent);
  await removePet(input.id);
  await installPetFromFolderWithResult(createdShare.directoryPath);
  assert.deepEqual(await readFile(join(petsRoot, input.id, "spritesheet.webp")), visibleAtlas);
  await removePet(input.id);
  await rm(createdShare.directoryPath, { recursive: true });

  // 选择后修改文件，即使新文件仍是有效图集，也必须重新选择。
  const changed = await sharp({ create: { width: 1536, height: 2288, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: patch, left: 384, top: 416 }]).webp({ lossless: true }).toBuffer();
  await writeFile(imagePath, changed);
  await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input, { expectedSha256: prepared.sha256 }));
  await writeFile(imagePath, visibleAtlas);
  assert.deepEqual(await readdir(petsRoot), []);

  for (const invalidInput of [
    { ...input, id: "builtin" }, { ...input, id: "bad/id" }, { ...input, id: "a".repeat(65) },
    { ...input, displayName: "" }, { ...input, displayName: "a".repeat(81) },
    { ...input, description: " " }, { ...input, description: "a".repeat(501) },
  ]) {
    await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, invalidInput));
  }
  assert.deepEqual(await readdir(petsRoot), []);
  const partlyOpaqueAtlas = await sharp({ create: { width: 1536, height: 2288, channels: 4, background: { r: 20, g: 40, b: 60, alpha: 0.5 } } }).webp({ lossless: true }).toBuffer();
  const wrongSize = await sharp({ create: { width: 1536, height: 2080, channels: 4, background: { r: 20, g: 40, b: 60, alpha: 0 } } }).webp().toBuffer();
  const wrongFormat = await sharp(visibleAtlas).png().toBuffer();
  for (const invalidImage of [atlas, partlyOpaqueAtlas, wrongSize, wrongFormat, Buffer.from("不可解码")]) {
    await writeFile(imagePath, invalidImage);
    await assert.rejects(() => preparePersonalPetSpritesheet(imagePath));
    await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input));
    assert.deepEqual(await readdir(petsRoot), []);
  }
  await writeFile(imagePath, visibleAtlas);
  await truncate(imagePath, maxCodexSpritesheetBytes + 1);
  await assert.rejects(() => preparePersonalPetSpritesheet(imagePath));
  await writeFile(imagePath, visibleAtlas);
  const imageDirectoryLink = join(fixture, "image-directory-link");
  await symlink(source, imageDirectoryLink, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(() => preparePersonalPetSpritesheet(join(imageDirectoryLink, "spritesheet.webp")));

  // 档案有同 ID 或磁盘有未登记素材，都不能进入替换路径。
  for (const entry of [
    { ...validEntry, id: input.id }, { ...validEntry, id: input.id, broken: true },
    { ...validEntry, id: input.id, source: { kind: "team" } },
  ]) {
    await replaceFixtureState(entry);
    await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input));
    assert.deepEqual(await readdir(petsRoot), []);
  }
  await replaceFixtureState(undefined);
  const unrecorded = join(petsRoot, input.id);
  await mkdir(unrecorded, { mode: 0o700 });
  await writeFile(join(unrecorded, "original.webp"), "已有素材不可替换");
  await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input));
  assert.equal(await readFile(join(unrecorded, "original.webp"), "utf8"), "已有素材不可替换");
  assert.deepEqual(await readdir(petsRoot), [input.id]);
  await rm(unrecorded, { recursive: true });

  // 等待锁、首次写入后、同步档案写入之前取消，均无档案或候选残留。
  let releaseMakerLock!: () => void;
  let makerLockEntered!: () => void;
  const makerEntered = new Promise<void>((complete) => { makerLockEntered = complete; });
  const makerHeld = withPetInstallLock(input.id, async () => {
    makerLockEntered();
    await new Promise<void>((complete) => { releaseMakerLock = complete; });
  });
  await makerEntered;
  const waitingMakerController = new AbortController();
  const waitingMaker = installPetFromSpritesheetFileWithResult(imagePath, input, { signal: waitingMakerController.signal });
  waitingMakerController.abort();
  releaseMakerLock();
  await makerHeld;
  await assert.rejects(waitingMaker);
  const writeController = new AbortController();
  setAfterWrite((path) => {
    if (basename(path) === "spritesheet.webp") writeController.abort();
  });
  await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input, { signal: writeController.signal }));
  setAfterWrite(undefined);
  assert.deepEqual(await readdir(petsRoot), []);
  const commitController = new AbortController();
  setAfterWrite(async (path) => {
    if (path.includes("journal.json.tmp-")) {
      const journal = JSON.parse(await readFile(path, "utf8")) as { phase: string };
      if (journal.phase === "state-mutating") commitController.abort();
    }
  });
  await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input, { signal: commitController.signal }));
  setAfterWrite(undefined);
  assert.deepEqual(await readdir(petsRoot), []);
  assert.deepEqual(JSON.parse(await readFile(statePath, "utf8")).pets.installed, []);

  setAfterWrite((path) => {
    if (basename(path) === "spritesheet.webp") throw new Error("模拟部分文件写入后失败");
  });
  await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input));
  setAfterWrite(undefined);
  setBeforeInstall(() => { throw new Error("模拟档案写入拒绝"); });
  await assert.rejects(() => installPetFromSpritesheetFileWithResult(imagePath, input));
  setBeforeInstall(undefined);
  assert.deepEqual(await readdir(petsRoot), []);
  assert.deepEqual(JSON.parse(await readFile(statePath, "utf8")).pets.installed, []);

  // 档案已提交之后的迟到取消不回滚成功，也不误报失败。
  const lateController = new AbortController();
  setAfterInstall(() => lateController.abort());
  const committed = await installPetFromSpritesheetFileWithResult(imagePath, input, { signal: lateController.signal });
  setAfterInstall(undefined);
  assert.equal(committed.petId, input.id);
  assert.equal(committed.state.pets.installed[0]?.id, input.id);
  assert.deepEqual(await readFile(join(petsRoot, input.id, "spritesheet.webp")), visibleAtlas);

  // 可选真实下载/网页产物验收沿同一私有测试档案运行，不触碰用户桌宠档案。
  const externalFixtures: unknown = JSON.parse(process.env.DESKTOP_PET_IMPORT_FIXTURES ?? "[]");
  assert.ok(Array.isArray(externalFixtures) && externalFixtures.every((path) => typeof path === "string"));
  const reports: Array<Record<string, unknown>> = [];
  for (const externalPath of externalFixtures as string[]) {
    const files = await readLocalPackageFiles(externalPath, packageImportLimits);
    const shimeji = ![...files.keys()].some((name) => basename(name) === "pet.json") && [...files.keys()].some((name) => name === "conf/actions.xml" || name.endsWith("/conf/actions.xml"));
    let imported;
    if (shimeji) {
      await assert.rejects(() => installPetFromFolderWithResult(externalPath), "默认导入不能偷偷转换原行为");
      imported = await installShimejiPetFromFolderWithResult(externalPath);
    } else {
      imported = externalPath.toLowerCase().endsWith(".zip")
        ? await installPetFromZipFileWithResult(externalPath)
        : await installPetFromFolderWithResult(externalPath);
    }
    const manifestPath = join(petsRoot, imported.petId, "pet.json");
    const importedManifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const exported = await exportInstalledPetPackage(imported.petId, parent, undefined, { format: "zip" });
    await removePet(imported.petId);
    await installPetFromZipFileWithResult(exported.archivePath!);
    assert.deepEqual(JSON.parse(await readFile(manifestPath, "utf8")), importedManifest);
    reports.push({ path: externalPath, petId: imported.petId, importFormat: importedManifest.importFormat ?? "pet.json", actionCount: Object.keys(importedManifest.actions ?? {}).length, actionDefinitions: importedManifest.actionDefinitions, stateBindings: importedManifest.stateBindings, roundTrip: true });
    await removePet(imported.petId);
    await rm(exported.directoryPath, { recursive: true });
  }
  if (process.env.DESKTOP_PET_IMPORT_REPORT) await writeFile(process.env.DESKTOP_PET_IMPORT_REPORT, `${JSON.stringify(reports, null, 2)}\n`);
} finally {
  setAfterWrite(undefined);
  setAfterArchiveOpen(undefined);
  setBeforeInstall(undefined);
  setAfterInstall(undefined);
  await rm(fixture, { recursive: true, force: true });
}

console.log("本地制作与分享：完整文件夹/ZIP 往返、扩展信息与附件保留、容量边界、取消和失败清理通过。");

async function createZip(entries: readonly { name: string; data: Buffer; compress?: boolean }[]): Promise<Buffer> {
  const zip = new yazl.ZipFile();
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    zip.on("error", reject);
    zip.outputStream.on("error", reject);
    zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.on("end", () => resolve(Buffer.concat(chunks)));
  });
  for (const entry of entries) zip.addBuffer(entry.data, entry.name, { compress: entry.compress ?? false });
  zip.end();
  return complete;
}

/** 仅修改测试 ZIP 的中央目录，模拟不可信归档元数据。 */
function patchCentralEntry(bytes: Buffer, name: string, change: (entry: Buffer) => void): void {
  const signature = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  for (let offset = bytes.indexOf(signature); offset >= 0; offset = bytes.indexOf(signature, offset + 4)) {
    const length = bytes.readUInt16LE(offset + 28);
    if (bytes.subarray(offset + 46, offset + 46 + length).toString("utf8") === name) {
      change(bytes.subarray(offset));
      return;
    }
  }
  throw new Error("测试 ZIP 中没有目标条目");
}

async function readZip(bytes: Buffer): Promise<Map<string, Buffer>> {
  const zip = await new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.fromBuffer(bytes, { lazyEntries: true, strictFileNames: true, validateEntrySizes: true }, (error, file) => {
      if (error || !file) reject(error ?? new Error("无法读取测试 ZIP"));
      else resolve(file);
    });
  });
  const entries = new Map<string, Buffer>();
  try {
    await new Promise<void>((resolve, reject) => {
      zip.on("error", reject);
      zip.on("end", resolve);
      zip.on("entry", (entry: yauzl.Entry) => {
        void (async () => {
          const stream = await new Promise<Readable>((resolveStream, rejectStream) => {
            zip.openReadStream(entry, (error, source) => {
              if (error || !source) rejectStream(error ?? new Error("无法读取测试条目"));
              else resolveStream(source);
            });
          });
          const chunks: Buffer[] = [];
          for await (const chunk of stream) chunks.push(chunk as Buffer);
          entries.set(entry.fileName, Buffer.concat(chunks));
          zip.readEntry();
        })().catch(reject);
      });
      zip.readEntry();
    });
    return entries;
  } finally {
    zip.close();
  }
}
