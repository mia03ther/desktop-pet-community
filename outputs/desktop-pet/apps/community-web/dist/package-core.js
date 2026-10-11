import { validateImportedPluginManifest, validateMediaPetMetadata, validateCodexPetMetadata, petMediaActions, petMediaOptionalActions, pluginAssetMaxBytes, pluginPanelMaxBytes, packageImportLimits } from './native-package-contract.js';

const encoder = new TextEncoder();
const reservedId = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;
export { packageImportLimits };
export const petStateIds = [...petMediaActions, ...petMediaOptionalActions];

function field(value, label, max, required = true) {
  if (typeof value !== 'string' || value.length > max || /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value)) {
    throw new Error(`${label}格式无效或超过 ${max} 字。`);
  }
  const text = value.trim();
  if (required && !text) throw new Error(`请填写${label}。`);
  return text;
}

export function attribution(input) {
  return {
    author: field(input.author, '作者', 120),
    source: field(input.source ?? '', '来源', 1000, false),
    license: field(input.license, '许可声明', 200),
  };
}

export function petManifest(input, version) {
  const id = field(input.id, '作品 ID', 64);
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) || id === 'builtin' || reservedId.test(id)) {
    throw new Error('作品 ID 只能包含小写字母、数字、短横线和下划线，不能使用系统保留名。');
  }
  if (version !== 1 && version !== 2) throw new Error('请选择有效的 V1 或 V2 图集。');
  return {
    id,
    displayName: field(input.displayName, '名称', 80),
    description: field(input.description, '简介', 500),
    spritesheetPath: 'spritesheet.webp',
    ...(version === 2 ? { spriteVersionNumber: 2 } : {}),
  };
}

export function pluginManifest(input) {
  const id = field(input.id, '插件 ID', 64);
  if (!/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/.test(id) || reservedId.test(id) || id.startsWith('openpets.')) {
    throw new Error('插件 ID 需为 3 至 64 位小写字母、数字、点、短横线或下划线，不能使用内置前缀和系统保留名。');
  }
  const name = field(input.title, '插件名称', 120);
  const description = field(input.description ?? '', '说明', 1000, false);
  const speech = field(input.speech, '台词', 140);
  if ([name, description, speech].some(text => text.startsWith('$t:'))) throw new Error('请直接填写台词，不要使用未定义的翻译引用。');
  const everyMinutes = Number(input.everyMinutes);
  if (!Number.isInteger(everyMinutes) || everyMinutes < 5 || everyMinutes > 1440) throw new Error('间隔必须为 5 至 1440 的整数分钟。');
  const reactions = ['idle', 'thinking', 'working', 'editing', 'running', 'testing', 'waiting', 'waving', 'success', 'error', 'celebrating'];
  const reaction = input.reaction || undefined;
  if (reaction && !reactions.includes(reaction)) throw new Error('请选择支持的反应。');
  return {
    manifestVersion: 1, id, name,
    ...(description ? { description } : {}),
    version: '1.0.0', runtime: 'declarative', icon: 'bell',
    permissions: ['timer', 'pet:speak', ...(reaction ? ['pet:reaction'] : [])],
    triggers: [{ on: 'timer', everyMinutes, actions: [
      { type: 'pet.speak', message: speech },
      ...(reaction ? [{ type: 'pet.react', reaction }] : []),
    ] }],
  };
}

