import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
// 与实际预加载构建一致地解析 TypeScript 的 .js 模块引用，避免依赖未登记的源码旁产物。
const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve("vite/package.json"))("esbuild");
const bundled = await build({ entryPoints: [fileURLToPath(new URL("../src/pet-media-player.mjs", import.meta.url))], bundle: true, write: false, platform: "node", format: "esm" });
const { createPetMediaPlayer } = await import("data:text/javascript;base64," + Buffer.from(bundled.outputFiles[0].contents).toString("base64"));
const metadata = { actions: { idle: "idle.mp4" }, background: { mode: "chroma", color: "#13ba2d", tolerance: 70 } };
function harness() {
  const calls = [];
  const video = { videoWidth: 834, videoHeight: 1112, readyState: 4, duration: 10.08, pause() {}, play() { return Promise.resolve(); }, load() {}, removeAttribute() {}, addEventListener() {}, removeEventListener() {} };
  const view = { devicePixelRatio: 2 };
  const rect = { width: 240, height: 260 };
  const canvas = { width: 192, height: 208, dataset: {}, ownerDocument: { defaultView: view, createElement() { return video; } }, getBoundingClientRect() { return rect; } };
  const context = { clearRect() {}, drawImage(...args) { calls.push(args); }, getImageData() { return { data: new Uint8ClampedArray([19, 186, 45, 255, 220, 80, 100, 255]) }; }, putImageData(p) { calls.push([...p.data]); } };
  canvas.getContext = () => context;
  const player = createPetMediaPlayer(canvas, metadata, x => x);
  return { player, canvas, context, rect, view, video, calls };
}
const h = harness();
try {
  h.player.setPaused(false);
  assert.ok(h.canvas.width >= 480, "高分屏与放大桌宠不应仍使用 192 像素画布");
  assert.ok(h.canvas.height >= 520);
  assert.ok(h.canvas.width <= h.video.videoWidth && h.canvas.height <= h.video.videoHeight);
  assert.equal(h.context.imageSmoothingEnabled, true);
  assert.equal(h.context.imageSmoothingQuality, "high");
  const draw = h.calls.find(x => x[0] === h.video);
  assert.ok(Math.abs(draw[3] / draw[4] - 834 / 1112) < 0.00001, "保持原比例");
  assert.equal(draw[2] + draw[4], h.canvas.height, "脚底锚点不变");
  assert.deepEqual(h.calls.at(-1), [19, 186, 45, 0, 220, 80, 100, 255], "去背不改变人物颜色");
  h.player.setPaused(true);
  h.rect.width = 144; h.rect.height = 156; h.view.devicePixelRatio = 1.25;
  h.player.setPaused(false);
  assert.equal(h.canvas.width, 360); assert.equal(h.canvas.height, 390);
  h.player.setPaused(true);
  h.video.videoWidth = 192; h.video.videoHeight = 208;
  h.view.devicePixelRatio = 4; h.rect.width = 240; h.rect.height = 260;
  h.player.setPaused(false);
  assert.equal(h.canvas.width, 192); assert.equal(h.canvas.height, 208);
} finally { h.player.dispose(); }
console.log("视频画质回归：高分屏、放大、跨屏缩放、源分辨率边界、比例、脚底锚点与去背通过。");