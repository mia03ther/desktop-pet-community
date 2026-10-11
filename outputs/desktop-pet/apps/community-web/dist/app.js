import { attribution, petManifest, zipPackage, safePackagePath, readZipPackage, normalizePackageFiles, inspectImportPackage, videoPetManifest, coverImageType, prepareWorkPackage, creationImageChecks, packageWorkFields, petStateIds, packageImportLimits } from './package-core.js';
import { actions, templates, templateCredit, pets, petDisplayAuthor, toolPlugins, projectAuthor, projectAuthorUrl } from './catalog.js';
import { contributorHref } from './community-core.js';
import { sourcePlugins } from './plugin-catalog.js';
import { pluginCovers } from './plugin-covers.js';
import { createCommunityPages } from './community-pages.js';
import { createPluginPublicationClient, configuredSubmissionRepository, githubSubmissionUrl } from './publication-client.js';
import { publicSiteUrl, submissionRepository } from './publication-config.js';

const $ = selector => document.querySelector(selector);
const works = [...pets, ...toolPlugins, ...sourcePlugins, ...templates.map(item => ({ ...item, kind: 'plugin', author: templateCredit.author, download: `assets/${item.id}.zip` }))].map(item => ({ ...item, ...(item.kind === 'plugin' ? { cover: pluginCovers[item.id] ?? item.cover ?? item.presentation?.cover } : {}), ...(item.author === projectAuthor ? { authorHandle: projectAuthor, authorUrl: projectAuthorUrl } : {}) }));
const pluginWorks = works.filter(item => item.kind === 'plugin');
const petWorks = works.filter(item => item.kind === 'pet');
const publication = createPluginPublicationClient();
let publicationSession = null;
let publicationBusy = false;
let publicListLoaded = false;
let sharedActivity = null;
let sharedContributorFollowers = null;
let activitySnapshotAt = new Date().toISOString();
const likePending = new Set();
const galleryCategories = ['游戏角色', '动漫角色', '吉祥物', '其他', '机器人', '原创角色', '人物头像', '动物伙伴', '幻想生物', '网络梗图', '物件与道具'];
const galleryPageSize = 18;
const activityKey = 'pet-community-gallery-activity-v1';
const themeKey = 'pet-community-theme';
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
let storageAvailable = true;
let galleryActivity = readGalleryActivity();
let shuffledIds = shuffle(works.map(item => item.id));
let visibleLimit = galleryPageSize;
let detailWork;
let route = 'pets';
let category = '全部';
let selectedAtlas;
let atlasGeneration = 0;
let activeAnimations = [];
let toastTimer;
let packageUrl;
const lookDirections = { 0: '向上', 4: '向右', 8: '向下', 12: '向左' };

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function icon(name) {
  const paths = {
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
  };
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function shuffle(ids) {
  const result = [...ids];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function readGalleryActivity() {
  try {
    const input = JSON.parse(localStorage.getItem(activityKey) ?? '{}');
    const result = {};
    for (const item of works) {
      const entry = input?.[item.id];
      if (!entry || typeof entry !== 'object') continue;
      result[item.id] = {
        liked: entry.liked === true,
        downloads: Number.isSafeInteger(entry.downloads) && entry.downloads >= 0 ? entry.downloads : 0,
        recent: Array.isArray(entry.recent) ? entry.recent.filter(time => Number.isFinite(time) && time > Date.now() - weekMilliseconds && time <= Date.now()).slice(-2000) : [],
      };
    }
    return result;
  } catch {
    storageAvailable = false;
    return {};
  }
}

function activityFor(id) {
  if (publicationSession?.interactionsAvailable) return sharedActivity?.[id] ?? { liked: false, likes: 0, downloads: 0, weekly: 0, scope: 'site', recent: [] };
  return galleryActivity[id] ?? { liked: false, downloads: 0, recent: [] };
}

async function recordActivity(id, kind) {
  if (publicationSession?.interactionsAvailable) {
    if (kind !== 'like' || likePending.has(id)) return;
    if (!publicationSession.anonymousInteractions && !publicationSession.signedIn) { toast('互动服务暂不可用。'); return; }
    if (!sharedActivity) { toast('公共统计暂不可用，请刷新后重试。'); return; }
    likePending.add(id);
    try { sharedActivity = await publication.like(id, !activityFor(id).liked); activitySnapshotAt = new Date().toISOString(); updateActivityDisplay(id); communityPages.refresh(); }
    catch (error) { toast(error.message); }
    finally { likePending.delete(id); }
    return;
  }
  const entry = activityFor(id);
  const now = Date.now();
  if (kind === 'like') entry.liked = !entry.liked;
  else entry.downloads++;
  entry.recent = entry.recent.filter(time => time > now - weekMilliseconds);
  if (kind === 'download' || entry.liked) entry.recent.push(now);
  entry.recent = entry.recent.slice(-2000);
  galleryActivity[id] = entry;
  activitySnapshotAt = new Date().toISOString();
  try {
    localStorage.setItem(activityKey, JSON.stringify(galleryActivity));
  } catch {
    storageAvailable = false;
  }
  updateActivityDisplay(id);
  communityPages.refresh();
}

function updateActivityDisplay(id) {
  const entry = activityFor(id);
  document.querySelectorAll('[data-like]').forEach(button => {
    if (button.dataset.like !== id) return;
    button.setAttribute('aria-pressed', String(entry.liked));
    button.setAttribute('aria-label', `${entry.liked ? '取消点赞' : '点赞'}${entry.scope === 'site' ? '' : ' · 仅此浏览器'}`);
    button.innerHTML = `${icon('heart')}<span>${entry.likes ?? Number(entry.liked)}</span>`;
  });
  document.querySelectorAll('[data-download-count]').forEach(counter => {
    if (counter.dataset.downloadCount !== id) return;
    counter.innerHTML = `${icon('download')}<span>${entry.downloads}</span>`;
    counter.title = entry.scope === 'site' ? '全站下载，同一匿名来源每日去重' : `此浏览器发起 ${entry.downloads} 次下载`;
  });
  $('#gallery-status').textContent = publicationSession?.interactionsAvailable ? sharedActivity ? '全站点赞与下载 · 同一匿名来源每天去重' : '公共统计暂不可用，请刷新重试' : storageAvailable ? '点赞与下载次数记录于此浏览器 · 近期趋势为近 7 日互动' : '浏览器未允许保存，点赞与下载次数仅在当前页面保留';
}

function filteredWorks() {
  const kind = route === 'plugins' ? 'plugin' : 'pet';
  const query = $('#search').value.trim().toLocaleLowerCase();
  const matches = works.filter(item => item.kind === kind && (category === '全部' || item.category === category)
    && `${item.title} ${item.author} ${item.description} ${item.category} ${(item.tags ?? []).join(' ')}`.toLocaleLowerCase().includes(query));
  const order = $('#sort').value;
  return matches.sort((a, b) => {
    if (order === 'name') return a.title.localeCompare(b.title, 'zh-CN');
    if (order === 'downloads') return activityFor(b.id).downloads - activityFor(a.id).downloads;
    if (order === 'likes') return (activityFor(b.id).likes ?? Number(activityFor(b.id).liked)) - (activityFor(a.id).likes ?? Number(activityFor(a.id).liked));
    if (order === 'trending') {
      const since = Date.now() - weekMilliseconds;
      return (activityFor(b.id).weekly ?? activityFor(b.id).recent.filter(time => time > since).length) - (activityFor(a.id).weekly ?? activityFor(a.id).recent.filter(time => time > since).length);
    }
    return shuffledIds.indexOf(a.id) - shuffledIds.indexOf(b.id);
  });
}

function renderCard(item, previewOnly = false) {
  const pet = item.kind === 'pet';
  const entry = activityFor(item.id);
  const author = escapeHtml(pet ? petDisplayAuthor(item) : item.author);
  const preview = pet
    ? `<a href="#pets/${item.id}" class="card-preview" data-preview="${item.id}" aria-label="查看 ${escapeHtml(item.title)}"><img src="${escapeHtml(item.thumbnail)}" alt="${escapeHtml(item.title)} 预览" loading="lazy" width="192" height="208"></a>`
    : item.cover || item.presentation?.cover ? `<img class="plugin-cover" src="${escapeHtml(item.cover || item.presentation.cover)}" alt="${escapeHtml(item.title)} 封面" loading="lazy">` : `<span class="plugin-symbol" aria-hidden="true">${escapeHtml(item.symbol || '✦')}</span>`;
  const previewHref = pet ? `#pets/${item.id}` : `#plugins/${item.id}`;
  return `<article class="work-card" data-work="${item.id}">
    <div class="card-stage ${pet ? '' : 'plugin-stage'}">
      ${preview}
      ${previewOnly ? '' : `<button type="button" class="stat-pill like-button" data-like="${item.id}" aria-pressed="${entry.liked}" aria-label="${entry.liked ? '取消点赞' : '点赞'}">${icon('heart')}<span>${entry.likes ?? Number(entry.liked)}</span></button><span class="stat-pill download-count" data-download-count="${item.id}" title="${entry.scope === 'site' ? '全站下载，每日去重' : '此浏览器发起下载'}">${icon('download')}<span>${entry.downloads}</span></span>`}
    </div>
    <div class="card-body">
      <div class="card-title-row"><h2>${previewOnly ? escapeHtml(item.title) : `<a href="${previewHref}" data-preview="${item.id}">${escapeHtml(item.title)}</a>`}</h2><span class="category-pill">${escapeHtml(item.category)}</span></div>
      <p class="byline">${item.authorRole === 'maintainer' ? '维护者' : '作者'} <a href="${escapeHtml(contributorHref(item.author, pet ? 'pets' : 'plugins'))}">${author}</a></p>
      <p class="description" title="${escapeHtml(item.description)}">${escapeHtml(item.description)}</p>
      ${previewOnly ? '<p class="hint">卡片预览，发布结果以下方反馈为准</p>' : `<div class="card-actions">
        <a class="button secondary" href="${previewHref}" data-preview="${item.id}">${pet ? '查看' : '查看功能'}</a>
        <details class="install-menu"><summary aria-label="安装 ${escapeHtml(item.title)}">${icon('download')}安装 ${icon('chevron')}</summary><div class="card-menu">
          <a href="${escapeHtml(item.download)}" download="${item.distribution === 'standalone' ? '' : escapeHtml(item.id) + '.zip'}" data-download="${item.id}">${escapeHtml(item.downloadLabel || `下载 ${pet ? '桌宠' : '插件'} ZIP`)}</a>
          <button type="button" data-install-help="${item.id}">复制给 AI 的安装说明</button>
          <a href="#guide">阅读安装指南</a>
        </div></details>
        <details class="share-menu"><summary aria-label="分享 ${escapeHtml(item.title)}">${icon('share')}</summary><div class="card-menu">
          <button type="button" data-share="${item.id}">复制作品链接</button>
        </div></details>
      </div>`}
    </div>
  </article>`;
}

function animateSprite(element, action, version = 2) {
  const [, row, frames, duration] = action;
  const width = element.classList.contains('large') ? 192 : 144;
  const height = width * 208 / 192;
  element.getAnimations().forEach(animation => animation.cancel());
  element.style.backgroundSize = `${width * 8}px ${height * (version === 2 ? 11 : 9)}px`;
  element.style.backgroundPosition = `0px ${-row * height}px`;
  element.style.animation = 'none';
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const animation = element.animate([
      { backgroundPositionX: '0px' }, { backgroundPositionX: `${-frames * width}px` },
    ], { duration, iterations: Infinity, easing: `steps(${frames})` });
    activeAnimations = activeAnimations.filter(item => item.playState !== 'idle');
    activeAnimations.push(animation);
  }
}

function updatePreview(prefix, mode, index) {
  const sprite = $(`#${prefix}-pet-stage .sprite`);
  if (!sprite || (prefix === 'creator' && !selectedAtlas)) return;
  const version = prefix === 'creator' ? selectedAtlas.version : detailWork?.version ?? 2;
  let label;
  if (mode === 'look') {
    if (version !== 2) return;
    $(`#${prefix}-action`).value = '';
    sprite.getAnimations().forEach(animation => animation.cancel());
    const width = sprite.classList.contains('large') ? 192 : 144;
    const height = width * 208 / 192;
    sprite.style.backgroundSize = `${width * 8}px ${height * 11}px`;
    sprite.style.backgroundPosition = `${-(index % 8) * width}px ${-(9 + Math.floor(index / 8)) * height}px`;
    label = `注视 ${index * 22.5}°${lookDirections[index] ? ` · ${lookDirections[index]}` : ''}`;
  } else {
    $(`#${prefix}-action`).value = String(index);
    animateSprite(sprite, actions[index], version);
    label = actions[index][0];
  }
  $(`#${prefix}-action-buttons`).querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(mode === 'action' && Number(button.dataset.previewAction) === index));
  });
  $(`#${prefix}-look-buttons`).querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(mode === 'look' && Number(button.dataset.previewLook) === index));
  });
  $(`#${prefix}-current-preview`).textContent = `正在预览：${label}`;
  sprite.setAttribute('aria-label', `桌宠预览：${label}`);
}

