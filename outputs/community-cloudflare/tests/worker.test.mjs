import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import worker, { createWorker } from '../worker/index.mjs';
import { publicAssets } from '../../community-host/server/storage.mjs';
import { pets } from '../../community-host/public/catalog.js';

const origin = 'https://desktoppet-e9e.pages.dev';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = await publicAssets(resolve(root, '../community-host/public'));

test('原应用下载只重定向到构建目录指定完整发行，不能由请求参数改写，原生动作包仍原字节', async () => {
  const DB = { prepare: () => ({ bind: () => ({ run: async () => ({ success: true }) }) }) };
  for (const pet of pets.filter(pet => pet.distribution === 'standalone')) {
    const response = await worker.fetch(new Request(`${origin}/api/download/${pet.id}?url=https://untrusted.test/installer.exe`), { ASSETS, DB });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), pet.download);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  const pet = pets.find(pet => pet.distribution === 'media');
  assert.ok(pet);
  const response = await worker.fetch(new Request(`${origin}/api/download/${pet.id}`), { ASSETS, DB });
  assert.equal(response.status, 200);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(resolve(root, '../community-host/public', pet.download)));
  assert.equal((await worker.fetch(new Request(`${origin}/api/download/nonexistent?url=https://untrusted.test`), { ASSETS })).status, 404);
});

test('密码入口停用，伪造身份不能投稿，发布和互动分别报告', async () => {
  const env = { ASSETS };
  const session = await worker.fetch(new Request(origin + '/api/session', { headers: { 'oai-authenticated-user-id': 'forged-user' } }), env);
  assert.deepEqual(await session.json(), { available: false, signedIn: false, maxPackageBytes: 32 * 1024 * 1024, interactionsAvailable: false, anonymousInteractions: false, error: '请配置投稿仓库。' });
  const post = await worker.fetch(new Request(origin + '/api/plugins', { method: 'POST', headers: { origin, 'oai-authenticated-user-id': 'forged-user', 'oai-sites-authorization': 'forged-auth' }, body: '{}' }), env);
  assert.equal(post.status, 401);
  assert.deepEqual(await post.json(), { error: '请配置投稿仓库。' });
  assert.equal((await worker.fetch(new Request(origin + '/api/auth/register', { method: 'POST', body: '{}' }), env)).status, 503);
  assert.equal((await worker.fetch(new Request('https://untrusted.test/api/session'), env)).status, 403);
});

test('发布静态页及真实新目录ZIP原字节，HEAD不返回包正文，私人文件不公开', async () => {
  assert.equal((await worker.fetch(new Request(origin), { ASSETS })).status, 200);
  const manifest = JSON.parse(await readFile(resolve(root, '../community-host/public/gallery-files.json'), 'utf8'));
  const item = manifest.files.find(item => item.path.includes('upstream-20261009') && item.path.endsWith('.zip'));
  const original = await readFile(resolve(root, '../community-host/public', item.path));
  const response = await worker.fetch(new Request(origin + '/' + item.path), { ASSETS });
  assert.equal(response.status, 200); assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(original));
  const head = await worker.fetch(new Request(origin + '/' + item.path, { method: 'HEAD' }), { ASSETS });
  assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
  assert.equal((await worker.fetch(new Request(origin + '/userdata/preferences.json'), { ASSETS })).status, 404);
});

test('匿名工厂只创建一次，输入身份与代理头被剥除，匿名互动不授投稿权', async () => {
  let created = 0;
  const seen = [];
  const DB = { prepare: sql => ({ sql }), batch: async statements => statements.map(() => ({ results: [] })) };
  const active = createWorker(async options => {
    created++; assert.equal(options.DB, DB); assert.equal(options.origin, origin); assert.equal(options.salt.length, 64);
    assert.ok(options.works.some(work => work.author === 'Lykinzlj'));
    assert.ok(options.works.some(work => work.id.includes('--')));
    return { handle: async (request, peer) => { seen.push({ request, peer }); return Response.json({ available: true, followers: 1, following: true }); } };
  });
  const env = { DB, ASSETS, HASH_SALT: 'a'.repeat(64) };
  const forged = { origin, 'oai-authenticated-user-id': 'forged-user', 'oai-sites-authorization': 'forged-authority', 'x-forwarded-for': 'another-ip', 'cf-connecting-ip': '203.0.113.5' };
  const sessions = await Promise.all([1, 2].map(() => active.fetch(new Request(origin + '/api/session', { headers: forged }), env)));
  assert.equal(created, 1);
  for (const response of sessions) { const data = await response.json(); assert.equal(data.signedIn, false); assert.equal(data.available, false); assert.equal(data.interactionsAvailable, true); assert.equal(data.anonymousInteractions, true); }
  const follow = await active.fetch(new Request(origin + '/api/contributors/Lykinzlj?kind=plugins', { method: 'PUT', headers: forged, body: '{"following":true}' }), env);
  assert.equal(follow.status, 200); assert.equal(seen.length, 1); assert.equal(seen[0].peer, '203.0.113.5');
  for (const header of ['oai-authenticated-user-id', 'oai-sites-authorization', 'x-forwarded-for']) assert.equal(seen[0].request.headers.get(header), null);
  for (const path of ['/api/pets', '/api/plugins', '/api/requests']) assert.equal((await active.fetch(new Request(origin + path, { method: 'POST', headers: forged, body: '{}' }), env)).status, 401);
  assert.equal(seen.length, 1);
});

test('D1 绑定存在但互动迁移缺失时不冒充已就绪，短盐与缺盐不可启用', async () => {
  const DB = { prepare: sql => ({ sql }), batch: async () => { throw new Error('没有表'); } };
  let created = 0;
  const active = createWorker(() => { created++; return { handle: async () => null }; });
  const session = await active.fetch(new Request(origin + '/api/session'), { DB, ASSETS, HASH_SALT: 'a'.repeat(64) });
  assert.equal((await session.json()).interactionsAvailable, false);
  for (const salt of [undefined, 'short']) {
    const response = await active.fetch(new Request(origin + '/api/session'), { DB, ASSETS, HASH_SALT: salt });
    assert.equal((await response.json()).anonymousInteractions, false);
    assert.equal((await active.fetch(new Request(origin + '/api/contributors/Lykinzlj?kind=plugins'), { DB, ASSETS, HASH_SALT: salt })).status, 503);
  }
  assert.equal(created, 1);
  assert.equal((await active.fetch(new Request('https://untrusted.test/api/session'), { ASSETS, COMMUNITY_ORIGIN: 'https://untrusted.test' })).status, 403);
});
