import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { createAccountService } from '../server/accounts.mjs';

const origin = 'https://pet.example.test';
const password = '仅用于行为测试-password123!';

function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'desktop-pet-account-test-'));
  let timestamp = Date.UTC(2026, 9, 9);
  let service = createAccountService({ stateDirectory: directory, origin, now: () => timestamp, ...options });
  t.after(() => {
    service.close();
    // 只清除本测试直接创建的临时子目录，不能指向用户档案或任意计算路径。
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(directory.includes('desktop-pet-account-test-'));
    rmSync(directory, { recursive: true, force: true });
  });
  return {
    directory,
    get service() { return service; },
    advance(milliseconds) { timestamp += milliseconds; },
    restart() {
      service.close();
      service = createAccountService({ stateDirectory: directory, origin, now: () => timestamp, ...options });
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
  assert.deepEqual(state.service.identity(sessionRequest(cookie)), user);
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
  assert.deepEqual(state.service.identity(sessionRequest(cookie)), user);
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
  assert.equal(state.service.identity(sessionRequest(null, forgedHeaders)), null);
  assert.equal(state.service.identity(sessionRequest(`__Host-desktop_pet_session=${'a'.repeat(43)}`, forgedHeaders)), null);
  assert.equal((await (await state.service.handle(sessionRequest(null, forgedHeaders), '127.0.0.1')).json()).user, null);
  const response = await state.service.handle(post('/api/auth/register', { username: 'alice', password }, forgedHeaders), '127.0.0.1');
  const user = (await response.json()).user;
  assert.notEqual(user.id, 'admin');
  const cookie = cookieFrom(response);
  assert.deepEqual(state.service.identity(sessionRequest(cookie, forgedHeaders)), user);
  assert.equal(state.service.identity(sessionRequest(`${cookie}; ${cookie}`)), null);
  assert.equal(state.service.identity(sessionRequest(`${cookie}; other=${'x'.repeat(4096)}`)), null);
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
  assert.ok(state.service.identity(sessionRequest(cookie)));
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
  assert.equal(state.service.identity(sessionRequest(cookie)), null);
  const login = await state.service.handle(post('/api/auth/login', { username: 'alice', password }), '127.0.0.1');
  const current = cookieFrom(login);
  assert.ok(state.service.identity(sessionRequest(current)));
  state.advance(7 * 24 * 60 * 60 * 1000);
  state.restart();
  assert.equal(state.service.identity(sessionRequest(current)), null);
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
  const responses = await Promise.all(Array.from({ length: 12 }, (_, index) => state.service.handle(
    post('/api/auth/register', { username: `user-${index}`, password }), `127.0.0.${index + 1}`,
  )));
  const successes = responses.filter(response => response.status === 201);
  assert.ok(successes.length > 0 && successes.length <= 4);
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
    assert.ok(state.service.identity(sessionRequest(cookieFrom(login))));
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
  assert.equal(state.service.identity(sessionRequest()), null);
  assert.equal((await state.service.handle(sessionRequest(), '127.0.0.1')).status, 503);
});

test('本机开发可显式关闭 Secure；生产默认拒绝非 HTTPS', async t => {
  assert.throws(() => createAccountService({ stateDirectory: '/unused', origin: 'http://localhost:3000' }));
  const developmentOrigin = 'http://localhost:3000';
  const state = fixture(t, { origin: developmentOrigin, secureCookies: false });
  const response = await state.service.handle(post('/api/auth/register', { username: 'alice', password }, { origin: developmentOrigin }, developmentOrigin), '127.0.0.1');
  assert.equal(response.status, 201);
  assert.match(cookieFrom(response), /^desktop_pet_session=/);
  assert.doesNotMatch(response.headers.get('set-cookie'), /; Secure/);
});
