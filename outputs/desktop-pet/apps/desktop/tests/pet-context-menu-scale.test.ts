/**
 * Catches regressions where right-clicking a pet omits the Size submenu,
 * misidentifies the currently checked scale option, or fails to update
 * the global pet and HUD scale preferences when an option is selected.
 */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { register } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { petScaleOptions, type PetScaleValue } from "../src/app-state-core.js";

const userDataPath = mkdtempSync(join(tmpdir(), "openpets-pet-context-menu-scale-"));
const electronMock = `data:text/javascript,${encodeURIComponent(`
  export class BrowserWindow {
    webContents = { on: () => {}, off: () => {}, send: () => {} };
    isDestroyed() { return false; }
    once() {}
  }
  export const app = { getPath: (name) => name === "userData" ? ${JSON.stringify(userDataPath)} : "" };
  export const clipboard = { readText: () => "", writeText: () => {} };
  export const dialog = { showOpenDialog: async () => ({ canceled: true, filePaths: [] }), showMessageBox: async () => ({ response: 0 }) };
  export const globalShortcut = { register: () => true, unregister: () => {}, unregisterAll: () => {} };
  export const ipcMain = { on: () => {}, off: () => {}, removeListener: () => {}, handle: () => {} };
  export const Menu = { buildFromTemplate: (template) => ({ popup: () => {} }) };
  export const nativeImage = { createEmpty: () => ({ isEmpty: () => true }) };
  export const nativeTheme = { themeSource: "system" };
  export const net = {};
  export const Notification = class { show() {} };
  export const powerMonitor = { on: () => {}, getSystemIdleTime: () => 0 };
  export const protocol = { registerSchemesAsPrivileged: () => {}, handle: () => {} };
  export const safeStorage = { isEncryptionAvailable: () => false };
  export const screen = {
    on: () => {},
    getAllDisplays: () => [],
    getPrimaryDisplay: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
    getDisplayNearestPoint: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }),
    getDisplayMatching: () => ({ scaleFactor: 1 }),
  };
  export const session = { defaultSession: { webRequest: { onHeadersReceived: () => {} } } };
  export const shell = { openPath: async () => "" };
  export const systemPreferences = { isTrustedAccessibilityClient: () => false };
  export const Tray = class { setToolTip() {} setContextMenu() {} };
  export default { BrowserWindow, app, clipboard, dialog, globalShortcut, ipcMain, Menu, nativeImage, nativeTheme, net, Notification, powerMonitor, protocol, safeStorage, screen, session, shell, systemPreferences, Tray };
`)}`;

register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "electron") return { url: ${JSON.stringify(electronMock)}, shortCircuit: true };
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);

const {
  getAppStateSnapshot,
  initializeAppState,
  releaseStartupInstallLock,
  updatePreferences,
} = await import("../src/app-state.js");

const {
  buildPetContextMenuTemplate,
  handlePetScaleChange,
} = await import("../src/pet-window-context-menu.js");

