import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { register } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import type { BrowserWindow } from "electron";

const moduleUrl = (code: string): string => `data:text/javascript,${encodeURIComponent(code)}`;
const electronMock = moduleUrl(`
  import { EventEmitter } from 'node:events';
  let popupCount = 0;
  export const getPopupCount = () => popupCount;
  export class BrowserWindow extends EventEmitter {
    destroyed = false;
    visible = true;
    webContents = new EventEmitter();
    constructor() {
      super();
      this.webContents.isDestroyed = () => this.destroyed;
      this.webContents.sent = [];
      this.webContents.send = (channel, value) => this.webContents.sent.push({ channel, value });
    }
    isDestroyed() { return this.destroyed; }
    isVisible() { return this.visible; }
  }
  export const ipcMain = new EventEmitter();
  export const Menu = { buildFromTemplate: () => ({ popup: () => { popupCount += 1; } }) };
`);
const dialogueMock = moduleUrl(`
  let openCount = 0;
  export const openDefaultPetDialogue = () => { openCount += 1; };
  export const getOpenCount = () => openCount;
`);
const stateMock = moduleUrl(`
  let preferences = { petScale: 0.75, hudScale: 1.1, petBehavior: { quietMode: true, actions: [] } };
  export const getAppStateSnapshot = () => ({ preferences });
  export const getHudScaleForPetScale = () => 1.1;
  export const petScaleOptions = [{ label: 'Medium', value: 0.75 }];
  export const updatePreferences = (patch) => { preferences = { ...preferences, ...patch }; };
`);
const loggerMock = moduleUrl("export const error = () => {}; export const info = () => {};");

register(moduleUrl(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === 'electron') return { url: ${JSON.stringify(electronMock)}, shortCircuit: true };
    if (context.parentURL?.endsWith('/src/pet-window-context-menu.js')) {
      if (specifier === './default-pet-chat.js') return { url: ${JSON.stringify(dialogueMock)}, shortCircuit: true };
      if (specifier === './app-state.js') return { url: ${JSON.stringify(stateMock)}, shortCircuit: true };
      if (specifier === './logger.js') return { url: ${JSON.stringify(loggerMock)}, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`), import.meta.url);

interface TestWindow extends EventEmitter {
  webContents: EventEmitter & { sent: Array<{ channel: string; value?: unknown }> };
}
const electron = await import("electron") as unknown as {
  BrowserWindow: new () => TestWindow;
  ipcMain: EventEmitter;
  getPopupCount(): number;
};
const dialogue = await import(dialogueMock) as { getOpenCount(): number };
const { installPetContextMenu, buildPetContextMenuTemplate } = await import("../src/pet-window-context-menu.js");
const window = new electron.BrowserWindow();
let hideCount = 0;
const action = { label: "隐藏", click: () => { hideCount += 1; }, defaultPet: true };
installPetContextMenu(window as unknown as BrowserWindow, action, () => false);
const rightClick = (x = 80, y = 120): void => {
  let prevented = false;
  window.webContents.emit("context-menu", { preventDefault: () => { prevented = true; } }, { x, y });
  assert.equal(prevented, true);
};

// 单次右键保留五项菜单；双次右键取消待打开的菜单，进入同一输入框。
rightClick();
await delay(350);
assert.equal(electron.getPopupCount(), 1);
assert.equal(dialogue.getOpenCount(), 0);
rightClick();
await delay(40);
rightClick(82, 121);
await delay(350);
assert.equal(electron.getPopupCount(), 1);
assert.equal(dialogue.getOpenCount(), 1);

const menu = await buildPetContextMenuTemplate(action);
const chatItem = menu.find((item) => item.label === "对话");
if (typeof chatItem?.click === "function") chatItem.click({} as never, undefined as never, undefined as never);
assert.equal(dialogue.getOpenCount(), 2);
const hideItem = menu.find((item) => item.label === "隐藏");
if (typeof hideItem?.click === "function") hideItem.click({} as never, undefined as never, undefined as never);
assert.equal(hideCount, 1);

// 两次相距较远的点击不误判为双击；隐藏、导航与关闭不能遗留菜单定时器。
rightClick();
rightClick(140, 120);
await delay(350);
assert.equal(electron.getPopupCount(), 2);
assert.equal(dialogue.getOpenCount(), 2);
rightClick();
window.emit("hide");
await delay(350);
assert.equal(electron.getPopupCount(), 2);
rightClick();
window.webContents.emit("did-start-navigation");
await delay(350);
assert.equal(electron.getPopupCount(), 2);
rightClick();
window.emit("closed");
await delay(350);
assert.equal(electron.getPopupCount(), 2);
assert.equal(window.webContents.listenerCount("context-menu"), 0);
assert.equal(electron.ipcMain.listenerCount("openpets:pet-menu-select"), 0);
