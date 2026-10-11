const communityId = /^community-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function text(value, label, maximum, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || value.length > maximum || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\p{Cf}]/u.test(value) || !optional && !value.trim()) throw new Error(`公开作品的${label}格式无效。`);
  return value;
}

export function configuredSubmissionRepository(configured, identity) {
  if (!configured) return '';
  const target = githubRepository(configured);
  if (identity?.submissionAvailable === true && githubRepository(identity.submissionRepository) !== target) throw new Error('投稿仓库与本站配置不一致。');
  return target;
}

function githubRepository(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('投稿仓库尚未配置。'); }
  if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash || !/^\/[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}\/?$/.test(url.pathname)) throw new Error('投稿仓库地址无效。');
  return `${url.origin}${url.pathname.replace(/\/$/, '')}`;
}

export function githubSubmissionUrl(repository, metadata, archive, details = {}) {
  const url = new URL(`${githubRepository(repository)}/issues/new`);
  const title = text(metadata.title, '名称', 120), description = text(metadata.description, '说明', 1000);
  if (metadata.workflow === 'request') {
    const category = text(metadata.category, '分类', 80);
    if (![1, 2].includes(metadata.version)) throw new Error('制作需求图集版本无效。');
    url.searchParams.set('title', `[制作需求] ${title}`);
    url.searchParams.set('body', `## 制作需求\n\n- 名称：${title}\n- 分类：${category}\n- 图集版本：V${metadata.version}\n\n## 制作说明\n\n${description}\n\n提交后待维护者处理，此申请未自动在网站发布。`);
    return url.href;
  }
  if (!['pet-make', 'pet-import', 'plugin-make', 'plugin-import'].includes(metadata.workflow)) throw new Error('投稿作品类型无效。');
  const pet = metadata.workflow.startsWith('pet-');
  const id = text(metadata.id, '作品编号', 160), author = text(metadata.author, '作者', 120), license = text(metadata.license, '许可', 200);
  const file = text(archive?.name, '分享包名称', 180);
  if (!Number.isSafeInteger(archive.bytes) || archive.bytes < 1 || !/^[a-f0-9]{64}$/.test(archive.sha256)) throw new Error('分享包摘要无效。');
  url.searchParams.set('template', pet ? 'pet-submission.yml' : 'plugin-submission.yml');
  url.searchParams.set('title', `[${pet ? '桌宠' : '插件'}投稿] ${title}`);
  url.searchParams.set('work_name', title);
  url.searchParams.set('author', author);
  url.searchParams.set('description', description);
  url.searchParams.set('license', license);
  const attachment = archive.bytes > 25 * 1024 * 1024 ? `已生成的 ${file} 超过 GitHub Issue 附件上限，请按仓库投稿指南通过 PR 提交完整包后粘贴链接。` : `请将已生成的 ${file} 拖入此处，或按仓库投稿指南提交 PR 后粘贴链接。`;
  url.searchParams.set('files', `${attachment}\n\n作品ID：${id}\n共创入口：${metadata.workflow.endsWith('make') ? '制作' : '导入'}${pet ? '桌宠' : '插件'}\n包大小：${archive.bytes} 字节\nSHA-256：${archive.sha256}\n\n投稿等待审核收录；提交不代表自动上线。`);
  if (pet) {
    url.searchParams.set('actions', text(details.actions || '动作与名称以所附完整清单和素材为准。', '动作说明', 3000));
    url.searchParams.set('environment', text(details.environment || 'desktop pet；制作包按本系统规范，导入包保留原项目逻辑。', '运行说明', 2000));
  } else {
    url.searchParams.set('version', text(details.version || '原清单未声明版本', '版本', 120));
    url.searchParams.set('permissions', text(details.permissions || '权限以所附原清单为准；网页未执行上传代码。', '权限说明', 2000));
  }
  return url.href;
}

