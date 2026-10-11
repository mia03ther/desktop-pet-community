import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { pets } from '../tests/fixtures/catalog.js';

// 历史服务的回归夹具复用当前公开构建素材，不读取部署账号配置。
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = resolve(root, '../desktop-pet/apps/community-web/dist');
const publicRoot = resolve(root, 'public');
const clientRoot = resolve(root, 'dist/client');
const pageNames = ['index.html', 'style.css', 'app.js', 'catalog.js', 'plugin-catalog.js', 'community-data.js', 'community-core.js', 'community-pages.js', 'locale.js', 'locale-messages.js', 'package-core.js', 'native-package-contract.js', 'plugin-covers.js', 'publication-client.js', 'publication-config.js', 'catalog-management.js', 'admin.html', 'admin.js', 'admin.css'];
await mkdir(publicRoot, { recursive: true });
for (const name of pageNames) await cp(resolve(canonical, name), resolve(publicRoot, name));
await cp(resolve(root, 'tests/fixtures/catalog.js'), resolve(publicRoot, 'catalog.js'));
const { pets: currentPets } = await import('../../desktop-pet/apps/community-web/dist/catalog.js');
const originals = JSON.parse(await readFile(resolve(root, 'tests/fixtures/builtin-packages.json'), 'utf8'));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function preparePet(pet) {
  for (const path of [pet.atlas, pet.download, pet.thumbnail]) {
    if (!/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(path)) throw new Error('历史公开素材路径无效。');
    await mkdir(dirname(resolve(publicRoot, path)), { recursive: true });
  }
  const expected = originals['/' + pet.download];
  const current = currentPets.find(item => item.id === pet.id);
  const existing = current?.atlas ? resolve(canonical, current.atlas) : pet.id === 'hoodie-cat-openpets' ? resolve(root, '../desktop-pet/apps/desktop/assets/default-pet-spritesheet.webp') : null;
  let atlas = await readFile(resolve(publicRoot, pet.atlas)).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if ((!atlas || sha(atlas) !== expected.atlasSha256) && existing) atlas = await readFile(existing).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (!atlas || sha(atlas) !== expected.atlasSha256) {
    if (!/^https:\/\/raw\.githubusercontent\.com\/legeling\/awesome-codex-pet\/[a-f0-9]{40}\/pets\/[a-z0-9-]+\/spritesheet\.webp$/.test(expected.sourceUrl)) throw new Error(`固定素材地址无效：${pet.id}`);
    const response = await fetch(expected.sourceUrl, { redirect: 'error', signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`固定素材下载失败：${pet.id} ${response.status}`);
    atlas = Buffer.from(await response.arrayBuffer());
  }
  if (atlas.length !== expected.atlasSize || sha(atlas) !== expected.atlasSha256) throw new Error(`固定素材摘要不一致：${pet.id}`);
  const archive = Buffer.concat([Buffer.from(expected.prefix, 'base64'), atlas, Buffer.from(expected.suffix, 'base64')]);
  if (archive.length !== expected.size || sha(archive) !== expected.sha256) throw new Error(`原下载包摘要不一致：${pet.id}`);
  await writeFile(resolve(publicRoot, pet.atlas), atlas);
  await writeFile(resolve(publicRoot, pet.download), archive);
  await cp(resolve(root, 'tests/fixtures/thumbnails', pet.id + '.webp'), resolve(publicRoot, pet.thumbnail));
}
for (let index = 0; index < pets.length; index += 4) await Promise.all(pets.slice(index, index + 4).map(preparePet));
await cp(publicRoot, clientRoot, { recursive: true });
const atlases = {}, packages = {};
const sources = JSON.parse(await readFile(resolve(root, 'tests/fixtures/builtin-pet-sources.json'), 'utf8'));
for (const pet of pets) {
  const archive = await readFile(resolve(publicRoot, pet.download)), original = await readFile(resolve(publicRoot, pet.atlas));
  atlases[`/${pet.atlas}`] = { zip: `/${pet.download}`, filename: 'spritesheet.webp', sha256: sha(original), size: original.length, packageSha256: sha(archive), packageSize: archive.length };
  const source = sources[pet.id];
  if (source) {
    const expectedUrl = `https://raw.githubusercontent.com/legeling/awesome-codex-pet/${source.commit}/pets/${pet.id}/spritesheet.webp`;
    if (!/^[a-f0-9]{40}$/.test(source.commit) || source.url !== expectedUrl || source.sha256 !== sha(original) || source.size !== original.length) throw new Error(`固定原件不一致：${pet.id}`);
    const offset = archive.indexOf(original);
    if (offset < 0 || archive.indexOf(original, offset + 1) !== -1) throw new Error(`原包图集位置不唯一：${pet.id}`);
    packages[`/${pet.download}`] = { sourceUrl: source.url, atlasSha256: source.sha256, atlasSize: source.size, prefix: archive.subarray(0, offset).toString('base64'), suffix: archive.subarray(offset + original.length).toString('base64'), sha256: sha(archive), size: archive.length };
    await rm(resolve(clientRoot, pet.download), { force: true });
  }
  await rm(resolve(clientRoot, pet.atlas), { force: true });
}
const pages = {};
for (const name of pageNames) pages[`/${name}`] = { body: await readFile(resolve(publicRoot, name), 'utf8'), type: name.endsWith('.html') ? 'text/html; charset=utf-8' : name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8' };
pages['/'] = pages['/index.html'];
for (const [name, key, data] of [['builtin-atlases', 'builtinAtlases', atlases], ['builtin-packages', 'builtinPackages', packages], ['static-pages', 'pages', pages]]) {
  await writeFile(resolve(root, `worker/${name}.js`), `export const ${key} = ${JSON.stringify(data)};\n`);
}
await mkdir(resolve(root, '../../work'), { recursive: true });
console.log('已准备历史服务的公开目录、原件摘要与回归夹具。');
