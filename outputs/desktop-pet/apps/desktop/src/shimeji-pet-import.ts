import { createHash } from "node:crypto";
import sharp from "sharp";
import { assertLocalPackagePath, rebaseLocalPackageFiles } from "./local-package-files.js";
import { validateMediaPetMetadata, type PetMediaFile } from "./pet-media-contract.js";

interface Pose {
  readonly image: string;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly duration: number;
}
interface Action {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly poses: readonly Pose[];
}

/** 只转换无条件 PNG 姿势序列；不加载 Java、脚本表达式或原行为引擎。 */
export async function convertShimejiPetPackage(input: ReadonlyMap<string, Buffer>, displayName: string): Promise<Map<string, Buffer>> {
  const manifests = [...input.keys()].filter((name) => name === "conf/actions.xml" || name.endsWith("/conf/actions.xml"));
  if (manifests.length !== 1) throw new Error("未找到单个桌宠的 pet.json 或 Shimeji conf/actions.xml。请单独选择作品文件夹。");
  const manifest = manifests[0]!;
  const prefix = manifest.slice(0, -"conf/actions.xml".length);
  const files = rebaseLocalPackageFiles(input, prefix);
  const xmlBytes = files.get("conf/actions.xml")!;
  if (xmlBytes.length > 1024 * 1024) throw new Error("Shimeji 动作 XML 超过 1 MiB。");
  const xml = xmlBytes.toString("utf8");
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error("Shimeji XML 不支持外部实体或 DTD。");
  const actions = parseActions(xml);
  if (!actions.length) throw new Error("此 Shimeji 包没有可转换的无条件 PNG 姿势序列；原生行为需要专用引擎。");
  const firstImage = actions[0]!.poses[0]!.image;
  const imageRoots = [...files.keys()].filter((name) => name.endsWith(`/${firstImage}`) || name === firstImage).map((name) => name.slice(0, -firstImage.length));
  const imageRoot = imageRoots.includes("img/Shimeji/") ? "img/Shimeji/" : imageRoots.length === 1 ? imageRoots[0]! : undefined;
  if (imageRoot === undefined) throw new Error("Shimeji 图像目录缺失或包含多套同名素材，请选择单个角色。");
  const images = new Map<string, { bytes: Buffer; width: number; height: number }>();
  let minimumX = 0;
  let minimumY = 0;
  let maximumX = 0;
  let maximumY = 0;
  for (const action of actions) {
    for (const pose of action.poses) {
      const name = imageRoot + pose.image;
      if (!images.has(name)) {
        const bytes = files.get(name);
        if (!bytes) throw new Error(`Shimeji 缺少姿势图：${name}`);
        const info = await sharp(bytes, { limitInputPixels: 1_048_576, failOn: "error" }).metadata();
        if (info.format !== "png" || !info.width || !info.height || info.width > 1024 || info.height > 1024) throw new Error("Shimeji 姿势必须为不超过 1024×1024 的 PNG。");
        images.set(name, { bytes, width: info.width, height: info.height });
      }
      const image = images.get(name)!;
      minimumX = Math.min(minimumX, -pose.anchorX);
      minimumY = Math.min(minimumY, -pose.anchorY);
      maximumX = Math.max(maximumX, image.width - pose.anchorX);
      maximumY = Math.max(maximumY, image.height - pose.anchorY);
    }
  }
  const scale = Math.min(1, 190 / (maximumX - minimumX), 206 / (maximumY - minimumY));
  const anchorX = (192 - (maximumX - minimumX) * scale) / 2 - minimumX * scale;
  const anchorY = 207 - maximumY * scale;
  const media: Record<string, PetMediaFile> = {};
  const definitions: Record<string, { displayName: string; category: string }> = {};
  const staticActions: string[] = [];
  for (const action of actions) {
    const frames: Buffer[] = [];
    for (const pose of action.poses) {
      const image = images.get(imageRoot + pose.image)!;
      const resized = await sharp(image.bytes).resize({ width: Math.max(1, Math.floor(image.width * scale)), height: Math.max(1, Math.floor(image.height * scale)) }).png().toBuffer();
      frames.push(await sharp({ create: { width: 192, height: 208, channels: 4, background: "transparent" } })
        .composite([{ input: resized, left: Math.max(0, Math.floor(anchorX - pose.anchorX * scale)), top: Math.max(0, Math.floor(anchorY - pose.anchorY * scale)) }]).raw().toBuffer());
    }
    const bytes = await sharp(Buffer.concat(frames), { raw: { width: 192, height: 208 * frames.length, channels: 4, pageHeight: 208 } })
      .webp({ loop: 0, lossless: true, delay: action.poses.map((pose) => Math.max(20, Math.min(10_000, Math.round(pose.duration * 1000 / 25)))) }).toBuffer();
    const file: PetMediaFile = `desktop-pet-actions/${action.id}.webp`;
    if (files.has(file)) throw new Error("Shimeji 包内已有同名转换输出，请使用原始包重新导入。");
    files.set(file, bytes);
    media[action.id] = file;
    definitions[action.id] = { displayName: action.name, category: action.type === "Move" ? "原始移动姿势" : "原始姿势" };
    if (((await sharp(bytes, { animated: true }).metadata()).pages ?? 1) === 1) staticActions.push(action.id);
  }
  const stand = actions.find((action) => action.name.toLowerCase() === "stand") ?? actions[0]!;
  media.idle = media[stand.id]!;
  definitions.idle = { displayName: "待机", category: "状态" };
  if (staticActions.includes(stand.id)) staticActions.push("idle");
  const bindings: Record<string, string> = {};
  const walk = actions.find((action) => action.name.toLowerCase() === "walk");
  const run = actions.find((action) => action.name.toLowerCase() === "run");
  if (walk) bindings["running-left"] = bindings["running-right"] = walk.id;
  if (run) bindings.running = run.id;
  const id = `shimeji-${createHash("sha256").update(xmlBytes).update(files.get(imageRoot + firstImage)!).digest("hex").slice(0, 12)}`;
  const metadata = validateMediaPetMetadata({
    id,
    displayName: displayName.slice(0, 80) || "Shimeji 桌宠",
    description: "由 Shimeji 无条件 PNG 姿势序列转换，原始 XML、图像及许可随包保留。",
    mediaVersion: 1,
    actions: media,
    actionDefinitions: definitions,
    stateBindings: bindings,
    staticActions,
    background: { mode: "alpha" },
    importFormat: "shimeji-pose-sequences",
    importNotes: "仅转换无条件 Animation/Pose 素材，Duration 按 25 fps 换算；不执行 Embedded Java、条件表达式、ActionReference、繁殖、窗口交互或原生移动行为。",
  }, id);
  files.set("pet.json", Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`));
  return files;
}

function parseActions(xml: string): readonly Action[] {
  const actions: Action[] = [];
  let totalPoses = 0;
  for (const match of xml.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<Action\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Action\s*>)/g)) {
    const attributes = parseAttributes(match[1]!);
    if (!["Stay", "Move", "Animate"].includes(attributes.Type ?? "") || !attributes.Name) continue;
    const animations = [...(match[2] ?? "").matchAll(/<Animation\b([^>]*)>([\s\S]*?)<\/Animation\s*>/g)];
    const animation = animations.find((candidate) => parseAttributes(candidate[1]!).Condition === undefined);
    if (!animation) continue;
    const poses: Pose[] = [];
    for (const poseMatch of animation[2]!.matchAll(/<Pose\b([^>]*)\/>/g)) {
      const pose = parseAttributes(poseMatch[1]!);
      const image = pose.Image?.replace(/^\//, "");
      if (!image || !image.toLowerCase().endsWith(".png")) throw new Error("Shimeji Pose 必须引用包内 PNG 图像。");
      assertLocalPackagePath(image);
      const anchor = /^(-?\d+),\s*(-?\d+)$/.exec(pose.ImageAnchor ?? "");
      if (!anchor || !/^\d+$/.test(pose.Duration ?? "")) throw new Error("Shimeji Pose 的锚点与时长必须为常量数值，不执行表达式。");
      const anchorX = Number(anchor[1]);
      const anchorY = Number(anchor[2]);
      const duration = Number(pose.Duration);
      if (Math.abs(anchorX) > 2048 || Math.abs(anchorY) > 2048 || duration < 1 || duration > 250) throw new Error("Shimeji Pose 的锚点或时长超出转换上限（单姿势最多 10 秒）。");
      poses.push({ image, anchorX, anchorY, duration });
      totalPoses += 1;
      if (poses.length > 120 || totalPoses > 2000) throw new Error("Shimeji 姿势序列超过转换上限。");
    }
    if (!poses.length) continue;
    const stem = attributes.Name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9_-]/g, "-").slice(0, 55);
    const id = `pose-${stem || actions.length + 1}`;
    if (actions.some((action) => action.id === id) || actions.length >= 127) throw new Error("Shimeji 动作名称重复或数量超出转换上限。");
    actions.push({ id, name: attributes.Name, type: attributes.Type!, poses });
  }
  return actions;
}

function parseAttributes(text: string): Record<string, string> {
  return Object.fromEntries([...text.matchAll(/([A-Za-z][A-Za-z0-9:_-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [match[1]!, (match[2] ?? match[3] ?? "").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")]));
}
