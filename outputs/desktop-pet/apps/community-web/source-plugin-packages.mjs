import { readFile, lstat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { readLocalPluginSourceManifest } from '../desktop/dist/plugin-local-loader.js';
import { collectDeclaredPluginFiles } from '../desktop/dist/plugin-assets.js';
import { SUPPORTED_LOCALES } from '../desktop/dist/i18n/catalog.js';
import { shareNotes } from './dist/package-core.js';

const require = createRequire(new URL('../desktop/package.json', import.meta.url));
const { ZipFile } = require('yazl');

// 只复制运行清单声明的文件；不扫描目录，不读取配置、存储或用户档案。
export async function sourcePluginPackage(sourceFolder, credit, licenseText) {
  const source = await readLocalPluginSourceManifest({ sourceFolder });
  const notes = `${shareNotes(credit.title, credit, 'plugin')}${credit.maintainer ? `\n维护者：${credit.maintainer}\n` : ''}${credit.installNotes ? `\n## 安装与配置\n\n${credit.installNotes}\n` : ''}`;
  const files = new Map([['openpets.plugin.json', Buffer.from(source.manifestText)]]);
  if (source.entryText !== undefined) files.set(source.manifest.entry, Buffer.from(source.entryText));
  // 本地导入会完整保留附件；自动公开发布只选择显式运行文件，不能沿用完整导入集合。
  for (const declaration of collectDeclaredPluginFiles(source.manifest)) {
    const bytes = source.declaredFiles?.get(declaration.relPath);
    if (!bytes) throw new Error(`公开插件包缺少声明附件：${declaration.relPath}`);
    files.set(declaration.relPath, bytes);
  }
  for (const locale of SUPPORTED_LOCALES) {
    const name = `locales/${locale}.json`;
    const bytes = source.declaredFiles?.get(name);
    if (bytes) files.set(name, bytes);
  }
  files.set('LICENSE', Buffer.from(licenseText));
  files.set('SHARE.md', Buffer.from(notes));
  const archive = new ZipFile();
  const chunks = [];
  const done = new Promise((resolve, reject) => {
    archive.outputStream.on('data', chunk => chunks.push(chunk));
    archive.outputStream.on('error', reject);
    archive.outputStream.on('end', () => resolve(Buffer.concat(chunks)));
  });
  for (const [name, bytes] of files) archive.addBuffer(bytes, name, { mtime: new Date('2026-01-01T00:00:00Z') });
  archive.end();
  const zip = await done;
  if (zip.length > 16 * 1024 * 1024) throw new Error(`插件下载包超过桌面限制：${source.manifest.id}`);
  return { source, files, zip };
}

export async function sourcePluginLicense(sourceFolder) {
  const file = new URL('LICENSE', sourceFolder);
  try {
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('插件许可文件必须是普通文件。');
    return await readFile(file, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return readFile(new URL('../../LICENSE', import.meta.url), 'utf8');
  }
}
