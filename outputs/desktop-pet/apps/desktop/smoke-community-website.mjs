import assert from "node:assert/strict";
import { appendFileSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import { syncBuiltinESMExports } from "node:module";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { app, dialog, ipcMain, session, shell } from "electron";

const taskRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const profile = process.env.DESKTOP_PET_PROFILE_DIR;
const output = process.env.DESKTOP_PET_SMOKE_OUTPUT;
const compiledRoot = process.env.DESKTOP_PET_SMOKE_BUILD_DIR || join(dirname(fileURLToPath(import.meta.url)), "dist");
const routes = ["pets", "gallery", "persona", "assistant", "plugins", "settings"];
const sizes = [[1280, 860], [980, 720], [820, 620]];
const readySelectors = {
  pets: ".pet-card",
  gallery: '[aria-label="共创网站入口"]',
  persona: "#persona-studio-title",
  assistant: '[aria-label="AI 功能"]',
  plugins: "#studio-plugins-title",
  settings: ".studio-origin",
};
const communityCalls = [];
const prohibitedCalls = [];
const consoleErrors = [];
const rendererFailures = [];
const captures = [];
const layouts = [];
const integrationEntrances = [];
const supportedIntegrationNames = ["Claude Code", "OpenCode", "Cursor", "OpenClaw", "Zed", "Pi"];
let activeWindow;
let outputReserved = false;
let blockedMainHttp = 0;
let blockedRendererHttp = 0;
let integrationSnapshotReads = 0;
let integrationBusy = false;
let integrationEventFixture = false;

const pause = (milliseconds) => new Promise((complete) => setTimeout(complete, milliseconds));
const evaluate = (code) => activeWindow.webContents.executeJavaScript(code);

function reserve(path, label) {
  assert.ok(path && isAbsolute(path), `${label}必须是绝对路径。`);
  const local = resolve(path);
  const remainder = relative(taskRoot, local);
  assert.ok(remainder && !remainder.startsWith("..") && !isAbsolute(remainder), `${label}必须位于本任务工作区。`);
  mkdirSync(dirname(local), { recursive: true });
  mkdirSync(local);
  assert.equal(realpathSync(local), local);
}

function trace(stage) {
  if (outputReserved) appendFileSync(join(output, "网站入口与AI接入执行阶段.log"), `${new Date().toISOString()} ${stage}\n`);
}

async function until(check, label) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await pause(100);
  }
  throw new Error(`网站入口与 AI 接入验收超时：${label}`);
}

