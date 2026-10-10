import test from 'node:test';
import assert from 'node:assert/strict';
import { pets, projectAuthor, projectAuthorUrl } from '../dist/catalog.js';
import { collections, requestSeeds } from '../dist/community-data.js';
import { validateRequest, normalizeRequestState, rankPets, rankAuthors, collectionWorks, contributorHref, contributorProfile, workStatistics, contributorRankingStatistics } from '../dist/community-core.js';

const validRequest = { title: '陪读猫咪', description: '会翻书，也会打盹。', category: '动物伙伴', version: 2 };

test('需求仅保留有效创作字段，并拒绝空文字、超长内容和不支持的分类版本', () => {
  assert.deepEqual(validateRequest({ ...validRequest, title: '  陪读猫咪  ', version: '2', secret: '不能保留' }), validRequest);
  assert.equal(validateRequest({ ...validRequest, description: '翻书\r\n打盹' }).description, '翻书\n打盹');
  for (const patch of [{ title: '' }, { title: '猫'.repeat(81) }, { description: '猫'.repeat(1001) }, { title: '猫\u0000' }, { category: '未知分类' }, { version: true }, { version: 3 }]) {
    assert.throws(() => validateRequest({ ...validRequest, ...patch }));
  }
  assert.throws(() => validateRequest(null));
});

test('损坏存储不产生假需求，支持和关注只引用有效种子或恢复的本地需求', () => {
  const valid = { ...validRequest, id: 'local-example', status: 'waiting', createdAtISO: '2026-10-07T00:00:00.000Z', author: '不信任的额外字段' };
  const state = normalizeRequestState({
    entries: [null, { ...valid, id: '../private' }, { ...valid, createdAtISO: '无效日期' }, valid, valid, { ...valid, id: 'local-bad-status', status: 'complete' }],
    supported: ['example-reading-cat', 'local-example', 'unknown', 'local-bad-status', 'local-example'],
    following: ['local-example', {}, 'unknown'],
  }, requestSeeds.map(seed => seed.id));
  assert.deepEqual(state, {
    entries: [{ id: 'local-example', ...validRequest, status: 'waiting', createdAtISO: valid.createdAtISO }],
    supported: ['example-reading-cat', 'local-example'], following: ['local-example'],
  });
  assert.deepEqual(normalizeRequestState(null, []), { entries: [], supported: [], following: [] });
  const many = Array.from({ length: 200 }, (_, index) => ({ ...valid, id: `local-${index}` }));
  assert.deepEqual(normalizeRequestState({ entries: many }, []).entries.map(entry => entry.id), many.slice(0, 100).map(entry => entry.id));
});

test('空活动为空榜，周榜只统计真实七日范围，累计榜使用下载与当前点赞', () => {
  const now = Date.parse('2026-10-07T12:00:00Z');
  const week = 7 * 24 * 60 * 60 * 1000;
  const works = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
  assert.deepEqual(rankPets(works, {}, 'week', now), []);
  assert.deepEqual(rankPets(works, { a: { liked: false, downloads: 0 } }, 'all', now), []);
  const activity = { a: { downloads: 2, liked: true, recent: [now - week, now - week + 1, now, now + 1, '伪造时间', NaN] }, b: { downloads: -1, liked: false, recent: [now - week - 1] } };
  assert.deepEqual(rankPets(works, activity, 'week', now), [{ work: works[0], count: 2 }]);
  assert.deepEqual(rankPets(works, activity, 'all', now), [{ work: works[0], count: 3 }]);
});

test('作者榜统计实际作品，合集忽略未知作品和重复引用', () => {
  const works = [{ id: 'a', title: 'A', author: '作者甲' }, { id: 'b', title: 'B', author: '作者甲' }, { id: 'c', title: 'C', author: '作者乙' }];
  assert.deepEqual(rankAuthors([...works, works[0]]), [{ name: '作者甲', count: 2, petIds: ['a', 'b'] }, { name: '作者乙', count: 1, petIds: ['c'] }]);
  assert.deepEqual(collectionWorks({ petIds: ['c', 'missing', 'a', 'c'] }, works), [works[2], works[0]]);
  for (const collection of collections) {
    const actual = collectionWorks(collection, pets);
    assert.equal(actual.length, collection.petIds.length);
    assert.ok(actual.length > 0);
  }
  for (const seed of requestSeeds) {
    assert.equal(seed.example, true);
    assert.ok(seed.description.includes('示例'));
    assert.doesNotThrow(() => validateRequest(seed));
  }
});

test('插件榜复用真实互动算法，与桌宠活动隔离，作者榜可统计插件收录量', () => {
  const plugins = [{ id: 'plugin-a', title: '文件助手', author: 'Lykinzlj' }, { id: 'plugin-b', title: '喝水提醒', author: 'Lykinzlj' }];
  const now = Date.now();
  const activity = { 'plugin-a': { downloads: 3, liked: true, recent: [now] }, 'pet-a': { downloads: 100, recent: [now, now] } };
  assert.deepEqual(rankPets(plugins, activity, 'all', now), [{ work: plugins[0], count: 4 }]);
  assert.deepEqual(rankPets(plugins, activity, 'week', now), [{ work: plugins[0], count: 1 }]);
  assert.deepEqual(rankAuthors(plugins), [{ name: 'Lykinzlj', count: 2, petIds: ['plugin-a', 'plugin-b'] }]);
});

