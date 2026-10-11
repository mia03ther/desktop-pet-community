import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { inspectPackage, inspectImportPackage, normalizePackageFiles, readZipPackage, safePackagePath, videoPetManifest, zipPackage } from '../dist/package-core.js';
import { templates, toolPlugins } from '../dist/catalog.js';
import { sourcePlugins } from '../dist/plugin-catalog.js';

const encode = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
const inflate = async bytes => new Uint8Array(inflateRawSync(bytes));
const work = { id: 'my-pet', displayName: '小伙伴', description: '一起工作' };

test('自定义视频动作保留名称和种类，状态绑定不要求复制十二个媒体文件', () => {
  const manifest = videoPetManifest(work, [{ id: 'dance', displayName: '转圈', category: '互动', file: 'actions/转圈.mp4' }], { idle: 'dance', jumping: 'dance' }, { mode: 'chroma', color: '#00ff00' });
  assert.equal(manifest.actions.idle, manifest.actions.dance);
  assert.deepEqual(manifest.actionDefinitions.dance, { displayName: '转圈', category: '互动' });
  assert.equal(manifest.stateBindings.jumping, 'dance');
  assert.equal(manifest.spritesheetPath, undefined);
  assert.throws(() => videoPetManifest(work, [{ id: 'a', displayName: '一', category: '陪伴', file: 'a.mp4' }, { id: 'a', displayName: '二', category: '陪伴', file: 'b.mp4' }], {}, { mode: 'chroma', color: '#000000' }));
  assert.throws(() => videoPetManifest(work, [{ id: 'a', displayName: '一', category: '陪伴', file: 'a.mp4' }], {}, { mode: 'alpha' }));
  assert.throws(() => videoPetManifest(work, [{ id: 'a', displayName: '一', category: '陪伴', file: 'a.MP4' }], {}, { mode: 'alpha' }));
  assert.throws(() => videoPetManifest(work, [{ id: 'constructor', displayName: '一', category: '陪伴', file: 'a.webm' }], {}, { mode: 'alpha' }));
});

test('完整包导入保留子目录、Unicode名称、许可证、未知元数据和未声明附属文件', async () => {
  const original = { 'outer/pet.json': encode({ ...work, mediaVersion: 1, actions: { idle: '动作/待机.webm' }, customMetadata: { arbitrary: true } }), 'outer/动作/待机.webm': new Uint8Array([1, 2, 3]), 'outer/LICENSE': encode('原始许可'), 'outer/references/人物.md': encode('角色资料') };
  const zipped = zipPackage(original);
  const files = normalizePackageFiles(await readZipPackage(new Uint8Array(await zipped.arrayBuffer()), inflate));
  assert.deepEqual(Object.keys(files), ['pet.json', '动作/待机.webm', 'LICENSE', 'references/人物.md']);
  assert.deepEqual(files['LICENSE'], original['outer/LICENSE']);
  const info = inspectPackage(files, 'pet');
  assert.equal(info.manifest.customMetadata.arbitrary, true);
  assert.equal(info.fileCount, 4);
  assert.throws(() => inspectPackage({ 'pet.json': files['pet.json'] }, 'pet'));
});

test('清单位于release子目录时，完整分享仍保留父层LICENSE与README', async () => {
  const original = { 'repo/LICENSE': encode('仓库许可全文'), 'repo/README.md': encode('外层作品说明'), 'repo/release/pet.json': encode({ ...work, mediaVersion: 1, actions: { idle: 'idle.mp4' } }), 'repo/release/idle.mp4': new Uint8Array([1, 2, 3]) };
  const files = normalizePackageFiles(await readZipPackage(new Uint8Array(await zipPackage(original).arrayBuffer()), inflate));
  inspectPackage(files, 'pet');
  const exported = await readZipPackage(new Uint8Array(await zipPackage(files).arrayBuffer()), inflate);
  assert.deepEqual(Object.keys(exported), ['LICENSE', 'README.md', 'release/pet.json', 'release/idle.mp4']);
  for (const [name, bytes] of Object.entries(original)) assert.deepEqual(exported[name.slice('repo/'.length)], bytes);
});

