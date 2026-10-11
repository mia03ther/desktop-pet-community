import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";

// 仅启动指定的发布包与新档案，验证真实主进程、预加载桥和渲染器。
const argumentsMap = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  argumentsMap.set(process.argv[index], process.argv[index + 1]);
}
const executableArgument = argumentsMap.get("--exe");
const outputArgument = argumentsMap.get("--output");
assert.ok(executableArgument && outputArgument, "请指定 --exe 发布程序和 --output 新验收目录。");
const executable = resolve(executableArgument);
const output = resolve(outputArgument);
assert.ok(existsSync(executable), "指定的发布程序不存在。");
assert.equal(existsSync(output), false, "验收只使用全新的输出目录，避免读取已有档案。");
const expectedPlatform = argumentsMap.get("--platform") ?? process.platform;
const expectedArch = argumentsMap.get("--arch") ?? process.arch;
assert.equal(expectedPlatform, process.platform, "必须在目标操作系统实际运行验收。");
assert.equal(expectedArch, process.arch, "必须使用目标架构的 Node.js 实际验收。");
const resources = expectedPlatform === "darwin"
  ? resolve(dirname(executable), "../Resources")
  : join(dirname(executable), "resources");
const archive = join(resources, "app.asar");
assert.ok(existsSync(archive), "发布包缺少 app.asar。");
const digest = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const archiveDigest = digest(archive);
const profile = join(output, "isolated-profile");
mkdirSync(profile, { recursive: true });
writeFileSync(join(profile, "openpets-state.json"), JSON.stringify({
  version: 1,
  preferences: { locale: "zh-Hans", onboardingCompleted: true, openDefaultPetOnLaunch: false },
}));
const result = {
  passed: false,
  startedAt: new Date().toISOString(),
  expectedPlatform,
  expectedArch,
  appAsarSha256: archiveDigest,
  originalProfileAccessed: false,
  checks: [],
};
const pause = milliseconds => new Promise(done => setTimeout(done, milliseconds));
const guard = createServer();
await new Promise((done, reject) => {
  guard.once("error", reject);
  guard.listen(0, "127.0.0.1", done);
});
const port = guard.address().port;
await new Promise(done => guard.close(done));
const log = openSync(join(output, "packaged-run.log"), "w");
const environment = {
  ...process.env,
  DESKTOP_PET_PROFILE_DIR: profile,
  OPENPETS_DISCOVERY_FILE: join(profile, "runtime/ipc.json"),
  OPENPETS_DISABLE_PLUGIN_CATALOG: "1",
  OPENPETS_DEV_PLUGIN_ROOTS: "",
  OPENPETS_DEV_PLUGIN_PATHS: "",
  OPENPETS_REMOTE_ENDPOINT: "",
  OPENPETS_REMOTE_TOKEN: "",
};
delete environment.ELECTRON_RUN_AS_NODE;
const child = spawn(executable, [
  `--inspect=127.0.0.1:${port}`,
  `--desktop-pet-profile-dir=${profile}`,
], { cwd: dirname(executable), env: environment, windowsHide: true, shell: false, stdio: ["ignore", log, log] });
let closed = false;
let spawnError;
const exited = new Promise(done => {
  child.once("error", error => { spawnError = error; });
  child.once("close", (code, signal) => {
    closed = true;
    closeSync(log);
    done({ code, signal });
  });
});
let target;
async function evaluate(expression) {
  return new Promise((done, reject) => {
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("本次发布包 inspector 超时。"));
    }, 15000);
    socket.onopen = () => socket.send(JSON.stringify({
      id: 1,
      method: "Runtime.evaluate",
      params: { expression: `globalThis.__packagedSmokePending = (${expression})`, awaitPromise: true, returnByValue: true },
    }));
    socket.onmessage = event => {
      const response = JSON.parse(event.data);
      if (response.id !== 1) return;
      clearTimeout(timer);
      socket.close();
      if (response.error || response.result?.exceptionDetails) {
        reject(new Error(response.result?.exceptionDetails?.exception?.description ?? JSON.stringify(response.error ?? response.result.exceptionDetails)));
      } else {
        done(response.result.result.value);
      }
    };
    socket.onerror = () => {
      clearTimeout(timer);
      socket.close();
      reject(new Error("本次发布包 inspector 连接失败。"));
    };
  });
}
const context = `const r=process.getBuiltinModule('module').createRequire(process.resourcesPath+'/app.asar/package.json');const e=r('electron');`;
try {
  for (let attempt = 0; attempt < 300 && !closed && !target; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(500) });
      target = (await response.json()).find(item => item.type === "node");
    } catch {
      await pause(100);
    }
  }
  assert.ok(target, spawnError?.message ?? "发布程序未创建 inspector 主进程。");
  for (let attempt = 0; attempt < 300 && !closed && !existsSync(join(profile, "runtime/ipc.json")); attempt++) {
    await pause(100);
  }
  assert.equal(closed, false, "发布包在初始化时退出。");
  assert.ok(existsSync(join(profile, "runtime/ipc.json")), "发布包未启动隔离 IPC。");
  const identity = await evaluate(`(()=>{${context}return {pid:process.pid,platform:process.platform,arch:process.arch,profile:e.app.getPath('userData'),appPath:e.app.getAppPath(),packaged:e.app.isPackaged,version:e.app.getVersion()};})()`);
  assert.equal(identity.pid, child.pid);
  assert.equal(identity.platform, expectedPlatform);
  assert.equal(identity.arch, expectedArch);
  assert.equal(resolve(identity.profile), profile);
  assert.equal(resolve(identity.appPath), archive);
  assert.equal(identity.packaged, true);
  result.checks.push({ name: "实际发布包与隔离档案", platform: identity.platform, arch: identity.arch, version: identity.version });
  const native = await evaluate(`(async()=>{${context}const sharp=r('sharp');const bytes=await sharp({create:{width:2,height:2,channels:4,background:{r:0,g:120,b:80,alpha:1}}}).png().toBuffer();const meta=await sharp(bytes).metadata();return {width:meta.width,height:meta.height,format:meta.format,bytes:bytes.length};})()`);
  assert.equal(native.width, 2);
  assert.equal(native.height, 2);
  assert.equal(native.format, "png");
  assert.ok(native.bytes > 0);
  result.checks.push({ name: "实际原生 Sharp 编码与解码", ...native });
  await evaluate(`(async()=>{${context}await e.app.whenReady();e.session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_request,callback)=>callback({cancel:true}));r(e.app.getAppPath()+'/dist/windows.js').openControlCenterWindow('pets');r(e.app.getAppPath()+'/dist/default-pet-controller.js').showDefaultPet();return true;})()`);
  let rendered;
  for (let attempt = 0; attempt < 300 && !closed; attempt++) {
    rendered = await evaluate(`(async()=>{${context}const studio=r(e.app.getAppPath()+'/dist/windows.js').getControlCenterWindow();const pet=r(e.app.getAppPath()+'/dist/default-pet-controller.js').getDefaultPetWindowForPlugins();if(!studio||!pet||studio.webContents.isLoading()||pet.webContents.isLoading())return null;const ui=await studio.webContents.executeJavaScript('({bridge: Boolean(window.openPetsControlCenter),layout: Boolean(document.querySelector(".studio-shell"))})');const sprite=await pet.webContents.executeJavaScript('({role:document.documentElement.dataset.petRole,hasSprite:Boolean(document.querySelector(".sprite, .installed-sprite, .installed-media")),width:document.querySelector(".pet-shell")?.getBoundingClientRect().width})');return {ui,sprite,petVisible:pet.isVisible()};})()`);
    if (rendered?.ui.bridge && rendered?.ui.layout && rendered?.sprite.hasSprite && rendered.petVisible) break;
    await pause(100);
  }
  assert.ok(rendered?.ui.bridge && rendered?.ui.layout, "真实控制中心或预加载桥未就绪。");
  assert.ok(rendered?.sprite.hasSprite && rendered.sprite.width > 0 && rendered.petVisible, "真实桌宠窗口未显示素材。");
  assert.equal(rendered.sprite.role, "default");
  result.checks.push({ name: "实际控制中心、预加载与桌宠渲染", ...rendered });
  // 原生菜单弹出由本次验收截获，实际右键事件与菜单回调仍经过正式窗口链路。
  await evaluate(`(async()=>{${context}globalThis.__smokeMenu=null;globalThis.__smokeMenuPopup=e.Menu.prototype.popup;e.Menu.prototype.popup=function(){globalThis.__smokeMenu=this;};const pet=r(e.app.getAppPath()+'/dist/default-pet-controller.js').getDefaultPetWindowForPlugins();const point=await pet.webContents.executeJavaScript('(()=>{const b=document.querySelector(".sprite, .installed-sprite, .installed-media").getBoundingClientRect();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}})()');pet.webContents.sendInputEvent({type:'mouseDown',button:'right',clickCount:1,...point});pet.webContents.sendInputEvent({type:'mouseUp',button:'right',clickCount:1,...point});return true;})()`);
  let menuLabels;
  for (let attempt = 0; attempt < 100; attempt++) {
    menuLabels = await evaluate(`(()=>{${context}return globalThis.__smokeMenu?.items.map(item=>item.label)??null;})()`);
    if (menuLabels) break;
    await pause(100);
  }
  assert.deepEqual(menuLabels, ["打开控制中心", "动作", "隐藏", "对话", "大小"], "真实右键菜单没有正确响应。");
  await evaluate(`(()=>{${context}const pet=r(e.app.getAppPath()+'/dist/default-pet-controller.js').getDefaultPetWindowForPlugins();const item=globalThis.__smokeMenu.items.find(item=>item.label==='对话');item.click(item,pet,{});e.Menu.prototype.popup=globalThis.__smokeMenuPopup;return true;})()`);
  let dialogue;
  for (let attempt = 0; attempt < 100; attempt++) {
    dialogue = await evaluate(`(async()=>{${context}const pet=r(e.app.getAppPath()+'/dist/default-pet-controller.js').getDefaultPetWindowForPlugins();return await pet.webContents.executeJavaScript('(()=>{const input=document.querySelector("textarea, input[type=text]");return input?{placeholder:input.placeholder,fontFamily:getComputedStyle(input).fontFamily,visible:input.getBoundingClientRect().height>0}:null})()');})()`);
    if (dialogue?.visible) break;
    await pause(100);
  }
  assert.ok(dialogue?.visible, "右键菜单的对话没有打开实际输入框。");
  assert.match(dialogue.placeholder, /桌宠/);
  assert.ok(dialogue.fontFamily.length > 0);
  result.checks.push({ name: "实际右键菜单与中文对话输入", menuLabels, nativePopupIntercepted: true, ...dialogue });
  // 仅选择随包的已知提醒 ZIP；拒绝一次权限后，再明确批准同一份权限清单。
  const expectedPermissions = ["pet:speak", "pet:interact", "audio", "schedule", "storage", "commands"];
  const pluginZip = join(resources, "community-web", "assets", "openpets.water-reminder.zip");
  assert.ok(existsSync(pluginZip), "发布包缺少共创站喝水提醒 ZIP。");
  await evaluate(`(()=>{${context}globalThis.__smokeImport={approve:false,filters:[],permissions:[],openDialog:e.dialog.showOpenDialog,messageBox:e.dialog.showMessageBox};const state=globalThis.__smokeImport;e.dialog.showOpenDialog=async(...args)=>{const options=args.at(-1);if(!options.filters?.some(filter=>filter.extensions.includes('zip')))throw Error('导入入口没有开放 ZIP');state.filters.push(options.filters);return {canceled:false,filePaths:[${JSON.stringify(pluginZip)}]};};e.dialog.showMessageBox=async(...args)=>{const options=args.at(-1);if(options.title==='导入插件'&&options.message==='选择要导入的插件包')return {response:0,checkboxChecked:false};if(options.title!=='安装 desktop pet 插件'||options.detail!==${JSON.stringify('Permissions: '+expectedPermissions.join(', '))})throw Error('验收拒绝未知权限确认');state.permissions.push({detail:options.detail,approved:state.approve});return {response:state.approve?0:1,checkboxChecked:false};};return true;})()`);
  const render = expression => evaluate(`(async()=>{${context}const studio=r(e.app.getAppPath()+'/dist/windows.js').getControlCenterWindow();return studio.webContents.executeJavaScript(${JSON.stringify(expression)});})()`);
  try {
    const rejected = await render("window.openPetsControlCenter.loadLocalPlugin()");
    assert.equal(rejected.ok, true);
    assert.equal(rejected.snapshot.plugins.some(plugin => plugin.id === "openpets.water-reminder"), false, "拒绝权限后不得安装或启用插件。");
    await evaluate("globalThis.__smokeImport.approve=true");
    const imported = await render("window.openPetsControlCenter.loadLocalPlugin()");
    assert.equal(imported.ok, true, imported.error);
    let installed;
    for (let attempt = 0; attempt < 100; attempt++) {
      installed = (await render("window.openPetsControlCenter.getPluginsSnapshot()")).plugins.find(plugin => plugin.id === "openpets.water-reminder");
      if (installed?.enabled && installed.commands?.some(command => command.id === "test-reminder")) break;
      await pause(100);
    }
    assert.ok(installed?.enabled && !installed.brokenReason, "真实 ZIP 插件没有正常启用。");
    assert.deepEqual([...installed.approvedPermissions].sort(), [...expectedPermissions].sort());
    assert.ok(installed.commands.some(command => command.id === "test-reminder"));
    const before = (await render("window.openPetsControlCenter.ai.getSnapshot()")).conversation.items.length;
    const commanded = await render("window.openPetsControlCenter.executePluginCommand('openpets.water-reminder','test-reminder')");
    assert.equal(commanded.ok, true, commanded.error);
    let reminder;
    for (let attempt = 0; attempt < 100; attempt++) {
      const items = (await render("window.openPetsControlCenter.ai.getSnapshot()")).conversation.items;
      reminder = items.slice(before).find(item => item.text.includes("喝水休息一下？"));
      if (reminder) break;
      await pause(100);
    }
    assert.ok(reminder?.createdAt, "真实插件提醒没有带时间进入桌宠会话。");
    const disabled = await render("window.openPetsControlCenter.setPluginEnabled('openpets.water-reminder',false)");
    assert.equal(disabled.ok, true, disabled.error);
    assert.equal(disabled.snapshot.plugins.find(plugin => plugin.id === "openpets.water-reminder").enabled, false);
    const confirmations = await evaluate("({filters:globalThis.__smokeImport.filters,permissions:globalThis.__smokeImport.permissions})");
    assert.deepEqual(confirmations.permissions.map(item => item.approved), [false, true]);
    result.checks.push({ name: "实际共创站 ZIP 导入、权限拒绝与授权、提醒会话及停用", id: installed.id, zipSha256: digest(pluginZip), approvedPermissions: installed.approvedPermissions, nativePickerIntercepted: true, permissionDialogIntercepted: true, actualPreloadIpc: true, reminderHasTimestamp: true, disabledAfterTest: true });
  } finally {
    await evaluate(`(()=>{${context}e.dialog.showOpenDialog=globalThis.__smokeImport.openDialog;e.dialog.showMessageBox=globalThis.__smokeImport.messageBox;return true;})()`);
  }
  const captures = await evaluate(`(async()=>{${context}const studio=r(e.app.getAppPath()+'/dist/windows.js').getControlCenterWindow();const pet=r(e.app.getAppPath()+'/dist/default-pet-controller.js').getDefaultPetWindowForPlugins();return {studio:(await studio.webContents.capturePage()).toPNG().toString('base64'),pet:(await pet.webContents.capturePage()).toPNG().toString('base64')};})()`);
  writeFileSync(join(output, "control-center.png"), Buffer.from(captures.studio, "base64"));
  writeFileSync(join(output, "pet.png"), Buffer.from(captures.pet, "base64"));
  await evaluate(`(()=>{${context}setTimeout(()=>e.app.quit(),50);return true;})()`);
  const exit = await Promise.race([exited, pause(10000).then(() => null)]);
  assert.ok(exit, "发布包未正常退出。");
  assert.equal(exit.code, 0);
  assert.equal(exit.signal, null);
  assert.equal(digest(archive), archiveDigest, "验收不得修改发布包。");
  result.checks.push({ name: "正常退出与原包保持", code: exit.code, archiveUnchanged: true });
  result.passed = true;
  console.log("发布包真实启动、原生依赖、控制中心、桌宠显示、ZIP 插件导入与正常退出验收通过。");
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  throw error;
} finally {
  if (!closed) {
    if (target) await evaluate(`(()=>{${context}setTimeout(()=>e.app.quit(),50);return true;})()`).catch(() => undefined);
    await Promise.race([exited, pause(5000)]);
    if (!closed) child.kill();
  }
  result.finishedAt = new Date().toISOString();
  writeFileSync(join(output, "result.json"), JSON.stringify(result, null, 2));
}