import test from 'node:test';
import assert from 'node:assert/strict';
import { createPluginPublicationClient, publicPluginItem, publicPetItem, publicActivity, publicContributorFollowers, configuredSubmissionRepository, githubSubmissionUrl } from '../dist/publication-client.js';
import { zipPackage } from '../dist/package-core.js';

const id = 'community-12345678-1234-1234-1234-123456789abc';
const item = { id, kind: 'plugin', title: '社区插件', description: '两行\n说明', author: '作者', license: 'MIT', source: '原创', hostNotice: '按作品说明使用', pluginType: 'community-plugin', features: [], download: `/api/plugins/${id}/download`, cover: `/api/plugins/${id}/cover` };
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('本机404明确没有发布服务，匿名公开列表可读取且不发送POST', async () => {
  const calls = [];
  const client = createPluginPublicationClient(async (url, options) => { calls.push({ url, options }); return url === '/api/session' ? response({}, 404) : response({ items: [item] }); });
  assert.deepEqual(await client.session(), { available: false, interactionsAvailable: false, anonymousInteractions: false, signedIn: false, maxPackageBytes: 0 });
  const entries = await client.list();
  assert.equal(entries[0].id, id);
  assert.equal(entries[0].category, '社区作品');
  assert.equal(entries[0].description, '两行\n说明');
  assert.equal(calls.some(call => call.options.method === 'POST'), false);
  assert.ok(calls.every(call => call.options.credentials === 'same-origin'));
});

test('插件发布发送真实multipart元数据ZIP和独立封面，服务器确认后返回公开条目', async () => {
  const calls = [];
  const metadata = { title: '社区插件', id: 'author.plugin', description: '说明', author: '作者', license: 'MIT', source: '原创', workflow: 'plugin-import' };
  const archive = new Blob(['真实测试ZIP字节'], { type: 'application/zip' });
  const cover = { bytes: new Uint8Array([1, 2, 3]), mime: 'image/png', extension: 'png' };
  const client = createPluginPublicationClient(async (url, options) => { calls.push({ url, options }); return response({ item }, 201); });
  const published = await client.publish(metadata, archive, cover);
  assert.equal(published.download, item.download);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/plugins');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body.get('metadata')), metadata);
  assert.equal(calls[0].options.body.get('package').type, 'application/zip');
  assert.equal(await calls[0].options.body.get('package').text(), await archive.text());
  assert.deepEqual(new Uint8Array(await calls[0].options.body.get('cover').arrayBuffer()), cover.bytes);
  assert.equal(calls[0].options.headers['Content-Type'], undefined);
});

test('登录失效和服务错误不会伪报成功，不自动登录或重试POST', async () => {
  let count = 0;
  const client = createPluginPublicationClient(async () => { count++; return response({ error: '需要登录' }, 401); });
  await assert.rejects(client.publish({ workflow: 'plugin-make' }, new Blob(['ZIP']), null), error => error.status === 401 && error.message === '需要登录');
  assert.equal(count, 1);
  const failed = createPluginPublicationClient(async () => response({ error: '暂时不可用' }, 503));
  await assert.rejects(failed.publish({ workflow: 'plugin-import' }, new Blob(['ZIP']), null), error => error.status === 503);
  const noConfirmation = createPluginPublicationClient(async () => response({ item }, 202));
  await assert.rejects(noConfirmation.publish({ workflow: 'plugin-import' }, new Blob(['ZIP']), null), /没有确认/);
});

test('公开元数据只使用本站文件地址和安全社区ID，未知字段不混入卡片', () => {
  assert.throws(() => publicPluginItem({ ...item, id: '" onclick="alert(1)' }));
  assert.throws(() => publicPluginItem({ ...item, cover: 'javascript:alert(1)' }));
  assert.throws(() => publicPluginItem({ ...item, download: 'https://other.example/plugin.zip' }));
  const clean = publicPluginItem({ ...item, title: '<script>标题</script>', authorUrl: 'javascript:alert(1)', symbol: '<img onerror="alert(1)">', permissions: ['任意权限'] });
  assert.equal(clean.title, '<script>标题</script>');
  assert.equal(clean.authorUrl, undefined);
  assert.equal(clean.symbol, '✦');
  assert.deepEqual(clean.permissions, []);
  assert.equal(publicPluginItem({ ...item, source: '' }).source, '');
  assert.equal(publicPluginItem({ ...item, source: undefined }).source, '');
});

