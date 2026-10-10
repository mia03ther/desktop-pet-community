// 学习参考站的匿名互动：加盐 IP 摘要只用于点赞和关注，不授予投稿或账号权限。
const hour = 3600000;
const maxWrites = 60;
const workId = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/;
const encoder = new TextEncoder();

class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers } });
}

function authorName(value) {
  if (typeof value !== 'string' || !value || value.length > 120 || value !== value.trim() || /[\u0000-\u001f\u007f]/u.test(value)) throw new InputError('作者名称无效。');
  return value;
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function boundedJson(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw new InputError('请发送 JSON 内容。', 415);
  if (Number(request.headers.get('content-length') || 0) > 1024) throw new InputError('内容过大。', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('缺少操作内容。');
  let bytes = 0, content = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const timer = setTimeout(() => { void reader.cancel().catch(() => {}); }, 5000);
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 1024) { await reader.cancel(); throw new InputError('内容过大。', 413); }
      content += decoder.decode(part.value, { stream: true });
    }
    const value = JSON.parse(content + decoder.decode());
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError('操作内容无效。');
    return value;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError('操作内容无效。');
  } finally { clearTimeout(timer); reader.releaseLock(); }
}

export function createAnonymousInteractionService({ DB, origin, salt, works = [], now = Date.now }) {
  const appOrigin = new URL(origin);
  if (appOrigin.protocol !== 'https:' || appOrigin.origin !== origin || appOrigin.username || appOrigin.password) throw new Error('匿名互动必须使用固定 HTTPS 主站。');
  if (!DB?.prepare || !DB?.batch) throw new Error('匿名互动未绑定 D1。');
  if (typeof salt !== 'string' || salt.length < 32 || salt.length > 256) throw new Error('匿名互动摘要秘密尚未配置。');
  if (typeof now !== 'function' || !Array.isArray(works) || works.length > 5000) throw new Error('匿名互动初始化无效。');
  const builtins = new Map();
  for (const work of works) {
    if (!work || !workId.test(work.id) || ['__proto__', 'constructor', 'prototype'].includes(work.id)) throw new Error('内置作品标识无效。');
    const author = authorName(work.author);
    if (builtins.has(work.id) && builtins.get(work.id).author !== author) throw new Error('内置作品标识重复。');
    builtins.set(work.id, { id: work.id, author });
  }
  let pendingBodies = 0;

  function timestamp() {
    const value = now();
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('互动时间无效。');
    return value;
  }

  function peerAddress(peer) {
    // 只使用外层提供的 Cloudflare 可信地址，不读取客户可伪造的 XFF 或身份头。
    if (typeof peer !== 'string' || !peer || peer === 'unknown' || peer.length > 128 || /[\s\u0000-\u001f\u007f]/u.test(peer)) throw new InputError('暂时无法取得匿名互动来源。', 503);
    return peer;
  }

  async function knownAuthor(author) {
    for (const work of builtins.values()) if (work.author === author) return true;
    return !!await DB.prepare('SELECT 1 AS found FROM community_pets WHERE author = ? UNION ALL SELECT 1 AS found FROM community_plugins WHERE author = ? LIMIT 1').bind(author, author).first();
  }

  async function knownWork(id) {
    if (builtins.has(id)) return true;
    return !!await DB.prepare('SELECT 1 AS found FROM community_pets WHERE id = ? UNION ALL SELECT 1 AS found FROM community_plugins WHERE id = ? LIMIT 1').bind(id, id).first();
  }

  async function actor(peer, purpose, scope) {
    return digest(JSON.stringify([salt, purpose, scope, peer]));
  }

  async function allowWrite(peer) {
    const time = timestamp(), bucket = Math.floor(time / hour), key = await actor(peer, 'write-rate', bucket);
    const result = await DB.batch([
      DB.prepare('DELETE FROM community_interaction_limits WHERE expires_at <= ?').bind(time),
      DB.prepare(`INSERT INTO community_interaction_limits (key_hash, count, expires_at)
        SELECT ?, 1, ? WHERE EXISTS (SELECT 1 FROM community_interaction_limits WHERE key_hash = ?)
          OR (SELECT COUNT(*) FROM community_interaction_limits) < 4096
        ON CONFLICT(key_hash) DO UPDATE SET count = MIN(community_interaction_limits.count + 1, ?)
        RETURNING count`).bind(key, (bucket + 2) * hour, key, maxWrites + 1),
    ]);
    const count = result[1]?.results?.[0]?.count;
    if (!Number.isSafeInteger(count) || count > maxWrites) throw new InputError('互动操作过于频繁，请稍后再试。', 429);
  }

  async function readContributor(author, peer) {
    const visitor = await actor(peer, 'creator-follow', author);
    const result = await DB.prepare('SELECT COUNT(*) AS followers, MAX(CASE WHEN actor_hash = ? THEN 1 ELSE 0 END) AS following FROM community_creator_follows WHERE author = ?').bind(visitor, author).first();
    return { available: true, followers: Number(result?.followers || 0), following: result?.following === 1 };
  }

  async function activity(peer) {
    const since = new Date(timestamp() - 7 * 86400000).toISOString();
    const [likes, downloads, followerCounts, publicAuthors] = await Promise.all([
      DB.prepare('SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_likes GROUP BY work_id').bind(since).all(),
      DB.prepare('SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_downloads GROUP BY work_id').bind(since).all(),
      DB.prepare('SELECT author, COUNT(*) AS followers FROM community_creator_follows GROUP BY author').all(),
      DB.prepare('SELECT author FROM community_pets UNION SELECT author FROM community_plugins').all(),
    ]);
    // 没有点赞记录的作品不可能属于本访客，避免给整个图库逐件计算摘要。
    const ids = likes.results.map(row => row.work_id).filter(id => workId.test(id) && !['__proto__', 'constructor', 'prototype'].includes(id));
    const actors = await Promise.all(ids.map(id => actor(peer, 'like', id)));
    const liked = new Set();
    // D1 单条绑定参数有上限，按固定小批次查本人回执；不返回任何摘要或原始地址。
    for (let start = 0; start < actors.length; start += 64) {
      const chunk = actors.slice(start, start + 64);
      const result = await DB.prepare(`SELECT work_id FROM community_likes WHERE actor IN (${chunk.map(() => '?').join(',')})`).bind(...chunk).all();
      for (const row of result.results) liked.add(row.work_id);
    }
    const items = Object.create(null);
    for (const [rows, key] of [[likes.results, 'likes'], [downloads.results, 'downloads']]) for (const row of rows) {
      if (!workId.test(row.work_id) || ['__proto__', 'constructor', 'prototype'].includes(row.work_id)) continue;
      const entry = items[row.work_id] ||= { likes: 0, downloads: 0, weekly: 0, weeklyLikes: 0, weeklyDownloads: 0, liked: liked.has(row.work_id) };
      entry[key] = Number(row.total);
      const week = Number(row.week || 0);
      entry[key === 'likes' ? 'weeklyLikes' : 'weeklyDownloads'] = week;
      entry.weekly += week;
    }
    const contributors = Object.create(null);
    for (const value of [...builtins.values(), ...publicAuthors.results]) {
      try { contributors[authorName(value.author)] = { followers: 0 }; } catch { /* 非法旧作者值不能进入公开快照。 */ }
    }
    for (const row of followerCounts.results) if (Object.hasOwn(contributors, row.author)) contributors[row.author].followers = Number(row.followers);
    return { items, contributors, scope: 'site', downloadRule: '同一浏览器每天对同一作品计一次下载；点赞按匿名来源和作品去重' };
  }

  async function handle(request, peer) {
    const url = new URL(request.url);
    const contributor = /^\/api\/contributors\/([^/]{1,2048})$/.exec(url.pathname);
    const liking = /^\/api\/works\/([a-zA-Z0-9._-]{1,80})\/like$/.exec(url.pathname);
    const statistics = url.pathname === '/api/activity';
    if (!contributor && !liking && !statistics) return null;
    try {
      if (url.origin !== origin) throw new InputError('请在正式共创平台操作。', 403);
      const address = peerAddress(peer);
      const allowedMethods = statistics ? ['GET'] : contributor ? ['GET', 'PUT'] : ['POST'];
      if (!allowedMethods.includes(request.method)) return json({ error: '不支持此操作。' }, 405, { allow: allowedMethods.join(', ') });
      if (request.method !== 'GET' && (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site')) throw new InputError('请在本站发起互动。', 403);
      let author;
      if (contributor) {
        try { author = authorName(decodeURIComponent(contributor[1])); } catch { throw new InputError('作者名称无效。'); }
        if (!['pets', 'plugins'].includes(url.searchParams.get('kind') || 'pets')) throw new InputError('作者作品类型无效。');
        if (!await knownAuthor(author)) throw new InputError('作者不存在。', 404);
      }
      if (liking && (!workId.test(liking[1]) || ['__proto__', 'constructor', 'prototype'].includes(liking[1]) || !await knownWork(liking[1]))) throw new InputError('作品不存在。', 404);
      if (statistics) return json(await activity(address));
      if (request.method === 'GET') return json(await readContributor(author, address));
      if (pendingBodies >= 16) throw new InputError('互动请求较多，请稍后再试。', 503);
      pendingBodies++;
      let input;
      try { input = await boundedJson(request); } finally { pendingBodies--; }
      const field = contributor ? 'following' : 'liked';
      if (typeof input[field] !== 'boolean' || Object.keys(input).some(key => key !== field)) throw new InputError('互动状态无效。');
      await allowWrite(address);
      if (contributor) {
        const visitor = await actor(address, 'creator-follow', author);
        const statement = input.following
          ? DB.prepare('INSERT INTO community_creator_follows (author, actor_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(author, actor_hash) DO NOTHING').bind(author, visitor, new Date(timestamp()).toISOString())
          : DB.prepare('DELETE FROM community_creator_follows WHERE author = ? AND actor_hash = ?').bind(author, visitor);
        const result = await DB.batch([statement, DB.prepare('SELECT COUNT(*) AS followers, MAX(CASE WHEN actor_hash = ? THEN 1 ELSE 0 END) AS following FROM community_creator_follows WHERE author = ?').bind(visitor, author)]);
        const current = result[1].results[0];
        return json({ available: true, followers: Number(current.followers), following: current.following === 1, changed: Number(result[0].meta?.changes || 0) > 0 });
      }
      const id = liking[1], visitor = await actor(address, 'like', id);
      if (input.liked) await DB.prepare('INSERT INTO community_likes (id, work_id, actor, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(work_id, actor) DO NOTHING').bind(crypto.randomUUID(), id, visitor, new Date(timestamp()).toISOString()).run();
      else await DB.prepare('DELETE FROM community_likes WHERE work_id = ? AND actor = ?').bind(id, visitor).run();
      return json(await activity(address));
    } catch (error) {
      if (error instanceof InputError) return json({ error: error.message }, error.status, error.status === 429 ? { 'retry-after': '3600' } : {});
      return json({ error: '公共互动暂不可用，请稍后再试。' }, 503);
    }
  }

  // 不提供账号 identity；外层不能把匿名互动当作作品投稿者认证。
  return { handle };
}