export function shareNotes(title, credit, kind) {
  const text = `# ${title}\n\n作者：${credit.author}\n来源：${credit.source}\n许可声明：${credit.license}\n\n以上为填写者声明，未经平台核实。\n\n${kind === 'pet' ? '在本地控制中心「我的桌宠」导入 ZIP。' : '在本地控制中心「插件管理」导入 ZIP 或文件夹，确认权限后启用。其他宿主插件需要适配后才能运行。'}\n\n本包保留上传的作品文件。分享前确认其中没有密钥、私人配置或聊天记录。请保留原包、作者声明和许可证。\n`;
  if (encoder.encode(text).length > 16 * 1024) throw new Error('分享说明过大。');
  return text;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 小型无压缩 ZIP 写入器；浏览器图集已压缩，不再引入额外压缩依赖。
export function zipPackage(files) {
  if (Object.keys(files).length > packageImportLimits.maxFiles) throw new Error('素材包最多包含 10000 个文件。');
  const local = [];
  const central = [];
  let offset = 0;
  for (const [name, value] of Object.entries(files)) {
    safePackagePath(name);
    const filename = encoder.encode(name);
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    if (!(bytes instanceof Uint8Array)) throw new Error('包文件内容无效。');
    if (bytes.length > packageImportLimits.maxFileBytes) throw new Error('单文件超过 512 MiB。');
    const checksum = crc32(bytes);
    const header = new Uint8Array(30 + filename.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x800, true);
    view.setUint16(12, 33, true);
    view.setUint32(14, checksum, true);
    view.setUint32(18, bytes.length, true);
    view.setUint32(22, bytes.length, true);
    view.setUint16(26, filename.length, true);
    header.set(filename, 30);
    local.push(header, bytes);
    const entry = new Uint8Array(46 + filename.length);
    const directory = new DataView(entry.buffer);
    directory.setUint32(0, 0x02014b50, true);
    directory.setUint16(4, 20, true);
    directory.setUint16(6, 20, true);
    directory.setUint16(8, 0x800, true);
    directory.setUint16(14, 33, true);
    directory.setUint32(16, checksum, true);
    directory.setUint32(20, bytes.length, true);
    directory.setUint32(24, bytes.length, true);
    directory.setUint16(28, filename.length, true);
    directory.setUint32(42, offset, true);
    entry.set(filename, 46);
    central.push(entry);
    offset += header.length + bytes.length;
  }
  const centralLength = central.reduce((total, bytes) => total + bytes.length, 0);
  if (offset + centralLength + 22 > packageImportLimits.maxBytes) throw new Error('素材包超过 1 GiB；请按投稿指南使用完整包链接。');
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, central.length, true);
  view.setUint16(10, central.length, true);
  view.setUint32(12, centralLength, true);
  view.setUint32(16, offset, true);
  return new Blob([...local, ...central, end], { type: 'application/zip' });
}

// 包内路径只用于读取与归档，不解释为电脑路径，也不执行上传代码。
export function safePackagePath(value) {
  if (typeof value !== 'string' || value.length > 240 || !value || value.split('/').length > 13 || /[\\:<>"|?*\p{Cc}\p{Cf}]/u.test(value) || value.startsWith('/') || value.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part) || reservedId.test(part))) {
    throw new Error('文件路径无效：请使用不含上级目录、绝对地址或系统保留名的包内路径。');
  }
  return value;
}

export async function readZipPackage(input, inflate, { maxTotalBytes = packageImportLimits.maxBytes, maxFileBytes = packageImportLimits.maxFileBytes } = {}) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length > packageImportLimits.maxBytes) throw new Error('ZIP 超过 1 GiB；请按投稿指南使用完整包链接。');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65557); at--) {
    if (view.getUint32(at, true) === 0x06054b50 && at + 22 + view.getUint16(at + 20, true) === bytes.length) { end = at; break; }
  }
  if (end < 0) throw new Error('ZIP 目录损坏或不是受支持的 ZIP。');
  const count = view.getUint16(end + 10, true);
  if (view.getUint16(end + 4, true) || view.getUint16(end + 6, true) || count !== view.getUint16(end + 8, true) || count > packageImportLimits.maxFiles) throw new Error('不支持分卷 ZIP，或文件数量超过 10000。');
  const files = Object.create(null);
  const names = new Set();
  let at = view.getUint32(end + 16, true);
  let total = 0;
  for (let index = 0; index < count; index++) {
    if (at + 46 > end || view.getUint32(at, true) !== 0x02014b50) throw new Error('ZIP 文件目录损坏。');
    const flags = view.getUint16(at + 8, true);
    const method = view.getUint16(at + 10, true);
    const compressedSize = view.getUint32(at + 20, true);
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const next = at + 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
    if (next > end || flags & 1 || ![0, 8].includes(method) || (view.getUint32(at + 38, true) >>> 16 & 0xf000) === 0xa000) throw new Error('ZIP 包含加密文件、链接或不支持的压缩方式。');
    const name = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const directory = name.endsWith('/');
    safePackagePath(directory ? name.slice(0, -1) : name);
    const key = name.toLocaleLowerCase();
    if (names.has(key)) throw new Error('ZIP 包含重名文件。');
    names.add(key);
    if (!directory) {
      total += size;
      if (size > maxFileBytes || total > maxTotalBytes) throw new Error('ZIP 内文件大小或总量超过读取限制。');
      const local = view.getUint32(at + 42, true);
      if (local + 30 > at || view.getUint32(local, true) !== 0x04034b50) throw new Error('ZIP 文件头损坏。');
      const offset = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      if (offset + compressedSize > at) throw new Error('ZIP 文件数据越界。');
      const compressed = bytes.subarray(offset, offset + compressedSize);
      const value = method === 0 ? compressed.slice() : await inflate(compressed, size);
      if (value.length !== size || crc32(value) !== view.getUint32(at + 16, true)) throw new Error('ZIP 文件校验失败。');
      files[name] = value;
    }
    at = next;
  }
  return files;
}