async function click(label, scope = ".studio-workspace") {
  await evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(scope)});
    const button = root && [...root.querySelectorAll('button')].find(item => item.textContent.trim() === ${JSON.stringify(label)});
    if (!button || button.disabled) throw Error('按钮缺失或不可用：' + ${JSON.stringify(label)});
    button.focus(); button.click();
  })()`);
}

async function route(name) {
  await evaluate(`(() => {
    const button = document.querySelector('.studio-sidebar [data-route=' + ${JSON.stringify(name)} + ']');
    if (!button || button.disabled) throw Error('工作室导航不可用');
    button.click();
    document.querySelector('.studio-workspace').scrollTop = 0;
  })()`);
  await until(() => evaluate(`document.querySelector('.studio-sidebar [aria-current="page"]')?.getAttribute('data-route') === ${JSON.stringify(name)} && Boolean(document.querySelector(${JSON.stringify(readySelectors[name])}))`), `${name}页面加载`);
  await pause(150);
}

async function warmFrame() {
  activeWindow.webContents.invalidate();
  await activeWindow.webContents.capturePage(undefined, { stayHidden: true, stayAwake: true });
  activeWindow.webContents.invalidate();
  await evaluate(`new Promise((complete, reject) => {
    const timeout = setTimeout(() => reject(Error('隐藏窗口绘制帧超时')), 5000);
    requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(timeout); complete(); }));
  })`);
}

async function capture(name) {
  await warmFrame();
  const state = () => evaluate(`({
    route: document.querySelector('.studio-sidebar [aria-current="page"]')?.getAttribute('data-route'),
    viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio,
    scrollTop: document.querySelector('.studio-workspace').scrollTop,
    integration: document.querySelector('.integration-dialog h2')?.textContent ?? null,
    inspectorScrollTop: document.querySelector('.integration-inspector-body')?.scrollTop ?? null,
    inspectorScrollHeight: document.querySelector('.integration-inspector-body')?.scrollHeight ?? null,
    inspectorClientHeight: document.querySelector('.integration-inspector-body')?.clientHeight ?? null,
    inspectorVisibleContent: (() => {
      const body = document.querySelector('.integration-inspector-body');
      if (!body) return [];
      const bounds = body.getBoundingClientRect();
      return [...body.querySelectorAll('button,code,pre,summary')].filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.top < bounds.bottom && rect.bottom > bounds.top;
      }).map(element => ({ tag: element.tagName, text: element.textContent.trim().slice(0, 500) }));
    })(),
  })`);
  const before = await state();
  const pixels = await activeWindow.webContents.capturePage(undefined, { stayHidden: true, stayAwake: true });
  assert.deepEqual(await state(), before, "截图前后页面必须保持一致。");
  assert.equal(activeWindow.isVisible(), false);
  assert.equal(activeWindow.isFocusable(), false);
  assert.deepEqual(pixels.getSize(), {
    width: Math.round(before.viewport.width * before.devicePixelRatio),
    height: Math.round(before.viewport.height * before.devicePixelRatio),
  });
  await writeFile(join(output, name), pixels.toPNG(), { flag: "wx" });
  captures.push({ name, ...before });
}

async function auditLayout(label) {
  const evidence = await evaluate(`(() => {
    const container = document.querySelector('.integration-dialog') || document.querySelector('.studio-shell');
    const visibleRect = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      if (rect.width <= 0 || rect.height <= 0 || style.visibility === 'hidden' || style.display === 'none') return null;
      const clipped = { left: Math.max(0, rect.left), top: Math.max(0, rect.top), right: Math.min(innerWidth, rect.right), bottom: Math.min(innerHeight, rect.bottom) };
      let parent = element.parentElement;
      while (parent) {
        const parentStyle = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (['auto','scroll','hidden','clip'].includes(parentStyle.overflowX)) {
          clipped.left = Math.max(clipped.left, bounds.left + parent.clientLeft);
          clipped.right = Math.min(clipped.right, bounds.left + parent.clientLeft + parent.clientWidth);
        }
        if (['auto','scroll','hidden','clip'].includes(parentStyle.overflowY)) {
          clipped.top = Math.max(clipped.top, bounds.top + parent.clientTop);
          clipped.bottom = Math.min(clipped.bottom, bounds.top + parent.clientTop + parent.clientHeight);
        }
        parent = parent.parentElement;
      }
      return clipped.right > clipped.left && clipped.bottom > clipped.top ? clipped : null;
    };
    const describe = element => ({ text: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('placeholder') || '').trim().slice(0,100), tag: element.tagName, className: typeof element.className === 'string' ? element.className : '' });
    const controls = [...container.querySelectorAll('button,input,textarea,select,a[href],summary')].filter(element => !element.classList.contains('plugin-config-backdrop') && visibleRect(element));
    const outside = controls.filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < -2 || rect.right > innerWidth + 2;
    }).map(describe);
    const invisible = controls.filter(element => {
      if (element.disabled) return false;
      let current = element;
      while (current) {
        const style = getComputedStyle(current);
        if (Number(style.opacity) < 0.1 || style.visibility === 'hidden') return true;
        current = current.parentElement;
      }
      return ['transparent','rgba(0, 0, 0, 0)'].includes(getComputedStyle(element).color);
    }).map(describe);
    const overlaps = [];
    for (let left = 0; left < controls.length; left += 1) {
      for (let right = left + 1; right < controls.length; right += 1) {
        const first = controls[left], second = controls[right];
        if (first.contains(second) || second.contains(first)) continue;
        const a = visibleRect(first), b = visibleRect(second);
        const width = Math.min(a.right,b.right)-Math.max(a.left,b.left);
        const height = Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
        if (width > 2 && height > 2) overlaps.push({ first: describe(first), second: describe(second), width, height });
      }
    }
    const workspace = document.querySelector('.studio-workspace');
    const inspector = document.querySelector('.integration-inspector');
    const body = document.querySelector('.integration-inspector-body');
    const inspectorRect = inspector?.getBoundingClientRect();
    const closeButton = inspector?.querySelector('.integration-inspector-head button');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      document: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      workspace: { clientWidth: workspace.clientWidth, scrollWidth: workspace.scrollWidth },
      inspector: inspectorRect ? { left: inspectorRect.left, top: inspectorRect.top, right: inspectorRect.right, bottom: inspectorRect.bottom, clientWidth: inspector.clientWidth, scrollWidth: inspector.scrollWidth } : null,
      body: body ? { clientWidth: body.clientWidth, scrollWidth: body.scrollWidth, clientHeight: body.clientHeight, scrollHeight: body.scrollHeight, scrollTop: body.scrollTop } : null,
      closeButtonVisible: closeButton ? Boolean(visibleRect(closeButton)) : null,
      visibleControlCount: controls.length, outside, invisible, overlaps,
    };
  })()`);
  layouts.push({ label, ...evidence });
  await writeFile(join(output, "网站入口与AI接入布局过程.json"), JSON.stringify(layouts, null, 2));
  assert.ok(evidence.document.scrollWidth <= evidence.document.clientWidth + 2, `${label}文档横向溢出。`);
  assert.ok(evidence.workspace.scrollWidth <= evidence.workspace.clientWidth + 2, `${label}工作区横向溢出。`);
  assert.deepEqual(evidence.outside, [], `${label}控件超出窗口横向范围。`);
  assert.deepEqual(evidence.invisible, [], `${label}可用控件不可见。`);
  assert.deepEqual(evidence.overlaps, [], `${label}控件发生重叠。`);
  if (evidence.inspector) {
    assert.ok(evidence.inspector.left >= -2 && evidence.inspector.right <= evidence.viewport.width + 2);
    assert.ok(evidence.inspector.top >= -2 && evidence.inspector.bottom <= evidence.viewport.height + 2);
    assert.ok(evidence.body.scrollWidth <= evidence.body.clientWidth + 2, `${label}详情正文横向溢出。`);
    assert.ok(evidence.body.clientHeight > 80, `${label}详情正文需要可用阅读高度。`);
    assert.equal(evidence.closeButtonVisible, true, `${label}关闭按钮必须持续可见。`);
  }
}

function integrationFixture() {
  const configRoot = join(profile, "仅用于界面布局的外部工具配置路径", "课程学习与桌宠共创项目资料", "不会被真实读取或写入");
  const details = "隔离验收夹具：仅模拟配置状态，未读取或修改真实外部 AI 工具。";
  const common = { label: "待配置（验收夹具）", details, canInstall: true, canReplace: false, canRemove: false };
  const command = "npx --yes @open-pets/mcp --pet builtin";
  return {
    commandMode: "published", localDevAvailable: false, busy: integrationBusy,
    ...(integrationEventFixture ? {
      sessionStates: { claude: { state: "observed", details: "仅用于界面的正式事件状态夹具。", lastActivityAt: Date.now() } },
      externalIntegrations: [{ id: "doubao", name: "豆包", state: "needs_setup", label: "PC／网页监测未支持",
        description: "豆包 PC／网页的工作状态监测。", details: "当前没有客户端事件接口。", canInstall: false, canRemove: false, canTest: false,
        installLabel: "客户端暂不支持", instructions: [], preview: "{}", docsUrl: "https://example.invalid/",
        program: { detected: null, label: "客户端事件接口待支持", details: "仅用于界面的未支持状态夹具。" },
        session: { state: "unconfirmed", details: "方舟开发桥不能代替 PC／网页监测。" },
      }],
    } : {}),
    petOptions: [{ id: "builtin", displayName: "隔离验收桌宠", default: true }],
    preview: { displayCommand: command, mcpJson: { mcpServers: { openpets: { command: "npx", args: ["--yes", "@open-pets/mcp", "--pet", "builtin"] } } } },
    status: { ...common, state: "configured", label: "已配置（验收夹具）", mcpListWorks: true, openPetsEntry: { present: true, verified: true, matchesExpected: true }, canConfigure: false, canReplace: true, canRemove: true },
    hookStatus: { status: "installed", settingsPath: join(configRoot, ".claude", "settings.json"), exists: true, valid: true, message: details, preview: { hooks: {} }, asyncSupported: true },
    memoryStatus: { state: "needs_setup", ...common, claudeMdPath: join(configRoot, ".claude", "CLAUDE.md"), openPetsMemoryPath: join(configRoot, ".claude", "openpets.md") },
    opencodeStatus: { state: "needs_setup", ...common, configDir: join(configRoot, "opencode") },
    opencodePreview: { global: true, configDir: join(configRoot, "opencode"), configPath: join(configRoot, "opencode", "opencode.json"), cleanupConfigPaths: [], mcpCommand: ["npx", "--yes", "@open-pets/mcp"], plugin: ["@open-pets/opencode"], instructionPath: join(configRoot, "opencode", "instructions.md"), configPreview: { mcp: { openpets: { command } } } },
    cursorStatus: { ...common, state: "needs_update", label: "待更新（验收夹具）", configPath: join(configRoot, ".cursor", "mcp.json"), canInstall: false, canReplace: true, canRemove: true },
    cursorPreview: { global: true, configPath: join(configRoot, ".cursor", "mcp.json"), mcpEntry: { command: "npx", args: ["--yes", "@open-pets/mcp"] }, rulesPath: join(configRoot, ".cursor", "rules", "openpets.mdc"), rulesContent: "# 隔离验收规则\n通过本机桌宠反映工作状态。", commandMode: "published" },
    openclawStatus: { ...common, state: "installed-enabled", label: "已启用（验收夹具）", version: "2026.10.1", installedVersion: "3.9.0", trackedSource: "official-package", canInstall: false, canUpdate: true, canEnable: false, canRemove: true },
    openclawPreview: { command: "openclaw", install: ["plugins", "install", "@open-pets/openclaw"], enable: ["plugins", "enable", "openpets"], update: ["plugins", "update", "openpets"], remove: ["plugins", "uninstall", "openpets"], targetVersion: "4.0.1" },
    zedStatus: { state: "needs_setup", ...common, settingsPath: join(configRoot, "zed", "settings.json") },
    zedPreview: { global: true, settingsPath: join(configRoot, "zed", "settings.json"), mcpEntry: { command: "npx", args: ["--yes", "@open-pets/mcp"] }, commandMode: "published" },
    commandPaths: { claude: join(configRoot, "命令工具", "claude.exe"), node: join(configRoot, "命令工具", "node.exe"), opencode: "opencode", openclaw: join(configRoot, "命令工具", "openclaw.exe") },
  };
}

async function checkCommunitySection(section, scope = '[aria-label="共创网站入口"]') {
  const before = communityCalls.length;
  await evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(scope)});
    const button = root?.querySelector('[data-community-section=' + ${JSON.stringify(section)} + ']');
    if (!button || button.disabled) throw Error('网站入口缺失或不可用');
    button.focus(); button.click();
  })()`);
  await until(() => communityCalls.length === before + 1, `网站 ${section}入口 IPC`);
  assert.equal(communityCalls.at(-1), section);
  await until(() => evaluate(`!document.querySelector(${JSON.stringify(scope)})?.querySelector('[data-community-section=' + ${JSON.stringify(section)} + ']')?.disabled`), "网站入口恢复可用");
}

