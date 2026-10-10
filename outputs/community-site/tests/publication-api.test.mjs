import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import worker from '../worker/index.js';
import { zipPackage, readZipPackage } from '../public/package-core.js';
import { localStorage, readFixtureDirectory } from './fixtures/local-storage.mjs';

const origin = 'https://community.example.test';
const maxPackageBytes = 32 * 1024 * 1024;
const owner = 'private-platform-user-must-not-be-public';
const encode = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
const metadata = {
  title: '喝水伙伴', id: 'lykinzlj.water', description: '公开分享的真实 SDK 插件',
  author: 'Lykinzlj', source: '', license: 'MIT', workflow: 'plugin-make',
};
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64'));
const fixtureRoot = new URL('./fixtures/samples/', import.meta.url);
const nativeFiles = await readFixtureDirectory(new URL('openpets-water/', fixtureRoot));
const nativeZip = zipPackage(nativeFiles);
const nativeBytes = new Uint8Array(await nativeZip.arrayBuffer());
const externalFiles = {
  'package.json': new Uint8Array(await readFile(new URL('raycast-brew/package.json', fixtureRoot))),
  'LICENSE.txt': new Uint8Array(await readFile(new URL('raycast-brew/LICENSE.txt', fixtureRoot))),
  'src/never-execute.js': encode('throw new Error("上传代码不得执行");'),
};

function upload({ archive = nativeZip, info = metadata, identity = owner, requestOrigin = origin, fetchSite = 'same-origin', cover = png } = {}) {
  const form = new FormData();
  form.set('metadata', JSON.stringify(info));
  form.set('package', archive, '作品.zip');
  if (cover) form.set('cover', new Blob([cover], { type: 'image/png' }), '封面.png');
  const headers = { origin: requestOrigin, 'sec-fetch-site': fetchSite };
  if (identity) headers['oai-authenticated-user-id'] = identity;
  return new Request(`${origin}/api/plugins`, { method: 'POST', headers, body: form });
}
const request = (path, method = 'GET') => new Request(origin + path, { method });
async function list(env) {
  const response = await worker.fetch(request('/api/plugins'), env);
  assert.equal(response.status, 200);
  return (await response.json()).items;
}
async function withStorage(run) {
  const storage = await localStorage();
  try { await run(storage); } finally { storage.close(); }
}

test('真实 SDK ZIP 可发布，匿名列表与下载保持原包及 PNG 封面原字节，不公开所有者', async () => {
  await withStorage(async ({ env, bucket, objects }) => {
    const published = await worker.fetch(upload(), env);
    assert.equal(published.status, 201);
    const { item } = await published.json();
    assert.match(item.id, /^community-[a-f0-9-]{36}$/);
    assert.equal(item.author, metadata.author);
    assert.equal(item.source, '');
    assert.equal(item.packageBytes, nativeBytes.length);
    const items = await list(env);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, item.id);
    for (const value of [item, items[0]]) {
      assert.equal(Object.hasOwn(value, 'owner'), false);
      assert.equal(Object.hasOwn(value, 'fingerprint'), false);
      assert.equal(Object.hasOwn(value, 'package_key'), false);
      assert.equal(JSON.stringify(value).includes(owner), false);
    }
    const download = await worker.fetch(request(item.download), env);
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'application/zip');
    assert.equal(download.headers.get('x-content-type-options'), 'nosniff');
    assert.match(download.headers.get('content-disposition'), /attachment/);
    assert.deepEqual(new Uint8Array(await download.arrayBuffer()), nativeBytes);
    const cover = await worker.fetch(request(item.cover), env);
    assert.equal(cover.headers.get('content-type'), 'image/png');
    assert.deepEqual(new Uint8Array(await cover.arrayBuffer()), png);
    const head = await worker.fetch(request(item.download, 'HEAD'), env);
    assert.equal(head.status, 200);
    assert.equal(Number(head.headers.get('content-length')), nativeBytes.length);
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    const repeated = await worker.fetch(upload(), env);
    assert.equal(repeated.status, 200);
    const again = await repeated.json();
    assert.equal(again.item.id, item.id);
    assert.equal(again.alreadyPublished, true);
    assert.equal(bucket.writes, 2);
    assert.equal(objects.size, 2);
    assert.equal((await list(env)).length, 1);
  });
});