export function publicPluginItem(input) {
  if (!input || typeof input !== 'object' || !communityId.test(input.id)) throw new Error('公开插件编号无效。');
  const download = `/api/plugins/${input.id}/download`;
  const cover = `/api/plugins/${input.id}/cover`;
  if (input.download !== download || input.cover !== null && input.cover !== undefined && input.cover !== cover) throw new Error('公开插件文件地址无效。');
  return {
    id: input.id, kind: 'plugin', pluginType: input.pluginType === 'host-tool' ? 'host-tool' : 'community-plugin',
    title: text(input.title || input.name, '名称', 120), description: text(input.description, '说明', 1000),
    author: text(input.author, '作者', 120), license: text(input.license, '许可', 200), source: text(input.source, '来源', 1000, true),
    hostNotice: text(input.hostNotice, '安装说明', 2000, true),
    features: Array.isArray(input.features) ? input.features.slice(0, 20).map(value => text(value, '功能', 1000)) : [],
    permissions: [], permissionLabels: [], tags: ['社区作品'], category: '社区作品', symbol: '✦', cover: input.cover || null, download,
  };
}

export function publicPetItem(input) {
  if (!input || !communityId.test(input.id)) throw new Error('公开桌宠编号无效。');
  const base = `/api/pets/${input.id}`;
  if (input.download !== `${base}/download` || ![`${base}/cover`, 'assets/brand-logo.png'].includes(input.thumbnail) || input.atlas && input.atlas !== `${base}/media/atlas`) throw new Error('公开桌宠地址无效。');
  const mediaActions = {};
  const entries = Object.entries(input.mediaActions || {});
  if (entries.length > 128) throw new Error('公开桌宠动作超过 128 个。');
  for (const [id, entry] of entries) {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id) || entry.url !== `${base}/media/${id}` || !['video/mp4', 'video/webm', 'image/webp'].includes(entry.type)) throw new Error('公开桌宠动作无效。');
    mediaActions[id] = { url: entry.url, type: entry.type, displayName: text(entry.displayName, '动作名称', 80) };
  }
  return { id: input.id, kind: 'pet', title: text(input.title, '名称', 120), description: text(input.description, '说明', 1000), author: text(input.author, '作者', 120), license: text(input.license, '许可', 200), thumbnail: input.thumbnail, atlas: input.atlas || null, version: input.version === 2 ? 2 : 1, mediaActions, download: input.download, category: '社区作品', tags: ['社区作品'], hostNotice: text(input.hostNotice, '安装说明', 2000, true) };
}

export function publicActivity(input) {
  if (input?.scope !== 'site' || !input.items || typeof input.items !== 'object' || Array.isArray(input.items)) throw new Error('公共互动数据无效。');
  const items = Object.create(null);
  for (const [id, entry] of Object.entries(input.items)) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(id) || ['__proto__', 'constructor', 'prototype'].includes(id) || !entry || ['likes', 'downloads', 'weekly'].some(key => !Number.isSafeInteger(entry[key]) || entry[key] < 0) || typeof entry.liked !== 'boolean') throw new Error('公共互动记录无效。');
    for (const key of ['weeklyDownloads', 'weeklyLikes']) if (entry[key] !== undefined && (!Number.isSafeInteger(entry[key]) || entry[key] < 0)) throw new Error('公共每周互动记录无效。');
    items[id] = { likes: entry.likes, downloads: entry.downloads, weekly: entry.weekly, liked: entry.liked, scope: 'site' };
    for (const key of ['weeklyDownloads', 'weeklyLikes']) if (entry[key] !== undefined) items[id][key] = entry[key];
  }
  return items;
}

export function publicContributorFollowers(input) {
  if (input === undefined) return null;
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length > 3000) throw new Error('贡献者统计无效。');
  const result = new Map();
  for (const [author, entry] of Object.entries(input)) {
    text(author, '作者', 120);
    if (!Number.isSafeInteger(entry?.followers) || entry.followers < 0) throw new Error('贡献者关注数量无效。');
    result.set(author, entry.followers);
  }
  return result;
}

