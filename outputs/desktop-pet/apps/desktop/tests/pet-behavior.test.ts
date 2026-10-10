import assert from "node:assert/strict";
import { test } from "node:test";

import { CompanionFileClassification } from "../src/companion-file-classification.js";
import { defaultPetBehaviorPreferences, normalizePetBehaviorPreferences, validatePetBehaviorPreferences, type PetBehaviorPreferences } from "../src/pet-behavior-config.js";
import { composePetBehaviorDisplay, PetBehaviorController, petAutomaticActionIntervalMs, petExternalActivityLeaseMs, petRandomActionDurationMs } from "../src/pet-behavior.js";
import { validatePreferencePatch } from "../src/preference-patch.js";
import type { ReactionAnimationOverrides, UserSelectableAnimationState } from "../src/reaction-animation-mapping.js";
import type { PetAssistantTextModelResponse } from "../src/pet-assistant-types.js";
import type { PetMediaOptionalAction } from "../src/pet-media-contract.js";

function fixture(quietMode = true) {
  let preferences: PetBehaviorPreferences = { quietMode, actions: [
    { id: "wave", name: "招手", animation: "waving", random: true },
    { id: "happy", name: "开心", animation: "jumping", random: true },
  ] };
  let overrides: ReactionAnimationOverrides | undefined = { idle: "failed", thinking: "waiting", waving: "running" };
  const frames: { animation: UserSelectableAnimationState; ai: boolean; random: boolean }[] = [];
  const media: (PetMediaOptionalAction | null)[] = [];
  const behavior = new PetBehaviorController({
    getPreferences: () => preferences,
    getReactionOverrides: () => overrides,
    render: (animation, ai, random, action) => { frames.push({ animation, ai, random }); media.push(action); },
    random: () => 0,
  });
  return {
    behavior, frames,
    last: () => frames.at(-1)!,
    media: () => media.at(-1),
    preferences: (next: PetBehaviorPreferences) => { preferences = next; behavior.refresh(); },
    overrides: (next: ReactionAnimationOverrides | undefined) => { overrides = next; behavior.refresh(); },
  };
}

test("旧档案默认安静；动作完整校验和偏好保存保持有限图集契约", () => {
  const defaults = normalizePetBehaviorPreferences(undefined);
  assert.equal(defaults.quietMode, true);
  assert.deepEqual(defaults, defaultPetBehaviorPreferences);
  assert.notEqual(defaults.actions, defaultPetBehaviorPreferences.actions);
  assert.equal(normalizePetBehaviorPreferences({ quietMode: false }).quietMode, true);
  const action = { id: "my-wave", name: "  招手  ", animation: "waving", random: true };
  assert.deepEqual(validatePreferencePatch({ petBehavior: { quietMode: false, actions: [action] } }).petBehavior,
    { quietMode: false, actions: [{ ...action, name: "招手" }] });
  assert.deepEqual(validatePetBehaviorPreferences({ quietMode: true, actions: [] }), { quietMode: true, actions: [] });
  for (const invalid of [
    null, { quietMode: "true", actions: [] }, { quietMode: true, actions: [], extra: true },
    { quietMode: true, actions: [action, action] },
    { quietMode: true, actions: [{ ...action, id: "../file" }] },
    { quietMode: true, actions: [{ ...action, name: "a\n" }] },
    { quietMode: true, actions: [{ ...action, name: "长".repeat(33) }] },
    { quietMode: true, actions: [{ ...action, animation: "run-left" }] },
    { quietMode: true, actions: [{ ...action, animation: "/sprite.webp" }] },
    { quietMode: true, actions: [{ ...action, random: 1 }] },
    { quietMode: true, actions: Array.from({ length: 25 }, (_, id) => ({ ...action, id: `action-${id}` })) },
  ]) assert.throws(() => validatePreferencePatch({ petBehavior: invalid }));
  const reset = validatePreferencePatch({ reactionAnimationOverrides: {} });
  assert.equal(Object.hasOwn(reset, "reactionAnimationOverrides"), true, "清空映射仍是一次有效更新");
});