try {
  initializeAppState();

  // 1. Initial state: petScale defaults to Medium (0.75)
  assert.equal(getAppStateSnapshot().preferences.petScale, 0.75);

  // 2. Default pet context menu contains Size submenu with correct checkmarks
  const defaultMenu = await buildPetContextMenuTemplate({
    label: "Hide pet",
    click: () => {},
    defaultPet: true,
  });

  assert.deepEqual(defaultMenu.map((item) => item.label), ["打开控制中心", "动作", "隐藏", "对话", "大小"]);
  const defaultSizeItem = defaultMenu.find((item) => item.label === "大小");
  assert.ok(defaultSizeItem, "default pet menu includes a submenu for Size");
  const defaultSubmenu = defaultSizeItem.submenu as Electron.MenuItemConstructorOptions[];
  assert.equal(defaultSubmenu.length, petScaleOptions.length, "size submenu contains all scale options");

  const mediumOption = defaultSubmenu.find((opt) => opt.label === "中");
  assert.ok(mediumOption, "Medium scale option is present");
  assert.equal(mediumOption.checked, true, "Medium option is initially checked");

  const hugeOption = defaultSubmenu.find((opt) => opt.label === "最大");
  assert.ok(hugeOption, "Huge scale option is present");
  assert.equal(hugeOption.checked, false, "Huge option is initially unchecked");

  // 3. Selecting a different size option updates both global scales.
  if (typeof hugeOption.click === "function") {
    hugeOption.click({} as any, undefined as any, undefined as any);
  }
  assert.equal(getAppStateSnapshot().preferences.petScale, 1.25, "clicking Huge updates the global petScale preference");
  assert.equal(getAppStateSnapshot().preferences.hudScale, 1.7, "clicking Huge updates the global HUD scale preference");

  // 4. Next menu build reflects the newly selected size as checked
  const updatedDefaultMenu = await buildPetContextMenuTemplate({
    label: "Hide pet",
    click: () => {},
    defaultPet: true,
  });
  const updatedSizeItem = updatedDefaultMenu.find((item) => item.label === "大小");
  const updatedSubmenu = updatedSizeItem?.submenu as Electron.MenuItemConstructorOptions[];
  const updatedHugeOption = updatedSubmenu.find((opt) => opt.label === "最大");
  const updatedMediumOption = updatedSubmenu.find((opt) => opt.label === "中");
  assert.equal(updatedHugeOption?.checked, true, "Huge option is now checked");
  assert.equal(updatedMediumOption?.checked, false, "Medium option is no longer checked");

  // 5. Agent pet context menu also includes the Size submenu and reflects the same global preference
  const agentMenu = await buildPetContextMenuTemplate({
    label: "Close pet",
    click: () => {},
    petId: "fox",
  });
  assert.deepEqual(agentMenu.map((item) => item.label), ["打开控制中心", "动作", "隐藏", "对话", "大小"]);
  const agentSizeItem = agentMenu.find((item) => item.label === "大小");
  assert.ok(agentSizeItem, "agent pet menu includes Size submenu");
  const agentSubmenu = agentSizeItem.submenu as Electron.MenuItemConstructorOptions[];
  const agentHugeOption = agentSubmenu.find((opt) => opt.label === "最大");
  assert.equal(agentHugeOption?.checked, true, "agent pet menu reflects global Huge scale");

  // 6. Direct scale change through handlePetScaleChange updates preference across all stepped tiers
  handlePetScaleChange(0.35 as PetScaleValue);
  assert.equal(getAppStateSnapshot().preferences.petScale, 0.35, "handlePetScaleChange updates global preference to XS");
  assert.equal(getAppStateSnapshot().preferences.hudScale, 0.85, "XS pet size uses the minimum readable HUD scale (0.85)");

  handlePetScaleChange(0.5 as PetScaleValue);
  assert.equal(getAppStateSnapshot().preferences.petScale, 0.5, "handlePetScaleChange updates global preference to Small");
  assert.equal(getAppStateSnapshot().preferences.hudScale, 0.85, "Small pet size keeps the minimum readable HUD scale (0.85)");

  handlePetScaleChange(0.75 as PetScaleValue);
  assert.equal(getAppStateSnapshot().preferences.petScale, 0.75, "handlePetScaleChange updates global preference to Medium");
  assert.equal(getAppStateSnapshot().preferences.hudScale, 1.1, "Medium pet size uses the 1.1 HUD scale");

  handlePetScaleChange(1 as PetScaleValue);
  assert.equal(getAppStateSnapshot().preferences.petScale, 1, "handlePetScaleChange updates global preference to Large");
  assert.equal(getAppStateSnapshot().preferences.hudScale, 1.4, "Large pet size uses the 1.4 HUD scale");

  // 动作子菜单使用用户保存的命名，不退回固定动画标签。
  updatePreferences({
    petBehavior: { quietMode: true, actions: [{ id: "wave", name: "招招手", animation: "waving", random: true }] },
  });
  const customMenu = await buildPetContextMenuTemplate({ label: "隐藏", click: () => {}, defaultPet: true });
  const customActions = customMenu.find((item) => item.label === "动作")?.submenu as Electron.MenuItemConstructorOptions[];
  assert.ok(customActions.some((item) => item.label === "招招手"));
  const quietOption = customActions.find((item) => item.label === "安静模式");
  assert.equal(quietOption?.checked, true);
  if (typeof quietOption?.click === "function") quietOption.click({} as never, undefined as never, undefined as never);
  assert.equal(getAppStateSnapshot().preferences.petBehavior.quietMode, false);
  assert.equal(getAppStateSnapshot().preferences.petBehavior.actions[0]?.name, "招招手");
} finally {
  releaseStartupInstallLock();
  rmSync(userDataPath, { recursive: true, force: true });
}
