import assert from "node:assert/strict";

import {
  installControlCenterPetManagementIpcHandlers,
  type ControlCenterPetManagementIpcDependencies,
  type ControlCenterPetManagementIpcEvent,
  type ControlCenterPetManagementIpcHandler,
} from "../src/control-center-pet-management-ipc.js";
import { codexV2SpriteLayout } from "../src/codex-pets-core.js";
import type { PetAuthoringSelection } from "../src/pet-authoring-types.js";

const channels = [
  "openpets:get-pets-state",
  "openpets:get-catalog",
  "openpets:get-catalog-page",
  "openpets:get-catalog-search",
  "openpets:get-codex-pets",
  "openpets:set-default-pet",
  "openpets:set-pet-pool-order",
  "openpets:install-pet",
  "openpets:install-local-pet",
  "openpets:export-pet-package",
  "openpets:choose-pet-spritesheet",
  "openpets:create-pet",
  "openpets:discard-pet-draft",
  "openpets:open-gallery",
  "openpets:import-codex-pet",
  "openpets:remove-pet",
  "openpets:reset-default-pet-position",
] as const;

const event: ControlCenterPetManagementIpcEvent = { sender: { id: 7 } };

type Call = { readonly method: string; readonly args: readonly unknown[] };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

function createHarness() {
  const handlers = new Map<string, ControlCenterPetManagementIpcHandler>();
  const calls: Call[] = [];
  const logs: Array<{ readonly level: string; readonly message: string; readonly fields?: Record<string, unknown> }> = [];
  const state = {
    preferences: { defaultPetId: "default" },
    pets: {
      installed: [
        { id: "builtin", builtIn: true, displayName: "Built-in" },
        { id: "personal", builtIn: false, displayName: "Personal" },
        { id: "team", builtIn: false, displayName: "Team", source: { kind: "team" } },
        { id: "broken-layout", builtIn: false, displayName: "Broken layout" },
      ],
    },
  };
  const settings = { settings: true };
  let currentControlCenter = true;
  let messageResponse = 2;
  let openDialogResult = { canceled: true, filePaths: [] as string[] };
  let openDialogGate: Promise<typeof openDialogResult> | null = null;
  let selectedIsDirectory = false;
  let mutationError: Error | null = null;
  const delayedCallbacks: Array<() => void> = [];
  const owners: unknown[] = [];
  const layoutPaths: string[] = [];
  let activeLayouts = 0;
  let maxActiveLayouts = 0;
  const dialogOptions: unknown[] = [];
  const owner = { kind: "owner" };
  let prepare: ControlCenterPetManagementIpcDependencies["preparePersonalPetSpritesheet"] = async (path) => ({
    path, sha256: "a".repeat(64), previewDataUrl: "data:image/webp;base64,VGVzdA==", spriteLayout: codexV2SpriteLayout,
  });
  let create: ControlCenterPetManagementIpcDependencies["installPetFromSpritesheetFileWithResult"] = async (_path, input) => {
    if (mutationError) throw mutationError;
    return { petId: input.id, displayName: input.displayName };
  };

  const record = (method: string, ...args: unknown[]) => calls.push({ method, args });
  const mutate = async (method: string, value: unknown) => {
    record(method, value);
    if (mutationError) throw mutationError;
    return { from: method };
  };

  const dependencies: ControlCenterPetManagementIpcDependencies = {
    registerHandle: (channel, handler) => handlers.set(channel, handler),
    authorizeSender: () => record("authorize"),
    isCurrentControlCenterSender: () => currentControlCenter,
    getOwnerForSender: () => { record("getOwnerForSender"); owners.push(owner); return owner; },
    showMessageBox: async (dialogOwner, options) => {
      record("showMessageBox", dialogOwner, options);
      dialogOptions.push(options);
      return { response: messageResponse };
    },
    showOpenDialog: async (dialogOwner, options) => {
      record("showOpenDialog", dialogOwner, options);
      dialogOptions.push(options);
      return openDialogGate ?? openDialogResult;
    },
    stat: async (path) => {
      record("stat", path);
      return { isDirectory: () => selectedIsDirectory };
    },
    openExternal: async (url) => { record("openExternal", url); },
    setTimeout: (callback, delayMs) => {
      record("setTimeout", delayMs);
      delayedCallbacks.push(callback);
      return { unref: () => record("unref") };
    },
    getAppStateSnapshot: () => { record("getAppStateSnapshot"); return state as never; },
    getSettingsStateSnapshot: () => { record("getSettingsStateSnapshot"); return settings; },
    readInstalledPetSpriteLayout: async (petId, source) => {
      record("readInstalledPetSpriteLayout", petId, source);
      layoutPaths.push(`${petId}:${source}`);
      activeLayouts += 1;
      maxActiveLayouts = Math.max(maxActiveLayouts, activeLayouts);
      await Promise.resolve();
      activeLayouts -= 1;
      if (petId === "broken-layout") throw new Error("missing layout");
      return { petId, source } as never;
    },
    getCatalogUiState: async () => { record("getCatalogUiState"); return { catalog: true }; },
    getCatalogPageUiState: async (page) => { record("getCatalogPageUiState", page); return { page }; },
    getCatalogSearchUiState: async () => { record("getCatalogSearchUiState"); return { search: true }; },
    getCodexPetsUiState: async () => { record("getCodexPetsUiState"); return { codex: true }; },
    setDefaultInstalledPet: (petId) => mutate("setDefaultInstalledPet", petId),
    refreshDefaultPetContent: () => record("refreshDefaultPetContent"),
    recoverDefaultPetMouseInterop: (reason) => record("recoverDefaultPetMouseInterop", reason),
    broadcastDashboardRefresh: () => record("broadcastDashboardRefresh"),
    normalizePetPoolOrder: (ids) => { record("normalizePetPoolOrder", ids); return undefined; },
    setPetPoolOrder: (ids) => record("setPetPoolOrder", ids),
    installPet: (petId) => mutate("installPet", petId),
    installPetFromFolder: (path) => mutate("installPetFromFolder", path),
    installPetFromZipFile: (path) => mutate("installPetFromZipFile", path),
    exportInstalledPetPackage: async (petId, parentDir, signal, options) => {
      record("exportInstalledPetPackage", petId, parentDir, signal, options);
      if (mutationError) throw mutationError;
      return {
        petId,
        displayName: "Personal",
        directoryPath: `${parentDir}/personal-share`,
        ...(options?.format === "zip" ? { archivePath: `${parentDir}/personal-share/personal.zip` } : {}),
      };
    },
    preparePersonalPetSpritesheet: async (path, signal) => {
      record("preparePersonalPetSpritesheet", path, signal);
      return prepare(path, signal);
    },
    installPetFromSpritesheetFileWithResult: async (path, input, options) => {
      record("installPetFromSpritesheetFileWithResult", path, input, options);
      return create(path, input, options);
    },
    importCodexPet: (petId) => mutate("importCodexPet", petId),
    removePet: (petId) => mutate("removePet", petId),
    resetDefaultPetToInitialPosition: () => record("resetDefaultPetToInitialPosition"),
    logger: {
      debug: (message, fields) => logs.push({ level: "debug", message, fields }),
      error: (message, fields) => logs.push({ level: "error", message, fields }),
    },
  };

  const lifecycle = installControlCenterPetManagementIpcHandlers(dependencies);
  return {
    lifecycle,
    handlers,
    calls,
    logs,
    state,
    settings,
    owners,
    layoutPaths,
    getMaxActiveLayouts: () => maxActiveLayouts,
    dialogOptions,
    delayedCallbacks,
    owner,
    setCurrent: (value: boolean) => { currentControlCenter = value; },
    setMessageResponse: (value: number) => { messageResponse = value; },
    setOpenDialogResult: (value: typeof openDialogResult) => { openDialogResult = value; },
    setOpenDialogGate: (value: typeof openDialogGate) => { openDialogGate = value; },
    setSelectedIsDirectory: (value: boolean) => { selectedIsDirectory = value; },
    setMutationError: (value: Error | null) => { mutationError = value; },
    setPrepare: (value: typeof prepare) => { prepare = value; },
    setCreate: (value: typeof create) => { create = value; },
  };
}

