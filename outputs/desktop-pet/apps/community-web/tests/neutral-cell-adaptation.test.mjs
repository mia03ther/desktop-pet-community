import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { validateNeutralCellAdaptation } from '../neutral-cell-adaptation-check.mjs';

const require = createRequire(new URL('../../desktop/package.json', import.meta.url));
const sharp = require('sharp');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function fixture() {
  const raw = Buffer.alloc(1536 * 2288 * 4);
  // 保留一处原待机内容和另一动作内容，验证修补不能触及后者。
  raw.set([40, 80, 120, 255], (20 * 1536 + 30) * 4);
  raw.set([90, 30, 20, 255], (500 * 1536 + 30) * 4);
  const fixed = Buffer.from(raw); fixed.set([40, 80, 120, 255], (20 * 1536 + 1152 + 30) * 4);
  const encode = data => sharp(data, { raw: { width: 1536, height: 2288, channels: 4 } }).webp({ lossless: true }).toBuffer();
  const original = await encode(raw), adapted = await encode(fixed), archive = Buffer.from('夹具嵌套归档');
  const sourceFiles = { 'pet.json': Buffer.from('{"id":"chiikawa--godxxy1229"}'), 'submission.json': Buffer.from('原作者声明'), 'spritesheet.webp': original };
  const record = { schemaVersion: 1, kind: 'codex-v2-empty-neutral-cell', sourceCell: { row: 0, column: 0 }, targetCell: { row: 0, column: 6 },
    frameWidth: 192, frameHeight: 208, originalArchive: 'original/upstream-original.zip', originalArchiveSha256: digest(archive),
    originalSpritesheetSha256: digest(original), adaptedSpritesheetSha256: digest(adapted) };
  const files = { ...sourceFiles, 'spritesheet.webp': adapted, [record.originalArchive]: archive,
    'SPRITE-ADAPTATION.json': Buffer.from(JSON.stringify(record)), 'SPRITE-ADAPTATION.md': Buffer.from('原三件文件完整留档') };
  const pet = { id: 'chiikawa--godxxy1229', version: 2, spritesheetSha256: digest(original), atlasAdaptation: record };
  const dependencies = { sharp, readZip: async () => sourceFiles };
  return { files, pet, sourceFiles, dependencies, fixed, encode };
}

test('精确空格复制通过，未登记作品和清单额外字段不能获得原件例外', async () => {
  const value = await fixture();
  await validateNeutralCellAdaptation(value.files, value.pet, value.sourceFiles, value.dependencies);
  await assert.rejects(validateNeutralCellAdaptation(value.files, { ...value.pet, id: 'other-work' }, value.sourceFiles, value.dependencies), /未登记/);
  const invalid = { ...value.pet, atlasAdaptation: { ...value.pet.atlasAdaptation, arbitraryOverride: true } };
  await assert.rejects(validateNeutralCellAdaptation(value.files, invalid, value.sourceFiles, value.dependencies));
});

test('即使更新修订 SHA，修改其他动作像素仍被拒绝', async () => {
  const value = await fixture();
  value.fixed.set([5, 6, 7, 255], (500 * 1536 + 31) * 4);
  value.files['spritesheet.webp'] = await value.encode(value.fixed);
  value.pet.atlasAdaptation.adaptedSpritesheetSha256 = digest(value.files['spritesheet.webp']);
  value.files['SPRITE-ADAPTATION.json'] = Buffer.from(JSON.stringify(value.pet.atlasAdaptation));
  await assert.rejects(validateNeutralCellAdaptation(value.files, value.pet, value.sourceFiles, value.dependencies), /其他动作与视线/);
});

test('原三件和根作者声明必须保持字节，原中性格有内容时不能修补', async () => {
  const value = await fixture();
  const changedStatement = { ...value.files, 'submission.json': Buffer.from('改过的作者声明') };
  await assert.rejects(validateNeutralCellAdaptation(changedStatement, value.pet, value.sourceFiles, value.dependencies), /根清单与投稿声明/);
  const changedArchive = { ...value.dependencies, readZip: async () => ({ ...value.sourceFiles, 'pet.json': Buffer.from('{}') }) };
  await assert.rejects(validateNeutralCellAdaptation(value.files, value.pet, value.sourceFiles, changedArchive), /原三件字节/);
  value.sourceFiles['spritesheet.webp'] = value.files['spritesheet.webp'];
  value.pet.atlasAdaptation.originalSpritesheetSha256 = digest(value.sourceFiles['spritesheet.webp']);
  value.pet.spritesheetSha256 = value.pet.atlasAdaptation.originalSpritesheetSha256;
  value.files['SPRITE-ADAPTATION.json'] = Buffer.from(JSON.stringify(value.pet.atlasAdaptation));
  await assert.rejects(validateNeutralCellAdaptation(value.files, value.pet, value.sourceFiles, value.dependencies), /全透明/);
});
