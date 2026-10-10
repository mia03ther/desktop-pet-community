import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createAccountService } from '../worker/accounts.mjs';

const origin = 'https://pet.example.test';
const password = '仅用于行为测试-password123!';

const migration = readFileSync(new URL('../migrations/0010_accounts.sql', import.meta.url), 'utf8');

// 使用真实 SQLite 执行原 D1 SQL，异步接口和事务 batch 与 Worker 契约一致。
class SqliteD1Fixture {
  constructor(path) {
    this.database = new DatabaseSync(path);
    this.database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    this.database.exec(migration);
  }

  prepare(sql) {
    const database = this.database;
    function statement(args = []) {
      return {
        bind(...values) { return statement(values); },
        async first() { return database.prepare(sql).get(...args) || null; },
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
    try {
      const results = statements.map(statement => statement.execute());
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  close() { this.database.close(); }
}

function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'desktop-pet-account-test-'));
  let timestamp = Date.UTC(2026, 9, 9);
  const clock = () => timestamp;
  let DB = new SqliteD1Fixture(join(directory, 'auth.sqlite'));
  let service = createAccountService({ DB, origin, now: clock, ...options });
  t.after(() => {
    service.close();
    DB.close();
    // 只清除本测试直接创建的临时子目录，不能指向用户档案或任意计算路径。
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(directory.includes('desktop-pet-account-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory,
    clock,
    get DB() { return DB; },
    get service() { return service; },
    advance(milliseconds) { timestamp += milliseconds; },
    restart() {
      service.close();
      DB.close();
      DB = new SqliteD1Fixture(join(directory, 'auth.sqlite'));
      service = createAccountService({ DB, origin, now: clock, ...options });
    },
  };
}

function post(path, data, overrides = {}, targetOrigin = origin) {
  const headers = new Headers({ origin, 'content-type': 'application/json' });
  for (const [name, value] of Object.entries(overrides)) {
    if (value === null) headers.delete(name);
    else headers.set(name, value);
  }
  return new Request(`${targetOrigin}${path}`, { method: 'POST', headers, body: JSON.stringify(data) });
}

function sessionRequest(cookie, headers = {}) {
  return new Request(`${origin}/api/auth/session`, { headers: { ...(cookie ? { cookie } : {}), ...headers } });
}

function cookieFrom(response) {
  return response.headers.get('set-cookie')?.split(';', 1)[0];
}

test('注册后的账号和会话在真实 SQLite 重开后仍可用，凭据只保存摘要', async t => {
  const state = fixture(t);
  const response = await state.service.handle(post('/api/auth/register', { username: '小宠Alice', password }), '127.0.0.1');
  assert.equal(response.status, 201);
  const user = (await response.json()).user;
  const cookie = cookieFrom(response);
  assert.deepEqual(await state.service.identity(sessionRequest(cookie)), user);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /SameSite=Lax/);
  assert.match(response.headers.get('set-cookie'), /Secure/);
  assert.match(cookie, /^__Host-desktop_pet_session=/);

  const database = new DatabaseSync(join(state.directory, 'auth.sqlite'), { readOnly: true });
  try {
    const account = database.prepare('SELECT * FROM accounts').get();
    assert.notEqual(account.password_hash, password);
    assert.match(account.password_hash, /^[a-f0-9]{64}$/);
    assert.match(account.salt, /^[a-f0-9]{32}$/);
    assert.ok(!Object.values(account).includes(password));
    const session = database.prepare('SELECT * FROM auth_sessions').get();
    const token = cookie.split('=')[1];
    assert.equal(session.token_hash, createHash('sha256').update(token).digest('hex'));
    assert.ok(!Object.values(session).includes(token));
  } finally { database.close(); }

  state.restart();
  assert.deepEqual(await state.service.identity(sessionRequest(cookie)), user);
  const login = await state.service.handle(post('/api/auth/login', { username: '小宠alice', password }), '127.0.0.2');
  assert.equal(login.status, 200);
  assert.deepEqual((await login.json()).user, user);
});

test('失败登录不产生会话，也不通过差异文案泄露用户名是否存在', async t => {
  const state = fixture(t);
  await state.service.handle(post('/api/auth/register', { username: 'alice', password }), '127.0.0.1');
  const known = await state.service.handle(post('/api/auth/login', { username: 'alice', password: 'wrong-password-123' }), '127.0.0.2');
  const absent = await state.service.handle(post('/api/auth/login', { username: 'nobody', password: 'wrong-password-123' }), '127.0.0.3');
  assert.equal(known.status, 401);
  assert.equal(absent.status, 401);
  assert.deepEqual(await known.json(), await absent.json());
  assert.equal(known.headers.get('set-cookie'), null);
  const duplicate = await state.service.handle(post('/api/auth/register', { username: 'ALICE', password }), '127.0.0.4');
  assert.equal(duplicate.status, 409);
});

test('伪造身份头、伪造或重复 Cookie 不能产生本服务身份', async t => {
  const state = fixture(t);
  const forgedHeaders = { 'x-oai-user-id': 'admin', 'x-oai-username': 'admin', 'x-forwarded-user': 'admin' };
  assert.equal(await state.service.identity(sessionRequest(null, forgedHeaders)), null);
  assert.equal(await state.service.identity(sessionRequest(`__Host-desktop_pet_session=${'a'.repeat(43)}`, forgedHeaders)), null);
  assert.equal((await (await state.service.handle(sessionRequest(null, forgedHeaders), '127.0.0.1')).json()).user, null);
  const response = await state.service.handle(post('/api/auth/register', { username: 'alice', password }, forgedHeaders), '127.0.0.1');
  const user = (await response.json()).user;
  assert.notEqual(user.id, 'admin');
  const cookie = cookieFrom(response);
  assert.deepEqual(await state.service.identity(sessionRequest(cookie, forgedHeaders)), user);
  assert.equal(await state.service.identity(sessionRequest(`${cookie}; ${cookie}`)), null);
  assert.equal(await state.service.identity(sessionRequest(`${cookie}; other=${'x'.repeat(4096)}`)), null);
});

test('注册、登录和注销拒绝跨源、空来源及跨站上下文，合法会话保持', async t => {
  const state = fixture(t);
  const registered = await state.service.handle(post('/api/auth/register', { username: 'alice', password }), '127.0.0.1');
  const cookie = cookieFrom(registered);
  for (const path of ['/api/auth/register', '/api/auth/login', '/api/auth/logout']) {
    for (const headers of [{ origin: 'https://evil.example', cookie }, { origin: null, cookie }, { origin: 'null', cookie }, { 'sec-fetch-site': 'cross-site', cookie }]) {
      const response = await state.service.handle(post(path, { username: 'bob', password }, headers), '127.0.0.2');
      assert.equal(response.status, 403);
      assert.equal(response.headers.get('set-cookie'), null);
    }
  }
  assert.ok(await state.service.identity(sessionRequest(cookie)));
  const wrongHost = await state.service.handle(post('/api/auth/login', { username: 'alice', password }, {}, 'https://other.example.test'), '127.0.0.3');
  assert.equal(wrongHost.status, 403);
});

test('注销撤销持久会话，七天到期后的 Cookie 不能重新登录', async t => {
  const state = fixture(t);
  const registered = await state.service.handle(post('/api/auth/register', { username: 'alice', password }), '127.0.0.1');
  const cookie = cookieFrom(registered);
  const logout = await state.service.handle(post('/api/auth/logout', {}, { cookie }), '127.0.0.1');
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  state.restart();
  assert.equal(await state.service.identity(sessionRequest(cookie)), null);
  const login = await state.service.handle(post('/api/auth/login', { username: 'alice', password }), '127.0.0.1');
  const current = cookieFrom(login);
  assert.ok(await state.service.identity(sessionRequest(current)));
  state.advance(7 * 24 * 60 * 60 * 1000);
  state.restart();
  assert.equal(await state.service.identity(sessionRequest(current)), null);
});

test('独立用户名和可信 IP 的尝试限制持久化，到期恢复；伪造转发 IP 无效', async t => {
  const state = fixture(t);
  for (let index = 0; index < 12; index++) {
    const response = await state.service.handle(post('/api/auth/login', { username: 'alice', password }), `127.0.0.${index + 1}`);
    assert.equal(response.status, 401);
  }
  state.restart();
  const named = await state.service.handle(post('/api/auth/login', { username: 'ALICE', password }), '127.0.1.1');
  assert.equal(named.status, 429);
  assert.ok(Number(named.headers.get('retry-after')) > 0);
  for (let index = 0; index < 30; index++) {
    const response = await state.service.handle(post('/api/auth/login', { username: 'x', password }, { 'x-forwarded-for': `10.0.0.${index}` }), '127.0.2.1');
    assert.equal(response.status, 400);
  }
  assert.equal((await state.service.handle(post('/api/auth/login', { username: 'x', password }), '127.0.2.1')).status, 429);
  state.advance(10 * 60 * 1000 + 1);
  assert.equal((await state.service.handle(post('/api/auth/login', { username: 'alice', password }), '127.0.2.1')).status, 401);
});

test('畸形或超长账号提交有界拒绝，不接受调用方指定的身份', async t => {
  const state = fixture(t);
  const data = [
    { username: 'ab', password },
    { username: '<script>', password },
    { username: 'alice', password: 'short' },
    { username: 'alice', password: 'x'.repeat(129) },
    { username: 'alice', password, id: 'admin' },
    { username: ['alice'], password },
  ];
  for (const item of data) assert.equal((await state.service.handle(post('/api/auth/register', item), '127.0.0.1')).status, 400);
  assert.equal((await state.service.handle(post('/api/auth/login', {}, { 'content-type': 'text/plain' }), '127.0.0.1')).status, 415);
  const oversize = post('/api/auth/register', { username: 'alice', password: 'x'.repeat(5000) });
  assert.equal((await state.service.handle(oversize, '127.0.0.1')).status, 413);
  const invalidUtf8 = new Request(`${origin}/api/auth/register`, {
    method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: new Uint8Array([0xff, 0xfe]),
  });
  assert.equal((await state.service.handle(invalidUtf8, '127.0.0.1')).status, 400);
});

test('并发密码计算有上限，繁忙后能恢复且同时注册重名只能成功一次', async t => {
  const state = fixture(t);
  const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => createAccountService({ DB: state.DB, origin, now: state.clock }).handle(
    post('/api/auth/register', { username: `user-${index}`, password }), `127.0.0.${index + 1}`,
  )));
  const successes = responses.filter(response => response.status === 201);
  assert.ok(successes.length > 0 && successes.length <= 2);
  assert.ok(responses.some(response => response.status === 503));
  assert.ok(responses.every(response => [201, 503].includes(response.status)));
  const normal = await state.service.handle(post('/api/auth/register', { username: 'normal', password }), '127.0.1.1');
  assert.equal(normal.status, 201);
  const duplicated = await Promise.all(['127.0.1.2', '127.0.1.3'].map(peer => state.service.handle(
    post('/api/auth/register', { username: 'same-name', password }), peer,
  )));
  assert.deepEqual(duplicated.map(response => response.status).sort(), [201, 409]);
});

test('未完成的请求体并发有上限，释放后正常处理请求', async t => {
  const state = fixture(t);
  const streams = [];
  const pending = [];
  for (let index = 0; index < 16; index++) {
    const body = new ReadableStream({ start(controller) { streams.push(controller); } });
    const request = new Request(`${origin}/api/auth/login`, {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body, duplex: 'half',
    });
    pending.push(state.service.handle(request, `127.1.0.${index + 1}`));
  }
  const refused = await state.service.handle(post('/api/auth/login', { username: 'alice', password }), '127.1.1.1');
  assert.equal(refused.status, 503);
  for (const controller of streams) controller.close();
  const ended = await Promise.all(pending);
  assert.ok(ended.every(response => response.status === 400));
  assert.equal((await state.service.handle(sessionRequest(), '127.1.1.1')).status, 200);
});

test('相同时间生成多个会话仍保证最新 Cookie 有效，单账号会话数量有界', async t => {
  const state = fixture(t);
  await state.service.handle(post('/api/auth/register', { username: 'alice', password }), '127.0.0.1');
  for (let index = 0; index < 11; index++) {
    const login = await state.service.handle(post('/api/auth/login', { username: 'alice', password }), '127.0.0.1');
    assert.equal(login.status, 200);
    assert.ok(await state.service.identity(sessionRequest(cookieFrom(login))));
  }
  const database = new DatabaseSync(join(state.directory, 'auth.sqlite'), { readOnly: true });
  try { assert.equal(database.prepare('SELECT count(*) AS count FROM auth_sessions').get().count, 10); }
  finally { database.close(); }
});

test('模块仅处理约定路径和方法，关闭不再创建身份', async t => {
  const state = fixture(t);
  assert.equal(await state.service.handle(new Request(`${origin}/api/other`), '127.0.0.1'), null);
  assert.equal((await state.service.handle(new Request(`${origin}/api/auth/register`), '127.0.0.1')).status, 405);
  state.service.close();
  assert.equal(await state.service.identity(sessionRequest()), null);
  assert.equal((await state.service.handle(sessionRequest(), '127.0.0.1')).status, 503);
});

test('本机开发可显式关闭 Secure；生产默认拒绝非 HTTPS', async t => {
  const production = fixture(t);
  assert.throws(() => createAccountService({ DB: production.DB, origin: 'http://localhost:3000' }));
  const developmentOrigin = 'http://localhost:3000';
  const state = fixture(t, { origin: developmentOrigin, secureCookies: false });
  const response = await state.service.handle(post('/api/auth/register', { username: 'alice', password }, { origin: developmentOrigin }, developmentOrigin), '127.0.0.1');
  assert.equal(response.status, 201);
  assert.match(cookieFrom(response), /^desktop_pet_session=/);
  assert.doesNotMatch(response.headers.get('set-cookie'), /; Secure/);
});

test('D1 事务失败不留下半注册账号，不签发会话或暴露内部 SQL', async t => {
  const state = fixture(t);
  state.DB.database.exec('DROP TABLE auth_sessions');
  const response = await state.service.handle(post('/api/auth/register', { username: 'alice', password }), '127.0.0.1');
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(state.DB.database.prepare('SELECT count(*) AS count FROM accounts').get().count, 0);
  assert.ok(!(await response.text()).includes('auth_sessions'));
});

test('本机 workerd 的真实 D1 完成注册、登录、身份读取和注销', {
  skip: process.env.COMMUNITY_WORKERD_TEST !== '1',
}, async () => {
  // 使用工作区已有本机运行时，不接生产账号、不获取凭据、不调用公网。
  const { Miniflare } = await import(new URL('../../desktop-pet/node_modules/.pnpm/miniflare@5.20260801.1-alpha/node_modules/miniflare/dist/src/index.js', import.meta.url).href);
  const source = new URL('../worker/accounts.mjs', import.meta.url);
  const moduleRoot = dirname(fileURLToPath(source));
  const entry = `import { createAccountService } from './accounts.mjs';
    export default { async fetch(request, env) {
      return await createAccountService({ DB: env.DB, origin: '${origin}' }).handle(request, '127.0.0.1')
        || new Response('没有此接口', {status:404});
    }};`;
  const runtime = new Miniflare({
    modulesRoot: moduleRoot,
    modules: [
      { type: 'ESModule', path: join(moduleRoot, 'account-test-entry.mjs'), contents: entry },
      { type: 'ESModule', path: fileURLToPath(source), contents: readFileSync(source, 'utf8') },
    ],
    compatibilityDate: '2026-08-04',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { DB: 'account-test-database' },
    port: 0,
  });
  // Node 与 Miniflare 的 Request 类型不同，通过标准请求字段传给本机运行时。
  async function dispatch(request) {
    return runtime.dispatchFetch(request.url, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      ...(!['GET', 'HEAD'].includes(request.method) ? { body: await request.arrayBuffer() } : {}),
    });
  }
  try {
    const DB = await runtime.getD1Database('DB');
    const schema = migration.replace(/^\s*--.*$/gm, '').split(';').map(sql => sql.trim()).filter(Boolean);
    await DB.batch(schema.map(sql => DB.prepare(sql)));
    const response = await dispatch(post('/api/auth/register', { username: 'alice', password }));
    assert.equal(response.status, 201, await response.clone().text());
    const user = (await response.json()).user;
    const cookie = cookieFrom(response);
    const session = await dispatch(sessionRequest(cookie));
    assert.equal(session.status, 200);
    assert.deepEqual((await session.json()).user, user);
    assert.equal((await dispatch(post('/api/auth/login', { username: 'alice', password: 'wrong-password-123' }))).status, 401);
    const login = await dispatch(post('/api/auth/login', { username: 'ALICE', password }));
    assert.equal(login.status, 200);
    const loggedIn = cookieFrom(login);
    assert.equal((await dispatch(post('/api/auth/logout', {}, { cookie: loggedIn }))).status, 200);
    assert.equal((await (await dispatch(sessionRequest(loggedIn))).json()).user, null);
    const stored = await DB.prepare('SELECT salt, password_hash FROM accounts').first();
    assert.match(stored.salt, /^[a-f0-9]{32}$/);
    assert.match(stored.password_hash, /^[a-f0-9]{64}$/);
  } finally {
    await runtime.dispose();
  }
});
