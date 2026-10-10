import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { petMediaActions, petMediaOptionalActions, removePetChroma, resolvePetMediaAction, resolvePetMediaPlaybackAction, uniquePetMediaFiles, validateMediaPetMetadata } from "../src/pet-media-contract.js";
import { assertPetPackageFileWhitelist, readPetPackageAssets } from "../src/pet-media-files.js";
import { validateZipEntryName } from "../src/zip-safety.js";

const actions = Object.fromEntries(petMediaActions.map((state) => [state, "idle.webp"]));
const input = { id: "media-cat", displayName: "视频测试猫", description: "测试素材，不是角色成品", mediaVersion: 1, actions, background: { mode: "alpha" } };
const metadata = validateMediaPetMetadata(input, "media-cat");
assert.equal(metadata.actions.review, "idle.webp");
const extended = validateMediaPetMetadata({ ...input, actions: { ...actions, sleeping: "sleeping.webp", clicked: "clicked.webp", dragged: "dragged.webp" } }, "media-cat");
assert.deepEqual(uniquePetMediaFiles(extended), ["idle.webp", "sleeping.webp", "clicked.webp", "dragged.webp"]);
for (const action of petMediaOptionalActions) {
  assert.equal(resolvePetMediaPlaybackAction(extended, "review", "run-left", true, action), action);
  assert.equal(resolvePetMediaPlaybackAction(metadata, "review", "run-left", true, action), "review", "未提供交互素材时保留原反应");
  assert.equal(resolvePetMediaPlaybackAction(metadata, "idle", "run-left", true, action), "running-right", "旧包的移动方向补偿保持不变");
  assert.throws(() => validateMediaPetMetadata({ ...input, actions: { ...actions, [action]: "../bad.webp" } }, "media-cat"));
  assert.throws(() => validateMediaPetMetadata({ ...input, actions: { ...actions, [action]: "extra.mp4" } }, "media-cat"), /MP4/);
  assert.throws(() => validateMediaPetMetadata({ ...input, actions: { ...actions, [action]: undefined } }, "media-cat"));
}
assert.equal(resolvePetMediaPlaybackAction(extended, "review", "idle", false, "unknown"), "review");

// 相对子目录与自定义动作可用；任意地址、穿越、脚本和缺少待机仍须拒绝。
for (const path of ["../idle.mp4", "C:/idle.mp4", "https://example.com/a.mp4", "idle.js", "nested/../idle.webp"]) {
  assert.throws(() => validateMediaPetMetadata({ ...input, actions: { ...actions, idle: path } }, "media-cat"));
}
const custom = validateMediaPetMetadata({ ...input, actions: { idle: "media/idle.webp", dance: "media/Dance.WEBP" }, actionDefinitions: { dance: { displayName: "跳舞", category: "互动", creatorTag: "原动作标注" } }, background: { mode: "alpha", creatorTag: "原去背标注" }, stateBindings: { waving: "dance" }, author: "自定义作者" }, "media-cat");
assert.equal(custom.actionDefinitions?.dance?.displayName, "跳舞");
assert.equal(resolvePetMediaPlaybackAction(custom, "waving", "idle", false, undefined), "dance");
assert.equal(resolvePetMediaPlaybackAction(custom, "review", "idle", false, undefined), "idle");
assert.equal((custom.actionDefinitions?.dance as unknown as Record<string, unknown>).creatorTag, "原动作标注");
assert.equal((custom.background as unknown as Record<string, unknown>).creatorTag, "原去背标注");
const incomplete = { ...actions };
delete incomplete.idle;
assert.throws(() => validateMediaPetMetadata({ ...input, actions: incomplete }, "media-cat"));
assert.throws(() => validateMediaPetMetadata({ ...input, actions: { ...actions, idle: "idle.mp4" } }, "media-cat"));
assert.equal(validateMediaPetMetadata({ ...input, actions: { ...actions, idle: "idle.mp4" }, background: { mode: "chroma", color: "#00FF00" } }, "media-cat").background.color, "#00ff00");
assert.equal(validateZipEntryName("media-cat/idle.mp4").relativeOutputPath, "idle.mp4");
assert.throws(() => validateZipEntryName("media-cat/nested/idle.mp4"));

// 去色保持角色颜色不变，且方向映射补偿原窗口水平翻转。
const pixels = new Uint8ClampedArray([0, 255, 0, 255, 180, 70, 30, 255, 80, 140, 240, 200]);
removePetChroma(pixels, { mode: "chroma", color: "#00ff00", tolerance: 70 });
assert.deepEqual([...pixels], [0, 255, 0, 0, 180, 70, 30, 255, 80, 140, 240, 200]);
assert.equal(resolvePetMediaAction("idle", "run-left", false), "running-left");
assert.equal(resolvePetMediaAction("idle", "run-left", true), "running-right");
assert.equal(resolvePetMediaAction("review", "run-left", false), "review");
assert.equal(resolvePetMediaAction("unknown", "unknown", false), "idle");

const directory = await mkdtemp(join(tmpdir(), "desktop-pet-media-test-"));
try {
  const raw = Buffer.alloc(192 * 208 * 2 * 4);
  for (let index = 0; index < raw.length; index += 4) {
    const pixel = index / 4;
    const x = pixel % 192;
    const y = Math.floor(pixel / 192) % 208;
    if (x > 40 && x < 150 && y > 40 && y < 180) {
      raw[index] = pixel < 192 * 208 ? 255 : 40;
      raw[index + 2] = pixel < 192 * 208 ? 40 : 255;
      raw[index + 3] = 255;
    }
  }
  const animated = await sharp(raw, { raw: { width: 192, height: 416, channels: 4, pageHeight: 208 } }).webp({ loop: 0, delay: [500, 500] }).toBuffer();
  await writeFile(join(directory, "pet.json"), JSON.stringify(metadata));
  await writeFile(join(directory, "idle.webp"), animated);
  assert.equal((await readPetPackageAssets(directory, metadata)).size, 1);
  await assertPetPackageFileWhitelist(directory, metadata);
  for (const action of petMediaOptionalActions) await writeFile(join(directory, extended.actions[action]!), animated);
  assert.equal((await readPetPackageAssets(directory, extended)).size, 4);
  await assertPetPackageFileWhitelist(directory, extended);
  await assert.rejects(() => assertPetPackageFileWhitelist(directory, metadata), "旧声明不能读取未声明的交互素材");
  for (const action of petMediaOptionalActions) await rm(join(directory, extended.actions[action]!));
  await writeFile(join(directory, "unlisted.mp4"), Buffer.alloc(20));
  await assert.rejects(() => assertPetPackageFileWhitelist(directory, metadata));
  await rm(join(directory, "unlisted.mp4"));
  const still = await sharp({ create: { width: 192, height: 208, channels: 4, background: "transparent" } }).webp().toBuffer();
  await writeFile(join(directory, "idle.webp"), still);
  await assert.rejects(() => readPetPackageAssets(directory, metadata));
  await rm(join(directory, "idle.webp"));
  await mkdir(join(directory, "idle.webp"));
  await assert.rejects(() => readPetPackageAssets(directory, metadata));
} finally {
  await rm(directory, { recursive: true, force: true });
}
console.log("独立动作媒体：九动作兼容、三种可选交互、素材回退、路径校验、纯色去背、方向映射、真实动画 WebP 及文件白名单通过。");
