import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

import { codexV2GazeDeadZonePx, codexV2SpriteLayout, getCodexPetSpriteLayout, getCodexPetSpritePosition, getCodexV2GazeSpritePosition, maxCodexPets, maxCodexSpritesheetBytes, maxCodexThumbnailSourceBytes, mirrorCodexV2GazeIndex, quantizeCodexV2GazeDirection, validateCodexPetMetadata, validateCodexPetSpritesheet } from "../src/codex-pets-core.js";
import { getConfiguredSpriteStates } from "../src/reaction-animation-mapping.js";
import { codexV1Fixture, codexV2Fixture } from "./codex-pet-fixtures.js";

const valid = validateCodexPetMetadata(codexV1Fixture, "aiko");

assert.deepEqual(valid, {
  ...codexV1Fixture,
  spritesheetPath: "spritesheet.webp",
});

const explicitV1 = validateCodexPetMetadata({ ...codexV1Fixture, spriteVersionNumber: 1 }, "aiko");
assert.deepEqual(explicitV1, valid);
assert.equal(getCodexPetSpriteLayout({ spriteVersionNumber: 1 }).rows, 9);

// 原包缺少 displayName 时使用合法 name，校验不能改写原清单。
const legacyNameFixture = {
  id: codexV1Fixture.id,
  name: "  旧版桌宠  ",
  description: codexV1Fixture.description,
  spritesheetPath: codexV1Fixture.spritesheetPath,
};
const originalLegacyJson = JSON.stringify(legacyNameFixture);
assert.deepEqual(validateCodexPetMetadata(legacyNameFixture, "aiko"), { ...valid, displayName: "旧版桌宠" });
assert.equal(JSON.stringify(legacyNameFixture), originalLegacyJson);
assert.equal(validateCodexPetMetadata({ ...legacyNameFixture, displayName: "显式名称", name: 123 }, "aiko").displayName, "显式名称");
assert.equal(validateCodexPetMetadata({ ...legacyNameFixture, spriteVersionNumber: 2 }, "aiko").spriteVersionNumber, 2);
// 显式非法值不能借合法 name 绕过；别名自身也沿用同一类型和长度限制。
for (const invalidName of [undefined, null, 123, false, {}, [], "", "   ", "x".repeat(81)]) {
  assert.throws(() => validateCodexPetMetadata({ ...legacyNameFixture, displayName: invalidName }, "aiko"));
  assert.throws(() => validateCodexPetMetadata({ ...legacyNameFixture, name: invalidName }, "aiko"));
}

assert.throws(() => validateCodexPetMetadata({ id: "other", displayName: "Other", description: "Nope", spritesheetPath: "spritesheet.webp" }, "fixer"));
assert.throws(() => validateCodexPetMetadata({ id: "builtin", displayName: "Built-in", description: "Reserved", spritesheetPath: "spritesheet.webp" }, "builtin"));
assert.throws(() => validateCodexPetMetadata({ id: "bad/id", displayName: "Bad", description: "Bad", spritesheetPath: "spritesheet.webp" }, "bad/id"));
assert.throws(() => validateCodexPetMetadata({ id: "fixer", displayName: "Fixer", description: "Nope", spritesheetPath: "../spritesheet.webp" }, "fixer"));
assert.throws(() => validateCodexPetMetadata({ id: "fixer", displayName: "", description: "Nope", spritesheetPath: "spritesheet.webp" }, "fixer"));

assert.equal(maxCodexSpritesheetBytes, 100 * 1024 * 1024);
assert.equal(maxCodexThumbnailSourceBytes, 24 * 1024 * 1024);
assert.equal(maxCodexPets, 100);

const v2 = validateCodexPetMetadata(codexV2Fixture, "malou");

assert.deepEqual(v2, {
  ...codexV2Fixture,
});
assert.equal(getCodexPetSpriteLayout(valid).rows, 9);
assert.deepEqual(getCodexPetSpriteLayout(v2), codexV2SpriteLayout);
assert.equal(codexV2SpriteLayout.rows, 11);
assert.deepEqual(codexV2SpriteLayout.neutralPose, { row: 0, column: 6 });
const configuredStates = getConfiguredSpriteStates();
assert.deepEqual(getCodexPetSpritePosition(codexV2SpriteLayout, configuredStates.idle, true), { row: 0, startColumn: 6, endColumn: 6, animated: false });
assert.deepEqual(getCodexPetSpritePosition(codexV2SpriteLayout, configuredStates["running-right"]), { row: 1, startColumn: 0, endColumn: 8, animated: true });
assert.deepEqual(getCodexPetSpritePosition(getCodexPetSpriteLayout(valid), configuredStates.idle), { row: 0, startColumn: 0, endColumn: 6, animated: true });

