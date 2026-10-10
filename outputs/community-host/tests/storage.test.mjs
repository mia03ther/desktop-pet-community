import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { persistentStorage, publicAssets } from '../server/storage.mjs';

test('真实磁盘数据库与原文件在服务重启后仍可回读，迁移不能悄悄改写', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pet-host-storage-'));
  const migrations = join(root, 'migrations'); await mkdir(migrations);
  const sql = 'CREATE TABLE works (id TEXT PRIMARY KEY, title TEXT NOT NULL);';
  await writeFile(join(migrations, '0000_init.sql'), sql);
  let storage;
  try {
    storage = await persistentStorage(join(root, 'state'), migrations);
    await storage.DB.prepare('INSERT INTO works VALUES (?, ?)').bind('a', '桌宠').run();
    const original = new Uint8Array([1, 2, 3, 255]);
    await storage.BUCKET.put('pets/a/package.zip', original);
    await assert.rejects(storage.BUCKET.put('pets/../../private', original));
    storage.close(); storage = await persistentStorage(join(root, 'state'), migrations);
    assert.equal((await storage.DB.prepare('SELECT title FROM works WHERE id = ?').bind('a').first()).title, '桌宠');
    assert.deepEqual(new Uint8Array((await storage.BUCKET.get('pets/a/package.zip')).body), original);
    await storage.BUCKET.delete(['pets/a/package.zip']); assert.equal(await storage.BUCKET.get('pets/a/package.zip'), null);
    storage.close(); storage = null;
    await writeFile(join(migrations, '0000_init.sql'), sql + '\n-- 不应更改旧迁移');
    await assert.rejects(persistentStorage(join(root, 'state'), migrations), /迁移发生变化/);
  } finally { storage?.close(); await rm(root, { recursive: true, force: true }); }
});

test('所有随包公开文件可读取，文件档案与穿越路径不公开，HEAD不返回正文', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pet-host-public-'));
  try {
    await mkdir(join(root, 'public/assets/pets'), { recursive: true });
    await writeFile(join(root, 'private.txt'), '私人资料');
    await writeFile(join(root, 'public/index.html'), '共创平台');
    await writeFile(join(root, 'public/assets/pets/new.webp'), new Uint8Array([1, 2]));
    const assets = await publicAssets(join(root, 'public'));
    const url = 'https://example.test';
    const image = await assets.fetch(new Request(url + '/assets/pets/new.webp')); assert.equal(image.status, 200);
    assert.deepEqual(new Uint8Array(await image.arrayBuffer()), new Uint8Array([1, 2]));
    const head = await assets.fetch(new Request(url + '/assets/pets/new.webp', { method: 'HEAD' })); assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
    for (const path of ['/private.txt', '/state/community.sqlite', '/assets/%2e%2e/private.txt', '/assets/..%2fprivate.txt']) assert.equal((await assets.fetch(new Request(url + path))).status, 404);
    assert.equal((await assets.fetch(new Request(url, { method: 'POST' }))).status, 405);
  } finally { await rm(root, { recursive: true, force: true }); }
});
