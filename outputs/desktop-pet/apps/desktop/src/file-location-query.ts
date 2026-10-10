/** 本地支持的文件询问句式；普通聊天仍交给用户配置的 AI。 */
export function extractFileLocationQuery(message: string): string | null {
  const normalized = message.trim();
  const match = normalized.match(/^(?:请)?(?:帮我)?(?:找一下|找下|查找|定位|找文件)\s*[：:]?\s*(.+?)[。？！?]*$/u)
    ?? normalized.match(/^(.+?)(?:这个文件|文件)?(?:在哪里|在哪儿|在哪)[。？！?]*$/u);
  if (!match) return null;
  const query = match[1].trim().replace(/^[“"《]|[”"》]$/gu, "");
  return query.length > 0 && query.length <= 200 ? query : null;
}
