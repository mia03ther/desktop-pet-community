const cookieName = '__Host-community-admin';
const lifetime = 8 * 60 * 60;
const encoder = new TextEncoder();
const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } });
const schema = [
  `CREATE TABLE IF NOT EXISTS community_work_management (id TEXT PRIMARY KEY, hidden INTEGER NOT NULL DEFAULT 0 CHECK(hidden IN (0,1)), category TEXT NOT NULL, revision INTEGER NOT NULL, updated_at TEXT NOT NULL) STRICT`,
  `CREATE TABLE IF NOT EXISTS community_admin_login_limits (key_hash TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL) STRICT`,
];

export function createCatalogManagement({ DB, secret, origin, works, now = Date.now }) {
  const catalog = new Map(works.map(work => [work.id, work]));
  const assets = new Map();
  for (const work of works) {
    const paths = [work.download, work.thumbnail, work.cover, work.atlas, work.packageManifest, work.packageLicense, ...Object.values(work.mediaActions || {}).map(action => action.url)];
    for (const path of paths) {
      if (typeof path !== 'string' || !path.startsWith('assets/')) continue;
      const key = decodeURI(new URL(path, origin + '/').pathname);
      if (!assets.has(key)) assets.set(key, new Set());
      assets.get(key).add(work.id);
    }
  }
  let initialized;
  function ready() {
    if (!initialized) initialized = DB.batch(schema.map(sql => DB.prepare(sql))).catch(error => { initialized = undefined; throw error; });
    return initialized;
  }
  const key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  async function signature(value) { return new Uint8Array(await crypto.subtle.sign('HMAC', await key, encoder.encode(value))); }
  const hex = bytes => [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  function cookie(value, age = lifetime) { return `${cookieName}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`; }
  async function signedIn(request) {
    const value = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    const match = /^(\d{10,13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(value || '');
    if (!match || Number(match[1]) <= now() || Number(match[1]) > now() + lifetime * 1000) return false;
    const bytes = Uint8Array.from(match[3].match(/../g), byte => parseInt(byte, 16));
    return crypto.subtle.verify('HMAC', await key, bytes, encoder.encode(`${match[1]}.${match[2]}`));
  }
  async function body(request) {
    if (!request.headers.get('content-type')?.startsWith('application/json')) return null;
    const reader = request.body?.getReader();
    if (!reader) return null;
    let size = 0; const parts = [];
    try {
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.length; if (size > 2048) { await reader.cancel(); return null; }
        parts.push(value);
      }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const part of parts) { bytes.set(part, offset); offset += part.length; }
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch { return null; }
    finally { reader.releaseLock(); }
  }
  async function overrides() {
    await ready();
    const rows = (await DB.prepare('SELECT id, hidden, category, revision, updated_at FROM community_work_management').all()).results;
    return rows.filter(row => catalog.has(row.id)).map(row => ({ id: row.id, hidden: row.hidden === 1, category: row.category, revision: row.revision, updatedAt: row.updated_at }));
  }
  async function blocked(request) {
    const path = decodeURIComponent(new URL(request.url).pathname);
    const match = /^\/api\/(?:download|works)\/([^/]+)(?:\/|$)/.exec(path) || /^\/api\/(?:pets|plugins)\/([^/]+)\//.exec(path);
    const ids = match ? [match[1]] : [...(assets.get(path) || [])];
    if (!ids.length) return false;
    await ready();
    const rows = (await DB.prepare(`SELECT id FROM community_work_management WHERE hidden = 1 AND id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all()).results;
    // 共享封面只有全部关联作品下架时才关闭，避免影响仍在架的作品。
    return rows.length === ids.length && !await signedIn(request);
  }
  async function handle(request, peer) {
    const path = new URL(request.url).pathname;
    if (path === '/api/catalog-management' && request.method === 'GET') return json({ available: true, items: await overrides() });
    if (!path.startsWith('/api/admin/')) return null;
    if (!['GET', 'HEAD'].includes(request.method) && (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site')) return json({ error: '请从本站管理页面操作。' }, 403);
    if (path === '/api/admin/login' && request.method === 'POST') {
      await ready();
      const bucket = Math.floor(now() / 3600000);
      const actor = hex(await signature(`admin-login:${peer}:${bucket}`));
      await DB.prepare('DELETE FROM community_admin_login_limits WHERE expires_at < ?').bind(now()).run();
      const result = await DB.prepare(`INSERT INTO community_admin_login_limits (key_hash, count, expires_at) VALUES (?, 1, ?) ON CONFLICT(key_hash) DO UPDATE SET count = count + 1 RETURNING count`).bind(actor, (bucket + 1) * 3600000).first();
      if (result.count > 12) return json({ error: '登录尝试过多，请一小时后再试。' }, 429);
      const input = await body(request);
      if (typeof input?.key !== 'string' || input.key.length > 256 || !await crypto.subtle.verify('HMAC', await key, await signature('login:' + secret), encoder.encode('login:' + input.key))) return json({ error: '管理员密钥不正确。' }, 401);
      const session = `${now() + lifetime * 1000}.${crypto.randomUUID().replaceAll('-', '')}`;
      return json({ signedIn: true }, 200, { 'set-cookie': cookie(session + '.' + hex(await signature(session))) });
    }
    if (path === '/api/admin/logout' && request.method === 'POST') return json({ signedIn: false }, 200, { 'set-cookie': cookie('', 0) });
    const authenticated = await signedIn(request);
    if (path === '/api/admin/session' && request.method === 'GET') return json({ available: true, signedIn: authenticated });
    if (!authenticated) return json({ error: '请先登录管理员。' }, 401);
    if (path === '/api/admin/works' && request.method === 'GET') {
      const entries = new Map((await overrides()).map(item => [item.id, item]));
      return json({ items: works.map(work => ({ id: work.id, kind: work.kind, title: work.title, author: work.author, thumbnail: work.thumbnail || work.cover || '', category: work.category || '其他', hidden: false, revision: 0, ...entries.get(work.id) })) });
    }
    const match = /^\/api\/admin\/works\/([a-zA-Z0-9._-]{1,80})$/.exec(path);
    if (match && request.method === 'PATCH') {
      const work = catalog.get(match[1]); if (!work) return json({ error: '作品不存在。' }, 404);
      const input = await body(request);
      if (typeof input?.hidden !== 'boolean' || typeof input.category !== 'string' || !input.category.trim() || input.category.trim().length > 40 || /[\p{Cc}\p{Cf}<>]/u.test(input.category) || !Number.isSafeInteger(input.revision) || input.revision < 0) return json({ error: '分类须为 1 至 40 字，且不能含控制字符或 HTML。' }, 400);
      await ready();
      const category = input.category.trim(), updatedAt = new Date(now()).toISOString();
      // 已有记录用条件更新；高版本不能被其他管理窗口的旧状态覆盖。
      const updated = input.revision === 0
        ? await DB.prepare(`INSERT INTO community_work_management (id, hidden, category, revision, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(id) DO NOTHING RETURNING id, hidden, category, revision, updated_at`).bind(work.id, Number(input.hidden), category, updatedAt).first()
        : await DB.prepare(`UPDATE community_work_management SET hidden = ?, category = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ? RETURNING id, hidden, category, revision, updated_at`).bind(Number(input.hidden), category, updatedAt, work.id, input.revision).first();
      if (!updated) return json({ error: '作品已在其他窗口修改，请刷新后再保存。' }, 409);
      return json({ item: { id: updated.id, hidden: updated.hidden === 1, category: updated.category, revision: updated.revision, updatedAt: updated.updated_at } });
    }
    return json({ error: '管理接口不存在。' }, 404);
  }
  return { handle, blocked, overrides };
}