test('身份状态结构与32MB发布上限需要服务器明确提供，桌宠发布使用独立接口', async () => {
  const client = createPluginPublicationClient(async () => response({ available: true, signedIn: false, maxPackageBytes: 33554432 }));
  assert.equal((await client.session()).signedIn, false);
  const invalid = createPluginPublicationClient(async () => response({ available: true, signedIn: true, maxPackageBytes: 200 * 1024 * 1024 }));
  await assert.rejects(invalid.session(), /身份信息无效/);
  const pet = { ...item, kind: 'pet', atlas: null, thumbnail: 'assets/brand-logo.png', mediaActions: { calm: { displayName: '安静', type: 'video/mp4', url: `/api/pets/${id}/media/calm` } }, download: `/api/pets/${id}/download` };
  const calls = [];
  const petClient = createPluginPublicationClient(async (url, options) => { calls.push({ url, options }); return response({ item: pet }, 201); });
  assert.equal((await petClient.publish({ workflow: 'pet-make' }, new Blob(['ZIP']), null)).kind, 'pet');
  assert.equal(calls[0].url, '/api/pets');
  assert.throws(() => publicPetItem({ ...pet, atlas: 'https://other.example/evil.webp' }));
  assert.throws(() => publicPetItem({ ...pet, mediaActions: { calm: { ...pet.mediaActions.calm, url: 'javascript:alert(1)' } } }));
});

test('全站统计只接受有界整数，赞状态由服务器确认而非本浏览器假增长', async () => {
  const activity = { scope: 'site', items: { [id]: { likes: 2, downloads: 4, weekly: 5, liked: true } } };
  const calls = [];
  const client = createPluginPublicationClient(async (url, options) => { calls.push({ url, options }); return response(activity); });
  const result = await client.like(id, true);
  assert.equal(result[id].likes, 2);
  assert.equal(result[id].scope, 'site');
  assert.deepEqual(JSON.parse(calls[0].options.body), { liked: true });
  assert.throws(() => publicActivity({ ...activity, items: { [id]: { likes: -1, downloads: 4, weekly: 5, liked: true } } }));
});

test('导入的128个自定义动作全部保留，超出宿主界限明确拒绝而非截断', () => {
  const mediaActions = Object.fromEntries(Array.from({ length: 128 }, (_, index) => [`action-${index}`, { displayName: `动作${index}`, type: 'video/mp4', url: `/api/pets/${id}/media/action-${index}` }]));
  const pet = { ...item, kind: 'pet', thumbnail: 'assets/brand-logo.png', atlas: null, download: `/api/pets/${id}/download`, mediaActions };
  assert.equal(Object.keys(publicPetItem(pet).mediaActions).length, 128);
  assert.equal(publicPetItem(pet).mediaActions['action-127'].displayName, '动作127');
  assert.throws(() => publicPetItem({ ...pet, mediaActions: { ...mediaActions, extra: { displayName: '多余', type: 'video/mp4', url: `/api/pets/${id}/media/extra` } } }));
});

test('无账号匿名互动与作品投稿分离，未开放投稿不阻止真实统计读取', async () => {
  const data = { available: false, interactionsAvailable: true, anonymousInteractions: true, signedIn: false, maxPackageBytes: 33554432, error: '投稿尚未开放' };
  const client = createPluginPublicationClient(async () => response(data));
  assert.deepEqual(await client.session(), data);
  for (const patch of [{ interactionsAvailable: 'true' }, { anonymousInteractions: 1 }]) {
    await assert.rejects(createPluginPublicationClient(async () => response({ ...data, ...patch })).session(), /身份信息无效/);
  }
});