function updateCreatorControls() {
  $('#creator-action').disabled = !selectedAtlas;
  $('#creator-action-buttons').querySelectorAll('button').forEach(button => { button.disabled = !selectedAtlas; });
  $('#creator-look-section').hidden = selectedAtlas?.version !== 2;
  if (!selectedAtlas) $('#creator-current-preview').textContent = '选择图集后即可预览';
}

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 6000);
}

function download(blob, name) {
  if (packageUrl) URL.revokeObjectURL(packageUrl);
  packageUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = packageUrl;
  anchor.download = name;
  anchor.className = 'button secondary';
  anchor.textContent = `保存 ${name}`;
  let result = document.querySelector('#download-result');
  if (!result) {
    result = document.createElement('div');
    result.id = 'download-result';
    result.className = 'download-result';
  }
  result.replaceChildren(anchor);
  const destination = $('#pet-detail').open ? $('#pet-detail') : route === 'create' ? $('#creator-feedback').parentElement : route === 'requests' ? $('#request-feedback').parentElement : $('#result-count').parentElement;
  destination.append(result);
  anchor.click();
}

function renderGallery() {
  activeAnimations.forEach(animation => animation.cancel());
  activeAnimations = [];
  const kind = route === 'plugins' ? 'plugin' : 'pet';
  $('#search').placeholder = kind === 'plugin' ? '搜索插件、作者、标签…' : '搜索桌宠、作者、标签…';
  $('#search').setAttribute('aria-label', kind === 'plugin' ? '搜索插件' : '搜索桌宠');
  const all = works.filter(item => item.kind === kind);
  const matches = filteredWorks();
  const displayed = matches.slice(0, visibleLimit);
  $('#gallery-title').textContent = kind === 'pet' ? '桌宠广场' : '插件广场';
  $('#catalog-title').textContent = kind === 'pet' ? '桌宠作品' : '插件作品';
  $('#gallery-total').textContent = kind === 'pet' ? `共 ${all.length} 只宠物` : `共 ${all.length} 个插件`;
  const categories = ['全部', ...(kind === 'pet' ? galleryCategories : new Set(all.map(item => item.category)))];
  $('.category-bar').innerHTML = categories.map(item => {
    const count = all.filter(work => item === '全部' || work.category === item).length;
    return `<button type="button" aria-pressed="${item === category}" data-category="${escapeHtml(item)}">${item === '全部' ? '全部分类' : escapeHtml(item)}${item === '全部' ? '' : `<span>${count}</span>`}</button>`;
  }).join('');
  $('#result-count').textContent = `已展示 ${displayed.length}${kind === 'pet' ? ' 只宠物' : ' 个插件'}${matches.length === all.length ? '' : ` · 匹配 ${matches.length} 个作品`}`;
  $('#cards').innerHTML = displayed.map(item => renderCard(item)).join('');
  $('#empty').hidden = matches.length > 0;
  $('#gallery-more').hidden = visibleLimit >= matches.length;
  $('#gallery-more').textContent = `加载更多（剩余 ${Math.max(0, matches.length - visibleLimit)}）`;
  updateActivityDisplay('');
}

