import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { petManifest, pluginManifest, zipPackage, attribution, shareNotes } from './dist/package-core.js';
import { pets, templates, templateCredit, toolPlugins } from './dist/catalog.js';
import { ZipEntryPathTracker } from '../desktop/dist/zip-safety.js';
import { validatePluginManifest } from '../desktop/dist/plugin-manifest.js';
import { readCatalogPluginManifestFromZip, installCatalogPluginPackage } from '../desktop/dist/plugin-package.js';
import { readLocalPluginSourceManifest } from '../desktop/dist/plugin-local-loader.js';
import { createTestHarness } from '../../packages/sdk/dist/testing.js';
import { sourcePlugins } from './dist/plugin-catalog.js';
import { sourcePluginPackage, sourcePluginLicense } from './source-plugin-packages.mjs';
import { assessAssetPermission } from './upstream-assets.mjs';
import { validateArchiveAttribution } from './package-attribution-check.mjs';
import { readLocalPackageFiles, selectLocalPackageRoot } from '../desktop/dist/local-package-files.js';
import { validateInstalledPetMetadata, validatePetMediaBytes } from '../desktop/dist/pet-media-files.js';

const require = createRequire(new URL('../desktop/package.json', import.meta.url));
const yauzl = require('yauzl');
const sharp = require('sharp');
const { validateCodexPetMetadata, validateCodexPetSpritesheet } = await import(process.env.DESKTOP_PET_NAME_ALIAS_TEST_DIST === '1' ? '../desktop/.name-alias-test-dist/src/codex-pets-core.js' : '../desktop/dist/codex-pets-core.js');

// 仓库中有完整清单的插件都应可从网站下载，避免漏掉未默认安装的社区作品。
const repositoryPluginIds = [];
for (const lane of ['official', 'community']) {
  const laneRoot = new URL(`../../plugins/${lane}/`, import.meta.url);
  for (const folder of await readdir(laneRoot, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    const manifest = JSON.parse(await readFile(new URL(`${folder.name}/openpets.plugin.json`, laneRoot), 'utf8'));
    repositoryPluginIds.push(manifest.id);
  }
}
const downloadableSourceIds = [...toolPlugins, ...sourcePlugins].map(work => work.id);
assert.equal(new Set(downloadableSourceIds).size, downloadableSourceIds.length);
assert.deepEqual(downloadableSourceIds.toSorted(), repositoryPluginIds.toSorted());

// 保护下载产物的真实兼容性：浏览器生成的 ZIP 必须能由桌面使用的解析器读取。
export async function readZip(buffer) {
  const zip = await new Promise((resolve, reject) => yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, archive) => error ? reject(error) : resolve(archive)));
  const entries = {};
  await new Promise((resolve, reject) => {
    zip.on('error', reject);
    zip.on('end', resolve);
    zip.on('entry', entry => {
      zip.openReadStream(entry, (error, stream) => {
        if (error) return reject(error);
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => { entries[entry.fileName] = Buffer.concat(chunks); zip.readEntry(); });
      });
    });
    zip.readEntry();
  });
  return entries;
}

const credits = attribution({ author: '验收示例作者', source: '验收用图集', license: '仅验收' });
const manifest = petManifest({ id: 'test-web-pet', displayName: '网页桌宠', description: '用于下载包兼容验收。' }, 2);
const image = await readFile(new URL('../desktop/assets/default-pet-spritesheet.webp', import.meta.url));
const files = await readZip(Buffer.from(await zipPackage({ 'pet.json': JSON.stringify(manifest), 'spritesheet.webp': image, 'SHARE.md': shareNotes(manifest.displayName, credits, 'pet') }).arrayBuffer()));
const tracker = new ZipEntryPathTracker(true);
Object.keys(files).forEach(name => tracker.accept(name));
const decoded = validateCodexPetMetadata(JSON.parse(files['pet.json']), manifest.id);
await validateCodexPetSpritesheet(files['spritesheet.webp'], decoded);
assert.deepEqual(files['spritesheet.webp'], image);
assert.match(files['SHARE.md'].toString(), /验收示例作者/);