test("点击、真实拖拽与取消只投影可选媒体动作，AI 工作和阻塞仍优先", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  f.behavior.start();
  assert.equal(f.media(), null);
  f.behavior.click();
  assert.equal(f.media(), "clicked");
  t.mock.timers.tick(petRandomActionDurationMs);
  assert.equal(f.media(), null);
  f.preferences({ quietMode: true, actions: [] });
  f.behavior.click();
  assert.equal(f.media(), "clicked", "没有随机候选仍能使用独立点击素材");
  assert.deepEqual(f.last(), { animation: "idle", ai: false, random: false }, "旧包仍是原来的安静待机");
  f.behavior.setAiActivity("chat", "thinking");
  f.behavior.click();
  assert.equal(f.media(), null, "工作时点击不覆盖 AI 动作");
  f.behavior.setBlocked("dragging", true);
  assert.equal(f.media(), "dragged");
  f.behavior.setBlocked("hidden", true);
  assert.equal(f.media(), null);
  f.behavior.setBlocked("dragging", false);
  f.behavior.setBlocked("hidden", false);
  assert.equal(f.media(), null);
  assert.equal(f.last().ai, true, "松开或取消拖拽后恢复真实 AI 工作");
  f.behavior.stop();
  assert.equal(f.media(), null);
});

test("睡眠来自真实养成快照，支持到期、唤醒、停用以及 AI 和交互暂时覆盖", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  const f = fixture(false);
  const topic = "openpets.virtual-pet/state";
  const sleep = { version: 1, available: true, mood: "sleeping", sleptUntil: Date.now() + 300_000 };
  f.behavior.start();
  f.behavior.updateCareState("another-plugin", topic, sleep);
  f.behavior.updateCareState("openpets.virtual-pet", "another-topic", sleep);
  f.behavior.updateCareState("openpets.virtual-pet", topic, { ...sleep, version: 2 });
  f.behavior.updateCareState("openpets.virtual-pet", topic, { ...sleep, sleptUntil: Infinity });
  assert.equal(f.media(), null);
  f.behavior.updateCareState("openpets.virtual-pet", topic, sleep);
  assert.equal(f.media(), "sleeping");
  t.mock.timers.tick(petAutomaticActionIntervalMs);
  assert.equal(f.media(), "sleeping", "关闭安静的自动动作不会打断睡眠素材");
  f.behavior.click();
  assert.equal(f.media(), "clicked");
  t.mock.timers.tick(petRandomActionDurationMs);
  assert.equal(f.media(), "sleeping");
  f.behavior.playAction("wave");
  assert.equal(f.media(), null, "手动选定的动作立即生效");
  t.mock.timers.tick(petRandomActionDurationMs);
  assert.equal(f.media(), "sleeping");
  f.behavior.setAiActivity("chat", "working");
  assert.equal(f.media(), null);
  f.behavior.setAiActivity("chat", null);
  assert.equal(f.media(), "sleeping");
  f.behavior.setBlocked("dragging", true);
  assert.equal(f.media(), "dragged");
  f.behavior.setBlocked("dragging", false);
  assert.equal(f.media(), "sleeping");
  f.behavior.updateCareState("openpets.virtual-pet", topic, { ...sleep, mood: "happy", sleptUntil: 0 });
  assert.equal(f.media(), null, "主动唤醒立即清除睡眠投影");
  f.behavior.updateCareState("openpets.virtual-pet", topic, { ...sleep, sleptUntil: Date.now() + 1000 });
  t.mock.timers.tick(1000);
  assert.equal(f.media(), null, "不等待下一次插件 tick 即按睡眠时限恢复");
  f.behavior.updateCareState("openpets.virtual-pet", topic, { ...sleep, sleptUntil: Date.now() + 1000 });
  f.behavior.updateCareState("openpets.virtual-pet", topic, { version: 1, available: false });
  assert.equal(f.media(), null, "插件停止或损坏清除投影");
  f.behavior.stop();
  const count = f.frames.length;
  f.behavior.updateCareState("openpets.virtual-pet", topic, { ...sleep, sleptUntil: Date.now() + 1000 });
  t.mock.timers.tick(300_000);
  assert.equal(f.frames.length, count, "停止后没有随机或睡眠残留定时器");
});

