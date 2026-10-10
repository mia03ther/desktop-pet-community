import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import yazl from "yazl";
import { assertLocalPackagePath, readLocalPackageFiles, selectLocalPackageRoot } from "../src/local-package-files.js";
import { loadLocalPluginSnapshot, readLocalPluginSourceManifest } from "../src/plugin-local-loader.js";
import { validateInstalledPetMetadata } from "../src/pet-media-files.js";
import { validatePluginManifest } from "../src/plugin-manifest.js";

const root = await mkdtemp(join(tmpdir(), "desktop-pet-open-import-"));
const limits = { maxBytes: 1024 * 1024, maxFileBytes: 256 * 1024, maxFiles: 20 };
const manifest = { manifestVersion: 3, id: "community.demo", name: "自制插件", version: "1.0.0", runtime: "javascript", sdkVersion: "3.0.0", entry: "src/main.mjs", permissions: [] };

async function zipBytes(files: Readonly<Record<string, string>>): Promise<Buffer> {
  const archive = new yazl.ZipFile();
  for (const [name, text] of Object.entries(files)) archive.addBuffer(Buffer.from(text), name);
  const result = new Promise<Buffer>((complete, reject) => {
    const chunks: Buffer[] = [];
    archive.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.outputStream.on("end", () => complete(Buffer.concat(chunks)));
    archive.outputStream.on("error", reject);
  });
  archive.end();
  return result;
}

