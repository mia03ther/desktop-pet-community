import { randomUUID } from "node:crypto";
import { copyFileSync, constants, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

export interface ZCodeSetupDependencies {
  readonly homeDir: string;
  readonly detected: boolean;
  readonly nodeCommand: string;
  readonly hookScriptPath: string;
  readonly clientEntryPath: string;
  readonly discoveryPath: string;
  readonly mcpCommand: string;
  readonly mcpArgs: readonly string[];
  readonly formatUserPath?: (path: string | undefined) => string | undefined;
}

export interface ZCodeSetupStatus {
  readonly state: "configured" | "needs_setup" | "not_detected" | "conflict" | "error";
  readonly label: string;
  readonly details: string;
  readonly configPath: string;
  readonly canInstall: boolean;
  readonly canRemove: boolean;
}

export interface ZCodeSetupPreview {
  readonly configPath: string;
  readonly mcpEntry: Record<string, unknown>;
  readonly hooksPreview: Record<string, unknown>;
  readonly hookEvents: readonly string[];
}

export interface ZCodeSetupActionResult {
  readonly ok: boolean;
  readonly action: "zcode-install" | "zcode-remove";
  readonly message: string;
  readonly changed: boolean;
}

const marker = "desktop-pet-zcode-v1";
const serverName = "desktop-pet";
const hookEvents = ["SessionStart", "UserPromptSubmit", "PreToolUse", "PermissionRequest", "PostToolUse", "PostToolUseFailure", "Stop"] as const;

export function getZCodeSetup(dependencies: ZCodeSetupDependencies): { readonly status: ZCodeSetupStatus; readonly preview: ZCodeSetupPreview } {
  const configPath = getConfigPath(dependencies.homeDir);
  const displayPath = dependencies.formatUserPath?.(configPath) ?? configPath;
  const preview = buildPreview(dependencies, displayPath);
  try {
    const { config } = readConfig(configPath);
    const parts = getParts(config);
    const entry = parts.servers[serverName];
    const owned = isManagedMcp(entry);
    const hasHooks = hookEvents.every((event) => getEventGroups(parts.events, event).some((group) => matchesHook(group, createHookGroup(event, dependencies))));
    const hasAnyHooks = Object.values(parts.events).some((groups) => Array.isArray(groups) && groups.some(hasManagedHook));
    const disabled = parts.hooks.enabled === false;
    const conflict = (entry !== undefined && !owned) || disabled;
    const configured = owned && hasHooks && parts.hooks.enabled === true && sameEntry(entry, preview.mcpEntry[serverName]);
    return {
      status: {
        state: conflict ? "conflict" : configured ? "configured" : dependencies.detected ? "needs_setup" : "not_detected",
        label: conflict ? "需要处理" : configured ? "已配置" : dependencies.detected ? "待配置" : "未检测到",
        details: conflict
          ? disabled ? "ZCode 全局 Hooks 已停用。请先在 ZCode 中启用 Hooks，再安装桌宠联动。" : "ZCode 中已有同名 MCP，未覆盖你的配置。请在 ZCode 内处理后重试。"
          : configured ? "MCP 与生命周期 Hooks 已配置；新建 ZCode 会话后验证动作联动。" : "通过 ZCode 官方全局 MCP 与 Hooks 接入；安装后需要新建会话。",
        configPath: displayPath,
        canInstall: !conflict && !configured,
        canRemove: owned || hasAnyHooks,
      },
      preview,
    };
  } catch (error) {
    return {
      status: { state: "error", label: "配置错误", details: errorMessage(error), configPath: displayPath, canInstall: false, canRemove: false },
      preview,
    };
  }
}

export function installZCodeGlobal(dependencies: ZCodeSetupDependencies): ZCodeSetupActionResult {
  const action = "zcode-install";
  try {
    const current = getZCodeSetup(dependencies);
    if (!current.status.canInstall) {
      return { ok: current.status.state === "configured", action, message: current.status.details, changed: false };
    }
    for (const path of [dependencies.hookScriptPath, dependencies.clientEntryPath]) {
      if (!isAbsolute(path) || !existsSync(path)) throw new Error("桌宠联动脚本缺失，请更新 desktop pet 后重试。");
    }
    const configPath = getConfigPath(dependencies.homeDir);
    const { config, raw } = readConfig(configPath);
    const parts = getParts(config);
    if (parts.servers[serverName] !== undefined && !isManagedMcp(parts.servers[serverName])) throw new Error("ZCode 同名 MCP 配置已变化，未覆盖你的配置。");
    if (parts.hooks.enabled === false) throw new Error("ZCode 全局 Hooks 已停用，请先在 ZCode 中启用。");
    const preview = buildPreview(dependencies, configPath);
    parts.servers[serverName] = preview.mcpEntry[serverName];
    for (const event of hookEvents) {
      parts.events[event] = [
        ...removeManagedHooks(getEventGroups(parts.events, event)),
        createHookGroup(event, dependencies),
      ];
    }
    parts.hooks.enabled = true;
    parts.hooks.events = parts.events;
    parts.mcp.servers = parts.servers;
    config.mcp = parts.mcp;
    config.hooks = parts.hooks;
    writeConfig(configPath, raw, config);
    return { ok: true, action, message: "已安装 ZCode 桌宠联动，并备份原配置。请新建 ZCode 会话。", changed: true };
  } catch (error) {
    return { ok: false, action, message: errorMessage(error), changed: false };
  }
}

export function removeZCodeGlobal(dependencies: ZCodeSetupDependencies): ZCodeSetupActionResult {
  const action = "zcode-remove";
  try {
    const configPath = getConfigPath(dependencies.homeDir);
    const { config, raw } = readConfig(configPath);
    const parts = getParts(config);
    let changed = false;
    if (isManagedMcp(parts.servers[serverName])) {
      delete parts.servers[serverName];
      parts.mcp.servers = parts.servers;
      config.mcp = parts.mcp;
      changed = true;
    }
    for (const [event, groups] of Object.entries(parts.events)) {
      if (!Array.isArray(groups)) continue;
      if (!groups.some(hasManagedHook)) continue;
      const retained = removeManagedHooks(groups);
      if (retained.length === 0) delete parts.events[event];
      else parts.events[event] = retained;
      changed = true;
    }
    if (changed) {
      parts.hooks.events = parts.events;
      config.hooks = parts.hooks;
      writeConfig(configPath, raw, config);
    }
    return { ok: true, action, message: changed ? "已移除 ZCode 的桌宠联动，其他配置保留。" : "ZCode 中没有本项目管理的联动配置。", changed };
  } catch (error) {
    return { ok: false, action, message: errorMessage(error), changed: false };
  }
}

function buildPreview(dependencies: ZCodeSetupDependencies, configPath: string): ZCodeSetupPreview {
  const mcpEntry = {
    [serverName]: {
      command: dependencies.mcpCommand,
      args: [...dependencies.mcpArgs],
      env: { OPENPETS_DISCOVERY_FILE: dependencies.discoveryPath, DESKTOP_PET_MANAGED: marker },
    },
  };
  const events = Object.fromEntries(hookEvents.map((event) => [event, [createHookGroup(event, dependencies)]]));
  return { configPath, mcpEntry, hooksPreview: { enabled: true, events }, hookEvents };
}

function createHookGroup(event: string, dependencies: ZCodeSetupDependencies): Record<string, unknown> {
  return {
    matcher: "*",
    hooks: [{
      type: "process",
      command: dependencies.nodeCommand,
      args: [dependencies.hookScriptPath, "--desktop-pet-managed", marker, "--event", event, "--client-entry", dependencies.clientEntryPath, "--discovery-file", dependencies.discoveryPath],
      enabled: true,
      timeoutMs: 2000,
    }],
  };
}

function getConfigPath(homeDir: string): string {
  if (!isAbsolute(homeDir)) throw new Error("ZCode 用户目录必须是绝对路径。");
  return join(homeDir, ".zcode", "cli", "config.json");
}

function getParts(config: Record<string, unknown>): { mcp: Record<string, unknown>; servers: Record<string, unknown>; hooks: Record<string, unknown>; events: Record<string, unknown> } {
  const mcp = optionalObject(config.mcp, "mcp");
  const hooks = optionalObject(config.hooks, "hooks");
  const servers = optionalObject(mcp.servers, "mcp.servers");
  const events = optionalObject(hooks.events, "hooks.events");
  for (const groups of Object.values(events)) {
    if (!Array.isArray(groups)) throw new Error("ZCode 的 Hook 事件配置不是数组，未改动该文件。");
  }
  return { mcp, servers, hooks, events };
}

function getEventGroups(events: Record<string, unknown>, event: string): unknown[] {
  const groups = events[event];
  return Array.isArray(groups) ? groups : [];
}

function isManagedMcp(entry: unknown): boolean {
  return isRecord(entry) && isRecord(entry.env) && entry.env.DESKTOP_PET_MANAGED === marker;
}

function isManagedHook(hook: unknown): boolean {
  return isRecord(hook) && Array.isArray(hook.args) && hook.args.some((arg, index, args) => arg === "--desktop-pet-managed" && args[index + 1] === marker);
}

function hasManagedHook(group: unknown): boolean {
  return isRecord(group) && Array.isArray(group.hooks) && group.hooks.some(isManagedHook);
}

function removeManagedHooks(groups: readonly unknown[]): unknown[] {
  return groups.flatMap((group) => {
    if (!isRecord(group) || !Array.isArray(group.hooks) || !hasManagedHook(group)) return [group];
    const hooks = group.hooks.filter((hook) => !isManagedHook(hook));
    return hooks.length === 0 ? [] : [{ ...group, hooks }];
  });
}

function matchesHook(group: unknown, expected: Record<string, unknown>): boolean {
  if (!isRecord(group) || !Array.isArray(group.hooks) || !Array.isArray(expected.hooks)) return false;
  const target = expected.hooks[0];
  return group.hooks.some((hook) => isManagedHook(hook) && isRecord(hook) && isRecord(target) && hook.type === "process" && hook.enabled !== false
    && hook.command === target.command && JSON.stringify(hook.args) === JSON.stringify(target.args));
}

function sameEntry(left: unknown, right: unknown): boolean {
  if (!isRecord(left) || !isRecord(right)) return false;
  return left.command === right.command && JSON.stringify(left.args) === JSON.stringify(right.args)
    && isRecord(left.env) && isRecord(right.env) && left.env.OPENPETS_DISCOVERY_FILE === right.env.OPENPETS_DISCOVERY_FILE
    && left.enable !== false;
}

function optionalObject(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`ZCode 的 ${field} 配置格式无效，未改动该文件。`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readConfig(configPath: string): { config: Record<string, unknown>; raw: string | undefined } {
  assertNoSymlinks(configPath);
  if (!existsSync(configPath)) return { config: {}, raw: undefined };
  const stat = lstatSync(configPath);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error("ZCode 配置不是普通文件或超过 1 MiB，未改动该文件。");
  const raw = readFileSync(configPath, "utf8");
  const value: unknown = JSON.parse(raw.replace(/^\uFEFF/, ""));
  if (!isRecord(value)) throw new Error("ZCode 配置根节点必须是 JSON 对象。");
  return { config: value, raw };
}

function assertNoSymlinks(target: string): void {
  let path = resolve(target);
  while (true) {
    try {
      if (lstatSync(path).isSymbolicLink()) throw new Error("ZCode 配置路径含符号链接，未改动该文件。");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const parent = dirname(path);
    if (parent === path) break;
    path = parent;
  }
}

function writeConfig(configPath: string, original: string | undefined, config: Record<string, unknown>): void {
  assertNoSymlinks(configPath);
  mkdirSync(dirname(configPath), { recursive: true });
  const tempPath = `${configPath}.desktop-pet-${randomUUID()}.tmp`;
  try {
    writeFileSync(tempPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    assertNoSymlinks(configPath);
    const current = existsSync(configPath) ? readFileSync(configPath, "utf8") : undefined;
    if (current !== original) throw new Error("ZCode 配置在操作期间发生变化，请刷新后重试。");
    if (original !== undefined) copyFileSync(configPath, `${configPath}.desktop-pet-${Date.now()}-${randomUUID()}.bak`, constants.COPYFILE_EXCL);
    renameSync(tempPath, configPath);
  } finally {
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "ZCode 桌宠联动操作失败。";
}
