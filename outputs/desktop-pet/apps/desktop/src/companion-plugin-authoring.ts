import type { Stats } from "node:fs";
import { lstat, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

import {
  getCompanionPluginPermissions,
  parseCompanionPluginAuthoringInput,
  type CompanionPluginAuthoringInput,
  type CompanionPluginPackageResult,
} from "./companion-plugin-authoring-types.js";
import { OPENPETS_PLUGIN_MANIFEST_FILENAME, validatePluginManifest, type OpenPetsDeclarativePluginManifest } from "./plugin-manifest.js";

export function buildCompanionPluginManifest(input: CompanionPluginAuthoringInput): OpenPetsDeclarativePluginManifest {
  const draft = parseCompanionPluginAuthoringInput(input);
  const manifest: OpenPetsDeclarativePluginManifest = {
    manifestVersion: 1,
    id: draft.id,
    name: draft.title,
    ...(draft.description ? { description: draft.description } : {}),
    version: "1.0.0",
    runtime: "declarative",
    icon: "bell",
    permissions: getCompanionPluginPermissions(draft),
    triggers: [{
      on: "timer",
      everyMinutes: draft.everyMinutes,
      actions: [
        { type: "pet.speak", message: draft.speech },
        ...(draft.reaction ? [{ type: "pet.react" as const, reaction: draft.reaction }] : []),
      ],
    }],
  };
  const checked = validatePluginManifest(manifest);
  if (!checked.ok) throw new Error("生成的插件未通过运行清单校验。");
  return manifest;
}

export async function createCompanionPluginPackage(
  input: CompanionPluginAuthoringInput,
  parentDir: string,
  signal?: AbortSignal,
): Promise<CompanionPluginPackageResult> {
  const draft = parseCompanionPluginAuthoringInput(input);
  const manifest = buildCompanionPluginManifest(draft);
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
  const readme = shareInstructions(draft, manifest);
  if (Buffer.byteLength(readme, "utf8") > 16 * 1024) throw new Error("插件分享说明过大。");
  signal?.throwIfAborted();
  const parent = await canonicalDirectory(parentDir, "插件保存目录");
  const parentIdentity = await lstat(parent);
  signal?.throwIfAborted();
  const directory = await mkdtemp(join(parent, `${draft.id}-plugin-`));
  let createdIdentity: Stats | undefined;
  try {
    createdIdentity = await lstat(directory);
    const ownedIdentity = createdIdentity;
    const assertOwned = async (): Promise<void> => {
      await assertOwnedDirectory(parent, parentIdentity, directory, ownedIdentity);
      signal?.throwIfAborted();
    };
    await assertOwned();
    const manifestPath = join(directory, OPENPETS_PLUGIN_MANIFEST_FILENAME);
    await writeFile(manifestPath, manifestText, { flag: "wx", mode: 0o600 });
    await assertOwned();
    await writeFile(join(directory, "SHARE.md"), readme, { flag: "wx", mode: 0o600 });
    await assertOwned();
    return { id: draft.id, title: draft.title, directoryPath: directory, manifestPath, permissions: getCompanionPluginPermissions(draft) };
  } catch (error) {
    if (createdIdentity) {
      try {
        await assertOwnedDirectory(parent, parentIdentity, directory, createdIdentity);
        // 只清理本次新建且身份未改变的子目录；不会清理选定父目录。
        await rm(directory, { recursive: true, force: true });
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], "制作未完成，目录身份发生变化，未自动清理。");
      }
    }
    throw error;
  }
}

function shareInstructions(input: CompanionPluginAuthoringInput, manifest: OpenPetsDeclarativePluginManifest): string {
  const describe = (text: string | undefined): string => text ? escapeMarkdown(text) : "待填写或待核实";
  return `# ${escapeMarkdown(input.title)}：本地共创插件

作者：${describe(input.author)}
来源：${describe(input.source)}
许可声明：${describe(input.license)}

以上为填写者声明，应用未验证作者、来源或许可。

## 功能与权限

每 ${input.everyMinutes} 分钟通过桌宠显示一条台词${input.reaction ? "并播放所选反应" : ""}。
请求权限：${manifest.permissions.join("、")}。
包中没有可执行脚本、账号配置、密钥、对话记录或插件存储。

## 如何使用

在插件页选择“导入插件文件夹”，选择本文件夹，查看并确认权限后才加载插件。
制作和保存本身不会安装或启用插件。停用和卸载可在插件管理页操作。
导入运行时只复制运行清单，分享说明不会被保存到安装目录；请保留原分享包以保留署名和许可声明。
`;
}

function escapeMarkdown(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/[\\`*_{}\[\]()#+.!|~\-]/g, "\\$&");
}

async function canonicalDirectory(path: string, label: string): Promise<string> {
  if (typeof path !== "string" || !isAbsolute(path) || path.startsWith("\\\\") || path.startsWith("//")
    || path.replace(/^[A-Za-z]:/, "").includes(":") || /[\u0000-\u001f\u007f]/.test(path)) {
    throw new Error(`${label}必须为本机普通绝对路径，不能使用网络路径或数据流。`);
  }
  const resolved = resolve(path);
  const stat = await lstat(resolved);
  if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(resolved) !== resolved) {
    throw new Error(`${label}不能经过符号链接、目录链接或非规范路径。`);
  }
  return resolved;
}

async function assertOwnedDirectory(parent: string, parentIdentity: Stats, directory: string, expected: Stats): Promise<void> {
  if (dirname(resolve(directory)) !== parent) throw new Error("插件制作目录超出选定范围。");
  await canonicalDirectory(parent, "插件保存目录");
  const actualParent = await lstat(parent);
  if (actualParent.dev !== parentIdentity.dev || actualParent.ino !== parentIdentity.ino) {
    throw new Error("插件保存目录身份发生变化。");
  }
  await canonicalDirectory(directory, "新建插件目录");
  const actual = await lstat(directory);
  if (actual.dev !== expected.dev || actual.ino !== expected.ino) throw new Error("新建插件目录身份发生变化。");
}
