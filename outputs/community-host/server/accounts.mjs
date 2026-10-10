import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
const attemptDuration = 10 * 60 * 1000;
const maximumBody = 4096;
const maximumActiveRequests = 16;
const maximumActivePasswords = 4;
const maximumLimitKeys = 4096;
// 采用 OWASP 列出的 32 MiB／三轮配置，四个并发计算的实际内存约 128 MiB。
// 依据：https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const routes = new Set(['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/session']);

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

function reply(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers,
    },
  });
}

async function readCredentials(request) {
  if (!/^application\/json(?:\s*;.*)?$/i.test(request.headers.get('content-type') || '')) {
    throw { status: 415, message: '请使用 JSON 提交用户名和密码。' };
  }
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > maximumBody)) {
    throw { status: 413, message: '账号信息过长。' };
  }
  if (!request.body) throw { status: 400, message: '请输入用户名和密码。' };
  const reader = request.body.getReader();
  let timeout;
  const deadline = new Promise((_, reject) => {
    timeout = setTimeout(() => reject({ status: 408, message: '提交超时，请重试。' }), 5000);
  });
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await Promise.race([reader.read(), deadline]);
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maximumBody) throw { status: 413, message: '账号信息过长。' };
      chunks.push(chunk.value);
    }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, bytes));
    let data;
    try { data = JSON.parse(decoded); }
    catch { throw { status: 400, message: '账号信息格式无效。' }; }
    if (!data || typeof data !== 'object' || Array.isArray(data)
      || Object.keys(data).some(key => key !== 'username' && key !== 'password')
      || typeof data.username !== 'string' || typeof data.password !== 'string'
      || data.username.length > 64) {
      throw { status: 400, message: '账号信息格式无效。' };
    }
    const username = data.username.normalize('NFKC').trim();
    if (!/^[\p{L}\p{N}_-]{3,32}$/u.test(username)) {
      throw { status: 400, message: '用户名需为 3 至 32 个文字、数字、下划线或连字符。' };
    }
    if (data.password.length < 10 || data.password.length > 128
      || Buffer.byteLength(data.password, 'utf8') > 512 || /[\u0000-\u001F\u007F]/u.test(data.password)) {
      throw { status: 400, message: '密码需为 10 至 128 个字符，不能含控制字符。' };
    }
    return { username, key: username.toLowerCase(), password: data.password };
  } catch (error) {
    if (Number.isInteger(error?.status)) throw error;
    throw { status: 400, message: '账号信息格式无效。' };
  } finally {
    clearTimeout(timeout);
    // 取消失败仅影响已结束请求的流清理，不改变账号或会话状态。
    void reader.cancel().catch(() => {});
  }
}