// 保护真实画廊下载契约：每个公开 ZIP 都能解码、安装，并保留对应图集和作者声明。
for (const pet of pets) {
  const cover = await sharp(await readFile(new URL(`./dist/${pet.thumbnail}`, import.meta.url))).metadata();
  assert.equal(cover.format, 'webp');
  assert.equal(cover.width, 192);
  assert.equal(cover.height, 208);
  assert.equal(cover.hasAlpha, true);
  if (pet.distribution === 'standalone') {
    for (const address of [pet.download, ...(pet.secondaryDownloads || []).map(file => file.url)]) {
      const url = new URL(address);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username + url.password, '');
    }
    assert.ok(pet.hostNotice);
    assert.ok(pet.downloadLabel);
    continue;
  }
  let packageFiles;
  if (pet.distribution === 'media' && pet.download.startsWith('https://')) {
    const url = new URL(pet.download);
    assert.equal(url.username + url.password, '');
    assert.ok(pet.archiveSha256?.match(/^[a-f0-9]{64}$/));
    assert.ok(Number.isSafeInteger(pet.archiveBytes) && pet.archiveBytes > 0);
    const manifestBytes = await readFile(new URL(`./dist/${pet.packageManifest}`, import.meta.url));
    const metadata = validateInstalledPetMetadata(JSON.parse(manifestBytes), pet.id);
    packageFiles = { 'pet.json': manifestBytes, 'LICENSE.txt': await readFile(new URL(`./dist/${pet.packageLicense}`, import.meta.url)) };
    for (const [id, file] of Object.entries(metadata.actions)) packageFiles[file] = await readFile(new URL(`./dist/${pet.mediaActions[id].url}`, import.meta.url));
  } else {
    const archiveFiles = await readLocalPackageFiles(fileURLToPath(new URL(`./dist/${pet.download}`, import.meta.url)), { maxBytes: 200 * 1024 * 1024, maxFileBytes: 100 * 1024 * 1024, maxFiles: 1000 });
    packageFiles = Object.fromEntries(selectLocalPackageRoot(archiveFiles, ['pet.json']).files);
  }
  if (pet.distribution === 'media') {
    const metadata = validateInstalledPetMetadata(JSON.parse(packageFiles['pet.json']), pet.id);
    assert.equal(metadata.mediaVersion, 1);
    assert.deepEqual(Object.keys(pet.mediaActions).sort(), Object.keys(metadata.actions).sort());
    for (const [id, file] of Object.entries(metadata.actions)) {
      await validatePetMediaBytes(packageFiles[file], file, metadata);
      assert.deepEqual(packageFiles[file], await readFile(new URL(`./dist/${pet.mediaActions[id].url}`, import.meta.url)));
    }
    assert.ok(Object.keys(packageFiles).some(file => /LICENSE|授权/i.test(file)));
    continue;
  }
  const decodedPet = validateCodexPetMetadata(JSON.parse(packageFiles['pet.json']), pet.id);
  await validateCodexPetSpritesheet(packageFiles['spritesheet.webp'], decodedPet);
  const sheet = await sharp(packageFiles['spritesheet.webp']).metadata();
  assert.equal(sheet.format, 'webp');
  assert.equal(sheet.width, 1536);
  assert.equal(sheet.height, pet.version === 2 ? 2288 : 1872);
  assert.equal(sheet.hasAlpha, true);
  await sharp(packageFiles['spritesheet.webp']).raw().toBuffer();
  assert.deepEqual(packageFiles['spritesheet.webp'], await readFile(new URL(`./dist/${pet.atlas}`, import.meta.url)));
  validateArchiveAttribution(packageFiles, pet);
  if (pet.assetSource) {
    assert.equal(assessAssetPermission(pet.license).status, 'redistributable');
    for (const name of ['pet.json', 'submission.json', 'spritesheet.webp', 'ORIGINAL-ASSETS-LICENSE.md', 'ORIGINAL-REPOSITORY-LICENSE']) assert.deepEqual(packageFiles[name], await readFile(new URL(`./${pet.assetSource}/${name}`, import.meta.url)));
    assert.equal(JSON.parse(packageFiles['submission.json']).author, pet.author);
    assert.equal(packageFiles['ASSET-TERMS.txt'].toString('utf8'), pet.license);
    const attributionNotes = packageFiles['ATTRIBUTION.md'].toString('utf8');
    assert.ok(attributionNotes.includes(pet.author));
    assert.ok(attributionNotes.includes(pet.upstreamCommit));
    assert.ok(attributionNotes.includes(pet.assetsLicenseSource));
    const permission = assessAssetPermission(pet.license);
    if (permission.licenseUrl) assert.ok(attributionNotes.includes(permission.licenseUrl));
    assert.ok(attributionNotes.includes('原件逐字节保留'));
  }
  const thumbnail = await sharp(await readFile(new URL(`./dist/${pet.thumbnail}`, import.meta.url))).metadata();
  assert.equal(thumbnail.width, 192);
  assert.equal(thumbnail.height, 208);
  assert.equal(thumbnail.hasAlpha, true);
}