function renderRoute() {
  const [value, id, contributor] = location.hash.slice(1).split('/');
  const previous = route;
  route = ['pets', 'plugins', 'create', 'guide', 'rankings', 'requests', 'collections', 'contributors'].includes(value) ? value : 'pets';
  if (route !== previous) {
    category = '全部';
    visibleLimit = galleryPageSize;
    $('#search').value = '';
    window.scrollTo(0, 0);
  }
  if (route !== 'pets' || !id) $('#pet-detail').close();
  if (route !== 'pets' || !id) $('#public-pet-detail')?.close();
  if (route !== 'plugins' || !id) $('#tool-detail')?.close();
  $('#community-home').hidden = route !== 'pets';
  $('#plugin-rankings').hidden = route !== 'plugins';
  $('#gallery-view').hidden = !['pets', 'plugins'].includes(route);
  $('#create-view').hidden = route !== 'create';
  if (route === 'create') showCreator(id);
  if (route !== 'create') { $('#creator-pet-stage video')?.pause(); clearImportPreview(); }
  $('#guide-view').hidden = route !== 'guide';
  for (const name of ['rankings', 'requests', 'collections', 'contributors']) $(`#${name}-view`).hidden = route !== name;
  document.querySelectorAll('[data-route]').forEach(link => {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if ((route === 'pets' || route === 'plugins') && (!id || previous !== route || !$('#cards').hasChildNodes())) renderGallery();
  communityPages.render(route, id, contributor);
  const titles = { pets: '桌宠广场', plugins: '插件广场', create: '共创工作台', guide: '安装指南', rankings: '社区排行榜', requests: '制作需求广场', collections: '精选合集', contributors: '社区创作者' };
  document.title = `${titles[route]} · desktop pet`;
  if (route === 'pets' && id) {
    const work = petWorks.find(item => item.id === id);
    if (work) openPetDetail(work);
    else if (!id.startsWith('community-') || publicListLoaded) toast('此作品不存在，请从广场重新选择。');
  }
  if (route === 'plugins' && id) {
    const tool = works.filter(item => item.kind === 'plugin').find(item => item.id === id);
    if (tool) openPluginCreator(tool);
    else if (!id.startsWith('community-') || publicListLoaded) toast('此工具不存在，请从插件广场重新选择。');
  }
}

function openToolDetail(tool) {
  let dialog = $('#tool-detail');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'tool-detail';
    dialog.setAttribute('aria-labelledby', 'tool-detail-title');
    dialog.addEventListener('close', () => {
      if (location.hash.startsWith('#plugins/')) history.replaceState(null, '', '#plugins');
    });
    document.body.append(dialog);
  }
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="tool-detail-title">${escapeHtml(tool.title)}</h2><button type="button" class="secondary" aria-label="关闭工具详情">关闭</button></div>
    ${tool.cover || tool.presentation?.cover ? `<div class="card-stage"><img class="plugin-cover" src="${escapeHtml(tool.cover || tool.presentation.cover)}" alt="${escapeHtml(tool.title)} 封面"></div>` : ''}
    <p>${escapeHtml(tool.description)}</p>
    ${tool.features.length ? `<h3>提供的功能</h3><ul>${tool.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>` : ''}
    ${tool.hostNotice ? `<p>${escapeHtml(tool.hostNotice)}</p>` : ''}
    <p>作者：${escapeHtml(tool.author)}${tool.version ? ` · V${escapeHtml(tool.version)}` : ''}<br>许可：${escapeHtml(tool.license)}</p>
    <div class="dialog-actions"><a class="button primary" href="${escapeHtml(tool.download)}" download="${escapeHtml(tool.id)}.zip" data-download="${tool.id}">下载插件 ZIP</a><a href="#guide">查看安装指南</a></div>`;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.querySelector('a[href="#guide"]').addEventListener('click', () => dialog.close());
  if (!dialog.open) dialog.showModal();
}

function openPetDetail(work) {
  if (!work.atlas) { openPublicMediaPet(work); return; }
  detailWork = work;
  $('#detail-title').textContent = `${work.title} · 动作预览`;
  $('#detail-description').textContent = `${work.description} 许可：${work.license || '见包内声明'}。`;
  $('#detail-author').textContent = `作者：${petDisplayAuthor(work)} · V${work.version} · ${work.category}`;
  $('#detail-download').href = work.download;
  $('#detail-download').download = `${work.id}.zip`;
  $('#detail-download').dataset.download = work.id;
  $('#detail-sprite').style.backgroundImage = `url("${work.atlas}")`;
  $('#detail-look-section').hidden = work.version !== 2;
  $('#pet-detail').showModal();
  updatePreview('detail', 'action', 0);
}

function openPublicMediaPet(work) {
  let dialog = $('#public-pet-detail');
  if (!dialog) { dialog = document.createElement('dialog'); dialog.id = 'public-pet-detail'; dialog.setAttribute('aria-labelledby', 'public-pet-title'); dialog.addEventListener('close', () => { if (location.hash.startsWith('#pets/')) history.replaceState(null, '', '#pets'); }); document.body.append(dialog); }
  dialog.querySelectorAll('video').forEach(video => video.pause());
  const entries = Object.entries(work.mediaActions || {});
  dialog.innerHTML = `<div class="dialog-heading"><h2 id="public-pet-title">${escapeHtml(work.title)}</h2><button class="secondary" type="button" aria-label="关闭桌宠详情">关闭</button></div><p>${escapeHtml(work.description)}</p><div class="preview-stage" data-public-media></div>${entries.length ? `<label>预览动作<select data-public-action>${entries.map(([id, entry]) => `<option value="${escapeHtml(id)}">${escapeHtml(entry.displayName)}</option>`).join('')}</select></label>` : ''}${work.hostNotice ? `<p>${escapeHtml(work.hostNotice)}</p>` : ''}<p>作者：${escapeHtml(work.author)}</p><p>许可：${escapeHtml(work.license || '见包内声明')}</p><div class="dialog-actions"><a class="button primary" href="${escapeHtml(work.download)}" download="${work.distribution === 'standalone' ? '' : escapeHtml(work.id) + '.zip'}" data-download="${work.id}">${escapeHtml(work.downloadLabel || '下载桌宠 ZIP')}</a>${(work.secondaryDownloads || []).map(file => `<a class="button secondary" href="${escapeHtml(file.url)}" download>${escapeHtml(file.label)}</a>`).join('')}</div>`;
  const preview = () => {
    const entry = work.mediaActions?.[dialog.querySelector('select')?.value];
    const stage = dialog.querySelector('[data-public-media]'); stage.replaceChildren();
    if (!entry) { if (work.thumbnail) { const cover = document.createElement('img'); cover.src = work.thumbnail; cover.alt = work.title; cover.style.maxHeight = '300px'; stage.append(cover); } return; }
    const media = document.createElement(entry.type.startsWith('video/') ? 'video' : 'img'); media.src = entry.url; media.style.maxHeight = '300px'; media.style.maxWidth = '100%';
    if (media instanceof HTMLImageElement) { media.style.width = '192px'; media.style.imageRendering = 'pixelated'; }
    if (media instanceof HTMLVideoElement) { media.muted = true; media.loop = true; media.autoplay = true; media.controls = true; }
    stage.append(media);
  };
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.querySelector('select')?.addEventListener('change', preview);
  dialog.addEventListener('close', () => dialog.querySelectorAll('video').forEach(video => video.pause()), { once: true });
  if (!dialog.open) dialog.showModal(); preview();
}

function resetGallery() {
  visibleLimit = galleryPageSize;
  renderGallery();
}

function closeCardMenus() {
  $('#cards').querySelectorAll('details[open]').forEach(menu => { menu.open = false; });
}

async function copyGalleryText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    toast('浏览器未允许复制，请使用下载按钮或安装指南。');
  }
}

function showCreator(workflow) {
  const titles = { 'pet-make': '制作桌宠', 'plugin-make': '制作插件', 'pet-import': '导入桌宠', 'plugin-import': '导入插件' };
  const next = Object.hasOwn(titles, workflow) ? workflow : null;
  if (next !== creatorWorkflow) {
    $('#creator-submission-link').hidden = true;
    $('#creator-submission-link').removeAttribute('href');
    if (creatorWorkflow) sessionDrafts.set(creatorWorkflow, captureDraft(creatorWorkflow.split('-')[0]));
    clearImportPreview();
    creatorWorkflow = next;
    if (next) applyDraft(next.split('-')[0], sessionDrafts.get(next) || { fields: {}, imported: null });
  }
  document.querySelectorAll('[data-creator-route]').forEach(link => {
    if (link.dataset.creatorRoute === next) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  $('#creator-start').hidden = Boolean(next);
  $('#create-view').dataset.workflow = next || '';
  $('#creator-workflow-title').hidden = !next;
  $('#creator-workflow-title').textContent = titles[next] || '';
  $('#pet-form-panel').hidden = !next?.startsWith('pet-');
  $('#plugin-form-panel').hidden = !next?.startsWith('plugin-');
  if (next?.startsWith('pet-')) setPetMode(next.endsWith('import') ? 'import' : 'make');
  if (next?.startsWith('plugin-')) {
    const importing = next.endsWith('import');
    $('#plugin-upload-title').textContent = importing ? '先导入原项目文件' : '上传你制作的插件';
    renderPluginCardPreview();
  }
  updatePublicationUI();
  $('#creator-feedback').textContent = '';
  if (!next?.startsWith('pet-')) $('#creator-pet-stage video')?.pause();
}

async function selectAtlas() {
  const generation = ++atlasGeneration;
  if (selectedAtlas) URL.revokeObjectURL(selectedAtlas.url);
  selectedAtlas = undefined;
  updateCreatorControls();
  $('#creator-pet-stage').replaceChildren();
  $('#atlas-status').textContent = '正在检查图集…';
  const file = $('#atlas-input').files[0];
  let url;
  try {
    if (!file) throw new Error('等待选择图集');
    if (file.size > 24 * 1024 * 1024) throw new Error('图集超过 24 MB。');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = new TextDecoder('ascii').decode(bytes.slice(0, 12));
    if (!signature.startsWith('RIFF') || signature.slice(8) !== 'WEBP') throw new Error('请选择真正的 WebP 图集。');
    const chunks = new DataView(bytes.buffer);
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const tag = new TextDecoder('ascii').decode(bytes.slice(offset, offset + 4));
      if (tag === 'ANIM' || tag === 'ANMF') throw new Error('请选择单张图集，不要使用动画 WebP。');
      const length = chunks.getUint32(offset + 4, true);
      offset += 8 + length + (length % 2);
    }
    const bitmap = await createImageBitmap(file);
    let version;
    try {
      if (bitmap.width !== 1536 || ![1872, 2288].includes(bitmap.height)) throw new Error('图集尺寸应为 1536 × 1872（V1）或 1536 × 2288（V2）。');
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(bitmap, 0, 0);
      const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
      let transparent = false;
      let visible = false;
      for (let index = 3; index < pixels.length && !(transparent && visible); index += 4) {
        transparent ||= pixels[index] === 0;
        visible ||= pixels[index] > 0;
      }
      if (!transparent || !visible) throw new Error('图集需要同时包含透明背景和可见角色。');
      version = bitmap.height === 2288 ? 2 : 1;
    } finally { bitmap.close(); }
    if (generation !== atlasGeneration) return;
    url = URL.createObjectURL(file);
    selectedAtlas = { bytes, url, version };
    const sprite = document.createElement('div');
    sprite.className = 'sprite large';
    sprite.setAttribute('role', 'img');
    sprite.setAttribute('aria-label', '上传图集的动作预览');
    sprite.style.backgroundImage = `url("${url}")`;
    $('#creator-pet-stage').append(sprite);
    updateCreatorControls();
    updatePreview('creator', 'action', Number($('#creator-action').value));
    $('#atlas-status').textContent = `V${version} 图集已通过尺寸、单图、透明与可见内容检查。`;
  } catch (error) {
    if (url) URL.revokeObjectURL(url);
    if (generation === atlasGeneration) $('#atlas-status').textContent = error.message;
  }
}

for (const prefix of ['detail', 'creator']) {
  const select = $(`#${prefix}-action`);
  select.innerHTML = '<option value="" disabled>选择动作</option>' + actions.map(([label], index) => `<option value="${index}">${label}</option>`).join('');
  select.value = '0';
  $(`#${prefix}-action-buttons`).innerHTML = actions.map(([label], index) => `<button type="button" data-preview-action="${index}" aria-pressed="false">${label}</button>`).join('');
  $(`#${prefix}-look-buttons`).innerHTML = Array.from({ length: 16 }, (_, index) => `<button type="button" data-preview-look="${index}" aria-pressed="false">${index * 22.5}°${lookDirections[index] ? ` · ${lookDirections[index]}` : ''}</button>`).join('');
  select.addEventListener('change', () => updatePreview(prefix, 'action', Number(select.value)));
  $(`#${prefix}-action-buttons`).addEventListener('click', event => {
    const button = event.target.closest('[data-preview-action]');
    if (button) updatePreview(prefix, 'action', Number(button.dataset.previewAction));
  });
  $(`#${prefix}-look-buttons`).addEventListener('click', event => {
    const button = event.target.closest('[data-preview-look]');
    if (button) updatePreview(prefix, 'look', Number(button.dataset.previewLook));
  });
  $(`#${prefix}-background`).addEventListener('change', event => {
    $(`#${prefix}-pet-stage`).dataset.background = event.target.value;
  });
}
updateCreatorControls();
$('.category-bar').addEventListener('click', event => {
  const button = event.target.closest('[data-category]');
  if (button) {
    category = button.dataset.category;
    resetGallery();
    Array.from($('.category-bar').querySelectorAll('button')).find(item => item.dataset.category === category)?.focus();
  }
});
$('#search').addEventListener('input', resetGallery);
$('#sort').addEventListener('change', () => {
  if ($('#sort').value === 'random') shuffledIds = shuffle(works.map(item => item.id));
  resetGallery();
});
$('#gallery-more').addEventListener('click', () => { visibleLimit += galleryPageSize; renderGallery(); });
$('#gallery-random').addEventListener('click', () => {
  const candidates = filteredWorks();
  if (candidates.length === 0) { toast('当前没有匹配作品，请先清除筛选。'); return; }
  const work = candidates[Math.floor(Math.random() * candidates.length)];
  if (work.kind === 'pet') location.hash = `pets/${work.id}`;
  else if (work.pluginType) location.hash = `plugins/${work.id}`;
  else openPluginCreator(work);
});
$('#clear-search').addEventListener('click', () => { category = '全部'; $('#search').value = ''; resetGallery(); $('#search').focus(); });

function openPluginCreator(work) {
  if (work.kind === 'plugin') openToolDetail({ ...work, pluginType: work.pluginType || 'declarative', features: work.features || [], permissionLabels: work.permissionLabels || [], hostNotice: work.hostNotice || '', version: work.version || '1.0.0', source: work.source || templateCredit.source, license: work.license || templateCredit.license });
}

$('#cards').addEventListener('click', async event => {
  const control = event.target.closest('[data-like], [data-preview], [data-share], [data-install-help]');
  if (!control) return;
  event.preventDefault();
  const id = control.dataset.like || control.dataset.preview || control.dataset.share || control.dataset.installHelp;
  const work = works.find(item => item.id === id);
  if (!work) return;
  if (control.dataset.like) {
    await recordActivity(id, 'like');
    if (['likes', 'trending'].includes($('#sort').value)) {
      renderGallery();
      Array.from($('#cards').querySelectorAll('[data-like]')).find(button => button.dataset.like === id)?.focus();
    }
  } else if (control.dataset.preview) {
    if (work.kind === 'pet') {
      if (location.hash === `#pets/${id}`) openPetDetail(work);
      else location.hash = `pets/${id}`;
    } else if (work.pluginType) {
      if (location.hash === `#plugins/${id}`) openToolDetail(work);
      else location.hash = `plugins/${id}`;
    } else openPluginCreator(work);
  } else if (control.dataset.share) {
    const url = new URL(location.href);
    url.hash = work.kind === 'pet' ? `pets/${id}` : work.pluginType ? `plugins/${id}` : 'plugins';
    await copyGalleryText(url.href, url.hostname === '127.0.0.1' ? '本机作品链接已复制；其他电脑请分享 ZIP。' : '作品链接已复制。');
    closeCardMenus();
  } else {
    const instruction = work.distribution === 'standalone'
      ? `请帮助我使用「${work.title}」。下载完整原应用：${new URL(work.download, location.href).href}。${work.hostNotice} ${(work.secondaryDownloads || []).map(file => `${file.label}：${file.url}`).join('；')} 保留原应用和素材许可。在 desktop pet 控制中心使用「独立运行」选择已安装的实际应用 EXE，安装器不能作为运行入口。不要改动我的 AI 配置或密钥。`
      : work.kind === 'pet'
      ? `请帮助我在 desktop pet 中安装「${work.title}」。先下载作品 ZIP：${new URL(work.download, location.href).href}。在本地控制中心「我的桌宠」选择「导入 ZIP 或文件夹」，导入这个 ZIP 后设为当前桌宠。保留包内 SHARE.md 的作者与许可声明。不要改动我的 AI 配置或密钥。`
      : work.pluginType === 'community-plugin' ? `请帮助我使用社区作品「${work.title}」。下载完整 ZIP：${new URL(work.download, location.href).href}。先阅读原项目清单、包内 SHARE.md 和作品说明：${work.hostNotice}。兼容 desktop pet 时从本地插件管理导入并确认权限、依赖；需要其他宿主则按原项目说明使用，不自动改写原逻辑或执行未知命令。保留作者和许可。`
      : `请帮助我安装${work.pluginType ? '本机' : '提醒'}插件「${work.title}」。下载 ZIP：${new URL(work.download, location.href).href}。先解压，在本地控制中心「插件管理」导入含插件清单的文件夹，确认权限后启用。保留原包中的版权与许可声明。${work.requirements ?? ''}${work.pluginType === 'host-tool' ? '本机工具由匹配版本的 desktop pet 宿主提供，启用后从插件配置进入。不要代我自动删除文件、卸载程序或开启监测。' : ''}`;
    await copyGalleryText(instruction, '安装说明已复制，可以交给你选择的 AI。');
    closeCardMenus();
  }
});
document.addEventListener('click', event => {
  const link = event.target.closest('[data-download]');
  if (link && works.some(work => work.id === link.dataset.download)) recordActivity(link.dataset.download, 'download');
  if (link && publicationSession?.interactionsAvailable) setTimeout(() => { void refreshSharedActivity(); }, 1500);
  if (!event.target.closest('.install-menu, .share-menu')) closeCardMenus();
});
$('#cards').addEventListener('toggle', event => {
  if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
  $('#cards').querySelectorAll('details[open]').forEach(menu => { if (menu !== event.target) menu.open = false; });
}, true);
document.addEventListener('keydown', event => {
  const typing = event.target.closest('input, textarea, select, [contenteditable="true"]');
  if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && ['pets', 'plugins'].includes(route) && !$('#pet-detail').open && !$('#tool-detail')?.open) {
    event.preventDefault();
    $('#search').focus();
  }
  if (event.key === 'Escape') closeCardMenus();
});

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $('#theme-toggle').setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
  $('#theme-toggle').setAttribute('aria-pressed', String(theme === 'dark'));
  $('#theme-toggle').textContent = theme === 'dark' ? '☀' : '☾';
}
try {
  setTheme(localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light');
} catch {
  setTheme('light');
}
$('#theme-toggle').addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem(themeKey, theme); } catch { toast('主题已切换；此浏览器未允许保存偏好。'); }
});
$('#close-detail').addEventListener('click', () => $('#pet-detail').close());
$('#pet-detail').addEventListener('close', () => {
  $('#detail-sprite').getAnimations().forEach(animation => animation.cancel());
  if (location.hash.startsWith('#pets/')) history.replaceState(null, '', '#pets');
});
$('#atlas-input').addEventListener('change', () => { void selectAtlas(); });
let petMode = 'make';
let creatorWorkflow = null;
const sessionDrafts = new Map();
let clips = [];
let clipGeneration = 0;
let pluginCover = null;
let importPreviewUrl;
const importedPackages = { pet: null, plugin: null };
const uploadGenerations = { pet: 0, plugin: 0 };
const stateNames = { idle: '待机', 'running-right': '向右行走', 'running-left': '向左行走', waving: '挥手', jumping: '庆祝', failed: '失败', waiting: '等待', running: '工作', review: '思考', sleeping: '睡觉', clicked: '点击', dragged: '拖拽' };
const stateLabels = petStateIds.map(id => [id, stateNames[id]]);

