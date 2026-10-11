// 打包后瘦身：剔除 sharp(@img) 中非当前平台的原生二进制与构建工具依赖。
// darwin-arm64/x64 只需要对应 sharp-darwin-arm64 + sharp-libvips-darwin-arm64，其余平台包纯占体积。
const { rmSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const keepPrefixes = new Set([
  "sharp-darwin-arm64",
  "sharp-darwin-x64",
  "sharp-libvips-darwin-arm64",
  "sharp-libvips-darwin-x64",
  "sharp-wasm32", // wasm 兜底路径，体积小，保留
  "colour", // 纯 wasm 颜色空间库，sharp 无条件 require，必须保留
]);

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;
  const { readdirSync } = require("node:fs");
  // appOutDir 可能是 .app 本身，也可能是不含后缀的输出目录（builder 版本行为不一），自动探测。
  const candidates = [context.appOutDir, ...readdirSync(context.appOutDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.endsWith(".app"))
    .map((e) => join(context.appOutDir, e.name))];
  const appBundle = candidates.find((dir) => existsSync(join(dir, "Contents", "Resources", "app.asar.unpacked")));
  if (!appBundle) {
    console.log("afterPack: app bundle with unpacked resources not found under " + context.appOutDir);
    return;
  }
  const unpackedRoot = join(appBundle, "Contents", "Resources", "app.asar.unpacked", "node_modules");
  const imgDir = join(unpackedRoot, "@img");
  if (!existsSync(imgDir)) {
    console.log("afterPack: @img dir not found at " + imgDir);
    return;
  }
  const removed = [];
  for (const entry of readdirSync(imgDir)) {
    if (keepPrefixes.has(entry)) continue;
    const dir = join(imgDir, entry);
    try {
      rmSync(dir, { recursive: true, force: true });
      removed.push(entry);
    } catch { /* 单个失败不阻塞打包 */ }
  }
  // node-gyp 仅在原生模块编译时需要，运行时无用
  const nodeGyp = join(unpackedRoot, "node-gyp");
  if (existsSync(nodeGyp)) {
    try {
      rmSync(nodeGyp, { recursive: true, force: true });
      removed.push("node-gyp");
    } catch { /* 单个失败不阻塞打包 */ }
  }
  console.log(`afterPack: removed non-darwin native packages: ${removed.length > 0 ? removed.join(", ") : "(none)"}`);
};
