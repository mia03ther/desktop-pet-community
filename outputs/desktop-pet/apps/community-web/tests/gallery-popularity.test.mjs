import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pets, toolPlugins} from '../dist/catalog.js';

// 加载完整应用模块，以实际事件和 API 回执检查页面顺序；不替换应用函数。
async function galleryFixture(items, hash = '#pets', browserActivity = null) {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  const original = Object.fromEntries(['document', 'window', 'location', 'localStorage', 'fetch'].map(key => [key, globalThis[key]]));
  const calls = [], elements = new Map(), pageListeners = new Map();
  function element(key) {
    if (elements.has(key)) return elements.get(key);
    const listeners = new Map();
    let content = '', contentGeneration = 0;
    const value = {
      get innerHTML() { return content; }, set innerHTML(value) { content = value; contentGeneration++; },
      get contentGeneration() { return contentGeneration; },
      textContent: '', value: '', dataset: {}, attributes: {}, style: {}, hidden: false, open: false,
      parentElement: {hidden: false}, classList: {contains: () => false, add() {}, remove() {}, toggle() {}},
      setAttribute(name, value) { this.attributes[name] = String(value); }, removeAttribute(name) { delete this.attributes[name]; },
      addEventListener(name, callback) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(callback); },
      dispatchEvent(event) { for (const callback of listeners.get(event.type) ?? []) callback({target: this, currentTarget: this}); return true; },
      async fire(name, target = this) { await Promise.all((listeners.get(name) ?? []).map(callback => callback({target, currentTarget: this, preventDefault() {}}))); },
      querySelectorAll(selector) { return selector === '[data-like]' ? [...this.innerHTML.matchAll(/data-like="([^"]+)"/g)].map(match => ({dataset: {like: match[1]}, focus() {}, setAttribute() {}})) : []; },
      close() { this.open = false; }, pause() {}, load() {}, focus() {}, append() {}, prepend() {}, scrollIntoView() {},
      replaceChildren() { this.innerHTML = ''; }, hasChildNodes() { return Boolean(this.innerHTML); }, getAnimations: () => [],
    };
    elements.set(key, value);return value;
  }
  element('#sort').value = html.match(/<select id="sort">\s*<option value="([^"]+)"/)[1];
  const document = {
    querySelector: element,
    querySelectorAll: selector => selector === '[data-like]' ? element('#cards').querySelectorAll(selector) : [],
    createElement: tag => element('created-' + tag), documentElement: element('documentElement'),
    addEventListener(name, callback) { if (!pageListeners.has(name)) pageListeners.set(name, []);pageListeners.get(name).push(callback); },
  };
  const windowListeners = new Map();
  globalThis.document = document;
  globalThis.window = {addEventListener(name, callback) { if (!windowListeners.has(name)) windowListeners.set(name, []);windowListeners.get(name).push(callback); }, scrollTo() {}};
  globalThis.location = {hash, href: 'https://example.com/'+hash};
  globalThis.localStorage = {getItem: key => key === 'pet-community-gallery-activity-v1' && browserActivity !== null ? JSON.stringify(browserActivity) : null, setItem() {}};
  globalThis.fetch = async (url, options = {}) => {
    calls.push(url);
    if (url === '/api/session') return Response.json({available: false, signedIn: false, maxPackageBytes: 0, interactionsAvailable: browserActivity === null, anonymousInteractions: browserActivity === null});
    if (url === '/api/plugins' || url === '/api/pets') return Response.json({items: []});
    if (url === '/api/activity') return Response.json({scope: 'site', items, contributors: {}});
    const like = url.match(/^\/api\/works\/(.+)\/like$/);
    if (like) { const entry = items[like[1]], liked = JSON.parse(options.body).liked;entry.likes += liked ? 1 : -1;entry.liked = liked;return Response.json({scope: 'site', items}); }
    return Response.json({}, {status: 404});
  };
  const fixture = {
    element, calls, items,
    order: () => [...element('#cards').innerHTML.matchAll(/data-work="([^"]+)"/g)].map(match => match[1]),
    async category(value) { await element('.category-bar').fire('click', {closest: () => ({dataset: {category: value}})}); },
    async like(id) { await element('#cards').fire('click', {closest: () => ({dataset: {like: id}})}); },
    async download(id, observeClickStack = () => {}) { const cards = element('#cards'), generation = cards.contentGeneration;const anchor = {dataset: {download: id}, get isConnected() { return cards.contentGeneration === generation; }};const target = {closest: selector => selector === '[data-download]' ? anchor : null};for(const callback of pageListeners.get('click') ?? []) { const result = callback({target});observeClickStack(anchor);await result; }return anchor; },
    async waitFor(check) { const deadline = Date.now()+3500;while(!check()) { assert.ok(Date.now()<deadline, '实际页面未按统计回执更新');await new Promise(resolve=>setTimeout(resolve,10)); } },
    restore() { for(const callback of windowListeners.get('pagehide') ?? []) callback();for(const [key,value] of Object.entries(original))if(value===undefined)delete globalThis[key];else globalThis[key]=value; },
  };
  try {
    await import(new URL('../dist/app.js?fixture='+crypto.randomUUID(), import.meta.url));
    await new Promise(resolve=>setImmediate(resolve));
    await new Promise(resolve=>setImmediate(resolve));
    return fixture;
  } catch(error) { fixture.restore();throw error; }
}