function creatorFeedback(message, error = false) {
  $('#creator-feedback').dataset.error = String(error);
  $('#creator-feedback').textContent = message;
}

function setPetMode(mode) {
  petMode = mode;
  $('#pet-make-fields').hidden = mode !== 'make';
  $('#pet-import-fields').hidden = mode !== 'import';
  $('#pet-form .preview-panel').hidden = mode === 'import';
  const idField = $('#pet-form').elements.namedItem('id');
  if (mode === 'make') idField.setAttribute('pattern', '[a-z0-9][a-z0-9_-]{0,63}'); else idField.removeAttribute('pattern');
  if (mode === 'import') $('#creator-pet-stage video')?.pause();
  if (mode === 'import') $('#pet-form .form-panel').prepend($('#pet-import-fields'));
  updateMaterialInputs();
}

function updateMaterialInputs() {
  const video = $('#pet-media-mode').value === 'video';
  $('#pet-media-mode').disabled = petMode === 'import';
  for (const [selector, inactive] of [['#pet-video-fields', petMode === 'import' || !video], ['#pet-atlas-fields', petMode === 'import' || video]]) $(selector).querySelectorAll('input, select, button').forEach(element => { element.disabled = inactive; });
}

function clipMetadata() {
  return clips.map((clip, index) => {
    const row = $(`[data-clip-index="${index}"]`);
    return { ...clip, id: row.querySelector('[data-clip-field="id"]').value.trim(), displayName: row.querySelector('[data-clip-field="displayName"]').value.trim(), category: row.querySelector('[data-clip-field="category"]').value.trim() };
  });
}

function renderBindings(saved = {}) {
  const existing = Object.fromEntries(Array.from($('#state-bindings').querySelectorAll('select')).map(select => [select.dataset.state, select.value]));
  const entries = clipMetadata();
  $('#state-bindings').innerHTML = stateLabels.map(([id, label]) => `<div class="binding-field"><label>${label}<select data-state="${id}"><option value="">${id === 'idle' ? '第一个动作' : '使用待机'}</option>${entries.map(clip => `<option value="${escapeHtml(clip.id)}">${escapeHtml(clip.displayName || clip.id)}</option>`).join('')}</select></label><button class="secondary" type="button" data-preview-binding="${id}" ${entries.length ? '' : 'disabled'}>预览此绑定</button></div>`).join('');
  $('#state-bindings').querySelectorAll('select').forEach(select => {
    const requested = saved[select.dataset.state] ?? existing[select.dataset.state] ?? (entries.some(clip => clip.id === select.dataset.state) ? select.dataset.state : '');
    select.value = entries.some(clip => clip.id === requested) ? requested : '';
  });
}

