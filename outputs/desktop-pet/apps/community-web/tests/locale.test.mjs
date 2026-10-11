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
  function element(text, { preserve = false, option = false, builtin = false, tag = 'P' } = {}) {
    const attributes = new Map(), listeners = new Map();
    const node = { nodeType: 1, tagName: option ? 'OPTION' : tag, childNodes: [], parentElement: root, value: '',
      matches: selector => preserve || tag === 'TEXTAREA' && selector.includes('textarea'), closest: selector => builtin && selector === '[data-i18n-ui-parameters]' ? node : null,
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


test('四入口表单已知属性四语翻译，文本框正文和所有输入值及未知提示保持原文', async () => {
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),page=pageFixture(),fields=[];
  const body='安装 · 社区排行榜 · 用户自己的署名与工作';
  for(const match of html.matchAll(/<(input|textarea)\b([^>]+)>/g)){
    const attrs=[...match[2].matchAll(/(placeholder|title|aria-label)="([^"]*)"/g)];if(!attrs.length)continue;
    const tag=match[1].toUpperCase(),node=page.append(tag==='TEXTAREA'?body:'',{tag});node.value=body;
    for(const [,name,value] of attrs)node.setAttribute(name,value);
    fields.push({node,attrs,tag});
  }
  const ariaField=page.append(body,{tag:'TEXTAREA'});ariaField.value=body;const ariaAttrs=[['','title','安装指南'],['','aria-label','作品类型']];for(const [,name,value] of ariaAttrs)ariaField.setAttribute(name,value);fields.push({node:ariaField,attrs:ariaAttrs,tag:'TEXTAREA'});
  assert.ok(fields.some(field=>field.tag==='TEXTAREA'));assert.ok(fields.some(field=>field.tag==='INPUT'));
  const unknown=page.append(body,{tag:'TEXTAREA'}),protectedArea=page.append(body,{tag:'TEXTAREA',preserve:true});
  for(const node of [unknown,protectedArea])node.setAttribute('placeholder',node===unknown?'原项目的提示：安装':'它是什么样的伙伴？');
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:()=>null}});
  for(const locale of siteLocales){
    controller.setLocale(locale);
    for(const {node,attrs,tag} of fields){
      for(const [,name,value] of attrs){assert.equal(node.getAttribute(name),translateUI(value,locale),`${tag} ${name}: ${value}`);if(locale!=='zh-CN'&&/[\u4e00-\u9fff]/.test(value))assert.notEqual(node.getAttribute(name),value,value);}
      assert.equal(node.value,body);if(tag==='TEXTAREA')assert.equal(node.textContent,body);
    }
    assert.equal(unknown.getAttribute('placeholder'),'原项目的提示：安装');assert.equal(unknown.textContent,body);
    assert.equal(protectedArea.getAttribute('placeholder'),'它是什么样的伙伴？');assert.equal(protectedArea.textContent,body);
    const textarea=fields.find(field=>field.tag==='TEXTAREA').node;textarea.textContent='用户后来写的安装和社区排行榜';textarea.value=textarea.textContent;await page.notify();
    assert.equal(textarea.textContent,'用户后来写的安装和社区排行榜');assert.equal(textarea.value,'用户后来写的安装和社区排行榜');textarea.textContent=body;textarea.value=body;
  }
  controller.dispose();
});


test('图片读屏只翻译已知界面整句，捕获原标题和自定义媒体保留原文', async () => {
  const page=pageFixture(),preview=page.append('',{tag:'IMG'}),cover=page.append('',{tag:'IMG'}),unknown=page.append('',{tag:'IMG'}),custom=page.append('',{tag:'IMG',preserve:true});
  preview.setAttribute('alt','安装 预览');cover.setAttribute('alt','工作 封面');unknown.setAttribute('alt','原作者的下载画作');custom.setAttribute('alt','工作 封面');
  const staticAlt=page.append('',{tag:'IMG',builtin:true}),unmarkedAlt=page.append('',{tag:'IMG'});staticAlt.setAttribute('alt','参考外观');unmarkedAlt.setAttribute('alt','参考外观');
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:()=>null}});
  for(const [locale,previewText,coverText] of [['zh-CN','安装 预览','工作 封面'],['en','安装 preview','工作 cover'],['ja','安装 のプレビュー','工作 の表紙'],['ko','安装 미리 보기','工作 표지']]){
    controller.setLocale(locale);assert.equal(preview.getAttribute('alt'),previewText);assert.equal(cover.getAttribute('alt'),coverText);
    assert.equal(unknown.getAttribute('alt'),'原作者的下载画作');assert.equal(custom.getAttribute('alt'),'工作 封面');
    assert.equal(staticAlt.getAttribute('alt'),translateUI('参考外观',locale));assert.equal(unmarkedAlt.getAttribute('alt'),'参考外观');
    preview.setAttribute('alt','社区排行榜 预览');await page.notify();assert.equal(preview.getAttribute('alt'),translateUI('社区排行榜 预览',locale,false,'alt'));
    assert.ok(preview.getAttribute('alt').includes('社区排行榜'));preview.setAttribute('alt','安装 预览');await page.notify();
  }
  controller.dispose();
});


test('实际带空格下载菜单四语完整翻译，不改变指定作品名称', () => {
  const page=pageFixture(),pet=page.append('下载 桌宠 ZIP'),plugin=page.append('下载 插件 ZIP'),custom=page.append('下载 桌宠 ZIP',{preserve:true});
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:()=>null}});
  for(const [locale,petText,pluginText] of [['zh-CN','下载 桌宠 ZIP','下载 插件 ZIP'],['en','Download pet ZIP','Download plugin ZIP'],['ja','ペットZIPをダウンロード','プラグインZIPをダウンロード'],['ko','펫 ZIP 다운로드','플러그인 ZIP 다운로드']]){
    controller.setLocale(locale);assert.equal(pet.textContent,petText);assert.equal(plugin.textContent,pluginText);assert.equal(custom.textContent,'下载 桌宠 ZIP');
  }
  controller.dispose();
});

test('内置分类以标记翻译，原始分类值及同名用户自定义分类保持原文', async () => {
  const page=pageFixture(),names=['机器人伙伴','原创伙伴','可选工具','健康提醒','专注陪伴','提醒与计时','身心陪伴','生活陪伴','资源与工具','学习与效率'];
  const fields=names.map(name=>{const builtin=page.append(name,{builtin:true}),custom=page.append(name);builtin.setAttribute('data-category',name);return{name,builtin,custom};});
  const controller=createSiteLocale({document:page.document,Observer:page.Observer,storage:{getItem:()=>null}});
  for(const locale of siteLocales){
    controller.setLocale(locale);
    for(const{name,builtin,custom}of fields){assert.equal(custom.textContent,name);assert.equal(builtin.getAttribute('data-category'),name);if(locale!=='zh-CN'){assert.notEqual(builtin.textContent,name);assert.equal(builtin.textContent,translateUI(name,locale,true));}else assert.equal(builtin.textContent,name);builtin.textContent=name;}
    await page.notify();for(const{name,builtin}of fields)assert.equal(builtin.textContent,translateUI(name,locale,true));
  }
  controller.dispose();
});
