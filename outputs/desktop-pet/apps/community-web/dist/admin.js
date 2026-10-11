import { createSiteLocale } from './locale.js';
const $ = selector => document.querySelector(selector);
createSiteLocale();
let works = [], busy = false;
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
function status(message) { $('#admin-status').textContent = message; }
async function api(path, method = 'GET', data) {
  const response = await fetch('/api/admin/' + path, { method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', ...(data ? { 'content-type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
  if (response.status === 404) throw new Error('管理员服务尚未配置。');
  let body;
  try { body = await response.json(); } catch { throw new Error('操作失败，请重试。'); }
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') showSession(false);
    throw new Error(body?.error || '操作失败，请重试。');
  }
  return body;
}
function showSession(authenticated) {
  $('#admin-login').hidden = authenticated;
  $('#admin-workspace').hidden = !authenticated;
  $('#admin-logout').hidden = !authenticated;
  if (!authenticated) { works = []; $('#admin-list').replaceChildren(); }
}
function render() {
  const query = $('#admin-search').value.trim().toLocaleLowerCase(), kind = $('#admin-kind').value, state = $('#admin-state').value, category = $('#admin-category-filter').value;
  const selected = works.filter(work => (kind === 'all' || work.kind === kind) && (state === 'all' || work.hidden === (state === 'hidden')) && (!category || work.category === category) && `${work.title} ${work.author} ${work.id}`.toLocaleLowerCase().includes(query));
  $('#admin-count').textContent = `${selected.length} / ${works.length}`;
  $('#admin-list').innerHTML = selected.map(work => `<article class="admin-work" data-id="${escape(work.id)}" data-hidden="${work.hidden}"><img src="${escape(work.thumbnail || 'assets/brand-logo.png')}" alt="" loading="lazy"><div><h2 data-i18n-preserve>${escape(work.title)}</h2><p data-i18n-preserve>${escape(work.author)} · ${escape(work.id)}</p><span>${work.hidden ? '已下架' : '已上架'}</span></div><label>作品分类<input name="category" list="admin-categories" maxlength="40" value="${escape(work.category)}" aria-label="作品分类"></label><div class="admin-work-actions"><button type="button" data-save ${busy ? 'disabled' : ''}>保存分类</button><button type="button" data-toggle ${busy ? 'disabled' : ''}>${work.hidden ? '恢复上架' : '下架作品'}</button></div></article>`).join('');
}
function categories() {
  const selected = $('#admin-category-filter').value;
  const names = [...new Set(works.map(work => work.category))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  $('#admin-categories').innerHTML = names.map(name => `<option value="${escape(name)}"></option>`).join('');
  $('#admin-category-filter').innerHTML = '<option value="">全部分类</option>' + names.map(name => `<option data-i18n-preserve value="${escape(name)}">${escape(name)}</option>`).join('');
  if (names.includes(selected)) $('#admin-category-filter').value = selected;
}
async function refresh() {
  const result = await api('works'); works = result.items; categories(); render();
}
$('#admin-login').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return; busy = true;
  const button = event.currentTarget.querySelector('button'); button.disabled = true;
  const key = $('#admin-key').value; $('#admin-key').value = '';
  try { await api('login', 'POST', { key }); showSession(true); await refresh(); status('已登录，修改后立即同步到全站。'); }
  catch (error) { status(error.message); }
  finally { busy = false; button.disabled = false; }
});
$('#admin-logout').addEventListener('click', async () => {
  try { await api('logout', 'POST', {}); showSession(false); status('已退出管理。'); }
  catch (error) { status(error.message); }
});
$('#admin-refresh').addEventListener('click', async () => {
  if (busy) return;
  try { await refresh(); status('列表已刷新。'); } catch (error) { status(error.message); }
});
for (const id of ['admin-kind', 'admin-state', 'admin-category-filter', 'admin-search']) $('#' + id).addEventListener(id === 'admin-search' ? 'input' : 'change', render);
$('#admin-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-save], [data-toggle]'); if (!button || busy) return;
  const article = button.closest('[data-id]'), work = works.find(item => item.id === article.dataset.id);
  const category = article.querySelector('input').value.trim();
  if (!category || category.length > 40) { status('分类须为 1 至 40 字，且不能含控制字符或 HTML。'); return; }
  busy = true; article.querySelectorAll('button').forEach(item => { item.disabled = true; });
  try {
    const result = await api('works/' + encodeURIComponent(work.id), 'PATCH', { category, hidden: button.hasAttribute('data-toggle') ? !work.hidden : work.hidden, revision: work.revision });
    Object.assign(work, result.item); categories(); status('已保存，访客刷新后可看到最新结果。');
  } catch (error) { status(error.message); }
  finally { busy = false; render(); }
});
try {
  const session = await api('session'); showSession(session.signedIn);
  if (session.signedIn) { await refresh(); status('已登录，修改后立即同步到全站。'); }
  else status('请输入本机保存的管理员密钥。');
} catch (error) { status(error.message); }
