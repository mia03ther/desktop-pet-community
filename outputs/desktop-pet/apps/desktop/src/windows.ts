import { readFile, realpath, stat } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import sharp from "sharp";

import { app, BrowserWindow, clipboard, dialog, ipcMain, protocol, screen, shell, type WebContents } from "electron";

import { getAgentSetupSnapshot, runAgentSetupAction, updateAgentSetupCommandPaths } from "./agent-setup.js";
import { refreshAgentPetContent } from "./agent-pet-controller.js";
import { getAppStateSnapshot, hudScaleOptions, normalizePetPoolOrder, petScaleOptions, setPetPoolOrder, updatePreferences } from "./app-state.js";
import { applyRoamingToAllPets } from "./pet-roaming-controller.js";
import { createAppIcon } from "./assets.js";
import { CommunityWebsite } from "./community-website.js";
import { getCatalogPageUiState, getCatalogSearchUiState, getCatalogUiState } from "./catalog.js";
import { getCodexPetsUiState, importCodexPet, readCodexPetSpritesheet } from "./codex-pets.js";
import { codexV2SpriteLayout, type CodexPetSpriteLayout } from "./codex-pets-core.js";
import { setConfinementEnabled } from "./confinement-manager.js";
import { setCrossDisplayRoamingEnabled } from "./display.js";
import { getActiveLocale, getActiveMessages, LOCALE_LABELS, SUPPORTED_LOCALES, setLocaleFromPreference, t, type Locale, type LocalePreference } from "./i18n/index.js";
import { showDefaultPet, hideDefaultPet, recoverDefaultPetMouseInterop, refreshDefaultPetContent, refreshDefaultPetBehavior, resetDefaultPetToInitialPosition } from "./default-pet-controller.js";
import { readInstalledPetSpriteLayout } from "./installed-pet-layout.js";
import { isMediaPetMetadata, isPetMediaActionId, maxPetMediaFileBytes, petMediaContentType } from "./pet-media-contract.js";
import { readInstalledPetMetadata } from "./pet-media-files.js";
import { readBoundedRegularFile } from "./pet-file-safety.js";
import { refreshPetGazePreference, refreshPetChatAppearance } from "./pet-window.js";
import { getLanStatusSnapshot } from "./lan-controller.js";
import { validatePreferencePatch } from "./preference-patch.js";
import { assertSafePetId, getPetDir } from "./pet-paths.js";
import { debug, error as logError, warn } from "./logger.js";
import {
  getPluginService,
  type PluginConfigSoundPickResult,
  type PluginServiceResult,
} from "./plugin-service.js";
import { defaultPetSprite, getConfiguredSpriteStates, reactionAnimationMetadata, selectableAnimationMetadata, waitingAnimationDurationOptions } from "./reaction-animation-mapping.js";
import { readSafePluginManifest } from "./plugin-manifest-reader.js";
import { registerSessionMediaProtocol } from "./session-media-cache.js";
import { registerPluginAssetProtocol } from "./plugin-asset-protocol.js";
import { createCompanionPluginPackage } from "./companion-plugin-authoring.js";
import { installControlCenterPluginAuthoringIpcHandlers } from "./control-center-plugin-authoring-ipc.js";
import { installControlCenterPluginIpcHandlers } from "./control-center-plugin-ipc.js";
import { installControlCenterCompanionIpcHandlers, type CompanionIpcLifecycle } from "./control-center-companion-ipc.js";
import { getCompanionToolsService } from "./companion-tools.js";
import { getCompanionDownloadsService } from "./companion-downloads.js";
import { assertCompanionToolPluginAccess, companionToolPluginIds, type CompanionToolPluginKind } from "./companion-tool-plugins.js";
import { inspectCompanionInstaller } from "./companion-software-inspection.js";
import { CompanionFilesService } from "./companion-files.js";
import { getCompanionFileLibrary } from "./companion-file-library.js";
import { installControlCenterFileLibraryIpcHandlers, type FileLibraryIpcLifecycle } from "./control-center-file-library-ipc.js";
import { captureCompanionWindowUnderCursor } from "./companion-diagnostics.js";
import { installControlCenterAiIpcHandlers, type CompanionAiIpcLifecycle } from "./control-center-ai-ipc.js";
import { getCompanionAiHost } from "./companion-ai-host.js";
import { installControlCenterAgentSetupIpcHandlers } from "./control-center-agent-setup-ipc.js";
import { installControlCenterRemoteIpcHandlers } from "./control-center-remote-ipc.js";
import { getPetAssistantConversationController, getPetAssistantModalityCoordinator } from "./pet-assistant-host.js";
import { clearConversationHistory, deleteConversationHistoryMessage, getConversationHistory } from "./pet-assistant-history-ipc.js";
import { getRemoteControlService } from "./remote-control-service.js";
import { configureVoiceAssistantShortcut, getVoiceAssistantShortcutSnapshot, resolveVoiceAssistantShortcutPreference } from "./voice-assistant-shortcut.js";
import { configureChatShortcut, getChatShortcutSnapshot, resolveChatShortcutPreference } from "./chat-shortcut.js";
import { configurePetToggleShortcut, getPetToggleShortcutSnapshot, resolvePetToggleShortcutPreference } from "./pet-toggle-shortcut.js";
import { normalizeControlCenterRoute, normalizeControlCenterRouteTarget, type ControlCenterRoute, type ControlCenterRouteTarget } from "./control-center-route.js";
import { getSharedVoiceDeviceService } from "./voice-device-service.js";
import { normalizeVoiceDeviceId } from "./voice-device-resolver.js";
import { installControlCenterProviderIpcHandlers, type ControlCenterProviderIpcLifecycle } from "./control-center-provider-ipc.js";
import { installControlCenterPetManagementIpcHandlers } from "./control-center-pet-management-ipc.js";
import { installControlCenterOriginalProjectIpcHandlers } from "./control-center-original-project-ipc.js";
import { OriginalProjectStore } from "./original-projects.js";
import { launchOriginalProjectExecutable } from "./original-project-execution.js";
import { exportInstalledPetPackage, installPet, installPetFromFolder, installShimejiPetFromFolderWithResult, installPetFromSpritesheetFileWithResult, installPetFromZipFile, preparePersonalPetSpritesheet, removePet, setDefaultInstalledPet } from "./pet-installation.js";