test('ZIP拒绝路径穿越、绝对路径、系统设备名、重复名称和损坏数据', async () => {
  for (const name of ['../secrets', '/absolute', 'C:/Users/file', 'a\\b', 'a/../b', 'con.txt', 'a/NUL', 'a//b']) assert.throws(() => safePackagePath(name));
  assert.throws(() => safePackagePath('a/'.repeat(13) + 'b.txt'));
  assert.throws(() => safePackagePath('a'.repeat(241)));
  assert.throws(() => normalizePackageFiles({ 'pet.json': encode('{}'), 'PET.json': encode('{}') }));
  const bytes = new Uint8Array(await zipPackage({ 'data.txt': 'hello' }).arrayBuffer());
  bytes[38] ^= 1;
  await assert.rejects(readZipPackage(bytes, inflate));
  await assert.rejects(readZipPackage(new Uint8Array([1, 2]), inflate));
});

test('浏览器ZIP读取支持真实deflate压缩，不执行包内脚本', async () => {
  const original = new Uint8Array(await zipPackage({ 'index.js': 'throw new Error("不能执行")' }).arrayBuffer());
  const view = new DataView(original.buffer);
  const oldSize = view.getUint32(18, true);
  const dataAt = 30 + view.getUint16(26, true);
  const oldCentral = dataAt + oldSize;
  const compressed = new Uint8Array(deflateRawSync(original.subarray(dataAt, oldCentral)));
  const bytes = new Uint8Array(original.length - oldSize + compressed.length);
  bytes.set(original.subarray(0, dataAt)); bytes.set(compressed, dataAt); bytes.set(original.subarray(oldCentral), dataAt + compressed.length);
  const changed = new DataView(bytes.buffer), central = dataAt + compressed.length, end = bytes.length - 22;
  changed.setUint16(8, 8, true); changed.setUint32(18, compressed.length, true);
  changed.setUint16(central + 10, 8, true); changed.setUint32(central + 20, compressed.length, true); changed.setUint32(end + 16, central, true);
  const files = await readZipPackage(bytes, inflate);
  assert.equal(new TextDecoder().decode(files['index.js']), 'throw new Error("不能执行")');
});

test('SDK插件清单别名识别，未知宿主仅分享，缺少JS入口明确反馈', () => {
  const native = { manifestVersion: 3, runtime: 'javascript', sdkVersion: '3.0.0', version: '1.0.0', permissions: [], entry: 'src/main.js', id: 'author.plugin', name: '插件' };
  assert.match(inspectPackage({ 'plugin.json': encode(native), 'src/main.js': encode('export default {}') }, 'plugin').compatibility, /SDK 3/);
  assert.throws(() => inspectPackage({ 'desktop-pet.plugin.json': encode(native) }, 'plugin'));
  assert.match(inspectPackage({ 'package.json': encode({ name: 'raycast-extension', commands: [] }), 'src/index.tsx': encode('HOST API') }, 'plugin').compatibility, /运行需适配/);
  assert.match(inspectPackage({ 'models/character.model3.json': encode({ Version: 3 }), 'models/texture.png': encode('asset') }, 'pet').compatibility, /仅归档分享/);
  assert.match(inspectPackage({ 'plugin.dll': new Uint8Array([1, 2]) }, 'plugin').compatibility, /仅归档分享/);
});

test('超过旧32MiB的附属原件仍能作为原生插件导入', () => {
  const files = { 'plugin.json': encode({ manifestVersion: 3, runtime: 'javascript', sdkVersion: '3.0.0', version: '1.0.0', permissions: [], entry: 'index.js', id: 'author.large', name: '大插件' }), 'index.js': encode('export default {}'), 'assets/data.bin': new Uint8Array(32 * 1024 * 1024) };
  const normalized = normalizePackageFiles(files);
  assert.equal(inspectPackage(normalized, 'plugin').runtimeWarning, '');
  assert.equal(inspectImportPackage(normalized, 'plugin').report.level, 'native');
  assert.equal(Object.keys(normalized).length, 3);
});

test('高星项目实际Codex Firefly与Raycast brew样本可导入且不改写内容', async () => {
  const root = new URL('./fixtures/import-compatibility/', import.meta.url);
  const pet = Object.fromEntries(await Promise.all(['pet.json', 'submission.json', 'spritesheet.webp'].map(async name => [name, new Uint8Array(await readFile(new URL(`codex-firefly/${name}`, root)))])));
  const info = inspectPackage(pet, 'pet');
  assert.equal(info.manifest.displayName, '流萤');
  assert.equal(info.workInfo.author, 'legeling');
  assert.equal(info.workInfo.license, 'CC BY-NC 4.0');
  assert.equal(info.compatibility, 'WebP 图集包');
  const raycast = { 'package.json': new Uint8Array(await readFile(new URL('raycast-brew/package.json', root))) };
  assert.match(inspectPackage(raycast, 'plugin').compatibility, /其他宿主/);
  const roundTrip = await readZipPackage(new Uint8Array(await zipPackage(pet).arrayBuffer()), inflate);
  for (const [name, bytes] of Object.entries(pet)) assert.deepEqual(roundTrip[name], bytes);
});

