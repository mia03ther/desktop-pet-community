import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";
import { LocalPetAssistantConversationArchive } from "../src/pet-assistant-archive.js";
import { PetAssistantConversationController } from "../src/pet-assistant-conversation.js";
import { PetAssistantService } from "../src/pet-assistant-service.js";
import { CompanionAiTasksService } from "../src/companion-ai-tasks.js";
import type { PetAssistantTextModelRequest } from "../src/pet-assistant-types.js";

it("桌宠提醒与协同回复共用历史，重启去重，并进入下一次桌宠对话上下文", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "desktop-pet-brain-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const archive = new LocalPetAssistantConversationArchive({ userDataPath: directory });
  const requests: PetAssistantTextModelRequest[] = [];
  const create = () => new PetAssistantService({ generate: (request) => {
    requests.push(request);
    return { type: "text", text: "我会提醒你，也会陪你聊天。" };
  } }, { snapshot: () => ({ capabilities: [] }), execute: async () => ({ ok: true, result: {} }) }, { conversationArchive: archive });
  const firstService = create();
  const first = new PetAssistantConversationController(firstService);
  assert.equal(first.publishDesktopMessage({ id: "drink:one", text: "喝一点水吧。" }), true);
  assert.equal(first.publishDesktopMessage({ id: "drink:one", text: "重复提醒" }), false);
  assert.equal(first.publishDesktopMessage({ id: "analysis:one:summary", text: "协同分析：建议调整保存路径。" }), true);
  assert.equal(requests.length, 0, "提醒与协同消息自身不能调用模型");
  assert.equal(archive.list().length, 2);
  first.dispose();
  await firstService.stop();
  const secondService = create();
  const second = new PetAssistantConversationController(secondService);
  assert.equal(second.getSnapshot().items.length, 2);
  assert.equal(second.publishDesktopMessage({ id: "drink:one", text: "重启后的重复提醒" }), false);
  await second.sendTypedMessage("你刚才提醒了什么？");
  assert.equal(requests.length, 1);
  assert.ok(requests[0].messages.some((message) => message.role === "assistant" && message.content === "喝一点水吧。"));
  assert.ok(requests[0].messages.some((message) => message.role === "assistant" && message.content === "协同分析：建议调整保存路径。"));
  assert.equal(second.getSnapshot().items.length, 4);
  second.dispose();
  await secondService.stop();
});

it("插入桌宠提醒不打断正在进行的对话，也不重复触发模型", async () => {
  let finish!: (response: { type: "text"; text: string }) => void;
  let calls = 0;
  const service = new PetAssistantService({ generate: () => {
    calls += 1;
    return new Promise((resolve) => { finish = resolve; });
  } }, { snapshot: () => ({ capabilities: [] }), execute: async () => ({ ok: true, result: {} }) });
  const controller = new PetAssistantConversationController(service);
  const turn = controller.sendTypedMessage("正在聊的话题");
  while (!finish) await new Promise<void>((resolve) => setImmediate(resolve));
  const before = controller.getSnapshot();
  controller.publishDesktopMessage({ id: "eyes:one", text: "休息一下眼睛。" });
  assert.equal(controller.getSnapshot().activeTurnId, before.activeTurnId);
  assert.equal(controller.getSnapshot().activity, before.activity);
  assert.equal(calls, 1);
  finish({ type: "text", text: "继续刚才的话题。" });
  await turn;
  assert.equal(controller.getSnapshot().items.length, 3);
  controller.dispose();
  await service.stop();
});

it("协同任务通过桌宠消息出口给出问题与各模型回复，结果不执行工具", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "desktop-pet-analysis-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const messages: Array<{ id: string; text: string; role?: "user" | "assistant" }> = [];
  const tasks = new CompanionAiTasksService({
    statePath: join(directory, "tasks.json"),
    getProfiles: () => [{ id: "a", label: "来源甲" }, { id: "b", label: "来源乙" }],
    createModel: () => ({ generate: () => ({ type: "text", text: "检查磁盘保存位置。" }) }),
    onMessage: (id, text, role) => messages.push({ id, text, role }),
  });
  const task = tasks.startTask({ id: "preview", problem: "磁盘空间不足", context: "磁盘可用空间为 10%", expiresAt: Date.now() + 60_000 }, ["a", "b"], "a");
  for (let count = 0; count < 40 && tasks.getTasks()[0].state === "running"; count += 1) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  assert.equal(tasks.getTasks()[0].state, "completed");
  assert.equal(messages.length, 4);
  assert.equal(messages[0].role, "user");
  assert.ok(messages.every((message) => message.id.includes(task.id)));
  assert.ok(messages.some((message) => message.text.includes("协同汇总")));
  tasks.dispose();
});
