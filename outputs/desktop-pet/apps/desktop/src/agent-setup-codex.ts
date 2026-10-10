import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { pathToFileURL } from "node:url";

export interface CodexSetupDependencies {
  readonly codexDir: string;
  readonly nodeCommand: string;
  readonly clientEntryPath: string;
  readonly discoveryPath: string;
  readonly detected: boolean;
  readonly version?: string;
  readonly platform?: NodeJS.Platform;
  readonly formatUserPath: (path: string | undefined) => string | undefined;
}

export interface CodexSetupStatus {
  readonly state: "configured" | "needs_setup" | "not_detected" | "needs_update" | "error";
  readonly label: string;
  readonly details: string;
  readonly configPath: string;
  readonly canInstall: boolean;
  readonly canRemove: boolean;
  readonly canTest: boolean;
  readonly trust: "requires_review";
}

export interface CodexSetupPreview {
  readonly global: true;
  readonly configPath: string;
  readonly scriptPath: string;
  readonly events: readonly string[];
  readonly command: string;
  readonly commandWindows: string;
  readonly instructions: string;
  readonly documentationUrl: string;
}

export interface CodexSetupActionResult {
  readonly ok: boolean;
  readonly action: "codex-install" | "codex-remove" | "codex-test";
  readonly message: string;
  readonly changed: boolean;
}

const ownedArgument = "--desktop-pet-codex-managed";
const scriptHeader = "// desktop-pet-codex-hook-v1\n";
const hookEvents = ["SessionStart", "UserPromptSubmit", "PreToolUse", "PermissionRequest", "PostToolUse", "Stop", "Interrupt", "SessionEnd"] as const;
const hookInstructions = "安装后，在 Codex 的 /hooks（桌面端的 Hooks 设置）审阅并信任 desktop pet 命令，重新开始会话。需使用支持生命周期 hooks 的新版 Codex；旧版、关闭 hooks 或仅允许管理员 hooks 时不会收到事件。此接入适用于本地 Codex 会话，云端编排不支持本地命令 hooks。链路测试不会调用模型，也不会代替 Codex 的信任审阅。";

interface ConfigRead {
  readonly raw: string | null;
  readonly value: Record<string, unknown>;
}

export function getCodexSetup(dependencies: CodexSetupDependencies): { readonly status: CodexSetupStatus; readonly preview: CodexSetupPreview } {
  const configPath = join(dependencies.codexDir, "hooks.json");
  const scriptPath = getScriptPath(dependencies);
  const commands = buildHookCommands(dependencies);
  const preview: CodexSetupPreview = {
    global: true,
    configPath: displayPath(configPath, dependencies),
    scriptPath: displayPath(scriptPath, dependencies),
    events: hookEvents,
    ...commands,
    instructions: hookInstructions,
    documentationUrl: "https://learn.chatgpt.com/docs/hooks",
  };
  try {
    validateDependencies(dependencies);
    const current = readConfig(configPath);
    const expected = createInstalledConfig(current.value, dependencies);
    const ownScript = readOwnedScript(scriptPath);
    const hasHooks = hasOwnedHooks(current.value, scriptPath);
    const complete = hasHooks && ownScript === buildCodexHookScript(dependencies)
      && JSON.stringify(expected) === JSON.stringify(current.value);
    const state = complete ? "configured" : hasHooks || ownScript !== null ? "needs_update"
      : dependencies.detected ? "needs_setup" : "not_detected";
    return {
      status: {
        state,
        label: complete ? "已安装 · 信任待确认" : state === "needs_update" ? "需要更新"
          : dependencies.detected ? "待接入" : "未检测到",
        details: complete ? "桌宠生命周期 hooks 已安装；Codex 是否已信任无法从此处确认。" + hookInstructions
          : "通过 Codex 官方生命周期 hooks 联动桌宠动作。" + hookInstructions,
        configPath: preview.configPath,
        canInstall: !complete,
        canRemove: hasHooks || ownScript !== null,
        canTest: complete,
        trust: "requires_review",
      },
      preview,
    };
  } catch (error) {
    return {
      status: { state: "error", label: "配置需检查", details: errorMessage(error), configPath: preview.configPath,
        canInstall: false, canRemove: false, canTest: false, trust: "requires_review" },
      preview,
    };
  }
}

