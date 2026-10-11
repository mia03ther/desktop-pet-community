import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { inspectImportPackage, readZipPackage } from '../dist/package-core.js';
import { createSiteLocale, translateUI, localeStorageKey, siteLocales } from '../dist/locale.js';
import { uiMessages, uiTemplates } from '../dist/locale-messages.js';

// 最小 DOM 夹具只提供浏览器节点、事件及变更通知；直接调用生产语言控制器。
function pageFixture() {
  const root = { nodeType: 1, tagName: 'MAIN', childNodes: [], matches: () => false, hasAttribute: () => false, closest: () => null };
  function element(text, { preserve = false, option = false, builtin = false } = {}) {
    const attributes = new Map(), listeners = new Map();
    const node = { nodeType: 1, tagName: option ? 'OPTION' : 'P', childNodes: [], parentElement: root, value: '',
      matches: () => preserve, closest: selector => builtin && selector === '[data-i18n-ui-parameters]' ? node : null,
      hasAttribute: name => attributes.has(name), getAttribute: name => attributes.get(name), setAttribute: (name, value) => attributes.set(name, value),
      addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: (name, callback) => { if (listeners.get(name) === callback) listeners.delete(name); },
      fire: name => listeners.get(name)?.(),
    };
    const content = { nodeType: 3, parentElement: node, nodeValue: text };node.childNodes.push(content);
    Object.defineProperty(node, 'textContent', { get: () => content.nodeValue, set: value => { content.nodeValue = value; } });
    root.childNodes.push(node);return node;
  }
  const title = element('社区排行榜'), total = element('共 316 只宠物'), author = element('安装', {preserve: true}), category = element('动漫角色', {option: true});
  const draft = element('用户的工作日记', {preserve: true});draft.value='我自己的作者与角色设定';
  const picker = element(''); picker.value='zh-CN';
  const titleNode = {};
  const document = { documentElement: { lang: '' }, title: '桌宠广场 · desktop pet',
    querySelector: selector => selector === '#site-locale' ? picker : selector === 'title' ? titleNode : null,
    querySelectorAll: () => [root],
  };
  let callback, disconnected=false;
  class Observer { constructor(value) { callback=value; } observe() {} disconnect() { disconnected=true; } }
  return { document, Observer, title, total, author, draft, category, picker, append: element, notify: async () => { callback(); await Promise.resolve(); }, disconnected: () => disconnected };
}

test('四语词典与模板均有三种译文，整句参数不改署名或任意内容', () => {
  for (const [key, values] of [...Object.entries(uiMessages), ...uiTemplates]) { assert.equal(values.length,3,key);assert.ok(values.every(value => typeof value === 'string' && value.trim()),key); }
  assert.equal(translateUI('共 316 只宠物','en'),'316 pets');
  assert.equal(translateUI('共 316 只宠物','ja'),'ペット 316 件');
  assert.equal(translateUI('共 316 只宠物','ko'),'펫 316개');
  assert.equal(translateUI('作者：下载与点赞','en'),'Author: 下载与点赞');
  assert.equal(translateUI('我想安装桌宠广场里的这个作品','en'),'我想安装桌宠广场里的这个作品');
  assert.equal(translateUI('MIT · 版权所有，下载仅供个人使用','ko'),'MIT · 版权所有，下载仅供个人使用');
  assert.equal(translateUI('请填写作者。','en'),'Please enter Author.');
  assert.equal(translateUI('正在预览：安静陪伴','en',true),'Previewing: quiet company');
  assert.equal(translateUI('正在预览：工作 · 原素材背景','en'),'Previewing: 工作 · Original background');
});

test('实际语言事件切四语，动态路由和API重新写入后维持语言且保留分类原值、署名与输入', async () => {
  const page=pageFixture(), saved=new Map();
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:key=>saved.get(key),setItem:(key,value)=>saved.set(key,value)}});
  assert.equal(page.document.documentElement.lang,'zh-CN');assert.equal(page.title.textContent,'社区排行榜');
  for (const [locale, heading] of [['en','Community rankings'],['ja','コミュニティランキング'],['ko','커뮤니티 순위'],['zh-CN','社区排行榜']]) {
    page.picker.value=locale;page.picker.fire('change');assert.equal(controller.locale,locale);assert.equal(page.title.textContent,heading);assert.equal(saved.get(localeStorageKey),locale);
    page.total.textContent='共 362 只宠物';const fresh=page.append('安装指南');await page.notify();
    assert.equal(page.total.textContent,translateUI('共 362 只宠物',locale));assert.equal(fresh.textContent,translateUI('安装指南',locale));
    assert.equal(page.category.getAttribute('value'),'动漫角色');assert.equal(page.author.textContent,'安装');assert.equal(page.draft.value,'我自己的作者与角色设定');
  }
  controller.dispose();assert.equal(page.disconnected(),true);page.picker.value='en';page.picker.fire('change');assert.equal(controller.locale,'zh-CN');
});