type InternalUiWindowKind = "control-center";
export type { ControlCenterRoute } from "./control-center-route.js";
let controlCenterWindow: BrowserWindow | null = null;
let controlCenterQuitting = false;
let internalUiHandlersInstalled = false;
let pendingControlCenterRouteTarget: ControlCenterRouteTarget | null = null;
let pendingDockTimer: NodeJS.Timeout | null = null;
let lastDockHideAt = 0;
let controlCenterProviderIpc: ControlCenterProviderIpcLifecycle | null = null;
let pluginAuthoringIpc: ReturnType<typeof installControlCenterPluginAuthoringIpcHandlers> | null = null;
let companionIpc: CompanionIpcLifecycle | null = null;
let fileLibraryIpc: FileLibraryIpcLifecycle | null = null;
let companionAiIpc: CompanionAiIpcLifecycle | null = null;
let petManagementIpc: ReturnType<typeof installControlCenterPetManagementIpcHandlers> | null = null;
let originalProjectIpc: ReturnType<typeof installControlCenterOriginalProjectIpcHandlers> | null = null;
const dockHideShowCooldownMs = 1100;
// 只在原配置所有者成功提交变更后失效额度；连接测试不改变额度缓存。
const providerQuotaInvalidationChannels = new Set([
  "openpets:provider-profile-create",
  "openpets:provider-profile-update",
  "openpets:provider-profile-save",
  "openpets:provider-profile-delete",
  "openpets:provider-profile-select",
  "openpets:provider-profile-credential-set",
  "openpets:provider-profile-credential-delete",
]);

function hasOpenInternalUiWindows(): boolean {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed() && controlCenterWindow.isVisible()) return true;
  return false;
}

function syncDockVisibilityForInternalUi(): void {
  if (process.platform !== "darwin") return;
  const dock = app.dock;
  if (!dock) return;

  if (pendingDockTimer) {
    clearTimeout(pendingDockTimer);
    pendingDockTimer = null;
  }

  if (hasOpenInternalUiWindows()) {
    const elapsedSinceHide = Date.now() - lastDockHideAt;
    const delayMs = elapsedSinceHide < dockHideShowCooldownMs ? dockHideShowCooldownMs - elapsedSinceHide : 0;
    pendingDockTimer = setTimeout(() => {
      pendingDockTimer = null;
      dock.setIcon(createAppIcon());
      dock.show();
    }, delayMs);
  } else {
    dock.hide();
    lastDockHideAt = Date.now();
  }
}

function getSettingsStateSnapshot(): {
  preferences: Pick<ReturnType<typeof getAppStateSnapshot>["preferences"], "openDefaultPetOnLaunch" | "appearanceTheme" | "speechBubblesEnabled" | "petScale" | "hudScale" | "waitingAnimationDurationMs" | "idleCursorGazeEnabled" | "reactionAnimationOverrides" | "petBehavior" | "petChatAppearance" | "petPoolOrder" | "petPoolEnabled" | "petConfinementEnabled" | "petCrossDisplayEnabled" | "petGravityEnabled" | "personality" | "voiceAssistantShortcut" | "chatShortcut" | "petToggleShortcut" | "showChatButton" | "showTalkButton" | "petButtonsPosition" | "petButtonsSize">;
  petScaleOptions: typeof petScaleOptions;
  hudScaleOptions: typeof hudScaleOptions;
  /** Non-broken, non-built-in installed pets available for pool selection. */
  petPoolCandidates: ReadonlyArray<{ readonly id: string; readonly displayName: string }>;
  voiceAssistantShortcutStatus: ReturnType<typeof getVoiceAssistantShortcutSnapshot>;
  chatShortcutStatus: ReturnType<typeof getChatShortcutSnapshot>;
  petToggleShortcutStatus: ReturnType<typeof getPetToggleShortcutSnapshot>;
} {
  const state = getAppStateSnapshot();
  return {
    preferences: {
      openDefaultPetOnLaunch: state.preferences.openDefaultPetOnLaunch,
      appearanceTheme: state.preferences.appearanceTheme,
      speechBubblesEnabled: state.preferences.speechBubblesEnabled,
      petScale: state.preferences.petScale,
      hudScale: state.preferences.hudScale,
      waitingAnimationDurationMs: state.preferences.waitingAnimationDurationMs,
      idleCursorGazeEnabled: state.preferences.idleCursorGazeEnabled,
      reactionAnimationOverrides: state.preferences.reactionAnimationOverrides,
      petBehavior: state.preferences.petBehavior,
      petChatAppearance: state.preferences.petChatAppearance,
      petPoolOrder: state.preferences.petPoolOrder,
      petPoolEnabled: state.preferences.petPoolEnabled,
      petConfinementEnabled: state.preferences.petConfinementEnabled,
      petCrossDisplayEnabled: state.preferences.petCrossDisplayEnabled,
      petGravityEnabled: state.preferences.petGravityEnabled,
      personality: state.preferences.personality,
      voiceAssistantShortcut: state.preferences.voiceAssistantShortcut,
      chatShortcut: state.preferences.chatShortcut,
      petToggleShortcut: state.preferences.petToggleShortcut,
      showChatButton: state.preferences.showChatButton,
      showTalkButton: state.preferences.showTalkButton,
      petButtonsPosition: state.preferences.petButtonsPosition,
      petButtonsSize: state.preferences.petButtonsSize,
    },
    petScaleOptions,
    hudScaleOptions,
    petPoolCandidates: state.pets.installed
      .filter((p) => !p.builtIn && !p.broken && p.id !== state.preferences.defaultPetId)
      .map(({ id, displayName }) => ({ id, displayName })),
    voiceAssistantShortcutStatus: getVoiceAssistantShortcutSnapshot(),
    chatShortcutStatus: getChatShortcutSnapshot(),
    petToggleShortcutStatus: getPetToggleShortcutSnapshot(),
  };
}

function getI18nSnapshot(): {
  locale: Locale;
  localePreference: LocalePreference;
  availableLocales: { value: Locale; label: string }[];
  messages: ReturnType<typeof getActiveMessages>;
} {
  return {
    locale: getActiveLocale(),
    localePreference: getAppStateSnapshot().preferences.locale,
    availableLocales: SUPPORTED_LOCALES.map((value) => ({ value, label: LOCALE_LABELS[value] })),
    messages: getActiveMessages(),
  };
}