export function normalizePackageFiles(input) {
  const files = Object.create(null);
  const entries = Object.entries(input);
  if (!entries.length || entries.length > packageImportLimits.maxFiles) throw new Error('请选择 1 至 10000 个文件。');
  let total = 0;
  const names = new Set();
  for (const [name, value] of entries) {
    safePackagePath(name);
    if (!(value instanceof Uint8Array)) throw new Error('文件内容无效。');
    total += value.length;
    if (value.length > packageImportLimits.maxFileBytes || total > packageImportLimits.maxBytes) throw new Error('单文件超过 512 MiB 或文件总量超过 1 GiB。');
    if (names.has(name.toLocaleLowerCase())) throw new Error('存在大小写冲突的同名文件。');
    names.add(name.toLocaleLowerCase());
  }
  let prefix = '';
  const first = entries[0][0].split('/');
  while (first.length > 1 && entries.every(([name]) => name.startsWith(`${prefix}${first[0]}/`))) {
    prefix += `${first.shift()}/`;
  }
  for (const [name, value] of entries) files[name.slice(prefix.length)] = value;
  return files;
}

function pluginAttachments(manifest, files) {
  const required = [];
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  if (manifest.assets !== undefined) {
    if (!record(manifest.assets)) throw new Error('插件 assets 需要按素材种类声明文件。');
    for (const [kind, group] of Object.entries(manifest.assets)) {
      if (!['icons', 'images', 'svgs', 'sprites', 'sounds'].includes(kind) || !record(group)) throw new Error('插件素材种类或文件声明无效。');
      for (const declaration of Object.values(group)) {
        const path = kind === 'sprites' && record(declaration) ? declaration.path : declaration;
        safePackagePath(path);
        if (files[path]?.length > pluginAssetMaxBytes[kind]) throw new Error(`插件 ${kind} 附件超过大小上限：${path}。`);
        required.push(path);
      }
    }
  }
  if (manifest.panels !== undefined) {
    if (!record(manifest.panels)) throw new Error('插件 panels 需要声明对应页面文件。');
    for (const path of Object.values(manifest.panels)) { safePackagePath(path); if (files[path]?.length > pluginPanelMaxBytes) throw new Error(`插件面板超过 1 MB：${path}。`); required.push(path); }
  }
  const references = new Set();
  const values = [manifest.name, manifest.description, manifest.configSchema, manifest.triggers];
  while (values.length) {
    const value = values.pop();
    if (typeof value === 'string' && value.startsWith('$t:')) references.add(value.slice(3));
    else if (value !== null && typeof value === 'object') values.push(...Object.values(value));
  }
  const translations = new Map();
  for (const name of Object.keys(files).filter(name => /^locales\/[^/]+\.json$/.test(name))) {
    safePackagePath(name);
    if (files[name].length > 256 * 1024) throw new Error(`翻译附件超过 256 KB：${name}。`);
    let locale;
    try { locale = JSON.parse(new TextDecoder().decode(files[name])); }
    catch { throw new Error(`翻译附件不是有效 JSON：${name}。`); }
    if (!record(locale) || Object.values(locale).some(value => typeof value !== 'string')) throw new Error(`翻译附件需要是文字键值表：${name}。`);
    translations.set(name, locale);
  }
  if (references.size) {
    required.push('locales/en.json');
    const fallback = translations.get('locales/en.json');
    if (fallback) for (const key of references) if (!Object.hasOwn(fallback, key)) throw new Error(`翻译附件 locales/en.json 缺少文字键：${key}。请补充完整翻译文件。`);
  }
  return required;
}