function getHandler(harness: ReturnType<typeof createHarness>, channel: (typeof channels)[number]): ControlCenterPetManagementIpcHandler {
  const handler = harness.handlers.get(channel);
  assert.ok(handler, `missing handler ${channel}`);
  return handler;
}

assert.deepEqual([...createHarness().handlers.keys()], channels);

{
  const harness = createHarness();
  harness.calls.length = 0;
  harness.handlers.clear();
  installControlCenterPetManagementIpcHandlers({
    ...({} as ControlCenterPetManagementIpcDependencies),
    registerHandle: (channel, handler) => harness.handlers.set(channel, handler),
    authorizeSender: () => { throw new Error("unauthorized"); },
  });
  for (const channel of channels) {
    const args = channel.includes("pet") && !channel.includes("pets-state") && !channel.includes("pool") ? ["pet"] : channel === "openpets:set-pet-pool-order" ? [[]] : [];
    await assert.rejects(async () => getHandler(harness, channel)(event, ...args), /unauthorized/);
  }
  assert.deepEqual(harness.calls, [], "authorization is first for every channel");
}

{
  const harness = createHarness();
  assert.deepEqual(await getHandler(harness, "openpets:get-catalog")(event), { catalog: true });
  assert.deepEqual(await getHandler(harness, "openpets:get-catalog-page")(event, 3), { page: 3 });
  await assert.rejects(async () => getHandler(harness, "openpets:get-catalog-page")(event, -1), /Invalid catalog page\./);
  await assert.rejects(async () => getHandler(harness, "openpets:get-catalog-page")(event, 1.5), /Invalid catalog page\./);
  assert.deepEqual(await getHandler(harness, "openpets:get-catalog-search")(event), { search: true });
  assert.deepEqual(await getHandler(harness, "openpets:get-codex-pets")(event), { codex: true });
  const snapshot = await getHandler(harness, "openpets:get-pets-state")(event) as { readonly pets: { readonly installed: readonly { readonly id: string; readonly spriteLayout?: unknown }[] } };
  assert.equal(harness.calls.filter(({ method }) => method === "getAppStateSnapshot").length, 1);
  assert.equal(harness.getMaxActiveLayouts() > 1, true, "installed pet layout enrichment runs in parallel");
  assert.deepEqual(harness.layoutPaths, ["personal:personal", "team:team", "broken-layout:personal"]);
  assert.equal(snapshot.pets.installed.find((pet) => pet.id === "broken-layout")?.spriteLayout, undefined);
  assert.ok(snapshot.pets.installed.find((pet) => pet.id === "builtin")?.spriteLayout);
}