async function openIntegration(id, label) {
  await evaluate(`(() => {
    const card = [...document.querySelectorAll('.integration-setup-card')].find(element => element.querySelector('.integration-card-heading strong')?.textContent.trim() === ${JSON.stringify(label)});
    const button = card && [...card.querySelectorAll('button')].find(element => element.textContent.trim() === ${JSON.stringify(id === "pi" ? "查看设置" : "配置")});
    if (!button || button.disabled) throw Error('外部 AI 详情入口缺失');
    button.focus(); button.click();
  })()`);
  await until(() => evaluate(`Boolean(document.querySelector('#integration-detail-title-' + ${JSON.stringify(id)}))`), `${label}详情加载`);
}

async function readIntegrationEntrances() {
  return evaluate(`(() => {
    return [...document.querySelectorAll('.integration-setup-card')].map(card => ({
      name: card.querySelector('.integration-card-heading strong')?.textContent.trim(),
      buttons: [...card.querySelectorAll('button')].map(button => ({
        label: button.textContent.trim(), disabled: button.disabled,
      })),
    })).filter(card => card.buttons.some(button => !button.disabled && ['配置','查看设置'].includes(button.label)));
  })()`);
}

async function checkIntegrationReadiness() {
  const { updateAgentSetupCommandPaths } = await import(pathToFileURL(join(compiledRoot, "agent-setup.js")).href);
  const codexPath = process.execPath;
  assert.equal(updateAgentSetupCommandPaths({ codex: codexPath }).codex, codexPath);
  assert.equal(JSON.parse(readFileSync(join(profile, "openpets-state.json"), "utf8")).preferences.codexCommandPath, codexPath);
  assert.throws(() => updateAgentSetupCommandPaths({ codex: 7 }));
  assert.throws(() => updateAgentSetupCommandPaths({ unknown: codexPath }));
  assert.equal(JSON.parse(readFileSync(join(profile, "openpets-state.json"), "utf8")).preferences.codexCommandPath, codexPath);
  assert.equal(updateAgentSetupCommandPaths({ codex: "" }).codex, "");

  integrationBusy = true;
  await route("assistant");
  await click("外部 AI 接入");
  await until(() => evaluate("document.querySelector('.integration-notice')?.textContent.includes('正在处理接入配置')"), "正在处理另一接入操作");
  assert.equal(await evaluate("[...document.querySelectorAll('.integration-catalog .btn-primary')].every(button => button.disabled)"), true);
  integrationBusy = false;
  await until(() => evaluate("[...document.querySelectorAll('.integration-catalog .btn-primary')].every(button => !button.disabled)"), "后端忙碌解除后安装按钮自动恢复");
  assert.equal(await evaluate("Boolean(document.querySelector('.integration-notice'))"), false);
  await route("pets");
  integrationBusy = true;
  await route("assistant");
  await click("外部 AI 接入");
  await until(() => evaluate("document.querySelector('.integration-notice')?.textContent.includes('正在处理接入配置')"), "离页前仍在处理另一接入操作");
  await route("pets");
  const stoppedReads = integrationSnapshotReads;
  await pause(1200);
  assert.equal(integrationSnapshotReads, stoppedReads, "离开接入页后不继续读取快照。");
  integrationBusy = false;
}

