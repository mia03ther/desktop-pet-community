import { DatabaseSync } from 'node:sqlite';
import { readFile, readdir } from 'node:fs/promises';

// 仅供本机测试：真正执行发布版本迁移和 SQL，不替代产品的 D1/R2。
export async function localStorage() {
  const sqlite = new DatabaseSync(':memory:');
  const migrations = new URL('../../drizzle/', import.meta.url);
  for (const name of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    sqlite.exec(await readFile(new URL(name, migrations), 'utf8'));
  }
  const db = {
    failInsert: false,
    insertThenThrow: false,
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let values = [];
      return {
        bind(...bound) { values = bound; return this; },
        async first() { return statement.get(...values) ?? null; },
        async all() { return { results: statement.all(...values) }; },
        async run() {
          if (db.failInsert && sql.startsWith('INSERT')) throw new Error('测试数据库写入失败');
          const meta = statement.run(...values);
          if (db.insertThenThrow && sql.startsWith('INSERT')) throw new Error('测试数据库已提交但响应丢失');
          return { success: true, meta };
        },
      };
    },
  };
  const objects = new Map();
  const bucket = {
    failOn: null,
    putThenThrow: false,
    writes: 0,
    async put(key, value, options) {
      if (bucket.failOn && key.endsWith(bucket.failOn)) throw new Error('测试对象存储写入失败');
      objects.set(key, { bytes: new Uint8Array(value).slice(), options });
      bucket.writes++;
      if (bucket.putThenThrow && key.endsWith('/package.zip')) throw new Error('测试对象已写入但响应丢失');
    },
    async get(key) {
      const object = objects.get(key);
      return object ? { body: object.bytes.slice(), size: object.bytes.length } : null;
    },
    async delete(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key); },
  };
  return { env: { DB: db, BUCKET: bucket }, db, bucket, objects, close: () => sqlite.close() };
}

export async function readFixtureDirectory(directory) {
  const files = {};
  async function visit(current, prefix) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const name = prefix + entry.name;
      const path = new URL(encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : ''), current);
      if (entry.isDirectory()) await visit(path, name + '/');
      else if (entry.isFile()) files[name] = new Uint8Array(await readFile(path));
    }
  }
  await visit(directory, '');
  return files;
}
