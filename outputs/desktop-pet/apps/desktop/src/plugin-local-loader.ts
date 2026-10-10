import { promises as fs } from "node:fs";
import { basename, dirname, join } from "node:path";

import { collectDeclaredPluginFiles, preparePluginFileBytes, validatePluginSpriteBytes } from "./plugin-assets.js";
import { defaultMaxPluginManifestBytes, readSafePluginManifest } from "./plugin-manifest-reader.js";
import { OPENPETS_PLUGIN_MANIFEST_FILENAME, validateImportedPluginManifest, type OpenPetsPluginManifest } from "./plugin-manifest.js";
import { assertLocalPackagePath, readLocalPackageFiles, selectLocalPackageRoot } from "./local-package-files.js";

export type LocalPluginLoadResult = { readonly manifest: OpenPetsPluginManifest; readonly installPath: string; readonly manifestPath: string };
export type LocalPluginSourceManifest = { readonly manifest: OpenPetsPluginManifest; readonly manifestText: string; readonly entryText?: string; readonly declaredFiles?: ReadonlyMap<string, Buffer> };
const maxPluginEntryBytes = 1024 * 1024;
export const localPluginManifestNames = ["desktop-pet.plugin.json", "plugin.json", OPENPETS_PLUGIN_MANIFEST_FILENAME] as const;

export async function loadLocalPluginSnapshot(options: { readonly sourceFolder: string; readonly userDataPath: string; readonly maxManifestBytes?: number }): Promise<LocalPluginLoadResult> {
  const source = await readLocalPluginSourceManifest({ sourceFolder: options.sourceFolder, maxManifestBytes: options.maxManifestBytes });
  return publishLocalPluginSnapshot({ manifest: source.manifest, manifestText: source.manifestText, entryText: source.entryText, declaredFiles: source.declaredFiles, userDataPath: options.userDataPath, maxManifestBytes: options.maxManifestBytes });
}

export async function readLocalPluginSourceManifest(options: { readonly sourceFolder: string; readonly maxManifestBytes?: number }): Promise<LocalPluginSourceManifest> {
  const maxBytes = options.maxManifestBytes ?? defaultMaxPluginManifestBytes;
  const pathStat = await fs.lstat(options.sourceFolder);
  const explicitManifest = pathStat.isFile() && (localPluginManifestNames as readonly string[]).includes(basename(options.sourceFolder));
  const sourcePath = explicitManifest ? dirname(options.sourceFolder) : options.sourceFolder;
  const files = await readLocalPackageFiles(sourcePath, { maxBytes: 32 * 1024 * 1024, maxFileBytes: 5 * 1024 * 1024, maxFiles: 1000 });
  const selected = explicitManifest ? { files, manifestName: basename(options.sourceFolder) } : selectLocalPackageRoot(files, localPluginManifestNames);
  const bytes = selected.files.get(selected.manifestName)!;
  if (bytes.length > maxBytes) throw new Error("插件清单超过大小上限。");
  const parsed: unknown = JSON.parse(bytes.toString("utf8"));
  const result = validateImportedPluginManifest(parsed);
  if (!result.ok) throw new Error(`此插件不兼容本宿主。需要 declarative 清单 v1 或 JavaScript SDK v2/v3；其他应用的运行时需要专用适配。${formatManifestValidationErrors(result.errors)}`);
  const manifest = result.manifest;
  if (!isSafePluginDirectoryName(manifest.id)) throw new Error("Plugin id is reserved.");
  const declaredFiles = new Map(selected.files);
  // 标准运行清单只包含宿主字段，原始清单（包括扩展信息）随包保留。
  let originalName = `import-source-${selected.manifestName}`;
  let suffix = 1;
  const foldedNames = new Set([...declaredFiles.keys()].map((name) => name.toLowerCase()));
  while (foldedNames.has(originalName.toLowerCase())) originalName = `import-source-${suffix++}-${selected.manifestName}`;
  declaredFiles.set(originalName, bytes);
  declaredFiles.delete(selected.manifestName);
  let entryText: string | undefined;
  if (manifest.manifestVersion === 2 || manifest.manifestVersion === 3) {
    const entryBytes = selected.files.get(manifest.entry);
    if (!entryBytes || entryBytes.length > maxPluginEntryBytes) throw new Error("插件入口缺失或超过 1 MiB。");
    entryText = entryBytes.toString("utf8");
    for (const file of collectDeclaredPluginFiles(manifest)) {
      const original = selected.files.get(file.relPath);
      if (!original) throw new Error(`插件缺少声明文件：${file.relPath}`);
      const prepared = preparePluginFileBytes(file, original);
      await validatePluginSpriteBytes(file, prepared, manifest);
      declaredFiles.set(file.relPath, prepared);
    }
  }
  return { manifest, manifestText: `${JSON.stringify(manifest, null, 2)}\n`, entryText, declaredFiles };
}

