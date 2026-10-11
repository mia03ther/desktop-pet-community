import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createCatalogManagement } from '../worker/catalog-management.mjs';
import { createWorker } from '../worker/index.mjs';
import { pets } from '../../community-host/public/catalog.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const origin = 'https://desktoppet-e9e.pages.dev';
const secret = 'a'.repeat(64);
const works = [{ id: 'pet-a', kind: 'pet', author: '作者', title: '测试角色', category: '动漫角色', thumbnail: 'assets/shared.webp', download: 'assets/a.zip' }, { id: 'plugin-a', kind: 'plugin', title: '测试插件', author: '作者', category: '生活陪伴', thumbnail: 'assets/shared.webp', download: 'assets/plugin.zip' }];
// 使用真实 SQLite 执行生产 SQL，跨服务实例保留同一数据库，模拟 D1 持久化。
function fixture(t) {
  const database = new DatabaseSync(':memory:'); t.after(() => database.close());
  const DB = { prepare(sql) {
    function statement(values = []) { return { bind: (...args) => statement(args), async first() { return database.prepare(sql).get(...values) || null; }, async all() { return { results: database.prepare(sql).all(...values) }; }, async run() { return { meta: database.prepare(sql).run(...values) }; }, execute() { return database.prepare(sql).run(...values); } }; }
    return statement();
  }, async batch(statements) { database.exec('BEGIN'); try { const results = statements.map(statement => statement.execute()); database.exec('COMMIT'); return results; } catch (error) { database.exec('ROLLBACK'); throw error; } } };
  let time = Date.UTC(2026, 9, 12);
  const manager = () => createCatalogManagement({ DB, secret, origin, works, now: () => time });
  return { DB, manager, advance: milliseconds => { time += milliseconds; } };
}
function request(path, method = 'GET', input, cookie, extra = {}) {
  return new Request(origin + path, { method, headers: { ...(input ? { 'content-type': 'application/json', origin } : {}), ...(cookie ? { cookie } : {}), ...extra }, ...(input ? { body: JSON.stringify(input) } : {}) });
}
async function login(manager) {
  const result = await manager.handle(request('/api/admin/login', 'POST', { key: secret }), '127.0.0.1');
  assert.equal(result.status, 200); const header = result.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(header.includes(flag));
  return header.split(';')[0];
}

test('管理写入只接受有效会话及本站来源，伪造身份、错误密钥和跨站操作均不能改变目录', async t => {
  const { manager } = fixture(t), service = manager();
  const update = { hidden: true, category: '精选', revision: 0 };
  assert.equal((await service.handle(request('/api/admin/works/pet-a', 'PATCH', update, null, { 'oai-authenticated-user-id': 'owner', 'x-admin': 'true' }), 'peer')).status, 401);
  assert.equal((await service.handle(request('/api/admin/login', 'POST', { key: 'wrong' }), 'peer')).status, 401);
  const cookie = await login(service);
  assert.equal((await service.handle(request('/api/admin/works/pet-a', 'PATCH', update, cookie, { origin: 'https://evil.test' }), 'peer')).status, 403);
  assert.equal((await service.handle(request('/api/admin/works/pet-a', 'PATCH', update, cookie, { origin: '' }), 'peer')).status, 403);
  assert.equal((await service.handle(request('/api/admin/works/pet-a', 'PATCH', update, cookie.replace(/.$/, 'z')), 'peer')).status, 401);
  assert.equal((await service.handle(request('/api/admin/works/pet-a', 'PATCH', { ...update, category: '<script>' }, cookie), 'peer')).status, 400);
  assert.deepEqual(await service.overrides(), []);
});

test('下架、恢复与分类跨实例持久化；冲突保存不能覆盖，原作者不变', async t => {
  const { manager } = fixture(t), service = manager(), cookie = await login(service);
  const result = await service.handle(request('/api/admin/works/pet-a', 'PATCH', { hidden: true, category: '我的分类', revision: 0 }, cookie), 'peer');
  assert.equal(result.status, 200); assert.equal((await result.json()).item.revision, 1);
  const restarted = manager(), list = await (await restarted.handle(request('/api/admin/works', 'GET', undefined, cookie), 'peer')).json();
  const pet = list.items.find(item => item.id === 'pet-a'); assert.equal(pet.hidden, true); assert.equal(pet.category, '我的分类'); assert.equal(pet.author, '作者');
  assert.equal((await restarted.handle(request('/api/admin/works/pet-a', 'PATCH', { hidden: false, category: '错误覆盖', revision: 0 }, cookie), 'peer')).status, 409);
  assert.equal((await restarted.handle(request('/api/admin/works/pet-a', 'PATCH', { hidden: false, category: '新分类', revision: 1 }, cookie), 'peer')).status, 200);
  assert.equal((await restarted.overrides())[0].revision, 2);
  assert.equal((await restarted.overrides())[0].category, '新分类');
});

test('下架阻止匿名 API 与原始 ZIP，包括编码路径、HEAD；共享封面不影响在架作品，管理员可看原预览', async t => {
  const { manager } = fixture(t), service = manager(), cookie = await login(service);
  await service.handle(request('/api/admin/works/pet-a', 'PATCH', { hidden: true, category: '动漫角色', revision: 0 }, cookie), 'peer');
  for (const path of ['/api/download/pet-a', '/api/works/pet-a/like', '/assets/a.zip', '/%61ssets/a.zip', '/assets/%61.zip']) {
    for (const method of ['GET', 'HEAD']) assert.equal(await service.blocked(request(path, method)), true, path);
  }
  assert.equal(await service.blocked(request('/assets/shared.webp')), false);
  assert.equal(await service.blocked(request('/assets/a.zip', 'GET', undefined, cookie)), false);
  assert.equal(await service.blocked(request('/assets/plugin.zip')), false);
});

