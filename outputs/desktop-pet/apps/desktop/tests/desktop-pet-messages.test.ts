import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { bindDesktopPetMessageSink, clearDesktopPetMessageSink, recordDesktopPetMessage, recordDesktopPetBubble, type DesktopPetMessage } from "../src/desktop-pet-messages.js";
import { PetBubbleArbiter } from "../src/plugin-bubble-arbiter.js";
import { PetAssistantService } from "../src/pet-assistant-service.js";
import { PetAssistantConversationController } from "../src/pet-assistant-conversation.js";
import { LocalPetAssistantConversationArchive } from "../src/pet-assistant-archive.js";

test("会话尚未就绪时有界暂存提醒，同一气泡只暂存一次", () => {
  clearDesktopPetMessageSink();
  recordDesktopPetMessage("喝水", "water");
  recordDesktopPetMessage("喝水", "water");
  const messages: DesktopPetMessage[] = [];
  bindDesktopPetMessageSink((message) => { messages.push(message); });
  assert.equal(messages.length, 1);
  assert.equal(messages[0]!.text, "喝水");
  recordDesktopPetMessage("再次喝水");
  assert.equal(messages.length, 2);
  assert.notEqual(messages[0]!.id, messages[1]!.id);
  clearDesktopPetMessageSink();
  for (let i = 0; i < 25; i++) recordDesktopPetMessage(String(i));
  const buffered: DesktopPetMessage[] = [];
  bindDesktopPetMessageSink((message) => { buffered.push(message); });
  assert.equal(buffered.length, 20);
  assert.equal(buffered[0]!.text, "5");
  assert.equal(buffered.at(-1)!.text, "24");
  clearDesktopPetMessageSink();
});

test("退出后清理待发提醒，不把上一段生命周期的暂存发到新会话", () => {
  clearDesktopPetMessageSink();
  recordDesktopPetMessage("退出前暂存");
  clearDesktopPetMessageSink();
  const messages: DesktopPetMessage[] = [];
  bindDesktopPetMessageSink((message) => { messages.push(message); });
  recordDesktopPetMessage("   ");
  assert.equal(messages.length, 0);
  recordDesktopPetMessage("新提醒");
  assert.deepEqual(messages.map((message) => message.text), ["新提醒"]);
  clearDesktopPetMessageSink();
});

test("同一插件同时说话和显示同文本气泡，只记作一次提醒", () => {
  clearDesktopPetMessageSink();
  const messages: DesktopPetMessage[] = [];
  bindDesktopPetMessageSink((message) => { messages.push(message); });
  recordDesktopPetMessage("该喝水啦");
  recordDesktopPetMessage("该喝水啦", "water-bubble");
  recordDesktopPetMessage("休息一下眼睛", "eye-bubble");
  assert.deepEqual(messages.map((message) => message.text), ["该喝水啦", "休息一下眼睛"]);
  clearDesktopPetMessageSink();
});

test("喝水与 Markdown 提醒沿真实气泡队列入库，重启保留时间且不调用 AI", async () => {
  clearDesktopPetMessageSink();
  const directory = mkdtempSync(join(tmpdir(), "pet-reminder-history-"));
  const archivePath = join(directory, "history.json");
  let modelCalls = 0;
  const model = { generate: () => { modelCalls += 1; return { type: "text" as const, text: "不应调用" }; } };
  const runtime = { snapshot: () => ({ capabilities: [] }), execute: async () => ({ ok: true as const, result: {} }) };
  const service = new PetAssistantService(model, runtime, { conversationArchive: new LocalPetAssistantConversationArchive({ archivePath }) });
  const controller = new PetAssistantConversationController(service);
  const arbiter = new PetBubbleArbiter({ present: (_slot, content) => recordDesktopPetBubble(content) });
  const callbacks = { onAction: () => {}, onSubmit: () => {}, onDismiss: () => {} };
  try {
    // 启动未接入聊天时暂存的是提醒发生时间。
    const water = arbiter.show("water-reminder", { text: "该喝水啦", priority: "high", sticky: true }, callbacks);
    bindDesktopPetMessageSink((message) => { controller.publishDesktopMessage(message); });
    const firstTime = controller.getSnapshot().items[0]?.createdAt;
    assert.ok(Number.isSafeInteger(firstTime));
    const eye = arbiter.show("eye-reminder", { markdownHtml: "<strong>休息眼睛</strong><br>看看远处 &amp; 眨眨眼", priority: "normal", sticky: true }, callbacks);
    assert.equal(controller.getSnapshot().items.length, 1);
    await water.dismiss();
    assert.deepEqual(controller.getSnapshot().items.map((item) => item.kind === "message" ? item.text : ""), ["该喝水啦", "休息眼睛\n看看远处 & 眨眨眼"]);
    await eye.dismiss();
    assert.equal(controller.getSnapshot().items.length, 2);
    assert.equal(modelCalls, 0);
    const restartedService = new PetAssistantService(model, runtime, { conversationArchive: new LocalPetAssistantConversationArchive({ archivePath }) });
    const restarted = new PetAssistantConversationController(restartedService);
    assert.equal(restarted.getSnapshot().items[0]?.createdAt, firstTime);
    assert.equal(restarted.getSnapshot().items.length, 2);
    restarted.dispose();
    await restartedService.stop();
  } finally {
    arbiter.clearPlugin("water-reminder");
    arbiter.clearPlugin("eye-reminder");
    clearDesktopPetMessageSink();
    controller.dispose();
    await service.stop();
    assert.ok(directory.startsWith(join(tmpdir(), "pet-reminder-history-")));
    rmSync(directory, { recursive: true, force: true });
  }
});