export function installInternalUiHandlers(): void {
  if (internalUiHandlersInstalled) {
    return;
  }

  internalUiHandlersInstalled = true;
  app.on("before-quit", () => { controlCenterQuitting = true; });
  // Apply the persisted petConfinementEnabled preference as the initial value
  // for the confinement-manager flag. This runs once after app-state is loaded.
  setConfinementEnabled(getAppStateSnapshot().preferences.petConfinementEnabled);
  setCrossDisplayRoamingEnabled(getAppStateSnapshot().preferences.petCrossDisplayEnabled);
  // Apply the persisted petGravityEnabled preference on startup.
  applyRoamingToAllPets();

  pluginAuthoringIpc = installControlCenterPluginAuthoringIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    isCurrentControlCenterSender: (event) => getInternalUiWindowKindForWebContents(event.sender.id) === "control-center",
    getOwnerForSender: (event) => BrowserWindow.fromWebContents(event.sender as WebContents) ?? undefined,
    showOpenDialog: (owner, options) => owner ? dialog.showOpenDialog(owner as BrowserWindow, options) : dialog.showOpenDialog(options),
    createPackage: createCompanionPluginPackage,
  });
  app.on("before-quit", () => {
    pluginAuthoringIpc?.dispose();
    communityWebsite.dispose();
  });
  ipcMain.handle("openpets:studio-show-pet", (event) => {
    assertAllowedSender(event, ["control-center"]);
    showDefaultPet();
    void import("./tray.js").then(({ refreshTrayMenu }) => refreshTrayMenu());
  });
  ipcMain.handle("openpets:studio-hide-pet", (event) => {
    assertAllowedSender(event, ["control-center"]);
    hideDefaultPet();
    void import("./tray.js").then(({ refreshTrayMenu }) => refreshTrayMenu());
  });
  ipcMain.handle("openpets:studio-reference-gallery", async (event) => {
    assertAllowedSender(event, ["control-center"]);
    await shell.openExternal("https://codexpet.top/#gallery");
  });
  const communityWebsite = new CommunityWebsite(app.isPackaged
    ? join(process.resourcesPath, "community-web")
    : join(app.getAppPath(), "..", "community-web", "dist"),
  app.isPackaged ? "https://desktoppet-e9e.pages.dev" : undefined);
  ipcMain.handle("openpets:studio-community-website", async (event, section: unknown) => {
    assertAllowedSender(event, ["control-center"]);
    const url = await communityWebsite.getUrl(section);
    debug("ui", "打开共创网站", { section });
    await shell.openExternal(url);
  });

  originalProjectIpc = installControlCenterOriginalProjectIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    isCurrentSender: (event) => getInternalUiWindowKindForWebContents(event.sender.id) === "control-center",
    store: new OriginalProjectStore(app.getPath("userData")),
    chooseSource: async (event, kind) => {
      const owner = BrowserWindow.fromWebContents(event.sender as WebContents) ?? undefined;
      const modeOptions: Electron.MessageBoxOptions = {
        type: "question",
        title: "检测项目兼容性",
        message: "选择完整 ZIP、清单文件或项目文件夹",
        detail: "先静态检测，再由你确认安装或保留原项目；不会自动转换原逻辑。",
        buttons: ["ZIP / JSON 清单", "文件夹", "取消"],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
      };
      const mode = owner ? await dialog.showMessageBox(owner, modeOptions) : await dialog.showMessageBox(modeOptions);
      if (mode.response === 2) return null;
      const options: Electron.OpenDialogOptions = mode.response === 0
        ? { title: `选择${kind === "pet" ? "桌宠" : "插件"}项目`, properties: ["openFile"], filters: [{ name: "完整包或清单", extensions: ["zip", "json"] }] }
        : { title: "选择完整项目文件夹", properties: ["openDirectory"] };
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    chooseApplication: async (event) => {
      const owner = BrowserWindow.fromWebContents(event.sender as WebContents) ?? undefined;
      const options: Electron.OpenDialogOptions = {
        title: "选择另外安装的原宿主应用",
        buttonLabel: "使用此应用",
        properties: ["openFile"],
        ...(process.platform === "win32" ? { filters: [{ name: "Windows 应用", extensions: ["exe"] }] } : {}),
      };
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    chooseEntry: async (event, directory) => {
      const owner = BrowserWindow.fromWebContents(event.sender as WebContents) ?? undefined;
      const options: Electron.OpenDialogOptions = {
        title: "选择原项目自己的 EXE / JAR 入口",
        buttonLabel: "使用此入口",
        defaultPath: directory,
        properties: ["openFile"],
        filters: [{ name: "原项目程序", extensions: ["exe", "jar"] }],
      };
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    launchExecutable: launchOriginalProjectExecutable,
    chooseJava: async (event) => {
      const owner = BrowserWindow.fromWebContents(event.sender as WebContents) ?? undefined;
      const options: Electron.OpenDialogOptions = {
        title: "选择已安装 Java 的 bin/java.exe",
        properties: ["openFile"],
        filters: [{ name: "Java 运行环境", extensions: ["exe"] }],
      };
      const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    openPath: async (path) => {
      const failure = await shell.openPath(path);
      if (failure) throw new Error(failure);
    },
    installNativePet: installPetFromFolder,
    installNativePlugin: async (path) => {
      const result = await getPluginService().loadLocalPath(path);
      return result.ok ? { ok: true, canceled: !result.snapshot.plugins.some((plugin) => plugin.sourcePath === path) } : result;
    },
    convertShimeji: installShimejiPetFromFolderWithResult,
    onNativeChanged: () => {
      refreshDefaultPetContent();
      broadcastDashboardRefresh();
      broadcastPluginRecordsRefresh();
    },
  });

  petManagementIpc = installControlCenterPetManagementIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    isCurrentControlCenterSender: (event) => getInternalUiWindowKindForWebContents(event.sender.id) === "control-center",
    getOwnerForSender: (event) => BrowserWindow.fromWebContents(event.sender as WebContents) ?? undefined,
    showMessageBox: (owner, options) => owner
      ? dialog.showMessageBox(owner as BrowserWindow, options)
      : dialog.showMessageBox(options),
    showOpenDialog: (owner, options) => owner
      ? dialog.showOpenDialog(owner as BrowserWindow, options)
      : dialog.showOpenDialog(options),
    stat,
    openExternal: (url) => shell.openExternal(url),
    setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
    getAppStateSnapshot,
    getSettingsStateSnapshot,
    readInstalledPetSpriteLayout,
    getCatalogUiState,
    getCatalogPageUiState,
    getCatalogSearchUiState,
    getCodexPetsUiState,
    setDefaultInstalledPet,
    refreshDefaultPetContent,
    recoverDefaultPetMouseInterop,
    broadcastDashboardRefresh,
    normalizePetPoolOrder,
    setPetPoolOrder,
    installPet,
    installPetFromFolder,
    installPetFromZipFile,
    exportInstalledPetPackage,
    preparePersonalPetSpritesheet,
    installPetFromSpritesheetFileWithResult,
    importCodexPet,
    removePet,
    resetDefaultPetToInitialPosition,
    logger: {
      debug: (message, fields) => debug("ui", message, fields),
      error: (message, fields) => logError("ui", message, fields),
    },
  });

  ipcMain.handle("openpets:get-settings-state", (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getSettingsStateSnapshot();
  });

  ipcMain.handle("openpets:voice-devices-get", async (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getSharedVoiceDeviceService().refresh();
  });

  ipcMain.handle("openpets:voice-devices-refresh", async (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getSharedVoiceDeviceService().refresh();
  });

  ipcMain.handle("openpets:voice-devices-save-preferences", (event, input: unknown) => {
    assertAllowedSender(event, ["control-center"]);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Voice device preferences must be an object.");
    const value = input as { readonly preferredInputDeviceId?: unknown; readonly preferredOutputDeviceId?: unknown };
    if (value.preferredInputDeviceId !== undefined && value.preferredInputDeviceId !== null && typeof value.preferredInputDeviceId !== "string") throw new Error("Preferred input device id is invalid.");
    if (value.preferredOutputDeviceId !== undefined && value.preferredOutputDeviceId !== null && typeof value.preferredOutputDeviceId !== "string") throw new Error("Preferred output device id is invalid.");
    if (typeof value.preferredInputDeviceId === "string" && normalizeVoiceDeviceId(value.preferredInputDeviceId) === null) throw new Error("Preferred input device id is invalid.");
    if (typeof value.preferredOutputDeviceId === "string" && normalizeVoiceDeviceId(value.preferredOutputDeviceId) === null) throw new Error("Preferred output device id is invalid.");
    return getSharedVoiceDeviceService().savePreferences({
      ...(value.preferredInputDeviceId === undefined ? {} : { preferredInputDeviceId: value.preferredInputDeviceId === null ? null : normalizeVoiceDeviceId(value.preferredInputDeviceId) }),
      ...(value.preferredOutputDeviceId === undefined ? {} : { preferredOutputDeviceId: value.preferredOutputDeviceId === null ? null : normalizeVoiceDeviceId(value.preferredOutputDeviceId) }),
    });
  });

  ipcMain.handle("openpets:get-lan-status", (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getLanStatusSnapshot();
  });

  ipcMain.handle("openpets:get-i18n", (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getI18nSnapshot();
  });

  // Archive management remains a host-owned Control Center capability. It is
  // intentionally not part of the companion chat bridge; Settings can own the
  // presentation in a later phase without giving the pet renderer authority.
  ipcMain.handle("openpets:get-conversation-history", (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getConversationHistory(getPetAssistantConversationController());
  });
  ipcMain.handle("openpets:delete-conversation-history-message", (event, id: unknown): { deleted: boolean } => {
    assertAllowedSender(event, ["control-center"]);
    return deleteConversationHistoryMessage(getPetAssistantConversationController(), id);
  });
  ipcMain.handle("openpets:clear-conversation-history", (event): { cleared: true } => {
    assertAllowedSender(event, ["control-center"]);
    return clearConversationHistory(getPetAssistantConversationController());
  });


  ipcMain.handle("openpets:get-reaction-animation-settings", async (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getReactionAnimationSettingsSnapshot();
  });

  const companionFiles = new CompanionFilesService({ journalDirectory: join(app.getPath("userData"), "companion-file-operations") });
  const assertToolAccess = (kind: CompanionToolPluginKind): void => {
    const plugins = getPluginService();
    const id = companionToolPluginIds[kind];
    assertCompanionToolPluginAccess(kind, plugins.stateStore.getRecord(id), plugins.runtime.isPluginActive(id));
  };
  companionIpc = installControlCenterCompanionIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    assertToolAccess,
    subscribeToolAccess: (listener) => getPluginService().subscribe(listener),
    tools: getCompanionToolsService(),
    downloads: getCompanionDownloadsService(),
    inspectInstaller: inspectCompanionInstaller,
    pickInstaller: async () => {
      const options: Electron.OpenDialogOptions = {
        title: "选择安装前要检查的文件",
        properties: ["openFile"],
        filters: [{ name: "Windows 安装包", extensions: ["exe", "msi"] }],
      };
      const result = controlCenterWindow ? await dialog.showOpenDialog(controlCenterWindow, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    pickDownloadsFolder: async () => {
      const options: Electron.OpenDialogOptions = { title: "选择要留意的下载目录", properties: ["openDirectory"] };
      const result = controlCenterWindow ? await dialog.showOpenDialog(controlCenterWindow, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    files: companionFiles,
    cancelLibraryTask: (senderId) => fileLibraryIpc?.cancelTaskForSender(senderId) ?? false,
    captureWindow: () => captureCompanionWindowUnderCursor(3),
    pickFolder: async () => {
      const options: Electron.OpenDialogOptions = { title: "选择要分析或整理的文件夹", properties: ["openDirectory"] };
      const result = controlCenterWindow ? await dialog.showOpenDialog(controlCenterWindow, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    pickFiles: async () => {
      const options: Electron.OpenDialogOptions = { title: "选择要复制收纳的资料文件", properties: ["openFile", "multiSelections"] };
      const result = controlCenterWindow ? await dialog.showOpenDialog(controlCenterWindow, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths;
    },
    reveal: (path) => shell.showItemInFolder(path),
    open: (path) => shell.openPath(path),
    openSystem: (uri) => shell.openExternal(uri),
    copy: (report) => clipboard.writeText(report),
  });

  app.on("before-quit", () => petManagementIpc?.dispose());
  app.on("before-quit", () => originalProjectIpc?.dispose());
  app.on("before-quit", () => companionIpc?.dispose());

  fileLibraryIpc = installControlCenterFileLibraryIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    assertAccess: () => assertToolAccess("files"),
    subscribeAccess: (listener) => getPluginService().subscribe(listener),
    library: getCompanionFileLibrary(),
    files: companionFiles,
    getClassification: () => getCompanionAiHost().fileClassification,
    getProfiles: async () => (await getCompanionAiHost().getSnapshot()).monitor.profiles
      .filter((profile) => profile.configuration === "ready")
      .map((profile) => ({ id: profile.id, label: profile.label })),
    pickFolder: async () => {
      const options: Electron.OpenDialogOptions = { title: "添加文件库索引目录（不移动文件）", properties: ["openDirectory"] };
      const result = controlCenterWindow ? await dialog.showOpenDialog(controlCenterWindow, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    reveal: (path) => shell.showItemInFolder(path),
    rememberPlan: (id, senderId) => companionIpc?.rememberFilePlan(id, senderId),
  });
  app.on("before-quit", () => fileLibraryIpc?.dispose());

  companionAiIpc = installControlCenterAiIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    getHost: getCompanionAiHost,
    getConversation: getPetAssistantConversationController,
    getActiveModality: () => getPetAssistantModalityCoordinator().activeModality,
    getToolsSnapshot: () => getCompanionToolsService().getSnapshot(),
    assertDiagnosticsAccess: () => assertToolAccess("computer"),
    subscribeDiagnosticsAccess: (listener) => getPluginService().subscribe(listener),
    pickPersona: async (_senderId, kind) => {
      const options: Electron.OpenDialogOptions = {
        title: kind === "directory" ? "导入完整人物 Skill 文件夹" : "导入已蒸馏 Skill 或人物资料",
        properties: [kind === "directory" ? "openDirectory" : "openFile"],
        ...(kind === "directory" ? {} : { filters: [{ name: "已蒸馏 Skill、Markdown 或文本", extensions: ["md", "markdown", "txt"] }] }),
      };
      const result = controlCenterWindow ? await dialog.showOpenDialog(controlCenterWindow, options) : await dialog.showOpenDialog(options);
      return result.canceled ? null : result.filePaths[0] ?? null;
    },
    openPersonaDirectory: async (directory) => {
      const failure = await shell.openPath(directory);
      if (failure) throw new Error("skills 目录打开失败，请使用显示的目录路径。");
    },
    pickPersonaDestination: async () => {
      const options: Electron.SaveDialogOptions = {
        title: "导出人物风格资料",
        defaultPath: "桌宠人物.md",
        filters: [{ name: "人物 Markdown", extensions: ["md", "markdown"] }],
      };
      const result = controlCenterWindow ? await dialog.showSaveDialog(controlCenterWindow, options) : await dialog.showSaveDialog(options);
      return result.canceled ? null : result.filePath ?? null;
    },
  });
  app.on("before-quit", () => companionAiIpc?.dispose());

  installControlCenterPluginIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    getPluginService,
    logger: {
      debug: (message, fields) => debug("ui", message, fields),
      warn: (message, fields) => warn("ui", message, fields),
      error: (message, fields) => logError("ui", message, fields),
    },
  });
  const unsubscribePluginRecords = getPluginService().subscribe(broadcastPluginRecordsRefresh);
  app.on("before-quit", unsubscribePluginRecords);

  installControlCenterAgentSetupIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    getAgentSetupSnapshot,
    runAgentSetupAction,
    updateAgentSetupCommandPaths,
  });

  installControlCenterRemoteIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, handler),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    getRemoteControlService,
  });

  controlCenterProviderIpc = installControlCenterProviderIpcHandlers({
    registerHandle: (channel, handler) => ipcMain.handle(channel, async (event, ...args: unknown[]) => {
      const result = await handler(event, ...args);
      if (providerQuotaInvalidationChannels.has(channel)) getCompanionAiHost().invalidateQuota();
      return result;
    }),
    authorizeSender: (event) => assertAllowedSender(event, ["control-center"]),
    registerBeforeQuit: (listener) => app.on("before-quit", () => listener()),
    logger: { debug: (message, fields) => debug("plugin", message, fields) },
  });

  ipcMain.handle("openpets:update-preferences", async (event, patch: unknown) => {
    assertAllowedSender(event, ["control-center"]);
    const previousScale = getAppStateSnapshot().preferences.petScale;
    const previousHudScale = getAppStateSnapshot().preferences.hudScale;
    const previousWaitingAnimationDurationMs = getAppStateSnapshot().preferences.waitingAnimationDurationMs;
    const previousIdleCursorGazeEnabled = getAppStateSnapshot().preferences.idleCursorGazeEnabled;
    const previousOverrides = JSON.stringify(getAppStateSnapshot().preferences.reactionAnimationOverrides ?? {});
    const previousLocale = getActiveLocale();
    const previousPoolEnabled = getAppStateSnapshot().preferences.petPoolEnabled;
    const previousPersonalityPetName = getAppStateSnapshot().preferences.personality.petName;
    const validatedPatch = validatePreferencePatch(patch);
    const currentShortcut = getAppStateSnapshot().preferences.voiceAssistantShortcut;
    const shortcutSnapshot = validatedPatch.voiceAssistantShortcut !== undefined
      ? configureVoiceAssistantShortcut(validatedPatch.voiceAssistantShortcut)
      : null;
    let effectivePatch = shortcutSnapshot && validatedPatch.voiceAssistantShortcut !== undefined
      ? { ...validatedPatch, voiceAssistantShortcut: resolveVoiceAssistantShortcutPreference(currentShortcut, validatedPatch.voiceAssistantShortcut, shortcutSnapshot) }
      : validatedPatch;
    if (validatedPatch.chatShortcut !== undefined) {
      const currentChatShortcut = getAppStateSnapshot().preferences.chatShortcut;
      const chatSnapshot = configureChatShortcut(validatedPatch.chatShortcut);
      effectivePatch = { ...effectivePatch, chatShortcut: resolveChatShortcutPreference(currentChatShortcut, validatedPatch.chatShortcut, chatSnapshot) };
    }
    if (validatedPatch.petToggleShortcut !== undefined) {
      const currentPetToggleShortcut = getAppStateSnapshot().preferences.petToggleShortcut;
      const petToggleSnapshot = configurePetToggleShortcut(validatedPatch.petToggleShortcut);
      effectivePatch = { ...effectivePatch, petToggleShortcut: resolvePetToggleShortcutPreference(currentPetToggleShortcut, validatedPatch.petToggleShortcut, petToggleSnapshot) };
    }
    const state = updatePreferences(effectivePatch);
    if (validatedPatch.petChatAppearance !== undefined) await refreshPetChatAppearance();
    if (validatedPatch.petBehavior !== undefined || "reactionAnimationOverrides" in validatedPatch) refreshDefaultPetBehavior();
    if (validatedPatch.personality) debug("ui", "Pet Assistant personality preferences updated", { fields: Object.keys(validatedPatch.personality) });
    const nextOverrides = JSON.stringify(state.preferences.reactionAnimationOverrides ?? {});
    const petButtonPrefsChanged = validatedPatch.showChatButton !== undefined
      || validatedPatch.showTalkButton !== undefined
      || validatedPatch.petButtonsPosition !== undefined
      || validatedPatch.petButtonsSize !== undefined;
    const personalityPetNameChanged = state.preferences.personality.petName !== previousPersonalityPetName;
    if (personalityPetNameChanged) {
      refreshDefaultPetContent();
      broadcastDashboardRefresh();
    }
    if (state.preferences.petScale !== previousScale || state.preferences.hudScale !== previousHudScale || state.preferences.waitingAnimationDurationMs !== previousWaitingAnimationDurationMs || nextOverrides !== previousOverrides || petButtonPrefsChanged) {
      refreshDefaultPetContent();
      refreshAgentPetContent();
    }
    if (state.preferences.idleCursorGazeEnabled !== previousIdleCursorGazeEnabled) {
      refreshPetGazePreference();
    }
    if (setLocaleFromPreference(state.preferences.locale) !== previousLocale) {
      // Tray labels are rendered eagerly, so rebuild the menu in the new language.
      void import("./tray.js").then(({ refreshTrayMenu }) => refreshTrayMenu());
      // Control Center plugin labels are resolved at display time; nudge it to re-fetch the
      // SafePluginRecords so manifest/config labels re-render in the new language.
      broadcastPluginRecordsRefresh();
    }
    // Propagate petConfinementEnabled into the confinement-manager flag on every pref update.
    setConfinementEnabled(state.preferences.petConfinementEnabled);
    // Propagate petCrossDisplayEnabled into the display-module flag on every pref update.
    setCrossDisplayRoamingEnabled(state.preferences.petCrossDisplayEnabled);
    // Propagate petGravityEnabled to all live pets on every pref update.
    applyRoamingToAllPets();
    // Propagate petPoolEnabled — despawn on disable, respawn on enable.
    if (state.preferences.petPoolEnabled !== previousPoolEnabled) {
      void import("./local-ipc.js").then(({ dispatchPoolToggle }) => dispatchPoolToggle(state.preferences.petPoolEnabled));
    }
    return getInternalUiWindowKindForWebContents(event.sender.id) === "control-center" ? getSettingsStateSnapshot() : state;
  });

  ipcMain.handle("openpets:get-launch-at-login", (event) => {
    assertAllowedSender(event, ["control-center"]);
    return getLaunchAtLoginState();
  });

  ipcMain.handle("openpets:set-launch-at-login", (event, enabled: unknown) => {
    assertAllowedSender(event, ["control-center"]);
    if (typeof enabled !== "boolean") throw new Error("Invalid launch-at-login value.");
    if (!isLaunchAtLoginSupported()) return getLaunchAtLoginState();
    app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true, ...getPersonalLoginItemOptions() });
    return getLaunchAtLoginState();
  });


}