test('登录限流跨实例有效，会话到期及轮换密钥均失效', async t => {
  const f = fixture(t), service = f.manager(), cookie = await login(service);
  for (let i = 0; i < 12; i++) assert.equal((await f.manager().handle(request('/api/admin/login', 'POST', { key: 'wrong' }), 'attacker')).status, 401);
  assert.equal((await f.manager().handle(request('/api/admin/login', 'POST', { key: secret }), 'attacker')).status, 429);
  f.advance(3600001); assert.equal((await service.handle(request('/api/admin/login', 'POST', { key: secret }), 'attacker')).status, 200);
  const rotated = createCatalogManagement({ DB: f.DB, secret: 'b'.repeat(64), origin, works });
  assert.equal((await (await rotated.handle(request('/api/admin/session', 'GET', undefined, cookie), 'peer')).json()).signedIn, false);
  f.advance(8 * 3600000); assert.equal((await (await service.handle(request('/api/admin/session', 'GET', undefined, cookie), 'peer')).json()).signedIn, false);
});

test('真实 Worker 对下架作品返回410，失败时不泄露管理状态或提供素材，恢复后保留原接口', async t => {
  const { DB } = fixture(t), worker = createWorker(null), pet = pets.find(item => item.download.startsWith('assets/'));
  const env = { DB, ADMIN_KEY: secret, ASSETS: { fetch: async () => new Response('原素材') } };
  const logged = await worker.fetch(request('/api/admin/login', 'POST', { key: secret }), env); assert.equal(logged.status, 200);
  const cookie = logged.headers.get('set-cookie').split(';')[0];
  assert.equal((await worker.fetch(request('/api/admin/works/' + pet.id, 'PATCH', { hidden: true, category: '精选', revision: 0 }, cookie), env)).status, 200);
  assert.equal((await worker.fetch(request('/api/download/' + pet.id), env)).status, 410);
  assert.equal((await worker.fetch(request('/' + pet.download), env)).status, 410);
  assert.equal((await worker.fetch(request('/' + pet.download, 'HEAD'), env)).status, 410);
  assert.equal((await worker.fetch(request('/api/admin/works'), env)).status, 401);
  assert.ok((await (await worker.fetch(request('/api/catalog-management'), env)).json()).items.some(item => item.id === pet.id && item.hidden));
  const broken = { ...env, DB: { prepare() { throw new Error('私人服务错误'); }, batch() { throw new Error('私人服务错误'); } } };
  const response = await worker.fetch(request('/' + pet.download), broken); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('私人服务错误'));
  await worker.fetch(request('/api/admin/works/' + pet.id, 'PATCH', { hidden: false, category: '精选', revision: 1 }, cookie), env);
  assert.equal((await worker.fetch(request('/' + pet.download), env)).status, 200);
});

test('真实 workerd+D1 执行管理登录、下架、分类和恢复，不以 SQLite 模拟代替运行时', { skip: process.env.COMMUNITY_WORKERD_TEST !== '1' }, async () => {
  const { Miniflare } = await import(new URL('../../desktop-pet/node_modules/.pnpm/miniflare@5.20260801.1-alpha/node_modules/miniflare/dist/src/index.js', import.meta.url).href);
  const source = new URL('../worker/catalog-management.mjs', import.meta.url), moduleRoot = dirname(fileURLToPath(source));
  const entry = `import { createCatalogManagement } from './catalog-management.mjs'; let service;
    export default { async fetch(request, env) { service ||= createCatalogManagement({ DB:env.DB, secret:${JSON.stringify(secret)}, origin:${JSON.stringify(origin)}, works:${JSON.stringify(works)} }); return await service.handle(request,'test-peer') || new Response(String(await service.blocked(request))); }};`;
  const runtime = new Miniflare({ modulesRoot: moduleRoot, modules: [{ type: 'ESModule', path: join(moduleRoot, 'admin-test-entry.mjs'), contents: entry }, { type: 'ESModule', path: fileURLToPath(source), contents: readFileSync(source, 'utf8') }], compatibilityDate: '2026-08-04', d1Databases: { DB: 'admin-test-database' }, port: 0 });
  async function dispatch(input) { return runtime.dispatchFetch(input.url, { method: input.method, headers: Object.fromEntries(input.headers), ...(input.body ? { body: await input.text() } : {}) }); }
  try {
    const signed = await dispatch(request('/api/admin/login', 'POST', { key: secret })); assert.equal(signed.status, 200, await signed.clone().text());
    const cookie = signed.headers.get('set-cookie').split(';')[0];
    const hidden = await dispatch(request('/api/admin/works/pet-a', 'PATCH', { hidden: true, category: '运行时分类', revision: 0 }, cookie)); assert.equal(hidden.status, 200, await hidden.clone().text());
    assert.equal((await hidden.json()).item.revision, 1);
    assert.equal(await (await dispatch(request('/assets/a.zip'))).text(), 'true');
    const DB = await runtime.getD1Database('DB'), row = await DB.prepare('SELECT category, hidden FROM community_work_management WHERE id = ?').bind('pet-a').first();
    assert.equal(row.category, '运行时分类'); assert.equal(row.hidden, 1);
    const restored = await dispatch(request('/api/admin/works/pet-a', 'PATCH', { hidden: false, category: '运行时分类', revision: 1 }, cookie)); assert.equal(restored.status, 200, await restored.clone().text());
    assert.equal(await (await dispatch(request('/assets/a.zip'))).text(), 'false');
  } finally { await runtime.dispose(); }
});
