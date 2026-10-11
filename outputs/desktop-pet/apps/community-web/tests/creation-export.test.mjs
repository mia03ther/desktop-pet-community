import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { prepareWorkPackage, petManifest, videoPetManifest, mediaFileInfo, zipPackage, readZipPackage, inspectImportPackage, attribution, creationImageChecks } from '../dist/package-core.js';
import { validateInstalledPetMetadata, validatePetMediaBytes } from '../../desktop/dist/pet-media-files.js';
import { validateCodexPetSpritesheet } from '../../desktop/dist/codex-pets-core.js';
import { loadLocalPluginSnapshot } from '../../desktop/dist/plugin-local-loader.js';

const require = createRequire(new URL('../../desktop/package.json', import.meta.url));
const sharp = require('sharp');
const encode = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
const input = { id: 'creator.example', title: '我的插件', description: '测试作品', author: '测试作者', license: 'MIT' };
const petInput = { ...input, id: 'creator-pet', displayName: '制作伙伴' };
const manifest = { manifestVersion: 3, runtime: 'javascript', sdkVersion: '3.0.0', entry: 'index.js', id: input.id, name: input.title, version: '1.0.0', permissions: [] };
const nativeFiles = { 'plugin.json': encode(manifest), 'index.js': encode('export default function setup(api) {}'), LICENSE: encode('原许可全文') };
const unzip = async files => readZipPackage(new Uint8Array(await zipPackage(files).arrayBuffer()), async bytes => new Uint8Array(inflateRawSync(bytes)));