function renderClips() {
  $('#clip-list').innerHTML = clips.map((clip, index) => `<div class="creator-clip" data-clip-index="${index}" data-action-id="${escapeHtml(clip.id)}"><p class="hint">${escapeHtml(clip.file)} · ${(clip.bytes.length / 1024 / 1024).toFixed(1)} MB</p><div class="field-grid"><label>动作名称<input data-clip-field="displayName" maxlength="80" required value="${escapeHtml(clip.displayName)}"></label><label>动作种类<input data-clip-field="category" maxlength="80" required value="${escapeHtml(clip.category)}" placeholder="例如：陪伴 / 互动 / 工作"></label></div><label>动作 ID<input data-clip-field="id" maxlength="64" required pattern="[a-z0-9][a-z0-9_-]{0,63}" value="${escapeHtml(clip.id)}"></label><div class="creator-submit-actions"><button class="secondary" type="button" data-preview-clip="${index}">预览动作</button><button class="secondary" type="button" data-remove-clip="${index}">移除</button></div></div>`).join('');
  renderBindings();
}

function previewClip(index) {
  const clip = clips[index];
  if (!clip) return;
  const element = document.createElement(clip.file.endsWith('.webp') ? 'img' : 'video');
  if (element instanceof HTMLVideoElement) { element.controls = true; element.muted = true; element.loop = true; element.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches; element.playsInline = true; }
  element.src = clip.url;
  element.className = 'creator-media-preview';
  element.setAttribute('aria-label', clipMetadata()[index].displayName);
  $('#creator-pet-stage video')?.pause();
  $('#creator-pet-stage .sprite')?.getAnimations().forEach(animation => animation.cancel());
  $('#creator-pet-stage').replaceChildren(element);
  $('#creator-current-preview').textContent = `正在预览：${clipMetadata()[index].displayName} · 原素材背景`;
}

$('#pet-media-mode').addEventListener('change', event => {
  const video = event.target.value === 'video';
  $('#pet-video-fields').hidden = !video;
  $('#pet-atlas-fields').hidden = video;
  for (const selector of ['#creator-action', '#creator-action-buttons', '#creator-look-section', '#atlas-status']) $(selector).hidden = video;
  $('#creator-action').parentElement.hidden = video;
  updateMaterialInputs();
  $('#creator-pet-stage video')?.pause();
  $('#creator-pet-stage .sprite')?.getAnimations().forEach(animation => animation.cancel());
  $('#creator-pet-stage').replaceChildren();
  $('#creator-current-preview').textContent = video ? '添加动作文件后即可预览' : '选择图集后即可预览';
  if (video && !clips.length) { const hint = document.createElement('p'); hint.textContent = '添加动作文件后，在这里预览'; $('#creator-pet-stage').append(hint); }
  if (video && clips.length) previewClip(0);
  else if (!video && selectedAtlas) { const sprite = document.createElement('div'); sprite.className = 'sprite large'; sprite.style.backgroundImage = `url("${selectedAtlas.url}")`; $('#creator-pet-stage').append(sprite); updateCreatorControls(); updatePreview('creator', 'action', 0); }
});
$('#clip-background').addEventListener('change', event => { $('#clip-color-label').hidden = event.target.value === 'alpha'; });
$('#state-bindings').addEventListener('click', event => {
  const button = event.target.closest('[data-preview-binding]');
  if (!button) return;
  const state = button.dataset.previewBinding;
  const metadata = clipMetadata();
  const fallback = metadata.some(clip => clip.id === 'idle') ? 'idle' : $('[data-state="idle"]').value || metadata[0]?.id;
  const requested = $(`[data-state="${state}"]`).value || fallback;
  const index = metadata.findIndex(clip => clip.id === requested);
  if (index < 0) return creatorFeedback('请先添加并选择要预览的动作。', true);
  previewClip(index);
  $('#creator-current-preview').textContent = `绑定预览：${stateLabels.find(([id]) => id === state)[1]} → ${metadata[index].displayName}`;
});
$('#clip-input').addEventListener('change', async event => {
  const generation = ++clipGeneration;
  const next = clipMetadata();
  const createdUrls = [];
  try {
    for (const file of event.target.files) {
      if (next.length >= 100) throw new Error('最多添加 100 个动作。');
      const extension = file.name.split('.').pop().toLowerCase();
      if (!['mp4', 'webm', 'webp'].includes(extension)) throw new Error('请选择 MP4、WebM 或动画 WebP。');
      if (file.size > packageImportLimits.maxFileBytes || next.reduce((sum, clip) => sum + clip.bytes.length, file.size) > packageImportLimits.maxBytes) throw new Error('单文件最大 512 MiB，动作总量最大 1 GiB。');
      const sequence = crypto.randomUUID().slice(0, 8);
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (generation !== clipGeneration) { createdUrls.forEach(url => URL.revokeObjectURL(url)); return; }
      const url = URL.createObjectURL(file); createdUrls.push(url);
      next.push({ id: next.length ? `action-${sequence}` : 'idle', displayName: file.name.replace(/\.[^.]+$/, ''), category: '陪伴', file: `actions/${sequence}.${extension}`, bytes, url });
    }
    clips = next;
    renderClips();
    if (clips.length) previewClip(clips.length - 1);
    creatorFeedback(`已添加 ${clips.length} 个动作，可编辑名称与种类。`);
  } catch (error) { createdUrls.forEach(url => URL.revokeObjectURL(url)); if (generation === clipGeneration) creatorFeedback(error.message, true); }
  event.target.value = '';
});
function updateClipBindings(event) {
  const field = event.target.closest('[data-clip-field]');
  if (!field || !['id', 'displayName'].includes(field.dataset.clipField)) return;
  const metadata = clipMetadata();
  if (metadata.some(clip => !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(clip.id)) || new Set(metadata.map(clip => clip.id)).size !== metadata.length) return;
  const bindings = Object.fromEntries(Array.from($('#state-bindings').querySelectorAll('select')).map(select => [select.dataset.state, select.value]));
  if (field.dataset.clipField === 'id') {
    const row = field.closest('[data-clip-index]');
    for (const state of Object.keys(bindings)) if (bindings[state] === row.dataset.actionId) bindings[state] = field.value.trim();
    row.dataset.actionId = field.value.trim();
  }
  renderBindings(bindings);
}
$('#clip-list').addEventListener('input', updateClipBindings);
$('#clip-list').addEventListener('change', updateClipBindings);
$('#clip-list').addEventListener('click', event => {
  const preview = event.target.closest('[data-preview-clip]');
  if (preview) previewClip(Number(preview.dataset.previewClip));
  const remove = event.target.closest('[data-remove-clip]');
  if (remove) { clips = clipMetadata(); const [clip] = clips.splice(Number(remove.dataset.removeClip), 1); URL.revokeObjectURL(clip.url); renderClips(); if (clips.length) previewClip(0); else $('#creator-pet-stage').replaceChildren(); }
});

