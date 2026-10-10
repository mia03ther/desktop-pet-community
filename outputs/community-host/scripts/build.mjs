import { mkdir, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { build } from '../../community-site/node_modules/esbuild/lib/main.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const canonical = resolve(root, '../desktop-pet/apps/community-web/dist');
const site = resolve(root, '../community-site');
await mkdir(resolve(root, '.build'), { recursive: true });
const publicRoot = resolve(root, 'public');
if (dirname(publicRoot) !== root) throw new Error('构建公开目录越界。');
// 只清理本构建产生的公开副本，历史素材与持久化数据库在其他目录。
await rm(publicRoot, { recursive: true, force: true });
await mkdir(publicRoot, { recursive: true });
const pageNames = ['index.html', 'style.css', 'app.js', 'catalog.js', 'plugin-catalog.js', 'community-data.js', 'community-core.js', 'community-pages.js', 'package-core.js', 'native-package-contract.js', 'plugin-covers.js', 'publication-client.js', 'publication-config.js'];
for (const name of pageNames) await cp(resolve(canonical, name), resolve(publicRoot, name));
const manifest = JSON.parse(await readFile(resolve(canonical, 'gallery-files.json'), 'utf8'));
if (manifest.schemaVersion !== 2 || !Array.isArray(manifest.files)) throw new Error('请先生成带摘要的公开素材清单。');
for (const file of manifest.files) {
  if (!/^assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/.test(file.path)) throw new Error('公开素材路径无效。');
  const bytes = await readFile(resolve(canonical, file.path));
  if (bytes.length !== file.bytes || createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error('公开素材与登记摘要不一致。');
  const target = resolve(publicRoot, file.path); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes);
}
await cp(resolve(canonical, 'gallery-files.json'), resolve(publicRoot, 'gallery-files.json'));
await cp(resolve(site, 'drizzle'), resolve(root, 'drizzle'), { recursive: true });
await cp(resolve(root, '../desktop-pet/LICENSE'), resolve(root, 'LICENSE'));
const pages = {};
for (const name of pageNames) {
  pages['/' + name] = { body: await readFile(resolve(root, 'public', name), 'utf8'), type: name.endsWith('.html') ? 'text/html; charset=utf-8' : name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8' };
}
pages['/'] = pages['/index.html'];
await writeFile(resolve(root, '.build/static-pages.mjs'), `export const pages=${JSON.stringify(pages)};\n`);
await writeFile(resolve(root, '.build/builtin-atlases.mjs'), 'export const builtinAtlases={};\n');
await writeFile(resolve(root, '.build/builtin-packages.mjs'), 'export const builtinPackages={};\n');
await build({ entryPoints: [resolve(site, 'worker/index.js')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: resolve(root, 'server/community-api.mjs'), plugins: [{ name: '独立部署适配', setup(context) {
  context.onResolve({ filter: /^\.\.\/public\// }, args => ({ path: resolve(root, 'public', args.path.slice('../public/'.length)) }));
  context.onResolve({ filter: /^\.\/(?:static-pages|builtin-atlases|builtin-packages)\.js$/ }, args => ({ path: resolve(root, '.build', args.path.slice(2).replace('.js', '.mjs')) }));
} }] });
console.log('独立共创后台已构建，全部公开素材随包，无运行时 GitHub 回源。');
