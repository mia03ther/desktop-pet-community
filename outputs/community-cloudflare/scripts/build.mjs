import { mkdir, cp, readFile, writeFile, readdir, stat, rm } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from '../../community-site/node_modules/esbuild/lib/main.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
// 前序独立构建只包含登记的公开素材，账号数据库、密钥、草稿不在该目录。
if (dirname(dist) !== root) throw new Error('Cloudflare 构建目录越界。');
await rm(dist, { recursive: true, force: true });
await cp(resolve(root, '../community-host/public'), dist, { recursive: true });
const migrationOutput = resolve(root, 'deployment-migrations');
if (dirname(migrationOutput) !== root) throw new Error('Cloudflare 部署迁移目录越界。');
await rm(migrationOutput, { recursive: true, force: true });
await mkdir(migrationOutput, { recursive: true });
for (const name of ['0000_first_deathstrike.sql', '0001_rainy_patch.sql']) await cp(resolve(root, '../community-host/drizzle', name), resolve(migrationOutput, name));
await cp(resolve(root, 'migrations/0011_anonymous_interactions.sql'), resolve(migrationOutput, '0011_anonymous_interactions.sql'));
await cp(resolve(root, '../community-host/LICENSE'), resolve(root, 'LICENSE'));
// 用户已取消密码登录；旧备用服务的登录控件不进入新部署。
const indexPath = resolve(dist, 'index.html');
await writeFile(indexPath, (await readFile(indexPath, 'utf8')).replace('<script type="module" src="account-client.js"></script>', ''));
await rm(resolve(dist, 'account-client.js'), { force: true });
await build({ entryPoints: [resolve(root, 'worker/index.mjs')], bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, outfile: resolve(dist, '_worker.js') });
await writeFile(resolve(dist, '_routes.json'), JSON.stringify({ version: 1, include: ['/api/*'], exclude: [] }));
await writeFile(resolve(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: same-origin\n/assets/*.zip\n  Content-Disposition: attachment\n');
// 发布与互动状态由原生前端协议处理，不在构建时改写客户端逻辑。
const publicationConfigPath = resolve(dist, 'publication-config.js');
await writeFile(publicationConfigPath, (await readFile(publicationConfigPath, 'utf8')).replace(/export const publicSiteUrl =[^;]*;/, "export const publicSiteUrl = 'https://desktoppet-e9e.pages.dev';"));
const entries = [];
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('公开目录不能含符号链接。');
    if (entry.isDirectory()) { await collect(file); continue; }
    if (!entry.isFile()) continue;
    const bytes = await readFile(file);
    if (bytes.length > 25 * 1024 * 1024) throw new Error('存在超过 Pages 单文件 25 MiB 限制的素材。');
    entries.push({ path: relative(dist, file).replaceAll('\\', '/'), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
}
await collect(dist);
if (entries.length > 1000) throw new Error('超过网页上传的 1000 文件限制，请使用官方 CLI。');
await writeFile(resolve(root, 'build-manifest.json'), JSON.stringify({ builtAt: new Date().toISOString(), mode: 'anonymous-interactions', migrations: ['0000_first_deathstrike.sql', '0001_rainy_patch.sql', '0011_anonymous_interactions.sql'], files: entries, totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0) }, null, 2));
console.log(JSON.stringify({ mode: 'anonymous-interactions', files: entries.length, totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0), largestFile: Math.max(...entries.map(entry => entry.bytes)), workerBytes: (await stat(resolve(dist, '_worker.js'))).size }));
