import { BrowserWindow, ipcMain, Menu, type IpcMainEvent } from "electron";

import {
  getAppStateSnapshot,
  getHudScaleForPetScale,
  petScaleOptions,
  updatePreferences,
  type PetScaleValue,
} from "./app-state.js";
import { openDefaultPetDialogue } from "./default-pet-chat.js";
import { error as logError, info } from "./logger.js";

interface PetContextMenuAction {
  readonly label: string;
  readonly click: () => void;
  readonly defaultPet?: boolean;
  readonly petId?: string;
  readonly focusSessionWindow?: () => void;
}

const rightClickDecisionMs = 300;

function openControlCenter(): void {
  void import("./windows.js")
    .then(({ openControlCenterWindow }) => openControlCenterWindow("dashboard"))
    .catch((error: unknown) => logError("pet.window", "open control center failed", error));
}

function openPetDialogue(defaultPet: boolean): void {
  if (defaultPet) {
    openDefaultPetDialogue();
    return;
  }
  void import("./default-pet-controller.js")
    .then(({ showDefaultPet }) => {
      showDefaultPet();
      openDefaultPetDialogue();
    })
    .catch((error: unknown) => logError("pet.window", "open pet dialogue failed", error));
}

export function installPetContextMenu(
  window: BrowserWindow,
  action: PetContextMenuAction,
  shouldUseLayerShellBackend: () => boolean,
): void {
  const webContents = window.webContents;
  let layerShellClicks: Array<() => void> = [];
  let pendingMenu: ReturnType<typeof setTimeout> | null = null;
  let firstRightClick: { x: number; y: number } | null = null;

  const clearPendingMenu = (): void => {
    if (pendingMenu) clearTimeout(pendingMenu);
    pendingMenu = null;
    firstRightClick = null;
  };

  const showMenu = (params: Electron.ContextMenuParams): void => {
    void buildPetContextMenuTemplate(action).then((template) => {
      if (window.isDestroyed() || !window.isVisible()) return;
      if (!shouldUseLayerShellBackend()) {
        Menu.buildFromTemplate(template).popup({ window });
        return;
      }
      let nextClickIndex = 0;
      layerShellClicks = [];
      const flatten = (items: readonly Electron.MenuItemConstructorOptions[]): unknown[] => items.map((item) => {
        if (item.type === "separator") return { type: "separator" };
        const label = item.type === "checkbox"
          ? `${item.checked ? "✓ " : "  "}${item.label ?? ""}`
          : item.label;
        const out: { label?: string; submenu?: unknown[]; clickIndex?: number; type?: string; checked?: boolean } = {
          label,
          ...(item.type ? { type: item.type } : {}),
          ...(item.checked !== undefined ? { checked: item.checked } : {}),
        };
        if (item.submenu) out.submenu = flatten(item.submenu as readonly Electron.MenuItemConstructorOptions[]);
        if (typeof item.click === "function") {
          out.clickIndex = nextClickIndex++;
          layerShellClicks.push(item.click as unknown as () => void);
        }
        return out;
      });
      webContents.send("openpets:pet-menu-data", { x: params.x, y: params.y, items: flatten(template) });
    }).catch((error: unknown) => logError("pet.window", "context menu build failed", error));
  };

  const handleContextMenu = (event: Electron.Event, params: Electron.ContextMenuParams): void => {
    event.preventDefault();
    if (window.isDestroyed()) return;
    // 原生菜单会吞掉第二次右键，先等待短暂判断窗口再打开菜单。
    if (pendingMenu && firstRightClick && Math.hypot(params.x - firstRightClick.x, params.y - firstRightClick.y) <= 12) {
      clearPendingMenu();
      webContents.send("openpets:pet-menu-close");
      openPetDialogue(action.defaultPet === true);
      return;
    }
    clearPendingMenu();
    firstRightClick = { x: params.x, y: params.y };
    pendingMenu = setTimeout(() => {
      pendingMenu = null;
      firstRightClick = null;
      showMenu(params);
    }, rightClickDecisionMs);
  };

  const handleLayerShellSelect = (event: IpcMainEvent, index: unknown): void => {
    if (event.sender !== webContents || !shouldUseLayerShellBackend() || !Number.isInteger(index)) return;
    const click = layerShellClicks[Number(index)];
    layerShellClicks = [];
    click?.();
  };

  webContents.on("context-menu", handleContextMenu);
  webContents.on("did-start-navigation", clearPendingMenu);
  window.on("hide", clearPendingMenu);
  ipcMain.on("openpets:pet-menu-select", handleLayerShellSelect);
  window.once("closed", () => {
    clearPendingMenu();
    if (!webContents.isDestroyed()) {
      webContents.off("context-menu", handleContextMenu);
      webContents.off("did-start-navigation", clearPendingMenu);
    }
    ipcMain.removeListener("openpets:pet-menu-select", handleLayerShellSelect);
  });
}

export function handlePetScaleChange(scale: PetScaleValue): void {
  const previousPreferences = getAppStateSnapshot().preferences;
  const hudScale = getHudScaleForPetScale(scale);
  if (scale === previousPreferences.petScale && hudScale === previousPreferences.hudScale) return;
  updatePreferences({ petScale: scale, hudScale });
  info("pet.window", "pet and HUD scale changed from context menu", {
    petScale: scale,
    hudScale,
    previousPetScale: previousPreferences.petScale,
    previousHudScale: previousPreferences.hudScale,
  });
  void import("./default-pet-controller.js")
    .then(({ refreshDefaultPetContent }) => refreshDefaultPetContent())
    .catch((error: unknown) => logError("pet.window", "refresh default pet on scale change failed", error));
  void import("./agent-pet-controller.js")
    .then(({ refreshAgentPetContent }) => refreshAgentPetContent())
    .catch((error: unknown) => logError("pet.window", "refresh agent pet on scale change failed", error));
}

export async function buildPetContextMenuTemplate(action: PetContextMenuAction): Promise<Electron.MenuItemConstructorOptions[]> {
  const preferences = getAppStateSnapshot().preferences;
  const sizeLabels = ["最小", "小", "中", "大", "最大"];
  const actionItems: Electron.MenuItemConstructorOptions[] = [
    {
      label: "安静模式",
      type: "checkbox",
      checked: preferences.petBehavior.quietMode,
      click: () => {
        const current = getAppStateSnapshot().preferences.petBehavior;
        updatePreferences({ petBehavior: { ...current, quietMode: !current.quietMode } });
        void import("./default-pet-controller.js")
          .then(({ refreshDefaultPetBehavior }) => refreshDefaultPetBehavior())
          .catch((error: unknown) => logError("pet.window", "refresh pet behavior failed", error));
      },
    },
    ...preferences.petBehavior.actions.map((petAction): Electron.MenuItemConstructorOptions => ({
      label: petAction.name,
      click: () => {
        void import("./default-pet-controller.js")
          .then(({ playDefaultPetAction }) => playDefaultPetAction(petAction.id))
          .catch((error: unknown) => logError("pet.window", "play pet action failed", error));
      },
    })),
    { type: "separator" },
    { label: "自定义动作", click: openControlCenter },
  ];
  return [
    { label: "打开控制中心", click: openControlCenter },
    { label: "动作", submenu: actionItems },
    { label: "隐藏", click: action.click },
    { label: "对话", click: () => openPetDialogue(action.defaultPet === true) },
    {
      label: "大小",
      submenu: petScaleOptions.map((option, index) => ({
        label: sizeLabels[index] ?? option.label,
        type: "checkbox",
        checked: preferences.petScale === option.value,
        click: () => handlePetScaleChange(option.value),
      })),
    },
  ];
}