try {
  // 完整 Codex 包无需删除 submission.json 或许可，也无需补写缺省描述。
  const codex = join(root, "codex");
  await mkdir(codex);
  const codexInput = { id: "community-cat", displayName: "社区猫", spritesheetPath: "spritesheet.webp", spriteVersionNumber: 2, author: "社区作者" };
  await writeFile(join(codex, "pet.json"), JSON.stringify(codexInput));
  await writeFile(join(codex, "submission.json"), '{"category":"animals"}');
  const codexFiles = selectLocalPackageRoot(await readLocalPackageFiles(codex, limits), ["pet.json"]).files;
  const normalized = validateInstalledPetMetadata(JSON.parse(codexFiles.get("pet.json")!.toString()), "community-cat");
  assert.equal(normalized.description, "社区猫");
  assert.equal((normalized as unknown as Record<string, unknown>).author, "社区作者");
  assert.equal(codexFiles.has("submission.json"), true);

  // 三种清单名、嵌套 ZIP 与 JSON 直选都归一化到原宿主；未知代码只复制。
  for (const name of ["plugin.json", "desktop-pet.plugin.json", "openpets.plugin.json"]) {
    const plugin = join(root, name);
    await mkdir(join(plugin, "src"), { recursive: true });
    const input = { ...manifest, author: "Lykinzlj", extensions: { keywords: ["提醒"] } };
    await writeFile(join(plugin, name), JSON.stringify(input));
    await writeFile(join(plugin, "src/main.mjs"), 'throw new Error("导入时不能执行本文件");');
    await writeFile(join(plugin, "LICENSE.txt"), "社区许可");
    const preservedName = `IMPORT-SOURCE-${name}`;
    await writeFile(join(plugin, preservedName), "原有归档附件");
    const loaded = await loadLocalPluginSnapshot({ sourceFolder: join(plugin, name), userDataPath: join(root, `profile-${name}`) });
    assert.equal(validatePluginManifest(JSON.parse(await readFile(loaded.manifestPath, "utf8"))).ok, true);
    assert.equal(await readFile(join(loaded.installPath, "LICENSE.txt"), "utf8"), "社区许可");
    assert.equal(await readFile(join(loaded.installPath, preservedName), "utf8"), "原有归档附件");
    const original = `import-source-1-${name}`;
    assert.deepEqual(JSON.parse(await readFile(join(loaded.installPath, original), "utf8")), input);
    const reimported = await loadLocalPluginSnapshot({ sourceFolder: loaded.installPath, userDataPath: join(root, `reimport-${name}`) });
    assert.equal(reimported.manifest.id, manifest.id, "发布后的完整插件目录应能再次导入");
  }
  const zipPath = join(root, "plugin.zip");
  await writeFile(zipPath, await zipBytes({ "repository-main/release/plugin.json": JSON.stringify(manifest), "repository-main/release/src/main.mjs": "export {};", "repository-main/release/README.md": "完整包", "repository-main/LICENSE.txt": "仓库根许可证" }));
  const loadedZip = await loadLocalPluginSnapshot({ sourceFolder: zipPath, userDataPath: join(root, "zip-profile") });
  assert.equal(await readFile(join(loadedZip.installPath, "README.md"), "utf8"), "完整包");
  assert.equal(await readFile(join(loadedZip.installPath, "import-wrapper/repository-main/LICENSE.txt"), "utf8"), "仓库根许可证");

  // 不把其他宿主运行时当作本桌宠插件，错误包不会产生可运行安装。
  const unsupported = join(root, "unsupported");
  await mkdir(unsupported);
  await writeFile(join(unsupported, "plugin.json"), JSON.stringify({ name: "Raycast 插件", commands: [{ name: "brew" }], main: "index.js" }));
  await assert.rejects(() => readLocalPluginSourceManifest({ sourceFolder: unsupported }), /不兼容/);
  await writeFile(join(unsupported, "plugin.json"), JSON.stringify({ ...manifest, permissions: ["filesystem:unrestricted"] }));
  await assert.rejects(() => readLocalPluginSourceManifest({ sourceFolder: unsupported }), /不兼容/);

  // 路径穿越、大小写冲突、多个作品和越界链接不能被“开放导入”放行。
  for (const path of ["../pet.json", "a/../pet.json", "/pet.json", "C:/pet.json", "a\\pet.json", "con.txt", "a./file", "a//file"]) assert.throws(() => assertLocalPackagePath(path));
  const unsafe = await zipBytes({ "SAFE001.txt": "不可写出包外" });
  const from = Buffer.from("SAFE001.txt");
  for (let offset = unsafe.indexOf(from); offset !== -1; offset = unsafe.indexOf(from, offset + from.length)) Buffer.from("../evil.txt").copy(unsafe, offset);
  await writeFile(zipPath, unsafe);
  await assert.rejects(() => readLocalPackageFiles(zipPath, limits));
  await writeFile(zipPath, await zipBytes({ "File.txt": "1", "file.txt": "2" }));
  await assert.rejects(() => readLocalPackageFiles(zipPath, limits));
  assert.throws(() => selectLocalPackageRoot(new Map([["one/pet.json", Buffer.alloc(0)], ["two/pet.json", Buffer.alloc(0)]]), ["pet.json"]));
  const linked = join(root, "linked");
  await symlink(codex, linked, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(() => readLocalPackageFiles(linked, limits));

  // 可选真实上游／网页导出插件验收只安装快照，不启动外部插件代码。
  const externalFixtures: unknown = JSON.parse(process.env.DESKTOP_PET_PLUGIN_IMPORT_FIXTURES ?? "[]");
  assert.ok(Array.isArray(externalFixtures) && externalFixtures.every((path) => typeof path === "string"));
  const reports: Array<Record<string, unknown>> = [];
  for (const [index, sourceFolder] of (externalFixtures as string[]).entries()) {
    const installed = await loadLocalPluginSnapshot({ sourceFolder, userDataPath: join(root, `actual-plugin-${index}`) });
    const roundTrip = await loadLocalPluginSnapshot({ sourceFolder: installed.installPath, userDataPath: join(root, `actual-plugin-roundtrip-${index}`) });
    assert.deepEqual(roundTrip.manifest, installed.manifest);
    const copied = await readLocalPackageFiles(roundTrip.installPath, { maxBytes: 32 * 1024 * 1024, maxFileBytes: 5 * 1024 * 1024, maxFiles: 1000 });
    reports.push({ sourceFolder, id: installed.manifest.id, manifestVersion: installed.manifest.manifestVersion, runtime: installed.manifest.runtime, files: [...copied.keys()], roundTrip: true, pluginCodeExecuted: false });
  }
  if (process.env.DESKTOP_PET_PLUGIN_IMPORT_REPORT) await writeFile(process.env.DESKTOP_PET_PLUGIN_IMPORT_REPORT, `${JSON.stringify(reports, null, 2)}\n`);
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log("开放导入：完整附属文件、三种清单、嵌套 ZIP、清单直选、不执行未知代码、宿主边界与路径隔离通过。");