export function inspectPackage(files, kind) {
  const candidates = kind === 'pet' ? ['pet.json', 'manifest.json', 'metadata.json'] : ['desktop-pet.plugin.json', 'plugin.json', 'openpets.plugin.json', 'manifest.json', 'package.json'];
  const manifestName = candidates.find(name => Object.hasOwn(files, name));
  if (!manifestName && kind === 'pet' && Object.hasOwn(files, 'conf/actions.xml') && Object.keys(files).some(name => /^img\/.*\.png$/i.test(name))) {
    return { manifestName: 'conf/actions.xml', manifest: {}, compatibility: 'Shimeji 图像序列 · 桌面导入转换，Java 行为需专用引擎', fileCount: Object.keys(files).length, bytes: Object.values(files).reduce((sum, value) => sum + value.length, 0) };
  }
  if (!manifestName) return { manifestName: null, manifest: {}, workInfo: {}, compatibility: `${kind === 'pet' ? '自定义桌宠素材' : '未识别宿主插件'} · 仅归档分享，运行需适配`, fileCount: Object.keys(files).length, bytes: Object.values(files).reduce((sum, value) => sum + value.length, 0) };
  if (files[manifestName].length > 1024 * 1024) throw new Error('清单超过 1 MB。');
  let manifest;
  try { manifest = JSON.parse(new TextDecoder().decode(files[manifestName])); }
  catch { throw new Error('作品清单不是有效的 JSON，请检查后重新导入。'); }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('清单需要是 JSON 对象。');
  const required = [];
  let compatibility;
  if (kind === 'pet') {
    if (manifest.mediaVersion === 1 && manifest.actions && typeof manifest.actions === 'object') {
      required.push(...Object.values(manifest.actions));
      if (!manifest.actions.idle) throw new Error('动作包需要 idle 待机动作，其他状态可绑定任意动作。');
      compatibility = '独立动作包';
    } else if (typeof manifest.spritesheetPath === 'string' || Object.hasOwn(files, 'spritesheet.webp')) {
      required.push(manifest.spritesheetPath || 'spritesheet.webp');
      compatibility = 'WebP 图集包';
    } else compatibility = '其他桌宠格式 · 可保存分享，运行需适配';
  } else {
    const supported = manifest.runtime === 'declarative' && manifest.manifestVersion === 1 || manifest.runtime === 'javascript' && [2, 3].includes(manifest.manifestVersion);
    compatibility = supported ? `SDK ${manifest.manifestVersion} · ${manifest.runtime === 'javascript' ? 'JavaScript' : '声明式'}` : '其他宿主插件 · 可保存分享，运行需适配';
    if (supported) {
      if (files[manifestName].length > 64 * 1024) throw new Error('插件清单超过 64 KB。');
      const result = validateImportedPluginManifest(manifest);
      if (!result.ok) throw new Error(`插件清单字段无效：${result.errors.map(error => error.path).join('、')}。`);
    }
    if (supported && manifest.runtime === 'javascript') {
      if (typeof manifest.entry !== 'string') throw new Error('JavaScript 插件需要声明入口文件。');
      if (files[manifest.entry]?.length > 1024 * 1024) throw new Error('插件入口超过 1 MB。');
      required.push(manifest.entry);
    }
    if (supported) required.push(...pluginAttachments(manifest, files));
  }
  for (const name of required) {
    safePackagePath(name);
    if (!Object.hasOwn(files, name)) throw new Error(`缺少清单引用附件：${name}。请上传包含此文件的完整文件夹或 ZIP，或补选全部配套文件。`);
  }
  let submission = {};
  if (files['submission.json']?.length <= 1024 * 1024) {
    try { const value = JSON.parse(new TextDecoder().decode(files['submission.json'])); if (value && typeof value === 'object' && !Array.isArray(value)) submission = value; }
    catch { /* 可选投稿说明损坏，不阻止读取运行素材。 */ }
  }
  function readable(value) {
    if (typeof value !== 'string') return '';
    if (!value.startsWith('$t:')) return value;
    for (const name of ['locales/zh-Hans.json', 'locales/zh-CN.json', 'locales/en.json']) {
      if (!files[name] || files[name].length > 1024 * 1024) continue;
      try { const translations = JSON.parse(new TextDecoder().decode(files[name])); if (typeof translations?.[value.slice(3)] === 'string') return translations[value.slice(3)]; }
      catch { /* 无可用翻译时让填写者自行填写作品信息。 */ }
    }
    return '';
  }
  const workInfo = { id: readable(manifest.id), title: readable(manifest.displayName || manifest.title || manifest.name), description: readable(manifest.description || submission.description), author: readable(manifest.author || submission.author), source: readable(manifest.sourceUrl || submission.source_url), license: readable(manifest.license || submission.license) };
  const bytes = Object.values(files).reduce((sum, value) => sum + value.length, 0);
  const runtimeWarning = bytes > packageImportLimits.maxBytes ? '超过 1 GiB 完整包导入上限；请保留原件并使用原宿主，不能直接运行导入。' : '';
  return { manifestName, manifest, workInfo, compatibility, runtimeWarning, fileCount: Object.keys(files).length, bytes };
}

