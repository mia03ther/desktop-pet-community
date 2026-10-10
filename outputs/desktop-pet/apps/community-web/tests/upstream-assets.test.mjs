import assert from 'node:assert/strict';
import test from 'node:test';
import { assessAssetPermission, assetAttribution } from '../upstream-assets.mjs';

test('标准许可与明确非商业再分发可保存归属，不扩展角色权利', () => {
  for (const statement of ['CC BY-NC 4.0', 'CC BY 4.0', 'MIT License', 'Non-commercial use and redistribution only, with credit to wynn.']) assert.equal(assessAssetPermission(statement).status, 'redistributable');
  const work = { id: 'example', title: '示例', author: '示例作者', upstreamCommit: '固定提交', source: '固定原件地址', assetsLicenseSource: '原声明地址', license: 'CC BY-NC 4.0' };
  const notes = assetAttribution(work);
  assert.ok(notes.includes('https://creativecommons.org/licenses/by-nc/4.0/'));
  assert.ok(notes.includes('示例作者'));
  assert.ok(notes.includes('原件逐字节保留'));
  assert.ok(notes.includes('未独立取得这些权利人的授权证明'));
});

test('个人、本仓库、仅本画廊与未知条款不能冒认本站再分发', () => {
  for (const statement of ['Personal non-commercial fan use', 'CC BY-NC 4.0 for this gallery', 'CC BY-NC 4.0. Non-commercial repository use only.', 'Non-commercial repository redistribution authorized by the creator.', 'Non-commercial personal use only; redistribution and derivatives require permission.']) assert.equal(assessAssetPermission(statement).status, 'restricted');
  for (const statement of ['', 'Unknown license; public upload.', 'Non-commercial use only.']) assert.equal(assessAssetPermission(statement).status, 'not-confirmed');
  assert.throws(() => assetAttribution({ id: 'unknown', license: 'Unknown license' }));
});