const gazeAnchor = { x: 100, y: 100 };
assert.equal(quantizeCodexV2GazeDirection({ x: 100, y: 50 }, gazeAnchor), 0);
assert.equal(quantizeCodexV2GazeDirection({ x: 150, y: 100 }, gazeAnchor), 4);
assert.equal(quantizeCodexV2GazeDirection({ x: 100, y: 150 }, gazeAnchor), 8);
assert.equal(quantizeCodexV2GazeDirection({ x: 50, y: 100 }, gazeAnchor), 12);
assert.equal(quantizeCodexV2GazeDirection({ x: 150, y: 50 }, gazeAnchor), 2);
assert.equal(quantizeCodexV2GazeDirection({ x: 50, y: 150 }, gazeAnchor), 10);
assert.equal(quantizeCodexV2GazeDirection({ x: 100 + codexV2GazeDeadZonePx, y: 100 }, gazeAnchor), null);
assert.equal(quantizeCodexV2GazeDirection({ x: 100 + codexV2GazeDeadZonePx + 1, y: 100 }, gazeAnchor), 4);
assert.equal(quantizeCodexV2GazeDirection({ x: 100 + 9, y: 100 - 50 }, gazeAnchor), 0);
assert.equal(quantizeCodexV2GazeDirection({ x: 100 + 11, y: 100 - 50 }, gazeAnchor), 1);
for (let index = 0; index < 16; index += 1) {
  assert.deepEqual(getCodexV2GazeSpritePosition(index), index < 8 ? { row: 9, column: index } : { row: 10, column: index - 8 });
}
assert.equal(mirrorCodexV2GazeIndex(0), 0);
assert.equal(mirrorCodexV2GazeIndex(1), 15);
assert.equal(mirrorCodexV2GazeIndex(15), 1);
assert.deepEqual(getCodexV2GazeSpritePosition(1, true), { row: 10, column: 7 });
assert.equal(getCodexV2GazeSpritePosition(16), null);

for (const marker of [3, "1", "2", null, undefined]) {
  const malformed = { ...codexV2Fixture, spriteVersionNumber: marker };
  assert.throws(() => validateCodexPetMetadata(malformed, "malou"), `marker ${String(marker)} must be rejected`);
}

const createAtlas = (width: number, height: number, format: "webp" | "png"): Promise<Buffer> => {
  const image = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });
  return format === "webp" ? image.webp().toBuffer() : image.png().toBuffer();
};