async function checkIntegrationEventPresentation() {
  integrationEventFixture = true;
  await route("assistant");
  await click("外部 AI 接入");
  await until(() => evaluate("[...document.querySelectorAll('.integration-setup-card')].some(card => card.textContent.includes('PC／网页监测未支持'))"), "豆包客户端未支持状态");
  const cards = await evaluate(`[...document.querySelectorAll('.integration-setup-card')].map(card => ({
    name: card.querySelector('.integration-card-heading strong')?.textContent.trim(), text: card.textContent,
    primaryDisabled: card.querySelector('.btn-primary')?.disabled,
  }))`);
  assert.match(cards.find(card => card.name === "Claude Code").text, /已收到会话工作事件/);
  assert.match(cards.find(card => card.name === "OpenCode").text, /会话工作事件待确认/);
  assert.match(cards.find(card => card.name === "豆包").text, /PC.*网页监测未支持/);
  assert.equal(cards.find(card => card.name === "豆包").primaryDisabled, true);
  await openIntegration("doubao", "豆包");
  assert.match(await evaluate("document.querySelector('.integration-inspector-body').textContent"), /方舟开发桥不能代替/);
  await click("关闭", ".integration-inspector-head");
  await route("pets");
  integrationEventFixture = false;
}

async function auditInspector(label, captureScrolledParts = false) {
  await evaluate("document.querySelectorAll('.integration-inspector-body details').forEach(element => { element.open = true; });");
  const bounds = await evaluate("(() => { const body = document.querySelector('.integration-inspector-body'); return { clientHeight: body.clientHeight, scrollHeight: body.scrollHeight }; })()");
  const steps = Math.min(12, Math.max(1, Math.ceil(bounds.scrollHeight / bounds.clientHeight)));
  for (let step = 0; step < steps; step += 1) {
    await evaluate(`document.querySelector('.integration-inspector-body').scrollTop = ${step * bounds.clientHeight}`);
    await pause(70);
    await auditLayout(`${label}正文 ${step + 1}`);
  }
  if (captureScrolledParts) {
    const integrationName = await evaluate("document.querySelector('.integration-dialog h2').textContent.trim()");
    const maximumScroll = Math.max(0, bounds.scrollHeight - bounds.clientHeight);
    for (const [part, targetScroll] of [["中段", Math.round(maximumScroll / 2)], ["底部", maximumScroll]]) {
      await evaluate(`document.querySelector('.integration-inspector-body').scrollTop = ${targetScroll}`);
      await until(() => evaluate(`Math.abs(document.querySelector('.integration-inspector-body').scrollTop - ${targetScroll}) <= 2`), `${label}${part}实际滚动位置`);
      await auditLayout(`${label}${part}`);
      await capture(`${label}-${part}.png`);
      trace(`${label}${part} requestedScrollTop=${targetScroll} actualScrollTop=${captures.at(-1).inspectorScrollTop}`);
      if (part === "底部" && integrationName === "Pi") {
        assert.ok(captures.at(-1).inspectorVisibleContent.some(element => element.tag === "CODE" && element.text === "/openpets say <message>"), "Pi 底部截图必须覆盖最后一条会话命令。");
      }
    }
    const managementSection = await evaluate(`(() => {
      const actions = document.querySelector('.integration-inspector-body .integration-management-actions');
      if (!actions) return false;
      actions.closest('.integration-section').scrollIntoView({ block: 'center', behavior: 'instant' });
      return true;
    })()`);
    if (managementSection) {
      await auditLayout(`${label}管理操作`);
      await capture(`${label}-管理操作.png`);
      trace(`${label}管理操作 actualScrollTop=${captures.at(-1).inspectorScrollTop}`);
      const visibleButtons = captures.at(-1).inspectorVisibleContent.filter(element => element.tag === "BUTTON").map(element => element.text);
      const requiredButtons = integrationName === "OpenClaw" ? ["更新插件", "移除插件"] : ["替换 MCP", "移除 MCP"];
      for (const text of requiredButtons) assert.ok(visibleButtons.includes(text), `${integrationName}管理操作截图需要显示${text}。`);
    }
    if (["Claude Code", "Cursor"].includes(integrationName)) {
      await evaluate("document.querySelector('.integration-inspector-body .integration-code-preview').scrollIntoView({ block: 'center', behavior: 'instant' });");
      await auditLayout(`${label}JSON预览`);
      await capture(`${label}-JSON预览.png`);
      assert.ok(captures.at(-1).inspectorVisibleContent.some(element => element.tag === "PRE"), `${integrationName}截图必须覆盖真实 JSON 预览。`);
      trace(`${label}JSON预览 actualScrollTop=${captures.at(-1).inspectorScrollTop}`);
    }
  }
  await evaluate("document.querySelector('.integration-inspector-body').scrollTop = 0;");
  await capture(`${label}.png`);
  await click("关闭", ".integration-inspector-head");
  await until(() => evaluate("!document.querySelector('.integration-dialog')"), "关闭接入详情");
}