export async function publishLocalPluginSnapshot(options: { readonly manifest: OpenPetsPluginManifest; readonly manifestText: string; readonly entryText?: string; readonly declaredFiles?: ReadonlyMap<string, Buffer>; readonly userDataPath: string; readonly maxManifestBytes?: number }): Promise<LocalPluginLoadResult> {
  const maxBytes = options.maxManifestBytes ?? defaultMaxPluginManifestBytes;
  const devRoot = join(options.userDataPath, "plugins-dev");
  await fs.mkdir(devRoot, { recursive: true });
  await assertRealDirectory(devRoot, "Plugin development directory is invalid.");
  const installPath = join(devRoot, options.manifest.id);
  const manifestPath = join(installPath, OPENPETS_PLUGIN_MANIFEST_FILENAME);
  const tempPath = join(devRoot, `.tmp-${options.manifest.id}-${process.pid}-${Date.now()}`);
  const tempManifestPath = join(tempPath, OPENPETS_PLUGIN_MANIFEST_FILENAME);
  await fs.rm(tempPath, { recursive: true, force: true });
  await fs.mkdir(tempPath, { recursive: true });
  try {
    await assertRealDirectory(tempPath, "Plugin temporary directory is invalid.");
    await fs.writeFile(tempManifestPath, options.manifestText, { mode: 0o600 });
    if (options.manifest.manifestVersion === 2 || options.manifest.manifestVersion === 3) {
      if (options.entryText === undefined) throw new Error("Plugin entry file is missing.");
      const tempEntryPath = join(tempPath, options.manifest.entry);
      await fs.mkdir(dirname(tempEntryPath), { recursive: true });
      await fs.writeFile(tempEntryPath, options.entryText, { mode: 0o600 });
    }
    for (const [relPath, bytes] of options.declaredFiles ?? new Map<string, Buffer>()) {
      assertLocalPackagePath(relPath);
      if (relPath === OPENPETS_PLUGIN_MANIFEST_FILENAME) continue;
      const filePath = join(tempPath, relPath);
      await fs.mkdir(dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, bytes, { mode: 0o600 });
    }
    await readSafePluginManifest({ installPath: tempPath, manifestPath: tempManifestPath, allowedPluginRoots: [devRoot], maxManifestBytes: maxBytes, expectedId: options.manifest.id, expectedVersion: options.manifest.version });
    await replaceInstallDirectory(devRoot, installPath, tempPath);
  } finally {
    await fs.rm(tempPath, { recursive: true, force: true });
  }
  const copied = await readSafePluginManifest({ installPath, manifestPath, allowedPluginRoots: [devRoot], maxManifestBytes: maxBytes, expectedId: options.manifest.id, expectedVersion: options.manifest.version });
  return { manifest: copied, installPath, manifestPath };
}

async function assertRealDirectory(path: string, message: string): Promise<void> {
  const stat = await fs.lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(message);
}

async function replaceInstallDirectory(root: string, installPath: string, tempPath: string): Promise<void> {
  const backupPath = join(root, `.bak-${Date.now()}-${process.pid}`);
  let hadExisting = false;
  try {
    await assertRealDirectory(tempPath, "Plugin temporary directory is invalid.");
    try { await assertRealDirectory(installPath, "Plugin install directory is invalid."); hadExisting = true; }
    catch (error) { const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined; if (code !== "ENOENT") throw error; }
    if (hadExisting) await fs.rename(installPath, backupPath);
    await fs.rename(tempPath, installPath);
    await fs.rm(backupPath, { recursive: true, force: true });
  } catch (error) {
    await fs.rm(installPath, { recursive: true, force: true }).catch(() => undefined);
    if (hadExisting) await fs.rename(backupPath, installPath).catch(() => undefined);
    throw error;
  }
}

function isSafePluginDirectoryName(id: string): boolean {
  return id !== "." && id !== ".." && !id.startsWith(".") && !/[\\/]/.test(id);
}

function formatManifestValidationErrors(errors: readonly { readonly path: string; readonly code: string; readonly message: string }[]): string {
  return errors.slice(0, 6).map((error) => `${error.path} ${error.code}: ${error.message}`).join("; ");
}
