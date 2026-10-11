import { DatabaseSync } from 'node:sqlite';
import { mkdir, readFile, readdir, writeFile, rename, unlink, stat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { Readable } from 'node:stream';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function objectPath(root, key) {
  if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9._-]+)+$/.test(key) || key.split('/').some(part => part === '.' || part === '..')) throw new Error('存储路径无效。');
  const path = resolve(root, key), inside = relative(root, path);
  if (inside.startsWith('..') || isAbsolute(inside)) throw new Error('存储路径越界。');
  return path;
}

export async function persistentStorage(stateDirectory, migrationsDirectory) {
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
  const objects = resolve(stateDirectory, 'objects'); await mkdir(objects, { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(join(stateDirectory, 'community.sqlite'));
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS host_migrations (name TEXT PRIMARY KEY, sha TEXT NOT NULL)');
  try {
    for (const name of (await readdir(migrationsDirectory)).filter(name => /^\d+[a-zA-Z0-9_-]*\.sql$/.test(name)).sort()) {
      const sql = await readFile(join(migrationsDirectory, name), 'utf8'), hash = sha(sql);
      const existing = sqlite.prepare('SELECT sha FROM host_migrations WHERE name = ?').get(name);
      if (existing) { if (existing.sha !== hash) throw new Error('已应用的数据库迁移发生变化。'); continue; }
      sqlite.exec('BEGIN');
      try { sqlite.exec(sql); sqlite.prepare('INSERT INTO host_migrations VALUES (?, ?)').run(name, hash); sqlite.exec('COMMIT'); }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  } catch (error) { sqlite.close(); throw error; }
  const DB = { prepare(sql) {
    const statement = sqlite.prepare(sql); let values = [];
    return { bind(...bound) { values = bound; return this; }, async first() { return statement.get(...values) ?? null; },
      async all() { return { results: statement.all(...values) }; }, async run() { const meta = statement.run(...values); return { success: true, meta }; } };
  } };
  const BUCKET = {
    async put(key, value) {
      const path = objectPath(objects, key), temporary = `${path}.${randomUUID()}.tmp`;
      await mkdir(resolve(path, '..'), { recursive: true, mode: 0o700 });
      try { await writeFile(temporary, value, { flag: 'wx', mode: 0o600 }); await rename(temporary, path); }
      finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
    },
    async get(key) {
      const path = objectPath(objects, key);
      try { const bytes = await readFile(path); return { body: bytes, size: bytes.length }; }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    async delete(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) await unlink(objectPath(objects, key)).catch(error => { if (error.code !== 'ENOENT') throw error; }); },
  };
  return { DB, BUCKET, close: () => sqlite.close() };
}

const mime = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json; charset=utf-8', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', zip: 'application/zip', mp4: 'video/mp4', webm: 'video/webm', md: 'text/plain; charset=utf-8', txt: 'text/plain; charset=utf-8' };
export async function publicAssets(publicDirectory) {
  // 只把部署包里的公开文件登记为静态资源，持久化档案在另一目录。
  const files = new Map();
  async function collect(directory, prefix = '') {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const validName = entry.isDirectory() ? /^[a-zA-Z0-9_-][a-zA-Z0-9._-]*$/ : /^[\p{L}\p{N}_-][\p{L}\p{N}._-]*$/u;
      if (!validName.test(entry.name)) throw new Error('公开文件名无效。');
      const name = prefix + entry.name, path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('公开目录不能包含符号链接。');
      if (entry.isDirectory()) await collect(path, name + '/');
      else if (entry.isFile() && mime[entry.name.split('.').at(-1)]) files.set('/' + name, { path, type: mime[entry.name.split('.').at(-1)] });
    }
  }
  await collect(publicDirectory); files.set('/', files.get('/index.html'));
  return { async fetch(request) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 });
    const url = new URL(request.url);
    let pathname;
    try { pathname = decodeURI(url.pathname); } catch { return new Response(null, { status: 404 }); }
    const file = files.get(pathname);
    if (!file) return new Response(null, { status: 404 });
    const info = await stat(file.path);
    const headers = { 'content-type': file.type, 'content-length': String(info.size), 'x-content-type-options': 'nosniff', 'cache-control': file.type === 'application/zip' ? 'no-store' : 'public, max-age=300' };
    if (file.type === 'application/zip') headers['content-disposition'] = `attachment; filename="${url.pathname.split('/').at(-1)}"`;
    if (request.method === 'HEAD') return new Response(null, { headers });
    const stream = Readable.toWeb((await import('node:fs')).createReadStream(file.path));
    return new Response(stream, { headers });
  } };
}
