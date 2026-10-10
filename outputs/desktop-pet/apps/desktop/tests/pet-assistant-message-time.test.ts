import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { LocalPetAssistantConversationArchive, PET_ASSISTANT_CONVERSATION_ID } from "../src/pet-assistant-archive.js";
import { PetAssistantConversationController } from "../src/pet-assistant-conversation.js";
import { PetAssistantService } from "../src/pet-assistant-service.js";
import type { PetAssistantCapabilityRuntime } from "../src/pet-assistant-types.js";

const runtime: PetAssistantCapabilityRuntime = {
  snapshot: () => ({ capabilities: [] }),
  execute: async () => ({ ok: true, result: {} }),
};
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

test("普通对话分别保留用户和回答的首次时间，归档并重启后不变", async () => {
  const root = mkdtempSync(join(tmpdir(), "pet-message-time-"));
  const archivePath = join(root, "history.json");
  const model = { generate: async () => {
    await pause();
    return { type: "text" as const, text: "稍后完成的回答" };
  } };
  const service = new PetAssistantService(model, runtime, {
    conversationArchive: new LocalPetAssistantConversationArchive({ archivePath }),
  });
  const controller = new PetAssistantConversationController(service);
  let restarted: PetAssistantConversationController | undefined;
  try {
    await controller.sendTypedMessage("先发送的问题");
    const times = controller.getSnapshot().items.map((item) => item.createdAt);
    assert.ok(times[0]! < times[1]!, "用户发送时间必须早于有真实延迟的回答");
    assert.deepEqual(controller.getConversationHistory().map((item) => item.createdAt), times);
    restarted = new PetAssistantConversationController(new PetAssistantService(model, runtime, {
      conversationArchive: new LocalPetAssistantConversationArchive({ archivePath }),
    }));
    assert.deepEqual(restarted.getSnapshot().items.map((item) => item.createdAt), times);
  } finally {
    controller.dispose();
    restarted?.dispose();
    await service.stop();
    assert.ok(root.startsWith(join(tmpdir(), "pet-message-time-")));
    rmSync(root, { recursive: true, force: true });
  }
});

test("语音部分转写首次时间不随更新、最终正文或重启而改变", async () => {
  const root = mkdtempSync(join(tmpdir(), "pet-voice-time-"));
  const archivePath = join(root, "history.json");
  const model = { generate: () => ({ type: "text" as const, text: "无需请求模型" }) };
  const service = new PetAssistantService(model, runtime, {
    conversationArchive: new LocalPetAssistantConversationArchive({ archivePath }),
  });
  const controller = new PetAssistantConversationController(service);
  let restarted: PetAssistantConversationController | undefined;
  const session = await service.openRealtimeSession();
  try {
    const turn = session.beginTurn("voice-time", new AbortController().signal);
    const partial = (sequence: number, speaker: "user" | "assistant", text: string) => controller.applyNormalizedVoiceTranscript({
      type: "transcript", sequence, conversationId: PET_ASSISTANT_CONVERSATION_ID,
      turnId: turn.turnId, entryId: `partial-${sequence}`, speaker, text, status: "partial",
    });
    partial(1, "user", "先说");
    const userTime = controller.getSnapshot().items[0]!.createdAt;
    await pause();
    turn.recordTranscript("user", "先说的问题");
    await pause();
    partial(2, "assistant", "正在");
    const assistantTime = controller.getSnapshot().items[1]!.createdAt;
    await pause();
    partial(3, "assistant", "正在完整回答");
    await pause();
    turn.recordTranscript("assistant", "完整回答");
    turn.complete("完整回答");
    const times = [userTime, assistantTime];
    assert.ok(userTime! < assistantTime!);
    assert.deepEqual(controller.getSnapshot().items.map((item) => item.createdAt), times);
    assert.deepEqual(controller.getConversationHistory().map((item) => item.createdAt), times);
    restarted = new PetAssistantConversationController(new PetAssistantService(model, runtime, {
      conversationArchive: new LocalPetAssistantConversationArchive({ archivePath }),
    }));
    assert.deepEqual(restarted.getSnapshot().items.map((item) => item.createdAt), times);
  } finally {
    await session.close();
    controller.dispose();
    restarted?.dispose();
    await service.stop();
    assert.ok(root.startsWith(join(tmpdir(), "pet-voice-time-")));
    rmSync(root, { recursive: true, force: true });
  }
});

test("旧历史已有的时间原样保留，新增逐条时间经过有效性校验", () => {
  const root = mkdtempSync(join(tmpdir(), "pet-old-message-time-"));
  const archivePath = join(root, "history.json");
  const oldTime = Date.now() - 10_000;
  try {
    const archive = new LocalPetAssistantConversationArchive({ archivePath });
    archive.append([{ turnId: "old-turn", role: "user", text: "旧记录" }], oldTime);
    const reopened = new LocalPetAssistantConversationArchive({ archivePath });
    assert.equal(reopened.list()[0]!.createdAt, oldTime);
    assert.throws(() => reopened.append([{ turnId: "invalid-time", role: "assistant", text: "无效", createdAt: -1 }]));
    assert.deepEqual(reopened.list().map((item) => item.createdAt), [oldTime]);
  } finally {
    assert.ok(root.startsWith(join(tmpdir(), "pet-old-message-time-")));
    rmSync(root, { recursive: true, force: true });
  }
});