async function inflateZip(bytes, maximum) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maximum) throw new Error('ZIP 实际解压内容超过清单大小。');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function displayImportedPackage(kind, replaceWork = false) {
  const entry = importedPackages[kind];
  const info = inspectImportPackage(entry.files, kind);
  const { report } = info;
  entry.report = report;
  const labels = { native: '原生兼容', partial: '部分支持', external: '需原宿主', invalid: '无法识别或直接兼容' };
  const reportElement = $(`#${kind}-compatibility`);
  reportElement.hidden = false;
  reportElement.dataset.level = report.level;
  reportElement.innerHTML = `<p class="eyebrow">静态兼容性检查</p><h3>${labels[report.level]} · ${escapeHtml(report.format)}</h3>${report.reasons.length ? `<ul>${report.reasons.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>` : ''}${report.unsupported.length ? `<p class="hint">不支持：${escapeHtml(report.unsupported.join('、'))}</p>` : ''}`;
  $(`#${kind}-package-status`).textContent = `${info.fileCount} 个文件 · ${(info.bytes / 1024 / 1024).toFixed(1)} MB`;
  $(`#${kind}-package-list`).innerHTML = Object.keys(entry.files).slice(0, 50).map(name => `<li>${escapeHtml(name)}</li>`).join('') + (info.fileCount > 50 ? `<li>另有 ${info.fileCount - 50} 个文件，导出时全部保留</li>` : '');
  if (kind === 'plugin') {
    $('#permission-preview').textContent = Array.isArray(info.manifest.permissions) ? info.manifest.permissions.join(' · ') || '清单未请求权限' : '未提供本系统权限声明';
    $('#plugin-import-capability-note').textContent = report.capabilities.originalLogic ? '' : '请使用原宿主。';
    if (creatorWorkflow !== 'plugin-make' || pluginCover?.origin !== 'selected') setPluginCover(info.cover ? { ...info.cover, origin: 'package' } : null);
  } else {
    $('[data-import-preview]').disabled = !report.capabilities.preview;
    $('[data-import-preview]').title = report.capabilities.preview ? '只预览原包素材，不执行原逻辑' : '本系统不能预览此格式，请按原项目说明在原宿主使用';
    $('#pet-import-capability-note').textContent = report.capabilities.actions ? '' : '请使用原宿主。';
    clearImportPreview();
  }
  const form = $(`#${kind}-form`);
  const current = Object.fromEntries(['id', 'title', 'description', 'author', 'source', 'license'].map(key => [key, form.elements.namedItem(kind === 'pet' && key === 'title' ? 'displayName' : key).value]));
  for (const [key, value] of Object.entries(packageWorkFields(current, info.workInfo, replaceWork))) {
    form.elements.namedItem(kind === 'pet' && key === 'title' ? 'displayName' : key).value = value;
  }
  if (kind === 'plugin') renderPluginCardPreview();
}

function clearImportPreview() {
  $('#pet-import-preview video')?.pause();
  $('#pet-import-preview .sprite')?.getAnimations().forEach(animation => animation.cancel());
  $('#pet-import-preview').replaceChildren();
  $('#pet-import-preview').hidden = true;
  if (importPreviewUrl) URL.revokeObjectURL(importPreviewUrl);
  importPreviewUrl = undefined;
}

$('[data-import-preview]').addEventListener('click', () => {
  const entry = importedPackages.pet;
  if (!entry) return;
  const info = inspectImportPackage(entry.files, 'pet');
  if (!info.report.capabilities.preview) return;
  clearImportPreview();
  const manifest = info.manifest;
  const media = manifest.mediaVersion === 1;
  const path = info.assetPrefix + (media ? manifest.actions[manifest.stateBindings?.idle || 'idle'] || manifest.actions.idle : manifest.spritesheetPath || 'spritesheet.webp');
  const bytes = entry.files[path];
  if (!bytes) return creatorFeedback('原包缺少预览文件。', true);
  importPreviewUrl = URL.createObjectURL(new Blob([bytes]));
  let element;
  if (!media) {
    element = document.createElement('div'); element.className = 'sprite large'; element.style.backgroundImage = `url("${importPreviewUrl}")`;
    animateSprite(element, actions[0], manifest.spriteVersionNumber || 1);
  } else {
    element = document.createElement(path.toLowerCase().endsWith('.webp') ? 'img' : 'video');
    element.className = 'creator-media-preview'; element.src = importPreviewUrl;
    if (element instanceof HTMLVideoElement) { element.controls = true; element.muted = true; element.loop = true; element.autoplay = !matchMedia('(prefers-reduced-motion: reduce)').matches; }
  }
  element.setAttribute('aria-label', '原包待机素材预览');
  $('#pet-import-preview').append(element);
  $('#pet-import-preview').hidden = false;
  creatorFeedback('正在预览待机动作。');
});

function setPluginCover(cover) {
  if (pluginCover?.url) URL.revokeObjectURL(pluginCover.url);
  pluginCover = cover ? { ...cover, url: URL.createObjectURL(new Blob([cover.bytes], { type: cover.mime || coverImageType(cover.bytes).mime })) } : null;
  $('#plugin-cover-remove').hidden = !pluginCover;
  renderPluginCardPreview();
}

function renderPluginCardPreview() {
  const form = $('#plugin-form');
  const value = name => form.elements.namedItem(name).value.trim();
  const report = importedPackages.plugin?.report;
  $('#plugin-card-preview').innerHTML = renderCard({ id: 'creator-preview', kind: 'plugin', pluginType: 'javascript', title: value('title') || '你的插件名称', description: value('description') || '填写说明后在这里预览', author: value('author') || '你的署名', category: '插件', permissionLabels: [], symbol: '✦', cover: pluginCover?.url, hostFormat: report && report.level !== 'native' ? report.format : undefined }, true);
  const image = $('#plugin-card-preview .plugin-cover');
  const activeCoverUrl = pluginCover?.url;
  if (image) image.addEventListener('error', () => {
    if (pluginCover?.url !== activeCoverUrl) return;
    image.hidden = true;
    creatorFeedback('封面图片无法解码显示，原文件仍保留。请重新选择可打开的 PNG、JPEG 或 WebP 图片。', true);
  }, { once: true });
}

let coverGeneration = 0;
$('#plugin-cover-input').addEventListener('change', async event => {
  const generation = ++coverGeneration;
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) throw new Error('插件封面最大 10 MB。');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = coverImageType(bytes);
    const bitmap = await createImageBitmap(new Blob([bytes], { type: type.mime }));
    bitmap.close();
    if (generation !== coverGeneration) return;
    setPluginCover({ bytes, path: `community-cover/${crypto.randomUUID()}.${type.extension}`, ...type, origin: 'selected' });
    creatorFeedback('封面已加入作品，右侧显示实际卡片布局。保存草稿或下载分享包会保留图片。');
  } catch (error) { if (generation === coverGeneration) creatorFeedback(`封面未更新：${error.message}`, true); }
  event.target.value = '';
});
$('#plugin-cover-remove').addEventListener('click', () => { ++coverGeneration; setPluginCover(null); });
$('#plugin-form').addEventListener('input', renderPluginCardPreview);

for (const kind of ['pet', 'plugin']) for (const mode of ['zip', 'folder', 'files']) {
  $(`#${kind}-package-${mode}`).addEventListener('change', async event => {
    const generation = ++uploadGenerations[kind];
    try {
      if (!event.target.files.length) return;
      if (creatorWorkflow?.endsWith('-import')) {
        const form = $(`#${kind}-form`);
        for (const name of ['id', kind === 'pet' ? 'displayName' : 'title', 'description', 'author', 'source', 'license']) form.elements.namedItem(name).value = '';
      }
      $(`#${kind}-package-status`).textContent = '正在读取作品文件…';
      let files;
      if (mode === 'zip') {
        if (event.target.files[0].size > packageImportLimits.maxBytes) throw new Error('ZIP 最大 1 GiB；更大的作品请按投稿指南提交完整包链接。');
        files = await readZipPackage(new Uint8Array(await event.target.files[0].arrayBuffer()), inflateZip);
      }
      else {
        files = Object.create(null);
        let total = 0;
        if (event.target.files.length > packageImportLimits.maxFiles) throw new Error('最多导入 10000 个文件。');
        for (const file of event.target.files) {
          const name = file.webkitRelativePath || file.name;
          safePackagePath(name);
          total += file.size;
          if (file.size > packageImportLimits.maxFileBytes || total > packageImportLimits.maxBytes) throw new Error('单文件最大 512 MiB，总量最大 1 GiB。');
          if (Object.hasOwn(files, name)) throw new Error('存在同名文件，请使用文件夹或 ZIP 保留子目录。');
          files[name] = new Uint8Array(await file.arrayBuffer());
        }
      }
      files = normalizePackageFiles(files);
      inspectImportPackage(files, kind);
      if (generation !== uploadGenerations[kind]) return;
      importedPackages[kind] = { files };
      displayImportedPackage(kind, creatorWorkflow?.endsWith('-import'));
      creatorFeedback('作品文件已读取。填写作品信息后可保存草稿或下载完整分享包。');
    } catch (error) {
      if (generation === uploadGenerations[kind]) { importedPackages[kind] = null; $(`#${kind}-package-status`).textContent = error.message; $(`#${kind}-package-list`).replaceChildren(); $(`#${kind}-compatibility`).hidden = true; if (kind === 'plugin') $('#permission-preview').textContent = '清单未成功读取'; else { $('[data-import-preview]').disabled = true; clearImportPreview(); } creatorFeedback(error.message, true); }
    }
  });
}

async function checkCreationImages(files, kind) {
  for (const check of creationImageChecks(files, kind)) {
    const bytes = files[check.path];
    if (new TextDecoder('ascii').decode(bytes.subarray(0, 4)) !== 'RIFF' || new TextDecoder('ascii').decode(bytes.subarray(8, 12)) !== 'WEBP') throw new Error(`请使用真实 WebP：${check.path}。`);
    if (kind === 'pet' && !check.frames) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      for (let at = 12; at + 8 <= bytes.length;) {
        const tag = new TextDecoder('ascii').decode(bytes.subarray(at, at + 4));
        const length = view.getUint32(at + 4, true);
        if (['ANIM', 'ANMF'].includes(tag) || at + 8 + length > bytes.length) throw new Error('图集必须是完整单张 WebP。');
        at += 8 + length + (length % 2);
      }
    }
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/webp' }));
    try {
      if (bitmap.width !== check.width || bitmap.height !== check.height) throw new Error(`图片尺寸与清单不符：${check.path}。`);
      if (kind === 'pet' && !check.frames) {
        const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
        const context = canvas.getContext('2d', { willReadFrequently: true }); context.drawImage(bitmap, 0, 0);
        const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
        let transparent = false, visible = false;
        for (let at = 3; at < pixels.length && !(transparent && visible); at += 4) { transparent ||= pixels[at] === 0; visible ||= pixels[at] > 0; }
        if (!transparent || !visible) throw new Error('图集需要透明背景和可见角色。');
      }
    } finally { bitmap.close(); }
    if (check.frames) {
      if (!globalThis.ImageDecoder || !await ImageDecoder.isTypeSupported('image/webp')) throw new Error('此浏览器无法完整检查动画 WebP。');
      const decoder = new ImageDecoder({ data: bytes, type: 'image/webp', preferAnimation: true });
      try {
        await decoder.tracks.ready;
        if (decoder.tracks.selectedTrack?.frameCount !== check.frames) throw new Error(`动画帧数无效：${check.path}。`);
        for (let frameIndex = 0; frameIndex < check.frames; frameIndex++) {
          const frame = await decoder.decode({ frameIndex });
          try { if (frame.image.displayWidth !== check.width || frame.image.displayHeight !== check.height) throw new Error(`动画帧尺寸无效：${check.path}。`); }
          finally { frame.image.close(); }
        }
      } finally { decoder.close(); }
    }
  }
}

async function petShare(draft, workflow) {
    const kind = 'pet', input = draft.fields;
    let files;
    if (workflow === 'pet-import') {
      if (!draft.imported) throw new Error('请先上传完整作品文件。');
      files = draft.imported.files;
    } else if (draft.mediaMode === 'atlas') {
      if (!draft.atlas) throw new Error('请先选择通过检查的图集。');
      files = { 'pet.json': JSON.stringify(petManifest(input, draft.atlas.version), null, 2), 'spritesheet.webp': draft.atlas.bytes };
    } else {
      const metadata = draft.clips;
      const background = draft.background === 'alpha' ? { mode: 'alpha' } : { mode: 'chroma', color: draft.color, tolerance: 70 };
      const manifest = videoPetManifest(input, metadata, draft.bindings, background);
      files = Object.fromEntries(metadata.map(clip => [clip.file, clip.bytes]));
      files['pet.json'] = JSON.stringify(manifest, null, 2);
    }
    const safeId = String(input.id).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 64) || kind;
    const packaged = prepareWorkPackage(files, input, kind, workflow);
    if (workflow === 'pet-make') await checkCreationImages(packaged, kind);
    return { archive: zipPackage(packaged), name: `${safeId}-share.zip`, files: packaged, metadata: { title: input.displayName, id: input.id, description: input.description, ...attribution(input), workflow } };
}