async function runImportContracts(): Promise<void> {
  // Windows 下禁用图片操作缓存，避免已完成预览仍持有夹具文件句柄。
  sharp.cache(false);
  const fixture = await realpath(await mkdtemp(join(tmpdir(), "companion-pet-compat-")));
  const sourceRoot = join(fixture, ".codex", "pets");
  const installedRoot = join(fixture, "installed");
  const statePath = join(fixture, "state.json");
  await Promise.all([sourceRoot, installedRoot].map((directory) => mkdir(directory, { recursive: true, mode: 0o700 })));
  await writeFile(statePath, JSON.stringify({ pets: { installed: [] } }));
  // 仅隔离本机档案与用户目录；素材读取、格式校验和安装事务保持真实。
  const stateMock = `data:text/javascript,${encodeURIComponent(`
    import { readFileSync, writeFileSync } from "node:fs";
    const path = ${JSON.stringify(statePath)};
    export const getAppStateSnapshot = () => JSON.parse(readFileSync(path, "utf8"));
    export function installPetState(pet) {
      const state = getAppStateSnapshot();
      state.pets.installed.push(pet);
      writeFileSync(path, JSON.stringify(state));
      return state;
    }
  `)}`;
  const originalPaths = new URL("../src/pet-paths.js?original", import.meta.url).href;
  const pathsMock = `data:text/javascript,${encodeURIComponent(`
    export { assertSafePetId } from ${JSON.stringify(originalPaths)};
    export const getPetsRoot = () => ${JSON.stringify(installedRoot)};
  `)}`;
  const osMock = `data:text/javascript,${encodeURIComponent(`export const homedir = () => ${JSON.stringify(fixture)};`)}`;
  register(`data:text/javascript,${encodeURIComponent(`
    export async function resolve(specifier, context, nextResolve) {
      if (context.parentURL?.endsWith("/codex-pets.js")) {
        const replacements = { "./app-state.js": ${JSON.stringify(stateMock)}, "./pet-paths.js": ${JSON.stringify(pathsMock)}, "node:os": ${JSON.stringify(osMock)} };
        if (replacements[specifier]) return { url: replacements[specifier], shortCircuit: true };
      }
      return nextResolve(specifier, context);
    }
  `)}`, import.meta.url);
  const { importCodexPet, getCodexPetsUiState } = await import("../src/codex-pets.js");
  const v1Atlas = await createAtlas(1536, 1872, "webp");
  const v2Atlas = await createAtlas(1536, 2288, "webp");
  try {
    const fixtures = [
      { id: "aiko", metadata: { ...codexV1Fixture, spriteVersionNumber: 1 }, expected: valid, atlas: v1Atlas, rows: 9 },
      { id: "malou", metadata: codexV2Fixture, expected: v2, atlas: v2Atlas, rows: 11 },
    ];
    for (const item of fixtures) {
      const source = join(sourceRoot, item.id);
      await mkdir(source);
      await writeFile(join(source, "pet.json"), JSON.stringify(item.metadata));
      await writeFile(join(source, "spritesheet.webp"), item.atlas);
      await importCodexPet(item.id);
      const normalized = JSON.parse(await readFile(join(installedRoot, item.id, "pet.json"), "utf8")) as unknown;
      assert.deepEqual(normalized, item.expected);
      assert.deepEqual(await readFile(join(installedRoot, item.id, "spritesheet.webp")), item.atlas);
      assert.equal((await getCodexPetsUiState()).pets.find((pet) => pet.id === item.id)?.spriteLayout.rows, item.rows);
      assert.deepEqual(JSON.parse(await readFile(join(source, "pet.json"), "utf8")), item.metadata);
    }
    const badId = "bad-version";
    await mkdir(join(sourceRoot, badId));
    await writeFile(join(sourceRoot, badId, "pet.json"), JSON.stringify({ ...codexV1Fixture, id: badId, spriteVersionNumber: "1" }));
    await writeFile(join(sourceRoot, badId, "spritesheet.webp"), v1Atlas);
    const stateBefore = await readFile(statePath);
    await assert.rejects(() => importCodexPet(badId));
    await assert.rejects(() => readFile(join(installedRoot, badId, "pet.json")));
    assert.deepEqual(await readFile(statePath), stateBefore);
  } finally {
    await rm(fixture, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

async function runImageContracts(): Promise<void> {
  const validV2Atlas = await createAtlas(1536, 2288, "webp");
  await validateCodexPetSpritesheet(validV2Atlas, v2);
  await assert.rejects(() => createAtlas(1536, 2080, "webp").then((atlas) => validateCodexPetSpritesheet(atlas, v2)), /exactly 1536x2288/);
  await assert.rejects(() => createAtlas(1536, 2288, "png").then((atlas) => validateCodexPetSpritesheet(atlas, v2)), /must be WebP/);
  const opaqueWebp = await sharp({ create: { width: 1536, height: 2288, channels: 3, background: { r: 0, g: 0, b: 0 } } }).webp().toBuffer();
  await assert.rejects(() => validateCodexPetSpritesheet(opaqueWebp, v2), /must include transparency/);
  const secondV2Frame = await sharp({ create: { width: 1536, height: 2288, channels: 4, background: { r: 1, g: 0, b: 0, alpha: 0.5 } } }).webp().toBuffer();
  const animatedWebp = await sharp([validV2Atlas, secondV2Frame], { join: { animated: true } }).webp({ delay: [100, 100], loop: 0 }).toBuffer();
  await assert.rejects(() => validateCodexPetSpritesheet(animatedWebp, v2), /exactly one image/);
  await assert.rejects(() => validateCodexPetSpritesheet(Buffer.from("not an image"), v2), /metadata is invalid/);
  await validateCodexPetSpritesheet(Buffer.from("not an image"), valid);
  await runImportContracts();
  console.log("Codex pet validation and V2 layout contracts passed.");
}

runImageContracts().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
