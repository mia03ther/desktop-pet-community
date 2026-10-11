import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
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

test('中文公开说明通过浏览器编码路径返回原字节，GET与HEAD大小和类型一致', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pet-host-unicode-'));
  try {
    const directory = join(root, 'public/assets/pets'); await mkdir(directory, { recursive: true });
    await writeFile(join(root, 'public/index.html'), '共创平台');
    await writeFile(join(root, '私有说明.md'), '不能公开');
    const originals = new Map([
      ['README-导入与授权说明.md', Buffer.from('原作者与素材授权说明\n')],
      ['使用说明.md', Buffer.from('原素材导入说明\n')],
    ]);
    for (const [name, bytes] of originals) await writeFile(join(directory, name), bytes);
    const assets = await publicAssets(join(root, 'public'));
    for (const [name, bytes] of originals) {
      const url = 'https://example.test/assets/pets/' + encodeURIComponent(name);
      const response = await assets.fetch(new Request(url)); assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
      assert.equal(response.headers.get('content-length'), String(bytes.length));
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes);
      const head = await assets.fetch(new Request(url, { method: 'HEAD' })); assert.equal(head.status, 200);
      assert.equal(head.headers.get('content-length'), String(bytes.length));
      assert.equal(head.headers.get('content-type'), response.headers.get('content-type'));
      assert.equal((await head.arrayBuffer()).byteLength, 0);
    }
    for (const path of ['/私有说明.md', '/assets/%2e%2e/私有说明.md', '/assets/..%2f私有说明.md', '/assets%2fpets/使用说明.md', '/assets/pets/%ZZ.md']) {
      assert.equal((await assets.fetch(new Request('https://example.test' + path))).status, 404);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('公开目录仍拒绝非ASCII目录、隐藏或符号文件名和符号链接', async () => {
  const root = await mkdtemp(join(tmpdir(), 'pet-host-public-boundaries-'));
  try {
    for (const [index, name, directory] of [[0, '中文目录', true], [1, '.private.md', false], [2, 'notes@.md', false]]) {
      const publicRoot = join(root, String(index)); await mkdir(publicRoot);
      if (directory) await mkdir(join(publicRoot, name)); else await writeFile(join(publicRoot, name), '不能公开');
      await assert.rejects(publicAssets(publicRoot), /公开文件名无效/);
    }
    const publicRoot = join(root, 'links'), privateRoot = join(root, 'private');
    await mkdir(publicRoot); await mkdir(privateRoot); await writeFile(join(privateRoot, 'secret.txt'), '不能公开');
    await symlink(privateRoot, join(publicRoot, 'private-link'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(publicAssets(publicRoot), /不能包含符号链接/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
