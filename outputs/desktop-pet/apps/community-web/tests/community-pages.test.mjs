import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunityPages } from '../dist/community-pages.js';
import { collections } from '../dist/community-data.js';

function pageFixture(publication, statistics = { scope: 'site', available: true, updatedAt: '2026-10-10T01:00:00Z', contributors: new Map([['共同作者', 7]]) }, repository = '', content = {}) {
  const original = { document: globalThis.document, localStorage: globalThis.localStorage, location: globalThis.location, window: globalThis.window, FormData: globalThis.FormData };
  const saved = [], opened = [];
  const elements = new Map();
  const element = key => {
    if (!elements.has(key)) elements.set(key, { textContent: '', innerHTML: '', value: key === '#ranking-period' ? 'week' : '', hidden: false, disabled: false, dataset: {}, attributes: {}, listeners: {}, children: [], setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; }, addEventListener(name, callback) { this.listeners[name] = callback; }, querySelectorAll() { return this.children; }, focus() {} });
    return elements.get(key);
  };
  for (const [selector, field, values] of [['#ranking-tabs', 'rankingView', ['works', 'authors', 'collections']], ['#ranking-kinds', 'rankingKind', ['pets', 'plugins']], ['#ranking-period-buttons', 'rankingPeriod', ['week', 'all']]]) element(selector).children = values.map(value => ({ dataset: { [field]: value }, setAttribute() {} }));
  globalThis.document = { querySelector: element, addEventListener() {} };
  globalThis.localStorage = { getItem: () => null, setItem(key, value) { saved.push({ key, value }); } };
  globalThis.location = { hash: '' };
  globalThis.window = { open(...args) { opened.push(args); return null; } };
  globalThis.FormData = class { constructor(form) { this.fields = form.fields; } [Symbol.iterator]() { return Object.entries(this.fields)[Symbol.iterator](); } };
  const pets = content.pets ?? [{ id: 'cat', kind: 'pet', title: '猫咪', author: '共同作者', authorHandle: 'shared', thumbnail: 'cat.webp', authorUrl: 'https://example.com/author' }];
  const plugins = content.plugins ?? [{ id: 'water', kind: 'plugin', title: '喝水提醒', author: '共同作者', cover: 'water.webp', category: '提醒' }];
  const activity = content.activity ?? { cat: { scope: 'site', downloads: 3, likes: 2, weekly: 1, weeklyDownloads: 1, weeklyLikes: 0 }, water: { scope: 'site', downloads: 8, likes: 4, weekly: 5, weeklyDownloads: 2, weeklyLikes: 3 } };
  const pages = createCommunityPages({ pets, plugins, activityFor: id => activity[id], escapeHtml: value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]), icon: () => '', toast() {}, copyGalleryText() {}, download() {}, browseGallery() {}, publication, session: () => ({ available: false, interactionsAvailable: true, anonymousInteractions: true }), renderCard: work => `<article data-work="${work.id}">${work.title}</article>`, statisticsSnapshot: () => statistics, submissionRepository: () => repository });
  return { pages, element, saved, opened, activity, click(selector, dataset) { return element(selector).listeners.click({ target: { closest: () => ({ dataset }) } }); }, restore() { for (const [key, value] of Object.entries(original)) if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } };
}

test('作者页面实际作品顺序优先热门，统计刷新后重排且保留零记录作品', async () => {
  const pets = ['downloads', 'likes', 'zero'].map(id => ({ id, title: id, kind: 'pet', author: '共同作者', thumbnail: id + '.webp' }));
  const activity = { downloads: { scope: 'site', downloads: 8, likes: 0 }, likes: { scope: 'site', downloads: 2, likes: 6 } };
  const fixture = pageFixture({ contributor: async () => ({ available: false }) }, undefined, '', { pets, activity });
  const order = () => [...fixture.element('#contributor-works').innerHTML.matchAll(/data-work="([^"]+)"/g)].map(match => match[1]);
  try {
    fixture.pages.render('contributors', 'pets', encodeURIComponent('共同作者'));
    assert.deepEqual(order(), ['likes', 'downloads', 'zero']);
    activity.downloads.downloads = 20;
    fixture.pages.refresh();
    assert.deepEqual(order(), ['downloads', 'likes', 'zero']);
    assert.equal(fixture.element('#contributor-work-count').textContent, 3);
    await new Promise(resolve => setImmediate(resolve));
  } finally { fixture.restore(); }
});

