import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import worker from '../worker/index.js';
import { petManifest, videoPetManifest, prepareWorkPackage, zipPackage, readZipPackage } from '../public/package-core.js';
import { publicPetItem, publicActivity } from '../public/publication-client.js';
import { localStorage } from './fixtures/local-storage.mjs';

const origin = 'https://community.example.test';
const encode = value => new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
const input = { id: 'shared-pet', displayName: '公共伙伴', title: '公共伙伴', description: '上传后其他浏览器可读的伙伴', author: '测试作者', license: '个人使用', source: '' };
const requestIdea = { title: '云朵小猫', description: '安静的小猫，慢慢眨眼。', category: '原创角色', version: 2 };
const atlas = new Uint8Array(await readFile(new URL('../public/assets/hoodie.webp', import.meta.url)));
const video = new Uint8Array(await readFile(new URL('./fixtures/samples/test.mp4', import.meta.url)));
const atlasFiles = prepareWorkPackage({ 'pet.json': JSON.stringify(petManifest(input, 2)), 'spritesheet.webp': atlas }, input, 'pet', 'pet-make');
const archive = zipPackage(atlasFiles);
function req(path, { method = 'GET', owner, body, cookie, requestOrigin = origin } = {}) {
  const headers = {};
  if (owner) headers['oai-authenticated-user-id'] = owner;
  if (cookie) headers.cookie = cookie;
  if (method === 'POST') { headers.origin = requestOrigin; headers['content-type'] = 'application/json'; }
  return new Request(origin + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
function upload(files = archive, workflow = 'pet-make', owner = 'author-private') {
  const form = new FormData(); form.set('metadata', JSON.stringify({ ...input, workflow })); form.set('package', files, 'pet.zip');
  return new Request(origin + '/api/pets', { method: 'POST', headers: { origin, ...(owner ? { 'oai-authenticated-user-id': owner } : {}) }, body: form });
}
async function withStorage(run) { const state = await localStorage(); try { await run(state); } finally { state.close(); } }
async function activity(env, owner) { const response = await worker.fetch(req('/api/activity', { owner }), env); assert.equal(response.status, 200); return publicActivity(await response.json()); }

test('真实V2图集作品公开上传、匿名读取、全部原包下载和预览素材保持原字节', async () => {
  await withStorage(async ({ env, objects }) => {
    const response = await worker.fetch(upload(), env); assert.equal(response.status, 201);
    const item = publicPetItem((await response.json()).item);
    assert.equal(item.kind, 'pet'); assert.equal(item.version, 2); assert.match(item.atlas, /\/media\/atlas$/);
    const listed = await (await worker.fetch(req('/api/pets'), env)).json();
    assert.equal(listed.items.length, 1); assert.equal(listed.items[0].id, item.id); assert.equal(JSON.stringify(listed).includes('author-private'), false);
    const preview = await worker.fetch(req(item.atlas), env); assert.equal(preview.status, 200); assert.deepEqual(new Uint8Array(await preview.arrayBuffer()), atlas);
    const download = await worker.fetch(req(item.download), env); assert.equal(download.status, 200);
    const restored = await readZipPackage(new Uint8Array(await download.arrayBuffer())); assert.deepEqual(restored['spritesheet.webp'], atlas);
    assert.equal((await worker.fetch(upload(), env)).status, 200); assert.equal(objects.size, 2);
  });
});

test('真实MP4自定义动作逐项公开预览，导入外宿主只归档、不执行或伪造预览', async () => {
  await withStorage(async ({ env }) => {
    const manifest = videoPetManifest(input, [{ id: 'calm', displayName: '安静待机', category: '陪伴', file: 'actions/calm.mp4' }, { id: 'atlas', displayName: '自定义动作', category: '互动', file: 'actions/calm.mp4' }], { idle: 'calm', review: 'calm' }, { mode: 'chroma', color: '#00ff00' });
    const files = prepareWorkPackage({ 'pet.json': JSON.stringify(manifest), 'actions/calm.mp4': video }, input, 'pet', 'pet-make');
    const odd = { ...manifest, actionDefinitions: { ...manifest.actionDefinitions, calm: { displayName: '不可显示\u0001', category: '陪伴' } } };
    const oddFiles = { ...files, 'pet.json': encode(odd) };
    const projected = await worker.fetch(upload(zipPackage(oddFiles), 'pet-import'), env); assert.equal(projected.status, 201);
    const projectedItem = publicPetItem((await projected.json()).item); assert.equal(projectedItem.mediaActions.calm.displayName, 'calm');
    const projectedArchive = await readZipPackage(new Uint8Array(await (await worker.fetch(req(projectedItem.download), env)).arrayBuffer())); assert.deepEqual(projectedArchive['pet.json'], encode(odd));
    const projectedList = await (await worker.fetch(req('/api/pets'), env)).json(); assert.equal(publicPetItem(projectedList.items[0]).kind, 'pet');
    const result = await worker.fetch(upload(zipPackage(files)), env); assert.equal(result.status, 201);
    const item = publicPetItem((await result.json()).item); assert.equal(item.mediaActions.calm.displayName, '安静待机');
    const preview = await worker.fetch(req(item.mediaActions.calm.url), env); assert.equal(preview.headers.get('content-type'), 'video/mp4'); assert.deepEqual(new Uint8Array(await preview.arrayBuffer()), video);
    const namedAtlas = await worker.fetch(req(item.mediaActions.atlas.url), env); assert.equal(namedAtlas.status, 200); assert.deepEqual(new Uint8Array(await namedAtlas.arrayBuffer()), video);
    const broken = zipPackage({ ...files, 'actions/calm.mp4': encode('伪装MP4') });
    assert.equal((await worker.fetch(upload(broken), env)).status, 400);
    const external = zipPackage({ 'unknown/behavior.xml': encode('<原宿主行为/>'), LICENSE: encode('保留原许可') });
    assert.equal((await worker.fetch(upload(external, 'pet-make'), env)).status, 400);
    const preserved = await worker.fetch(upload(external, 'pet-import'), env); assert.equal(preserved.status, 201);
    const foreign = publicPetItem((await preserved.json()).item); assert.deepEqual(foreign.mediaActions, {}); assert.equal(foreign.atlas, null);
    assert.deepEqual(new Uint8Array(await (await worker.fetch(req(foreign.download), env)).arrayBuffer()), new Uint8Array(await external.arrayBuffer()));
  });
});

test('需求投稿必须登录且同源，真实共享列表、幂等与创建时间不泄露账户', async () => {
  await withStorage(async ({ env, db }) => {
    assert.equal((await worker.fetch(req('/api/requests', { method: 'POST', body: requestIdea }), env)).status, 401);
    assert.equal((await worker.fetch(req('/api/requests', { method: 'POST', owner: 'private-owner', requestOrigin: 'https://foreign.test', body: requestIdea }), env)).status, 403);
    assert.equal((await worker.fetch(req('/api/requests', { method: 'POST', owner: 'private-owner', body: { ...requestIdea, title: '' } }), env)).status, 400);
    const published = await worker.fetch(req('/api/requests', { method: 'POST', owner: 'private-owner', body: requestIdea }), env); assert.equal(published.status, 201);
    const item = (await published.json()).item; assert.equal(item.public, true);
    const repeat = await worker.fetch(req('/api/requests', { method: 'POST', owner: 'private-owner', body: requestIdea }), env); assert.equal(repeat.status, 200); assert.equal((await repeat.json()).item.id, item.id);
    const list = await (await worker.fetch(req('/api/requests'), env)).json(); assert.equal(list.items.length, 1); assert.equal(list.items[0].description, requestIdea.description); assert.equal(JSON.stringify(list).includes('private-owner'), false);
    db.insertThenThrow = true;
    const lost = await worker.fetch(req('/api/requests', { method: 'POST', owner: 'another-private', body: requestIdea }), env); assert.equal(lost.status, 200); assert.equal((await lost.json()).alreadyPublished, true);
  });
});

test('双账户公共点赞唯一且重试不刷数，取消只改变本人，匿名与虚构作品无效', async () => {
  await withStorage(async ({ env }) => {
    const item = (await (await worker.fetch(upload(), env)).json()).item;
    const path = `/api/works/${item.id}/like`;
    assert.equal((await worker.fetch(req(path, { method: 'POST', body: { liked: true } }), env)).status, 401);
    assert.equal((await worker.fetch(req('/api/works/fake/like', { method: 'POST', owner: 'a', body: { liked: true } }), env)).status, 404);
    for (const owner of ['a', 'a', 'b']) assert.equal((await worker.fetch(req(path, { method: 'POST', owner, body: { liked: true } }), env)).status, 200);
    assert.equal((await activity(env, 'a'))[item.id].likes, 2); assert.equal((await activity(env))[item.id].liked, false);
    assert.equal((await activity(env, 'a'))[item.id].weekly, 2);
    await worker.fetch(req(path, { method: 'POST', owner: 'a', body: { liked: false } }), env);
    assert.equal((await activity(env, 'a'))[item.id].likes, 1); assert.equal((await activity(env, 'a'))[item.id].liked, false); assert.equal((await activity(env, 'b'))[item.id].liked, true);
  });
});

test('公共下载每天按浏览器去重，HEAD、预览、失败不计数，静态作品也同源计数', async t => {
  await withStorage(async ({ env }) => {
    const item = (await (await worker.fetch(upload(), env)).json()).item;
    const first = await worker.fetch(req(item.download), env); assert.equal(first.status, 200);
    const cookie = first.headers.get('set-cookie').split(';')[0]; assert.match(first.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);
    for (let index = 0; index < 4; index++) await worker.fetch(req(item.download, { cookie }), env);
    await worker.fetch(req(item.download, { method: 'HEAD' }), env); await worker.fetch(req(item.atlas), env);
    assert.equal((await activity(env))[item.id].downloads, 1);
    await worker.fetch(req(item.download), env); assert.equal((await activity(env))[item.id].downloads, 2);
    const assets = { fetch: async request => new Response(request.method === 'HEAD' ? null : '已打包静态ZIP', { status: 200 }) };
    env.ASSETS = assets;
    const download = await worker.fetch(req('/api/download/hoodie-cat-openpets', { cookie }), env); assert.equal(download.status, 200);
    await worker.fetch(req('/api/download/hoodie-cat-openpets', { cookie }), env);
    assert.equal((await activity(env))['hoodie-cat-openpets'].downloads, 1);
    const builtinPlugin = await worker.fetch(req('/api/download/lingyin.file-assistant', { cookie }), env); assert.equal(builtinPlugin.status, 200);
    await worker.fetch(req('/api/download/lingyin.file-assistant', { cookie }), env); assert.equal((await activity(env))['lingyin.file-assistant'].downloads, 1);
    const builtinLike = await worker.fetch(req('/api/works/lingyin.file-assistant/like', { method: 'POST', owner: 'plugin-user', body: { liked: true } }), env); assert.equal(builtinLike.status, 200); assert.equal((await activity(env))['lingyin.file-assistant'].likes, 1);
    env.ASSETS = { fetch: async () => new Response(null, { status: 404 }) };
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 404 }));
    assert.equal((await worker.fetch(req('/api/download/firefly--lingxiaotian', { cookie }), env)).status, 404);
    assert.equal((await activity(env))['firefly--lingxiaotian'], undefined);
  });
});

test('桌宠写入失败清理附加预览并可重试，不留下假公开作品', async () => {
  await withStorage(async ({ env, db, objects }) => {
    db.failInsert = true; assert.equal((await worker.fetch(upload(), env)).status, 503); assert.equal(objects.size, 0);
    db.failInsert = false; assert.equal((await worker.fetch(upload(), env)).status, 201);
    assert.equal((await (await worker.fetch(req('/api/pets'), env)).json()).items.length, 1);
  });
});