test("安静待机不服从 idle 覆盖；单击直接随机动画、避免重复并六秒回归", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  f.behavior.start();
  assert.deepEqual(f.last(), { animation: "idle", ai: false, random: false });
  const count = f.frames.length;
  t.mock.timers.tick(petAutomaticActionIntervalMs * 3);
  assert.equal(f.frames.length, count);
  f.behavior.click();
  assert.deepEqual(f.last(), { animation: "waving", ai: false, random: true }, "随机不被 AI waving 映射改成 running");
  f.behavior.click();
  assert.equal(f.last().animation, "jumping", "候选多于一个时切换到不同动画");
  t.mock.timers.tick(petRandomActionDurationMs - 1);
  assert.equal(f.last().animation, "jumping");
  t.mock.timers.tick(1);
  assert.deepEqual(f.last(), { animation: "idle", ai: false, random: false });
  f.preferences({ quietMode: true, actions: [] });
  f.behavior.click();
  assert.equal(f.last().animation, "idle");
  f.behavior.stop();
});

test("关闭安静后自动动作；隐藏、拖拽、暂停、锁屏和停用取消旧定时", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(false);
  f.behavior.start();
  t.mock.timers.tick(petAutomaticActionIntervalMs);
  assert.equal(f.last().random, true);
  t.mock.timers.tick(petRandomActionDurationMs);
  assert.equal(f.last().animation, "idle");
  for (const reason of ["hidden", "dragging", "paused", "locked", "suspended"]) {
    f.behavior.click();
    f.behavior.setBlocked(reason, true);
    const count = f.frames.length;
    t.mock.timers.tick(petAutomaticActionIntervalMs * 3);
    f.behavior.click();
    assert.equal(f.frames.length, count, `${reason} 期间不动作`);
    f.behavior.setBlocked(reason, false);
    t.mock.timers.tick(petAutomaticActionIntervalMs - 1);
    assert.equal(f.last().animation, "idle", "恢复后从新周期开始");
    t.mock.timers.tick(1);
    assert.equal(f.last().random, true);
  }
  f.preferences({ quietMode: true, actions: defaultPetBehaviorPreferences.actions });
  assert.equal(f.last().animation, "idle", "打开安静立即结束自动动作");
  const quietCount = f.frames.length;
  t.mock.timers.tick(petAutomaticActionIntervalMs * 2);
  assert.equal(f.frames.length, quietCount);
  f.behavior.click();
  f.behavior.stop();
  const stoppedCount = f.frames.length;
  t.mock.timers.tick(petExternalActivityLeaseMs * 2);
  f.behavior.click();
  assert.equal(f.frames.length, stoppedCount);
});

test("动作菜单可播放不参与随机的命名动作，忙碌与隐藏时不能覆盖当前状态", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  f.preferences({ quietMode: true, actions: [{ id: "manual", name: "手动挥手", animation: "waving", random: false }] });
  f.behavior.start();
  assert.equal(f.behavior.playAction("unknown"), false);
  assert.equal(f.behavior.playAction("manual"), true);
  assert.equal(f.last().animation, "waving");
  t.mock.timers.tick(petRandomActionDurationMs);
  assert.equal(f.last().animation, "idle");
  f.behavior.setAiActivity("brain", "thinking");
  assert.equal(f.behavior.playAction("manual"), false);
  assert.equal(f.last().animation, "waiting");
  f.behavior.setAiActivity("brain", null);
  f.behavior.setBlocked("hidden", true);
  assert.equal(f.behavior.playAction("manual"), false);
  f.behavior.stop();
});

test("真实 AI 活动优先、映射更新即时生效、终态回待机且解除随机阻塞", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture(false);
  f.behavior.start();
  f.behavior.click();
  f.behavior.setAiActivity("assistant", "thinking");
  assert.deepEqual(f.last(), { animation: "waiting", ai: true, random: false });
  f.behavior.click();
  t.mock.timers.tick(petAutomaticActionIntervalMs * 2);
  assert.equal(f.last().animation, "waiting");
  f.overrides(undefined);
  assert.equal(f.last().animation, "review", "清空用户映射后回默认 AI 动画");
  f.behavior.setAiActivity("assistant", "working");
  assert.equal(f.last().animation, "running");
  f.behavior.setAiActivity("assistant", null);
  assert.deepEqual(f.last(), { animation: "idle", ai: false, random: false });
  f.behavior.click();
  assert.equal(f.last().random, true);
  f.behavior.setAiActivity("assistant", "thinking");
  f.behavior.setBlocked("hidden", true);
  assert.equal(f.last().animation, "idle");
  f.behavior.setBlocked("hidden", false);
  assert.equal(f.last().animation, "review", "恢复时保留仍在工作的真实 AI 状态");
  f.behavior.setAiActivity("assistant", null);
  f.behavior.stop();
});