async function chooseSpritesheet(harness: ReturnType<typeof createHarness>, sender = event): Promise<PetAuthoringSelection> {
  harness.setOpenDialogResult({ canceled: false, filePaths: ["native-selected.webp"] });
  const result = await getHandler(harness, "openpets:choose-pet-spritesheet")(sender) as PetAuthoringSelection | null;
  assert.ok(result);
  return result;
}

const authoringInput = { id: "new-cat", displayName: "新猫", description: "本地制作测试" };

// 导出必须由宿主确认个人桌宠，并且只使用原生选择的保存位置。
{
  const harness = createHarness();
  for (const id of ["builtin", "team", "unknown"]) {
    await assert.rejects(async () => getHandler(harness, "openpets:export-pet-package")(event, id));
  }
  assert.equal(harness.dialogOptions.length, 0);
  assert.equal(await getHandler(harness, "openpets:export-pet-package")(event, "personal"), null);
  assert.equal(harness.calls.some(({ method }) => method === "exportInstalledPetPackage"), false);

  harness.setOpenDialogResult({ canceled: false, filePaths: ["chosen-parent"] });
  assert.deepEqual(await getHandler(harness, "openpets:export-pet-package")(event, "personal"), {
    petId: "personal", displayName: "Personal", directoryPath: "chosen-parent/personal-share",
  });
  const exported = harness.calls.find(({ method }) => method === "exportInstalledPetPackage");
  assert.deepEqual(exported?.args.slice(0, 2), ["personal", "chosen-parent"]);

  const snapshot = await getHandler(harness, "openpets:get-pets-state")(event) as {
    pets: { installed: Array<{ id: string; exportable?: boolean }> };
  };
  assert.equal(snapshot.pets.installed.find((pet) => pet.id === "personal")?.exportable, true);
  for (const id of ["builtin", "team", "broken-layout"]) {
    assert.equal(snapshot.pets.installed.find((pet) => pet.id === id)?.exportable, false);
  }
}