export function videoPetManifest(input, clips, bindings, background) {
  const manifest = petManifest(input, 1);
  delete manifest.spritesheetPath;
  if (!clips.length || clips.length > 100) throw new Error('请上传 1 至 100 个独立动作。');
  const actions = Object.create(null);
  const actionDefinitions = Object.create(null);
  for (const clip of clips) {
    const id = field(clip.id, '动作 ID', 64);
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id) || ['constructor', 'prototype', '__proto__'].includes(id) || Object.hasOwn(actions, id)) throw new Error('动作 ID 需唯一，使用小写字母、数字、短横线和下划线，并避开系统保留标识。');
    safePackagePath(clip.file);
    if (!/\.(mp4|webm|webp)$/i.test(clip.file)) throw new Error('动作需为 MP4、WebM 或动画 WebP。');
    actions[id] = clip.file;
    actionDefinitions[id] = { displayName: field(clip.displayName, '动作名称', 80), category: field(clip.category, '动作种类', 80) };
  }
  if (!actions.idle) actions.idle = actions[bindings.idle || clips[0].id];
  if (!actions.idle) throw new Error('请选择待机动作。');
  const stateBindings = {};
  for (const [state, id] of Object.entries(bindings)) {
    if (!petStateIds.includes(state)) throw new Error('AI 与交互状态绑定无效。');
    if (id && !actions[id]) throw new Error('状态绑定的动作不存在。');
    if (id) stateBindings[state] = id;
  }
  if (!['alpha', 'chroma'].includes(background.mode) || background.mode === 'chroma' && !/^#[a-f0-9]{6}$/i.test(background.color)) throw new Error('请选择透明通道或有效去背颜色。');
  if (background.mode === 'alpha' && clips.some(clip => clip.file.toLowerCase().endsWith('.mp4'))) throw new Error('MP4 没有透明通道，请选择纯色背景去背。');
  return validateMediaPetMetadata({ ...manifest, mediaVersion: 1, actions, actionDefinitions, stateBindings, background }, manifest.id);
}

export function coverImageType(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length > 10 * 1024 * 1024) throw new Error('封面需为 10 MB 以内的 PNG、JPEG 或 WebP 图片。');
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return { extension: 'png', mime: 'image/png' };
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { extension: 'jpg', mime: 'image/jpeg' };
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.subarray(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.subarray(8, 12)) === 'WEBP') return { extension: 'webp', mime: 'image/webp' };
  throw new Error('封面需为 PNG、JPEG 或 WebP 图片，不支持 SVG 或网页文件。');
}

