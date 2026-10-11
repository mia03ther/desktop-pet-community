import assert from "node:assert/strict";

import { defaultPetSprite, getConfiguredPreviewSprite } from "../src/reaction-animation-mapping.js";
import { codexV1SpriteLayout, codexV2SpriteLayout } from "../src/codex-pets-core.js";
import { buildPetSpritePreviewModel, defaultPetSpriteLayout, getCatalogPetSpriteLayout } from "../src/renderer/src/pet-preview-state.js";

assert.deepEqual(
  buildPetSpritePreviewModel(defaultPetSpriteLayout, { row: 0, frames: 6 }, true),
  {
    atlasColumns: 8,
    atlasRows: 9,
    row: 0,
    frameColumns: [0, 1, 2, 3, 4, 5],
    animated: true,
  },
  "V1 previews retain the existing six-frame idle animation on the 8x9 atlas",
);

const v2Layout = {
  version: 2,
  frameWidth: 192,
  frameHeight: 208,
  columns: 8,
  rows: 11,
  neutralPose: { row: 0, column: 6 },
} as const;

assert.deepEqual(getCatalogPetSpriteLayout(2), v2Layout, "catalog V2 entries resolve to the shared 8x11 preview layout");
assert.equal(getCatalogPetSpriteLayout(undefined), undefined, "legacy catalog entries retain implicit V1 layout behavior");

assert.deepEqual(
  buildPetSpritePreviewModel(defaultPetSprite, { row: 0, frames: 6 }, true),
  {
    atlasColumns: 8,
    atlasRows: 11,
    row: 0,
    frameColumns: [6],
    animated: false,
  },
  "the bundled Hoodie Cat preview uses the V2 neutral idle cell",
);

assert.deepEqual(
  buildPetSpritePreviewModel(v2Layout, { row: 0, frames: 6 }, true),
  {
    atlasColumns: 8,
    atlasRows: 11,
    row: 0,
    frameColumns: [6],
    animated: false,
  },
  "V2 idle previews show the static neutral frame at row 0, column 6",
);

assert.deepEqual(
  buildPetSpritePreviewModel(v2Layout, { row: 8, frames: 6 }, false),
  {
    atlasColumns: 8,
    atlasRows: 11,
    row: 8,
    frameColumns: [0, 1, 2, 3, 4, 5],
    animated: true,
  },
  "V2 reaction previews retain their normal animated frame range on the 8x11 atlas",
);

// 实际设置快照不得把内置 V2 的空白第七列带入 V1 待机预览。
const v1SettingsSprite = getConfiguredPreviewSprite(codexV1SpriteLayout);
const v1SettingsIdle = buildPetSpritePreviewModel(v1SettingsSprite, v1SettingsSprite.states.idle, true);
assert.equal(v1SettingsIdle.animated, true, "V1 动作设置预览应播放六帧待机，而不是停在 V2 的静止帧");
assert.deepEqual(v1SettingsIdle.frameColumns, [0, 1, 2, 3, 4, 5]);

// 修复 V1 时保留 V2 自己声明的静止姿态。
const v2SettingsSprite = getConfiguredPreviewSprite(codexV2SpriteLayout);
const v2SettingsIdle = buildPetSpritePreviewModel(v2SettingsSprite, v2SettingsSprite.states.idle, true);
assert.equal(v2SettingsIdle.animated, false, "V2 动作设置预览仍使用自身的静止帧");
assert.deepEqual(v2SettingsIdle.frameColumns, [6]);

console.log("Control Center Codex V1/V2 preview behavior passed.");