export function createPluginPublicationClient(request = globalThis.fetch.bind(globalThis)) {
  async function responseData(response) {
    let data;
    try { data = await response.json(); } catch { data = null; }
    if (!response.ok) {
      const error = new Error(typeof data?.error === 'string' ? data.error.slice(0, 500) : `发布服务返回 ${response.status}。`);
      error.status = response.status;
      throw error;
    }
    return data;
  }
  return {
    async session() {
      const response = await request('/api/session', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.status === 404) return { available: false, interactionsAvailable: false, anonymousInteractions: false, signedIn: false, maxPackageBytes: 0 };
      const data = await responseData(response);
      if (typeof data?.available !== 'boolean' || typeof data.signedIn !== 'boolean' || !Number.isSafeInteger(data.maxPackageBytes) || data.maxPackageBytes < (data.available ? 1 : 0) || data.maxPackageBytes > 32 * 1024 * 1024 || ['interactionsAvailable', 'anonymousInteractions', 'submissionAvailable'].some(key => data[key] !== undefined && typeof data[key] !== 'boolean')) throw new Error('发布服务身份信息无效。');
      if (data.submissionAvailable === true) githubRepository(data.submissionRepository);
      return { ...data, interactionsAvailable: data.interactionsAvailable ?? data.available, anonymousInteractions: data.anonymousInteractions === true };
    },
    async list(kind = 'plugin') {
      const response = await request(`/api/${kind === 'pet' ? 'pets' : 'plugins'}`, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.status === 404) return [];
      const data = await responseData(response);
      if (!Array.isArray(data?.items) || data.items.length > 1000) throw new Error('公开插件列表无效。');
      return data.items.map(kind === 'pet' ? publicPetItem : publicPluginItem);
    },
    async publish(metadata, archive, cover) {
      if (!['plugin-make', 'plugin-import', 'pet-make', 'pet-import'].includes(metadata.workflow)) throw new Error('请选择作品制作或导入入口。');
      const kind = metadata.workflow.startsWith('pet-') ? 'pet' : 'plugin';
      const payload = new FormData();
      payload.append('metadata', JSON.stringify(metadata));
      payload.append('package', archive, 'plugin-share.zip');
      if (cover) payload.append('cover', new Blob([cover.bytes], { type: cover.mime }), `cover.${cover.extension || 'png'}`);
      const response = await request(`/api/${kind}s`, { method: 'POST', credentials: 'same-origin', body: payload, headers: { Accept: 'application/json' } });
      const data = await responseData(response);
      if (![200, 201].includes(response.status)) throw new Error('发布服务没有确认作品已保存。');
      return kind === 'pet' ? publicPetItem(data?.item) : publicPluginItem(data?.item);
    },
    async activity() { return publicActivity(await responseData(await request('/api/activity', { credentials: 'same-origin', cache: 'no-store' }))); },
    async activitySnapshot() {
      const data = await responseData(await request('/api/activity', { credentials: 'same-origin', cache: 'no-store' }));
      return { items: publicActivity(data), contributors: publicContributorFollowers(data.contributors) };
    },
    async like(id, liked) { if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(id) || typeof liked !== 'boolean') throw new Error('点赞参数无效。'); return publicActivity(await responseData(await request(`/api/works/${id}/like`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ liked }) }))); },
    async requests() {
      const data = await responseData(await request('/api/requests', { credentials: 'same-origin', cache: 'no-store' }));
      if (!Array.isArray(data?.items) || data.items.length > 1000) throw new Error('需求列表无效。');
      return data.items.map(publicRequestItem);
    },
    async publishRequest(input) { const data = await responseData(await request('/api/requests', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })); return publicRequestItem(data?.item); },
    async contributor(author, kind = 'pets') {
      const path = contributorEndpoint(author, kind);
      const response = await request(path, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (response.status === 404 || response.status === 501) return { available: false, followers: null, following: false };
      return contributorState(await responseData(response));
    },
    async followContributor(author, kind, following) {
      if (typeof following !== 'boolean') throw new Error('关注参数无效。');
      return contributorState(await responseData(await request(contributorEndpoint(author, kind), { method: 'PUT', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ following }) })));
    },
  };
}

function contributorEndpoint(author, kind) {
  text(author, '作者', 120);
  if (!['pets', 'plugins'].includes(kind)) throw new Error('作者作品类型无效。');
  return `/api/contributors/${encodeURIComponent(author)}?kind=${kind}`;
}

function contributorState(input) {
  if (input?.available !== true || !Number.isSafeInteger(input.followers) || input.followers < 0 || typeof input.following !== 'boolean') throw new Error('作者关注信息无效。');
  return { available: true, followers: input.followers, following: input.following };
}

function publicRequestItem(input) {
  if (!input || !/^request-[a-f0-9-]{36}$/.test(input.id) || ![1, 2].includes(input.version)) throw new Error('公开需求无效。');
  return { id: input.id, title: text(input.title, '名称', 80), description: text(input.description, '说明', 1000), category: text(input.category, '分类', 80), version: input.version, createdAtISO: text(input.createdAtISO, '时间', 40), status: 'waiting', public: true };
}