// 精确公开清单不因dist留存旧素材而自动扩大，摘要和媒体类型对应实际文件。
const gallery = JSON.parse(await readFile(new URL('./dist/gallery-files.json', import.meta.url), 'utf8'));
assert.equal(gallery.schemaVersion, 2);
assert.equal(gallery.publicPets, pets.length);
assert.equal(new Set(gallery.files.map(file => file.path)).size, gallery.files.length);
for (const file of gallery.files) {
  assert.ok(file.path.startsWith('assets/'));
  assert.ok(!file.path.split('/').some(part => part === '..' || part === '.' || !part));
  const bytes = await readFile(new URL(`./dist/${file.path}`, import.meta.url));
  assert.equal(bytes.length, file.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
}
for (const pet of pets) {
  const paths = [pet.atlas, pet.thumbnail, pet.download.startsWith('assets/') ? pet.download : null, pet.packageManifest, pet.packageLicense, ...Object.values(pet.mediaActions || {}).map(entry => entry.url)].filter(Boolean);
  for (const path of paths) assert.ok(gallery.files.some(file => file.path === path));
}
assert.ok(!gallery.files.some(file => file.path === 'assets/hoodie.webp' || file.path === 'assets/deepseek-girl--legeling.zip'));

for (const template of templates) {
  const packageFiles = await readZip(await readFile(new URL(`./dist/assets/${template.id}.zip`, import.meta.url)));
  const checked = validatePluginManifest(JSON.parse(packageFiles['openpets.plugin.json']));
  assert.equal(checked.ok, true);
  assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(`作者：${templateCredit.author}\n`));
}

