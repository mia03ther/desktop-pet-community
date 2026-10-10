import { readZipPackage, inspectImportPackage, coverImageType, attribution, prepareWorkPackage } from '../public/package-core.js';
import { pages } from './static-pages.js';
import { builtinAtlases } from './builtin-atlases.js';
import { builtinPackages } from './builtin-packages.js';
import { pets, toolPlugins, templates } from '../public/catalog.js';
import { sourcePlugins } from '../public/plugin-catalog.js';
import { validateRequest } from '../public/community-core.js';
const builtins = new Map([...pets, ...toolPlugins, ...sourcePlugins, ...templates.map(item => ({ ...item, kind: 'plugin', download: `assets/${item.id}.zip` }))].map(item => [item.id, item]));
const maxPackageBytes = 32 * 1024 * 1024;
const maxRequestBytes = maxPackageBytes + 10 * 1024 * 1024 + 65536;
let publishing = false;
class InputError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
function database(env) { if (!env.DB) throw new InputError('共创服务暂时不可用，请稍后重试。', 503); return env.DB; }
function text(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\p{Cf}]/u.test(value)) throw new InputError(`${name}格式不正确。`);
  return value.trim();
}
function publicItem(row, kind = 'plugin') {
  if (kind === 'pet') {
    const presentation = JSON.parse(row.presentation);
    return { id: row.id, kind, title: row.title, description: row.description, author: row.author, license: row.license, category: '社区作品', tags: ['社区作品'],
      thumbnail: row.cover_key ? `/api/pets/${row.id}/cover` : 'assets/brand-logo.png', download: `/api/pets/${row.id}/download`,
      atlas: presentation.atlas ? `/api/pets/${row.id}/media/atlas` : null, version: presentation.version, mediaActions: Object.fromEntries(Object.entries(presentation.media || {}).map(([id, entry]) => [id, { displayName: typeof entry.displayName === 'string' && entry.displayName.trim() && entry.displayName.length <= 80 && !/[\p{Cc}\p{Cf}]/u.test(entry.displayName) ? entry.displayName : id, type: entry.type, url: `/api/pets/${row.id}/media/${id}` }])), hostNotice: row.compatibility, publishedAt: row.created_at };
  }
  return { id: row.id, kind: 'plugin', name: row.title, title: row.title, description: row.description, author: row.author, license: row.license, source: row.source,
    pluginType: 'community-plugin', category: '社区作品', tags: ['社区作品'], features: [], permissions: [], hostNotice: row.compatibility,
    cover: row.cover_key ? `/api/plugins/${row.id}/cover` : null, download: `/api/plugins/${row.id}/download`, publishedAt: row.created_at, packageBytes: row.size };
}
async function boundedForm(request) {
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;')) throw new InputError('请使用作品上传表单。');
  if (Number(request.headers.get('content-length')) > maxRequestBytes) throw new InputError('上传总量超过限制。', 413);
  let size = 0;
  const stream = request.body?.pipeThrough(new TransformStream({ transform(chunk, controller) {
    size += chunk.byteLength; if (size > maxRequestBytes) throw new InputError('上传总量超过限制。', 413); controller.enqueue(chunk);
  } }));
  if (!stream) throw new InputError('没有收到作品文件。');
  try { return await new Response(stream, { headers: { 'content-type': request.headers.get('content-type') } }).formData(); }
  catch { throw new InputError(size > maxRequestBytes ? '上传总量超过限制。' : '上传未完成或格式无效，请重新提交。', size > maxRequestBytes ? 413 : 400); }
}
async function digest(value) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', value)), b => b.toString(16).padStart(2, '0')).join(''); }
async function boundedBytes(response, expectedSize) {
  if (!response.body || expectedSize > maxPackageBytes) throw new Error('固定原件大小无效。');
  const reader = response.body.getReader(), chunks = []; let total = 0;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    total += value.length; if (total > expectedSize) { await reader.cancel(); throw new Error('固定原件超过长度。'); }
    chunks.push(value);
  }
  if (total !== expectedSize) throw new Error('固定原件长度不一致。');
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
async function fixedAsset(request, env) {
  const entry = builtinPackages[new URL(request.url).pathname];
  if (!entry) return env.ASSETS ? env.ASSETS.fetch(request) : fetch(request);
  const headers = { 'content-type': 'application/zip', 'content-length': String(entry.size), 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff', etag: `"${entry.sha256}"` };
  if (request.method === 'HEAD') return new Response(null, { headers });
  const response = await fetch(new Request(entry.sourceUrl, { redirect: 'error', signal: AbortSignal.timeout(20000) }));
  if (!response.ok) return new Response('下载暂不可用，请稍后重试。', { status: 404 });
  const atlas = await boundedBytes(response, entry.atlasSize);
  if (await digest(atlas) !== entry.atlasSha256) throw new Error('固定图集摘要不一致。');
  const prefix = Uint8Array.from(atob(entry.prefix), c => c.charCodeAt(0)), suffix = Uint8Array.from(atob(entry.suffix), c => c.charCodeAt(0));
  const bytes = new Uint8Array(prefix.length + atlas.length + suffix.length);
  bytes.set(prefix); bytes.set(atlas, prefix.length); bytes.set(suffix, prefix.length + atlas.length);
  if (bytes.length !== entry.size || await digest(bytes) !== entry.sha256) throw new Error('原下载包摘要不一致。');
  return new Response(bytes, { headers });
}
async function builtinAtlas(request, env, url, entry) {
  const headers = { 'content-type': 'image/webp', 'content-length': String(entry.size), 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff', etag: `"${entry.sha256}"` };
  if (request.method === 'HEAD') return new Response(null, { headers });
  const source = new Request(new URL(entry.zip, url.origin));
  const response = await fixedAsset(source, env);
  if (!response.ok) return new Response('图集暂不可用。', { status: 404 });
  const bytes = await boundedBytes(response, entry.packageSize);
  if (await digest(bytes) !== entry.packageSha256) throw new Error('内置原包摘要不一致。');
  const files = await readZipPackage(bytes, () => { throw new Error('内置原包格式无效。'); }, { maxTotalBytes: maxPackageBytes, maxFileBytes: maxPackageBytes });
  const atlas = files[entry.filename];
  if (!atlas || atlas.length !== entry.size || await digest(atlas) !== entry.sha256) throw new Error('内置图集摘要不一致。');
  return new Response(atlas, { headers });
}
async function validateInput(operation) { try { return await operation(); } catch (error) { if (error instanceof InputError) throw error; throw new InputError(error.message || '作品文件无效。'); } }
async function fingerprint(files, metadata, coverBytes) {
  const parts = [JSON.stringify(metadata)];
  for (const name of Object.keys(files).sort()) {
    let bytes = files[name];
    if (/^WORK-INFO(?:-\d+)?\.json$/.test(name) && bytes.length <= 65536) {
      try { const info = JSON.parse(new TextDecoder().decode(bytes)); delete info.savedAt; bytes = new TextEncoder().encode(JSON.stringify(info)); } catch { /* 非标准说明按原字节记录。 */ }
    }
    parts.push(name, await digest(bytes));
  }
  if (coverBytes) parts.push(await digest(coverBytes));
  return digest(new TextEncoder().encode(parts.join('\n')));
}
async function publish(request, env, kind = 'plugin') {
  const table = kind === 'pet' ? 'community_pets' : 'community_plugins';
  const owner = request.headers.get('oai-authenticated-user-id');
  if (!owner) throw new InputError('请先登录，再发布作品。', 401);
  const url = new URL(request.url);
  if (request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new InputError('请从共创平台提交作品。', 403);
  const db = database(env);
  if (!env.BUCKET) throw new InputError('投稿存储尚未启用，请保留作品后重试。', 503);
  if (publishing) throw new InputError('当前上传繁忙，请稍后重试；作品仍保留在页面。', 503);
  publishing = true;
  try {
    const form = await boundedForm(request), raw = form.get('metadata');
    if (typeof raw !== 'string' || raw.length > 16384) throw new InputError('作品信息缺失或过大。');
    let input; try { input = JSON.parse(raw); } catch { throw new InputError('作品信息格式不正确。'); }
    const metadata = { title: text(input?.title, '名称', 120), id: text(input?.id, '作品 ID', 64), description: text(input?.description, '说明', 1000), ...await validateInput(() => attribution(input)), workflow: input.workflow };
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(metadata.id) || ![`${kind}-make`, `${kind}-import`].includes(metadata.workflow)) throw new InputError('作品编号或投稿入口无效。');
    const archive = form.get('package');
    if (!(archive instanceof Blob) || !archive.size || archive.size > maxPackageBytes) throw new InputError('公开投稿的 ZIP 最大为 32 MB。', 413);
    const bytes = new Uint8Array(await archive.arrayBuffer());
    // 网页重新封装成无压缩 ZIP；服务端不展开外部压缩流，也不执行代码。
    const files = await validateInput(() => readZipPackage(bytes, () => { throw new InputError('请通过平台重新打包后发布，不接受直接提交的压缩流。'); }, { maxTotalBytes: maxPackageBytes, maxFileBytes: maxPackageBytes }));
    if (!Object.keys(files).length || Object.values(files).reduce((sum, value) => sum + value.length, 0) > maxPackageBytes) throw new InputError('作品文件超过 32 MB。', 413);
    const info = await validateInput(() => inspectImportPackage(files, kind));
    if (metadata.workflow === `${kind}-make` && info.report.level !== 'native') throw new InputError('制作作品需符合本系统格式；其他格式请使用导入入口。');
    if (metadata.workflow === `${kind}-make`) await validateInput(() => prepareWorkPackage(files, { ...metadata, displayName: metadata.title }, kind, metadata.workflow));
    let coverBytes, coverMime;
    const cover = form.get('cover');
    if (cover instanceof Blob && cover.size) {
      if (cover.size > 10 * 1024 * 1024) throw new InputError('封面最大为 10 MB。', 413);
      coverBytes = new Uint8Array(await cover.arrayBuffer()); coverMime = (await validateInput(() => coverImageType(coverBytes))).mime;
    } else if (info.cover) { coverBytes = info.cover.bytes; coverMime = info.cover.mime; }
    const hash = await fingerprint(files, metadata, coverBytes);
    const existing = await db.prepare(`SELECT * FROM ${table} WHERE owner = ? AND fingerprint = ?`).bind(owner, hash).first();
    if (existing) return json({ item: publicItem(existing, kind), alreadyPublished: true });
    const count = await db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE owner = ? AND created_at >= ?`).bind(owner, new Date(Date.now() - 3600000).toISOString()).first();
    if (count.total >= 20) throw new InputError('本小时投稿已达 20 件，请稍后继续。', 429);
    const id = `community-${crypto.randomUUID()}`, packageKey = `${kind}s/${id}/package.zip`, coverKey = coverBytes ? `${kind}s/${id}/cover` : null;
    const presentation = { version: info.manifest.spriteVersionNumber === 2 ? 2 : 1, media: {} }, extraKeys = [];
    if (kind === 'pet' && info.report.capabilities.preview) {
      if (info.manifest.mediaVersion === 1) {
        for (const [action, file] of Object.entries(info.manifest.actions)) {
          const type = file.toLowerCase().endsWith('.mp4') ? 'video/mp4' : file.toLowerCase().endsWith('.webm') ? 'video/webm' : 'image/webp';
          presentation.media[action] = { key: `pets/${id}/media/${action}`, file: info.assetPrefix + file, type, displayName: info.manifest.actionDefinitions?.[action]?.displayName || action };
        }
      } else presentation.atlas = { key: `pets/${id}/media/atlas`, file: info.assetPrefix + (info.manifest.spritesheetPath || 'spritesheet.webp'), type: 'image/webp' };
    }
    try {
      await env.BUCKET.put(packageKey, bytes, { httpMetadata: { contentType: 'application/zip' } });
      if (coverKey) await env.BUCKET.put(coverKey, coverBytes, { httpMetadata: { contentType: coverMime } });
      for (const entry of [...Object.values(presentation.media), ...(presentation.atlas ? [presentation.atlas] : [])]) {
        extraKeys.push(entry.key); await env.BUCKET.put(entry.key, files[entry.file], { httpMetadata: { contentType: entry.type } });
      }
      const values = [id, owner, hash, metadata.id, metadata.title, metadata.description, metadata.author, metadata.license, metadata.source, metadata.workflow, info.report.level === 'native' ? '可在 desktop pet 导入；启用前请确认权限。' : '保留原项目格式，请按原项目说明在原宿主使用。本系统相关运行操作不可用。', packageKey, coverKey, coverMime || null, archive.size, new Date().toISOString()];
      if (kind === 'pet') values.push(JSON.stringify(presentation));
      await db.prepare(`INSERT INTO ${table} (id, owner, fingerprint, work_id, title, description, author, license, source, workflow, compatibility, package_key, cover_key, cover_mime, size, created_at${kind === 'pet' ? ', presentation' : ''}) VALUES (${values.map(() => '?').join(', ')})`).bind(...values).run();
    } catch (error) {
      const duplicate = await db.prepare(`SELECT * FROM ${table} WHERE owner = ? AND fingerprint = ?`).bind(owner, hash).first();
      if (duplicate) {
        if (duplicate.package_key !== packageKey) await env.BUCKET.delete([packageKey, ...(coverKey ? [coverKey] : []), ...extraKeys]);
        return json({ item: publicItem(duplicate, kind), alreadyPublished: true });
      }
      await env.BUCKET.delete([packageKey, ...(coverKey ? [coverKey] : []), ...extraKeys]);
      throw error;
    }
    return json({ item: publicItem(await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first(), kind) }, 201);
  } finally { publishing = false; }
}

function requireWriter(request) {
  const owner = request.headers.get('oai-authenticated-user-id');
  if (!owner) throw new InputError('请先登录。', 401);
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new InputError('请从共创平台提交。', 403);
  return owner;
}
async function boundedJson(request) {
  const reader = request.body?.getReader(); if (!reader) throw new InputError('内容缺失。');
  let bytes = 0, content = ''; const decoder = new TextDecoder();
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 16384) { await reader.cancel(); throw new InputError('内容过大。', 413); } content += decoder.decode(value, { stream: true }); }
  try { return JSON.parse(content + decoder.decode()); } catch { throw new InputError('内容格式无效。'); }
}
function publicRequest(row) { return { id: row.id, title: row.title, description: row.description, category: row.category, version: row.version, createdAtISO: row.created_at, status: 'waiting', public: true }; }
async function publishRequest(request, env) {
  const owner = requireWriter(request), db = database(env);
  const input = await validateInput(async () => validateRequest(await boundedJson(request)));
  const hash = await digest(new TextEncoder().encode(JSON.stringify(input)));
  const existing = await db.prepare('SELECT * FROM community_requests WHERE owner = ? AND fingerprint = ?').bind(owner, hash).first();
  if (existing) return json({ item: publicRequest(existing), alreadyPublished: true });
  const count = await db.prepare('SELECT COUNT(*) AS total FROM community_requests WHERE owner = ? AND created_at >= ?').bind(owner, new Date(Date.now() - 3600000).toISOString()).first();
  if (count.total >= 20) throw new InputError('本小时需求投稿已达 20 项。', 429);
  const id = `request-${crypto.randomUUID()}`, date = new Date().toISOString();
  try { await db.prepare('INSERT INTO community_requests (id, owner, fingerprint, title, description, category, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, owner, hash, input.title, input.description, input.category, input.version, date).run(); }
  catch (error) { const duplicate = await db.prepare('SELECT * FROM community_requests WHERE owner = ? AND fingerprint = ?').bind(owner, hash).first(); if (duplicate) return json({ item: publicRequest(duplicate), alreadyPublished: true }); throw error; }
  return json({ item: publicRequest({ id, ...input, created_at: date }) }, 201);
}
async function knownWork(db, id) {
  if (builtins.has(id)) return builtins.get(id);
  if (!/^community-[a-f0-9-]{36}$/.test(id)) return null;
  return await db.prepare('SELECT id FROM community_plugins WHERE id = ?').bind(id).first() || await db.prepare('SELECT id FROM community_pets WHERE id = ?').bind(id).first();
}
function visitor(request) {
  const existing = /(?:^|;\s*)pet-visitor=([a-f0-9-]{36})(?:;|$)/.exec(request.headers.get('cookie') || '')?.[1];
  const id = existing || crypto.randomUUID();
  return { id, cookie: existing ? null : `pet-visitor=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000` };
}
async function downloadActivity(request, env, id, identity) {
  const now = new Date().toISOString(), actor = await digest(new TextEncoder().encode(request.headers.get('oai-authenticated-user-id') || identity.id));
  try { await database(env).prepare('INSERT INTO community_downloads (id, work_id, actor, day, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(work_id, actor, day) DO NOTHING').bind(crypto.randomUUID(), id, actor, now.slice(0, 10), now).run(); }
  catch { console.error('下载统计记录失败，下载文件继续返回。'); }
}
async function activity(request, env) {
  const db = database(env), since = new Date(Date.now() - 7 * 86400000).toISOString(), owner = request.headers.get('oai-authenticated-user-id');
  const [likes, downloads, mine] = await Promise.all([
    db.prepare('SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_likes GROUP BY work_id').bind(since).all(),
    db.prepare('SELECT work_id, COUNT(*) AS total, SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) AS week FROM community_downloads GROUP BY work_id').bind(since).all(),
    owner ? db.prepare('SELECT work_id FROM community_likes WHERE actor = ?').bind(await digest(new TextEncoder().encode(owner))).all() : { results: [] },
  ]);
  const items = Object.create(null), liked = new Set(mine.results.map(row => row.work_id));
  for (const [rows, key] of [[likes.results, 'likes'], [downloads.results, 'downloads']]) for (const row of rows) {
    const entry = items[row.work_id] ||= { likes: 0, downloads: 0, weekly: 0, liked: liked.has(row.work_id) };
    entry[key] = row.total; entry.weekly += row.week;
  }
  return json({ items, scope: 'site', downloadRule: '同一账户或浏览器每天对同一作品计一次下载' });
}
async function like(request, env, id) {
  const owner = requireWriter(request), db = database(env), input = await boundedJson(request);
  if (!await knownWork(db, id)) throw new InputError('作品不存在。', 404);
  if (typeof input.liked !== 'boolean') throw new InputError('点赞状态无效。');
  const actor = await digest(new TextEncoder().encode(owner));
  if (input.liked) await db.prepare('INSERT INTO community_likes (id, work_id, actor, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(work_id, actor) DO NOTHING').bind(crypto.randomUUID(), id, actor, new Date().toISOString()).run();
  else await db.prepare('DELETE FROM community_likes WHERE work_id = ? AND actor = ?').bind(id, actor).run();
  return activity(request, env);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/session' && request.method === 'GET') { const response = json({ available: !!env.DB && !!env.BUCKET, signedIn: !!request.headers.get('oai-authenticated-user-id'), maxPackageBytes }); const identity = visitor(request); if (identity.cookie) response.headers.set('set-cookie', identity.cookie); return response; }
      if (url.pathname === '/api/activity' && request.method === 'GET') return await activity(request, env);
      const liking = /^\/api\/works\/([a-zA-Z0-9._-]{1,80})\/like$/.exec(url.pathname);
      if (liking && request.method === 'POST') return await like(request, env, liking[1]);
      if (url.pathname === '/api/requests') {
        if (request.method === 'POST') return await publishRequest(request, env);
        if (request.method !== 'GET') return json({ error: '不支持此操作。' }, 405);
        const rows = await database(env).prepare('SELECT * FROM community_requests ORDER BY created_at DESC LIMIT 500').all();
        return json({ items: rows.results.map(publicRequest) });
      }
      if (['/api/plugins', '/api/pets'].includes(url.pathname)) {
        const kind = url.pathname === '/api/pets' ? 'pet' : 'plugin';
        if (request.method === 'POST') return await publish(request, env, kind);
        if (request.method !== 'GET') return json({ error: '不支持此操作。' }, 405);
        const rows = await database(env).prepare(`SELECT * FROM community_${kind}s ORDER BY created_at DESC LIMIT 500`).all();
        return json({ items: rows.results.map(row => publicItem(row, kind)) });
      }
      const original = /^\/api\/download\/([a-zA-Z0-9._-]{1,80})$/.exec(url.pathname);
      if (original && ['GET', 'HEAD'].includes(request.method)) {
        const work = builtins.get(original[1]); if (!work) return json({ error: '文件不存在。' }, 404);
        const asset = new URL(work.download, url.origin + '/');
        if (asset.origin !== url.origin || !/^\/assets\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9._-]+\.zip$/.test(asset.pathname)) return json({ error: '作品地址无效。' }, 404);
        const assetRequest = new Request(asset, { method: request.method });
        const result = await fixedAsset(assetRequest, env);
        const response = new Response(result.body, result); response.headers.set('cache-control', 'no-store');
        if (result.ok && request.method === 'GET') { const identity = visitor(request); await downloadActivity(request, env, work.id, identity); if (identity.cookie) response.headers.set('set-cookie', identity.cookie); }
        return response;
      }
      const file = /^\/api\/(plugins|pets)\/(community-[a-f0-9-]{36})\/(download|cover|media\/[a-z0-9_-]{1,64})$/.exec(url.pathname);
      if (file && ['GET', 'HEAD'].includes(request.method)) {
        const row = await database(env).prepare(`SELECT * FROM community_${file[1]} WHERE id = ?`).bind(file[2]).first();
        const media = row?.presentation ? JSON.parse(row.presentation) : {};
        const entry = media.media?.[file[3].slice(6)] || (file[3] === 'media/atlas' ? media.atlas : null);
        const key = row && (file[3] === 'cover' ? row.cover_key : file[3] === 'download' ? row.package_key : entry?.key);
        if (!key) return json({ error: '作品不存在。' }, 404);
        const object = await env.BUCKET.get(key); if (!object) return json({ error: '文件暂不可用。' }, 404);
        const identity = visitor(request), isDownload = file[3] === 'download';
        if (isDownload && request.method === 'GET') await downloadActivity(request, env, row.id, identity);
        return new Response(request.method === 'HEAD' ? null : object.body, { headers: { 'content-type': file[3] === 'cover' ? row.cover_mime : isDownload ? 'application/zip' : entry.type, 'content-length': String(object.size), 'cache-control': isDownload ? 'no-store' : 'public, max-age=300', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox", ...(isDownload ? { 'content-disposition': `attachment; filename="${row.work_id.replace(/[^a-zA-Z0-9._-]/g, '-')}.zip"`, ...(identity.cookie ? { 'set-cookie': identity.cookie } : {}) } : {}) } });
      }
      if (url.pathname.startsWith('/api/')) return json({ error: '接口不存在。' }, 404);
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('不支持此操作。', { status: 405 });
      const originalAtlas = Object.hasOwn(builtinAtlases, url.pathname) && builtinAtlases[url.pathname];
      if (originalAtlas) return await builtinAtlas(request, env, url, originalAtlas);
      if (Object.hasOwn(builtinPackages, url.pathname)) return await fixedAsset(request, env);
      // 网页资源随 Worker 内嵌，原 ZIP 与其余资源交由平台静态层派发。
      const page = pages[url.pathname];
      if (page) return new Response(request.method === 'HEAD' ? null : page.body, { headers: { 'content-type': page.type, 'x-content-type-options': 'nosniff', 'cache-control': 'no-cache' } });
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response('文件不存在。', { status: 404 });
    } catch (error) {
      if (error instanceof InputError) return json({ error: error.message }, error.status);
      console.error('共创服务请求失败', error?.name);
      return json({ error: '发布服务暂时不可用，请保留文件和草稿后重试。' }, 503);
    }
  }
};
