import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from '../../community-host/public/gallery-files.json' with { type: 'json' };
import { publicAssets } from '../../community-host/server/storage.mjs';
import { serveVideoAsset, videoAssetPaths } from '../worker/media-assets.mjs';
import worker from '../worker/index.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://desktoppet-e9e.pages.dev';
const video = manifest.files.find(file => ['video/mp4', 'video/webm'].includes(file.mime));
assert.ok(video, '公开清单应包含本轮发布的视频。');
const url = origin + '/' + video.path;
const ASSETS = await publicAssets(resolve(root, '../community-host/public'));

test('真实发布路由覆盖管理接口与素材，下架不能被静态路径绕过，未登记媒体仍不可读', async () => {
  const routes=JSON.parse(await readFile(resolve(root,'dist/_routes.json'),'utf8'));
  assert.equal(routes.version,1);assert.ok(Array.isArray(routes.include));assert.ok(Array.isArray(routes.exclude));
  const rules=[...routes.include,...routes.exclude];assert.ok(rules.length<=100,'包含和排除规则合计不能超过100条');
  assert.ok(rules.every(rule=>typeof rule==='string'&&rule.length<=100),'每条路由不能超过100字符');
  assert.deepEqual(routes.exclude,[]);
  const videos=manifest.files.filter(file=>['video/mp4','video/webm'].includes(file.mime)).map(file=>'/'+file.path);
  assert.deepEqual(new Set(videoAssetPaths),new Set(videos),'路由引用完整公开原片登记名单');
  const matches=(rule,path)=>rule.endsWith('*')?path.startsWith(rule.slice(0,-1)):path===rule;
  for(const path of videos)assert.ok(routes.include.some(rule=>matches(rule,path)),path);
  for (const path of ['/api/admin/works', '/api/catalog-management', '/assets/example.zip', '/%61ssets/example.zip']) assert.ok(routes.include.some(rule=>matches(rule,path)),path);
  for(const directory of new Set(videos.map(path=>path.slice(0,path.lastIndexOf('/'))))){
    const unknown=directory+'/not-registered.webm';
    assert.equal(await serveVideoAsset(new Request(origin+unknown),{fetch(){throw new Error('未登记视频不得通过媒体入口读取');}}),null);
    assert.equal((await worker.fetch(new Request(origin+unknown),{ASSETS})).status,404);
  }
});


test('本轮Clawa与PC中文说明经真实公开目录返回GET和HEAD原字节', async () => {
  for (const name of ['README-导入与授权说明.md', '使用说明.md']) {
    const file = manifest.files.find(entry => entry.path.split('/').at(-1) === name);
    assert.ok(file, '新构建公开清单应包含中文说明：' + name);
    const original = await readFile(resolve(root, '../community-host/public', file.path));
    assert.equal(original.length, file.bytes);
    const requestUrl = origin + '/' + encodeURI(file.path);
    const response = await worker.fetch(new Request(requestUrl), { ASSETS });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(response.headers.get('content-length'), String(original.length));
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), original);
    const head = await worker.fetch(new Request(requestUrl, { method: 'HEAD' }), { ASSETS });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-length'), String(original.length));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
  }
});

