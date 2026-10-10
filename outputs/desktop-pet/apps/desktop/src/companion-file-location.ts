import { extractFileLocationQuery } from "./file-location-query.js";
import type { CompanionFileLibrary } from "./companion-file-library.js";

/** 仅查询用户已经加入库的范围；唯一匹配才直接打开所在位置。 */
export async function respondToFileLocation(message: string, library: CompanionFileLibrary, reveal: (path: string) => void, signal: AbortSignal, isEnabled: () => boolean): Promise<string | null> {
  const query = extractFileLocationQuery(message);
  if (query === null) return null;
  if (signal.aborted) throw new Error("文件定位已取消。");
  const unavailable = "文件定位需要安装并启用“文件助手”插件。请到共创网站的插件画廊下载，再在工作室的“插件管理”中导入、启用。";
  if (!isEnabled()) return unavailable;
  if (library.getSnapshot().roots.length === 0) return "先到工作室的“插件管理”打开“文件助手”，添加要查找的文件夹。建立分类库后，可以直接问我“某个文件在哪”，无需配置 AI。";
  const result = library.search(query, { excludeMissing: true });
  const exact = result.matches.filter((entry) => entry.name.toLowerCase() === query.toLowerCase());
  const selected = exact.length === 1 ? exact[0] : result.totalMatches === 1 ? result.matches[0] : null;
  if (selected) {
    try {
      const target = await library.resolveEntry(selected.id);
      if (signal.aborted) throw new Error("文件定位已取消。");
      if (!isEnabled()) return unavailable;
      reveal(target);
      return `找到“${selected.name}”，已请求系统打开所在文件夹并选中它。原文件位置未改变。`;
    } catch (error) {
      if (signal.aborted) throw error;
      return `“${selected.name}”当前无法定位，可能已经移动或失去访问权限。请在文件库刷新索引；没有改动文件。`;
    }
  }
  if (result.totalMatches === 0) return "当前索引没有找到匹配。可以换更短的文件名关键词，或在文件库添加目录、刷新索引；这不代表电脑里不存在该文件。";
  const names = result.matches.slice(0, 5).map((entry) => `“${entry.name}”（${entry.category}）`).join("、");
  return `找到 ${result.totalMatches} 个匹配：${names}。请给出更完整的文件名，或在文件库选择对应结果打开所在文件夹；我没有猜测打开哪个。`;
}
