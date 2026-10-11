import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateArchiveAttribution } from '../package-attribution-check.mjs';

const credit = { author: '示例作者', source: 'https://github.com/example/desktop-pet/tree/' + 'a'.repeat(40), license: '代码 MIT；美术范围另列' };
const license = await readFile(new URL('../../../LICENSE', import.meta.url));
const record = { author: credit.author, repository: 'https://github.com/example/desktop-pet', sourceCommit: 'a'.repeat(40), codeLicense: 'MIT', assetLicenseScope: '美术未提供独立授权声明，保留原角色与原声明。' };
const sourceFiles = () => ({ 'SOURCE.json': Buffer.from(JSON.stringify(record)), LICENSE: license, 'ASSET-LICENSE-STATUS.txt': Buffer.from(record.assetLicenseScope) });

test('完整出处与许可附件可使用来源JSON，保持原包无需改名补文件', () => {
  assert.equal(validateArchiveAttribution(sourceFiles(), credit).carrier, 'SOURCE.json');
});
test('旧分享说明仍核作者、固定来源及许可', () => {
  assert.equal(validateArchiveAttribution({ 'SHARE.md': Buffer.from(Object.values(credit).join('\n')) }, credit).carrier, 'SHARE.md');
  assert.throws(() => validateArchiveAttribution({ 'SHARE.md': Buffer.from('只有作品标题') }, credit));
});
test('缺署名或固定来源不符的归档不能通过发布验收', () => {
  assert.throws(() => validateArchiveAttribution({ LICENSE: license }, credit));
  for (const changed of [{ author: '' }, { sourceCommit: 'main' }, { repository: 'https://github.com/other/desktop-pet' }]) {
    assert.throws(() => validateArchiveAttribution({ ...sourceFiles(), 'SOURCE.json': Buffer.from(JSON.stringify({ ...record, ...changed })) }, credit));
  }
});
test('缺原MIT正文或仅保留许可名称的归档不能通过发布验收', () => {
  const files = sourceFiles(); delete files.LICENSE;
  assert.throws(() => validateArchiveAttribution(files, credit));
  assert.throws(() => validateArchiveAttribution({ ...files, LICENSE: Buffer.from('MIT License\nCopyright (c) 示例作者') }, credit));
});
test('缺素材许可范围或改写素材范围的归档不能通过发布验收', () => {
  const files = sourceFiles(); delete files['ASSET-LICENSE-STATUS.txt'];
  assert.throws(() => validateArchiveAttribution(files, credit));
  assert.throws(() => validateArchiveAttribution({ ...sourceFiles(), 'ASSET-LICENSE-STATUS.txt': Buffer.from('全部美术自动MIT') }, credit));
});