export function installInternalUiProtocol(): void {
  registerPluginAssetProtocol(protocol, getPluginService);
  registerSessionMediaProtocol(protocol);
  protocol.handle("openpets-codex", async (request) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
      const url = new URL(request.url);
      if (url.hostname !== "spritesheet" || url.search || url.hash) return new Response(null, { status: 404 });
      const petId = decodeURIComponent(url.pathname.replace(/^\//, ""));
      const spritesheet = await readCodexPetSpritesheet(petId);
      return new Response(spritesheet, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=60",
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });

  protocol.handle("openpets-installed", async (request) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
      const url = new URL(request.url);
      if (url.hostname === "action" && !url.search && !url.hash) {
        const parts = url.pathname.slice(1).split("/");
        if (parts.length !== 2) return new Response(null, { status: 404 });
        const [petId, action] = parts;
        assertSafePetId(petId);
        if (!isPetMediaActionId(action)) return new Response(null, { status: 404 });
        const pet = getAppStateSnapshot().pets.installed.find((candidate) => candidate.id === petId && !candidate.broken);
        if (!pet) return new Response(null, { status: 404 });
        const directory = getPetDir(petId, pet.source?.kind === "team" ? "team" : "personal");
        if (await realpath(directory) !== directory) return new Response(null, { status: 404 });
        const metadata = await readInstalledPetMetadata(directory, petId);
        if (!isMediaPetMetadata(metadata)) return new Response(null, { status: 404 });
        const file = metadata.actions[action];
        if (!file) return new Response(null, { status: 404 });
        const bytes = await readBoundedRegularFile(join(directory, file), maxPetMediaFileBytes, file);
        const headers: Record<string, string> = { "Content-Type": petMediaContentType(file), "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes" };
        const range = request.headers.get("Range");
        if (range) {
          const match = /^bytes=(\d+)-(\d*)$/.exec(range);
          if (!match) return new Response(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${bytes.length}` } });
          const start = Number(match[1]);
          const end = match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= bytes.length) return new Response(null, { status: 416, headers });
          headers["Content-Range"] = `bytes ${start}-${end}/${bytes.length}`;
          headers["Content-Length"] = String(end - start + 1);
          return new Response(request.method === "HEAD" ? null : bytes.subarray(start, end + 1), { status: 206, headers });
        }
        headers["Content-Length"] = String(bytes.length);
        return new Response(request.method === "HEAD" ? null : bytes, { headers });
      }
      if (url.hostname !== "spritesheet" || url.search || url.hash) return new Response(null, { status: 404 });
      const petId = decodeURIComponent(url.pathname.replace(/^\//, ""));
      assertSafePetId(petId);
      const pet = getAppStateSnapshot().pets.installed.find((candidate) => candidate.id === petId && !candidate.broken);
      if (!pet) return new Response(null, { status: 404 });
      const spritesheetPath = join(
        getPetDir(petId, pet.source?.kind === "team" ? "team" : "personal"),
        "spritesheet.webp",
      );
      const spritesheet = await stat(spritesheetPath);
      if (!spritesheet.isFile() || spritesheet.size <= 0 || spritesheet.size > 100 * 1024 * 1024) return new Response(null, { status: 404 });
      return new Response(await readFile(spritesheetPath), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=60",
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });

  protocol.handle("openpets-pet-preview", async (request) => {
    try {
      if (request.method !== "GET" && request.method !== "HEAD") return new Response(null, { status: 405 });
      const url = new URL(request.url);
      if (url.hostname !== "spritesheet" || url.pathname !== "/default" || url.hash) return new Response(null, { status: 404 });
      const version = url.searchParams.get("v");
      if ([...url.searchParams.keys()].some((key) => key !== "v") || (version !== null && !/^[a-z0-9_-]+-\d+-\d+$/.test(version))) return new Response(null, { status: 404 });
      const { path } = await getDefaultPetPreviewSpriteInfo();
      const spritesheet = await stat(path);
      if (!spritesheet.isFile() || spritesheet.size <= 0 || spritesheet.size > 100 * 1024 * 1024) return new Response(null, { status: 404 });
      return new Response(await readFile(path), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response(null, { status: 404 });
    }
  });
}

// The renderer layout reads slightly oversized at native scale; zoom the whole
// control center out a notch so more content fits without restyling every view.
const controlCenterZoomFactor = 1;

export function getControlCenterWindow(): BrowserWindow | null {
  return controlCenterWindow && !controlCenterWindow.isDestroyed() ? controlCenterWindow : null;
}

export function openControlCenterWindow(route: ControlCenterRoute = "dashboard"): void {
  openControlCenterWindowTarget({ route: normalizeControlCenterRoute(route) });
}

export function openControlCenterWindowTarget(target: ControlCenterRouteTarget): void {
  const safeTarget = normalizeControlCenterRouteTarget(target);
  if (controlCenterWindow && !controlCenterWindow.isDestroyed()) {
    routeControlCenterWindow(controlCenterWindow, safeTarget);
    if (controlCenterWindow.isMinimized()) controlCenterWindow.restore();
    controlCenterWindow.show();
    controlCenterWindow.focus();
    syncDockVisibilityForInternalUi();
    return;
  }

  // Near-square shape reads best for the control center; clamp to the work
  // area so the window never spawns larger than small laptop screens.
  const { workAreaSize } = screen.getPrimaryDisplay();
  const window = new BrowserWindow({
    title: "desktop pet 控制中心",
    width: Math.min(1200, Math.floor(workAreaSize.width * 0.9)),
    height: Math.min(860, Math.floor(workAreaSize.height * 0.9)),
    minWidth: 820,
    minHeight: 620,
    show: false,
    icon: createAppIcon(),
    backgroundColor: "#f8fbff",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: getControlCenterPreloadPath(),
      zoomFactor: controlCenterZoomFactor,
    },
  });

  controlCenterWindow = window;
  // Capture webContents.id now, before it can ever be destroyed -- the
  // "closed" handler below fires after window.webContents is already gone,
  // and reading .webContents.id at that point throws "Object has been
  // destroyed" (same bug class as the original Control Center crash fixed
  // in #179, recurring here at a different call site introduced later).
  const webContentsId = window.webContents.id;
  const cancelWindowWork = (senderId: number): void => {
    companionIpc?.cancelForSender(senderId);
    fileLibraryIpc?.cancelForSender(senderId);
    companionAiIpc?.cancelForSender(senderId);
    petManagementIpc?.cancelForSender(senderId);
    originalProjectIpc?.cancelForSender(senderId);
    pluginAuthoringIpc?.cancelForSender(senderId);
  };
  syncDockVisibilityForInternalUi();
  window.setMenu(null);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.on("will-redirect", (event) => event.preventDefault());
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    console.error("Failed to load Control Center renderer.", { errorCode, errorDescription });
    logError("ui", "control center load failed", { errorCode, errorDescription });
  });
  window.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    const fields = { level, line, sourceId, message };
    if (level >= 3) logError("ui", "control center console", fields);
    else if (level === 2) warn("ui", "control center console", fields);
    else debug("ui", "control center console", fields);
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    console.error("Control Center renderer process gone.", details);
    logError("ui", "control center renderer gone", details);
    cancelWindowWork(webContentsId);
    void controlCenterProviderIpc?.cancelForSender(webContentsId, "控制中心渲染进程已关闭。");
    window.destroy();
  });
  window.on("close", (event) => {
    if (controlCenterQuitting) return;
    event.preventDefault();
    window.hide();
    cancelWindowWork(webContentsId);
    void controlCenterProviderIpc?.cancelForSender(webContentsId, "控制中心已收起。");
    syncDockVisibilityForInternalUi();
  });
  window.on("closed", () => {
    cancelWindowWork(webContentsId);
    void controlCenterProviderIpc?.cancelForSender(webContentsId, "控制中心窗口已关闭。");
    controlCenterWindow = null;
    syncDockVisibilityForInternalUi();
  });
  window.once("ready-to-show", () => { window.show(); window.focus(); syncDockVisibilityForInternalUi(); });
  pendingControlCenterRouteTarget = safeTarget;
  window.webContents.on("did-finish-load", () => {
    // Chromium remembers per-host zoom, which can override the initial
    // webPreferences value after reloads; pin it on every load.
    window.webContents.setZoomFactor(controlCenterZoomFactor);
    flushPendingControlCenterRoute(window);
  });

  const devUrl = getSafeControlCenterDevUrl();
  const load = devUrl ? window.loadURL(withControlCenterRoute(devUrl, safeTarget)) : window.loadFile(join(app.getAppPath(), "dist", "renderer", "index.html"), { query: controlCenterRouteQuery(safeTarget) });
  load.catch((error: unknown) => {
    console.error("Failed to load Control Center.", error);
  });
}

export function focusOpenTaskWindows(): void {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed()) {
    if (controlCenterWindow.isMinimized()) controlCenterWindow.restore();
    controlCenterWindow.show();
    controlCenterWindow.focus();
  }
  syncDockVisibilityForInternalUi();
}

function sendControlCenterRoute(window: BrowserWindow, target: ControlCenterRouteTarget): void {
  if (window.isDestroyed()) return;
  window.webContents.send("openpets:control-center-route", target);
}

function broadcastPluginRecordsRefresh(): void {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed()) {
    controlCenterWindow.webContents.send("openpets:plugins-refresh");
  }
}

/** Tell the open Control Center to re-fetch the dashboard snapshot (e.g. after personality or default pet changes). */
function broadcastDashboardRefresh(): void {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed()) {
    controlCenterWindow.webContents.send("openpets:dashboard-refresh");
  }
}

function routeControlCenterWindow(window: BrowserWindow, target: ControlCenterRouteTarget): void {
  pendingControlCenterRouteTarget = target;
  if (window.webContents.isLoading()) return;
  flushPendingControlCenterRoute(window);
}

function flushPendingControlCenterRoute(window: BrowserWindow): void {
  if (window.isDestroyed() || !pendingControlCenterRouteTarget) return;
  const target = pendingControlCenterRouteTarget;
  pendingControlCenterRouteTarget = null;
  sendControlCenterRoute(window, target);
}

function controlCenterRouteQuery(target: ControlCenterRouteTarget): { route: string; assistantTab?: string } {
  return target.assistantTab ? { route: target.route, assistantTab: target.assistantTab } : { route: target.route };
}

function withControlCenterRoute(rawUrl: string, target: ControlCenterRouteTarget): string {
  const url = new URL(rawUrl);
  url.searchParams.set("route", target.route);
  if (target.assistantTab) url.searchParams.set("assistantTab", target.assistantTab);
  return url.toString();
}

function pluginUiError(error: string): PluginServiceResult {
  return { ok: false, error, snapshot: { plugins: [] } };
}

function pluginUiSoundError(error: string): PluginConfigSoundPickResult {
  return { ok: false, error, snapshot: { plugins: [] } };
}

function getControlCenterPreloadPath(): string {
  return join(app.getAppPath(), "control-center-preload.cjs");
}

function getSafeControlCenterDevUrl(): string | null {
  if (app.isPackaged) return null;
  const raw = process.env.OPENPETS_RENDERER_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if ((url.protocol === "http:" || url.protocol === "https:") && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)) {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function assertAllowedSender(event: { readonly sender: { readonly id: number } }, allowedKinds: readonly InternalUiWindowKind[]): void {
  const actualKind = getInternalUiWindowKindForWebContents(event.sender.id);

  if (!actualKind || !allowedKinds.includes(actualKind)) {
    throw new Error("OpenPets internal UI request came from an unexpected window.");
  }
}

function getInternalUiWindowKindForWebContents(webContentsId: number): InternalUiWindowKind | null {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed() && controlCenterWindow.webContents.id === webContentsId) {
    return "control-center";
  }
  return null;
}

async function getReactionAnimationSettingsSnapshot(): Promise<unknown> {
  const state = getAppStateSnapshot();
  const preview = await getDefaultPetPreviewSpriteInfo();
  return {
    reactions: reactionAnimationMetadata.map((reaction) => ({
      ...reaction,
      label: t(`settings.reaction.${reaction.id}.label`),
      description: t(`settings.reaction.${reaction.id}.description`),
    })),
    animations: selectableAnimationMetadata.map((animation) => ({
      ...animation,
      label: t(`settings.animation.${animation.id}.label`),
      description: t(`settings.animation.${animation.id}.description`),
    })),
    sprite: { ...defaultPetSprite, ...preview.spriteLayout, states: getConfiguredSpriteStates(state.preferences.waitingAnimationDurationMs) },
    waitingAnimationDurationMs: state.preferences.waitingAnimationDurationMs,
    waitingAnimationDurationOptions: waitingAnimationDurationOptions.map((option) => ({
      value: option.value,
      label: option.value === 1010
        ? t("settings.waitingAnimationDuration.normal")
        : t("settings.waitingAnimationDuration.relaxed"),
    })),
    overrides: state.preferences.reactionAnimationOverrides ?? {},
    previewSpriteUrl: `openpets-pet-preview://spritesheet/default?v=${encodeURIComponent(preview.version)}`,
  };
}

async function getDefaultPetPreviewSpriteInfo(): Promise<{ readonly path: string; readonly version: string; readonly spriteLayout: CodexPetSpriteLayout }> {
  const state = getAppStateSnapshot();
  const selected = state.pets.installed.find((pet) => pet.id === state.preferences.defaultPetId);
  const builtInPath = join(app.getAppPath(), "assets", defaultPetSprite.fileName);
  const usesInstalledCandidate = Boolean(selected && !selected.broken && !selected.builtIn);
  if (usesInstalledCandidate && selected) {
    const spriteLayout = await readInstalledPetSpriteLayout(selected.id, selected.source?.kind === "team" ? "team" : "personal");
    if (spriteLayout.media) return { path: builtInPath, version: `${selected.id}-0-0`, spriteLayout };
  }
  const candidatePath = usesInstalledCandidate && selected
    ? join(
        getPetDir(selected.id, selected.source?.kind === "team" ? "team" : "personal"),
        "spritesheet.webp",
      )
    : builtInPath;
  try {
    const spritesheet = await stat(candidatePath);
    if (spritesheet.isFile() && spritesheet.size > 0 && spritesheet.size <= 100 * 1024 * 1024) {
      const spriteLayout = usesInstalledCandidate && selected
        ? await readInstalledPetSpriteLayout(
            selected.id,
            selected.source?.kind === "team" ? "team" : "personal",
          )
        : codexV2SpriteLayout;
      return { path: candidatePath, version: `${usesInstalledCandidate && selected ? selected.id : "builtin"}-${Math.round(spritesheet.mtimeMs)}-${spritesheet.size}`, spriteLayout };
    }
  } catch {
    // Fall back to the bundled pet if an installed default disappears while Settings is open.
  }
  const fallback = await stat(builtInPath);
  return { path: builtInPath, version: `builtin-${Math.round(fallback.mtimeMs)}-${fallback.size}`, spriteLayout: codexV2SpriteLayout };
}

function getLaunchAtLoginState(): { supported: boolean; enabled: boolean } {
  if (!isLaunchAtLoginSupported()) return { supported: false, enabled: false };
  return { supported: true, enabled: app.getLoginItemSettings(getPersonalLoginItemOptions()).openAtLogin };
}

function getPersonalLoginItemOptions(): { args?: string[] } {
  const profileDir = process.env.DESKTOP_PET_PROFILE_DIR;
  return process.platform === "win32" && profileDir
    ? { args: [`--desktop-pet-profile-dir="${profileDir}"`] }
    : {};
}

function isLaunchAtLoginSupported(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}