// 无效分享字段不能打开原生选择器，也不能把渲染器路径带入导出所有者。
{
  const harness = createHarness();
  for (const options of [
    null, [], { format: "tar" }, { format: "zip", sourcePath: "private-directory" },
    { format: "zip", author: "a".repeat(121) },
    { format: "folder", source: "x".repeat(1001) },
    { format: "zip", license: "x".repeat(201) },
    { format: "zip", author: "作者\n新字段" },
    { format: "zip", license: true },
  ]) {
    await assert.rejects(async () => getHandler(harness, "openpets:export-pet-package")(event, "personal", options));
  }
  assert.equal(harness.dialogOptions.length, 0);
  assert.equal(harness.calls.some(({ method }) => method === "exportInstalledPetPackage"), false);

  harness.setOpenDialogResult({ canceled: false, filePaths: ["native-selected-parent"] });
  const exported = await getHandler(harness, "openpets:export-pet-package")(event, "personal", {
    format: "zip", author: " 分享作者 ", source: " 原创测试图 ", license: " 待核实 ",
  }) as { archivePath?: string };
  assert.equal(exported.archivePath, "native-selected-parent/personal-share/personal.zip");
  const call = harness.calls.find(({ method }) => method === "exportInstalledPetPackage");
  assert.equal(call?.args[1], "native-selected-parent");
  assert.deepEqual(call?.args[3], { format: "zip", author: "分享作者", source: "原创测试图", license: "待核实" });
}

// 窗口关闭或退出时，迟到的原生选择不能启动文件导出。
{
  const harness = createHarness();
  harness.setOpenDialogResult({ canceled: false, filePaths: ["chosen-parent"] });
  let finishDialog: () => void = () => { throw new Error("选择尚未开始。"); };
  harness.setOpenDialogGate(new Promise((resolve) => {
    finishDialog = () => resolve({ canceled: false, filePaths: ["chosen-parent"] });
  }));
  const pending = getHandler(harness, "openpets:export-pet-package")(event, "personal");
  await assert.rejects(async () => getHandler(harness, "openpets:export-pet-package")(event, "personal"));
  harness.lifecycle.cancelForSender(event.sender.id);
  finishDialog();
  assert.equal(await pending, null);
  assert.equal(harness.calls.some(({ method }) => method === "exportInstalledPetPackage"), false);

  harness.setOpenDialogGate(null);
  const exiting = getHandler(harness, "openpets:export-pet-package")(event, "personal");
  harness.lifecycle.dispose();
  assert.equal(await exiting, null);
  harness.setCurrent(false);
  assert.equal(await getHandler(harness, "openpets:export-pet-package")(event, "personal"), null);
  assert.equal(harness.calls.some(({ method }) => method === "exportInstalledPetPackage"), false);
}

{
  const harness = createHarness();
  await getHandler(harness, "openpets:set-default-pet")(event, "personal");
  assert.deepEqual(harness.calls.slice(0, 8).map(({ method }) => method), [
    "authorize", "setDefaultInstalledPet", "refreshDefaultPetContent", "recoverDefaultPetMouseInterop", "setTimeout", "unref", "broadcastDashboardRefresh", "getAppStateSnapshot",
  ]);
  assert.deepEqual(harness.calls.find(({ method }) => method === "setDefaultInstalledPet")?.args, ["personal"]);
  assert.deepEqual(harness.calls.find(({ method }) => method === "setTimeout")?.args, [500]);
  harness.delayedCallbacks[0]?.();
  assert.equal(harness.calls.at(-1)?.method, "recoverDefaultPetMouseInterop");
  harness.setMutationError(new Error("cannot change"));
  await assert.rejects(async () => getHandler(harness, "openpets:set-default-pet")(event, "personal"), /cannot change/);
  assert.equal(harness.calls.filter(({ method }) => method === "refreshDefaultPetContent").length, 1);
}

