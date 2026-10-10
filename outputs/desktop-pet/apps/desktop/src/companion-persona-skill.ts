import * as fs from "node:fs/promises";
import path from "node:path";
import { COMPANION_PERSONA_IMPORT_LIMIT_BYTES } from "./companion-persona-types.js";

const MAX_FILES = 256;
const MAX_BUNDLE_BYTES = 16 * 1024 * 1024;
const MAX_FILE_BYTES = 4 * 1024 * 1024;

export interface PersonaSkillData {
  directoryName: string;
  files: string[];
  totalBytes: number;
  referencedTexts: { path: string; content: string }[];
}

export function validateSkillDirectoryName(value: unknown): string {
  if (typeof value !== "string" || !value || value === "." || value === ".."
    || /[\\/:\u0000-\u001f]/u.test(value) || value.length > 120) {
    throw new Error("请选择托管 skills 目录中的人物文件夹。");
  }
  return value;
}

export function decodeSkillText(buffer: Uint8Array): string {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text)) throw new Error();
    return text;
  } catch {
    throw new Error("Skill 正文与引用资料必须是有效 UTF-8 文本。");
  }
}

/** 只展开正文明确提到的本地文本，不根据人物文档执行命令或抓取网络。 */
function referencedPaths(content: string): string[] {
  const paths = new Set<string>();
  const markdownLinks = content.matchAll(/\]\(\s*<?([^\s)>]+)>?(?:\s+[^)]*)?\)/gu);
  const inlinePaths = content.matchAll(/`([^`\n]+)`/gu);
  const bareReferences = content.matchAll(/(?:^|[\s(])((?:\.\/)?references\/[^\s`<>"')]+\.(?:md|markdown|txt|json))(?:$|[\s)])/gmu);
  for (const match of [...markdownLinks, ...inlinePaths, ...bareReferences]) {
    let candidate = match[1]!.split(/[?#]/u)[0]!;
    if (/^[a-z][a-z\d+.-]*:/iu.test(candidate) || candidate.startsWith("#")) continue;
    if (!/\.(?:md|markdown|txt|json)$/iu.test(candidate)) continue;
    try { candidate = decodeURIComponent(candidate); }
    catch { throw new Error("Skill 引用路径编码无效。"); }
    candidate = candidate.replaceAll("\\", "/").replace(/^\.\//u, "");
    if (candidate.startsWith("/") || candidate.includes(":") || candidate.split("/").includes("..")) {
      throw new Error("Skill 引用不能离开所导入的文件夹。");
    }
    paths.add(candidate);
  }
  return [...paths];
}

/** 导入时完整读取一次，复制和提示词只使用已核验的字节，不追随链接。 */
export async function readPersonaSkillDirectory(source: string, assertNoLinks: (target: string) => void, signal?: AbortSignal) {
  const files = new Map<string, Buffer>();
  const directories: string[] = [];
  let totalBytes = 0;
  let entryCount = 0;
  async function walk(directory: string, depth: number): Promise<void> {
    if (signal?.aborted) throw new Error("人物导入已取消。");
    if (depth > 12) throw new Error("Skill 文件夹层级过深。");
    assertNoLinks(directory);
    const entries = await fs.opendir(directory);
    for await (const entry of entries) {
      entryCount += 1;
      if (entryCount > 512) throw new Error("Skill 文件夹项目过多。");
      const fullPath = path.join(directory, entry.name);
      assertNoLinks(fullPath);
      if (entry.isSymbolicLink()) throw new Error("Skill 文件夹不能包含符号链接或目录联接。");
      if (entry.isDirectory()) {
        directories.push(path.relative(source, fullPath).split(path.sep).join("/"));
        await walk(fullPath, depth + 1);
        continue;
      }
      if (!entry.isFile()) throw new Error("Skill 文件夹只能包含普通文件。");
      if (files.size >= MAX_FILES) throw new Error("Skill 文件夹最多支持 256 个文件。");
      const handle = await fs.open(fullPath, "r");
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size > MAX_FILE_BYTES) throw new Error("Skill 单个文件不能超过 4 MiB。");
        const buffer = Buffer.alloc(stat.size + 1);
        let length = 0;
        while (length < buffer.length) {
          if (signal?.aborted) throw new Error("人物导入已取消。");
          const { bytesRead } = await handle.read(buffer, length, buffer.length - length, length);
          if (bytesRead === 0) break;
          length += bytesRead;
        }
        if (length !== stat.size) throw new Error("Skill 文件在读取时发生变化，请重新导入。");
        totalBytes += length;
        if (totalBytes > MAX_BUNDLE_BYTES) throw new Error("Skill 完整文件夹不能超过 16 MiB。");
        files.set(path.relative(source, fullPath).split(path.sep).join("/"), buffer.subarray(0, length));
      } finally {
        await handle.close();
      }
    }
  }
  await walk(source, 0);
  const entry = files.get("SKILL.md");
  if (!entry) throw new Error("请选择根目录包含 SKILL.md 的完整人物 Skill 文件夹。");
  if (entry.length > COMPANION_PERSONA_IMPORT_LIMIT_BYTES) throw new Error("SKILL.md 超过 64 KiB，请精简后导入。");
  const content = decodeSkillText(entry);
  const manifest = files.get("manifest.json");
  if (manifest) {
    try {
      const parsed: unknown = JSON.parse(decodeSkillText(manifest));
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    } catch {
      throw new Error("manifest.json 必须是有效 UTF-8 JSON 对象；其中的权限和命令不会执行。");
    }
  }
  const referencedTexts = referencedPaths(content).map((reference) => {
    const buffer = files.get(reference);
    if (!buffer) throw new Error(`Skill 明确引用的文本不存在：${reference}`);
    if (buffer.length > COMPANION_PERSONA_IMPORT_LIMIT_BYTES) throw new Error(`Skill 引用文本超过 64 KiB：${reference}`);
    const text = decodeSkillText(buffer);
    if (!text.trim()) throw new Error(`Skill 引用文本不能为空：${reference}`);
    return { path: reference, content: text };
  });
  return { content, files, directories, totalBytes, referencedTexts };
}