async function run() {
  assert.notEqual(profile, output);
  reserve(profile, "隔离档案");
  reserve(output, "验收输出");
  outputReserved = true;
  trace("建立全新隔离档案与输出目录");
  process.env.OPENPETS_DISABLE_PLUGIN_CATALOG = "1";
  process.env.OPENPETS_DISCOVERY_FILE = join(profile, "runtime", "ipc.json");
  process.env.OPENPETS_DEV_ROUTE = "pets";
  writeFileSync(join(profile, "openpets-state.json"), JSON.stringify({ version: 1, preferences: { locale: "zh-Hans", appearanceTheme: "light", openDefaultPetOnLaunch: false, onboardingCompleted: true, petToggleShortcut: "" } }), { flag: "wx" });

  const blockedChannels = new Set([
    "openpets:get-catalog", "openpets:get-catalog-page", "openpets:get-catalog-search", "openpets:get-codex-pets",
    "openpets:install-pet", "openpets:choose-pet-spritesheet", "openpets:create-pet", "openpets:export-pet-package", "openpets:companion-create-plugin-package",
    "openpets:agent-setup-action", "openpets:agent-setup-command-paths",
  ]);
  const register = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = (channel, handler) => {
    if (channel === "openpets:studio-community-website") {
      register(channel, (_event, section) => {
        assert.ok(["pets", "plugins", "create"].includes(section));
        communityCalls.push(section);
      });
    } else if (channel === "openpets:agent-setup-snapshot") {
      register(channel, () => {
        integrationSnapshotReads += 1;
        return integrationFixture();
      });
    } else if (blockedChannels.has(channel)) {
      register(channel, () => {
        prohibitedCalls.push(channel);
        throw new Error("本轮验收不允许本地制作、远程目录下载或修改外部 AI 配置。");
      });
    } else {
      register(channel, handler);
    }
  };
  const blockMain = () => {
    blockedMainHttp += 1;
    throw new Error("网站入口隔离验收阻止外部 HTTP。");
  };
  globalThis.fetch = async () => blockMain();
  http.request = http.get = https.request = https.get = blockMain;
  syncBuiltinESMExports();
  const blockRenderer = target => target.webRequest.onBeforeRequest({ urls: ["http://*/*", "https://*/*"] }, (_details, callback) => {
    blockedRendererHttp += 1;
    callback({ cancel: true });
  });
  app.on("browser-window-created", (_event, window) => {
    const loadFile = window.loadFile.bind(window);
    window.loadFile = (file, options) => loadFile(file === join(app.getAppPath(), "dist", "renderer", "index.html")
      ? join(compiledRoot, "renderer", "index.html") : file, options);
    window.setFocusable(false);
    window.webContents.setBackgroundThrottling(false);
    window.show = () => window.hide();
    window.showInactive = () => window.hide();
    window.focus = () => {};
    blockRenderer(window.webContents.session);
    window.webContents.on("console-message", (...args) => {
      const detail = args.find(value => value && typeof value === "object" && typeof value.message === "string");
      const level = detail?.level ?? args[1];
      if (level === 3 || level === "error") consoleErrors.push(detail?.message ?? args[2]);
    });
    window.webContents.on("render-process-gone", (_goneEvent, details) => rendererFailures.push(details));
  });
  const networkReady = app.whenReady().then(() => blockRenderer(session.defaultSession));
  dialog.showOpenDialog = async () => { throw new Error("本轮验收不调用原生文件选择。"); };
  dialog.showMessageBox = async () => { throw new Error("本轮验收不允许未经安排的原生确认。"); };
  shell.openExternal = async () => { throw new Error("本轮网站入口只核对 IPC 参数，不实际打开浏览器。"); };
  const bootDeadline = setTimeout(() => {
    writeFileSync(join(output, "网站入口与AI接入窗口验收失败.txt"), "真实应用启动超过 45 秒。", { flag: "wx" });
    app.exit(1);
  }, 45_000);
  await import(pathToFileURL(join(compiledRoot, "personal-bootstrap.js")).href);
  clearTimeout(bootDeadline);
  await networkReady;
  assert.equal(resolve(app.getPath("userData")), resolve(profile));
  await until(() => {
    try { return readFileSync(join(profile, "logs", "openpets.log"), "utf8").includes("桌宠工作室启动完成"); }
    catch (failure) {
      if (failure.code === "ENOENT") return false;
      throw failure;
    }
  }, "主进程初始化完成");
  const windows = await import(pathToFileURL(join(compiledRoot, "windows.js")).href);
  activeWindow = windows.getControlCenterWindow();
  assert.ok(activeWindow);
  activeWindow.hide();
  await until(() => evaluate("document.querySelectorAll('.studio-sidebar [data-route]').length === 6 && Boolean(document.querySelector('.pet-card'))"), "本机工作室加载");
  await evaluate("window.__communityUiErrors = []; window.addEventListener('error',event => window.__communityUiErrors.push(event.message)); window.addEventListener('unhandledrejection',event => window.__communityUiErrors.push(String(event.reason)));");
  assert.deepEqual(await evaluate("[...document.querySelectorAll('.studio-sidebar [data-route]')].map(button => button.getAttribute('data-route')).sort()"), [...routes].sort());
  await checkIntegrationReadiness();
  await checkIntegrationEventPresentation();
  if (process.env.DESKTOP_PET_SMOKE_INTEGRATION_ONLY === "1") {
    await writeFile(join(output, "AI接入就绪回归验收.json"), JSON.stringify({
      status: "通过", isolatedProfile: true, actualRendererAndIpc: true,
      codexPathSavedAndCleared: true, invalidPathPatchPreservesSettings: true,
      busySnapshotRecoversAutomatically: true, snapshotReadsStopAfterLeaving: true,
      officialEventPresentationSeparatedFromConfiguration: true, doubaoPcUnsupportedDisabled: true,
      externalAiConfigurationWritten: false, integrationSnapshotReads,
    }, null, 2), { flag: "wx" });
    console.log("AI 接入就绪回归通过：Codex 路径保存与清除、忙碌自动恢复、离页停止读取。");
    app.exit(0);
    return;
  }
  const productionMinimum = activeWindow.getMinimumSize();
  activeWindow.setSize(...productionMinimum);
  await pause(200);
  const minimumViewport = await evaluate("({ width: innerWidth, height: innerHeight })");
  if (!sizes.some(([width, height]) => width === minimumViewport.width && height === minimumViewport.height)) sizes.push([minimumViewport.width, minimumViewport.height]);

  for (const [width, height] of sizes) {
    activeWindow.setContentSize(width, height);
    await until(() => evaluate(`innerWidth === ${width} && innerHeight === ${height}`), "实际内容尺寸");
    for (const name of routes) {
      await route(name);
      await auditLayout(`${width}×${height} ${name}`);
      if (["pets", "gallery", "plugins"].includes(name)) await capture(`${width}x${height}-${name}.png`);
    }
  }

  await route("pets");
  const petButtons = await evaluate("[...document.querySelectorAll('.studio-workspace button')].map(button => button.textContent.trim())");
  for (const label of ["显示桌宠", "隐藏桌宠", "导入 ZIP 或文件夹", "前往共创网站", "查看来源与动作"]) assert.ok(petButtons.includes(label));
  for (const label of ["用图集制作桌宠", "导出共创包", "安装 OpenPets 素材", "上一页", "下一页"]) assert.equal(petButtons.includes(label), false);
  await checkCommunitySection("pets", '[aria-label="我的桌宠"]');
  await click("查看来源与动作", ".pet-card");
  await until(() => evaluate("document.querySelectorAll('[aria-label=\"桌宠动作预览\"] figure').length === 4"), "本机来源与四动作预览");
  assert.equal(await evaluate("Boolean(document.querySelector('[role=\"dialog\"]'))"), false);
  assert.equal((await evaluate("[...document.querySelectorAll('.studio-workspace button')].map(button => button.textContent.trim())")).includes("导出共创包"), false);
  await route("gallery");
  assert.equal(await evaluate("Boolean(document.querySelector('.pet-gallery'))"), false, "本机网站入口不复制远程画廊。");
  for (const section of ["pets", "plugins", "create"]) await checkCommunitySection(section);
  await route("plugins");
  await click("共创网站", '[aria-labelledby="studio-plugins-title"]');
  await until(() => evaluate("Boolean(document.querySelector('[aria-label=\"共创网站入口\"]'))"), "插件网站入口");
  assert.equal(await evaluate("Boolean(document.querySelector('[aria-labelledby=\"plugin-authoring-title\"]'))"), false);
  for (const section of ["plugins", "pets", "create"]) await checkCommunitySection(section);
  await click("已安装", '[aria-labelledby="studio-plugins-title"]');
  const localPluginButtons = await evaluate("[...document.querySelectorAll('.studio-workspace button')].map(button => button.textContent.trim())");
  assert.ok(localPluginButtons.includes("导入插件文件夹"));
  assert.ok(localPluginButtons.includes("配置与动作"));
  assert.equal(localPluginButtons.includes("保存共创插件文件夹"), false);
  assert.deepEqual(communityCalls, ["pets", "pets", "plugins", "create", "plugins", "pets", "create"]);

  const integrationSizes = sizes.filter(([width]) => width <= 980);
  for (const [width, height] of integrationSizes) {
    activeWindow.setContentSize(width, height);
    await until(() => evaluate(`innerWidth === ${width} && innerHeight === ${height}`), "接入页面内容尺寸");
    await route("assistant");
    await click("外部 AI 接入");
    await until(async () => {
      const entrances = await readIntegrationEntrances();
      const names = entrances.map(entrance => entrance.name).sort();
      const expectedNames = [...supportedIntegrationNames].sort();
      return names.length === expectedNames.length && names.every((name, index) => name === expectedNames[index]);
    }, "六种可操作的接入详情入口");
    const entrances = await readIntegrationEntrances();
    assert.deepEqual(entrances.map(entrance => entrance.name).sort(), [...supportedIntegrationNames].sort());
    integrationEntrances.push({ width, height, entrances });
    await writeFile(join(output, "外部AI实际详情入口.json"), JSON.stringify(integrationEntrances, null, 2));
    await auditLayout(`${width}×${height} 外部AI列表`);
    await capture(`${width}x${height}-外部AI列表.png`);
    for (const [id, label] of [["pi", "Pi"], ["claude", "Claude Code"], ["cursor", "Cursor"], ["openclaw", "OpenClaw"]]) {
      await openIntegration(id, label);
      await auditInspector(`${width}x${height}-${label}`, width === minimumViewport.width && height === minimumViewport.height);
      trace(`${width}×${height} ${label} 详情检查完成`);
    }
  }
  assert.deepEqual(prohibitedCalls, []);
  const clientErrors = await evaluate("window.__communityUiErrors");
  const unexpectedErrors = consoleErrors.filter(message => !String(message).includes("ERR_BLOCKED_BY_CLIENT") && !String(message).includes("隔离验收阻止"));
  assert.deepEqual(clientErrors, []);
  assert.deepEqual(unexpectedErrors, []);
  assert.deepEqual(rendererFailures, []);
  await writeFile(join(output, "网站入口与AI接入窗口验收.json"), JSON.stringify({
    status: "通过", profile, output, routes, sizes, productionMinimum, minimumViewport,
    communityCalls, prohibitedCalls, integrationSnapshotReads, integrationEntrances,
    localPetManagementPreserved: true, localPetCreationAndRemoteCatalogRemoved: true,
    localPluginsManagementPreserved: true, pluginCreationMovedToWebsite: true,
    actualRendererAndIpc: true, actualWindowContentSizesVerified: true,
    hiddenWindow: true, nativeFocusSuppressed: true,
    boundaries: "使用全新隔离档案和真实 Electron 页面、preload 与 IPC；网站打开频道只捕获 section，未启动网站服务器或浏览器。外部 AI 状态与长路径使用明确标注的受控夹具，不读取或修改真实 AI 配置，所有安装动作被阻止。本轮不验证网站下载或共创流程，也不验证真实 AI 连通性。",
    network: { blockedMainHttp, blockedRendererHttp }, captures, layouts,
    consoleErrors, unexpectedErrors, clientErrors, rendererFailures,
  }, null, 2), { flag: "wx" });
  console.log(`网站入口与 AI 接入验收通过：${captures.length} 张真实截图，${layouts.length} 次布局检查。`);
  app.exit(0);
}

