import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

// 仅允许这批已在冻结 4.0.4 验收中确认原中性格为空的作品。
export const neutralCellAdaptationIds = new Set([
  'chiikawa--godxxy1229', 'clawd--godxxy1229', 'doro--godxxy1229',
  'evanescia-lunar-blossoming--jasdfgh', 'glep--legeling', 'gpt-dragon-girl--legeling',
  'hanako-kun--legeling', 'inori-yuzuriha--legeling', 'kiko--untko', 'maodie--trahex',
  'peach-cat--legeling', 'asuka--masashitoda1', 'hikari-seated--masashitoda1', 'nijika--amia',
]);

export async function validateNeutralCellAdaptation(packageFiles, pet, sourceFiles, { sharp, readZip }) {
  assert.ok(neutralCellAdaptationIds.has(pet.id), '未登记作品不能使用中性格修订例外');
  assert.equal(pet.version, 2);
  const record = pet.atlasAdaptation;
  assert.deepEqual(Object.keys(record).sort(), ['schemaVersion', 'kind', 'sourceCell', 'targetCell', 'frameWidth', 'frameHeight',
    'originalArchive', 'originalArchiveSha256', 'originalSpritesheetSha256', 'adaptedSpritesheetSha256'].sort());
  assert.equal(record.schemaVersion, 1); assert.equal(record.kind, 'codex-v2-empty-neutral-cell');
  assert.deepEqual(record.targetCell, { row: 0, column: 6 });
  assert.deepEqual(Object.keys(record.sourceCell).sort(), ['column', 'row']); assert.equal(record.sourceCell.row, 0);
  assert.ok(Number.isInteger(record.sourceCell.column) && record.sourceCell.column >= 0 && record.sourceCell.column < 6);
  assert.equal(record.frameWidth, 192); assert.equal(record.frameHeight, 208);
  assert.equal(record.originalArchive, 'original/upstream-original.zip');
  assert.deepEqual(JSON.parse(packageFiles['SPRITE-ADAPTATION.json']), record, '包与目录修订记录须完全一致');
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  for (const key of ['originalArchiveSha256', 'originalSpritesheetSha256', 'adaptedSpritesheetSha256']) assert.match(record[key], /^[a-f0-9]{64}$/);
  assert.equal(digest(packageFiles[record.originalArchive]), record.originalArchiveSha256);
  const originalArchive = await readZip(packageFiles[record.originalArchive]);
  assert.deepEqual(Object.keys(originalArchive).sort(), ['pet.json', 'spritesheet.webp', 'submission.json']);
  for (const name of ['pet.json', 'submission.json', 'spritesheet.webp']) assert.deepEqual(originalArchive[name], sourceFiles[name], '嵌套归档须保留原三件字节');
  for (const name of ['pet.json', 'submission.json']) assert.deepEqual(packageFiles[name], sourceFiles[name], '根清单与投稿声明须保持原字节');
  assert.equal(digest(sourceFiles['spritesheet.webp']), record.originalSpritesheetSha256);
  assert.equal(pet.spritesheetSha256, record.originalSpritesheetSha256, '目录仍保留原件 SHA');
  assert.equal(digest(packageFiles['spritesheet.webp']), record.adaptedSpritesheetSha256);
  const decode = async bytes => {
    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([info.width, info.height, info.channels], [1536, 2288, 4]); return data;
  };
  const original = await decode(sourceFiles['spritesheet.webp']), adapted = await decode(packageFiles['spritesheet.webp']);
  const stride = 1536 * 4, targetX = 6 * 192, donorX = record.sourceCell.column * 192;
  let donorVisible = false;
  for (let y = 0; y < 208; y++) {
    const row = y * stride, target = row + targetX * 4, donor = row + donorX * 4;
    for (let x = 0; x < 192; x++) { assert.equal(original[target + x * 4 + 3], 0, '原中性格必须全透明'); if (original[donor + x * 4 + 3]) donorVisible = true; }
    assert.deepEqual(adapted.subarray(target, target + 192 * 4), original.subarray(donor, donor + 192 * 4), '只能复制记录的原待机格');
    assert.deepEqual(adapted.subarray(row, target), original.subarray(row, target), '目标格左侧不得变化');
    assert.deepEqual(adapted.subarray(target + 192 * 4, row + stride), original.subarray(target + 192 * 4, row + stride), '目标格右侧不得变化');
  }
  assert.ok(donorVisible, '不能用全透明原帧作为修订待机');
  assert.ok(adapted.subarray(208 * stride).equals(original.subarray(208 * stride)), '所有其他动作与视线行 RGBA 不得变化');
  assert.ok(packageFiles['SPRITE-ADAPTATION.md']?.toString('utf8').includes('原三件文件'));
}