export function packageWorkFields(current, incoming, replace = false) {
  return Object.fromEntries(['id', 'title', 'description', 'author', 'source', 'license'].map(key => {
    const value = typeof incoming?.[key] === 'string' && !incoming[key].startsWith('$t:') ? incoming[key] : '';
    return [key, replace ? value : current[key] || value];
  }));
}

function savedWorkInformation(files) {
  const names = Object.keys(files).filter(name => /^WORK-INFO(?:-\d+)?\.json$/i.test(name)).sort((a, b) => Number(b.match(/-(\d+)\.json$/i)?.[1] || 1) - Number(a.match(/-(\d+)\.json$/i)?.[1] || 1));
  for (const name of names) {
    if (files[name].length > 64 * 1024) continue;
    try {
      const value = JSON.parse(new TextDecoder().decode(files[name]));
      if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    } catch { /* 原作品信息留档，忽略不可读取的可选说明。 */ }
  }
  return {};
}

// 只检查文件与已知清单结构，不执行插件、原项目命令或动作。
export function inspectImportPackage(files, kind) {
  const candidates = kind === 'pet' ? ['pet.json', 'manifest.json', 'metadata.json', 'conf/actions.xml'] : ['desktop-pet.plugin.json', 'plugin.json', 'openpets.plugin.json', 'manifest.json', 'package.json'];
  const names = Object.keys(files);
  const manifestPaths = candidates.flatMap(candidate => names.filter(name => name === candidate || name.endsWith(`/${candidate}`)).sort((a, b) => a.split('/').length - b.split('/').length));
  const packageRoots = new Set(manifestPaths.map(name => name.endsWith('conf/actions.xml') ? name.slice(0, -'conf/actions.xml'.length) : name.slice(0, name.length - name.split('/').pop().length)));
  const manifestPath = manifestPaths[0];
  const prefix = manifestPath?.includes('/') ? manifestPath.slice(0, manifestPath.length - (manifestPath.endsWith('conf/actions.xml') ? 'conf/actions.xml'.length : manifestPath.split('/').pop().length)) : '';
  const view = Object.fromEntries(Object.entries(files).filter(([name]) => name.startsWith(prefix)).map(([name, bytes]) => [name.slice(prefix.length), bytes]));
  let info, failure;
  try { info = inspectPackage(view, kind); }
  catch (error) { failure = error.message; info = { manifest: {}, workInfo: {}, compatibility: '清单或附件不完整' }; }
  if (packageRoots.size > 1) failure = '发现多个作品目录，请单独选择需要运行的作品包；当前只保留整个目录归档，不自动选择其中一个。';
  const manifest = info.manifest;
  if (!failure && info.compatibility === '独立动作包') {
    try { validateMediaPetMetadata(manifest, manifest.id); }
    catch (error) { failure = error.message; }
  }
  if (!failure && info.compatibility === 'WebP 图集包' && manifest.spriteVersionNumber !== undefined && ![1, 2].includes(manifest.spriteVersionNumber)) failure = '本系统只支持 V1 或 V2 WebP 图集结构。';
  if (!failure && /^SDK /.test(info.compatibility) && (typeof manifest.id !== 'string' || !manifest.id || typeof manifest.name !== 'string' || !manifest.name || typeof manifest.version !== 'string' || !manifest.version || !Array.isArray(manifest.permissions))) failure = 'SDK 清单缺少有效的编号、名称、版本或权限声明。';
  const native = !failure && (kind === 'pet' ? ['独立动作包', 'WebP 图集包'].includes(info.compatibility) : /^SDK /.test(info.compatibility));
  const shimeji = !failure && info.compatibility.startsWith('Shimeji');
  const raycast = kind === 'plugin' && Array.isArray(manifest.commands) && typeof manifest.name === 'string';
  const live2d = names.some(name => /\.model3?\.json$/i.test(name));
  const vpet = names.some(name => /(^|\/)(VPet.*\.dll|info\.lps)$/i.test(name));
  const external = shimeji || raycast || live2d || vpet;
  const bytes = Object.values(files).reduce((sum, value) => sum + value.length, 0);
  const oversizedFile = names.find(name => files[name].length > packageImportLimits.maxFileBytes);
  const oversized = bytes > packageImportLimits.maxBytes || names.length > packageImportLimits.maxFiles || oversizedFile;
  const level = failure ? 'invalid' : native ? oversized ? 'partial' : 'native' : shimeji ? 'partial' : external ? 'external' : 'invalid';
  const capabilities = { archive: true, preview: native && kind === 'pet' && !oversized, actions: native && kind === 'pet' && !oversized, aiBindings: native && kind === 'pet' && !oversized, configuration: native && kind === 'plugin' && !oversized, originalLogic: native && !oversized };
  const format = shimeji ? 'Shimeji' : raycast ? 'Raycast' : live2d ? 'Live2D' : vpet ? 'VPet' : native ? info.compatibility : '未识别格式';
  const reasons = [failure, oversized ? oversizedFile ? `文件超过 512 MiB 上限：${oversizedFile}。` : '超过 1 GiB 或 10000 文件上限。' : '', shimeji ? '原逻辑仍需专用引擎。' : '', external && !shimeji ? '需要原宿主。' : '', !native && !external && !failure ? '未识别运行格式。' : ''].filter(Boolean);
  const report = { inspection: 'static', level, format, capabilities, supported: ['完整原包归档与下载', ...(native ? [kind === 'pet' ? '已知桌宠清单与声明动作素材' : 'SDK 清单、入口与声明附件'] : [])], unsupported: native ? oversized ? ['直接运行导入'] : [] : ['本系统动作控制', 'AI 状态绑定', '本系统运行配置', '自动执行原项目逻辑'], reasons };
  const saved = savedWorkInformation(files);
  const workInfo = { ...info.workInfo };
  for (const key of ['id', 'title', 'description', 'author', 'source', 'license']) if (typeof saved[key] === 'string') workInfo[key] = saved[key];
  let cover = null;
  if (typeof saved.presentation?.cover === 'string') {
    try { const path = safePackagePath(saved.presentation.cover); if (files[path]) cover = { path, bytes: files[path], ...coverImageType(files[path]) }; else report.reasons.push('作品封面附件缺失，可重新选择；原清单和其他文件仍会保留。'); }
    catch { report.reasons.push('作品封面附件无法读取，原包文件仍会保留。'); }
  }
  return { ...info, manifestPath, assetPrefix: prefix, workInfo, cover, report, fileCount: names.length, bytes };
}