test('匿名发布返回401，其他来源或cross-site返回403，不写入存储', async () => {
  await withStorage(async ({ env, objects }) => {
    assert.equal((await worker.fetch(upload({ identity: null }), env)).status, 401);
    assert.equal((await worker.fetch(upload({ requestOrigin: 'https://other.example.test' }), env)).status, 403);
    assert.equal((await worker.fetch(upload({ fetchSite: 'cross-site' }), env)).status, 403);
    assert.equal(objects.size, 0);
    assert.equal((await list(env)).length, 0);
    const session = await worker.fetch(request('/api/session'), env);
    assert.deepEqual(await session.json(), { available: true, signedIn: false, maxPackageBytes: 32 * 1024 * 1024 });
  });
});

test('Raycast原项目经导入入口保持完整ZIP，制作入口拒绝伪装为本机SDK', async () => {
  await withStorage(async ({ env }) => {
    const archive = zipPackage(externalFiles);
    const make = await worker.fetch(upload({ archive }), env);
    assert.equal(make.status, 400);
    assert.equal((await list(env)).length, 0);
    const imported = await worker.fetch(upload({ archive, info: { ...metadata, workflow: 'plugin-import' } }), env);
    assert.equal(imported.status, 201);
    const { item } = await imported.json();
    assert.match(item.hostNotice, /原宿主/);
    const downloaded = new Uint8Array(await (await worker.fetch(request(item.download), env)).arrayBuffer());
    assert.deepEqual(downloaded, new Uint8Array(await archive.arrayBuffer()));
    const files = await readZipPackage(downloaded, () => { throw new Error('该测试包应无压缩'); });
    for (const [name, bytes] of Object.entries(externalFiles)) assert.deepEqual(files[name], bytes);
  });
});

test('投稿 ZIP 超过32MB或封面超过10MB返回413，不进入公开列表', async () => {
  await withStorage(async ({ env, objects }) => {
    const oversize = new Blob([new Uint8Array(maxPackageBytes + 1)], { type: 'application/zip' });
    assert.equal((await worker.fetch(upload({ archive: oversize, cover: null }), env)).status, 413);
    assert.equal((await worker.fetch(upload({ cover: new Uint8Array(10 * 1024 * 1024 + 1) }), env)).status, 413);
    assert.equal(objects.size, 0);
    assert.equal((await list(env)).length, 0);
  });
});

test('无效作品信息、SDK附件、封面与非ZIP输入返回400，保留服务可继续使用', async () => {
  await withStorage(async ({ env, objects }) => {
    const cases = [
      { info: { ...metadata, author: '' } },
      { info: null },
      { archive: zipPackage({ 'plugin.json': encode({ manifestVersion: 3, runtime: 'javascript', entry: 'missing.js', id: 'lykinzlj.bad', name: '缺入口', version: '1.0.0', permissions: [] }) }) },
      { cover: encode('<svg xmlns="http://www.w3.org/2000/svg"/>') },
      { archive: new Blob([encode('不是ZIP')]) },
    ];
    for (const input of cases) assert.equal((await worker.fetch(upload(input), env)).status, 400, JSON.stringify(input.info ?? '文件格式无效'));
    assert.equal(objects.size, 0);
    assert.equal((await list(env)).length, 0);
    assert.equal((await worker.fetch(upload(), env)).status, 201);
  });
});