// 保护可选工具交付：真实 ZIP 可由桌面安装，源码可加载，启动只声明状态并受 SDK 权限控制。
const temporaryParent = resolve(tmpdir());
const installationRoot = await mkdtemp(join(temporaryParent, 'lingyin-tool-'));
try {
  for (const tool of toolPlugins) {
    assert.equal(tool.author, templateCredit.author);
    const zip = await readFile(new URL(`./dist/${tool.download}`, import.meta.url));
    const packageFiles = await readZip(zip);
    const catalogEntry = { id: tool.id, version: tool.version };
    const parsed = await readCatalogPluginManifestFromZip({ catalogEntry, zip });
    assert.equal(parsed.manifest.manifestVersion, 3);
    assert.equal(parsed.manifest.runtime, 'javascript');
    assert.deepEqual(parsed.manifest.permissions, tool.permissions);
    const installed = await installCatalogPluginPackage({ userDataPath: installationRoot, catalogEntry, zip });
    const loaded = await readLocalPluginSourceManifest({ sourceFolder: installed.installPath });
    assert.equal(loaded.manifest.id, tool.id);
    assert.equal(loaded.entryText, packageFiles['index.js'].toString('utf8'));
    assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(tool.hostNotice));
    assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(`作者：${tool.author}\n`));
    const plugin = await import(`data:text/javascript;base64,${packageFiles['index.js'].toString('base64')}`);
    const harness = createTestHarness(plugin.register, { permissions: tool.permissions });
    await harness.start();
    assert.ok(harness.calls.status.length > 0);
    assert.equal(harness.calls.schedules.size, 0);
    assert.equal(harness.calls.savedFiles.length, 0);
    await harness.stop();
    const denied = createTestHarness(plugin.register, { permissions: [] });
    await assert.rejects(denied.start());
    await denied.stop();
  }
  for (const work of sourcePlugins) {
    const zip = await readFile(new URL(`./dist/${work.download}`, import.meta.url));
    assert.equal(createHash('sha256').update(zip).digest('hex'), work.sha256);
    const packageFiles = await readZip(zip);
    const catalogEntry = { id: work.id, version: work.version };
    const parsed = await readCatalogPluginManifestFromZip({ catalogEntry, zip });
    const installed = await installCatalogPluginPackage({ userDataPath: installationRoot, catalogEntry, zip });
    const loaded = await readLocalPluginSourceManifest({ sourceFolder: installed.installPath });
    assert.equal(loaded.manifest.id, work.id);
    assert.equal(loaded.entryText, parsed.entryText);
    assert.deepEqual(loaded.manifest.permissions, work.permissions);
    assert.ok(work.title && !work.title.startsWith('$t:'));
    assert.ok(work.description && !work.description.startsWith('$t:'));
    const sourceRoot = new URL(`../../${work.sourceFolder}/`, import.meta.url);
    assert.equal(packageFiles.LICENSE.toString('utf8'), await sourcePluginLicense(sourceRoot));
    assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(`作者：${work.originalAuthor}\n`));
    assert.equal(work.author, templateCredit.author);
    assert.equal(work.authorRole, 'maintainer');
    assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(`维护者：${work.author}\n`));
    assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(work.hostNotice));
    if (work.requirements) assert.ok(packageFiles['SHARE.md'].toString('utf8').includes(work.requirements));
    for (const [name, bytes] of parsed.declaredFiles) assert.deepEqual(loaded.declaredFiles.get(name), bytes);
  }
  // 同一源目录有私有额外文件时，发布包仍只包含显式声明的运行文件和版权说明。
  const canaryRoot = join(installationRoot, 'source-with-private-files');
  await mkdir(canaryRoot);
  await writeFile(join(canaryRoot, 'openpets.plugin.json'), JSON.stringify({ manifestVersion: 3, id: 'community.package-canary', name: '包边界夹具', version: '1.0.0', runtime: 'javascript', sdkVersion: '3.0.0', entry: 'index.js', permissions: [] }));
  await writeFile(join(canaryRoot, 'index.js'), 'export function register() {}');
  await writeFile(join(canaryRoot, 'config.json'), '不应进入下载的配置');
  await writeFile(join(canaryRoot, 'storage.json'), '不应进入下载的存档');
  const canary = await sourcePluginPackage(canaryRoot, { title: '包边界夹具', author: '验收', source: '验收', license: '验收' }, '原许可全文');
  assert.deepEqual(Object.keys(await readZip(canary.zip)).sort(), ['LICENSE', 'SHARE.md', 'index.js', 'openpets.plugin.json']);
} finally {
  if (!installationRoot.startsWith(`${temporaryParent}${process.platform === 'win32' ? '\\' : '/'}`)) throw new Error('拒绝清理非临时验收目录。');
  await rm(installationRoot, { recursive: true, force: true });
}

for (const reaction of ['waving', '']) {
  const plugin = pluginManifest({ id: 'community.web-test', title: '网页提醒', speech: '休息一下。', everyMinutes: 25, reaction });
  const packageFiles = await readZip(Buffer.from(await zipPackage({ 'openpets.plugin.json': JSON.stringify(plugin), 'SHARE.md': shareNotes(plugin.name, credits, 'plugin') }).arrayBuffer()));
  const checked = validatePluginManifest(JSON.parse(packageFiles['openpets.plugin.json']));
  assert.equal(checked.ok, true);
  assert.equal(plugin.permissions.includes('pet:reaction'), Boolean(reaction));
}
assert.throws(() => petManifest({ id: 'builtin', displayName: '猫', description: '示例' }, 2));
assert.throws(() => pluginManifest({ id: 'openpets.test', title: '示例', speech: '你好', everyMinutes: 25 }));
assert.throws(() => pluginManifest({ id: 'community.test', title: '示例', speech: '你好', everyMinutes: 4 }));
assert.throws(() => zipPackage({ '../private.json': '不应写入' }));
console.log(`${pets.filter(pet => pet.distribution !== 'standalone').length} 个原生桌宠包、${pets.filter(pet => pet.distribution === 'standalone').length} 个原应用下载条目、${templates.length + toolPlugins.length + sourcePlugins.length} 个插件的对应格式、媒体、声明及隐私边界校验通过；原应用安装与AI配置另行验收。`);