test('实际广场统计首次加载、取消点赞及下载回读重排热门，不重置搜索分类或手动排序', async () => {
  const ids = ['juejin-hawking', 'juejin-yoyo', 'juejin-click'];
  const items = Object.fromEntries(ids.map(id => [id,{likes: 0, downloads: 0, weekly: 0, liked: false}]));
  items[ids[0]] = {...items[ids[0]], likes: 3, downloads: 5};
  items[ids[1]] = {...items[ids[1]], likes: 7, downloads: 1, liked: true};
  items[ids[2]].downloads = 9;
  const fixture = await galleryFixture(items);
  try {
    assert.equal(fixture.element('#sort').value, 'popular');
    assert.equal(fixture.element('#gallery-total').textContent, `共 ${pets.length} 只宠物`);
    await fixture.category('原创角色');
    fixture.element('#search').value='juejin-cn';await fixture.element('#search').fire('input');
    assert.deepEqual(fixture.order(), [ids[2],ids[1],ids[0]]);
    await fixture.like(ids[1]);
    assert.deepEqual(fixture.order(), [ids[2],ids[0],ids[1]]);
    const reads = fixture.calls.filter(url=>url==='/api/activity').length;
    items[ids[1]].downloads = 20;await fixture.download(ids[1]);
    await fixture.waitFor(()=>fixture.order()[0]===ids[1]);
    assert.ok(fixture.calls.filter(url=>url==='/api/activity').length>reads);
    assert.equal(fixture.element('#search').value,'juejin-cn');
    assert.ok(fixture.element('.category-bar').innerHTML.includes('aria-pressed="true" data-category="原创角色"'));
    fixture.element('#sort').value='name';await fixture.element('#sort').fire('change');
    assert.deepEqual(fixture.order(),[ids[2],ids[0],ids[1]]);
    await fixture.like(ids[0]);
    assert.equal(fixture.element('#sort').value,'name');assert.deepEqual(fixture.order(),[ids[2],ids[0],ids[1]]);
  } finally { fixture.restore(); }
});

test('插件广场同样默认热门，下载与赞混合计分，零互动条目仍可加载', async () => {
  const [a,b]=toolPlugins;
  const fixture = await galleryFixture({[a.id]:{likes:0,downloads:12,weekly:0,liked:false},[b.id]:{likes:8,downloads:3,weekly:0,liked:false}},'#plugins');
  try {
    assert.equal(fixture.element('#sort').value,'popular');
    assert.deepEqual(fixture.order().slice(0,2),[a.id,b.id]);
    assert.equal(fixture.order().length,18);assert.equal(fixture.element('#gallery-more').hidden,false);
    await fixture.element('#gallery-more').fire('click');
    assert.equal(fixture.order().length,24);
  } finally { fixture.restore(); }
});

test('本地下载点击调用栈保留原锚点，下一任务重排且不重置筛选与手动排序', async () => {
  const [a,b,c] = ['juejin-hawking','juejin-yoyo','juejin-click'];
  const activity = {[a]:{downloads:1,liked:false,recent:[]},[b]:{downloads:2,liked:false,recent:[]}};
  const fixture = await galleryFixture({},'#pets',activity);
  try {
    await fixture.category('原创角色');fixture.element('#search').value='juejin-cn';await fixture.element('#search').fire('input');
    assert.deepEqual(fixture.order(),[b,a,c]);
    const anchor = await fixture.download(a, anchor => assert.equal(anchor.isConnected,true,'下载默认动作前不得重建卡片、移除锚点'));
    assert.equal(anchor.isConnected,true);assert.deepEqual(fixture.order(),[b,a,c]);
    await fixture.waitFor(()=>fixture.order()[0]===a);
    assert.equal(anchor.isConnected,false);assert.deepEqual(fixture.order(),[a,b,c]);
    assert.equal(fixture.element('#search').value,'juejin-cn');assert.equal(fixture.element('#sort').value,'popular');
    assert.ok(fixture.element('.category-bar').innerHTML.includes('aria-pressed="true" data-category="原创角色"'));
    fixture.element('#sort').value='name';await fixture.element('#sort').fire('change');
    const manualAnchor = await fixture.download(b, anchor => assert.equal(anchor.isConnected,true));
    await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(manualAnchor.isConnected,true);assert.equal(fixture.element('#sort').value,'name');assert.equal(fixture.element('#search').value,'juejin-cn');
    assert.deepEqual(fixture.order(),[c,a,b]);
  } finally { fixture.restore(); }
});