test('语言偏好独立持久恢复，不随浏览器语言改变；未知值与存储方法失败回中文', () => {
  const page=pageFixture();const restored=createSiteLocale({document:page.document,storage:{getItem:()=> 'ko'},Observer:undefined});assert.equal(restored.locale,'ko');restored.dispose();
  for (const storage of [{getItem:()=> 'fr'}, {getItem(){throw new Error('禁止读取');},setItem(){throw new Error('禁止写入');}}]) {
    const current=pageFixture(), controller=createSiteLocale({document:current.document,storage,Observer:undefined});assert.equal(controller.locale,'zh-CN');controller.setLocale('ja');assert.equal(current.title.textContent,'コミュニティランキング');controller.dispose();
  }
  assert.deepEqual(siteLocales,['zh-CN','en','ja','ko']);
});

test('localStorage属性getter被拒也不阻止页面初始化与切换', () => {
  const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('存储属性拒绝访问');}});
  try { const page=pageFixture(),controller=createSiteLocale({document:page.document,Observer:undefined});assert.equal(controller.locale,'zh-CN');controller.setLocale('en');assert.equal(page.title.textContent,'Community rankings');controller.dispose(); }
  finally { if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage; }
});


test('内置动作属性识别自身标记，四语读屏和可见预览一致且自定义动作保留原名', async () => {
  const page=pageFixture(),builtin=page.append('正在预览：向右溜达',{builtin:true}),custom=page.append('正在预览：向右溜达');
  builtin.setAttribute('aria-label','桌宠预览：向右溜达');custom.setAttribute('aria-label','桌宠预览：向右溜达');
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:()=>null}});
  for(const locale of siteLocales){
    controller.setLocale(locale);
    assert.equal(builtin.textContent,translateUI('正在预览：向右溜达',locale,true));
    assert.equal(builtin.getAttribute('aria-label'),translateUI('桌宠预览：向右溜达',locale,true));
    assert.equal(custom.textContent,translateUI('正在预览：向右溜达',locale));
    assert.equal(custom.getAttribute('aria-label'),translateUI('桌宠预览：向右溜达',locale));
    builtin.setAttribute('aria-label','桌宠预览：工作');custom.setAttribute('aria-label','桌宠预览：工作');await page.notify();
    assert.equal(builtin.getAttribute('aria-label'),translateUI('桌宠预览：工作',locale,true));
    assert.equal(custom.getAttribute('aria-label'),translateUI('桌宠预览：工作',locale));
    builtin.setAttribute('aria-label','桌宠预览：向右溜达');custom.setAttribute('aria-label','桌宠预览：向右溜达');await page.notify();
  }
  assert.equal(page.author.textContent,'安装');assert.equal(page.draft.value,'我自己的作者与角色设定');controller.dispose();
});


test('真实插件兼容标题翻译内置声明式格式，未知宿主及原项目说明保持原文', async () => {
  const bytes=new Uint8Array(await readFile(new URL('../dist/assets/community.water-break.zip',import.meta.url)));
  const {report}=inspectImportPackage(await readZipPackage(bytes,inflateRawSync),'plugin');
  assert.equal(report.level,'native');assert.equal(report.format,'SDK 1 · 声明式');
  const page=pageFixture(),heading=page.append(`原生兼容 · ${report.format}`),unknownFormat='上游宿主 SDK · 原说明“声明式”';
  const unknown=page.append(`需原宿主 · ${unknownFormat}`);
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:()=>null}});
  for(const [locale,expected] of [['zh-CN','原生兼容 · SDK 1 · 声明式'],['en','Native compatibility · SDK 1 · Declarative'],['ja','ネイティブ対応 · SDK 1 · 宣言型'],['ko','기본 호환 · SDK 1 · 선언형']]){
    controller.setLocale(locale);assert.equal(heading.textContent,expected);
    assert.equal(unknown.textContent,`${translateUI('需原宿主',locale)} · ${unknownFormat}`);
    heading.textContent=`原生兼容 · ${report.format}`;await page.notify();assert.equal(heading.textContent,expected);
  }
  controller.dispose();
});
