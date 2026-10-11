import { collections, requestSeeds } from './community-data.js';
import { validateRequest, normalizeRequestState, rankPets, rankAuthors, collectionWorks, contributorHref, contributorProfile, workStatistics, contributorRankingStatistics } from './community-core.js';
import { petDisplayAuthor } from './catalog.js';
import { githubSubmissionUrl } from './publication-client.js';

export function createCommunityPages({ pets, plugins, activityFor, escapeHtml, icon, toast, copyGalleryText, download, browseGallery, publication, session, renderCard, statisticsSnapshot, refreshStatistics, submissionRepository }) {
  const $ = selector => document.querySelector(selector);
  const stateKey = 'pet-community-requests-v1';
  const seedIds = requestSeeds.map(item => item.id);
  let requestsSaved = true;
  let requestState;
  try {
    const saved = JSON.parse(localStorage.getItem(stateKey) ?? '{}');
    const publicIds = [...(Array.isArray(saved.supported) ? saved.supported : []), ...(Array.isArray(saved.following) ? saved.following : [])].filter(id => typeof id === 'string' && /^request-[a-f0-9-]{36}$/.test(id));
    requestState = normalizeRequestState(saved, [...seedIds, ...publicIds]);
  } catch {
    requestsSaved = false;
    requestState = normalizeRequestState({}, seedIds);
  }
  let collectionOffset = 0;
  let rankingTab = 'pets';
  let collectionFilter = 'all';
  let currentRoute = 'pets';
  let currentId;
  let currentAuthor;
  let contributorGeneration = 0;
  let contributorState = null;
  let contributorPending = false;
  let contributorIdentity = null;
  let publicRequests = [];
  let requestPublishing = false;

  function saveRequests() {
    try {
      localStorage.setItem(stateKey, JSON.stringify(requestState));
      requestsSaved = true;
    } catch {
      requestsSaved = false;
      toast('浏览器未允许保存，制作需求与关注仅在当前页面保留。');
    }
  }

  function petRanking(period, entries = pets) {
    return rankPets(entries, Object.fromEntries(entries.map(work => [work.id, activityFor(work.id)])), period, Date.now());
  }

  function rankingRows(entries, kind, period = 'week') {
    if (!entries.length) return '<li class="community-empty">还没有互动记录。去广场为喜欢的伙伴点赞或下载，它就会出现在这里。</li>';
    return entries.map((entry, index) => {
      const plugin = kind === 'plugins' || kind === 'plugin-authors';
      const author = kind === 'authors' || kind === 'plugin-authors';
      const entries = plugin ? plugins : pets;
      const work = author ? entries.find(item => item.id === entry.petIds[0]) : entry.work;
      const href = author ? contributorHref(entry.name, plugin ? 'plugins' : 'pets') : `#${plugin ? 'plugins' : 'pets'}/${work.id}`;
      const label = author ? plugin ? entry.name : petDisplayAuthor(work) : work.title;
      const metric = author ? `${entry.count} ${plugin ? '个插件' : '只宠物'}` : `${period === 'week' ? '近 7 日' : '累计'} ${entry.count}`;
      const cover = work.cover || work.presentation?.cover;
      const visual = plugin ? cover ? `<img src="${escapeHtml(cover)}" alt="" width="48" height="52">` : `<span class="community-rank-symbol" aria-hidden="true">${escapeHtml(work.symbol || '✧')}</span>` : `<img class="${author ? 'community-author-avatar' : ''}" src="${escapeHtml(work.thumbnail)}" alt="" width="48" height="52">`;
      return `<li class="community-ranking-row"><span class="community-rank-position">${index + 1}</span><a class="community-rank-work" href="${escapeHtml(href)}">${visual}<span>${escapeHtml(label)}</span></a><span class="community-rank-value">${metric}</span></li>`;
    }).join('');
  }

  function collectionCard(item) {
    const members = collectionWorks(item, pets);
    return `<article class="community-collection-card"><a class="community-collection-visual" href="#collections/${item.id}" aria-label="浏览 ${escapeHtml(item.title)}">${members.slice(0, 5).map(work => `<img src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)}" loading="lazy" width="192" height="208">`).join('')}</a><button type="button" class="community-collection-share" data-share-collection="${item.id}" aria-label="分享 ${escapeHtml(item.title)}">${icon('share')}</button><div class="community-collection-body"><p class="community-collection-kind">${item.type === 'franchise' ? '作品系列' : '主题系列'}</p><div class="community-collection-title-row"><h3><a href="#collections/${item.id}">${escapeHtml(item.title)}</a></h3><span>${members.length} 只宠物</span></div><p class="community-collection-description">${escapeHtml(item.description)}</p></div></article>`;
  }

  function allRequests() {
    return [...publicRequests, ...requestState.entries.slice().reverse(), ...requestSeeds];
  }

  function requestCard(item) {
    const supported = requestState.supported.includes(item.id);
    const following = requestState.following.includes(item.id);
    const local = item.id.startsWith('local-');
    const image = item.thumbnail ? `<img src="${escapeHtml(item.thumbnail)}" alt="参考外观" loading="lazy" width="192" height="208">` : '<span aria-hidden="true">✧</span><small>你的角色创意</small>';
    const date = item.createdAtISO || item.updatedAt;
    const reference = local ? '我的制作需求' : item.public ? '社区制作需求' : '创作提案示例';
    return `<article class="community-request-card" id="request-${item.id}"><div class="community-request-visual">${image}</div><div class="community-request-body"><div class="community-request-meta"><span>待制作</span><small>${escapeHtml(item.category)} · V${item.version}</small></div><h3 class="community-request-title">${escapeHtml(item.title)}</h3><p class="community-request-description">${escapeHtml(item.description)}</p><div class="community-request-footnote"><span>${reference}</span><span>${date ? escapeHtml(String(date).slice(0, 10)) : '等你开始'}</span></div><div class="community-request-actions"><button class="primary" type="button" data-request-support="${item.id}" aria-pressed="${supported}">${icon('heart')} ${supported ? '已支持' : '我也想要'} <span>${supported ? 1 : 0}</span></button><button class="secondary" type="button" data-request-follow="${item.id}" aria-pressed="${following}">${following ? '已关注' : '关注进度'}</button></div></div></article>`;
  }

  function renderHome() {
    $('#home-pet-count').textContent = pets.length;
    $('#home-collected-count').textContent = `已收录 ${pets.length} 只精品宠物`;
    $('#home-category-count').textContent = new Set(pets.map(item => item.category)).size;
    const featured = pets.slice(0, 6);
    $('#hero-pets').innerHTML = featured.map(work => `<a class="home-pet-card" href="#pets/${work.id}"><img src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)}" width="192" height="208"><span>${escapeHtml(work.title)}</span></a>`).join('');
    $('#home-pet-ranking').innerHTML = rankingRows(petRanking('week').slice(0, 5), 'pets');
    $('#home-author-ranking').innerHTML = rankingRows(rankAuthors(pets).slice(0, 5), 'authors');
    $('#request-preview').innerHTML = allRequests().slice(0, 4).map(requestCard).join('');
    $('#collection-preview').innerHTML = Array.from({ length: Math.min(3, collections.length) }, (_, index) => collectionCard(collections[(collectionOffset + index) % collections.length])).join('');
  }

  function rankingSelection() {
    return { kind: rankingTab.startsWith('plugin') ? 'plugins' : 'pets', view: rankingTab.includes('authors') ? 'authors' : rankingTab.includes('collections') ? 'collections' : 'works' };
  }

  function rankingRoute(kind, view) {
    return view === 'works' ? kind : view === 'authors' ? kind === 'plugins' ? 'plugin-authors' : 'authors' : kind === 'plugins' ? 'plugin-collections' : 'collections';
  }

  function activityMap(entries) {
    return Object.fromEntries(entries.map(work => [work.id, activityFor(work.id)]));
  }

  function rankVisual(members, kind) {
    return `<span class="ranking-mosaic ${kind === 'plugins' ? 'ranking-plugin-mosaic' : ''}">${members.slice(0, 4).map(work => {
      const cover = kind === 'plugins' ? work.cover || work.presentation?.cover : work.thumbnail;
      return cover ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy" width="72" height="78">` : `<span aria-hidden="true">${escapeHtml(work.symbol || '✦')}</span>`;
    }).join('')}</span>`;
  }

  function rankLongRow(item, index, kind, period, available) {
    const metric = value => value === null || value === undefined ? '—' : value.toLocaleString('zh-CN');
    const stats = item.statistics;
    const identity = `<span class="ranking-identity"><strong>${escapeHtml(item.title)}</strong>${item.handle ? `<span class="ranking-handle">@${escapeHtml(item.handle.replace(/^@/, ''))}</span>` : ''}<small>${escapeHtml(item.subtitle)}</small></span>`;
    const columns = item.contributor ? [[period === 'week' ? stats.weeklyDownloads : stats.downloads, period === 'week' ? '近 7 日下载' : '下载'], [period === 'week' ? stats.weeklyLikes : stats.likes, period === 'week' ? '近 7 日点赞' : '点赞'], [item.followers, '关注者']] : [[available ? period === 'week' ? stats.weekly : stats.downloads + stats.likes : null, period === 'week' ? '近 7 日互动' : '累计互动'], [stats.downloads, '下载'], [stats.likes, '点赞']];
    return `<li class="community-ranking-row ranking-long-row"><span class="community-rank-position">${String(index + 1).padStart(2, '0')}</span><a class="ranking-entry" href="${escapeHtml(item.href)}"${item.category ? ` data-ranking-category="${escapeHtml(item.category)}"` : ''}>${rankVisual(item.members, kind)}${identity}</a><dl class="ranking-metrics">${columns.map(([value, label]) => `<div><dd>${metric(value)}</dd><dt>${label}</dt></div>`).join('')}</dl></li>`;
  }

  function renderRankings() {
    const { kind, view } = rankingSelection(), period = $('#ranking-period').value;
    const entries = kind === 'plugins' ? plugins : pets;
    const snapshot = statisticsSnapshot(), activity = activityMap(entries);
    $('#ranking-kinds').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rankingKind === kind)));
    $('#ranking-tabs').querySelectorAll('button').forEach(button => { const selected = button.dataset.rankingView === view; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
    $('#ranking-period-buttons').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rankingPeriod === period)));
    $('#ranking-scope').textContent = `${kind === 'plugins' ? '插件' : '桌宠'} · ${snapshot.scope === 'site' ? '全站真实互动' : '此浏览器记录'}${snapshot.available ? ` · ${period === 'week' ? '近 7 日' : '累计'}互动排序` : ' · 统计暂不可用'}`;
    const timestamp = new Date(snapshot.updatedAt);
    $('#ranking-snapshot').textContent = snapshot.available && Number.isFinite(timestamp.getTime()) ? timestamp.toLocaleString('zh-CN', { hour12: false }) : '—';
    $('#ranking-refresh').textContent = '打开页面与互动后读取';
    let rows;
    if (view === 'authors') {
      rows = rankAuthors(entries).map(author => {
        const profile = contributorProfile([...pets, ...plugins], author.name, kind, activity, snapshot.available);
        return { title: author.name, handle: profile.handle, subtitle: `本站贡献 ${profile.members.length} ${kind === 'plugins' ? '个插件' : '只桌宠'}`, members: profile.members, href: contributorHref(author.name, kind), contributor: true, followers: snapshot.contributors?.get(author.name) ?? null, statistics: contributorRankingStatistics(profile.members, activity, snapshot.available) };
      });
    } else if (view === 'collections') {
      rows = kind === 'pets' ? collections.map(item => ({ title: item.title, members: collectionWorks(item, pets), href: `#collections/${item.id}` })) : [...new Set(plugins.map(work => work.category))].map(category => ({ title: category, members: plugins.filter(work => work.category === category), href: '#plugins', category }));
      rows = rows.filter(item => item.members.length).map(item => ({ ...item, subtitle: `${item.members.length} ${kind === 'plugins' ? '个插件' : '只桌宠'}`, statistics: workStatistics(item.members, activity, snapshot.available) }));
    } else {
      rows = snapshot.available ? petRanking(period, entries).map(entry => ({ title: entry.work.title, members: [entry.work], href: `#${kind}/${entry.work.id}`, handle: entry.work.authorHandle, subtitle: `作者 ${entry.work.author}`, statistics: workStatistics([entry.work], activity) })) : [];
    }
    if (view !== 'works' && snapshot.available) rows.sort((a, b) => (period === 'week' ? b.statistics.weekly - a.statistics.weekly : b.statistics.downloads + b.statistics.likes - a.statistics.downloads - a.statistics.likes) || b.members.length - a.members.length || a.title.localeCompare(b.title, 'zh-CN'));
    $('#ranking-list').innerHTML = rows.length ? rows.map((item, index) => rankLongRow(item, index, kind, period, snapshot.available)).join('') : `<li class="community-empty">${snapshot.available ? '还没有互动记录。为喜欢的作品点赞或下载后，这里会显示实际排名。' : '统计暂不可用，请稍后刷新。'}</li>`;
  }

  function displayContributorState() {
    const available = contributorState?.available === true;
    $('#contributor-followers').textContent = available ? contributorState.followers.toLocaleString('zh-CN') : '—';
    $('#contributor-follow').disabled = !available || contributorPending;
    $('#contributor-follow').setAttribute('aria-pressed', String(available && contributorState.following));
    $('#contributor-follow').textContent = contributorPending ? '正在保存…' : available && contributorState.following ? '已关注' : '关注';
    $('#contributor-follow-status').textContent = contributorPending ? '正在读取关注状态…' : contributorState?.error || (available ? '' : '关注服务暂不可用。');
  }

  function renderContributor(kind, encodedAuthor) {
    kind = kind === 'plugins' ? 'plugins' : 'pets';
    let author;
    try { author = decodeURIComponent(encodedAuthor || ''); } catch { author = ''; }
    const snapshot = statisticsSnapshot();
    const profile = contributorProfile([...pets, ...plugins], author, kind, activityMap([...pets, ...plugins]), snapshot.available);
    $('#contributor-back').href = `#rankings/${kind === 'plugins' ? 'plugin-authors' : 'authors'}`;
    $('#contributor-name').textContent = profile?.name || '未找到此创作者';
    $('#contributor-handle').textContent = profile?.handle ? `@${profile.handle.replace(/^@/, '')}` : '';
    $('#contributor-description').textContent = profile ? `本站贡献 ${profile.allCount} 件作品` : '请从本站榜单选择一位创作者。';
    $('#contributor-work-count').textContent = profile?.members.length ?? '—';
    $('#contributor-downloads').textContent = profile?.statistics.downloads?.toLocaleString('zh-CN') ?? '—';
    $('#contributor-likes').textContent = profile?.statistics.likes?.toLocaleString('zh-CN') ?? '—';
    $('#contributor-homepage').hidden = !profile?.homepage;
    $('#contributor-homepage-unavailable').hidden = Boolean(profile?.homepage);
    if (profile?.homepage) $('#contributor-homepage').href = profile.homepage; else $('#contributor-homepage').removeAttribute('href');
    $('#contributor-homepage-unavailable').title = '作者未提供主页';
    $('#contributor-works-title').textContent = profile ? `${profile.name} 的${kind === 'plugins' ? '插件' : '桌宠'}` : '创作者的作品';
    $('#contributor-kind-tabs').innerHTML = profile ? `<a class="button ${kind === 'pets' ? 'primary' : 'secondary'}" href="${escapeHtml(contributorHref(author, 'pets'))}" aria-current="${kind === 'pets' ? 'page' : 'false'}">桌宠 ${profile.petCount}</a><a class="button ${kind === 'plugins' ? 'primary' : 'secondary'}" href="${escapeHtml(contributorHref(author, 'plugins'))}" aria-current="${kind === 'plugins' ? 'page' : 'false'}">插件 ${profile.pluginCount}</a>` : '';
    $('#contributor-statistics-scope').textContent = `${snapshot.scope === 'site' ? '全站' : '此浏览器'}${snapshot.available ? '下载与点赞' : '统计暂不可用'} · 当前作品类型 · 下载不代表安装成功`;
    $('#contributor-works').innerHTML = profile?.members.length ? profile.members.map(work => renderCard(work)).join('') : '<p class="community-empty">本站暂无此类型作品。</p>';
    const usable = Boolean(session()?.interactionsAvailable || session()?.available);
    const key = `${kind}/${author}/${usable}`;
    if (contributorIdentity?.key === key) { displayContributorState(); return; }
    const generation = ++contributorGeneration;
    contributorIdentity = { key, author, kind };
    contributorState = null;
    contributorPending = Boolean(profile && usable);
    displayContributorState();
    if (!contributorPending) return;
    void publication.contributor(author, kind).then(state => {
      if (generation === contributorGeneration) contributorState = state;
    }).catch(error => {
      if (generation === contributorGeneration) contributorState = { available: false, error: error.message };
    }).finally(() => {
      if (generation === contributorGeneration) { contributorPending = false; displayContributorState(); }
    });
  }

  function renderPluginRankings() {
    $('#home-plugin-ranking').innerHTML = rankingRows(petRanking('week', plugins).slice(0, 5), 'plugins');
    $('#home-plugin-author-ranking').innerHTML = rankingRows(rankAuthors(plugins).slice(0, 5), 'plugin-authors');
  }

  function renderCollections(id) {
    const item = collections.find(entry => entry.id === id);
    $('#collection-detail').hidden = !item;
    $('#collection-list').hidden = Boolean(item);
    $('.community-collection-toolbar').hidden = Boolean(item);
    if (item) {
      $('#collection-detail-title').textContent = item.title;
      $('#collection-detail-description').textContent = item.description;
      $('#collection-pets').innerHTML = collectionWorks(item, pets).map(work => `<article class="work-card"><div class="card-stage"><a class="card-preview" href="#pets/${work.id}"><img src="${escapeHtml(work.thumbnail)}" alt="${escapeHtml(work.title)}" width="192" height="208"></a></div><div class="card-body"><h2><a href="#pets/${work.id}">${escapeHtml(work.title)}</a></h2><p class="byline">作者 ${escapeHtml(petDisplayAuthor(work))}</p><div class="card-actions"><a class="button secondary" href="#pets/${work.id}">预览动作</a><a class="button primary" href="${escapeHtml(work.download)}" download data-download="${work.id}">下载 ZIP</a></div></div></article>`).join('');
    } else {
      const query = $('#collection-search').value.trim().toLocaleLowerCase();
      const matches = collections.filter(entry => (collectionFilter === 'all' || entry.type === collectionFilter) && `${entry.title} ${entry.description} ${collectionWorks(entry, pets).map(work => work.title).join(' ')}`.toLocaleLowerCase().includes(query));
      $('#collection-list').innerHTML = matches.length ? matches.map(collectionCard).join('') : '<p class="community-empty">没有匹配的合集，换个关键词试试。</p>';
      $('#collection-filter').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collectionFilter === collectionFilter)));
      if (id) toast('此合集不存在，请从列表重新选择。');
    }
  }

  function renderRequests() {
    const query = $('#request-search').value.trim().toLocaleLowerCase();
    const followingOnly = $('#request-state').value === 'following';
    const matches = allRequests().filter(item => (!followingOnly || requestState.following.includes(item.id)) && `${item.title} ${item.description} ${item.category}`.toLocaleLowerCase().includes(query));
    $('#request-list').innerHTML = matches.length ? matches.map(requestCard).join('') : '<p class="community-empty">暂时没有匹配的制作需求。写下你的角色想法，或关注一项提案。</p>';
  }

  function render(route, id, author) {
    currentRoute = route;
    currentId = id;
    currentAuthor = author;
    if (route === 'pets') renderHome();
    if (route === 'plugins') renderPluginRankings();
    if (route === 'rankings') { if (['pets', 'plugins', 'authors', 'plugin-authors', 'collections', 'plugin-collections'].includes(id)) rankingTab = id; renderRankings(); }
    if (route === 'contributors') renderContributor(id, author);
    if (route === 'collections') renderCollections(id);
    if (route === 'requests') renderRequests();
  }

  for (const [selector, step] of [['#collection-prev', -1], ['#collection-next', 1]]) {
    $(selector).addEventListener('click', () => {
      collectionOffset = (collectionOffset + step + collections.length) % collections.length;
      renderHome();
    });
  }
  $('#ranking-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-ranking-view]');
    if (button) { rankingTab = rankingRoute(rankingSelection().kind, button.dataset.rankingView); location.hash = `rankings/${rankingTab}`; renderRankings(); }
  });
  $('#ranking-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = ['works', 'authors', 'collections'], selection = rankingSelection();
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabs.indexOf(selection.view) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    rankingTab = rankingRoute(selection.kind, tabs[index]);
    location.hash = `rankings/${rankingTab}`;
    renderRankings();
    $(`#ranking-tabs [data-ranking-view="${tabs[index]}"]`).focus();
  });
  $('#ranking-kinds').addEventListener('click', event => {
    const button = event.target.closest('[data-ranking-kind]');
    if (button) { rankingTab = rankingRoute(button.dataset.rankingKind, rankingSelection().view); location.hash = `rankings/${rankingTab}`; renderRankings(); }
  });
  $('#ranking-period-buttons').addEventListener('click', event => {
    const button = event.target.closest('[data-ranking-period]');
    if (button) { $('#ranking-period').value = button.dataset.rankingPeriod; renderRankings(); }
  });
  $('#ranking-period').addEventListener('change', renderRankings);
  $('#contributor-follow').addEventListener('click', async () => {
    if (contributorPending || contributorState?.available !== true || !contributorIdentity) return;
    const generation = contributorGeneration, { author, kind } = contributorIdentity;
    const following = !contributorState.following;
    contributorPending = true; displayContributorState();
    try {
      const state = await publication.followContributor(author, kind, following);
      if (generation === contributorGeneration) { contributorState = state; await refreshStatistics?.(); }
    } catch (error) {
      if (generation === contributorGeneration) { contributorState = { ...contributorState, error: error.message }; toast(error.message); }
    } finally { if (generation === contributorGeneration) { contributorPending = false; displayContributorState(); } }
  });
  $('#collection-search').addEventListener('input', () => renderCollections());
  $('#collection-filter').addEventListener('click', event => {
    const button = event.target.closest('[data-collection-filter]');
    if (button) { collectionFilter = button.dataset.collectionFilter; renderCollections(); }
  });
  $('#request-search').addEventListener('input', renderRequests);
  $('#request-state').addEventListener('change', renderRequests);
  $('#request-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (requestPublishing) return;
    const form = event.currentTarget;
    const submissionLink = $('#request-submission-link');
    submissionLink.hidden = true; submissionLink.removeAttribute('href');
    try {
      const input = validateRequest(Object.fromEntries(new FormData(form)));
      const existing = requestState.entries.find(item => item.title === input.title && item.description === input.description && item.category === input.category && item.version === input.version);
      if (!existing) {
        if (requestState.entries.length >= 100) throw new Error('已保存 100 项需求，请先导出已有需求。');
        requestState.entries.push({ ...input, id: `local-${crypto.randomUUID()}`, status: 'waiting', createdAtISO: new Date().toISOString() });
      }
      saveRequests();
      if (event.submitter?.id === 'request-publish') {
        requestPublishing = true; $('#request-publish').disabled = true;
        const repository = submissionRepository?.();
        if (repository) {
          const href = githubSubmissionUrl(repository, { ...input, workflow: 'request' });
          const link = $('#request-submission-link'); link.href = href; link.hidden = false;
          window.open(href, '_blank', 'noopener,noreferrer');
          $('#request-feedback').textContent = `${requestsSaved ? '需求草稿已保存。' : '需求保留在当前页面，浏览器未允许持久保存。'}请在本站 GitHub 投稿表单提交，处理收录后才会在网站显示；也可点击下方链接打开表单。`;
          renderRequests(); return;
        }
        const identity = await publication.session();
        if (!identity.available) throw new Error('本机页面不提供公共投稿，草稿已保存。请到公开共创平台发布。');
        if (!identity.signedIn) throw new Error('草稿已保存，投稿入口尚未开放。');
        const item = await publication.publishRequest(input);
        publicRequests = [item, ...publicRequests.filter(request => request.id !== item.id)];
        $('#request-feedback').textContent = '制作需求已发布到需求广场。';
        form.reset(); renderRequests(); return;
      }
      $('#request-feedback').textContent = requestsSaved ? '制作需求已保存到此浏览器。可导出交给你选择的 AI；尚未公开投稿。' : '需求已加入当前页面；浏览器未允许持久保存，请及时导出。';
      form.reset();
      $('#request-search').value = '';
      $('#request-state').value = 'all';
      renderRequests();
    } catch (error) { $('#request-feedback').textContent = error.message; }
    finally {
      requestPublishing = false;
      try { $('#request-publish').disabled = !submissionRepository?.() && !session()?.available; }
      catch { $('#request-publish').disabled = true; }
    }
  });
  $('#export-requests').addEventListener('click', () => {
    const wanted = allRequests().filter(item => item.id.startsWith('local-') || requestState.supported.includes(item.id) || requestState.following.includes(item.id));
    if (!wanted.length) { toast('先保存一项制作需求，或支持、关注一项提案，再导出。'); return; }
    const content = `# 我的桌宠制作需求\n\n以下是用户的角色创意，可交给用户选择的任意 AI 协助设计。此文件未向公共社区投稿。\n\n${wanted.map(item => `## ${item.title}\n\n- 分类：${item.category}\n- 图集版本：V${item.version}\n- 状态：待制作\n\n${item.description}\n`).join('\n')}\n完整图集尺寸和九组动作要求请参见网站共创工作台的制作说明。保留角色来源与许可，不把静态头像当作完整动画。\n`;
    $('#request-export').hidden = false;
    $('#request-export-text').value = content;
    $('#request-feedback').textContent = '制作需求说明已生成，下方可直接复制；保存链接用于下载 Markdown。';
    download(new Blob([content], { type: 'text/markdown;charset=utf-8' }), '我的桌宠制作需求.md');
  });
  $('#copy-request-export').addEventListener('click', () => {
    void copyGalleryText($('#request-export-text').value, '制作需求已复制，可以交给你选择的 AI。');
  });
  document.addEventListener('click', async event => {
    const support = event.target.closest('[data-request-support], [data-request-follow]');
    if (support) {
      const id = support.dataset.requestSupport || support.dataset.requestFollow;
      if (!allRequests().some(item => item.id === id)) return;
      const key = support.dataset.requestSupport ? 'supported' : 'following';
      const index = requestState[key].indexOf(id);
      if (index < 0) requestState[key].push(id);
      else requestState[key].splice(index, 1);
      saveRequests();
      render(currentRoute, currentId, currentAuthor);
      const attribute = key === 'supported' ? 'data-request-support' : 'data-request-follow';
      Array.from(document.querySelectorAll(`[${attribute}]`)).find(button => button.getAttribute(attribute) === id && button.closest(currentRoute === 'requests' ? '#request-list' : '#request-preview'))?.focus({ preventScroll: true });
    }
    const share = event.target.closest('[data-share-collection]');
    if (share) {
      const url = new URL(location.href);
      url.hash = `collections/${share.dataset.shareCollection}`;
      await copyGalleryText(url.href, url.hostname === '127.0.0.1' ? '本机合集链接已复制；其他电脑请分享作品 ZIP。' : '合集链接已复制。');
    }
    const author = event.target.closest('[data-author-filter]');
    if (author) { event.preventDefault(); browseGallery(author.dataset.authorFilter, author.dataset.authorKind || 'pets'); }
    const category = event.target.closest('[data-ranking-category]');
    if (category) { event.preventDefault(); browseGallery(category.dataset.rankingCategory, 'plugins'); }
  });
  return { render, refresh: () => render(currentRoute, currentId, currentAuthor), setPublicRequests(items) { publicRequests = items; requestState = normalizeRequestState(requestState, [...seedIds, ...items.map(item => item.id)]); render(currentRoute, currentId, currentAuthor); } };
}
