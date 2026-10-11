import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { addWorkInformation, coverImageType, inspectImportPackage, normalizePackageFiles, readZipPackage, zipPackage, packageWorkFields } from '../dist/package-core.js';

const encode = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
const image = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=', 'base64'));
const manifest = { manifestVersion: 3, runtime: 'javascript', sdkVersion: '3.0.0', entry: 'index.js', id: 'creator.example', name: '示例插件', version: '1.0.0', permissions: [] };
const files = { 'plugin.json': encode(manifest), 'index.js': encode('throw new Error("静态检查不得执行")'), LICENSE: encode('原许可') };
const input = { id: 'creator.example', title: '卡片封面示例', description: '保留原插件逻辑' };
const credit = { author: '测试作者', source: '测试作品', license: 'MIT' };

test('导入新项目替换旧作品信息，未声明来源保持空白；制作入口保留手填字段', () => {
  const old = { id: 'old.water', title: '喝水提醒', description: '旧简介', author: '旧作者', source: '旧来源', license: '旧许可' };
  const incoming = { id: 'brew', title: 'Brew', description: '新简介', author: '新作者' };
  assert.deepEqual(packageWorkFields(old, incoming, true), { ...incoming, source: '', license: '' });
  assert.deepEqual(packageWorkFields(old, incoming, false), old);
  assert.equal(packageWorkFields({}, { title: '$t:unresolved' }, true).title, '');
});

test('插件卡片封面与作品信息完整入包、ZIP再次导入后恢复，原清单和代码字节不改', async () => {
  const cover = { bytes: image, path: 'community-cover/card.png' };
  const shared = addWorkInformation(files, input, 'plugin', credit, cover, '2026-10-09T00:00:00Z');
  const restored = normalizePackageFiles(await readZipPackage(new Uint8Array(await zipPackage(shared).arrayBuffer()), async bytes => new Uint8Array(inflateRawSync(bytes))));
  const info = inspectImportPackage(restored, 'plugin');
  assert.equal(info.report.level, 'native');
  assert.equal(info.report.inspection, 'static');
  assert.equal(info.workInfo.title, input.title);
  assert.equal(info.cover.path, cover.path);
  assert.deepEqual(info.cover.bytes, image);
  for (const [name, bytes] of Object.entries(files)) assert.deepEqual(restored[name], bytes);
  const second = addWorkInformation(restored, { ...input, title: '更新作品信息' }, 'plugin', credit, { ...info.cover, bytes: info.cover.bytes.slice() });
  assert.equal(inspectImportPackage(second, 'plugin').workInfo.title, '更新作品信息');
  assert.ok(second['WORK-INFO.json']); assert.ok(second['WORK-INFO-2.json']);
  const removed = addWorkInformation(second, input, 'plugin', credit, null);
  assert.equal(inspectImportPackage(removed, 'plugin').cover, null);
  assert.deepEqual(removed[cover.path], image);
});

test('封面只允许有界图片格式，拒绝脚本、伪装后缀、路径冲突与大文件', () => {
  assert.deepEqual(coverImageType(image), { extension: 'png', mime: 'image/png' });
  assert.throws(() => coverImageType(encode('<svg onload="alert(1)"/>')));
  assert.throws(() => coverImageType(new Uint8Array(10 * 1024 * 1024 + 1)));
  assert.throws(() => addWorkInformation(files, input, 'plugin', credit, { bytes: image, path: 'cover.jpg' }));
  assert.throws(() => addWorkInformation(files, input, 'plugin', credit, { bytes: image, path: '../cover.png' }));
  assert.throws(() => addWorkInformation({ ...files, 'cover.png': encode('原附件') }, input, 'plugin', credit, { bytes: image, path: 'cover.png' }));
});

test('缺附件不假报原生，仍可保留原格式归档；附属文件不再受旧 32 MiB 安装上限限制', () => {
  const missing = inspectImportPackage({ 'plugin.json': encode(manifest) }, 'plugin');
  assert.equal(missing.report.level, 'invalid');
  assert.equal(missing.report.capabilities.archive, true);
  assert.equal(missing.report.capabilities.originalLogic, false);
  assert.match(missing.report.reasons[0], /index.js/);
  const large = inspectImportPackage({ ...files, 'data.bin': new Uint8Array(32 * 1024 * 1024) }, 'plugin');
  assert.equal(large.report.level, 'native');
  assert.equal(large.report.capabilities.configuration, true);
});

test('实际Raycast与Shimeji仅静态判断，原宿主逻辑不可执行或绑定，原文件可归档', async () => {
  const root = new URL('./fixtures/import-compatibility/', import.meta.url);
  const raycast = inspectImportPackage({ 'package.json': new Uint8Array(await readFile(new URL('raycast-brew/package.json', root))) }, 'plugin');
  assert.equal(raycast.report.level, 'external');
  assert.equal(raycast.report.format, 'Raycast');
  assert.equal(raycast.report.capabilities.originalLogic, false);
  const shimeji = inspectImportPackage({ 'conf/actions.xml': new Uint8Array(await readFile(new URL('shimeji-default/conf/actions.xml', root))), 'img/Shimeji/shime1.png': image }, 'pet');
  assert.equal(shimeji.report.level, 'partial');
  assert.equal(shimeji.report.capabilities.actions, false);
  assert.equal(shimeji.report.capabilities.aiBindings, false);
  assert.match(shimeji.report.reasons.join(' '), /原逻辑仍需专用引擎/);
});

test('嵌套单件作品识别且父层许可保留，多件作品不默选为原生兼容', () => {
  const nested = { LICENSE: encode('父层许可'), 'release/pet.json': encode({ id: 'a', displayName: '伙伴', description: '原包描述', mediaVersion: 1, actions: { idle: 'idle.webm' }, background: { mode: 'alpha' } }), 'release/idle.webm': new Uint8Array([1]) };
  const one = inspectImportPackage(nested, 'pet');
  assert.equal(one.report.level, 'native');
  assert.equal(one.assetPrefix, 'release/');
  assert.equal(Object.keys(nested).length, 3);
  const many = inspectImportPackage({ ...nested, 'other/pet.json': nested['release/pet.json'], 'other/idle.webm': nested['release/idle.webm'] }, 'pet');
  assert.equal(many.report.level, 'invalid');
  assert.equal(many.report.capabilities.originalLogic, false);
  assert.match(many.report.reasons.join(' '), /多个作品目录/);
});
