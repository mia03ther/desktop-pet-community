import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import worker from '../worker/index.js';
import { pets } from '../public/catalog.js';
import { builtinAtlases } from '../worker/builtin-atlases.js';
import { builtinPackages } from '../worker/builtin-packages.js';
import { localStorage } from './fixtures/local-storage.mjs';
import { publicActivity } from '../public/publication-client.js';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const root = new URL('../', import.meta.url);
const origin = 'https://community.example.test';

test('全部30份图集和原下载包保持同字节，29份回源原包不再重复占发布体积', async t => {
  assert.equal(pets.length, 30); assert.equal(Object.keys(builtinAtlases).length, 30);
  assert.equal(Object.keys(builtinPackages).length, 29);
  const originals = new Map(); let remoteCalls = 0;
  for (const pet of pets) {
    const source = builtinPackages['/' + pet.download];
    if (source) originals.set(source.sourceUrl, await readFile(new URL('public/' + pet.atlas, root)));
  }
  t.mock.method(globalThis, 'fetch', async request => {
    remoteCalls++; assert.equal(request.redirect, 'error'); assert.ok(request.signal);
    assert.ok(originals.has(request.url)); return new Response(originals.get(request.url));
  });
  const report = [];
  for (const pet of pets) {
    let calls = 0;
    const env = { ASSETS: { async fetch(request) {
      calls++; assert.equal(new URL(request.url).pathname, '/' + pet.download);
      return new Response(request.method === 'HEAD' ? null : await readFile(new URL('dist/client/' + pet.download, root)), { headers: { 'content-type': 'application/zip' } });
    } } };
    const original = await readFile(new URL('public/' + pet.atlas, root));
    const originalZip = await readFile(new URL('public/' + pet.download, root));
    const source = builtinPackages['/' + pet.download];
    if (source) await assert.rejects(stat(new URL('dist/client/' + pet.download, root)), { code: 'ENOENT' });
    else assert.deepEqual(await readFile(new URL('dist/client/' + pet.download, root)), originalZip);
    await assert.rejects(stat(new URL('dist/client/' + pet.atlas, root)), { code: 'ENOENT' });
    assert.ok((await stat(new URL('dist/client/' + pet.thumbnail, root))).size > 0);
    const response = await worker.fetch(new Request(origin + '/' + pet.atlas), env);
    assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/webp');
    const bytes = new Uint8Array(await response.arrayBuffer()); assert.equal(sha(bytes), sha(original));
    const head = await worker.fetch(new Request(origin + '/' + pet.atlas, { method: 'HEAD' }), env);
    assert.equal(head.status, 200); assert.equal((await head.arrayBuffer()).byteLength, 0);
    assert.equal(head.headers.get('content-length'), String(original.length));
    const download = await worker.fetch(new Request(origin + '/' + pet.download), env);
    assert.equal(download.status, 200); assert.equal(download.headers.get('content-type'), 'application/zip');
    const servedZip = new Uint8Array(await download.arrayBuffer()); assert.deepEqual(Buffer.from(servedZip), originalZip);
    const zipHead = await worker.fetch(new Request(origin + '/' + pet.download, { method: 'HEAD' }), env);
    assert.equal(zipHead.status, 200); assert.equal((await zipHead.arrayBuffer()).byteLength, 0);
    assert.equal(calls, source ? 0 : 3);
    report.push({ id: pet.id, atlasSha256: sha(original), servedSha256: sha(bytes), packageSha256: sha(originalZip), servedPackageSha256: sha(servedZip), atlasBytes: original.length, packageBytes: originalZip.length, fixedSource: !!source });
  }
  assert.equal(remoteCalls, 58);
  await writeFile(new URL('../../work/community-builtin-packages-sha-v4.json', root), JSON.stringify({ count: report.length, entries: report }, null, 2));
});

test('固定原件缺失、长度或摘要改变时不返回伪素材，未知路径不能回源', async t => {
  const pet = pets.find(item => builtinPackages['/' + item.download]), url = origin + '/' + pet.atlas;
  const missing = { ASSETS: { fetch: async () => new Response(null, { status: 404 }) } };
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 404 }));
  assert.equal((await worker.fetch(new Request(url), missing)).status, 404);
  const bytes = new Uint8Array(await readFile(new URL('public/' + pet.atlas, root))); bytes[bytes.length - 1] ^= 1;
  globalThis.fetch.mock.mockImplementation(async () => new Response(bytes));
  assert.equal((await worker.fetch(new Request(url), missing)).status, 503);
  assert.equal((await worker.fetch(new Request(origin + '/' + pet.download), missing)).status, 503);
  globalThis.fetch.mock.mockImplementation(async () => new Response(bytes.subarray(0, 1)));
  assert.equal((await worker.fetch(new Request(url), missing)).status, 503);
  globalThis.fetch.mock.mockImplementation(async () => new Response(new Uint8Array(bytes.length + 1)));
  assert.equal((await worker.fetch(new Request(url), missing)).status, 503);
  const before = globalThis.fetch.mock.callCount();
  assert.equal((await worker.fetch(new Request(origin + '/assets/pets/unlisted.webp'), missing)).status, 404);
  assert.equal((await worker.fetch(new Request(url, { method: 'POST' }), missing)).status, 405);
  assert.equal(globalThis.fetch.mock.callCount(), before);
});

test('回源下载仅成功GET计数，HEAD和预览不计数，失败不会留下下载记录', async t => {
  const state = await localStorage(), pet = pets.find(item => builtinPackages['/' + item.download]);
  const original = await readFile(new URL('public/' + pet.atlas, root));
  t.mock.method(globalThis, 'fetch', async request => {
    assert.equal(request.url, builtinPackages['/' + pet.download].sourceUrl);
    return new Response(original);
  });
  try {
    const path = origin + '/api/download/' + pet.id;
    assert.equal((await worker.fetch(new Request(path, { method: 'HEAD' }), state.env)).status, 200);
    assert.equal(globalThis.fetch.mock.callCount(), 0);
    await worker.fetch(new Request(origin + '/' + pet.atlas), state.env);
    let activity = publicActivity(await (await worker.fetch(new Request(origin + '/api/activity'), state.env)).json());
    assert.equal(activity[pet.id], undefined);
    const download = await worker.fetch(new Request(path), state.env); assert.equal(download.status, 200);
    const cookie = download.headers.get('set-cookie').split(';')[0];
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), await readFile(new URL('public/' + pet.download, root)));
    await worker.fetch(new Request(path, { headers: { cookie } }), state.env);
    activity = publicActivity(await (await worker.fetch(new Request(origin + '/api/activity'), state.env)).json());
    assert.equal(activity[pet.id].downloads, 1);
    globalThis.fetch.mock.mockImplementation(async () => new Response(new Uint8Array(1)));
    assert.equal((await worker.fetch(new Request(path), state.env)).status, 503);
    activity = publicActivity(await (await worker.fetch(new Request(origin + '/api/activity'), state.env)).json());
    assert.equal(activity[pet.id].downloads, 1);
  } finally { state.close(); }
});
