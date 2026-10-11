import { COMPANION_PERSONA_CARD_LIMIT_BYTES } from "./companion-persona-types.js";
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 读取标准 PNG 角色卡的文本块；不解码画面，不下载卡片引用的素材。 */
export function extractPngCharacterCard(buffer: Buffer): string {
  if (!buffer.subarray(0, 8).equals(signature)) throw new Error("请选择 PNG 角色卡，不是改后缀的图片。");
  const cards = new Map<string, string>();
  let offset = 8;
  let ended = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const next = offset + 12 + length;
    if (next > buffer.length) throw new Error("PNG 角色卡内容不完整。");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "tEXt") {
      const payload = buffer.subarray(offset + 8, offset + 8 + length);
      const delimiter = payload.indexOf(0);
      const key = delimiter < 0 ? "" : payload.toString("latin1", 0, delimiter).toLowerCase();
      if (key === "chara" || key === "ccv3") {
        if (cards.has(key)) throw new Error("PNG 有重复角色卡元数据，请重新导出。");
        if (crc32(buffer.subarray(offset + 4, next - 4)) !== buffer.readUInt32BE(next - 4)) throw new Error("PNG 角色卡元数据已损坏。");
        const encoded = payload.toString("ascii", delimiter + 1).trim();
        if (!/^[A-Za-z0-9+/]*={0,2}$/u.test(encoded) || encoded.length % 4 !== 0) throw new Error("PNG 角色卡不是有效 Base64 数据。");
        if (encoded.length > Math.ceil(COMPANION_PERSONA_CARD_LIMIT_BYTES / 3) * 4) throw new Error("PNG 中的人物 JSON 超过 256 KiB，请精简角色卡。");
        const decoded = Buffer.from(encoded, "base64");
        if (decoded.length > COMPANION_PERSONA_CARD_LIMIT_BYTES) throw new Error("PNG 中的人物 JSON 超过 256 KiB。");
        try { cards.set(key, new TextDecoder("utf-8", { fatal: true }).decode(decoded)); }
        catch { throw new Error("PNG 角色卡中的人物资料必须是有效 UTF-8。"); }
      }
    }
    offset = next;
    if (type === "IEND") { ended = true; break; }
  }
  if (!ended) throw new Error("PNG 角色卡内容不完整。");
  const content = cards.get("ccv3") ?? cards.get("chara");
  if (!content) throw new Error("这张 PNG 没有角色卡元数据。请导出角色卡 PNG／JSON；普通立绘用于桌宠素材导入。");
  return content;
}