{
  const harness = createHarness();
  harness.setMessageResponse(2);
  assert.deepEqual(await getHandler(harness, "openpets:install-local-pet")(event), await getHandler(harness, "openpets:get-pets-state")(event));
  assert.deepEqual(harness.owners, [harness.owner]);
  assert.equal(harness.calls.some(({ method }) => method === "showOpenDialog"), false);
  assert.equal(harness.calls.findIndex(({ method }) => method === "getOwnerForSender") < harness.calls.findIndex(({ method }) => method === "showMessageBox"), true);

  harness.setMessageResponse(0);
  harness.setOpenDialogResult({ canceled: true, filePaths: [] });
  const snapshotsBeforeDialogCancel = harness.calls.filter(({ method }) => method === "getAppStateSnapshot").length;
  await getHandler(harness, "openpets:install-local-pet")(event);
  assert.equal(harness.calls.filter(({ method }) => method === "showMessageBox").length, 2);
  assert.equal(harness.calls.some(({ method }) => method === "showOpenDialog"), true);
  assert.equal(harness.calls.findIndex(({ method }) => method === "showMessageBox") < harness.calls.findIndex(({ method }) => method === "showOpenDialog"), true);
  assert.equal(harness.calls.filter(({ method }) => method === "getAppStateSnapshot").length, snapshotsBeforeDialogCancel + 1);

  harness.setMessageResponse(1);
  harness.setOpenDialogResult({ canceled: false, filePaths: ["/tmp/pet-folder"] });
  harness.setSelectedIsDirectory(true);
  await getHandler(harness, "openpets:install-local-pet")(event);
  assert.equal(harness.calls.some(({ method, args }) => method === "installPetFromFolder" && args[0] === "/tmp/pet-folder"), true);
  assert.equal(harness.calls.some(({ method }) => method === "refreshDefaultPetContent"), true);

  harness.setMessageResponse(0);
  harness.setOpenDialogResult({ canceled: false, filePaths: ["/tmp/pet.zip"] });
  harness.setSelectedIsDirectory(false);
  await getHandler(harness, "openpets:install-local-pet")(event);
  assert.equal(harness.calls.some(({ method, args }) => method === "installPetFromZipFile" && args[0] === "/tmp/pet.zip"), true);

  harness.setMutationError(new Error("bad package"));
  const refreshesBeforeFailure = harness.calls.filter(({ method }) => method === "refreshDefaultPetContent").length;
  await assert.rejects(async () => getHandler(harness, "openpets:install-local-pet")(event), /bad package/);
  assert.equal(harness.logs.some(({ level, message }) => level === "error" && message === "local pet import failed"), true);
  assert.equal(harness.calls.filter(({ method }) => method === "refreshDefaultPetContent").length, refreshesBeforeFailure);
}

{
  const harness = createHarness();
  harness.setCurrent(false);
  const installed = await getHandler(harness, "openpets:install-pet")(event, "personal");
  assert.deepEqual(installed, { from: "installPet" });
  assert.equal(harness.calls.some(({ method }) => method === "getAppStateSnapshot"), false);
  assert.equal(harness.calls.some(({ method }) => method === "refreshDefaultPetContent"), false);
  const imported = await getHandler(harness, "openpets:import-codex-pet")(event, "personal");
  assert.deepEqual(imported, { from: "importCodexPet" });
  assert.equal(harness.calls.some(({ method }) => method === "refreshDefaultPetContent"), false);
  const removed = await getHandler(harness, "openpets:remove-pet")(event, "personal");
  assert.deepEqual(removed, { from: "removePet" });
  assert.equal(harness.calls.some(({ method }) => method === "refreshDefaultPetContent"), true);
  await assert.rejects(async () => getHandler(harness, "openpets:install-pet")(event, 1), /Invalid pet id\./);
  await assert.rejects(async () => getHandler(harness, "openpets:remove-pet")(event, null), /Invalid pet id\./);
}

{
  const harness = createHarness();
  assert.deepEqual(await getHandler(harness, "openpets:set-pet-pool-order")(event, ["one", "one"]), harness.settings);
  assert.deepEqual(harness.calls.find(({ method }) => method === "setPetPoolOrder")?.args, [[]]);
  await assert.rejects(async () => getHandler(harness, "openpets:set-pet-pool-order")(event, "not-array"), /Invalid pet pool order/);
  await getHandler(harness, "openpets:reset-default-pet-position")(event);
  assert.deepEqual(harness.calls.slice(-2).map(({ method }) => method), ["resetDefaultPetToInitialPosition", "getSettingsStateSnapshot"]);
  harness.setCurrent(false);
  assert.deepEqual(await getHandler(harness, "openpets:reset-default-pet-position")(event), harness.state);
  await getHandler(harness, "openpets:open-gallery")(event);
  assert.deepEqual(harness.calls.at(-1), { method: "openExternal", args: ["https://openpets.dev/gallery"] });
}