test('首页伙伴和合集内部按实际热度展示，合集不因零互动减少成员', () => {
  const collection = collections.find(item => item.petIds.length >= 3);
  const pets = collection.petIds.slice(0, 3).map(id => ({ id, title: id, kind: 'pet', author: '共同作者', thumbnail: id + '.webp', download: id + '.zip' }));
  const activity = { [pets[0].id]: { scope: 'site', downloads: 4, likes: 0 }, [pets[1].id]: { scope: 'site', downloads: 1, likes: 7 } };
  const fixture = pageFixture({}, undefined, '', { pets, plugins: [], activity });
  try {
    fixture.pages.render('pets');
    assert.deepEqual([...fixture.element('#hero-pets').innerHTML.matchAll(/href="#pets\/([^"]+)"/g)].map(match => match[1]), [pets[1].id, pets[0].id, pets[2].id]);
    fixture.pages.render('collections', collection.id);
    assert.deepEqual([...fixture.element('#collection-pets').innerHTML.matchAll(/data-download="([^"]+)"/g)].map(match => match[1]), [pets[1].id, pets[0].id, pets[2].id]);
  } finally { fixture.restore(); }
});

test('榜单类型与周期按钮实际切换，贡献者条目打开对应本站作者页', () => {
  const fixture = pageFixture({});
  try {
    fixture.pages.render('rankings', 'authors');
    assert.match(fixture.element('#ranking-list').innerHTML, /#contributors\/pets\/.*共同作者|#contributors\/pets\/%E5%85%B1/);
    assert.match(fixture.element('#ranking-list').innerHTML, /本站贡献 1 只桌宠/);
    assert.match(fixture.element('#ranking-list').innerHTML, /<dd>1<\/dd><dt>近 7 日下载<\/dt>/);
    assert.match(fixture.element('#ranking-list').innerHTML, /<dd>0<\/dd><dt>近 7 日点赞<\/dt>/);
    assert.match(fixture.element('#ranking-list').innerHTML, /<dd>7<\/dd><dt>关注者<\/dt>/);
    fixture.click('#ranking-kinds', { rankingKind: 'plugins' });
    assert.equal(globalThis.location.hash, 'rankings/plugin-authors');
    assert.match(fixture.element('#ranking-list').innerHTML, /#contributors\/plugins\//);
    assert.match(fixture.element('#ranking-list').innerHTML, /water.webp/);
    assert.match(fixture.element('#ranking-list').innerHTML, /<dd>2<\/dd><dt>近 7 日下载<\/dt>/);
    assert.match(fixture.element('#ranking-list').innerHTML, /<dd>3<\/dd><dt>近 7 日点赞<\/dt>/);
    fixture.click('#ranking-tabs', { rankingView: 'works' });
    fixture.click('#ranking-period-buttons', { rankingPeriod: 'all' });
    assert.equal(globalThis.location.hash, 'rankings/plugins');
    assert.match(fixture.element('#ranking-list').innerHTML, /喝水提醒/);
    assert.match(fixture.element('#ranking-list').innerHTML, /累计互动/);
    assert.equal(fixture.element('#ranking-period').value, 'all');
  } finally { fixture.restore(); }
});

test('作者异步关注只采用当前作者服务回执，跨类型切换不混入旧回执或作品', async () => {
  const pending = [], changes = [];
  const publication = { contributor: () => new Promise(resolve => pending.push(resolve)), followContributor: async (...args) => { changes.push(args); return { available: true, followers: 3, following: true }; } };
  const fixture = pageFixture(publication);
  try {
    const author = encodeURIComponent('共同作者');
    fixture.pages.render('contributors', 'pets', author);
    assert.equal(fixture.element('#contributor-followers').textContent, '—');
    assert.equal(fixture.element('#contributor-follow').disabled, true);
    fixture.pages.render('contributors', 'plugins', author);
    pending[1]({ available: true, followers: 2, following: false });
    pending[0]({ available: true, followers: 999, following: true });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(fixture.element('#contributor-followers').textContent, '2');
    assert.equal(fixture.element('#contributor-follow').disabled, false);
    assert.equal(fixture.element('#contributor-description').textContent, '本站贡献 2 件作品');
    assert.equal(fixture.element('#contributor-works-title').textContent, '共同作者 的插件');
    assert.match(fixture.element('#contributor-works').innerHTML, /data-work="water"/);
    assert.doesNotMatch(fixture.element('#contributor-works').innerHTML, /data-work="cat"/);
    await fixture.click('#contributor-follow');
    assert.deepEqual(changes, [['共同作者', 'plugins', true]]);
    assert.equal(fixture.element('#contributor-followers').textContent, '3');
    assert.equal(fixture.element('#contributor-follow').textContent, '已关注');
    fixture.pages.refresh();
    assert.match(fixture.element('#contributor-works').innerHTML, /data-work="water"/);
    assert.equal(pending.length, 2);
  } finally { fixture.restore(); }
});

test('需求投稿先保留草稿再打开本站Issue，弹窗拦截仍可手动打开，不冒称已公示', async () => {
  const repository = 'https://github.com/xunguangzlj-cloud/desktop-pet-community';
  const fixture = pageFixture({ session() { throw new Error('无需网站账号'); }, publishRequest() { throw new Error('不自动发布'); } }, undefined, repository);
  try {
    const form = fixture.element('#request-form');
    form.fields = { title: '安静小猫', description: '温柔地陪伴', category: '动物伙伴', version: '2' };
    form.reset = () => assert.fail('提交表单后仍应保留用户填写');
    await form.listeners.submit({ preventDefault() {}, currentTarget: form, submitter: { id: 'request-publish' } });
    assert.equal(fixture.saved.length, 1);
    assert.equal(JSON.parse(fixture.saved[0].value).entries[0].title, '安静小猫');
    assert.equal(fixture.opened.length, 1);
    const link = fixture.element('#request-submission-link');
    assert.equal(link.hidden, false);
    assert.equal(link.href, fixture.opened[0][0]);
    assert.equal(new URL(link.href).pathname, '/xunguangzlj-cloud/desktop-pet-community/issues/new');
    assert.match(fixture.element('#request-feedback').textContent, /处理收录后/);
    assert.doesNotMatch(fixture.element('#request-feedback').textContent, /已发布/);
    assert.equal(fixture.element('#request-publish').disabled, false);
    assert.match(fixture.element('#request-list').innerHTML, /安静小猫/);
  } finally { fixture.restore(); }
});
