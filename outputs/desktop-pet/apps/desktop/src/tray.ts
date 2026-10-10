import { Menu, Tray } from "electron";
import { createTrayIcon } from "./assets.js";
import { getAppStateSnapshot } from "./app-state.js";
import { hideDefaultPet, showDefaultPet, isDefaultPetVisible, setDefaultPetPaused } from "./default-pet-controller.js";
import { quitOpenPets } from "./lifecycle.js";
import { openControlCenterWindow } from "./windows.js";
import { shellState, togglePaused } from "./state.js";
import { openLogsFolder } from "./logger.js";

let tray: Tray | null = null;
export function createAppTray(): Tray {
  if (tray) return tray;
  tray = new Tray(createTrayIcon());
  tray.setToolTip("desktop pet");
  tray.on("double-click", () => openControlCenterWindow("pets"));
  refreshTrayMenu();
  return tray;
}
export function refreshTrayMenu(): void {
  if (!tray) return;
  const state = getAppStateSnapshot();
  const pet = state.pets.installed.find((item) => item.id === state.preferences.defaultPetId);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `desktop pet · ${pet?.displayName ?? "我的伙伴"}`, enabled: false },
    { type: "separator" },
    { label: "打开控制中心", click: () => openControlCenterWindow("pets") },
    { label: isDefaultPetVisible() ? "隐藏桌宠" : "显示桌宠", click: () => { if (isDefaultPetVisible()) hideDefaultPet(); else showDefaultPet(); refreshTrayMenu(); } },
    { label: shellState.paused ? "恢复桌宠活动" : "暂停桌宠活动", click: () => { setDefaultPetPaused(togglePaused()); refreshTrayMenu(); } },
    { type: "separator" },
    { label: "共创网站", click: () => openControlCenterWindow("gallery") },
    { label: "宠物大脑", click: () => openControlCenterWindow("assistant") },
    { label: "人设个性", click: () => openControlCenterWindow("persona") },
    { label: "插件管理", click: () => openControlCenterWindow("plugins") },
    { label: "设置", click: () => openControlCenterWindow("settings") },
    { type: "separator" },
    { label: "打开运行日志", click: () => { void openLogsFolder(); } },
    { label: "退出桌宠", click: () => quitOpenPets() },
  ]));
}
