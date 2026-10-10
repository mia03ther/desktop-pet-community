// 验证宿主独占随机动作，生活插件只保留主动照顾与用户开启的提醒。
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { register, CARE_STATE_TOPIC, CARE_REQUEST_TOPIC, STRETCH_SCHEDULE, EYES_SCHEDULE, NIGHT_SCHEDULE } from "./index.js";

let createTestHarness;
try {
  ({ createTestHarness } = await import("@open-pets/plugin-sdk/testing"));
} catch {
  ({ createTestHarness } = await import(new URL("../../../packages/sdk/dist/testing.js", import.meta.url)));
}
const permissions = ["pet:speak", "pet:interact", "pets:read", "schedule", "storage", "commands", "events", "bus"];
const locales = { en: JSON.parse(await readFile(new URL("./locales/en.json", import.meta.url), "utf8")) };
const originalNow = Date.now;
let currentHarness;
Date.now = () => currentHarness.clock.now();
function create(config = {}, nowMs = 1_000_000_000_000) {
  const h = createTestHarness(register, { permissions, locales, config, nowMs });
  currentHarness = h;
  return h;
}
async function care(h, mood) {
  await h.ctx.bus.publish(CARE_STATE_TOPIC, { version: 1, available: true, mood, sleptUntil: h.clock.now() + 15 * 60_000 });
  await new Promise(setImmediate);
}
try {
  // 未启用提醒时无自动动作、移动、照顾或闲聊；睡眠/无聊快照也不覆盖宿主。
  {
    const h = create({ roam: true, chatter: true });
    const moves = [];
    h.ctx.pet.wander = async (options) => moves.push(options);
    await h.start();
    assert.equal(h.calls.schedules.size, 0);
    await care(h, "bored");
    await h.clock.advance("2h");
    await care(h, "sleeping");
    await h.clock.advance("2h");
    await h.emit("pet:clicked", { petId: "default" });
    assert.equal(moves.length, 0);
    assert.equal(h.calls.react.length, 0);
    assert.equal(h.calls.speak.length, 0);
    assert.equal(h.calls.busPublishes.filter(({ payload }) => ["nap", "play", "wake"].includes(payload.action)).length, 0);
    await h.stop();
    h.expectNoErrors();
  }
  // 照顾仍由虚拟宠物唯一存档；主动命令/双击可照顾，单击交宿主。
  {
    const h = create();
    await h.start();
    await h.runCommand("rest");
    assert.equal(h.calls.busPublishes.filter(({ payload }) => payload.action === "nap").length, 0);
    await care(h, "content");
    await h.runCommand("rest");
    await h.runCommand("wake");
    await h.emit("pet:doubleClicked", { petId: "default" });
    for (const action of ["nap", "wake", "play"]) {
      assert.ok(h.calls.busPublishes.some(({ topic, payload }) => topic === CARE_REQUEST_TOPIC && payload.action === action));
    }
    assert.equal(h.calls.storage.has("state"), false);
    await h.stop();
    const publishes = h.calls.busPublishes.length;
    await h.emit("pet:doubleClicked", { petId: "default" });
    assert.equal(h.calls.busPublishes.length, publishes);
    h.expectNoErrors();
  }
  // 拖拽反馈只在用户操作后发生；错误宠物编号与停用事件均忽略。
  {
    const h = create();
    await h.start();
    await h.emit("pet:dragStart", { petId: "other" });
    assert.equal(h.calls.speak.length, 0);
    await h.emit("pet:dragStart", { petId: "default" });
    await h.emit("pet:dragEnd", { petId: "default" });
    assert.equal(h.calls.speak.length, 2);
    assert.equal(h.calls.react.length, 0);
    await h.stop();
    await h.emit("pet:dragStart", { petId: "default" });
    assert.equal(h.calls.speak.length, 2);
    h.expectNoErrors();
  }
  // 提醒按需开启；隐藏、拖拽、离开电脑和锁屏时不补发，关闭/停用清计时。
  {
    const h = create({ eyeReminder: true, stretchReminder: true });
    let visible = true;
    const getState = h.ctx.pet.getState;
    h.ctx.pet.getState = async () => ({ ...(await getState()), visible });
    await h.start();
    assert.equal(h.calls.schedules.get(EYES_SCHEDULE).intervalMs, 20 * 60_000);
    assert.equal(h.calls.schedules.get(STRETCH_SCHEDULE).intervalMs, 60 * 60_000);
    await h.clock.advance("20m");
    assert.equal(h.calls.alerts.length, 1);
    visible = false;
    await h.clock.advance("20m");
    assert.equal(h.calls.alerts.length, 1);
    visible = true;
    await h.emit("pet:dragStart", { petId: "default" });
    await h.clock.advance("20m");
    assert.equal(h.calls.alerts.length, 1);
    await h.emit("pet:dragEnd", { petId: "default" });
    await h.emit("idle:enter", { idleSeconds: 300 });
    await h.clock.advance("40m");
    assert.equal(h.calls.alerts.length, 1);
    await h.emit("idle:exit", { idleSeconds: 2700 });
    await h.clock.advance("19m");
    assert.equal(h.calls.alerts.length, 1);
    await h.emit("screen:locked", {});
    await h.clock.advance("21m");
    assert.equal(h.calls.alerts.length, 1);
    await h.emit("screen:unlocked", {});
    await h.clock.advance("20m");
    assert.equal(h.calls.alerts.length, 2);
    await h.setConfig({ eyeReminder: false, stretchReminder: false });
    assert.equal(h.calls.schedules.size, 0);
    await h.clock.advance("61m");
    assert.equal(h.calls.alerts.length, 2);
    await h.setConfig({ eyeReminder: true });
    await h.stop();
    assert.equal(h.calls.schedules.size, 0);
    h.expectNoErrors();
  }
  // 午夜提示按本地日期去重，回调重放和重新启动不重复当天提醒。
  {
    const h = create({ nightReminder: true }, new Date(2026, 9, 6, 23, 59).getTime());
    await h.start();
    await h.clock.advance("2m");
    assert.equal(h.calls.alerts.length, 1);
    await h.calls.schedules.get(NIGHT_SCHEDULE).handler();
    assert.equal(h.calls.alerts.length, 1);
    const previousDate = h.calls.storage.get("lastNightDate");
    await h.stop();
    const restarted = create({ nightReminder: true }, h.clock.now());
    await restarted.ctx.storage.set("lastNightDate", previousDate);
    await restarted.start();
    await restarted.calls.schedules.get(NIGHT_SCHEDULE).handler();
    assert.equal(restarted.calls.alerts.length, 0);
    await restarted.stop();
    restarted.expectNoErrors();
  }
  console.log("生活伙伴：不覆盖动作、主动照顾、拖拽反馈与按需提醒检查通过。");
} finally {
  Date.now = originalNow;
}