// 图片路径与摘要只由宿主持有；凭证绑定发送方，创建只投影三个允许字段。
{
  const harness = createHarness();
  const selected = await chooseSpritesheet(harness);
  assert.deepEqual(Object.keys(selected).sort(), ["fileName", "previewDataUrl", "selectionId", "spriteLayout", "suggestedPetId"]);
  assert.equal(selected.fileName, "native-selected.webp");
  assert.ok(selected.selectionId);
  const other: ControlCenterPetManagementIpcEvent = { sender: { id: 8 } };
  for (const invalidToken of ["unknown", null, 7]) {
    await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, invalidToken, authoringInput));
  }
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(other, selected.selectionId, authoringInput));
  await getHandler(harness, "openpets:discard-pet-draft")(other, selected.selectionId);
  await getHandler(harness, "openpets:discard-pet-draft")(event, "not-this-draft");
  await assert.rejects(async () => getHandler(harness, "openpets:discard-pet-draft")(event, null));
  for (const invalidInput of [null, [], { id: 1, displayName: "名称", description: "描述" }]) {
    await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, selected.selectionId, invalidInput));
  }
  assert.equal(harness.calls.some(({ method }) => method === "installPetFromSpritesheetFileWithResult"), false);
  harness.setCreate(async (_path, input) => ({ petId: input.id, displayName: input.displayName, path: "不得返回的宿主路径", sha256: "不得返回的摘要" }));
  const result = await getHandler(harness, "openpets:create-pet")(event, selected.selectionId, {
    ...authoringInput, path: "renderer-forged.webp", expectedSha256: "伪造摘要", spriteVersionNumber: 1, secret: "不得投影",
  });
  assert.deepEqual(result, { petId: authoringInput.id, displayName: authoringInput.displayName });
  const installed = harness.calls.find(({ method }) => method === "installPetFromSpritesheetFileWithResult");
  assert.equal(installed?.args[0], "native-selected.webp");
  assert.deepEqual(installed?.args[1], authoringInput);
  const options = installed?.args[2] as { signal: AbortSignal; expectedSha256: string };
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.signal.aborted, false);
  assert.equal(options.expectedSha256, "a".repeat(64));
  assert.equal(harness.calls.some(({ method }) => method === "broadcastDashboardRefresh"), true);
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, selected.selectionId, authoringInput));
}

// 重新选择立即撤销旧图，无论新选择成功、取消还是校验失败。
for (const outcome of ["selected", "cancelled", "invalid"] as const) {
  const harness = createHarness();
  const previous = await chooseSpritesheet(harness);
  let next: PetAuthoringSelection | null = null;
  if (outcome === "cancelled") harness.setOpenDialogResult({ canceled: true, filePaths: [] });
  if (outcome === "invalid") harness.setPrepare(async () => { throw new Error("测试图集不合法"); });
  if (outcome === "invalid") {
    await assert.rejects(async () => getHandler(harness, "openpets:choose-pet-spritesheet")(event));
  } else {
    next = await getHandler(harness, "openpets:choose-pet-spritesheet")(event) as PetAuthoringSelection | null;
  }
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, previous.selectionId, authoringInput));
  if (outcome === "selected") {
    assert.ok(next);
    assert.notEqual(next.selectionId, previous.selectionId);
    assert.deepEqual(await getHandler(harness, "openpets:create-pet")(event, next.selectionId, authoringInput), {
      petId: authoringInput.id, displayName: authoringInput.displayName,
    });
  } else {
    assert.equal(next, null);
    assert.equal(harness.calls.some(({ method }) => method === "installPetFromSpritesheetFileWithResult"), false);
  }
}

// 过期凭证被撤销，普通创建失败仍允许用户改编号后使用同一选择重试。
{
  const harness = createHarness();
  const realNow = Date.now;
  let now = 1_000;
  Date.now = () => now;
  try {
    const selected = await chooseSpritesheet(harness);
    now += 10 * 60_000;
    await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, selected.selectionId, authoringInput));
    now = 1_000;
    await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, selected.selectionId, authoringInput));
    assert.equal(harness.calls.some(({ method }) => method === "installPetFromSpritesheetFileWithResult"), false);
  } finally {
    Date.now = realNow;
  }
  const retry = await chooseSpritesheet(harness);
  harness.setMutationError(new Error("此编号已存在"));
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, retry.selectionId, authoringInput));
  harness.setMutationError(null);
  const changedInput = { ...authoringInput, id: "changed-id" };
  assert.deepEqual(await getHandler(harness, "openpets:create-pet")(event, retry.selectionId, changedInput), {
    petId: changedInput.id, displayName: changedInput.displayName,
  });
}