test('真实登记视频的 HEAD 有完整大小，首段、中段和尾段精确返回原字节', async () => {
  const original = await readFile(resolve(root, '../community-host/public', video.path));
  assert.equal(original.length, video.bytes);
  const head = await worker.fetch(new Request(url, { method: 'HEAD', headers: { range: 'bytes=0-1023' } }), { ASSETS });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), String(original.length));
  assert.equal(head.headers.get('accept-ranges'), 'bytes');
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  const ranges = [
    ['bytes=0-1023', 0, 1023],
    ['bytes=4097-8191', 4097, 8191],
    ['bytes=-1024', original.length - 1024, original.length - 1],
    [`bytes=${original.length - 100}-`, original.length - 100, original.length - 1],
  ];
  for (const [range, start, end] of ranges) {
    const response = await worker.fetch(new Request(url, { headers: { range } }), { ASSETS });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${original.length}`);
    assert.equal(response.headers.get('content-length'), String(end - start + 1));
    assert.equal(response.headers.get('content-type'), video.mime);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), original.subarray(start, end + 1));
  }
});

test('不可满足的单区间返回 416，拒绝修改媒体的方法，不读取原片', async () => {
  const noFetch = { fetch() { throw new Error('此请求不应读取资源。'); } };
  for (const range of [`bytes=${video.bytes}-`, 'bytes=10-1', 'bytes=-0']) {
    const response = await serveVideoAsset(new Request(url, { headers: { range } }), noFetch);
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('content-range'), `bytes */${video.bytes}`);
    assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  const response = await serveVideoAsset(new Request(url, { method: 'POST' }), noFetch);
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET, HEAD');
});

test('未支持的 Range 及过期 If-Range 返回完整资源，未登记路径不进入视频处理', async () => {
  for (const headers of [
    { range: 'bytes=0-2,4-7' },
    { range: 'not-a-range' },
    { range: 'bytes=0-10', 'if-range': '"old-version"' },
  ]) {
    const response = await serveVideoAsset(new Request(url, { headers }), ASSETS);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-length'), String(video.bytes));
    assert.equal(response.headers.get('content-range'), null);
    await response.body.cancel();
  }
  const noFetch = { fetch() { throw new Error('未登记视频不能通过此入口读取。'); } };
  for (const path of ['/assets/not-published.mp4', '/userdata/private.mp4', '/api/session', '/index.html']) {
    assert.equal(await serveVideoAsset(new Request(origin + path + '?url=https://untrusted.test/video.mp4'), noFetch), null);
  }
  assert.ok(videoAssetPaths.includes('/' + video.path));
});

test('分段处理及时取消上游，阻止资源压缩或条件请求改变字节定位', async () => {
  let supplied = 0;
  let canceled;
  const stopped = new Promise(resolve => { canceled = resolve; });
  const assets = { async fetch(request) {
    assert.equal(new URL(request.url).pathname, '/' + video.path);
    assert.equal(request.headers.get('range'), null);
    assert.equal(request.headers.get('if-none-match'), null);
    assert.equal(request.headers.get('accept-encoding'), 'identity');
    return new Response(new ReadableStream({
      pull(controller) { supplied += 512; controller.enqueue(new Uint8Array(512).fill(7)); },
      cancel() { canceled(); },
    }));
  } };
  const response = await serveVideoAsset(new Request(url + '?url=https://untrusted.test/video.mp4', {
    headers: { range: 'bytes=1024-2047', 'if-none-match': '"old-cache"' },
  }), assets);
  assert.equal(response.status, 206);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(1024).fill(7));
  await stopped;
  assert.ok(supplied < video.bytes, '小区间不应读取或缓存完整视频。');
  const compressed = await serveVideoAsset(new Request(url), { fetch: async () => new Response('compressed', { headers: { 'content-encoding': 'gzip' } }) });
  assert.equal(compressed.status, 502);
});

test('客户端放弃分段下载时取消素材读取；缺失素材保持原 404', async () => {
  let canceled;
  const stopped = new Promise(resolve => { canceled = resolve; });
  const assets = { fetch: async () => new Response(new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(512)); },
    cancel() { canceled(); },
  })) };
  const response = await serveVideoAsset(new Request(url, { headers: { range: 'bytes=0-1048575' } }), assets);
  await response.body.cancel();
  await stopped;
  assert.equal((await serveVideoAsset(new Request(url), { fetch: async () => new Response(null, { status: 404 }) })).status, 404);
});

test('真实 workerd 通过固定长度流返回 HEAD／206／416', {
  skip: process.env.COMMUNITY_WORKERD_TEST !== '1',
}, async () => {
  const { build } = await import('../../community-site/node_modules/esbuild/lib/main.js');
  const { Miniflare } = await import('../../desktop-pet/node_modules/.pnpm/miniflare@5.20260801.1-alpha/node_modules/miniflare/dist/src/index.js');
  const bundled = await build({ entryPoints: [resolve(root, 'worker/media-assets.mjs')], bundle: true, write: false, format: 'esm', platform: 'browser' });
  const script = bundled.outputFiles[0].text + `\nexport default { fetch(request) {
    const assets = { fetch: async request => new Response(request.method === 'HEAD' ? null : new ReadableStream({
      pull(controller) { controller.enqueue(new Uint8Array(512).fill(9)); }
    }), {headers:{'content-type':'${video.mime}'}}) };
    return serveVideoAsset(request, assets);
  }};`;
  const runtime = new Miniflare({ modules: true, script, compatibilityDate: '2026-08-04', port: 0 });
  try {
    const head = await runtime.dispatchFetch(url, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(head.headers.get('content-length'), String(video.bytes));
    assert.equal((await head.arrayBuffer()).byteLength, 0);
    const response = await runtime.dispatchFetch(url, { headers: { range: 'bytes=1024-2047' } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-length'), '1024');
    assert.equal(response.headers.get('content-range'), `bytes 1024-2047/${video.bytes}`);
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new Uint8Array(1024).fill(9));
    assert.equal((await runtime.dispatchFetch(url, { headers: { range: `bytes=${video.bytes}-` } })).status, 416);
  } finally { await runtime.dispose(); }
});