$('#pet-download-backup').addEventListener('click', async () => {
  try { const shared = await petShare(captureDraft('pet'), creatorWorkflow); download(shared.archive, shared.name); creatorFeedback('分享 ZIP 已生成。'); }
  catch (error) { creatorFeedback(error.message, true); }
});

function updatePublicationUI() {
  const available = publicationSession?.available === true;
  let repository, configurationError;
  try { repository = configuredSubmissionRepository(submissionRepository, publicationSession); } catch (error) { configurationError = error.message; }
  const canSubmit = Boolean(repository) || available && publicationSession.signedIn;
  $('#plugin-publication-status').textContent = publicationBusy ? '正在生成投稿包，请勿重复提交。' : configurationError || (repository ? '生成 ZIP 后打开本站 GitHub 投稿表单，附上文件并提交，等待审核收录。' : !publicationSession ? '正在检查投稿服务…' : available && publicationSession.signedIn ? '可提交作品；发布结果以服务确认为准。' : publicationSession.error || (publicSiteUrl ? '可保存草稿或下载分享包，到公开共创平台查看投稿入口。' : '投稿入口尚未开放；可保存草稿或下载分享包。'));
  $('#plugin-publish').disabled = publicationBusy || !canSubmit;
  $('#plugin-publish').textContent = publicationBusy ? '正在打包…' : '打包并发布';
  $('#pet-publish').disabled = publicationBusy || !canSubmit;
  $('#pet-publish').textContent = publicationBusy ? '正在打包…' : '打包并发布';
  let publicUrl;
  try { const value = new URL(publicSiteUrl); if (value.protocol === 'https:') { value.hash = 'create'; publicUrl = value.href; } } catch { /* 部署前没有公开地址，不展示占位链接。 */ }
  $('#plugin-public-site').hidden = canSubmit || !publicUrl;
  if (publicUrl) $('#plugin-public-site').href = publicUrl;
  $('#plugin-publication-help').textContent = repository ? '网页导入与打包最大 1 GiB，单文件 512 MiB，最多 10000 文件。ZIP 超过 Issue 附件上限时，可上传到自己的 GitHub Release（每个文件小于 2 GiB）并在投稿中填写下载链接。' : available ? '公开 ZIP 最大 32 MB；保存草稿与下载 ZIP 不会发布。' : '';
  $('#creator-publishing-note').textContent = repository ? '提交投稿后待审核收录，不会自动在广场上线。' : available ? '发布结果以服务器确认为准。' : '';
  $('#request-publish').disabled = !canSubmit;
  $('#request-public-site').hidden = canSubmit || !publicUrl;
  if (publicUrl) $('#request-public-site').href = publicUrl.replace(/#.*$/, '#requests');
  document.querySelectorAll('[data-activity-scope]').forEach(element => { element.textContent = publicationSession?.interactionsAvailable ? '近 7 日 · 全站' : '近 7 日 · 本浏览器'; });
}

function insertPublicPlugins(items) {
  for (const item of items) {
    const existing = works.findIndex(work => work.id === item.id);
    if (existing >= 0) works[existing] = item; else works.push(item);
    const entries = item.kind === 'pet' ? petWorks : pluginWorks;
    const pluginIndex = entries.findIndex(work => work.id === item.id);
    if (pluginIndex >= 0) entries[pluginIndex] = item; else entries.push(item);
    if (!shuffledIds.includes(item.id)) shuffledIds.push(item.id);
  }
  const stored = readGalleryActivity();
  for (const item of items) if (!galleryActivity[item.id] && stored[item.id]) galleryActivity[item.id] = stored[item.id];
  if (['plugins', 'pets'].includes(route)) renderGallery();
  communityPages.refresh();
}

async function pluginShare(draft, workflow) {
  if (!draft.imported) throw new Error('请先上传完整作品文件。');
  const info = inspectImportPackage(draft.imported.files, 'plugin');
  if (workflow === 'plugin-make' && info.report.level !== 'native') throw new Error('制作插件需符合本系统 SDK 并补齐声明附件；原项目格式请使用“导入插件”。');
  const input = draft.fields;
  const credit = attribution(input);
  const files = prepareWorkPackage(draft.imported.files, input, 'plugin', workflow, draft.cover);
  if (workflow === 'plugin-make') await checkCreationImages(files, 'plugin');
  const archive = zipPackage(files);
  const name = `${String(input.id).replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 64) || 'plugin'}-share.zip`;
  return { archive, name, files, metadata: { title: input.title, name: input.title, id: input.id, description: input.description, ...credit, workflow } };
}

$('#plugin-download-backup').addEventListener('click', async () => {
  try { const shared = await pluginShare(captureDraft('plugin'), creatorWorkflow); download(shared.archive, shared.name); creatorFeedback('分享 ZIP 已生成。'); }
  catch (error) { creatorFeedback(error.message, true); }
});

async function publishCreator(event) {
  event.preventDefault();
  if (publicationBusy) return;
  const workflow = creatorWorkflow;
  const kind = workflow.split('-')[0], draft = captureDraft(kind);
  let shared, submissionWindow;
  $('#creator-submission-link').hidden = true;
  $('#creator-submission-link').removeAttribute('href');
  publicationBusy = true;
  updatePublicationUI();
  try {
    const repository = configuredSubmissionRepository(submissionRepository, publicationSession);
    if (repository) {
      // 在点击手势中预留页面，异步打包后再打开真实投稿地址。
      submissionWindow = window.open('about:blank', '_blank');
      if (submissionWindow) submissionWindow.opener = null;
      try { await draftStore('readwrite', workflow, draft); } catch { /* 页面文件与完整 ZIP 仍可保留。 */ }
      shared = kind === 'pet' ? await petShare(draft, workflow) : await pluginShare(draft, workflow);
      const digest = await crypto.subtle.digest('SHA-256', await shared.archive.arrayBuffer());
      const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      const info = inspectImportPackage(shared.files, kind), manifest = info.manifest;
      const details = kind === 'pet' ? { actions: manifest?.mediaVersion === 1 ? `共 ${Object.keys(manifest.actions).length} 个动作。示例：${Object.keys(manifest.actions).slice(0, 12).join('、')}；完整名称与映射保留在包内。` : `${info.report.format}；动作与名称以所附完整清单和素材为准。`, environment: `${info.report.format}；${info.report.level === 'native' ? '通过本系统静态包检查，实际运行由创作者测试。' : '导入保持原项目，运行环境与行为以包内说明为准。'}` } : { version: typeof manifest?.version === 'string' ? manifest.version : '', permissions: Array.isArray(manifest?.permissions) ? manifest.permissions.length ? manifest.permissions.join('、') : '清单未请求权限。' : '' };
      const href = githubSubmissionUrl(repository, shared.metadata, { name: shared.name, bytes: shared.archive.size, sha256 }, details);
      const link = $('#creator-submission-link'); link.href = href; link.hidden = false;
      download(shared.archive, shared.name);
      if (submissionWindow) submissionWindow.location.href = href;
      creatorFeedback(`完整 ZIP 与保存链接已生成。请在本站投稿表单附上「${shared.name}」并提交，审核收录后才会上线。${submissionWindow ? '' : '浏览器未打开新页，可点击上方“打开本站投稿表单”。'}`);
      return;
    }
    publicationSession = await publication.session();
    if (!publicationSession.available) throw new Error('当前页面没有发布服务。文件仍在本浏览器，可保存草稿或下载分享 ZIP。');
    if (!publicationSession.signedIn) {
      await draftStore('readwrite', workflow, draft);
      throw new Error('投稿入口尚未开放。当前作品草稿已保存，可下载完整分享包。');
    }
    shared = kind === 'pet' ? await petShare(draft, workflow) : await pluginShare(draft, workflow);
    if (shared.archive.size > publicationSession.maxPackageBytes) throw new Error('公开插件 ZIP 最大 32 MB，请精简后再发布；完整分享包可在下方下载保留。');
    try { await draftStore('readwrite', workflow, draft); } catch { /* 当前页面仍持有文件，发布失败时提供 ZIP 保留。 */ }
    const cover = draft.cover ? { ...draft.cover, ...coverImageType(draft.cover.bytes) } : kind === 'pet' ? await petCover(shared.files) : null;
    const item = await publication.publish(shared.metadata, shared.archive, cover);
    insertPublicPlugins([item]);
    creatorFeedback(`「${item.title}」已发布到${kind === 'pet' ? '桌宠' : '插件'}广场，可浏览和下载。`);
    toast('作品已发布到公开广场。');
  } catch (error) {
    submissionWindow?.close();
    if (error.status === 401) {
      publicationSession = { ...publicationSession, available: true, signedIn: false };
      try { await draftStore('readwrite', workflow, draft); } catch { /* 分享 ZIP 仍可保留完整文件。 */ }
    }
    if (shared) download(shared.archive, shared.name);
    creatorFeedback(`未确认发布：${error.message}${shared ? '。分享 ZIP 已生成，可先下载保留。' : ''}`, true);
  } finally { publicationBusy = false; updatePublicationUI(); }
}
$('#plugin-form').addEventListener('submit', publishCreator);
$('#pet-form').addEventListener('submit', publishCreator);

async function petCover(files) {
  const info = inspectImportPackage(files, 'pet');
  if (!info.report.capabilities.preview) return null;
  const file = info.assetPrefix + (info.manifest.mediaVersion === 1 ? info.manifest.actions.idle : info.manifest.spritesheetPath || 'spritesheet.webp');
  const bytes = files[file], canvas = document.createElement('canvas');
  let url, image;
  try {
    if (/\.(mp4|webm)$/i.test(file)) {
      url = URL.createObjectURL(new Blob([bytes])); image = document.createElement('video'); image.muted = true; image.preload = 'auto'; image.src = url;
      await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('预览超时')), 5000); image.onloadeddata = () => { clearTimeout(timer); resolve(); }; image.onerror = () => { clearTimeout(timer); reject(new Error('预览无法解码')); }; });
      canvas.width = 192; canvas.height = 208; canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      image = await createImageBitmap(new Blob([bytes], { type: 'image/webp' })); canvas.width = 192; canvas.height = 208;
      const context = canvas.getContext('2d');
      if (info.manifest.mediaVersion === 1) context.drawImage(image, 0, 0, canvas.width, canvas.height); else context.drawImage(image, 0, 0, 192, 208, 0, 0, 192, 208);
    }
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    return blob ? { bytes: new Uint8Array(await blob.arrayBuffer()), mime: 'image/png', extension: 'png' } : null;
  } catch { return null; }
  finally { if (image instanceof HTMLVideoElement) { image.pause(); image.removeAttribute('src'); image.load(); } else image?.close(); if (url) URL.revokeObjectURL(url); }
}

