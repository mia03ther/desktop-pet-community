const header = document.querySelector('.site-header');
const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost'; button.textContent = '登录';
header?.insertBefore(button, document.querySelector('#theme-toggle'));
const dialog = document.createElement('dialog'); dialog.setAttribute('aria-label', '共创平台账号');
dialog.innerHTML = `<form method="dialog" style="width:min(360px,80vw);display:grid;gap:14px;padding:12px"><div style="display:flex;justify-content:space-between;align-items:center"><strong>共创平台账号</strong><button type="button" data-close aria-label="关闭">×</button></div><label>用户名<input name="username" autocomplete="username" required maxlength="32"></label><label>密码<input name="password" type="password" autocomplete="current-password" required minlength="12" maxlength="128"></label><p data-message role="status"></p><div style="display:flex;gap:12px"><button type="button" data-login>登录</button><button type="button" data-register>注册</button></div><p style="font-size:13px">密码至少 12 位。登录后可以发布作品和点赞。</p></form>`;
document.body.append(dialog);
const message = dialog.querySelector('[data-message]');
let currentUser = null;
async function session() {
  try { const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' }); if (!response.ok) return; const data = await response.json(); currentUser = data.user || null; button.textContent = currentUser ? `${currentUser.username} · 退出` : '登录'; }
  catch { button.textContent = '登录'; }
}
function openAccount() { message.textContent = ''; if (!dialog.open) dialog.showModal(); }
document.addEventListener('click', event => {
  if (!event.target.closest?.('#plugin-signin, #request-signin')) return;
  event.preventDefault(); event.stopImmediatePropagation(); openAccount();
}, true);
function accountChanged() { document.dispatchEvent(new Event('community-account-changed')); }
async function account(action) {
  const form = dialog.querySelector('form'), username = form.elements.username.value, password = form.elements.password.value;
  if (!form.reportValidity()) return;
  const buttons = dialog.querySelectorAll('button'); buttons.forEach(item => { item.disabled = true; }); message.textContent = '正在提交…';
  try {
    const response = await fetch(`/api/auth/${action}`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || '操作未完成，请重试。');
    form.elements.password.value = ''; await session(); dialog.close(); accountChanged();
  } catch (error) { message.textContent = error.message || '连接未完成，请稍后重试。'; }
  finally { buttons.forEach(item => { item.disabled = false; }); }
}
button.addEventListener('click', async () => {
  if (!currentUser) { openAccount(); return; }
  try { const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); if (!response.ok) throw new Error(); await session(); accountChanged(); }
  catch { button.textContent = '退出失败，点击重试'; }
});
dialog.querySelector('[data-login]').addEventListener('click', () => void account('login'));
dialog.querySelector('[data-register]').addEventListener('click', () => void account('register'));
dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
dialog.querySelector('form').addEventListener('submit', event => { event.preventDefault(); void account('login'); });
void session();