// 原生选择尚未返回时，关闭窗口、退出或撤销草稿都使迟到结果失效。
for (const cancellation of ["close", "discard", "dispose"] as const) {
  const harness = createHarness();
  const dialog = deferred<{ canceled: boolean; filePaths: string[] }>();
  harness.setOpenDialogGate(dialog.promise);
  const pending = getHandler(harness, "openpets:choose-pet-spritesheet")(event);
  await assert.rejects(async () => getHandler(harness, "openpets:choose-pet-spritesheet")(event));
  if (cancellation === "close") harness.lifecycle.cancelForSender(event.sender.id);
  if (cancellation === "discard") await getHandler(harness, "openpets:discard-pet-draft")(event);
  if (cancellation === "dispose") harness.lifecycle.dispose();
  dialog.resolve({ canceled: false, filePaths: ["late-selected.webp"] });
  assert.equal(await pending, null);
  assert.equal(harness.calls.some(({ method }) => method === "preparePersonalPetSpritesheet"), false);
  assert.equal(harness.calls.some(({ method }) => method === "installPetFromSpritesheetFileWithResult"), false);
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, "late-token", authoringInput));
}

// 校验尚未返回时取消，返回的预览不得再成为有效授权；其他发送方不能取消它。
for (const cancellation of ["close", "discard"] as const) {
  const harness = createHarness();
  const preparation = deferred<Awaited<ReturnType<ControlCenterPetManagementIpcDependencies["preparePersonalPetSpritesheet"]>>>();
  const entered = deferred<AbortSignal>();
  harness.setPrepare(async (_path, signal) => {
    assert.ok(signal);
    entered.resolve(signal);
    return preparation.promise;
  });
  harness.setOpenDialogResult({ canceled: false, filePaths: ["preparing.webp"] });
  const pending = getHandler(harness, "openpets:choose-pet-spritesheet")(event);
  const signal = await entered.promise;
  const other: ControlCenterPetManagementIpcEvent = { sender: { id: 8 } };
  await getHandler(harness, "openpets:discard-pet-draft")(other);
  assert.equal(signal.aborted, false);
  if (cancellation === "close") harness.lifecycle.cancelForSender(event.sender.id);
  else await getHandler(harness, "openpets:discard-pet-draft")(event);
  assert.equal(signal.aborted, true);
  preparation.resolve({ path: "preparing.webp", sha256: "b".repeat(64), previewDataUrl: "data:image/webp;base64,VGVzdA==", spriteLayout: codexV2SpriteLayout });
  assert.equal(await pending, null);
  assert.equal(harness.calls.some(({ method }) => method === "installPetFromSpritesheetFileWithResult"), false);
  harness.setPrepare(async (path) => ({ path, sha256: "a".repeat(64), previewDataUrl: "data:image/webp;base64,VGVzdA==", spriteLayout: codexV2SpriteLayout }));
  assert.ok(await chooseSpritesheet(harness), "取消结束后可重新选择");
}

// 创建未提交时撤销只请求中止；已提交的迟到成功保持真实结果。
for (const committed of [false, true]) {
  const harness = createHarness();
  const selected = await chooseSpritesheet(harness);
  const creation = deferred<{ petId: string; displayName: string }>();
  const entered = deferred<AbortSignal>();
  harness.setCreate(async (_path, _input, options) => {
    assert.ok(options?.signal);
    entered.resolve(options.signal);
    return creation.promise;
  });
  const pending = getHandler(harness, "openpets:create-pet")(event, selected.selectionId, authoringInput);
  const signal = await entered.promise;
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, selected.selectionId, authoringInput));
  await getHandler(harness, "openpets:discard-pet-draft")(event, "other-token");
  assert.equal(signal.aborted, false);
  if (committed) {
    harness.setCurrent(false);
    harness.lifecycle.cancelForSender(event.sender.id);
  } else {
    await getHandler(harness, "openpets:discard-pet-draft")(event, selected.selectionId);
  }
  assert.equal(signal.aborted, true);
  if (committed) creation.resolve({ petId: authoringInput.id, displayName: authoringInput.displayName });
  else creation.reject(new Error("正常取消，尚未提交"));
  assert.deepEqual(await pending, committed ? { petId: authoringInput.id, displayName: authoringInput.displayName } : null);
  assert.equal(harness.calls.some(({ method }) => method === "broadcastDashboardRefresh"), committed);
  await assert.rejects(async () => getHandler(harness, "openpets:create-pet")(event, selected.selectionId, authoringInput));
}

console.log("宠物管理 IPC：导入、分享、制作凭证与取消行为通过。");