test('插件的翻译名称用于作品信息，保留原清单翻译键', () => {
  const files = { 'plugin.json': encode({ manifestVersion: 3, runtime: 'javascript', sdkVersion: '3.0.0', version: '1.0.0', permissions: [], entry: 'index.js', id: 'author.water', name: '$t:plugin.name' }), 'index.js': encode('export default {}'), 'locales/zh-Hans.json': encode({ 'plugin.name': '喝水伙伴' }), 'locales/en.json': encode({ 'plugin.name': 'Water Companion' }) };
  const info = inspectPackage(files, 'plugin');
  assert.equal(info.workInfo.title, '喝水伙伴');
  assert.equal(info.manifest.name, '$t:plugin.name');
});

test('SDK插件缺少图标、sprite、面板或翻译附件时禁止误报兼容，路径穿越也被拒绝', () => {
  const manifest = { manifestVersion: 3, runtime: 'javascript', sdkVersion: '3.0.0', version: '1.0.0', permissions: ['ui:panel'], entry: 'index.js', id: 'author.water', name: '$t:plugin.name', assets: { icons: { water: 'assets/water.svg' }, sprites: { pet: { path: 'assets/pet.webp', frameWidth: 32, frameHeight: 32, frames: 2, durationMs: 200 } } }, panels: { settings: 'panels/settings.html' } };
  const complete = { 'plugin.json': encode(manifest), 'index.js': encode('export default {}'), 'assets/water.svg': encode('<svg/>'), 'assets/pet.webp': new Uint8Array([1]), 'panels/settings.html': encode('<p>设置</p>'), 'locales/en.json': encode({ 'plugin.name': 'Water' }) };
  assert.match(inspectPackage(complete, 'plugin').compatibility, /SDK 3/);
  for (const missing of ['assets/water.svg', 'assets/pet.webp', 'panels/settings.html', 'locales/en.json']) {
    const files = { ...complete }; delete files[missing];
    assert.throws(() => inspectPackage(files, 'plugin'), error => error.message.includes(missing));
  }
  assert.throws(() => inspectPackage({ ...complete, 'plugin.json': encode({ ...manifest, assets: { icons: { water: '../water.svg' } } }) }, 'plugin'));
  assert.throws(() => inspectPackage({ ...complete, 'locales/en.json': encode({ unrelated: 'missing key' }) }, 'plugin'));
  assert.throws(() => inspectPackage({ ...complete, 'locales/en.json': encode({ 'plugin.name': { nested: 'invalid' } }) }, 'plugin'));
});

test('插件广场所有真实下载包均包含网页要求的声明附件及回退翻译', async () => {
  const works = [...toolPlugins, ...sourcePlugins, ...templates.map(work => ({ ...work, download: `assets/${work.id}.zip` }))];
  for (const work of works) {
    const bytes = new Uint8Array(await readFile(new URL(`../dist/${work.download}`, import.meta.url)));
    const files = normalizePackageFiles(await readZipPackage(bytes, inflate));
    assert.doesNotThrow(() => inspectPackage(files, 'plugin'), work.id);
  }
});

test('实际Shimeji XML与PNG素材无需伪造JSON即可完整归档，明确Java行为边界', async () => {
  const root = new URL('./fixtures/import-compatibility/shimeji-default/', import.meta.url);
  const files = Object.fromEntries(await Promise.all(['conf/actions.xml', 'conf/behaviors.xml', 'img/Shimeji/shime1.png'].map(async name => [name, new Uint8Array(await readFile(new URL(name, root)))])));
  const info = inspectPackage(files, 'pet');
  assert.match(info.compatibility, /Shimeji.*Java/);
  assert.equal(info.fileCount, 3);
  const roundTrip = await readZipPackage(new Uint8Array(await zipPackage(files).arrayBuffer()), inflate);
  assert.deepEqual(roundTrip['conf/actions.xml'], files['conf/actions.xml']);
});
