import { uiMessages, uiTemplates, builtinCategoryNames } from './locale-messages.js';
export { builtinCategoryNames } from './locale-messages.js';
export const siteLocales = ['zh-CN', 'en', 'ja', 'ko'];
export const localeStorageKey = 'pet-community-locale';
const normalize = text => text.replace(/\s+/g, ' ').trim();
const literal = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = uiTemplates.map(([source, values]) => {
  const parameters = []; let previous = 0; let expression = '^';
  for (const match of source.matchAll(/\{(\d+)\}/g)) { expression += literal(source.slice(previous, match.index)) + '(.+?)'; parameters.push(Number(match[1])); previous = match.index + match[0].length; }
  return { source, values, parameters, expression: new RegExp(expression + literal(source.slice(previous)) + '$') };
}).sort((a, b) => b.source.replace(/\{\d+\}/g, '').length - a.source.replace(/\{\d+\}/g, '').length);
export function translateUI(text, locale = 'zh-CN', builtinParameters = false, attribute = '') {
  if (!siteLocales.includes(locale) || locale === 'zh-CN' || typeof text !== 'string') return text;
  const key = normalize(text); if (builtinCategoryNames.includes(key) && !builtinParameters) return text; const index = siteLocales.indexOf(locale) - 1;
  let translated = attribute === 'alt' && !builtinParameters ? undefined : uiMessages[key]?.[index];
  if (!translated) for (const entry of templates) {
    // 图片后缀模板单独限定，避免原标题“安装”与安装按钮模板发生碰撞。
    if (attribute === 'alt' && !['{0} 预览', '{0} 封面'].includes(entry.source)) continue;
    const match = entry.expression.exec(key); if (!match) continue;
    const values = Object.fromEntries(entry.parameters.map((id, offset) => [id, match[offset + 1]]));
    if (builtinParameters && (entry.source === '正在预览：{0}' || entry.source === '桌宠预览：{0}')) values[0] = translateUI(values[0], locale);
    // 只翻译内置界面参数；署名、角色名、文件路径始终是原值。
    if (entry.source === '绑定预览：{0} → {1}' || entry.source === '{0}° · {1}' || entry.source === '请填写{0}。' || entry.source === '{0}格式无效或超过 {1} 字。' || entry.source === '公开作品的{0}格式无效。') values[0] = uiMessages[values[0]]?.[index] ?? values[0];
    if (entry.source === '{0}° · {1}' || entry.source === '注视 {0}° · {1}') values[1] = uiMessages[values[1]]?.[index] ?? values[1];
    if (entry.source === '作者：{0} · V{1} · {2}' && (builtinParameters || !builtinCategoryNames.includes(values[2]))) values[2] = uiMessages[values[2]]?.[index] ?? values[2];
    if (entry.source === '未确认发布：{0}。分享 ZIP 已生成，可先下载保留。') values[0] = translateUI(values[0], locale);
    if (entry.source === '完整 ZIP 与保存链接已生成。请在本站投稿表单附上「{0}」并提交，审核收录后才会上线。{1}') values[1] = translateUI(values[1], locale);
    if (['未确认发布：{0}', '封面未更新：{0}', '草稿未保存：{0}。请下载分享包保留作品。'].includes(entry.source)) values[0] = translateUI(values[0], locale);
    if (['原生兼容 · {0}', '部分支持 · {0}', '需原宿主 · {0}', '无法识别或直接兼容 · {0}', '不支持：{0}'].includes(entry.source)) values[0] = values[0].split('、').map(value => uiMessages[value]?.[index] ?? value).join(', ');
    translated = entry.values[index].replace(/\{(\d+)\}/g, (_, id) => values[id]); break;
  }
  if (!translated) return text;
  return text.match(/^\s*/)[0] + translated + text.match(/\s*$/)[0];
}

const preserve = '[data-i18n-preserve], .creator-media-preview, [data-public-media], script, style, .work-card h2, .work-card .description, .byline a, .home-pet-card span, .community-rank-work span, .ranking-identity strong, .ranking-handle, #contributor-name, #contributor-handle, .community-collection-title-row h3, .community-collection-description, #collection-detail-title, #collection-detail-description, .community-request-title, .community-request-description, #detail-description, #tool-detail-title, #public-pet-title, #pet-package-list, #plugin-package-list, [data-state] option:not([value=""]), [data-public-action] option, #site-locale option';
const roots = '.site-header, #main, body > footer, dialog, #toast, [data-save-link]';
export function createSiteLocale({ document: page = globalThis.document, storage, Observer = globalThis.MutationObserver } = {}) {
  let locale = 'zh-CN'; try { storage ??= globalThis.localStorage; const saved = storage?.getItem(localeStorageKey); if (siteLocales.includes(saved)) locale = saved; } catch {}
  const originals = new WeakMap(); let pending = false, disposed = false;
  const picker = page.querySelector('#site-locale');
  function changeValue(owner, attribute, current, set) {
    let record = originals.get(owner); if (!record) { record = new Map(); originals.set(owner, record); }
    let entry = record.get(attribute); if (!entry || current !== entry.display) { entry = { source: current, display: current }; record.set(attribute, entry); }
    const next = translateUI(entry.source, locale, Boolean((owner.nodeType === 3 ? owner.parentElement : owner).closest?.('[data-i18n-ui-parameters]')), attribute); entry.display = next; if (next !== current) set(next);
  }
  function walk(node) {
    if (node.nodeType === 3) { if (!node.parentElement?.closest(preserve)) changeValue(node, 'text', node.nodeValue, value => { node.nodeValue = value; }); return; }
    if (node.nodeType !== 1 || node.matches?.(preserve)) return;
    // option的隐式值来自文字；翻译前固定原值，保持分类和表单契约。
    if (node.tagName === 'OPTION' && !node.hasAttribute('value')) node.setAttribute('value', node.textContent);
    for (const attribute of ['title', 'aria-label', 'placeholder', 'alt']) if (node.hasAttribute(attribute)) changeValue(node, attribute, node.getAttribute(attribute), value => node.setAttribute(attribute, value));
    // 文本框只翻译已知界面属性，正文与用户输入始终保留原值。
    if (node.tagName === 'TEXTAREA') return;
    for (const child of node.childNodes) walk(child);
  }
  function apply() {
    if (disposed) return;
    page.documentElement.lang = locale; if (picker) picker.value = locale;
    page.querySelectorAll(roots).forEach(walk);
    if (page.querySelector('title')) changeValue(page.querySelector('title'), 'title-text', page.title, value => { page.title = value; });
  }
  function schedule() { if (pending || disposed) return; pending = true; queueMicrotask(() => { pending = false; apply(); }); }
  function setLocale(value) { locale = siteLocales.includes(value) ? value : 'zh-CN'; try { storage?.setItem(localeStorageKey, locale); } catch {} apply(); }
  const onChange = () => setLocale(picker.value); picker?.addEventListener('change', onChange);
  const observer = Observer ? new Observer(schedule) : null;
  observer?.observe(page.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder', 'alt'] });
  apply();
  return { get locale() { return locale; }, setLocale, refresh: apply, dispose() { disposed = true; observer?.disconnect(); picker?.removeEventListener?.('change', onChange); } };
}
