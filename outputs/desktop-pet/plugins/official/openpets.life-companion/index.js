// 随机动作由宿主独占；本插件保留主动照顾、拖拽反馈和按需提醒。
export const CARE_STATE_TOPIC = "openpets.virtual-pet/state";
export const CARE_REQUEST_TOPIC = "openpets.life-companion/care-request";
export const STRETCH_SCHEDULE = "life-stretch";
export const EYES_SCHEDULE = "life-eyes";
export const NIGHT_SCHEDULE = "life-night";
const MINUTE_MS = 60_000;

export function localDateKey(now = Date.now()) {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function register(OpenPetsPlugin) {
  let ctx;
  let active = false;
  let care = null;
  let dragging = false;
  let away = false;
  let locked = false;
  const subscriptions = [];

  async function careCommand(action, speechKey) {
    if (!active) return;
    await ctx.bus.publish(CARE_REQUEST_TOPIC, { version: 1, action: "status" });
    if (!care) {
      await ctx.pet.speak(ctx.t("speech.enableCare"));
      return;
    }
    await ctx.bus.publish(CARE_REQUEST_TOPIC, { version: 1, action });
    if (active) await ctx.pet.speak(ctx.t(speechKey));
  }

  async function remind(kind) {
    if (!active || locked || away || dragging) return;
    const config = (await ctx.config.get()) ?? {};
    const enabled = { stretch: config.stretchReminder, eyes: config.eyeReminder, night: config.nightReminder };
    if (enabled[kind] !== true) return;
    const state = await ctx.pet.getState();
    if (!active || !state.visible || state.dragging || dragging) return;
    if (kind === "night") {
      const today = localDateKey();
      if (await ctx.storage.get("lastNightDate") === today) return;
      await ctx.storage.set("lastNightDate", today);
    }
    const alert = await ctx.ui.alert({
      text: ctx.t(`reminder.${kind}`), tone: "info", dismissOn: ["action", "click", "petClick"],
      actions: [{ id: "done", label: ctx.t("action.done") }],
    });
    alert.onAction(async () => alert.dismiss());
  }

  async function scheduleReminders() {
    const config = (await ctx.config.get()) ?? {};
    for (const id of [STRETCH_SCHEDULE, EYES_SCHEDULE, NIGHT_SCHEDULE]) await ctx.schedule.cancel(id);
    if (!active) return;
    if (config.stretchReminder === true) await ctx.schedule.every(STRETCH_SCHEDULE, 60 * MINUTE_MS, () => remind("stretch"));
    if (config.eyeReminder === true) await ctx.schedule.every(EYES_SCHEDULE, 20 * MINUTE_MS, () => remind("eyes"));
    if (config.nightReminder === true) await ctx.schedule.daily(NIGHT_SCHEDULE, "00:00", () => remind("night"));
  }

  OpenPetsPlugin.register({
    async start(context) {
      ctx = context;
      active = true;
      subscriptions.push(ctx.bus.subscribe(CARE_STATE_TOPIC, (snapshot) => {
        if (active && snapshot?.version === 1) care = snapshot.available === true ? snapshot : null;
      }));
      subscriptions.push(ctx.events.on("pet:dragStart", async ({ petId }) => {
        if (petId !== "default" || !active) return;
        dragging = true;
        await ctx.pet.speak(ctx.t("speech.drag"));
      }));
      subscriptions.push(ctx.events.on("pet:dragEnd", async ({ petId }) => {
        if (petId !== "default" || !active) return;
        dragging = false;
        await ctx.pet.speak(ctx.t("speech.setDown"));
      }));
      subscriptions.push(ctx.events.on("pet:doubleClicked", ({ petId }) => {
        if (petId === "default") return careCommand("play", "speech.play");
      }));
      subscriptions.push(ctx.events.on("idle:enter", () => { away = true; }));
      subscriptions.push(ctx.events.on("idle:exit", async () => { away = false; await scheduleReminders(); }));
      subscriptions.push(ctx.events.on("screen:locked", () => { locked = true; }));
      subscriptions.push(ctx.events.on("screen:unlocked", async () => { locked = false; await scheduleReminders(); }));
      subscriptions.push(ctx.config.onChange(scheduleReminders));
      await ctx.bus.publish(CARE_REQUEST_TOPIC, { version: 1, action: "status" });
      await scheduleReminders();
      await ctx.commands.register({ id: "rest", title: "$t:command.rest", description: "$t:command.restDescription", icon: "moon" }, () => careCommand("nap", "speech.rest"));
      await ctx.commands.register({ id: "wake", title: "$t:command.wake", description: "$t:command.wakeDescription", icon: "sun" }, () => careCommand("wake", "speech.wake"));
      await ctx.commands.register({ id: "play", title: "$t:command.play", description: "$t:command.playDescription", icon: "heart" }, () => careCommand("play", "speech.play"));
    },
    stop() {
      active = false;
      for (const unsubscribe of subscriptions.splice(0)) unsubscribe();
      care = null;
    },
  });
}