test('作者关注使用精确编码的署名和服务端回执，无接口不伪造关注者数量', async () => {
  const calls = [], states = [{ available: true, followers: 4, following: false }, { available: true, followers: 5, following: true }];
  const client = createPluginPublicationClient(async (url, options) => { calls.push({ url, options }); return response(states.shift()); });
  const author = '作者 / 中文';
  assert.deepEqual(await client.contributor(author, 'pets'), { available: true, followers: 4, following: false });
  assert.deepEqual(await client.followContributor(author, 'plugins', true), { available: true, followers: 5, following: true });
  assert.equal(calls[0].url, '/api/contributors/%E4%BD%9C%E8%80%85%20%2F%20%E4%B8%AD%E6%96%87?kind=pets');
  assert.equal(calls[1].url.endsWith('?kind=plugins'), true);
  assert.equal(calls[1].options.method, 'PUT'); assert.deepEqual(JSON.parse(calls[1].options.body), { following: true });
  assert.ok(calls.every(call => call.options.credentials === 'same-origin'));
  const missing = createPluginPublicationClient(async () => response({}, 404));
  assert.deepEqual(await missing.contributor('作者'), { available: false, followers: null, following: false });
});

test('关注失败不自动重试或乐观加数，坏回执和不合法参数明确拒绝', async () => {
  let calls = 0;
  const failed = createPluginPublicationClient(async () => { calls++; return response({ error: '服务不可用' }, 503); });
  await assert.rejects(failed.followContributor('作者', 'pets', true), error => error.status === 503);
  assert.equal(calls, 1);
  await assert.rejects(failed.followContributor('作者', 'pets', 'true'), /参数无效/);
  await assert.rejects(failed.contributor('作者\u0001'), /格式无效/);
  assert.equal(calls, 1);
  await assert.rejects(createPluginPublicationClient(async () => response({ available: true, followers: -1, following: true })).contributor('作者'), /关注信息无效/);
});

test('周下载与周点赞保留服务计数，缺省保持未知，坏字段不展示', () => {
  const base = { scope: 'site', items: { [id]: { likes: 4, downloads: 8, weekly: 6, liked: false, weeklyDownloads: 3, weeklyLikes: 3 } } };
  const result = publicActivity(base);
  assert.equal(result[id].weeklyDownloads, 3); assert.equal(result[id].weeklyLikes, 3);
  assert.equal(publicActivity({ scope: 'site', items: { [id]: { likes: 4, downloads: 8, weekly: 6, liked: false } } })[id].weeklyDownloads, undefined);
  assert.throws(() => publicActivity({ ...base, items: { [id]: { ...base.items[id], weeklyLikes: -1 } } }));
});

test('同一统计快照读取贡献者真实关注数，exact署名保留，未知不补零', async () => {
  const contributors = JSON.parse('{"作者":{"followers":3},"__proto__":{"followers":2}}');
  const data = { scope: 'site', items: { [id]: { likes: 4, downloads: 8, weekly: 6, liked: false, weeklyDownloads: 3, weeklyLikes: 3 } }, contributors };
  const client = createPluginPublicationClient(async url => { assert.equal(url, '/api/activity'); return response(data); });
  const snapshot = await client.activitySnapshot();
  assert.equal(snapshot.items[id].weeklyDownloads, 3);
  assert.equal(snapshot.contributors.get('作者'), 3); assert.equal(snapshot.contributors.get('__proto__'), 2);
  assert.equal(snapshot.contributors.get('未知作者'), undefined);
  assert.equal(publicContributorFollowers(undefined), null);
  assert.throws(() => publicContributorFollowers({ 作者: { followers: -1 } }));
  assert.throws(() => publicContributorFollowers({ 作者: { followers: '3' } }));
});

const repository = 'https://github.com/xunguangzlj-cloud/desktop-pet-community';
const submissionMetadata = { title: '可爱的桌宠', id: 'author.pet', description: '第一行\n第二行', author: 'Lykinzlj', license: 'MIT', workflow: 'pet-make', source: '不展示的原始来源' };
const archiveDetails = { name: 'author.pet-share.zip', bytes: 1024, sha256: 'a'.repeat(64) };

