import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { CompanionPersonaService } from "../src/companion-persona.js";
import { parseCharacterCard, updateCharacterCardField } from "../src/companion-character-card.js";
import { COMPANION_PERSONA_CARD_LIMIT_BYTES } from "../src/companion-persona-types.js";

const fixture = await fs.mkdtemp(path.join(process.env.OPENPETS_FILES_TEST_DIR ?? process.cwd(), "persona-card-test-"));
const statePath = path.join(fixture, "state.json");
const service = new CompanionPersonaService({ statePath });
const v1 = { name: "小岚", description: "温和而直接的桌面伙伴", personality: "坦诚，称呼用户同学", scenario: "安静的书桌", first_mes: "你好，同学。", mes_example: "<START>\n{{user}}: 你好\n{{char}}: 我在，慢慢来。" };
const v2 = { spec: "chara_card_v2", spec_version: "2.0", data: { ...v1,
  system_prompt: "保持简洁，不捏造工具结果。{{original}}", post_history_instructions: "用同学称呼对方。",
  creator_notes: "这是给作者看的备注，不得发送给模型。TEST_CREATOR_SECRET",
  extensions: { unknown: { preserved: "保留未知字段" } },
  character_book: { entries: [
    { enabled: true, constant: true, content: "常驻背景：喜欢雨天读书。" },
    { enabled: false, constant: true, content: "DISABLED_LORE" },
    { enabled: true, keys: ["城镇"], content: "KEYWORD_ONLY_LORE" },
  ] },
} };
const v3 = { ...v2, spec: "chara_card_v3", spec_version: "3.0", data: { ...v2.data, nickname: "岚岚", assets: [{ type: "icon", uri: "https://example.invalid/card.png", name: "main", ext: "png" }] } };
function pngChunk(type: string, data: Buffer): Buffer {
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  result.write(type, 4, "ascii");
  data.copy(result, 8);
  let crc = 0xffffffff;
  for (const byte of result.subarray(4, result.length - 4)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
  return result;
}
function cardPng(entries: { key: string; content: string }[]): Buffer {
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    ...entries.map(({ key, content }) => pngChunk("tEXt", Buffer.from(`${key}\0${Buffer.from(content).toString("base64")}`))),
    pngChunk("IEND", Buffer.alloc(0))]);
}
try {
  for (const [filename, value, expectedName] of [["v1.json", v1, "小岚"], ["v2.json", v2, "小岚"], ["v3.json", v3, "岚岚"]] as const) {
    const source = path.join(fixture, filename);
    await fs.writeFile(source, JSON.stringify(value));
    const snapshot = await service.importFile(source);
    assert.equal(snapshot.enabled, true, "角色卡导入后无需关键词，每轮自动应用");
    assert.equal(snapshot.format, "character-card");
    assert.equal(parseCharacterCard(service.getDocument()!.content).fields.name, expectedName);
    const prompt = service.getPromptStyle()!;
    assert.ok(prompt.includes(expectedName));
    assert.ok(prompt.includes("慢慢来"));
    assert.equal(prompt.includes("{{char}}"), false);
    assert.equal(prompt.includes("TEST_CREATOR_SECRET"), false, "作者备注不得加入对话");
    assert.equal(prompt.includes("DISABLED_LORE"), false);
    assert.equal(prompt.includes("KEYWORD_ONLY_LORE"), false, "没有触发引擎时不能将全部世界书当常驻背景");
    if (filename !== "v1.json") assert.ok(prompt.includes("常驻背景"));
    assert.equal(JSON.stringify(snapshot).includes("慢慢来"), false, "AI 工作监测不含人设正文");
  }
  const largeCard = { ...v2, data: { ...v2.data, extensions: { ignoredMetadata: "x".repeat(70 * 1024) } } };
  const largePath = path.join(fixture, "large-card.json");
  await fs.writeFile(largePath, JSON.stringify(largeCard));
  await service.importFile(largePath);
  assert.ok(service.getSnapshot().contentBytes > 64 * 1024, "角色卡源文件可超过旧 Markdown 容量");
  assert.equal(service.getPromptStyle()!.includes("x".repeat(100)), false, "保留字段不扩大模型上下文");
  assert.deepEqual(JSON.parse(new CompanionPersonaService({ statePath }).getDocument()!.content), largeCard, "大角色卡重启后保留完整扩展");
  const pngPath = path.join(fixture, "角色卡.png");
  await fs.writeFile(pngPath, cardPng([{ key: "chara", content: JSON.stringify(v1) }, { key: "ccv3", content: JSON.stringify(v3) }]));
  await service.importFile(pngPath);
  assert.equal(parseCharacterCard(service.getDocument()!.content).family, "tavern-v3", "PNG 同时含两种元数据时优先 V3");
  assert.ok(service.getPromptStyle()!.includes("岚岚"));
  const edited = updateCharacterCardField(service.getDocument()!.content, "personality", "克制、认真，但会温柔鼓励。🐱");
  service.saveText({ mode: "global-md", format: "character-card", content: edited });
  assert.equal(service.getSnapshot().enabled, true, "已启用角色卡编辑保存应继续用于对话");
  service.setEnabled(true);
  const restarted = new CompanionPersonaService({ statePath });
  assert.equal(restarted.getSnapshot().enabled, true);
  assert.ok(restarted.getPromptStyle()!.includes("克制、认真"));
  const exportPath = path.join(fixture, "exported.json");
  await restarted.exportFile(exportPath);
  const exported = JSON.parse(await fs.readFile(exportPath,"utf8"));
  assert.deepEqual(exported.data.extensions, v3.data.extensions, "未知扩展无损往返");
  assert.deepEqual(exported.data.assets, v3.data.assets);
  assert.deepEqual(exported.data.character_book, v3.data.character_book);
  assert.equal(exported.data.creator_notes, v3.data.creator_notes);
  const markdownPath = path.join(fixture, "exported.md");
  await restarted.exportFile(markdownPath);
  const markdown = await fs.readFile(markdownPath,"utf8");
  assert.ok(markdown.includes("克制、认真"));
  assert.equal(markdown.includes("TEST_CREATOR_SECRET"), false);
  await assert.rejects(restarted.exportFile(exportPath), "不得覆盖旧导出");
  const activePrompt = restarted.getPromptStyle();
  for (const [filename, bytes] of [
    ["invalid.json", Buffer.from("{invalid")],
    ["invalid-card.json", Buffer.from(JSON.stringify({ spec: "chara_card_v3", data: { name: "错误人物", personality: 123 } }))],
    ["ordinary.png", cardPng([])],
    ["invalid.png", Buffer.from("not a PNG")],
    ["large.json", Buffer.from("x".repeat(COMPANION_PERSONA_CARD_LIMIT_BYTES + 1))],
    ["invalid-unicode.json", Buffer.from(JSON.stringify({ ...v1, personality: "\ud800" }))],
  ] as const) {
    const source = path.join(fixture, filename);
    await fs.writeFile(source, bytes);
    await assert.rejects(restarted.importFile(source));
    assert.equal(restarted.getPromptStyle(), activePrompt, "失败不会覆盖已启用人物");
  }
  const corrupt = cardPng([{ key: "chara", content: JSON.stringify(v1) }]);
  corrupt[24] = corrupt[24]! ^ 1;
  await fs.writeFile(path.join(fixture,"corrupt.png"), corrupt);
  await assert.rejects(restarted.importFile(path.join(fixture,"corrupt.png")), "元数据校验失败必须拒绝");
  const lobe = { identifier: "study-buddy", config: { systemRole: "你是一位坦诚、安静的同学。", model: "KEEP_EXISTING_MODEL", plugins: ["DO_NOT_LOAD_PLUGIN"], params: { temperature: 0.7 } }, meta: { title: "学习伙伴", description: "先倾听，再简短回应。" }, custom: { preserve: true } };
  await fs.writeFile(path.join(fixture, "lobe.json"), JSON.stringify(lobe));
  await restarted.importFile(path.join(fixture, "lobe.json"));
  assert.equal(parseCharacterCard(restarted.getDocument()!.content).family, "lobe-agent");
  assert.ok(restarted.getPromptStyle()!.includes("坦诚、安静"));
  assert.equal(restarted.getPromptStyle()!.includes("KEEP_EXISTING_MODEL"), false);
  assert.equal(restarted.getPromptStyle()!.includes("DO_NOT_LOAD_PLUGIN"), false);
  const editedLobe = JSON.parse(updateCharacterCardField(restarted.getDocument()!.content, "name", "书桌伙伴"));
  assert.equal(editedLobe.meta.title,"书桌伙伴");
  assert.equal(editedLobe.config.model,lobe.config.model);
  assert.deepEqual(editedLobe.custom,lobe.custom);
  console.log("角色卡格式导入、人物字段、PNG、原字段往返与模型隔离验证通过。");
} finally {
  await fs.rm(fixture, { recursive: true, force: true });
}