test('制作插件导出的ZIP能由真实桌面本地加载器安装，来源可空，原清单与许可保持', async () => {
  assert.equal(attribution(input).source, '');
  const original = { ...nativeFiles, 'plugin.json': encode({ ...manifest, creatorExtension: { untouched: true } }) };
  const restored = await unzip(prepareWorkPackage(original, input, 'plugin', 'plugin-make'));
  const directory = await mkdtemp(join(tmpdir(), 'pet-web-creation-'));
  try {
    const source = join(directory, 'source');
    await mkdir(source);
    for (const [path, bytes] of Object.entries(restored)) { const file = join(source, path); await mkdir(dirname(file), { recursive: true }); await writeFile(file, bytes); }
    const loaded = await loadLocalPluginSnapshot({ sourceFolder: source, userDataPath: join(directory, 'profile') });
    assert.equal(loaded.manifest.id, input.id);
    assert.equal(loaded.manifest.sdkVersion, '3.0.0');
    assert.deepEqual(new Uint8Array(await readFile(join(loaded.installPath, 'LICENSE'))), original.LICENSE);
    assert.deepEqual(new Uint8Array(await readFile(join(loaded.installPath, 'import-source-plugin.json'))), original['plugin.json']);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('制作入口拒绝不符合真实SDK的版本、权限和入口，导入入口仍逐字节归档', () => {
  for (const change of [{ sdkVersion: undefined }, { sdkVersion: '2.0.0' }, { version: 'latest' }, { permissions: ['不存在的权限'] }, { entry: 'entry.ts' }]) {
    const files = { ...nativeFiles, 'plugin.json': encode({ ...manifest, ...change }) };
    assert.throws(() => prepareWorkPackage(files, input, 'plugin', 'plugin-make'));
    const imported = prepareWorkPackage(files, input, 'plugin', 'plugin-import');
    for (const [path, bytes] of Object.entries(files)) assert.deepEqual(imported[path], bytes);
    assert.equal(inspectImportPackage(files, 'plugin').report.level, 'invalid');
  }
  const external = { 'package.json': encode({ name: 'brew', commands: [{ name: 'menu' }] }), 'index.tsx': encode('原宿主代码') };
  assert.throws(() => prepareWorkPackage(external, input, 'plugin', 'plugin-make'));
  assert.deepEqual(prepareWorkPackage(external, input, 'plugin', 'plugin-import')['index.tsx'], external['index.tsx']);
});

test('扩大完整包容量后，制作插件仍拒绝超过宿主边界的清单和入口', () => {
  const oversized = [
    { ...nativeFiles, 'plugin.json': encode({ ...manifest, creatorNotes: '大'.repeat(24 * 1024) }) },
    { ...nativeFiles, 'index.js': new Uint8Array(1024 * 1024 + 1) },
  ];
  for (const files of oversized) {
    assert.throws(() => prepareWorkPackage(files, input, 'plugin', 'plugin-make'));
    assert.deepEqual(prepareWorkPackage(files, input, 'plugin', 'plugin-import').LICENSE, files.LICENSE);
  }
});

test('制作桌宠动作、个性名称与AI映射经真实桌面媒体契约接受，静态WebP不能冒充动作', async () => {
  const raw = Buffer.alloc(16 * 16 * 2 * 4);
  for (let at = 0; at < raw.length; at += 4) { raw[at] = at < raw.length / 2 ? 200 : 40; raw[at + 1] = 80; raw[at + 3] = at % 16 ? 255 : 0; }
  const animated = new Uint8Array(await sharp(raw, { raw: { width: 16, height: 32, channels: 4, pageHeight: 16 } }).webp({ loop: 0, delay: [200, 200] }).toBuffer());
  const metadata = videoPetManifest(petInput, [{ id: 'greeting', displayName: '轻轻问候', category: '互动', file: 'actions/greeting.webp' }], { waving: 'greeting', clicked: 'greeting' }, { mode: 'alpha' });
  const restored = await unzip(prepareWorkPackage({ 'pet.json': JSON.stringify(metadata), 'actions/greeting.webp': animated }, petInput, 'pet', 'pet-make'));
  const accepted = validateInstalledPetMetadata(JSON.parse(new TextDecoder().decode(restored['pet.json'])), petInput.id);
  assert.equal(accepted.stateBindings.clicked, 'greeting');
  assert.equal(accepted.actionDefinitions.greeting.displayName, '轻轻问候');
  await validatePetMediaBytes(Buffer.from(restored['actions/greeting.webp']), 'actions/greeting.webp', accepted);
  assert.deepEqual(creationImageChecks(restored, 'pet'), [{ path: 'actions/greeting.webp', width: 16, height: 16, frames: 2 }]);
  const still = new Uint8Array(await sharp({ create: { width: 16, height: 16, channels: 4, background: 'transparent' } }).webp().toBuffer());
  assert.throws(() => mediaFileInfo(still, 'idle.webp', true));
  const broken = { ...restored, 'actions/greeting.webp': still };
  assert.throws(() => prepareWorkPackage(broken, petInput, 'pet', 'pet-make'));
  assert.deepEqual(prepareWorkPackage(broken, petInput, 'pet', 'pet-import')['actions/greeting.webp'], still);
  assert.throws(() => videoPetManifest(petInput, [{ id: 'idle', displayName: '待机', category: '陪伴', file: 'idle.mp4' }], { review: '不存在' }, { mode: 'chroma', color: '#00ff00' }));
});

test('制作图集ZIP保持真实V2素材，桌面元数据与解码验证通过', async () => {
  const atlas = new Uint8Array(await readFile(new URL('../upstream-pets/iuno--legeling/spritesheet.webp', import.meta.url)));
  const files = prepareWorkPackage({ 'pet.json': JSON.stringify(petManifest(petInput, 2)), 'spritesheet.webp': atlas }, petInput, 'pet', 'pet-make');
  const restored = await unzip(files);
  const accepted = validateInstalledPetMetadata(JSON.parse(new TextDecoder().decode(restored['pet.json'])), petInput.id);
  await validateCodexPetSpritesheet(Buffer.from(restored['spritesheet.webp']), accepted);
  assert.deepEqual(restored['spritesheet.webp'], atlas);
  assert.deepEqual(creationImageChecks(restored, 'pet'), [{ path: 'spritesheet.webp', width: 1536, height: 2288 }]);
});

test('制作视频拒绝伪装后缀，导入原始视频与历史文件不强制修改', () => {
  for (const extension of ['mp4', 'webm', 'webp']) {
    const metadata = videoPetManifest(petInput, [{ id: 'idle', displayName: '待机', category: '陪伴', file: `idle.${extension}` }], {}, { mode: 'chroma', color: '#00ff00' });
    const original = { 'pet.json': encode(metadata), [`idle.${extension}`]: encode('这不是动作视频'), '原说明.txt': encode('原资料') };
    assert.throws(() => prepareWorkPackage(original, petInput, 'pet', 'pet-make'));
    const imported = prepareWorkPackage(original, petInput, 'pet', 'pet-import');
    for (const [path, bytes] of Object.entries(original)) assert.deepEqual(imported[path], bytes);
  }
});
