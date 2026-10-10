import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createAnonymousInteractionService } from '../worker/anonymous-session.mjs';

const origin = 'https://pet.example.test';
const salt = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const works = [{ id: 'pet-a', author: '作者 A' }, { id: 'plugin-a', author: '作者 A' }, { id: 'pet-b', author: '作者 B' }];
const migrations = ['0000_first_deathstrike.sql', '0001_rainy_patch.sql', '0011_anonymous_interactions.sql'].map(name => readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8'));

// 真正执行与 D1 相同的 SQL；测试专用 SQLite 文件不接触用户档案。
class SqliteD1 {
  constructor(path) {
    this.database = new DatabaseSync(path);
    for (const migration of migrations) this.database.exec(migration.replace(/CREATE (TABLE|(?:UNIQUE )?INDEX) (?!IF NOT EXISTS )/g, 'CREATE $1 IF NOT EXISTS '));
  }
  prepare(sql) {
    const database = this.database;
    function statement(args = []) {
      return {
        bind(...values) { return statement(values); },
        async first() { return database.prepare(sql).get(...args) || null; },
        async all() { return this.execute(); },
        async run() { return this.execute(); },
        execute() {
          const query = database.prepare(sql);
          if (query.columns().length) return { success: true, results: query.all(...args), meta: { changes: 0 } };
          const result = query.run(...args);
          return { success: true, results: [], meta: { changes: Number(result.changes) } };
        },
      };
    }
    return statement();
  }
  async batch(statements) {
    this.database.exec('BEGIN IMMEDIATE');
    try { const result = statements.map(statement => statement.execute()); this.database.exec('COMMIT'); return result; }
    catch (error) { this.database.exec('ROLLBACK'); throw error; }
  }
  close() { this.database.close(); }
}

function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'desktop-pet-anonymous-test-'));
  const path = join(directory, 'interactions.sqlite');
  let DB = new SqliteD1(path), time = Date.UTC(2026, 9, 10);
  const clock = () => time;
  let service = createAnonymousInteractionService({ DB, origin, salt, works, now: clock, ...options });
  t.after(() => {
    DB.close();
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(directory.includes('desktop-pet-anonymous-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  return { get DB() { return DB; }, get service() { return service; }, advance(ms) { time += ms; }, restart() {
    DB.close(); DB = new SqliteD1(path); service = createAnonymousInteractionService({ DB, origin, salt, works, now: clock, ...options });
  } };
}

function contributor(author = '作者 A', kind = 'pets') { return `/api/contributors/${encodeURIComponent(author)}?kind=${kind}`; }
function request(path, method = 'GET', data, overrides = {}, target = origin) {
  const headers = new Headers(method === 'GET' ? {} : { origin, 'content-type': 'application/json' });
  for (const [name, value] of Object.entries(overrides)) if (value === null) headers.delete(name); else headers.set(name, value);
  return new Request(target + path, { method, headers, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
}

test('匿名关注跨桌宠和插件统一，重复幂等、不同来源独立，取消后持久读取', async t => {
  const state = fixture(t);
  assert.deepEqual(await (await state.service.handle(request(contributor()), '127.0.0.1')).json(), { available: true, followers: 0, following: false });
  const follow = await state.service.handle(request(contributor(), 'PUT', { following: true }), '127.0.0.1');
  assert.deepEqual(await follow.json(), { available: true, followers: 1, following: true, changed: true });
  assert.equal(follow.headers.get('set-cookie'), null);
  const repeated = await state.service.handle(request(contributor('作者 A', 'plugins'), 'PUT', { following: true }), '127.0.0.1');
  assert.deepEqual(await repeated.json(), { available: true, followers: 1, following: true, changed: false });
  assert.deepEqual(await (await state.service.handle(request(contributor()), '127.0.0.2')).json(), { available: true, followers: 1, following: false });
  await state.service.handle(request(contributor(), 'PUT', { following: true }), '127.0.0.2');
  state.restart();
  assert.deepEqual(await (await state.service.handle(request(contributor()), '127.0.0.1')).json(), { available: true, followers: 2, following: true });
  const unfollow = await state.service.handle(request(contributor(), 'PUT', { following: false }), '127.0.0.1');
  assert.deepEqual(await unfollow.json(), { available: true, followers: 1, following: false, changed: true });
});

test('只存角色作用域摘要，身份头、cookie 和 XFF 不改变匿名来源或授予发布权', async t => {
  const state = fixture(t);
  const spoof = { 'oai-authenticated-user-id': 'admin', 'oai-sites-authorization': 'forged', cookie: 'pet-visitor=forged', 'x-forwarded-for': 'another-ip' };
  await state.service.handle(request(contributor(), 'PUT', { following: true }, spoof), '127.0.0.1');
  await state.service.handle(request(contributor('作者 B'), 'PUT', { following: true }), '127.0.0.1');
  const rows = state.DB.database.prepare('SELECT * FROM community_creator_follows').all();
  assert.equal(rows.length, 2); assert.notEqual(rows[0].actor_hash, rows[1].actor_hash);
  for (const row of rows) { assert.match(row.actor_hash, /^[a-f0-9]{64}$/); assert.ok(!Object.values(row).includes('127.0.0.1')); assert.ok(!Object.values(row).includes(salt)); }
  assert.equal('identity' in state.service, false);
  for (const path of ['/api/plugins', '/api/pets', '/api/requests', '/api/auth/register']) assert.equal(await state.service.handle(request(path, 'POST', { author: 'admin' }, spoof), '127.0.0.1'), null);
  assert.equal((await (await state.service.handle(request(contributor(), 'GET', undefined, spoof), '127.0.0.2')).json()).following, false);
});

test('作者和作品必须真实存在，社区公开记录也可使用，名称不作猜测合并', async t => {
  const state = fixture(t);
  state.DB.database.prepare(`INSERT INTO community_plugins (id,owner,fingerprint,work_id,title,description,author,license,source,workflow,compatibility,package_key,size,created_at) VALUES ('community-a','owner','hash','x','作品','','社区作者','MIT','','plugin-import','','key',1,'2026-10-10')`).run();
  assert.equal((await state.service.handle(request(contributor('社区作者')), '127.0.0.1')).status, 200);
  assert.equal((await state.service.handle(request('/api/works/community-a/like', 'POST', { liked: true }), '127.0.0.1')).status, 200);
  assert.equal((await state.service.handle(request(contributor('不存在'), 'PUT', { following: true }), '127.0.0.1')).status, 404);
  assert.equal((await state.service.handle(request('/api/works/nonexistent/like', 'POST', { liked: true }), '127.0.0.1')).status, 404);
  assert.equal((await state.service.handle(request(contributor('作者 a')), '127.0.0.1')).status, 404);
  assert.equal((await state.service.handle(request(contributor('作者 A', 'unknown')), '127.0.0.1')).status, 400);
  assert.equal((await state.service.handle(request('/api/contributors/%ZZ'), '127.0.0.1')).status, 400);
  assert.equal((await state.service.handle(request(contributor('作者\nA')), '127.0.0.1')).status, 400);
});

test('关注和点赞写入严格同源，缺来源和跨来源均拒绝，不修改已有状态', async t => {
  const state = fixture(t);
  for (const headers of [{ origin: null }, { origin: 'null' }, { origin: 'https://foreign.test' }, { 'sec-fetch-site': 'cross-site' }]) {
    assert.equal((await state.service.handle(request(contributor(), 'PUT', { following: true }, headers), '127.0.0.1')).status, 403);
    assert.equal((await state.service.handle(request('/api/works/pet-a/like', 'POST', { liked: true }, headers), '127.0.0.1')).status, 403);
  }
  assert.equal((await state.service.handle(request(contributor(), 'GET', undefined, {}, 'https://foreign.test'), '127.0.0.1')).status, 403);
  assert.equal(state.DB.database.prepare('SELECT COUNT(*) AS count FROM community_creator_follows').get().count, 0);
  assert.equal(state.DB.database.prepare('SELECT COUNT(*) AS count FROM community_likes').get().count, 0);
});

test('点赞真实去重和撤销，下载与历史数据沿用原表，周统计只计七天内记录', async t => {
  const state = fixture(t);
  state.DB.database.prepare(`INSERT INTO community_downloads VALUES ('d1','pet-a','old-browser','2026-10-10','2026-10-10T00:00:00.000Z'),('d2','pet-a','another-browser','2026-09-01','2026-09-01T00:00:00.000Z')`).run();
  await state.service.handle(request('/api/works/pet-a/like', 'POST', { liked: true }), '127.0.0.1');
  const duplicate = await state.service.handle(request('/api/works/pet-a/like', 'POST', { liked: true }), '127.0.0.1');
  assert.deepEqual((await duplicate.json()).items['pet-a'], { likes: 1, downloads: 2, weekly: 2, weeklyLikes: 1, weeklyDownloads: 1, liked: true });
  assert.equal((await (await state.service.handle(request('/api/activity'), '127.0.0.2')).json()).items['pet-a'].liked, false);
  await state.service.handle(request('/api/works/plugin-a/like', 'POST', { liked: true }), '127.0.0.1');
  const rows = state.DB.database.prepare('SELECT actor FROM community_likes').all(); assert.notEqual(rows[0].actor, rows[1].actor);
  state.restart();
  assert.equal((await (await state.service.handle(request('/api/activity'), '127.0.0.1')).json()).items['plugin-a'].liked, true);
  const cancelled = await state.service.handle(request('/api/works/pet-a/like', 'POST', { liked: false }), '127.0.0.1');
  assert.deepEqual((await cancelled.json()).items['pet-a'], { likes: 0, downloads: 2, weekly: 1, weeklyLikes: 0, weeklyDownloads: 1, liked: false });
});

test('匿名来源每小时最多六十次写入，数据库重开仍限流，换时间后恢复', async t => {
  const state = fixture(t);
  for (let index = 0; index < 60; index++) assert.equal((await state.service.handle(request(contributor(), 'PUT', { following: true }), '127.0.0.1')).status, 200);
  state.restart();
  const limited = await state.service.handle(request('/api/works/pet-a/like', 'POST', { liked: true }, { 'x-forwarded-for': 'new-ip' }), '127.0.0.1');
  assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '3600');
  assert.equal((await state.service.handle(request(contributor(), 'PUT', { following: true }), '127.0.0.2')).status, 200);
  state.advance(3600000);
  assert.equal((await state.service.handle(request(contributor(), 'PUT', { following: false }), '127.0.0.1')).status, 200);
});

test('活动快照批量返回真实关注数，无记录作者为零，失效或非法作者不进入快照', async t => {
  const state = fixture(t);
  state.DB.database.prepare(`INSERT INTO community_plugins (id,owner,fingerprint,work_id,title,description,author,license,source,workflow,compatibility,package_key,size,created_at) VALUES ('community-a','owner','hash','x','作品','','社区作者','MIT','','plugin-import','','key',1,'2026-10-10')`).run();
  await state.service.handle(request(contributor(), 'PUT', { following: true }), '127.0.0.1');
  await state.service.handle(request(contributor('作者 A', 'plugins'), 'PUT', { following: true }), '127.0.0.2');
  await state.service.handle(request(contributor('社区作者'), 'PUT', { following: true }), '127.0.0.1');
  state.DB.database.prepare('INSERT INTO community_creator_follows VALUES (?, ?, ?)').run('已移除作者', '0'.repeat(64), '2026-10-10');
  const snapshot = await (await state.service.handle(request('/api/activity'), '127.0.0.1')).json();
  assert.deepEqual(snapshot.contributors, { '作者 A': { followers: 2 }, '作者 B': { followers: 0 }, '社区作者': { followers: 1 } });
  assert.deepEqual(snapshot.items, {});
  await state.service.handle(request(contributor(), 'PUT', { following: false }), '127.0.0.1');
  const next = await (await state.service.handle(request('/api/activity'), '127.0.0.1')).json();
  assert.equal(next.contributors['作者 A'].followers, 1);
});

test('输入有界、方法准确；缺环境或数据库失败不返回假零统计', async t => {
  const state = fixture(t);
  for (const body of [{ following: 'true' }, { following: true, actor: 'other' }, [], null]) assert.equal((await state.service.handle(request(contributor(), 'PUT', body), '127.0.0.1')).status, 400);
  assert.equal((await state.service.handle(request(contributor(), 'PUT', { following: true, pad: 'x'.repeat(1100) }), '127.0.0.1')).status, 413);
  assert.equal((await state.service.handle(request(contributor(), 'PUT', { following: true }, { 'content-type': 'text/plain' }), '127.0.0.1')).status, 415);
  assert.equal((await state.service.handle(request(contributor(), 'POST', {}), '127.0.0.1')).status, 405);
  assert.equal((await state.service.handle(request('/api/activity', 'POST', {}), '127.0.0.1')).status, 405);
  assert.equal((await state.service.handle(request(contributor()), 'unknown')).status, 503);
  assert.throws(() => createAnonymousInteractionService({ DB: state.DB, origin, salt: 'short', works }));
  state.DB.database.exec('DROP TABLE community_creator_follows');
  const failure = await state.service.handle(request(contributor()), '127.0.0.1');
  assert.equal(failure.status, 503); assert.ok(!(await failure.text()).includes('community_creator_follows'));
  assert.equal((await state.service.handle(request('/api/activity'), '127.0.0.1')).status, 503);
});

test('大目录的个人点赞查询分批，原型名称不能污染公共响应', async t => {
  const manyWorks = Array.from({ length: 150 }, (_, index) => ({ id: `pet-${index}`, author: '作者 A' }));
  const state = fixture(t, { works: manyWorks });
  for (let index = 0; index < 65; index++) state.DB.database.prepare('INSERT INTO community_likes VALUES (?, ?, ?, ?)').run(`old-${index}`, `pet-${index}`, index.toString(16).padStart(64, '0'), '2026-10-10T00:00:00.000Z');
  await state.service.handle(request('/api/works/pet-149/like', 'POST', { liked: true }), '127.0.0.1');
  const activity = await (await state.service.handle(request('/api/activity'), '127.0.0.1')).json();
  assert.equal(activity.items['pet-149'].liked, true);
  assert.throws(() => createAnonymousInteractionService({ DB: state.DB, origin, salt, works: [{ id: '__proto__', author: '作者' }] }));
});

test('本机真实 workerd+D1 完成匿名关注、去重、个人状态、取消和点赞统计', { skip: process.env.COMMUNITY_WORKERD_TEST !== '1' }, async () => {
  const { Miniflare } = await import(new URL('../../desktop-pet/node_modules/.pnpm/miniflare@5.20260801.1-alpha/node_modules/miniflare/dist/src/index.js', import.meta.url).href);
  const source = new URL('../worker/anonymous-session.mjs', import.meta.url), moduleRoot = dirname(fileURLToPath(source));
  const entry = `import { createAnonymousInteractionService } from './anonymous-session.mjs';
    export default { async fetch(request, env) { return await createAnonymousInteractionService({ DB:env.DB, origin:'${origin}', salt:${JSON.stringify(salt)}, works:${JSON.stringify(works)} }).handle(request, request.headers.get('x-test-peer') || '127.0.0.1') || new Response(null,{status:404}); }};`;
  const runtime = new Miniflare({ modulesRoot: moduleRoot, modules: [
    { type: 'ESModule', path: join(moduleRoot, 'anonymous-test-entry.mjs'), contents: entry },
    { type: 'ESModule', path: fileURLToPath(source), contents: readFileSync(source, 'utf8') },
  ], compatibilityDate: '2026-08-04', d1Databases: { DB: 'anonymous-test-database' }, port: 0 });
  async function dispatch(input) { return runtime.dispatchFetch(input.url, { method: input.method, headers: Object.fromEntries(input.headers), ...(input.body ? { body: await input.text() } : {}) }); }
  try {
    const DB = await runtime.getD1Database('DB');
    const schema = migrations.join('\n').replace(/^\s*--.*$/gm, '').split(';').map(sql => sql.trim()).filter(Boolean);
    await DB.batch(schema.map(sql => DB.prepare(sql)));
    const first = await dispatch(request(contributor(), 'PUT', { following: true }));
    assert.equal(first.status, 200, await first.clone().text());
    assert.deepEqual(await first.json(), { available: true, followers: 1, following: true, changed: true });
    assert.equal((await (await dispatch(request(contributor(), 'PUT', { following: true }))).json()).followers, 1);
    assert.equal((await (await dispatch(request(contributor(), 'GET', undefined, { 'x-test-peer': '127.0.0.2' }))).json()).following, false);
    assert.equal((await (await dispatch(request(contributor(), 'PUT', { following: false }))).json()).followers, 0);
    const liked = await dispatch(request('/api/works/pet-a/like', 'POST', { liked: true }));
    assert.equal(liked.status, 200, await liked.clone().text());
    const snapshot = await liked.json();
    assert.deepEqual(snapshot.items['pet-a'], { likes: 1, downloads: 0, weekly: 1, weeklyLikes: 1, weeklyDownloads: 0, liked: true });
    assert.deepEqual(snapshot.contributors, { '作者 A': { followers: 0 }, '作者 B': { followers: 0 } });
    assert.equal((await (await dispatch(request('/api/activity'))).json()).items['pet-a'].liked, true);
    const stored = await DB.prepare('SELECT actor FROM community_likes').first(); assert.match(stored.actor, /^[a-f0-9]{64}$/);
  } finally { await runtime.dispose(); }
});