test('已核本站仓库允许无密码投稿，服务不能将用户作品转送其他仓库', async () => {
  const data = { available: false, signedIn: false, interactionsAvailable: true, anonymousInteractions: true, submissionAvailable: true, submissionRepository: repository, maxPackageBytes: 33554432 };
  const identity = await createPluginPublicationClient(async () => response(data)).session();
  assert.equal(identity.available, false); assert.equal(identity.signedIn, false);
  assert.equal(configuredSubmissionRepository(repository, identity), repository);
  assert.equal(configuredSubmissionRepository('', identity), '');
  assert.throws(() => configuredSubmissionRepository(repository, { ...identity, submissionRepository: 'https://github.com/legeling/awesome-codex-pet' }), /不一致/);
  for (const target of ['http://github.com/user/repo', 'https://github.com/user/repo/issues', 'https://other.example/user/repo', 'https://me:secret@github.com/user/repo', `${repository}?template=other`, `${repository}#main`]) {
    assert.throws(() => configuredSubmissionRepository(target, identity));
  }
  await assert.rejects(createPluginPublicationClient(async () => response({ ...data, submissionRepository: 'javascript:alert(1)' })).session());
});

test('四共创入口使用本站精确YAML表单字段预填，不误用body或包含隐藏来源', () => {
  for (const workflow of ['pet-make', 'pet-import', 'plugin-make', 'plugin-import']) {
    const url = new URL(githubSubmissionUrl(repository, { ...submissionMetadata, workflow }, archiveDetails, { actions: 'idle：待机；calm：思考', environment: 'desktop pet', version: '1.0.0', permissions: 'pet:speak' }));
    const pet = workflow.startsWith('pet-');
    assert.equal(`${url.origin}${url.pathname}`, `${repository}/issues/new`);
    assert.equal(url.searchParams.get('template'), pet ? 'pet-submission.yml' : 'plugin-submission.yml');
    for (const field of ['work_name', 'author', 'description', 'license', 'files', ...(pet ? ['actions', 'environment'] : ['version', 'permissions'])]) assert.ok(url.searchParams.get(field));
    assert.equal(url.searchParams.get('description'), submissionMetadata.description);
    assert.equal(url.searchParams.get('body'), null);
    assert.equal(url.searchParams.has('source'), false);
    assert.equal(url.href.includes(encodeURIComponent(submissionMetadata.source)), false);
    assert.match(url.searchParams.get('files'), new RegExp(workflow.endsWith('make') ? '制作' : '导入'));
    assert.match(url.searchParams.get('files'), /提交不代表自动上线/);
  }
});

test('表单记录实际完整ZIP字节与SHA，大包保留原件并引导PR而非假上传', async () => {
  const zip = zipPackage({ 'LICENSE.txt': new TextEncoder().encode('保留作者原许可') });
  const digest = await crypto.subtle.digest('SHA-256', await zip.arrayBuffer());
  const sha256 = Buffer.from(digest).toString('hex');
  const url = new URL(githubSubmissionUrl(repository, submissionMetadata, { ...archiveDetails, bytes: zip.size, sha256 }));
  assert.match(url.searchParams.get('files'), new RegExp(`包大小：${zip.size} 字节`));
  assert.match(url.searchParams.get('files'), new RegExp(sha256));
  assert.match(url.searchParams.get('files'), /拖入此处/);
  const large = new URL(githubSubmissionUrl(repository, submissionMetadata, { ...archiveDetails, bytes: 26 * 1024 * 1024 }));
  assert.match(large.searchParams.get('files'), /超过.*附件上限/);
  assert.doesNotMatch(large.searchParams.get('files'), /拖入此处/);
  for (const patch of [{ bytes: 0 }, { bytes: Number.NaN }, { sha256: '伪摘要' }]) assert.throws(() => githubSubmissionUrl(repository, submissionMetadata, { ...archiveDetails, ...patch }));
});

test('制作需求仅预填本站普通Issue，分类与版本保持，不伪装公共条目', () => {
  const url = new URL(githubSubmissionUrl(repository, { title: '小猫伙伴', description: '安静陪伴', category: '动物伙伴', version: 2, workflow: 'request' }));
  assert.equal(url.searchParams.has('template'), false);
  assert.match(url.searchParams.get('title'), /小猫伙伴/);
  assert.match(url.searchParams.get('body'), /动物伙伴/);
  assert.match(url.searchParams.get('body'), /V2/);
  assert.match(url.searchParams.get('body'), /未自动在网站发布/);
  assert.throws(() => githubSubmissionUrl(repository, { ...submissionMetadata, workflow: 'request', category: '动物伙伴', version: 3 }));
});
