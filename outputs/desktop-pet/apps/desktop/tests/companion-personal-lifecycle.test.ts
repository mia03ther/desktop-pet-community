import assert from "node:assert/strict";
import { register } from "node:module";
import { setImmediate } from "node:timers/promises";
import type { BrowserWindow } from "electron";

// 隔离原生窗口与服务副作用，执行真实聊天载体和退出生命周期代码。
const electronMock = `data:text/javascript,${encodeURIComponent(`
  export const calls = [];
  export const sent = [];
  export const appEvents = new Map();
  export const ipcHandlers = new Map();
  export const ipcListeners = new Map();
  export const ipcMain = {
    handle: (channel, handler) => ipcHandlers.set(channel, handler),
    on: (channel, listener) => ipcListeners.set(channel, listener),
  };
  export const app = {
    on: (name, listener) => appEvents.set(name, listener),
    quit: () => calls.push("app.quit"),
    exit: () => calls.push("app.exit"),
  };
  export const screen = {
    getDisplayMatching: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
  };
  export class BrowserWindow {
    constructor() {
      this.id = 101;
      this.bounds = { x: 300, y: 300, width: 100, height: 100 };
      this.webContents = { id: 201, isDestroyed: () => false, send: (channel, value) => sent.push({ channel, value }) };
    }
    isDestroyed() { return false; }
    on() {}
    getBounds() { return this.bounds; }
    setBounds(bounds) { this.bounds = bounds; }
    setFocusable() {}
    focus() {}
  }
  export const createWindow = () => new BrowserWindow();
`)}`;
const hostMock = `data:text/javascript,${encodeURIComponent(`
  import { calls } from ${JSON.stringify(electronMock)};
  const snapshot = { lastSequence: 0, messages: [], draft: "" };
  const controller = {
    getSnapshot: () => snapshot,
    subscribe: () => () => calls.push("conversation.unsubscribe"),
    sendTypedMessage: async (text) => { calls.push("chat.send:" + text); return { sent: true }; },
    cancelTypedTurn: () => true,
  };
  export const getPetAssistantConversationController = () => controller;
  export const onPetAssistantConversationControllerReady = () => () => {};
  export const onVoiceAssistantEvent = () => () => calls.push("voice.unsubscribe");
  export const getVoiceAssistantSnapshot = () => ({ status: "idle" });
  export const startVoiceAssistant = async () => ({ status: "recording" });
  export const toggleVoiceAssistant = async () => ({ status: "idle" });
  export const retryVoiceAssistant = async () => ({ status: "idle" });
  export const muteVoiceAssistant = async () => ({ muted: true });
  export const unmuteVoiceAssistant = async () => ({ muted: false });
  export const interruptVoiceAssistant = async () => ({ interrupted: true });
  export const endVoiceAssistant = async () => ({ status: "idle" });
  export const createEmptyPetAssistantConversationSnapshot = () => snapshot;
  export const validateConversationMessageInput = (text) => {
    if (typeof text !== "string") throw new Error("测试文字输入无效");
    return text;
  };
`)}`;
const cleanupNames = [
  "closeAllAgentPets", "destroyDefaultPet", "stopLocalIpcServer", "stopRemoteControlService",
  "closeAllLanVisitingPets", "stopPluginService", "stopPetAssistantHost", "stopVoiceAssistantHost",
  "shutdownPluginVoice", "shutdownVoiceAssistantShortcut", "focusOpenTaskWindows",
] as const;
const cleanupMock = `data:text/javascript,${encodeURIComponent(`
  import { calls } from ${JSON.stringify(electronMock)};
  ${cleanupNames.map((name) => `export function ${name}() { calls.push(${JSON.stringify(name)}); return Promise.resolve(); }`).join("\n")}
`)}`;
const displayMock = `data:text/javascript,${encodeURIComponent(`export const defaultPetWindowSize = { width: 100, height: 100 };`)}`;
const stateMock = `data:text/javascript,${encodeURIComponent(`export const getAppStateSnapshot = () => ({ preferences: { petScale: 1 } });`)}`;
const spriteMock = `data:text/javascript,${encodeURIComponent(`export const defaultPetSprite = { frameHeight: 208 };`)}`;
const windowMock = `data:text/javascript,${encodeURIComponent(`
  export const applyLinuxPetWindowShapeWithExpansion = () => {};
  export const refreshDefaultPetFocusPolicy = () => {};
`)}`;
const loggerMock = `data:text/javascript,${encodeURIComponent(`
  export const debug = () => {};
  export const info = () => {};
  export const warn = () => {};
  export const error = () => {};