test("外部会话按来源独立聚合；释放一个不清另一个，失联租约有界回落", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  f.behavior.start();
  f.behavior.setAiActivity("lease:a", "thinking", petExternalActivityLeaseMs);
  f.behavior.setAiActivity("lease:b", "working", petExternalActivityLeaseMs);
  assert.equal(f.last().animation, "running");
  f.behavior.setAiActivity("lease:b", null);
  assert.equal(f.last().animation, "waiting");
  t.mock.timers.tick(petExternalActivityLeaseMs - 1);
  assert.equal(f.last().ai, true);
  t.mock.timers.tick(1);
  assert.deepEqual(f.last(), { animation: "idle", ai: false, random: false });
  f.behavior.setAiActivity("lease:a", "working", petExternalActivityLeaseMs);
  t.mock.timers.tick(petExternalActivityLeaseMs / 2);
  f.behavior.setAiActivity("lease:a", "thinking", petExternalActivityLeaseMs);
  t.mock.timers.tick(petExternalActivityLeaseMs / 2);
  assert.equal(f.last().ai, true, "新活动替换旧失联定时");
  f.behavior.setAiActivity("lease:a", "idle");
  assert.equal(f.last().animation, "idle");
  f.behavior.stop();
});

test("随机和 AI 显示覆盖旧有限反应但保留文字；完成反应仍可短暂显示", () => {
  const message = { reaction: "success" as const, message: "已经完成", reactionMessage: "结果" };
  assert.equal(composePetBehaviorDisplay(message, "idle", false, false), message);
  assert.deepEqual(composePetBehaviorDisplay(message, "waving", false, true), { ...message, animation: "waving" });
  assert.deepEqual(composePetBehaviorDisplay(message, "waiting", true, false), { ...message, animation: "waiting" });
  assert.deepEqual(composePetBehaviorDisplay({ message: "保留语音文本" }, "idle", false, false), { message: "保留语音文本", animation: "idle" });
  assert.deepEqual(composePetBehaviorDisplay(null, "idle", false, false), { animation: "idle" });
});

test("分类 AI 只在真实操作期间忙碌；并发、成功、取消与关闭均结束活动", async () => {
  const events: boolean[] = [];
  const pending: ((response: PetAssistantTextModelResponse) => void)[] = [];
  const service = new CompanionFileClassification({
    onActivity: (active) => events.push(active),
    getProfiles: () => [{ id: "source" }],
    createModel: () => ({ generate: () => new Promise<PetAssistantTextModelResponse>((resolve) => pending.push(resolve)) }),
  });
  const entries = [{ entryId: "sample", name: "示例.txt", fileType: "文档" as const, category: "资料" as const }];
  await assert.rejects(service.generate("unknown", entries, new AbortController().signal), /尚未就绪/);
  assert.deepEqual(events, [], "仅配置来源或无效请求不会触发工作动画");
  const controller = new AbortController();
  const first = service.generate("source", entries, controller.signal);
  const second = service.generate("source", entries, new AbortController().signal);
  assert.deepEqual(events, [true, true]);
  pending[0]!({ type: "text", text: JSON.stringify({ items: [{ entryId: "sample", category: "资料" }], summary: "完成" }) });
  await first;
  assert.deepEqual(events, [true, true, true], "仍有另一项真实操作时保持忙碌");
  service.dispose();
  await assert.rejects(second, /取消/);
  assert.deepEqual(events, [true, true, true, false]);
  const cancelEvents: boolean[] = [];
  const cancellable = new CompanionFileClassification({
    onActivity: (active) => cancelEvents.push(active), getProfiles: () => [{ id: "source" }],
    createModel: () => ({ generate: () => new Promise<PetAssistantTextModelResponse>(() => undefined) }),
  });
  const abort = new AbortController();
  const operation = cancellable.generate("source", entries, abort.signal);
  abort.abort();
  await assert.rejects(operation, /取消/);
  assert.deepEqual(cancelEvents, [true, false]);
  cancellable.dispose();
});