export function installCodexHooks(dependencies: CodexSetupDependencies): CodexSetupActionResult {
  try {
    validateDependencies(dependencies);
    const configPath = join(dependencies.codexDir, "hooks.json");
    const current = readConfig(configPath);
    const scriptPath = getScriptPath(dependencies);
    const oldScript = readOwnedScript(scriptPath);
    const nextScript = buildCodexHookScript(dependencies);
    const nextConfig = createInstalledConfig(current.value, dependencies);
    const configChanged = JSON.stringify(nextConfig) !== JSON.stringify(current.value);
    const scriptChanged = oldScript !== nextScript;
    if (!configChanged && !scriptChanged) {
      return { ok: true, action: "codex-install", message: "Codex 桌宠 hooks 已安装。" + hookInstructions, changed: false };
    }
    const backupPaths: string[] = [];
    if (scriptChanged) {
      const backup = writeWithBackup(scriptPath, oldScript, nextScript);
      if (backup) backupPaths.push(displayPath(backup, dependencies));
    }
    if (configChanged) {
      const backup = writeWithBackup(configPath, current.raw, JSON.stringify(nextConfig, null, 2) + "\n");
      if (backup) backupPaths.push(displayPath(backup, dependencies));
    }
    return { ok: true, action: "codex-install", message: "已安装 Codex 桌宠 hooks；原有 hooks 和其他设置已保留。"
      + (backupPaths.length ? "备份：" + backupPaths.join("；") + "。" : "") + hookInstructions, changed: true };
  } catch (error) {
    return { ok: false, action: "codex-install", message: errorMessage(error), changed: false };
  }
}

export function removeCodexHooks(dependencies: CodexSetupDependencies): CodexSetupActionResult {
  try {
    const configPath = join(dependencies.codexDir, "hooks.json");
    const scriptPath = getScriptPath(dependencies);
    const current = readConfig(configPath);
    const oldScript = readOwnedScript(scriptPath);
    const next = removeOwnedHooks(current.value, scriptPath);
    const changed = JSON.stringify(next) !== JSON.stringify(current.value) || oldScript !== null;
    const backupPaths: string[] = [];
    if (JSON.stringify(next) !== JSON.stringify(current.value)) {
      const backup = writeWithBackup(configPath, current.raw, JSON.stringify(next, null, 2) + "\n");
      if (backup) backupPaths.push(displayPath(backup, dependencies));
    }
    if (oldScript !== null) {
      const backup = backupFile(scriptPath, oldScript);
      backupPaths.push(displayPath(backup, dependencies));
      unlinkSync(scriptPath);
      // 只移除空的自有目录；备份和用户添加的文件始终保留。
      try { rmdirSync(dirname(scriptPath)); } catch (error) {
        if (!isNodeError(error) || !["ENOTEMPTY", "EEXIST"].includes(error.code ?? "")) throw error;
      }
    }
    return { ok: true, action: "codex-remove", message: changed ? "已移除本项目的 Codex hooks，其他 hooks 保留。"
      + (backupPaths.length ? "备份：" + backupPaths.join("；") : "") : "没有本项目的 Codex hooks 可移除。", changed };
  } catch (error) {
    return { ok: false, action: "codex-remove", message: errorMessage(error), changed: false };
  }
}

export async function testCodexHooks(dependencies: CodexSetupDependencies): Promise<CodexSetupActionResult> {
  if (!getCodexSetup(dependencies).status.canTest) {
    return { ok: false, action: "codex-test", message: "请先安装或更新 Codex 桌宠 hooks。", changed: false };
  }
  const result = await runScriptTest(dependencies);
  return { ok: result, action: "codex-test", message: result
    ? "本机桌宠链路已连通；未调用模型。仍需在 Codex 审阅信任 hooks，并通过新会话确认真实事件。"
    : "本机桌宠链路未连通。请确认桌宠已启动、Node.js 可运行，并重新安装 hooks 以更新程序路径。", changed: false };
}