test('公开榜使用全站多账户赞数与每日去重下载，零记录不产生假名次', () => {
  const works = [{ id: 'a', title: '伙伴甲' }, { id: 'b', title: '伙伴乙' }];
  const activity = { a: { scope: 'site', likes: 6, downloads: 3, weekly: 2, liked: false }, b: { scope: 'site', likes: 0, downloads: 0, weekly: 0, liked: true } };
  assert.deepEqual(rankPets(works, activity, 'all'), [{ work: works[0], count: 9 }]);
  assert.deepEqual(rankPets(works, activity, 'week'), [{ work: works[0], count: 2 }]);
});

test('作者页按原署名聚合，跨桌宠插件切换只显示对应真实作品并保留明确主页', () => {
  const author = '作者 / 中文';
  const pet = { id: 'cat', title: '猫咪', author, authorHandle: 'cat-author', authorUrl: 'https://example.com/creator', kind: 'pet' };
  const plugin = { id: 'water', title: '喝水提醒', author, kind: 'plugin' };
  const works = [pet, plugin, pet, { id: 'other', author: '其他', kind: 'pet' }];
  const activity = { cat: { scope: 'site', downloads: 3, likes: 2, weekly: 4 }, water: { scope: 'site', downloads: 11, likes: 5, weekly: 7 } };
  const petsProfile = contributorProfile(works, author, 'pets', activity);
  assert.equal(petsProfile.allCount, 2);
  assert.equal(petsProfile.petCount, 1); assert.equal(petsProfile.pluginCount, 1);
  assert.deepEqual(petsProfile.members, [pet]);
  assert.equal(petsProfile.handle, 'cat-author'); assert.equal(petsProfile.homepage, 'https://example.com/creator');
  assert.deepEqual(petsProfile.statistics, { works: 1, downloads: 3, likes: 2, weekly: 4 });
  assert.deepEqual(contributorProfile(works, author, 'plugins', activity).statistics, { works: 1, downloads: 11, likes: 5, weekly: 7 });
  assert.equal(contributorHref(author, 'plugins'), '#contributors/plugins/%E4%BD%9C%E8%80%85%20%2F%20%E4%B8%AD%E6%96%87');
  assert.equal(contributorProfile(works, '不存在', 'pets', activity), null);
});

test('统计不可用显示空值而非零，未提供或不安全主页不从署名猜测GitHub地址', () => {
  const works = [{ id: 'one', kind: 'pet', author: 'a', authorUrl: 'javascript:alert(1)' }, { id: 'two', kind: 'plugin', author: 'a', authorUrl: 'https://secret@example.com/a' }];
  const profile = contributorProfile(works, 'a', 'pets', {}, false);
  assert.equal(profile.homepage, null); assert.equal(profile.handle, '');
  assert.deepEqual(profile.statistics, { works: 1, downloads: null, likes: null, weekly: null });
});

test('本站作者保持Lykinzlj显示署名，桌宠与插件主页均使用已批准的真实账户', () => {
  assert.equal(projectAuthor, 'Lykinzlj');
  assert.equal(projectAuthorUrl, 'https://github.com/xunguangzlj-cloud');
  const works = ['pet', 'plugin'].map(kind => ({ id: kind, kind, author: projectAuthor, authorHandle: projectAuthor, authorUrl: projectAuthorUrl }));
  for (const kind of ['pets', 'plugins']) {
    const profile = contributorProfile(works, projectAuthor, kind, {}, false);
    assert.equal(profile.name, 'Lykinzlj');
    assert.equal(profile.homepage, 'https://github.com/xunguangzlj-cloud');
    assert.equal(profile.allCount, 2);
  }
});

test('浏览器统计与全站统计分别合计，未来和窗口之外记录不算近七日互动', () => {
  const now = 2000000000, work = { id: 'a' };
  const recent = [now, now + 1, now - 7 * 86400000, now - 1];
  assert.deepEqual(workStatistics([work, work], { a: { downloads: 4, liked: true, recent } }, true, now), { works: 1, downloads: 4, likes: 1, weekly: 2 });
  assert.deepEqual(workStatistics([work], { a: { scope: 'site', downloads: 4, likes: 9, weekly: 6, liked: false, recent } }, true, now), { works: 1, downloads: 4, likes: 9, weekly: 6 });
});

test('贡献者周下载与周点赞只聚合服务明确的分别计数，缺少明细不拆分合计互动', () => {
  const works = [{ id: 'one' }, { id: 'two' }];
  const activity = { one: { scope: 'site', downloads: 8, likes: 4, weekly: 6, weeklyDownloads: 3, weeklyLikes: 3 }, two: { scope: 'site', downloads: 2, likes: 1, weekly: 2, weeklyDownloads: 1, weeklyLikes: 1 } };
  assert.deepEqual(contributorRankingStatistics(works, activity), { works: 2, downloads: 10, likes: 5, weekly: 8, weeklyDownloads: 4, weeklyLikes: 4 });
  delete activity.two.weeklyLikes;
  assert.equal(contributorRankingStatistics(works, activity).weeklyLikes, null);
  assert.equal(contributorRankingStatistics(works, activity).weeklyDownloads, 4);
  assert.equal(contributorRankingStatistics(works, { one: { downloads: 1, liked: true, recent: [Date.now()] } }).weeklyDownloads, null);
  assert.equal(contributorRankingStatistics(works, activity, false).weeklyDownloads, null);
});