test('数据库或封面写入失败返回503，清理孤立R2文件且恢复后可重试', async () => {
  for (const failure of ['database', 'cover', 'package', 'package-response-lost']) {
    await withStorage(async ({ env, db, bucket, objects }) => {
      if (failure === 'database') db.failInsert = true;
      else if (failure === 'package-response-lost') bucket.putThenThrow = true;
      else bucket.failOn = failure === 'cover' ? '/cover' : '/package.zip';
      assert.equal((await worker.fetch(upload(), env)).status, 503, failure);
      assert.equal(objects.size, 0, failure);
      assert.equal((await list(env)).length, 0, failure);
      db.failInsert = false; bucket.failOn = null; bucket.putThenThrow = false;
      assert.equal((await worker.fetch(upload(), env)).status, 201, failure);
      assert.equal((await list(env)).length, 1, failure);
    });
  }
  assert.equal((await worker.fetch(upload(), {})).status, 503);
});

test('数据库实际提交后响应丢失保留已发布ZIP和封面，重试返回同一作品', async () => {
  await withStorage(async ({ env, db, objects }) => {
    db.insertThenThrow = true;
    const response = await worker.fetch(upload(), env);
    assert.equal(response.status, 200);
    const first = await response.json();
    assert.equal(first.alreadyPublished, true);
    assert.equal(objects.size, 2);
    assert.equal((await list(env)).length, 1);
    assert.deepEqual(new Uint8Array(await (await worker.fetch(request(first.item.download), env)).arrayBuffer()), nativeBytes);
    assert.deepEqual(new Uint8Array(await (await worker.fetch(request(first.item.cover), env)).arrayBuffer()), png);
    const repeated = await worker.fetch(upload(), env);
    assert.equal((await repeated.json()).item.id, first.item.id);
    assert.equal(objects.size, 2);
  });
});

function compressedZip() {
  const source = new Uint8Array(nativeBytes);
  const view = new DataView(source.buffer);
  const end = source.length - 22;
  const central = view.getUint32(end + 16, true);
  const offset = 30 + view.getUint16(26, true) + view.getUint16(28, true);
  const size = view.getUint32(18, true);
  const deflated = new Uint8Array(deflateRawSync(source.subarray(offset, offset + size)));
  const delta = deflated.length - size;
  const changed = new Uint8Array(source.length + delta);
  changed.set(source.subarray(0, offset)); changed.set(deflated, offset); changed.set(source.subarray(offset + size), offset + deflated.length);
  const next = new DataView(changed.buffer), nextCentral = central + delta, nextEnd = end + delta;
  next.setUint16(8, 8, true); next.setUint32(18, deflated.length, true);
  let cursor = nextCentral;
  for (let index = 0; index < next.getUint16(nextEnd + 10, true); index++) {
    if (index === 0) { next.setUint16(cursor + 10, 8, true); next.setUint32(cursor + 20, deflated.length, true); }
    else next.setUint32(cursor + 42, next.getUint32(cursor + 42, true) + delta, true);
    cursor += 46 + next.getUint16(cursor + 28, true) + next.getUint16(cursor + 30, true) + next.getUint16(cursor + 32, true);
  }
  next.setUint32(nextEnd + 16, nextCentral, true);
  return changed;
}

test('拒绝外部压缩流、声明膨胀攻击、路径穿越和损坏ZIP，均不产生公开作品', async () => {
  await withStorage(async ({ env, objects }) => {
    const inflated = new Uint8Array(nativeBytes), inflatedView = new DataView(inflated.buffer);
    const central = inflatedView.getUint32(inflated.length - 6, true);
    inflatedView.setUint32(central + 24, 0xffffffff, true);
    const traversal = new Uint8Array(await zipPackage({ 'aa/license': encode('不允许上级目录') }).arrayBuffer());
    const traversalView = new DataView(traversal.buffer), traversalCentral = traversalView.getUint32(traversal.length - 6, true);
    traversal.set(encode('../license'), 30); traversal.set(encode('../license'), traversalCentral + 46);
    const corrupt = new Uint8Array(nativeBytes); corrupt[30 + new DataView(corrupt.buffer).getUint16(26, true)] ^= 1;
    for (const bytes of [compressedZip(), inflated, traversal, corrupt]) {
      assert.equal((await worker.fetch(upload({ archive: new Blob([bytes], { type: 'application/zip' }) }), env)).status, 400);
    }
    assert.equal(objects.size, 0);
    assert.equal((await list(env)).length, 0);
  });
});