export function createAccountService({ stateDirectory, origin, secureCookies = true, now = Date.now }) {
  if (typeof stateDirectory !== 'string' || !isAbsolute(stateDirectory)) {
    throw new Error('账号状态目录必须使用绝对路径。');
  }
  const parsedOrigin = new URL(origin);
  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.username || parsedOrigin.password
    || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash
    || secureCookies && parsedOrigin.protocol !== 'https:') {
    throw new Error('账号服务来源地址或安全 Cookie 配置无效。');
  }
  if (typeof now !== 'function') throw new Error('账号服务时钟无效。');
  const appOrigin = parsedOrigin.origin;
  const cookieName = secureCookies ? '__Host-desktop_pet_session' : 'desktop_pet_session';
  const dummySalt = randomBytes(16).toString('hex');
  mkdirSync(stateDirectory, { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(join(stateDirectory, 'auth.sqlite'));
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, username TEXT NOT NULL, username_key TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS auth_sessions_user ON auth_sessions(user_id, created_at);
    CREATE TABLE IF NOT EXISTS auth_attempts (
      key_hash TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS auth_attempts_expiry ON auth_attempts(resets_at);
  `);
  let activeRequests = 0;
  let activePasswords = 0;
  let closing = false;
  let closed = false;

  function currentTime() {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('账号服务时钟无效。');
    return value;
  }

  function cookie(token, expires = false) {
    return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${expires ? 0 : sessionDuration / 1000}${secureCookies ? '; Secure' : ''}`;
  }

  function tokenFrom(request) {
    const header = request.headers.get('cookie') || '';
    if (header.length > 4096) return null;
    const matches = header.split(';').map(part => part.trim()).filter(part => part.startsWith(`${cookieName}=`));
    if (matches.length !== 1) return null;
    const token = matches[0].slice(cookieName.length + 1);
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  }

  function identity(request) {
    if (closing || closed) return null;
    const token = tokenFrom(request);
    if (!token) return null;
    // 仅认本服务的会话，不读取 oai 身份、代理身份或前端自行传入的用户编号。
    const row = database.prepare(`SELECT accounts.id, accounts.username
      FROM auth_sessions JOIN accounts ON accounts.id = auth_sessions.user_id
      WHERE token_hash = ? AND expires_at > ?`).get(digest(token), currentTime());
    return row ? { id: row.id, username: row.username } : null;
  }

  function allowAttempt(peerAddress, usernameKey) {
    const timestamp = currentTime();
    const keys = [];
    if (peerAddress !== null) {
      const peer = typeof peerAddress === 'string' && peerAddress.length <= 128 ? peerAddress : 'unknown';
      keys.push({ key: digest(`ip\0${peer}`), maximum: 30 });
    }
    if (usernameKey) keys.push({ key: digest(`username\0${usernameKey}`), maximum: 12 });
    database.exec('BEGIN IMMEDIATE');
    try {
      database.prepare('DELETE FROM auth_attempts WHERE resets_at <= ?').run(timestamp);
      const rows = keys.map(entry => ({ ...entry, row: database.prepare('SELECT count, resets_at FROM auth_attempts WHERE key_hash = ?').get(entry.key) }));
      const blocked = rows.find(entry => entry.row && entry.row.count >= entry.maximum);
      const count = database.prepare('SELECT count(*) AS count FROM auth_attempts').get().count;
      if (blocked || count + rows.filter(entry => !entry.row).length > maximumLimitKeys) {
        database.exec('COMMIT');
        return blocked ? Math.max(1, Math.ceil((blocked.row.resets_at - timestamp) / 1000)) : 60;
      }
      for (const entry of rows) {
        database.prepare(`INSERT INTO auth_attempts(key_hash, count, resets_at) VALUES (?, 1, ?)
          ON CONFLICT(key_hash) DO UPDATE SET count = count + 1`).run(entry.key, timestamp + attemptDuration);
      }
      database.exec('COMMIT');
      return 0;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  function saveSession(userId, timestamp) {
    const token = randomBytes(32).toString('base64url');
    database.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(timestamp);
    database.prepare('INSERT INTO auth_sessions VALUES (?, ?, ?, ?)').run(digest(token), userId, timestamp, timestamp + sessionDuration);
    database.prepare(`DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ? AND token_hash NOT IN
      (SELECT token_hash FROM auth_sessions WHERE user_id = ? AND token_hash <> ? ORDER BY created_at DESC, token_hash DESC LIMIT 9)`).run(userId, digest(token), userId, digest(token));
    return token;
  }

  async function authenticate(request, path, peerAddress) {
    // body 解析也受请求数上限保护；可信 IP 由 HTTP 服务传入，忽略 X-Forwarded-For。
    const ipWait = allowAttempt(peerAddress, null);
    if (ipWait) return reply(429, { error: '尝试过多，请稍后再试。' }, { 'retry-after': String(ipWait) });
    const credentials = await readCredentials(request);
    const nameWait = allowAttempt(null, credentials.key);
    if (nameWait) return reply(429, { error: '尝试过多，请稍后再试。' }, { 'retry-after': String(nameWait) });
    if (activePasswords >= maximumActivePasswords || closing) {
      return reply(503, { error: '账号服务繁忙，请稍后重试。' }, { 'retry-after': '2' });
    }
    activePasswords++;
    try {
      const existing = database.prepare('SELECT * FROM accounts WHERE username_key = ?').get(credentials.key);
      const salt = path === '/api/auth/register' ? randomBytes(16).toString('hex') : existing?.salt || dummySalt;
      const hash = await deriveKey(credentials.password, salt, 32, scryptOptions);
      if (closing) return reply(503, { error: '账号服务正在关闭。' });
      if (path === '/api/auth/login' && (!existing || !timingSafeEqual(hash, Buffer.from(existing.password_hash, 'hex')))) {
        return reply(401, { error: '用户名或密码不正确。' });
      }
      const timestamp = currentTime();
      let user;
      database.exec('BEGIN IMMEDIATE');
      try {
        if (path === '/api/auth/register') {
          if (database.prepare('SELECT id FROM accounts WHERE username_key = ?').get(credentials.key)) {
            database.exec('ROLLBACK');
            return reply(409, { error: '该用户名已被使用。' });
          }
          user = { id: randomUUID(), username: credentials.username };
          database.prepare('INSERT INTO accounts VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.username, credentials.key, salt, hash.toString('hex'), timestamp);
        } else {
          user = { id: existing.id, username: existing.username };
        }
        const token = saveSession(user.id, timestamp);
        database.exec('COMMIT');
        return reply(path === '/api/auth/register' ? 201 : 200, { user }, { 'set-cookie': cookie(token) });
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    } finally {
      activePasswords--;
    }
  }

  async function handle(request, peerAddress) {
    const url = new URL(request.url);
    if (!routes.has(url.pathname)) return null;
    if (closing || closed) return reply(503, { error: '账号服务正在关闭。' });
    const method = url.pathname === '/api/auth/session' ? 'GET' : 'POST';
    if (request.method !== method) return reply(405, { error: '请求方法不支持。' }, { allow: method });
    if (url.origin !== appOrigin || method === 'POST' && (request.headers.get('origin') !== appOrigin
      || request.headers.get('sec-fetch-site') === 'cross-site')) {
      return reply(403, { error: '请在本站提交账号操作。' });
    }
    if (activeRequests >= maximumActiveRequests) {
      return reply(503, { error: '账号服务繁忙，请稍后重试。' }, { 'retry-after': '2' });
    }
    activeRequests++;
    try {
      if (url.pathname === '/api/auth/session') return reply(200, { user: identity(request) });
      if (url.pathname === '/api/auth/logout') {
        const token = tokenFrom(request);
        if (token) database.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').run(digest(token));
        return reply(200, { user: null }, { 'set-cookie': cookie('', true) });
      }
      return await authenticate(request, url.pathname, peerAddress);
    } catch (error) {
      const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
      return reply(status, { error: status === 500 ? '账号操作暂时失败，请稍后重试。' : error.message });
    } finally {
      activeRequests--;
      if (closing && activeRequests === 0 && !closed) {
        database.close();
        closed = true;
      }
    }
  }

  function close() {
    closing = true;
    if (activeRequests === 0 && !closed) {
      database.close();
      closed = true;
    }
  }

  return { handle, identity, close };
}
