import assert from "node:assert/strict";
import sharp from "sharp";
import { convertShimejiPetPackage } from "../src/shimeji-pet-import.js";
import { resolvePetMediaPlaybackAction, validateMediaPetMetadata } from "../src/pet-media-contract.js";
import { validatePetMediaBytes } from "../src/pet-media-files.js";

const red = await sharp({ create: { width: 128, height: 128, channels: 4, background: "transparent" } })
  .composite([{ input: await sharp({ create: { width: 32, height: 64, channels: 4, background: "red" } }).png().toBuffer(), left: 48, top: 64 }]).png().toBuffer();
const blue = await sharp(red).tint("blue").png().toBuffer();
const xml = `<Mascot><ActionList>
  <Action Name="Stand" Type="Stay"><Animation><Pose Image="/shime1.png" ImageAnchor="64,128" Duration="250"/></Animation></Action>
  <Action Name="Walk" Type="Move"><Animation><Pose Image="/shime1.png" ImageAnchor="64,128" Duration="6"/><Pose Image="/shime2.png" ImageAnchor="64,128" Duration="6"/></Animation></Action>
  <Action Name="DangerousJava" Type="Embedded" Class="unsafe.Test"><Animation><Pose Image="/shime1.png" ImageAnchor="64,128" Duration="1"/></Animation></Action>
  <Action Name="Conditional" Type="Stay"><Animation Condition="#{unsafe()}"><Pose Image="/shime1.png" ImageAnchor="64,128" Duration="1"/></Animation></Action>
</ActionList></Mascot>`;
const input = new Map([[
  "download-root/conf/actions.xml", Buffer.from(xml),
], ["download-root/conf/behaviors.xml", Buffer.from("原行为留档")], ["download-root/img/Shimeji/shime1.png", red], ["download-root/img/Shimeji/shime2.png", blue], ["download-root/LICENSE.txt", Buffer.from("原许可")], ["README.md", Buffer.from("下载包装层说明")]]);
const result = await convertShimejiPetPackage(input, "测试 Shimeji");
const parsed = JSON.parse(result.get("pet.json")!.toString());
const metadata = validateMediaPetMetadata(parsed, parsed.id);
assert.equal(Object.keys(metadata.actions).length, 3, "只转换 Stand、Walk 并映射 idle，不执行 Java 或条件动作");
assert.equal(metadata.stateBindings?.["running-left"], "pose-walk");
assert.equal(metadata.stateBindings?.["running-right"], "pose-walk");
for (const motion of ["run-left", "run-right"]) for (const flipped of [false, true]) assert.equal(resolvePetMediaPlaybackAction(metadata, undefined, motion, flipped, undefined), "pose-walk", "两个移动方向与镜像组合都使用行走动作");
assert.equal(metadata.actions.idle, metadata.actions["pose-stand"]);
assert.ok(metadata.staticActions?.includes("idle"), "单帧待机如实声明为静态姿势");
assert.deepEqual(result.get("img/Shimeji/shime1.png"), red);
assert.equal(result.get("LICENSE.txt")?.toString(), "原许可");
assert.equal(result.get("import-wrapper/README.md")?.toString(), "下载包装层说明");
for (const file of new Set(Object.values(metadata.actions))) await validatePetMediaBytes(result.get(file)!, file, metadata);
const walk = await sharp(result.get(metadata.actions["pose-walk"]!)!, { animated: true }).metadata();
assert.equal(walk.pages, 2);
assert.deepEqual(walk.delay, [240, 240], "只转换原始 Duration，不虚构镜头时长");
for (const page of [0, 1]) {
  const rgba = await sharp(result.get(metadata.actions["pose-walk"]!)!, { page }).ensureAlpha().raw().toBuffer();
  assert.ok(rgba.some((value, index) => index % 4 === 3 && value > 0), "每页都保留可见的角色像素");
}
await assert.rejects(() => convertShimejiPetPackage(new Map([["conf/actions.xml", Buffer.from('<!DOCTYPE x SYSTEM "file:///secret"><Mascot/>')]]), "不能读外部实体"));
await assert.rejects(() => convertShimejiPetPackage(new Map([["conf/actions.xml", Buffer.from(xml.replace("/shime1.png", "../secret.png"))]]), "不能读包外文件"));
await assert.rejects(() => convertShimejiPetPackage(new Map([["conf/actions.xml", Buffer.from(xml.replace('Duration="250"', 'Duration="251"'))]]), "不能静默缩短原始姿势时长"));
console.log("Shimeji 素材转换：真实姿势序列、恒定锚点、原时长、原文件保留、静态声明与 Java/表达式边界通过。");