export function buildCodexHookScript(dependencies: Pick<CodexSetupDependencies, "clientEntryPath" | "discoveryPath">): string {
  const helperPath = [new URL("../assets/agent-hooks/external-ai-event.cjs", import.meta.url), new URL("../../assets/agent-hooks/external-ai-event.cjs", import.meta.url)]
    .find((path) => existsSync(path));
  if (!helperPath) throw new Error("外部 AI 事件桥接模块缺失，请更新 desktop pet。");
  const helper = readFileSync(helperPath, "utf8");
  return scriptHeader + `const clientModule = ${JSON.stringify(pathToFileURL(dependencies.clientEntryPath).href)};
const discoveryPath = ${JSON.stringify(dependencies.discoveryPath)};
const testMode = process.argv.includes("--desktop-pet-codex-test");
const deadline = setTimeout(() => process.exit(testMode ? 1 : 0), 1800);
let raw = "";
let inputBytes = 0;
try {
  const { createOpenPetsClient, readDiscoveryFile, sendRequest } = await import(clientModule);
  const client = createOpenPetsClient({ discoveryPath, remote: false, connectTimeoutMs: 500, responseTimeoutMs: 500 });
  if (testMode) {
    const status = await client.status();
    if (status.appRunning !== true) throw new Error("桌宠未启动");
    await client.react("waving");
    process.stdout.write(JSON.stringify({ ok: true, localOnly: true }) + "\\n");
  } else {
    const { createRequire } = await import("node:module");
    const createExternalAiEvent = (() => {
      const require = createRequire(import.meta.url);
      const module = { exports: {} };
      ${helper}
      return module.exports.createExternalAiEvent;
    })();
    for await (const chunk of process.stdin) {
      inputBytes += Buffer.byteLength(chunk);
      if (inputBytes > 65536) process.exit(0);
      raw += chunk.toString("utf8");
    }
    const payload = JSON.parse(raw || "{}");
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const event = payload.hook_event_name;
      const reactions = { SessionStart: "idle", UserPromptSubmit: "thinking", PreToolUse: "working",
        PermissionRequest: "waiting", PostToolUse: "thinking", Stop: "idle", Interrupt: "idle", SessionEnd: "idle" };
      let reaction = typeof event === "string" && Object.hasOwn(reactions, event) ? reactions[event] : undefined;
      if (event === "PreToolUse") {
        const tool = typeof payload.tool_name === "string" ? payload.tool_name : "";
        if (/^(apply_patch|Edit|Write)$/.test(tool)) reaction = "editing";
        else if (/^(Bash|exec_command|shell|shell_command)$/.test(tool)) reaction = "running";
      }
      const externalAi = createExternalAiEvent(payload, event, "codex");
      if (reaction && externalAi) await sendRequest(readDiscoveryFile(discoveryPath), "pet.react", { reaction, externalAi }, { connectTimeoutMs: 500, responseTimeoutMs: 500 });
      else if (reaction) await client.react(reaction);
    }
  }
} catch {
  // 生命周期回调失败时安静退出，不阻塞 Codex，也不把用户内容写入日志。
  if (testMode) process.exitCode = 1;
} finally {
  clearTimeout(deadline);
}
`;
}

function getScriptPath(dependencies: Pick<CodexSetupDependencies, "codexDir">): string {
  return join(dependencies.codexDir, "desktop-pet", "codex-hook.mjs");
}

function buildHookCommands(dependencies: CodexSetupDependencies): { readonly command: string; readonly commandWindows: string } {
  const args = [dependencies.nodeCommand, getScriptPath(dependencies), ownedArgument];
  return {
    command: args.map((value) => "'" + value.replaceAll("'", "'\\''") + "'").join(" "),
    // Codex 官方默认通过 COMSPEC /c 执行 Windows hooks，路径统一双引号包裹。
    commandWindows: args.map((value) => '"' + value + '"').join(" "),
  };
}

function createInstalledConfig(config: Record<string, unknown>, dependencies: CodexSetupDependencies): Record<string, unknown> {
  const cleaned = removeOwnedHooks(config, getScriptPath(dependencies));
  const hooks = isRecord(cleaned.hooks) ? { ...cleaned.hooks } : {};
  const commands = buildHookCommands(dependencies);
  for (const event of hookEvents) {
    const existing = Array.isArray(hooks[event]) ? hooks[event] : [];
    hooks[event] = [...existing, { hooks: [{ type: "command", ...commands, timeout: 3, statusMessage: "desktop pet 动作联动" }] }];
  }
  return { ...cleaned, hooks };
}

function removeOwnedHooks(config: Record<string, unknown>, scriptPath: string): Record<string, unknown> {
  if (!isRecord(config.hooks)) return { ...config };
  const hooks: Record<string, unknown> = {};
  for (const [event, groups] of Object.entries(config.hooks)) {
    const retained: unknown[] = [];
    for (const group of groups as Record<string, unknown>[]) {
      const handlers = group.hooks as unknown[];
      const next = handlers.filter((handler) => !isOwnedHandler(handler, scriptPath));
      if (next.length === handlers.length) retained.push(group);
      else if (next.length) retained.push({ ...group, hooks: next });
    }
    if (retained.length || (groups as unknown[]).length === 0) hooks[event] = retained;
  }
  const next = { ...config };
  if (Object.keys(hooks).length) next.hooks = hooks;
  else delete next.hooks;
  return next;
}

