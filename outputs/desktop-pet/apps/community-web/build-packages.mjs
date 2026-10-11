import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { pets, petCredit, templates, templateCredit, toolPlugins } from './dist/catalog.js';
import { petManifest, pluginManifest, shareNotes, zipPackage } from './dist/package-core.js';
import { sourcePluginPackage, sourcePluginLicense } from './source-plugin-packages.mjs';
import { assetAttribution } from './upstream-assets.mjs';
import { pluginCovers } from './dist/plugin-covers.js';

const sourcePluginInfo = [
  ['openpets.reminders', '快速提醒', '提醒与计时', '提'],
  ['openpets.simple-timer', '轻量计时器', '提醒与计时', '时'],
  ['openpets.anxiety-aid-tools', 'Anxiety Aid Tools', '身心陪伴', '心'],
  ['openpets.focus-buddy', '专注伙伴', '提醒与计时', '专'],
  ['openpets.launch-buddy', '启动问候', '生活陪伴', '候'],
  ['openpets.fortune-cookie', '每日幸运饼干', '生活陪伴', '签'],
  ['openpets.virtual-pet', '虚拟宠物', '生活陪伴', '宠'],
  ['openpets.life-companion', '生活伙伴', '生活陪伴', '伴'],
  ['openpets.water-reminder', '喝水提醒', '提醒与计时', '水'],
  ['openpets.system-resources', '系统资源', '资源与工具', '仪'],
  ['openpets.calendar-airmail', '日历航空邮件', '资源与工具', '历'],
  ['openpets.day-routine', '早晚日常', '生活陪伴', '晨'],
  ['openpets.magic-8-ball', '魔法 8 号球', '生活陪伴', '球'],
  ['openpets.mood-check-in', '心情签到', '身心陪伴', '晴'],
  ['regis.usage-buddy', 'AI 额度伙伴', '资源与工具', '额', 'community', '从另行运行的本机监控程序读取 Claude／Codex 额度，并按配置提醒。'],
  ['openpets.higgsfield-watch', 'Higgsfield 进度伙伴', '资源与工具', '绘', 'community', '配置自己的 Higgsfield 令牌后，让桌宠报告图像与视频生成进度。'],
  ['openpets.drag-vocab', '拖拽词汇助手', '学习与效率', '词', 'community', '拖入词汇查看网络释义与翻译；连接 AnkiConnect 后可选保存单词卡。'],
  ['openpets.spotify-buddy', 'Spotify 音乐伙伴', '生活陪伴', '乐', 'community', '配置 Spotify 应用 ID 并授权账号后，让桌宠陪听、报告曲目与控制播放。'],
  ['openpets.walkabout', '桌面漫步', '生活陪伴', '步', 'community', '批准移动权限后，让桌宠随机漫步、跟随鼠标或往返巡游。'],
];
const permissionNames = {
  'pet:speak': '桌宠台词', 'pet:reaction': '动作反应', 'pet:interact': '互动气泡', 'pet:pin': '固定气泡',
  'pets:read': '桌宠状态', 'system:metrics': '只读资源指标', 'ui:session': '练习面板', 'ui:delivery': '信使提醒',
  schedule: '定时调度', storage: '插件存档', commands: '主动命令', status: '运行状态', audio: '声音',
  events: '交互事件', bus: '插件协同', notify: '系统提醒', network: '网络访问', auth: '外部服务授权',
  'network:local': '本机网络', 'network:write': '网络写入', 'pet:drop': '拖入文本', 'pet:move': '桌宠移动',
  secrets: '本机秘密存储', 'ui:toast': '状态提示',
};
const configurationNotes = {
  'regis.usage-buddy': '需要用户另行运行 usage-monitor-for-claude-and-codex 本机监控程序，并确认插件可访问其 127.0.0.1:45455 端点；插件本身不直接读取云端账号额度。',
  'openpets.higgsfield-watch': '需要用户在本机插件配置填写自己的 Higgsfield 访问令牌，插件仅向声明的 Higgsfield 服务查询生成进度；网站不接收令牌。',
  'openpets.drag-vocab': '释义与翻译需要网络访问。保存单词到 Anki 为可选操作，需要用户另行运行 Anki 与 AnkiConnect，并选择对应牌组。',
  'openpets.spotify-buddy': '需要在本机插件配置提供可用的 Spotify 应用 Client ID，再通过插件命令完成账号授权；当前源码使用宿主 OAuth，不要求旧 README 中的 ngrok 桥接。播放控制还受 Spotify 账号和服务权限限制。',
  'openpets.walkabout': '启用后会按配置移动桌宠，需要批准桌宠移动权限；可选择随机漫步、跟随鼠标或往返巡游。',
};