async function refreshSharedActivity() {
  if (!publicationSession?.interactionsAvailable) return;
  try { const snapshot = await publication.activitySnapshot(); sharedActivity = snapshot.items; sharedContributorFollowers = snapshot.contributors; activitySnapshotAt = new Date().toISOString(); works.forEach(work => updateActivityDisplay(work.id)); communityPages.refresh(); }
  catch { toast('公共统计暂时无法读取，请刷新重试。'); }
}

async function initializePublication() {
  const results = await Promise.allSettled([publication.session(), publication.list(), publication.list('pet'), publication.activitySnapshot(), publication.requests()]);
  const [session, list, petList, activity, requests] = results;
  publicationSession = session.status === 'fulfilled' ? session.value : { available: false, signedIn: false, error: '发布服务暂时无法连接，请刷新页面重试。文件不会自动上传。' };
  publicListLoaded = list.status === 'fulfilled';
  if (list.status === 'fulfilled') insertPublicPlugins(list.value);
  if (petList.status === 'fulfilled') insertPublicPlugins(petList.value);
  if (publicationSession.interactionsAvailable) {
    if (activity.status === 'fulfilled') { sharedActivity = activity.value.items; sharedContributorFollowers = activity.value.contributors; activitySnapshotAt = new Date().toISOString(); }
    for (const work of works) if (!work.id.startsWith('community-')) work.download = `/api/download/${work.id}`;
  }
  if (requests.status === 'fulfilled') communityPages.setPublicRequests(requests.value);
  if (publicationSession.available && (list.status === 'rejected' || petList.status === 'rejected')) toast('公开作品暂时无法读取，请刷新重试。');
  updatePublicationUI();
  renderRoute(); works.forEach(work => updateActivityDisplay(work.id));
}

async function draftStore(mode, kind, value) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('desktop-pet-creator-drafts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('works');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('works', mode);
      const store = transaction.objectStore('works');
      const request = mode === 'readonly' ? store.get(kind) : store.put(value, kind);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('草稿保存中断。'));
    });
  } finally { database.close(); }
}

function captureDraft(kind) {
  const draft = { fields: Object.fromEntries(new FormData($(`#${kind}-form`))), imported: importedPackages[kind], savedAt: new Date().toISOString() };
  if (kind === 'pet') Object.assign(draft, { petMode, mediaMode: $('#pet-media-mode').value, clips: clipMetadata().map(({ url, ...clip }) => clip), atlas: selectedAtlas ? { bytes: selectedAtlas.bytes, version: selectedAtlas.version } : null, bindings: Object.fromEntries(Array.from($('#state-bindings').querySelectorAll('select')).map(select => [select.dataset.state, select.value])), background: $('#clip-background').value, color: $('#clip-color').value });
  else draft.cover = pluginCover ? { bytes: pluginCover.bytes, path: pluginCover.path, mime: pluginCover.mime, origin: pluginCover.origin } : null;
  return draft;
}

function applyDraft(kind, draft) {
  ++uploadGenerations[kind];
  if (kind === 'pet') { ++atlasGeneration; ++clipGeneration; } else ++coverGeneration;
  const form = $(`#${kind}-form`);
  form.reset();
  for (const [name, value] of Object.entries(draft.fields || {})) { const field = form.elements.namedItem(name); if (field && field.type !== 'file') field.value = value; }
  importedPackages[kind] = draft.imported || null;
  $(`#${kind}-compatibility`).hidden = true;
  $(`#${kind}-package-status`).textContent = '尚未导入文件';
  $(`#${kind}-package-list`).replaceChildren();
  if (kind === 'plugin') { setPluginCover(null); $('#permission-preview').textContent = '导入后读取清单，网页不会执行上传的代码。'; }
  else { $('[data-import-preview]').disabled = true; clearImportPreview(); }
  if (draft.imported) displayImportedPackage(kind);
  if (kind === 'pet') {
    $('#creator-pet-stage video')?.pause();
    clips.forEach(clip => URL.revokeObjectURL(clip.url));
    clips = (draft.clips || []).map(clip => ({ ...clip, url: URL.createObjectURL(new Blob([clip.bytes])) }));
    if (selectedAtlas) URL.revokeObjectURL(selectedAtlas.url);
    selectedAtlas = draft.atlas ? { ...draft.atlas, url: URL.createObjectURL(new Blob([draft.atlas.bytes], { type: 'image/webp' })) } : undefined;
    setPetMode(creatorWorkflow?.endsWith('import') ? 'import' : 'make');
    renderClips(); renderBindings(draft.bindings || {});
    $('#pet-media-mode').value = draft.mediaMode || 'video';
    $('#pet-media-mode').dispatchEvent(new Event('change'));
    $('#clip-background').value = draft.background || 'chroma';
    $('#clip-color').value = draft.color || '#00ff00';
    $('#clip-background').dispatchEvent(new Event('change'));
  } else if (Object.hasOwn(draft, 'cover')) setPluginCover(draft.cover);
  if (kind === 'plugin') renderPluginCardPreview();
}

document.querySelectorAll('[data-save-draft]').forEach(button => button.addEventListener('click', async () => {
  const kind = button.dataset.saveDraft;
  try {
    const draft = captureDraft(kind);
    await draftStore('readwrite', creatorWorkflow, draft);
    creatorFeedback('作品信息与完整文件已保存到此浏览器草稿。没有上传；清理网站数据会删除草稿。');
  } catch (error) { creatorFeedback(`草稿未保存：${error.message}。请下载分享包保留作品。`, true); }
}));
document.querySelectorAll('[data-restore-draft]').forEach(button => button.addEventListener('click', async () => {
  const kind = button.dataset.restoreDraft;
  try {
    let draft = await draftStore('readonly', creatorWorkflow);
    let legacy = false;
    if (!draft) { draft = await draftStore('readonly', kind); legacy = Boolean(draft); }
    if (!draft) throw new Error('此浏览器尚无该类型草稿。');
    applyDraft(kind, draft);
    creatorFeedback(legacy ? '已读取旧版草稿，旧记录保留。保存后写入当前独立入口，不覆盖旧草稿。' : '已恢复当前入口的作品草稿与文件，可继续编辑。插件发布以服务确认结果为准，桌宠仍可下载分享包。');
  } catch (error) { creatorFeedback(error.message, true); }
}));
$('#pet-media-mode').dispatchEvent(new Event('change'));
window.addEventListener('pagehide', () => { clips.forEach(clip => URL.revokeObjectURL(clip.url)); if (pluginCover?.url) URL.revokeObjectURL(pluginCover.url); clearImportPreview(); });
const communityPages = createCommunityPages({
  pets: petWorks, plugins: pluginWorks, activityFor, escapeHtml, icon, toast, copyGalleryText, download, publication, session: () => publicationSession, renderCard,
  statisticsSnapshot: () => ({ scope: publicationSession?.interactionsAvailable ? 'site' : 'browser', available: !publicationSession?.interactionsAvailable || sharedActivity !== null, updatedAt: activitySnapshotAt, contributors: publicationSession?.interactionsAvailable ? sharedContributorFollowers : null }),
  refreshStatistics: refreshSharedActivity,
  submissionRepository: () => configuredSubmissionRepository(submissionRepository, publicationSession),
  browseGallery(query, kind = 'pets') {
    location.hash = kind;
    renderRoute();
    if (typeof query === 'string') {
      $('#search').value = query;
      resetGallery();
    }
    $('#gallery-view').scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
});
window.addEventListener('hashchange', renderRoute);
window.addEventListener('pagehide', () => {
  if (selectedAtlas) URL.revokeObjectURL(selectedAtlas.url);
  if (packageUrl) URL.revokeObjectURL(packageUrl);
  activeAnimations.forEach(animation => animation.cancel());
  clearTimeout(toastTimer);
});
renderRoute();
void initializePublication();

// AI 浏览器与可见筛选使用同一个状态入口，不读取本机资料。
const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(modelContext.registerTool({
      name: 'filter_pet_gallery', title: '筛选桌宠与插件广场',
      description: '切换桌宠或插件广场并筛选关键词，只更新当前网页。',
      inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['pets', 'plugins'] }, query: { type: 'string', maxLength: 120 } }, required: ['type'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || !['pets', 'plugins'].includes(input.type) || (input.query !== undefined && (typeof input.query !== 'string' || input.query.length > 120))) throw new Error('筛选参数无效。');
        location.hash = input.type;
        renderRoute();
        $('#search').value = input.query ?? '';
        resetGallery();
        return { type: route, result: $('#result-count').textContent };
      },
    }, { signal: lifecycle.signal })).catch(error => console.warn('广场工具注册未完成', error.message));
  } catch (error) { console.warn('当前浏览器不支持广场工具', error.message); }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