function hasOwnedHooks(config: Record<string, unknown>, scriptPath: string): boolean {
  if (!isRecord(config.hooks)) return false;
  return Object.values(config.hooks).some((groups) => (groups as Record<string, unknown>[])
    .some((group) => (group.hooks as unknown[]).some((handler) => isOwnedHandler(handler, scriptPath))));
}

function isOwnedHandler(handler: unknown, scriptPath: string): boolean {
  if (!isRecord(handler) || handler.type !== "command") return false;
  const commands = [handler.command, handler.commandWindows].filter((value): value is string => typeof value === "string");
  return commands.some((command) => command.includes(ownedArgument) && command.includes(scriptPath));
}

function readConfig(configPath: string): ConfigRead {
  const raw = readSafeFile(configPath, 262144);
  if (raw === null) return { raw, value: {} };
  const parsed: unknown = JSON.parse(raw.replace(/^\uFEFF/, ""));
  if (!isRecord(parsed) || parsed.hooks !== undefined && !isRecord(parsed.hooks)) throw new Error("Codex hooks.json 格式无效，未改动该文件。");
  if (isRecord(parsed.hooks)) {
    for (const groups of Object.values(parsed.hooks)) {
      if (!Array.isArray(groups) || groups.some((group) => !isRecord(group) || !Array.isArray(group.hooks))) {
        throw new Error("Codex hooks 的事件必须包含 hooks 数组，未改动该文件。");
      }
    }
  }
  return { raw, value: parsed };
}

function readOwnedScript(scriptPath: string): string | null {
  const raw = readSafeFile(scriptPath, 262144);
  if (raw !== null && !raw.startsWith(scriptHeader)) throw new Error("Codex 桌宠脚本路径已有其他文件，未覆盖该文件。");
  return raw;
}

function readSafeFile(path: string, maxBytes: number): string | null {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > maxBytes) throw new Error("Codex 配置或脚本不是普通文件，或超过大小限制；未改动。");
    return readFileSync(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return null;
    throw error;
  }
}

function writeWithBackup(path: string, expected: string | null, next: string): string | undefined {
  if (readSafeFile(path, 262144) !== expected) throw new Error("Codex 配置已被其他程序修改，请刷新后重试。");
  mkdirSync(dirname(path), { recursive: true });
  const backup = expected === null ? undefined : backupFile(path, expected);
  const temporary = path + "." + randomUUID() + ".tmp";
  try {
    writeFileSync(temporary, next, { encoding: "utf8", mode: 0o600, flag: "wx" });
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
  return backup;
}

function backupFile(path: string, raw: string): string {
  const backup = path + ".desktop-pet." + Date.now() + "." + randomUUID() + ".bak";
  writeFileSync(backup, raw, { encoding: "utf8", mode: 0o600, flag: "wx" });
  return backup;
}

function validateDependencies(dependencies: CodexSetupDependencies): void {
  for (const path of [dependencies.codexDir, dependencies.nodeCommand, dependencies.clientEntryPath, dependencies.discoveryPath]) {
    if (!isAbsolute(path) || /[\0\r\n"%]/.test(path)) throw new Error("Codex 接入需要有效的绝对 Node.js、脚本和桌宠链路路径，请检查设置。");
  }
  if (!existsSync(dependencies.nodeCommand) || !existsSync(dependencies.clientEntryPath)) throw new Error("找不到 Node.js 或本机桌宠接入程序，请检查 Node.js 设置。");
}

function runScriptTest(dependencies: CodexSetupDependencies): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(dependencies.nodeCommand, [getScriptPath(dependencies), "--desktop-pet-codex-test"], { shell: false, windowsHide: true });
    let output = "";
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => { child.kill(); finish(false); }, 3000);
    child.stdout?.on("data", (chunk: Buffer) => { output = (output + chunk.toString("utf8")).slice(0, 2048); });
    child.stderr?.resume();
    child.on("error", () => finish(false));
    child.on("close", (code) => {
      try {
        const result: unknown = JSON.parse(output);
        finish(code === 0 && isRecord(result) && result.ok === true && result.localOnly === true);
      } catch { finish(false); }
    });
  });
}

function displayPath(path: string, dependencies: CodexSetupDependencies): string {
  return dependencies.formatUserPath(path) ?? path;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Codex 接入操作失败。";
}