const files = [];
for (const pet of pets) {
  // 已确认的完整图集包保留原始许可及附件，不能重新生成简化包。
  if (pet.atlas && pet.archiveSha256) {
    const archiveBytes = await readFile(new URL(`./dist/${pet.download}`, import.meta.url));
    if (createHash('sha256').update(archiveBytes).digest('hex') !== pet.archiveSha256 || archiveBytes.length !== pet.archiveBytes) throw new Error(`完整桌宠包与登记摘要不一致：${pet.id}`);
    files.push({ path: pet.atlas, mime: 'image/webp' }, { path: pet.thumbnail, mime: 'image/webp' }, { path: pet.download, mime: 'application/zip' });
    continue;
  }
  if (!pet.atlas) {
    // 独立动作包保留已经验收的原ZIP；原应用使用固定官方完整发行地址。
    if (!['media', 'standalone'].includes(pet.distribution)) throw new Error(`桌宠分发类型缺失：${pet.id}`);
    files.push({ path: pet.thumbnail, mime: 'image/webp' });
    if (pet.distribution === 'media') {
      if (!pet.mediaActions?.idle) throw new Error(`动作包公开文件不完整：${pet.id}`);
      if (pet.download.startsWith('assets/')) {
        files.push({ path: pet.download, mime: 'application/zip' });
      } else {
        const url = new URL(pet.download);
        if (url.protocol !== 'https:' || url.username || url.password || !pet.packageManifest || !pet.packageLicense) throw new Error(`外部完整动作包登记无效：${pet.id}`);
        files.push({ path: pet.packageManifest, mime: 'application/json' }, { path: pet.packageLicense, mime: 'text/plain; charset=utf-8' });
      }
      if (pet.packageManifest) files.push({ path: pet.packageManifest, mime: 'application/json' });
      if (pet.packageLicense) files.push({ path: pet.packageLicense, mime: 'text/plain; charset=utf-8' });
      for (const entry of Object.values(pet.mediaActions)) files.push({ path: entry.url, mime: entry.type });
    } else {
      // 两张 BongoCat 封面沿用原模型画稿，随公开图片保留完整 MIT 声明。
      if (['bongocat-vladelaina', 'bongocat-ayangweb'].includes(pet.id)) {
        files.push({ path: `assets/pets/adapted-20261010/${pet.id}/LICENSE-MIT.txt`, mime: 'text/plain; charset=utf-8' });
      }
      for (const address of [pet.download, ...(pet.secondaryDownloads || []).map(file => file.url)]) {
        const url = new URL(address);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`原应用下载地址无效：${pet.id}`);
      }
    }
    continue;
  }
  const image = await readFile(new URL(`./dist/${pet.atlas}`, import.meta.url));
  let contents;
  if (pet.assetSource) {
    if (pet.assetSource !== `upstream-pets/${pet.id}`) throw new Error(`原件目录不符合固定路径：${pet.id}`);
    const source = new URL(`./${pet.assetSource}/`, import.meta.url);
    contents = {};
    for (const name of ['pet.json', 'submission.json', 'spritesheet.webp', 'ORIGINAL-ASSETS-LICENSE.md', 'ORIGINAL-REPOSITORY-LICENSE']) contents[name] = await readFile(new URL(name, source));
    if (!image.equals(contents['spritesheet.webp'])) throw new Error(`公开图集与原件不同：${pet.id}`);
    contents['ASSET-TERMS.txt'] = pet.license;
    contents['ATTRIBUTION.md'] = assetAttribution(pet);
    contents['SHARE.md'] = shareNotes(pet.title, petCredit(pet), 'pet');
  } else {
    const manifest = petManifest({ id: pet.id, displayName: pet.title, description: pet.description }, pet.version);
    contents = { 'pet.json': JSON.stringify(manifest, null, 2), 'spritesheet.webp': image, 'SHARE.md': shareNotes(pet.title, petCredit(pet), 'pet') };
  }
  const petZip = zipPackage(contents);
  await writeFile(new URL(`./dist/${pet.download}`, import.meta.url), Buffer.from(await petZip.arrayBuffer()));
  files.push({ path: pet.atlas, mime: 'image/webp' }, { path: pet.thumbnail, mime: 'image/webp' }, { path: pet.download, mime: 'application/zip' });
}
for (const template of templates) {
  const plugin = pluginManifest(template);
  const archive = zipPackage({ 'openpets.plugin.json': JSON.stringify(plugin, null, 2), 'SHARE.md': shareNotes(plugin.name, templateCredit, 'plugin') });
  await writeFile(new URL(`./dist/assets/${plugin.id}.zip`, import.meta.url), Buffer.from(await archive.arrayBuffer()));
  files.push({ path: `assets/${plugin.id}.zip`, mime: 'application/zip' });
}
for (const tool of toolPlugins) {
  const source = new URL(`../../plugins/community/${tool.sourceFolder}/`, import.meta.url);
  const manifestText = await readFile(new URL('openpets.plugin.json', source), 'utf8');
  const entryText = await readFile(new URL('index.js', source), 'utf8');
  const manifest = JSON.parse(manifestText);
  if (manifest.id !== tool.id || manifest.manifestVersion !== 3 || manifest.entry !== 'index.js') throw new Error(`工具插件源与画廊不一致：${tool.id}`);
  const notes = `${shareNotes(tool.title, { author: tool.author, source: tool.source, license: tool.license }, 'plugin')}\n## 功能与安装\n\n${tool.features.map(feature => `- ${feature}`).join('\n')}\n\n权限：${tool.permissions.join('、')}。\n\n${tool.hostNotice}\n\n此工具不随桌面默认安装。JavaScript 入口只显示状态，实际本机工具由匹配版本的desktop pet宿主提供。\n`;
  const archive = zipPackage({ 'openpets.plugin.json': manifestText, 'index.js': entryText, 'SHARE.md': notes });
  await writeFile(new URL(`./dist/${tool.download}`, import.meta.url), Buffer.from(await archive.arrayBuffer()));
  files.push({ path: tool.download, mime: 'application/zip' });
}
const sourcePlugins = [];
for (const [id, title, category, symbol, lane = 'official', descriptionOverride] of sourcePluginInfo) {
  const sourceFolder = `plugins/${lane}/${id}`;
  const root = new URL(`../../${sourceFolder}/`, import.meta.url);
  const licenseText = await sourcePluginLicense(root);
  const originalAuthor = id === 'openpets.life-companion' ? templateCredit.author
    : id === 'openpets.system-resources' ? 'Karim Bouwmans'
      : id === 'regis.usage-buddy' ? 'Regis Benedito dos Santos Bittencourt' : 'OpenPets contributors';
  const source = id === 'openpets.life-companion' ? '本项目 plugins/official/openpets.life-companion'
    : id === 'regis.usage-buddy' ? 'https://github.com/regisbsb/openpets-plugin-usage-buddy'
      : id === 'openpets.system-resources' ? 'https://github.com/OpenPetsHQ/Openpets-system-resources'
        : `https://github.com/OpenPetsHQ/openpets/tree/2d14120cf027c9e80db7ff78e60711be08d39df4/${sourceFolder}`;
  const hostNotice = '这是在 desktop pet 本机运行的插件。下载 ZIP 并解压，导入含插件清单的文件夹后确认权限；启停、配置、授权和插件数据仍由本地控制中心管理。';
  const requirements = configurationNotes[id];
  const credit = { title, author: originalAuthor, maintainer: templateCredit.author, source, license: 'MIT；原始版权声明见包内 LICENSE', installNotes: `${hostNotice}${requirements ? `\n\n${requirements}` : ''}` };
  const packed = await sourcePluginPackage(fileURLToPath(root), credit, licenseText);
  const manifest = packed.source.manifest;
  const english = JSON.parse(packed.files.get('locales/en.json').toString('utf8'));
  const chinese = packed.files.has('locales/zh-Hans.json') ? JSON.parse(packed.files.get('locales/zh-Hans.json').toString('utf8')) : {};
  const resolveText = value => value?.startsWith('$t:') ? chinese[value.slice(3)] ?? english[value.slice(3)] : value;
  const description = (descriptionOverride || resolveText(manifest.description) || '安装后在本机配置和使用。').replace(/OpenPets?/gi, 'desktop pet').replace(/从宠物菜单设置/g, '在插件配置中设置');
  if (description.startsWith('$t:')) throw new Error(`插件介绍没有可用翻译：${id}`);
  const download = `assets/${id}.zip`;
  await writeFile(new URL(`./dist/${download}`, import.meta.url), packed.zip);
  const features = [description];
  if (requirements) features.push(requirements);
  if (manifest.configSchema && Object.keys(manifest.configSchema).length) features.push('在本地插件配置中调整选项，网站下载不会改变已有配置。');
  if (manifest.commands?.length) features.push(`提供主动命令：${manifest.commands.map(command => resolveText(command.title)).filter(Boolean).slice(0, 5).join('、')}。`);
  sourcePlugins.push({ id, title, description, kind: 'plugin', pluginType: 'sdk', category, author: templateCredit.author, authorRole: 'maintainer', originalAuthor, symbol,
    version: manifest.version, source, license: credit.license, download, permissions: manifest.permissions,
    permissionLabels: manifest.permissions.map(permission => permissionNames[permission] || permission), features,
    sourceFolder, sha256: createHash('sha256').update(packed.zip).digest('hex'), hostNotice, requirements,
  });
  files.push({ path: download, mime: 'application/zip' });
}
await writeFile(new URL('./dist/plugin-catalog.js', import.meta.url), `// 由公开插件源码生成，不包含用户档案或运行配置。\nexport const sourcePlugins = ${JSON.stringify(sourcePlugins, null, 2)};\n`);
files.push({ path: 'assets/brand-logo.png', mime: 'image/png' }, ...Object.values(pluginCovers).map(path => ({ path, mime: 'image/webp' })));
const publicFiles = [];
for (const entry of new Map(files.map(file => [file.path, file])).values()) {
  if (!/^assets\/[a-zA-Z0-9._/-]+$/.test(entry.path) || entry.path.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`公开资源路径不安全：${entry.path}`);
  const bytes = await readFile(new URL(`./dist/${entry.path}`, import.meta.url));
  publicFiles.push({ ...entry, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
await writeFile(new URL('./dist/gallery-files.json', import.meta.url), JSON.stringify({ schemaVersion: 2, upstreamCommit: pets.find(pet => pet.upstreamCommit)?.upstreamCommit || '', publicPets: pets.length, publicPlugins: templates.length + toolPlugins.length + sourcePlugins.length, files: publicFiles.sort((a, b) => a.path.localeCompare(b.path)) }, null, 2));
console.log(`画廊的 ${pets.length} 个桌宠与 ${templates.length + toolPlugins.length + sourcePlugins.length} 个插件下载包已生成。`);