export function addWorkInformation(files, input, kind, credit, cover = null, savedAt = new Date().toISOString()) {
  const result = { ...files };
  const occupied = name => Object.keys(result).some(existing => existing.toLocaleLowerCase() === name.toLocaleLowerCase());
  let presentation;
  if (cover) {
    const imageType = coverImageType(cover.bytes);
    const path = safePackagePath(cover.path);
    if (!path.toLowerCase().endsWith(`.${imageType.extension}`) && !(imageType.extension === 'jpg' && path.toLowerCase().endsWith('.jpeg'))) throw new Error('封面文件扩展名与图片内容不一致。');
    if (occupied(path) && !(result[path] instanceof Uint8Array && result[path].length === cover.bytes.length && result[path].every((value, index) => value === cover.bytes[index]))) throw new Error('封面路径与已有文件冲突，请重新选择封面。');
    result[path] = cover.bytes;
    presentation = { cover: path };
  }
  let infoName = 'WORK-INFO.json';
  for (let index = 2; occupied(infoName); index++) infoName = `WORK-INFO-${index}.json`;
  result[infoName] = encoder.encode(JSON.stringify({ kind, title: input.displayName || input.title, id: input.id, description: input.description, ...credit, ...(presentation ? { presentation } : {}), savedAt, publication: 'local-draft' }, null, 2));
  let notesName = 'SHARE.md';
  for (let index = 2; occupied(notesName); index++) notesName = `SHARE-${index}.md`;
  result[notesName] = encoder.encode(shareNotes(input.displayName || input.title, credit, kind));
  return result;
}

