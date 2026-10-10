import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const services = new WeakMap();
const sessionDuration = 7 * 24 * 60 * 60 * 1000;
const attemptDuration = 10 * 60 * 1000;
const maximumBody = 4096;
const maximumActiveRequests = 16;
const maximumActivePasswords = 2;
const maximumLimitKeys = 4096;
// 保留 OWASP 的强配置；免费 Worker 的 CPU 预算是否足够必须另行实测，不能自动降低强度。
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

export function createAccountService({ DB, origin, secureCookies = true, now = Date.now }) {
  if (!DB || typeof DB.prepare !== 'function' || typeof DB.batch !== 'function') throw new Error('账号服务缺少 D1 数据库绑定。');
  const parsedOrigin = new URL(origin);
  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.username || parsedOrigin.password
    || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash
    || secureCookies && parsedOrigin.protocol !== 'https:') {
    throw new Error('账号服务来源地址或安全 Cookie 配置无效。');
  }
  if (typeof now !== 'function') throw new Error('账号服务时钟无效。');
  const appOrigin = parsedOrigin.origin;
  const existingService = services.get(DB);
  if (existingService) {
    if (existingService.origin !== appOrigin || existingService.secureCookies !== secureCookies || existingService.now !== now) {
      throw new Error('同一 D1 绑定的账号服务配置不一致。');
    }
    return existingService.service;
  }
  const cookieName = secureCookies ? '__Host-desktop_pet_session' : 'desktop_pet_session';
  const dummySalt = randomBytes(16).toString('hex');
  let activeRequests = 0;
  let activePasswords = 0;
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

  async function identity(request) {
    if (closed) return null;
    const token = tokenFrom(request);
    if (!token) return null;
    // 直接使用 DB，不开启读取副本 Sessions API，所有身份读取由主库执行。
    // 只认本站会话；客户端 oai／代理身份头必须由外层剥除，不能作为账号凭据。
    const row = await DB.prepare(`SELECT accounts.id, accounts.username
      FROM auth_sessions JOIN accounts ON accounts.id = auth_sessions.user_id
      WHERE token_hash = ? AND expires_at > ?`).bind(digest(token), currentTime()).first();
    return row ? { id: row.id, username: row.username } : null;
  }

  async function allowAttempt(kind, value, maximum) {
    const timestamp = currentTime();
    const key = digest(`${kind}\0${value}`);
    // D1 batch 是事务；计数与容量检查必须在同一 SQL 中完成，不能读后再写。
    const results = await DB.batch([
      DB.prepare('DELETE FROM auth_attempts WHERE resets_at <= ?').bind(timestamp),
      DB.prepare(`INSERT INTO auth_attempts(key_hash, count, resets_at)
        SELECT ?, 1, ? WHERE EXISTS(SELECT 1 FROM auth_attempts WHERE key_hash = ?)
          OR (SELECT count(*) FROM auth_attempts) < ?
        ON CONFLICT(key_hash) DO UPDATE SET count = min(auth_attempts.count + 1, ?)
        RETURNING count, resets_at`).bind(key, timestamp + attemptDuration, key, maximumLimitKeys, maximum + 1),
    ]);
    const row = results[1]?.results?.[0];
    if (!row) return 60;
    return row.count > maximum ? Math.max(1, Math.ceil((row.resets_at - timestamp) / 1000)) : 0;
  }

  async function saveAuthentication(user, credentials, salt, hash, registering) {
    const timestamp = currentTime();
    const token = randomBytes(32).toString('base64url');
    const tokenHash = digest(token);
    const statements = [];
    if (registering) {
      statements.push(DB.prepare(`INSERT INTO accounts(id, username, username_key, salt, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(username_key) DO NOTHING`)
        .bind(user.id, user.username, credentials.key, salt, hash.toString('hex'), timestamp));
    }
    statements.push(
      DB.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').bind(timestamp),
      DB.prepare(`INSERT INTO auth_sessions(token_hash, user_id, created_at, expires_at)
        SELECT ?, id, ?, ? FROM accounts WHERE id = ?`).bind(tokenHash, timestamp, timestamp + sessionDuration, user.id),
      DB.prepare(`DELETE FROM auth_sessions WHERE user_id = ? AND token_hash <> ? AND token_hash NOT IN
        (SELECT token_hash FROM auth_sessions WHERE user_id = ? AND token_hash <> ? ORDER BY created_at DESC, token_hash DESC LIMIT 9)`)
        .bind(user.id, tokenHash, user.id, tokenHash),
      DB.prepare('SELECT id, username FROM accounts WHERE username_key = ?').bind(credentials.key),
    );
    const results = await DB.batch(statements);
    const saved = results.at(-1)?.results?.[0];
    // 重名并发时只为真正新增的账号建会话，不拿已有账号身份签发 Cookie。
    if (!saved || saved.id !== user.id) return reply(registering ? 409 : 401, { error: registering ? '该用户名已被使用。' : '用户名或密码不正确。' });
    return reply(registering ? 201 : 200, { user: { id: saved.id, username: saved.username } }, { 'set-cookie': cookie(token) });
  }

  async function authenticate(request, path, peerAddress) {
    const peer = typeof peerAddress === 'string' && peerAddress.length <= 128 ? peerAddress : 'unknown';
    const ipWait = await allowAttempt('ip', peer, 30);
    if (ipWait) return reply(429, { error: '尝试过多，请稍后再试。' }, { 'retry-after': String(ipWait) });
    const credentials = await readCredentials(request);
    const nameWait = await allowAttempt('username', credentials.key, 12);
    if (nameWait) return reply(429, { error: '尝试过多，请稍后再试。' }, { 'retry-after': String(nameWait) });
    if (activePasswords >= maximumActivePasswords || closed) {
      return reply(503, { error: '账号服务繁忙，请稍后重试。' }, { 'retry-after': '2' });
    }
    activePasswords++;
    try {
      const existing = await DB.prepare('SELECT * FROM accounts WHERE username_key = ?').bind(credentials.key).first();
      const registering = path === '/api/auth/register';
      const salt = registering ? randomBytes(16).toString('hex') : existing?.salt || dummySalt;
      const hash = await deriveKey(credentials.password, salt, 32, scryptOptions);
      if (closed) return reply(503, { error: '账号服务正在关闭。' });
      if (!registering && (!existing || !timingSafeEqual(hash, Buffer.from(existing.password_hash, 'hex')))) {
        return reply(401, { error: '用户名或密码不正确。' });
      }
      const user = registering ? { id: randomUUID(), username: credentials.username } : { id: existing.id, username: existing.username };
      return await saveAuthentication(user, credentials, salt, hash, registering);
    } finally {
      activePasswords--;
    }
  }

  async function handle(request, peerAddress) {
    const url = new URL(request.url);
    if (!routes.has(url.pathname)) return null;
    if (closed) return reply(503, { error: '账号服务正在关闭。' });
    const method = url.pathname === '/api/auth/session' ? 'GET' : 'POST';
    if (request.method !== method) return reply(405, { error: '请求方法不支持。' }, { allow: method });
    if (url.origin !== appOrigin || method === 'POST' && (request.headers.get('origin') !== appOrigin
      || request.headers.get('sec-fetch-site') === 'cross-site')) {
      return reply(403, { error: '请在本站提交账号操作。' });
    }
    if (activeRequests >= maximumActiveRequests) return reply(503, { error: '账号服务繁忙，请稍后重试。' }, { 'retry-after': '2' });
    activeRequests++;
    try {
      if (url.pathname === '/api/auth/session') return reply(200, { user: await identity(request) });
      if (url.pathname === '/api/auth/logout') {
        const token = tokenFrom(request);
        if (token) await DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(digest(token)).run();
        return reply(200, { user: null }, { 'set-cookie': cookie('', true) });
      }
      return await authenticate(request, url.pathname, peerAddress);
    } catch (error) {
      const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
      return reply(status, { error: status === 500 ? '账号操作暂时失败，请稍后重试。' : error.message });
    } finally {
      activeRequests--;
    }
  }

  function close() {
    closed = true;
    services.delete(DB);
  }
  const service = { handle, identity, close };
  services.set(DB, { origin: appOrigin, secureCookies, now, service });
  return service;
}
