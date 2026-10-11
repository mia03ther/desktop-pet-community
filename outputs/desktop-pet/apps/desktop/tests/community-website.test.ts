import assert from "node:assert/strict";
import { request } from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommunityWebsite } from "../src/community-website.js";

// 保护可见网站边界：入口只能打开本站公开静态文件，不能读取档案或接受写入。
const directory = await mkdtemp(join(tmpdir(), "pet-community-site-"));
const site = new CommunityWebsite(directory);

function requestStatus(origin: string, path: string, host?: string): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const operation = request(new URL(origin), {
      path,
      ...(host ? { headers: { Host: host } } : {}),
    }, (result) => {
      result.resume();
      resolve(result.statusCode);
    });
    operation.on("error", reject);
    operation.end();
  });
}

try {
  await writeFile(join(directory, "index.html"), "共创画廊");
  await writeFile(join(directory, "private.json"), "不应通过网站读取");
  await writeFile(join(directory, "private.js"), "不应通过网站执行");
  const clientModules = [
    ["plugin-catalog.js", "export const sourcePlugins = [];"],
    ["community-data.js", "export const requests = [];"],
    ["community-core.js", "export function rankings() { return []; }"],
    ["community-pages.js", "export function refresh() {}"],
    ["locale.js", "export function createSiteLocale() {}"],
    ["locale-messages.js", "export const uiMessages = {};"],
    ["catalog-management.js", "export function managedWorks(works) { return works; }"],
    ["admin.html", "<!doctype html><title>作品管理</title>"],
    ["admin.js", "export const admin = true;"],
    ["admin.css", ".admin-main { display: block; }"],
    ["package-core.js", "export function inspectImport() {}"],
    ["native-package-contract.js", "export function validateMediaPetMetadata() {}"],
    ["plugin-covers.js", "export const pluginCovers = {};"],
    ["publication-client.js", "export function getSession() {}"],
    ["publication-config.js", "export const publicSiteUrl = '';"],
  ] as const;
  for (const [filename, source] of clientModules) {
    await writeFile(join(directory, filename), source);
  }
  await mkdir(join(directory, "assets", "pets"), { recursive: true });
  await mkdir(join(directory, "assets", "plugin-covers"), { recursive: true });
  const coverNames = [
    "quick-reminder.webp", "simple-timer.webp", "calm-practice.webp", "focus-buddy.webp",
    "launch-greeting.webp", "fortune-cookie.webp", "virtual-pet.webp", "life-companion.webp",
    "water-reminder.webp", "system-resources.webp", "calendar-airmail.webp", "day-routine.webp",
    "magic-ball.webp", "mood-check.webp", "ai-allowance.webp", "generation-progress.webp",
    "drag-vocabulary.webp", "music-buddy.webp", "desktop-walk.webp", "file-assistant.webp",
    "computer-care.webp", "water-break.webp", "eye-break.webp", "focus-break.webp",
  ];
  for (const filename of coverNames) {
    await writeFile(join(directory, "assets", "plugin-covers", filename), `公开插件封面 ${filename}`);
  }
  await writeFile(join(directory, "assets", "plugin-covers", "private.webp"), "未登记的封面");
  const atlas = Buffer.from("公开桌宠图集");
  const thumbnail = Buffer.from("公开桌宠缩略图");
  const packageBytes = Buffer.from("公开桌宠安装包");
  await writeFile(join(directory, "assets", "pets", "firefly--lingxiaotian.webp"), atlas);
  await writeFile(join(directory, "assets", "pets", "firefly--lingxiaotian-thumb.webp"), thumbnail);
  await writeFile(join(directory, "assets", "firefly--lingxiaotian.zip"), packageBytes);
  const toolFiles = [
    "lingyin.file-assistant.zip", "lingyin.computer-care.zip",
    ...["reminders", "simple-timer", "anxiety-aid-tools", "focus-buddy", "launch-buddy", "fortune-cookie", "virtual-pet", "life-companion", "water-reminder", "system-resources", "calendar-airmail", "day-routine", "magic-8-ball", "mood-check-in"].map((id) => `openpets.${id}.zip`),
    "regis.usage-buddy.zip", "openpets.higgsfield-watch.zip", "openpets.drag-vocab.zip", "openpets.spotify-buddy.zip", "openpets.walkabout.zip",
  ];
  for (const filename of toolFiles) {
    await writeFile(join(directory, "assets", filename), `可选工具 ${filename}`);
  }
  await writeFile(join(directory, "assets", "private-plugin.zip"), "没有登记的私有插件");
  await writeFile(join(directory, "assets", "pets", "private.webp"), "不是公开作品");
  await writeFile(join(directory, "assets", "pets", "new-public-pet.webp"), "新增公开桌宠");
  await writeFile(join(directory, "assets", "new-public-pet-v2.zip"), "新增公开安装包");
  await writeFile(join(directory, "gallery-files.json"), JSON.stringify({ schemaVersion: 2, files: [
    { path: "assets/pets/new-public-pet.webp", mime: "image/webp" },
    { path: "assets/new-public-pet-v2.zip", mime: "application/zip" },
  ] }));
  const [pets, plugins, create] = await Promise.all([
    site.getUrl("pets"),
    site.getUrl("plugins"),
    site.getUrl("create"),
  ]);
  assert.equal(new URL(pets).origin, new URL(plugins).origin);
  assert.equal(new URL(create).hash, "#create");
  assert.equal(new URL(pets).hostname, "127.0.0.1");
  const response = await fetch(pets);
  assert.equal(response.status, 200);
  const policy = response.headers.get("content-security-policy") ?? "";
  assert.ok(policy.split("; ").includes("media-src 'self' blob:"), "允许用户本地视频预览");
  assert.ok(policy.split("; ").includes("object-src 'none'"), "导入不开放可执行嵌入");
  assert.equal(await response.text(), "共创画廊");
  for (const [filename, source] of clientModules) {
    const moduleUrl = new URL(filename, pets);
    const moduleResponse = await fetch(moduleUrl);
    assert.equal(moduleResponse.status, 200);
    const type = filename.endsWith(".html") ? "text/html" : filename.endsWith(".css") ? "text/css" : "text/javascript";
    assert.equal(moduleResponse.headers.get("content-type"), `${type}; charset=utf-8`);
    assert.equal(await moduleResponse.text(), source);
    const moduleHead = await fetch(moduleUrl, { method: "HEAD" });
    assert.equal(moduleHead.status, 200);
    assert.equal(moduleHead.headers.get("content-type"), `${type}; charset=utf-8`);
    assert.equal(moduleHead.headers.get("content-length"), String(Buffer.byteLength(source)));
    assert.equal((await moduleHead.arrayBuffer()).byteLength, 0);
  }
  for (const [path, expected] of [
    ["assets/pets/firefly--lingxiaotian.webp", atlas],
    ["assets/pets/firefly--lingxiaotian-thumb.webp", thumbnail],
  ] as const) {
    const image = await fetch(new URL(path, pets));
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/webp");
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), expected);
  }
  const downloadUrl = new URL("assets/firefly--lingxiaotian.zip", pets);
  const download = await fetch(downloadUrl);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("content-type"), "application/zip");
  assert.equal(download.headers.get("content-disposition"), "attachment; filename=\"firefly--lingxiaotian.zip\"");
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), packageBytes);
  const head = await fetch(downloadUrl, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), String(packageBytes.length));
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  for (const filename of toolFiles) {
    const toolDownload = await fetch(new URL(`assets/${filename}`, pets));
    assert.equal(toolDownload.status, 200);
    assert.equal(toolDownload.headers.get("content-type"), "application/zip");
    assert.equal(toolDownload.headers.get("content-disposition"), `attachment; filename="${filename}"`);
    assert.equal(await toolDownload.text(), `可选工具 ${filename}`);
  }
  for (const filename of coverNames) {
    const url = new URL(`assets/plugin-covers/${filename}`, pets);
    const cover = await fetch(url);
    assert.equal(cover.status, 200, `封面 ${filename} 应可读取`);
    assert.equal(cover.headers.get("content-type"), "image/webp");
    assert.equal(await cover.text(), `公开插件封面 ${filename}`);
    const coverHead = await fetch(url, { method: "HEAD" });
    assert.equal(coverHead.status, 200);
    assert.equal(coverHead.headers.get("content-length"), String(Buffer.byteLength(`公开插件封面 ${filename}`)));
    assert.equal((await coverHead.arrayBuffer()).byteLength, 0);
  }
  assert.equal((await fetch(new URL("private.json", pets))).status, 404);
  assert.equal((await fetch(new URL("private.js", pets))).status, 404);
  assert.equal((await fetch(new URL("assets/pets/private.webp", pets))).status, 404);
  assert.equal((await fetch(new URL("assets/private-plugin.zip", pets))).status, 404);
  assert.equal((await fetch(new URL("assets/plugin-covers/private.webp", pets))).status, 404);
  const newImage = await fetch(new URL("assets/pets/new-public-pet.webp", pets));
  assert.equal(newImage.status, 200); assert.equal(await newImage.text(), "新增公开桌宠");
  const newDownload = await fetch(new URL("assets/new-public-pet-v2.zip", pets));
  assert.equal(newDownload.status, 200); assert.equal(await newDownload.text(), "新增公开安装包");
  assert.equal((await fetch(new URL("gallery-files.json", pets))).status, 404);
  for (const path of [
    "/../../private.json",
    "/assets/pets/../../private.json",
    "/assets/pets/%2e%2e/%2e%2e/private.json",
    "/assets/pets/..%2f..%2fprivate.json",
    "/assets/plugin-covers/..%2f..%2fprivate.json",
  ]) {
    assert.equal(await requestStatus(pets, path), 404);
  }
  assert.equal((await fetch(pets, { method: "POST", body: "不应写入" })).status, 405);
  assert.equal(await requestStatus(pets, "/", "external.invalid"), 403);
  await assert.rejects(site.getUrl("https://example.com"));
  await assert.rejects(site.getUrl("rankings"));
  // 公网入口不启动本机服务器，也不要求读取随包的预览目录。
  const publishedOrigin = "https://desktop-pet-community.xunguangzlj.chatgpt.site";
  const published = new CommunityWebsite(join(directory, "不存在的预览目录"), publishedOrigin);
  for (const section of ["pets", "plugins", "create"] as const) {
    assert.equal(await published.getUrl(section), `${publishedOrigin}/#${section}`);
  }
  assert.equal(await new CommunityWebsite(directory, `${publishedOrigin}/`).getUrl("pets"), `${publishedOrigin}/#pets`);
  await assert.rejects(published.getUrl("https://example.com"));
  await assert.rejects(published.getUrl("rankings"));
  published.dispose();
  await assert.rejects(published.getUrl("plugins"));
  for (const origin of [
    "http://example.com", "file:///private", "javascript:alert(1)",
    "https://user:password@example.com", "https://example.com/private",
    "https://example.com/?next=private", "https://example.com/#private",
    " https://example.com", "https://example.com\n", "不是网址",
  ]) {
    assert.throws(() => new CommunityWebsite(directory, origin));
  }
  site.dispose();
  await assert.rejects(site.getUrl("pets"));
  for (const path of ["../private.json", "assets/../private.json", "assets/pets/../../private.json", "assets/%2e%2e/private.json", "private.js", "assets/private.js"]) {
    await writeFile(join(directory, "gallery-files.json"), JSON.stringify({ files: [{ path }] }));
    const invalid = new CommunityWebsite(directory);
    try { await assert.rejects(invalid.getUrl("pets")); } finally { invalid.dispose(); }
  }
  console.log("共创网站公网入口、本机预览、桌宠下载、公开文件边界与关闭生命周期通过。");
} finally {
  site.dispose();
  await rm(directory, { recursive: true, force: true });
}