export function prepareWorkPackage(files, input, kind, workflow, cover = null) {
  if (![`${kind}-make`, `${kind}-import`].includes(workflow)) throw new Error('请选择制作或导入入口。');
  const bytes = Object.fromEntries(Object.entries(files).map(([name, value]) => [name, typeof value === 'string' ? encoder.encode(value) : value]));
  const result = addWorkInformation(bytes, input, kind, attribution(input), cover);
  if (workflow.endsWith('-import')) return result;
  const info = inspectImportPackage(result, kind);
  if (info.report.level !== 'native') throw new Error(info.report.reasons.join(' ') || '制作包不符合本系统格式；原项目请使用导入入口。');
  if (kind === 'pet') {
    if (info.manifest.mediaVersion === 1) {
      for (const path of new Set(Object.values(info.manifest.actions))) mediaFileInfo(result[info.assetPrefix + path], path, info.manifest.background.mode === 'alpha');
    } else validateCodexPetMetadata(info.manifest, info.manifest.id);
  }
  return result;
}

// 制作出口检查真实文件头与 WebP 帧声明；导入归档不改写原件。
export function mediaFileInfo(bytes, path, needsAlpha = false) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > packageImportLimits.maxFileBytes) throw new Error(`动作素材缺失或超过 512 MiB：${path}。`);
  const ascii = (start, end) => new TextDecoder('ascii').decode(bytes.subarray(start, end));
  if (/\.mp4$/i.test(path)) {
    if (bytes.length < 24 || ascii(4, 8) !== 'ftyp') throw new Error(`MP4 文件头无效：${path}。`);
    return null;
  }
  if (/\.webm$/i.test(path)) {
    if (bytes.length < 16 || ![26, 69, 223, 163].every((value, index) => bytes[index] === value) || !ascii(0, Math.min(bytes.length, 4096)).includes('webm')) throw new Error(`WebM 文件头无效：${path}。`);
    return null;
  }
  if (bytes.length < 30 || ascii(0, 4) !== 'RIFF' || ascii(8, 12) !== 'WEBP') throw new Error(`WebP 文件头无效：${path}。`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let frames = 0, width = 0, height = 0, alpha = false;
  for (let at = 12; at + 8 <= bytes.length;) {
    const size = view.getUint32(at + 4, true);
    if (at + 8 + size > bytes.length) throw new Error(`WebP 内容不完整：${path}。`);
    if (ascii(at, at + 4) === 'VP8X' && size >= 10) {
      alpha = Boolean(bytes[at + 8] & 16);
      width = 1 + bytes[at + 12] + (bytes[at + 13] << 8) + (bytes[at + 14] << 16);
      height = 1 + bytes[at + 15] + (bytes[at + 16] << 8) + (bytes[at + 17] << 16);
    }
    if (ascii(at, at + 4) === 'ANMF') frames++;
    at += 8 + size + (size % 2);
  }
  if (frames < 2 || frames > 600 || !width || !height || width > 2048 || height > 2048) throw new Error(`WebP 动作需为 2 至 600 帧、单帧不超过 2048 × 2048 的动画：${path}。`);
  if (needsAlpha && !alpha) throw new Error(`WebP 动作没有透明通道：${path}。`);
  return { width, height, frames };
}

export function creationImageChecks(files, kind) {
  const info = inspectImportPackage(files, kind);
  if (kind === 'pet') {
    if (info.manifest.mediaVersion !== 1) return [{ path: info.assetPrefix + 'spritesheet.webp', width: 1536, height: info.manifest.spriteVersionNumber === 2 ? 2288 : 1872 }];
    return [...new Set(Object.values(info.manifest.actions))].filter(path => /\.webp$/i.test(path)).map(path => ({ path: info.assetPrefix + path, ...mediaFileInfo(files[info.assetPrefix + path], path, info.manifest.background.mode === 'alpha') }));
  }
  return Object.values(info.manifest.assets?.sprites || {}).map(sprite => ({ path: info.assetPrefix + sprite.path, width: sprite.frameWidth * sprite.frames, height: sprite.frameHeight }));
}
