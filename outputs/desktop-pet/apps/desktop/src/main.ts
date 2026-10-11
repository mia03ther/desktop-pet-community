import { app, globalShortcut, powerMonitor, protocol, screen, shell } from "electron";
import { initializeCompanionFileLibrary } from "./companion-file-library.js";
import { respondToFileLocation } from "./companion-file-location.js";
import { existsSync, writeFileSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";
import { initializeAppState, getAppStateSnapshot, releaseStartupInstallLock, updatePreferences } from "./app-state.js";
import { recoverPetInstallTransactions } from "./pet-install-transaction.js";
import { migrateLegacyCodexV2ImportsAtStartup } from "./codex-pets.js";
import { getPetsRoot } from "./pet-paths.js";
import { setLocaleFromPreference } from "./i18n/index.js";
import { applyExternalPetReaction, applyExternalPetSay, getDefaultPetPaused, isDefaultPetVisible, shouldOpenDefaultPetOnLaunch, showDefaultPet, hideDefaultPet, reclampDefaultPetWindow, recoverDefaultPetMouseInterop, startDefaultPetBehavior, stopDefaultPetBehavior, setDefaultPetAiActivity, setDefaultPetExternalAiActivity, setDefaultPetBehaviorBlocked } from "./default-pet-controller.js";
import { installAppLifecycle } from "./lifecycle.js";
import { initializeLogger, info, debug, warn, error as logError } from "./logger.js";
import { installInternalUiHandlers, installInternalUiProtocol, openControlCenterWindow, openControlCenterWindowTarget } from "./windows.js";
import { createAppTray, refreshTrayMenu } from "./tray.js";
import { installDefaultPetChatIpcHandlers, isDefaultPetChatExpanded, isDefaultPetChatCompactOpen, setDefaultPetChatCompactOpen } from "./default-pet-chat.js";
import { initializePetToggleShortcut } from "./pet-toggle-shortcut.js";
import { initializeChatShortcut } from "./chat-shortcut.js";
import { initializeVoiceAssistantShortcut } from "./voice-assistant-shortcut.js";
import { startVoiceAssistantHost, toggleVoiceAssistant } from "./voice-assistant-host.js";
import { startPetAssistantHost, getPetAssistantConversationController, onPetAssistantConversationControllerReady } from "./pet-assistant-host.js";
import { openLocalPetAssistantConversationArchive } from "./pet-assistant-archive.js";
import { sessionMediaScheme } from "./session-media-cache.js";
import { initializePluginService, type PluginService } from "./plugin-service.js";
import { companionToolPluginIds, hasCompanionToolPluginAccess } from "./companion-tool-plugins.js";
import { initializePluginPlatformSettings } from "./plugin-platform-settings.js";
import { createElectronPluginHostCapabilities } from "./plugin-host-capabilities.js";
import { ElectronPluginJsHost } from "./plugin-js-host.js";
import { defaultPluginPetApi } from "./plugin-pet-api.js";
import { startDevPluginWatcher } from "./plugin-dev-watcher.js";
import { initializeCompanionAiHost, getCompanionPersona } from "./companion-ai-host.js";
import { hostSecretsOwner, providerSecretKey } from "./provider-service.js";
import { CompanionToolsService, initializeCompanionToolsService } from "./companion-tools.js";
import { CompanionDownloadsService, initializeCompanionDownloadsService } from "./companion-downloads.js";
import { collectCompanionDiagnostics, cancelCompanionDiagnostics } from "./companion-diagnostics.js";
import { inspectCompanionInstaller, cancelCompanionSoftwareInspection } from "./companion-software-inspection.js";
import { getSharedVoiceDeviceService } from "./voice-device-service.js";
import { enumerateTrustedVoiceDevices, probeTrustedVoiceOutput } from "./voice-device-electron.js";
import { PetDisplayCoordinator } from "./pet-display-coordinator.js";
import { invalidateDisplayCache } from "./display.js";
import { reclampAgentPetWindows } from "./agent-pet-controller.js";
import { reclampPluginPetWindows } from "./plugin-pet-registry.js";
import { reclampLanVisitingPetWindows } from "./lan-pet-controller.js";
import { initializeLanController, startLanController, isDefaultPetAwayForLan } from "./lan-controller.js";
import { initializeRemoteControlService } from "./remote-control-service.js";
import { openPetsRemoteVersion, type RemoteStatusSnapshot } from "./remote-control-protocol.js";
import { startLocalIpcServer, getCompanionAgentSessions } from "./local-ipc.js";
import { prepareCaptureSessionBeforeReady, resolveCaptureSessionDir, startCaptureSession } from "./capture-session.js";
import { resolveDevControlCenterRoute } from "./control-center-route.js";
import { readPersonalLaunchOptions, type PersonalLaunchIntent } from "./personal-launch-options.js";
import { bindDesktopPetMessageSink, clearDesktopPetMessageSink } from "./desktop-pet-messages.js";
import { bindAgentSetupActivitySource, getCodexQuotaCommandContext } from "./agent-setup.js";

// 工作室自行组合生命周期；迁入模块继续使用原来的档案和本机协议以兼容已有数据。
// windows/lifecycle/插件宿主等多模块都会注册 before-quit，默认 10 上限会误报内存泄漏警告。
app.setMaxListeners(50);
app.commandLine.appendSwitch("use-mock-keychain");
const kde = (process.env.XDG_CURRENT_DESKTOP ?? "").toLowerCase().includes("kde");
app.commandLine.appendSwitch("password-store", process.platform === "linux" ? kde ? "kwallet6" : "gnome-libsecret" : "basic");
if (process.platform === "win32") app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
if (process.platform === "linux" && process.env.OPENPETS_NATIVE_WAYLAND === "1") {
  for (const flag of ["disable-renderer-backgrounding", "disable-background-timer-throttling", "disable-backgrounding-occluded-windows"]) app.commandLine.appendSwitch(flag);
}
protocol.registerSchemesAsPrivileged([
  { scheme: sessionMediaScheme, privileges: { stream: true, supportFetchAPI: true, corsEnabled: true } },
  { scheme: "openpets-installed", privileges: { standard: true, secure: true, stream: true, supportFetchAPI: true, corsEnabled: true } },
]);
const captureDirectory = resolveCaptureSessionDir(process.env, app.isPackaged);
if (captureDirectory) prepareCaptureSessionBeforeReady(captureDirectory);

if (!app.requestSingleInstanceLock()) app.quit();
else {
  let displayCoordinator: PetDisplayCoordinator<Electron.Display> | undefined;
  let pendingLaunch = readPersonalLaunchOptions(process.argv).intent;
  let launchReady = false;
  const applyLaunch = (intent: PersonalLaunchIntent): void => {
    if (intent === "pet") {
      showDefaultPet();
      refreshTrayMenu();
    } else {
      openControlCenterWindow("pets");
    }
  };
  installAppLifecycle({
    stopPetDisplayCoordinator: () => displayCoordinator?.stop(),
    onLaunchRequested: (intent) => {
      if (launchReady) applyLaunch(intent);
      else pendingLaunch = intent;
    },
  });
  void app.whenReady().then(async () => {
    initializeLogger();
    app.setName("desktop pet");
    if (process.platform === "win32") app.setAppUserModelId("local.desktop-pet.studio");
    initializeAppState();
    setLocaleFromPreference(getAppStateSnapshot().preferences.locale);
    startDefaultPetBehavior();
    const unsubscribeMessages = onPetAssistantConversationControllerReady(() => {
      bindDesktopPetMessageSink((message) => {
        getPetAssistantConversationController()?.publishDesktopMessage(message);
      });
    });
    app.on("before-quit", () => { unsubscribeMessages(); clearDesktopPetMessageSink(); });
    app.on("before-quit", stopDefaultPetBehavior);
    powerMonitor.on("lock-screen", () => setDefaultPetBehaviorBlocked("locked", true));
    powerMonitor.on("unlock-screen", () => setDefaultPetBehaviorBlocked("locked", false));
    powerMonitor.on("suspend", () => setDefaultPetBehaviorBlocked("suspended", true));
    powerMonitor.on("resume", () => setDefaultPetBehaviorBlocked("suspended", false));
    await recoverPetInstallTransactions({ petsRoot: getPetsRoot(), onWarning: ({ message, petId }) => warn("state", message, { petId }) });
    try { await migrateLegacyCodexV2ImportsAtStartup(); }
    catch (reason) { warn("state", "旧桌宠适配迁移未完成，继续启动", { reason: String(reason) }); }
    configureVoiceDevices();
    configureShortcuts();

    const dataDirectory = app.getPath("userData");
    let toolPlugins: PluginService | undefined;
    const computerAvailable = (): boolean => toolPlugins !== undefined
      && hasCompanionToolPluginAccess("computer", toolPlugins.stateStore.getRecord(companionToolPluginIds.computer), toolPlugins.runtime.isPluginActive(companionToolPluginIds.computer));
    const fileLibrary = initializeCompanionFileLibrary(dataDirectory);
    const tools = new CompanionToolsService({
      statePath: join(dataDirectory, "companion-tools-state.json"), collect: collectCompanionDiagnostics,
      notify: (finding) => canSpeak() && applyExternalPetSay(`${finding.title}。可以在工作室插件管理的电脑守护中查看证据。`).shown,
      isAvailable: computerAvailable,
    });
    const downloads = new CompanionDownloadsService({
      statePath: join(dataDirectory, "companion-downloads-state.json"), inspect: inspectCompanionInstaller,
      notify: (item) => canSpeak() && applyExternalPetSay(`发现下载 ${item.fileName.slice(0, 80)}，安装前请核对来源和选项。`).shown,
      isAvailable: computerAvailable,
    });
    initializeCompanionToolsService(tools);
    initializeCompanionDownloadsService(downloads);
    tools.stop();
    downloads.stop();
    app.on("before-quit", () => { tools.stop(); downloads.stop(); cancelCompanionDiagnostics(); cancelCompanionSoftwareInspection(); });

    initializeLanController();
    const remote = initializeRemoteControlService({
      statePath: join(dataDirectory, "openpets-remote-control.json"), getStatusSnapshot: remoteStatus, isDefaultPetAway: isDefaultPetAwayForLan,
      applyReaction: (reaction) => {
        setDefaultPetExternalAiActivity("remote", reaction);
        return { shown: applyExternalPetReaction(reaction).shown };
      },
      applySay: (message, reaction) => {
        setDefaultPetExternalAiActivity("remote", reaction);
        return { shown: applyExternalPetSay(message, reaction).shown };
      },
      log: (message) => info("remote", message),
    });
    installInternalUiProtocol();
    installDefaultPetChatIpcHandlers();
    createAppTray();
    displayCoordinator = new PetDisplayCoordinator({ displaySource: screen, powerSource: powerMonitor, invalidateDisplayCache, reclampDefaultPetWindow, reclampAgentPetWindows, reclampLanVisitingPetWindows, reclampPluginPetWindows, recoverDefaultPetMouseInterop });
    displayCoordinator.start();
    await startLocalIpcServer();
    bindAgentSetupActivitySource(getCompanionAgentSessions);
    releaseStartupInstallLock();

    const roots = developerPaths(process.env.OPENPETS_DEV_PLUGIN_ROOTS);
    const paths = developerPaths(process.env.OPENPETS_DEV_PLUGIN_PATHS);
    const development = roots.length + paths.length > 0;
    initializePluginPlatformSettings(dataDirectory);
    const capabilities = createElectronPluginHostCapabilities(dataDirectory);
    const ai = initializeCompanionAiHost({
      userDataPath: dataDirectory, providerOperations: capabilities.providerService,
      hasCredential: (ref) => capabilities.secretsStore.has(hostSecretsOwner, providerSecretKey(ref)),
      getAgentSessions: getCompanionAgentSessions, getConversation: getPetAssistantConversationController,
      onConversationReady: onPetAssistantConversationControllerReady,
      onActivity: (source, reaction) => setDefaultPetAiActivity(`companion:${source}`, reaction),
      codexQuota: {
        getEnabled: () => getAppStateSnapshot().preferences.codexQuotaMonitoringEnabled === true,
        setEnabled: (enabled) => { updatePreferences({ codexQuotaMonitoringEnabled: enabled }); },
        getContext: getCodexQuotaCommandContext,
      },
    });
    app.on("before-quit", () => ai.dispose());
    let watcher: ReturnType<typeof startDevPluginWatcher> | undefined;
    const plugins = initializePluginService(dataDirectory, defaultPluginPetApi, app.getVersion(), new ElectronPluginJsHost(), pluginLog, true, [], false, capabilities, undefined, (path) => watcher?.addPaths([path]), (path) => watcher?.removePath(path));
    toolPlugins = plugins;
    installInternalUiHandlers();
    let computerMonitoringActive = false;
    const unsubscribeTools = plugins.subscribe(() => {
      const active = computerAvailable();
      if (active === computerMonitoringActive) return;
      computerMonitoringActive = active;
      if (active) {
        tools.start();
        downloads.start();
      } else {
        tools.stop();
        downloads.stop();
        cancelCompanionDiagnostics();
        cancelCompanionSoftwareInspection();
      }
    });
    app.on("before-quit", unsubscribeTools);
    powerMonitor.on("resume", () => plugins.runtime.resyncSchedules());
    const pluginStartup = (async () => {
      await plugins.start();
      const migrationMarker = join(dataDirectory, "desktop-pet-clean-ui-v1.json");
      if (process.env.DESKTOP_PET_PROFILE_DIR && !existsSync(migrationMarker)) {
        const virtual = plugins.stateStore.getRecord("openpets.virtual-pet");
        if (virtual) {
          const result = await plugins.saveConfig(virtual.id, { ...virtual.config, showStats: false });
          if (!result.ok) throw new Error(result.error);
        }
        writeFileSync(migrationMarker, JSON.stringify({ version: 1, appliedAt: Date.now() }), { encoding: "utf8", flag: "wx" });
      }
      const assistant = startPetAssistantHost(plugins, capabilities.secretsStore, {
        localResponse: async (text, signal) => {
          let revoked = false;
          const available = (): boolean => !revoked && hasCompanionToolPluginAccess("files", plugins.stateStore.getRecord(companionToolPluginIds.files), plugins.runtime.isPluginActive(companionToolPluginIds.files));
          const unsubscribe = plugins.subscribe(() => {
            if (!available()) revoked = true;
          });
          try {
            return await respondToFileLocation(text, fileLibrary, (path) => shell.showItemInFolder(path), signal, available);
          } finally {
            unsubscribe();
          }
        },
        compositionProvider: () => { ai.captureAssistantProfile(); return { personality: getAppStateSnapshot().preferences.personality, personalityStyle: getCompanionPersona().getPromptStyle() }; },
        providerOperations: capabilities.providerService,
        conversationArchive: openLocalPetAssistantConversationArchive({ userDataPath: dataDirectory, onDiagnostic: (message, fields) => warn("app", message, fields) }),
      });
      startVoiceAssistantHost(capabilities.providerService, assistant);
      const localPaths = Array.from(new Set([...paths, ...plugins.getLocalSourcePaths()]));
      for (const path of localPaths) {
        const result = await plugins.loadLocalPath(path, { autoApprove: true });
        if (!result.ok) logError("plugin", "已授权本地插件重新加载失败", new Error(result.error));
      }
      if (roots.length) {
        for (const result of await plugins.loadLocalRoots(roots, { autoApprove: true, pruneStale: true })) {
          if (!result.ok) logError("plugin", "开发插件加载失败", new Error(result.error));
        }
      }
      const watched = Array.from(new Set([...paths, ...plugins.getLocalSourcePaths()]));
      if (development || watched.length) watcher = startDevPluginWatcher(plugins, roots, watched);
    })();
    void pluginStartup.catch((reason) => logError("app", "桌宠能力启动失败", reason));
    launchReady = true;
    if (pendingLaunch) applyLaunch(pendingLaunch);
    if (pendingLaunch !== "pet" && shouldOpenDefaultPetOnLaunch()) showDefaultPet();
    startLanController();
    try { await remote.start(); } catch { warn("remote", "已配置的本机远程监听未能启动"); }
    refreshTrayMenu();
    if (captureDirectory) startCaptureSession({ sessionDir: captureDirectory, pluginService: plugins, pluginCapabilities: capabilities, pluginStartup });
    const route = resolveDevControlCenterRoute(process.env.OPENPETS_DEV_ROUTE, app.isPackaged);
    if (route?.kind === "route") openControlCenterWindow(route.route);
    else if (route?.kind === "target") openControlCenterWindowTarget(route.target);
    else if (route?.kind === "invalid") warn("ui", "开发页面参数无效", { value: route.rawValue });
    info("app", "桌宠工作室启动完成", { profile: dataDirectory, version: app.getVersion(), packaged: app.isPackaged, platform: process.platform });
  }).catch((reason: unknown) => {
    releaseStartupInstallLock();
    logError("app", "桌宠工作室启动失败", reason);
    app.quit();
  });
}

function canSpeak(): boolean { return isDefaultPetVisible() && !getDefaultPetPaused(); }
function configureShortcuts(): void {
  const preferences = getAppStateSnapshot().preferences;
  initializeVoiceAssistantShortcut(globalShortcut, () => { void toggleVoiceAssistant().catch((reason: unknown) => logError("app", "语音快捷键失败", reason)); }, preferences.voiceAssistantShortcut);
  initializeChatShortcut(globalShortcut, () => { if (!isDefaultPetChatExpanded()) setDefaultPetChatCompactOpen(!isDefaultPetChatCompactOpen()); }, preferences.chatShortcut);
  initializePetToggleShortcut(globalShortcut, () => { if (isDefaultPetVisible()) hideDefaultPet(); else showDefaultPet(); refreshTrayMenu(); }, preferences.petToggleShortcut);
}
function configureVoiceDevices(): void {
  getSharedVoiceDeviceService({ enumerate: enumerateTrustedVoiceDevices, probeOutputSelection: probeTrustedVoiceOutput,
    getPreferences: () => { const preferences = getAppStateSnapshot().preferences; return { preferredInputDeviceId: preferences.preferredVoiceInputDeviceId, preferredOutputDeviceId: preferences.preferredVoiceOutputDeviceId }; },
    savePreferences: (preferences) => updatePreferences({ ...(preferences.preferredInputDeviceId === undefined ? {} : { preferredVoiceInputDeviceId: preferences.preferredInputDeviceId }), ...(preferences.preferredOutputDeviceId === undefined ? {} : { preferredVoiceOutputDeviceId: preferences.preferredOutputDeviceId }) }),
  });
}
function developerPaths(value: string | undefined): string[] { return value ? value.split(delimiter).map((path) => path.trim()).filter(Boolean).map((path) => resolve(path)) : []; }
function pluginLog(level: "debug" | "info" | "warn" | "error", message: string, fields?: Record<string, unknown>): void {
  if (level === "error") logError("plugin", message, fields); else if (level === "warn") warn("plugin", message, fields); else if (level === "info") info("plugin", message, fields); else debug("plugin", message, fields);
}
function remoteStatus(): RemoteStatusSnapshot {
  const state = getAppStateSnapshot();
  const pet = state.pets.installed.find((item) => item.id === state.preferences.defaultPetId && !item.broken) ?? state.pets.installed.find((item) => item.builtIn) ?? state.pets.installed[0];
  return { ok: true, appRunning: true, protocolVersion: openPetsRemoteVersion, defaultPet: { id: pet?.id ?? "builtin", builtIn: pet?.builtIn === true, broken: pet?.broken === true }, paused: getDefaultPetPaused(), defaultPetVisible: isDefaultPetVisible(), openDefaultPetOnLaunch: state.preferences.openDefaultPetOnLaunch, speechBubblesEnabled: state.preferences.speechBubblesEnabled };
}
