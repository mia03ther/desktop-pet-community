import assert from 'node:assert/strict';

const normalize = text => text.replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const mitTerms = normalize(`Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`);

// 验收版权链的内容，不把某一种附件文件名当作桌宠格式要求。
export function validateArchiveAttribution(files, credit) {
  assert.ok(credit.author && credit.source && credit.license, '作品署名信息不完整');
  if (files['SHARE.md']) {
    const notes = files['SHARE.md'].toString('utf8');
    for (const value of [credit.author, credit.source, credit.license]) assert.ok(notes.includes(value), '分享说明缺少作品署名、固定来源或许可');
    return { carrier: 'SHARE.md' };
  }
  assert.ok(files['SOURCE.json'], '归档缺少可核验的作品署名');
  const record = JSON.parse(files['SOURCE.json'].toString('utf8'));
  assert.equal(record.author, credit.author, '归档作者与作品作者不符');
  assert.ok(/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(record.repository), '归档来源必须为明确仓库');
  assert.ok(/^[a-f0-9]{40}$/.test(record.sourceCommit), '归档来源提交未固定');
  assert.equal(`${record.repository}/tree/${record.sourceCommit}`, credit.source, '归档来源与作品固定来源不符');
  assert.equal(record.codeLicense, 'MIT', '该归档证据尚未提供受支持的完整代码许可');
  assert.ok(/\bMIT\b/i.test(credit.license), '作品代码许可与归档许可不符');
  const license = (files.LICENSE ?? files['LICENSE.txt'])?.toString('utf8');
  assert.ok(license && /Copyright[^\n]+\S/.test(license), '归档缺少完整原版权声明');
  const terms = license.match(/Permission is hereby granted[\s\S]*?SOFTWARE\./)?.[0];
  assert.equal(terms && normalize(terms), mitTerms, '归档原MIT正文缺失或不完整');
  const assetScope = files['ASSET-LICENSE-STATUS.txt']?.toString('utf8').trim();
  assert.ok(record.assetLicenseScope && assetScope, '归档缺少独立素材许可范围说明');
  assert.equal(assetScope, record.assetLicenseScope.trim(), '归档素材声明与出处证据不符');
  return { carrier: 'SOURCE.json', codeLicense: record.codeLicense, assetLicenseScope: assetScope };
}
