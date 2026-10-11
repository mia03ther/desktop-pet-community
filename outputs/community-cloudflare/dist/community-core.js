export const requestCategories = ['游戏角色', '动漫角色', '吉祥物', '其他', '机器人', '原创角色', '人物头像', '动物伙伴', '幻想生物', '网络梗图', '物件与道具'];
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
const maxLocalRequests = 100;

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value, label, limit, multiline = false) {
  if (typeof value !== 'string') throw new Error(`请填写${label}。`);
  const result = value.replace(/\r\n?/g, '\n').trim();
  const checked = multiline ? result.replace(/[\n\t]/g, '') : result;
  if (!result || result.length > limit || /[\p{Cc}\p{Cf}]/u.test(checked)) {
    throw new Error(`${label}需为 1 至 ${limit} 字的有效文字。`);
  }
  return result;
}

export function validateRequest(input) {
  if (!record(input)) throw new Error('制作需求格式无效。');
  const title = text(input.title, '角色名称', 80);
  const description = text(input.description, '创作说明', 1000, true);
  if (!requestCategories.includes(input.category)) throw new Error('请选择支持的角色分类。');
  const version = input.version === 1 || input.version === '1' ? 1 : input.version === 2 || input.version === '2' ? 2 : null;
  if (version === null) throw new Error('请选择 V1 或 V2 图集。');
  return { title, description, category: input.category, version };
}

export function normalizeRequestState(input, seedIds) {
  const result = { entries: [], supported: [], following: [] };
  if (!record(input)) return result;
  const knownIds = new Set(Array.isArray(seedIds) ? seedIds.filter(id => typeof id === 'string') : []);
  const localIds = new Set();
  const entries = Array.isArray(input.entries) ? input.entries.slice(0, 200) : [];
  for (const entry of entries) {
    if (result.entries.length >= maxLocalRequests) break;
    if (!record(entry) || typeof entry.id !== 'string' || !/^local-[a-zA-Z0-9_-]{1,80}$/.test(entry.id) || localIds.has(entry.id)) continue;
    if (entry.status !== 'waiting' || typeof entry.createdAtISO !== 'string') continue;
    const createdAt = Date.parse(entry.createdAtISO);
    if (!Number.isFinite(createdAt) || new Date(createdAt).toISOString() !== entry.createdAtISO) continue;
    try {
      const validated = validateRequest(entry);
      result.entries.push({ id: entry.id, ...validated, status: 'waiting', createdAtISO: entry.createdAtISO });
      localIds.add(entry.id);
      knownIds.add(entry.id);
    } catch {
      // 单条损坏记录不阻止其他有效需求恢复。
    }
  }
  for (const key of ['supported', 'following']) {
    const ids = Array.isArray(input[key]) ? input[key].slice(0, 200) : [];
    result[key] = [...new Set(ids.filter(id => typeof id === 'string' && knownIds.has(id)))];
  }
  return result;
}

export function rankPets(pets, activity, period, now = Date.now()) {
  const timestamp = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(timestamp) || !Array.isArray(pets)) return [];
  const since = timestamp - weekMilliseconds;
  const ranked = [];
  for (const work of pets) {
    const entry = record(activity) && Object.hasOwn(activity, work.id) ? activity[work.id] : undefined;
    if (!record(entry)) continue;
    const downloads = Number.isSafeInteger(entry.downloads) && entry.downloads >= 0 ? entry.downloads : 0;
    const count = entry.scope === 'site' ? period === 'week' ? entry.weekly : downloads + entry.likes : period === 'week'
      ? (Array.isArray(entry.recent) ? entry.recent.filter(time => Number.isFinite(time) && time > since && time <= timestamp).length : 0)
      : downloads + Number(entry.liked === true);
    if (count > 0) ranked.push({ work, count });
  }
  return ranked.sort((a, b) => b.count - a.count || a.work.title.localeCompare(b.work.title, 'zh-CN'));
}

export function rankAuthors(pets) {
  const authors = new Map();
  for (const pet of pets) {
    if (!pet.author || !pet.id) continue;
    const entry = authors.get(pet.author) || { name: pet.author, count: 0, petIds: [] };
    if (!entry.petIds.includes(pet.id)) {
      entry.petIds.push(pet.id);
      entry.count++;
    }
    authors.set(pet.author, entry);
  }
  return [...authors.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}

export function collectionWorks(collection, pets) {
  if (!record(collection) || !Array.isArray(collection.petIds)) return [];
  const byId = new Map(pets.map(pet => [pet.id, pet]));
  return [...new Set(collection.petIds)].map(id => byId.get(id)).filter(Boolean);
}

export function contributorHref(author, kind = 'pets') {
  return `#contributors/${kind === 'plugins' ? 'plugins' : 'pets'}/${encodeURIComponent(author)}`;
}

export function workStatistics(works, activity, available = true, now = Date.now()) {
  const members = [...new Map(works.filter(work => work?.id).map(work => [work.id, work])).values()];
  const result = { works: members.length, downloads: available ? 0 : null, likes: available ? 0 : null, weekly: available ? 0 : null };
  if (!available) return result;
  for (const work of members) {
    const entry = activity?.[work.id];
    if (!record(entry)) continue;
    result.downloads += Number.isSafeInteger(entry.downloads) && entry.downloads >= 0 ? entry.downloads : 0;
    result.likes += entry.scope === 'site' ? Number.isSafeInteger(entry.likes) && entry.likes >= 0 ? entry.likes : 0 : Number(entry.liked === true);
    result.weekly += entry.scope === 'site' ? Number.isSafeInteger(entry.weekly) && entry.weekly >= 0 ? entry.weekly : 0 : (Array.isArray(entry.recent) ? entry.recent.filter(time => Number.isFinite(time) && time > now - weekMilliseconds && time <= now).length : 0);
  }
  return result;
}

export function contributorRankingStatistics(works, activity, available = true) {
  const members = [...new Map(works.filter(work => work?.id).map(work => [work.id, work])).values()];
  const result = workStatistics(members, activity, available);
  for (const key of ['weeklyDownloads', 'weeklyLikes']) {
    result[key] = available && members.every(work => activity?.[work.id]?.scope === 'site' && Number.isSafeInteger(activity[work.id][key]) && activity[work.id][key] >= 0) ? members.reduce((sum, work) => sum + activity[work.id][key], 0) : null;
  }
  return result;
}

export function contributorProfile(works, author, kind, activity, available = true) {
  const all = [...new Map(works.filter(work => work.author === author).map(work => [work.id, work])).values()];
  if (!all.length) return null;
  const members = all.filter(work => work.kind === (kind === 'plugins' ? 'plugin' : 'pet'));
  const identified = all.find(work => typeof work.authorHandle === 'string' && work.authorHandle.trim());
  let homepage = null;
  for (const work of all) {
    try { const url = new URL(work.authorUrl); if (url.protocol === 'https:' && !url.username && !url.password) { homepage = url.href; break; } } catch { /* 未提供明确作者主页，不猜地址。 */ }
  }
  return { name: author, handle: identified?.authorHandle || '', homepage, members, allCount: all.length, petCount: all.filter(work => work.kind === 'pet').length, pluginCount: all.filter(work => work.kind === 'plugin').length, statistics: workStatistics(members, activity, available) };
}