run().catch(async (failure) => {
  console.error("网站入口与 AI 接入窗口验收失败", failure);
  if (outputReserved) {
    await writeFile(join(output, "网站入口与AI接入窗口验收失败.txt"), String(failure.stack ?? failure), { flag: "wx" }).catch(() => undefined);
    if (activeWindow && !activeWindow.isDestroyed()) {
      await evaluate(`({
        route: document.querySelector('.studio-sidebar [aria-current="page"]')?.getAttribute('data-route'),
        viewport: { width: innerWidth, height: innerHeight },
        workspaceText: document.querySelector('.studio-workspace')?.innerText.slice(0, 20000),
        integrationCards: [...document.querySelectorAll('.integration-setup-card')].map(card => ({
          name: card.querySelector('.integration-card-heading strong')?.textContent.trim(),
          className: card.className,
          buttons: [...card.querySelectorAll('button')].map(button => ({ label: button.textContent.trim(), ariaLabel: button.getAttribute('aria-label'), disabled: button.disabled })),
        })),
        dialog: document.querySelector('.integration-dialog')?.getAttribute('aria-labelledby'),
      })`).then(evidence => writeFile(join(output, "网站入口与AI接入失败DOM.json"), JSON.stringify(evidence, null, 2), { flag: "wx" })).catch(() => undefined);
      await warmFrame().catch(() => undefined);
      await activeWindow.webContents.capturePage(undefined, { stayHidden: true, stayAwake: true })
        .then(pixels => writeFile(join(output, "网站入口与AI接入窗口验收失败.png"), pixels.toPNG(), { flag: "wx" }))
        .catch(() => undefined);
    }
  }
  app.exit(1);
});