`)}`;
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    const chat = context.parentURL?.endsWith("/default-pet-chat.js");
    const geometry = context.parentURL?.endsWith("/default-pet-chat-geometry.js");
    const lifecycle = context.parentURL?.endsWith("/lifecycle.js");
    if (chat || geometry || lifecycle) {
      if (specifier === "electron") return { url: ${JSON.stringify(electronMock)}, shortCircuit: true };
      if (specifier === "./logger.js") return { url: ${JSON.stringify(loggerMock)}, shortCircuit: true };
      if (specifier === "./display.js") return { url: ${JSON.stringify(displayMock)}, shortCircuit: true };
      if (specifier.includes("manager-check-in") || specifier.includes("team-service") || specifier.includes("team-protocol")) throw new Error("本地桌宠不应加载团队运行模块");
    }
    if (chat) {
      const overrides = {
        "./pet-assistant-host.js": ${JSON.stringify(hostMock)},
        "./voice-assistant-host.js": ${JSON.stringify(hostMock)},
        "./pet-assistant-conversation.js": ${JSON.stringify(hostMock)},
        "./app-state.js": ${JSON.stringify(stateMock)},
        "./reaction-animation-mapping.js": ${JSON.stringify(spriteMock)},
        "./pet-window.js": ${JSON.stringify(windowMock)},
      };
      if (overrides[specifier]) return { url: overrides[specifier], shortCircuit: true };
    }
    if (lifecycle && specifier !== "./logger.js" && specifier !== "./personal-launch-options.js" && specifier.startsWith("./")) return { url: ${JSON.stringify(cleanupMock)}, shortCircuit: true };
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);

type Handler = (...args: unknown[]) => unknown;
const runtime = await import(electronMock) as {
  calls: string[];
  sent: { channel: string; value: unknown }[];
  appEvents: Map<string, Handler>;
  ipcHandlers: Map<string, Handler>;
  ipcListeners: Map<string, Handler>;
  createWindow(): BrowserWindow;
};
const chat = await import("../src/default-pet-chat.js");
chat.installDefaultPetChatIpcHandlers();
const window = runtime.createWindow();
chat.bindDefaultPetChatWindow(window);
assert.equal(chat.getDefaultPetPanelState(), "collapsed");
assert.equal(chat.projectDefaultPetPanelState("expanded-check-in"), "collapsed");
assert.equal(chat.isDefaultPetPanelState("expanded-check-in"), false);
for (const removedChannel of [
  "openpets:default-pet-check-in-get-snapshot", "openpets:default-pet-check-in-open",
  "openpets:default-pet-check-in-close", "openpets:default-pet-check-in-submit",
]) {
  assert.equal(runtime.ipcHandlers.has(removedChannel), false);
}
assert.equal(runtime.sent.some((event) => event.channel === "openpets:default-pet-check-in-event"), false);

// 普通聊天、语音与练习载体继续使用自己的授权边界和清理流程。
const event = { sender: { id: window.webContents.id } };
const sendMessage = runtime.ipcHandlers.get("openpets:default-pet-chat-send-message");
assert.ok(sendMessage);
await sendMessage(event, "本机聊天正常");
assert.ok(runtime.calls.includes("chat.send:本机聊天正常"));
assert.throws(() => sendMessage({ sender: { id: -1 } }, "不得发送"));
chat.expandDefaultPetChat();
assert.equal(chat.isDefaultPetChatExpanded(), true);
chat.collapseDefaultPetChat();
assert.equal(chat.getDefaultPetPanelState(), "collapsed");
chat.setDefaultPetChatCompactOpen(true);
assert.equal(chat.isDefaultPetChatCompactOpen(), true);
chat.openDefaultPetSession();
assert.equal(chat.isDefaultPetSessionOpen(), true);
chat.closeDefaultPetSession();
assert.equal(chat.isDefaultPetCarrierExpanded(), false);
chat.unbindDefaultPetChatWindow();
assert.equal(runtime.calls.filter((call) => call === "conversation.unsubscribe").length, 1);
assert.equal(runtime.calls.filter((call) => call === "voice.unsubscribe").length, 1);
await setImmediate();

const { installAppLifecycle } = await import("../src/lifecycle.js");
const launches: string[] = [];
installAppLifecycle({
  stopPetDisplayCoordinator: () => { runtime.calls.push("display.stop"); },
  onLaunchRequested: (intent) => { launches.push(intent); },
});
assert.equal(runtime.appEvents.has("open-url"), false);
runtime.appEvents.get("second-instance")?.({}, ["openpets://teams/enroll?intent=obsolete"]);
assert.ok(runtime.calls.includes("focusOpenTaskWindows"));
const focusCount = runtime.calls.filter((call) => call === "focusOpenTaskWindows").length;
runtime.appEvents.get("second-instance")?.({}, ["openpets.exe", "--show-pet"]);
runtime.appEvents.get("second-instance")?.({}, ["openpets.exe", "--open-studio"]);
assert.deepEqual(launches, ["pet", "studio"]);
assert.equal(runtime.calls.filter((call) => call === "focusOpenTaskWindows").length, focusCount);
let prevented = 0;
const beforeQuit = runtime.appEvents.get("before-quit");
assert.ok(beforeQuit);
beforeQuit({ preventDefault: () => { prevented += 1; } });
beforeQuit({ preventDefault: () => { prevented += 1; } });
for (let attempt = 0; attempt < 10 && !runtime.calls.includes("app.quit"); attempt += 1) await setImmediate();
assert.equal(prevented, 2);
assert.equal(runtime.calls.filter((call) => call === "display.stop").length, 1);
for (const resource of cleanupNames.filter((name) => name !== "focusOpenTaskWindows")) {
  assert.equal(runtime.calls.filter((call) => call === resource).length, 1, `${resource} 应退出清理一次`);
}
assert.equal(runtime.calls.filter((call) => call === "app.quit").length, 1);
console.log("本地桌宠聊天和生命周期验证通过：无团队签到入口，普通载体与退出清理保持有效。");
