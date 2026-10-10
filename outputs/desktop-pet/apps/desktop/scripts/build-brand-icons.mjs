import { spawnSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const assetsDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "../assets");
const source = join(assetsDirectory, "brand-logo.png");
const sourceMetadata = await sharp(source).metadata();
if (sourceMetadata.format !== "png" || !sourceMetadata.hasAlpha) {
  throw new Error("品牌源图必须是带透明通道的 PNG。");
}

// 只调整技术尺寸，保留所选作品的构图和透明背景。
await sharp(source).resize(512, 512, { fit: "contain" }).png().toFile(join(assetsDirectory, "app-icon.png"));
await sharp(source).resize(64, 64, { fit: "contain" }).png().toFile(join(assetsDirectory, "tray-icon.png"));

const sizes = [16, 24, 32, 48, 64, 128, 256];
const frames = await Promise.all(sizes.map((size) => sharp(source).resize(size, size, { fit: "contain" }).png().toBuffer()));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  directory[entry] = size === 256 ? 0 : size;
  directory[entry + 1] = size === 256 ? 0 : size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frames[index].length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frames[index].length;
}
await writeFile(join(assetsDirectory, "app-icon.ico"), Buffer.concat([directory, ...frames]));

// 复用 electron-builder 已安装的转换器，不安装或下载额外工具。
const require = createRequire(import.meta.url);
const builderRequire = createRequire(require.resolve("electron-builder"));
const { appBuilderPath } = builderRequire("app-builder-bin");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "desktop-pet-brand-icons-"));
try {
  const result = spawnSync(appBuilderPath, [
    "icon", "--format", "icns", "--root", assetsDirectory,
    "--input", source, "--out", temporaryDirectory,
  ], { encoding: "utf8", windowsHide: true });
  if (result.error || result.status !== 0) {
    throw new Error(`ICNS 转换失败：${result.error?.message ?? result.stderr}`);
  }
  const converted = JSON.parse(result.stdout);
  if (converted.error || !converted.icons?.[0]?.file) {
    throw new Error(`ICNS 转换失败：${converted.error ?? "转换器未返回文件"}`);
  }
  const icns = await readFile(converted.icons[0].file);
  if (icns.toString("ascii", 0, 4) !== "icns" || icns.readUInt32BE(4) !== icns.length) {
    throw new Error("转换器返回的 ICNS 容器不完整。");
  }
  await copyFile(converted.icons[0].file, join(assetsDirectory, "app-icon.icns"));
} finally {
  const temporaryRelative = relative(resolve(tmpdir()), resolve(temporaryDirectory));
  if (temporaryRelative && !temporaryRelative.startsWith("..") && !isAbsolute(temporaryRelative)) {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

console.log("已从 brand-logo.png 生成应用、托盘、Windows ICO 和 macOS ICNS 图标。");
