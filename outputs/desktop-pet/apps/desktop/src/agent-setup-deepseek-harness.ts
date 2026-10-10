import { randomUUID } from "node:crypto";
import { constants, copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export interface DeepSeekHarnessCommandResult {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
  readonly overflow?: boolean;
}

export interface DeepSeekHarnessSetupDependencies {
  readonly dshHomeDir: string;
  readonly profile: string;
  readonly bundleSourceDir: string;
  readonly managedBundleDir: string;
  readonly discoveryPath: string;
  readonly preferredCommand: string;
  readonly detected: boolean;
  readonly runCommand: (args: readonly string[], timeoutMs: number) => Promise<DeepSeekHarnessCommandResult>;
}

export interface DeepSeekHarnessSetupStatus {
  readonly state: "configured" | "needs_setup" | "not_detected" | "disabled" | "conflict" | "error";
  readonly label: string;
  readonly details: string;
  readonly configPath: string;
  readonly canInstall: boolean;
  readonly canRemove: boolean;
}

export interface DeepSeekHarnessSetupPreview {
  readonly profile: string;
  readonly configPath: string;
  readonly bundlePath: string;
  readonly command: string;
  readonly install: readonly string[];
  readonly remove: readonly string[];
}

export interface DeepSeekHarnessSetupActionResult {
  readonly ok: boolean;
  readonly action: "deepseek-harness-install" | "deepseek-harness-remove" | "deepseek-harness-test";
  readonly message: string;
  readonly changed: boolean;
}

const packageName = "desktop-pet-dsh";
const bundleFiles = ["package.json", "index.mjs", "runtime.mjs", "progress.mjs", "cordis.patch.yml"];
const ownershipFile = "desktop-pet-ownership.json";

export function getDeepSeekHarnessHome(homeDir: string, env: NodeJS.ProcessEnv): string {
  const selected = env.DSH_HOME && env.DSH_HOME.trim().length > 0 ? env.DSH_HOME : join(homeDir, ".dsh");
  if (selected === "~") return resolve(homeDir);
  if (selected.startsWith("~/") || selected.startsWith("~\\")) return resolve(homeDir, selected.slice(2));
  return resolve(selected);
}

export function getDeepSeekHarnessSetup(dependencies: DeepSeekHarnessSetupDependencies): { readonly status: DeepSeekHarnessSetupStatus; readonly preview: DeepSeekHarnessSetupPreview } {
  const profileDir = getProfileDir(dependencies);
  const configPath = join(profileDir, "package.json");
  const preview = {
    profile: dependencies.profile,
    configPath,
    bundlePath: dependencies.managedBundleDir,
    command: dependencies.preferredCommand,
    install: ["plugin", "--profile", dependencies.profile, "add", dependencies.managedBundleDir],
    remove: ["plugin", "--profile", dependencies.profile, "remove", packageName],
  };
  try {
    assertNoSymlinks(configPath);
    const manifest = readOptionalJson(configPath);
    const dependencyMap = optionalRecord(manifest.dependencies, "dependencies");
    const source = dependencyMap[packageName];
    const dsh = optionalRecord(manifest.dsh, "dsh");
    const profile = optionalRecord(dsh.profile, "dsh.profile");
    if (profile.bundles !== undefined && (!Array.isArray(profile.bundles) || !profile.bundles.every((name) => typeof name === "string"))) {
      throw new Error("DSH profile 的 bundles 格式无效，未改动该文件。");
    }
    const bundled = Array.isArray(profile.bundles) && profile.bundles.includes(packageName);
    const owned = isOwnedSource(source, profileDir, dependencies.managedBundleDir) && isOwnedBundle(dependencies.managedBundleDir);
    const conflict = source !== undefined && !owned;
    const settings = owned ? readOptionalJson(join(dependencies.managedBundleDir, "settings.json")) : {};
    const installedPath = join(profileDir, "node_modules", packageName, "package.json");
    const installed = existsSync(installedPath) && readOptionalJson(installedPath).name === packageName;
    const currentBundle = owned && bundleFiles.every((name) => {
      const managedPath = join(dependencies.managedBundleDir, name);
      const sourcePath = join(dependencies.bundleSourceDir, name);
      assertNoSymlinks(managedPath);
      return existsSync(managedPath) && existsSync(sourcePath)
        && lstatSync(managedPath).isFile() && lstatSync(managedPath).size <= 1024 * 1024
        && readFileSync(managedPath).equals(readFileSync(sourcePath));
    });
    const configured = owned && bundled && installed && currentBundle && settings.discoveryPath === dependencies.discoveryPath;
    const disabled = owned && !bundled;
    const state = conflict ? "conflict" : disabled ? "disabled" : configured ? "configured" : dependencies.detected ? "needs_setup" : "not_detected";
    return {
      status: {
        state,
        label: conflict ? "配置冲突" : disabled ? "未启用" : configured ? "已登记" : dependencies.detected ? "待配置" : "未检测到",
        details: conflict ? "DSH 中同名插件来自其他安装源，未覆盖或移除。"
          : disabled ? "桌宠插件已安装，但未列入当前 profile 的 bundles。请在 DSH 内启用后刷新。"
          : configured ? "插件已登记到当前 profile；重启对应 DSH 界面并开始工作，才能验证实际联动。"
          : dependencies.profile === "desktop" && !existsSync(configPath) ? "请先打开一次 DeepSeek Harness Desktop 初始化 desktop profile，再退出后安装联动。"
          : owned && bundled && installed ? "已登记旧版联动，请更新后重启对应 DSH 界面，才能显示真实工具与成功编辑进度。"
          : "通过官方 Cordis bundle 与 plugin 命令接入，显示思考、工具调用、成功编辑和等待确认。",
        configPath,
        canInstall: dependencies.detected && !conflict && !disabled && !configured && (dependencies.profile !== "desktop" || existsSync(configPath)),
        canRemove: dependencies.detected && owned,
      },
      preview,
    };
  } catch (error) {
    return { status: { state: "error", label: "配置错误", details: errorMessage(error), configPath, canInstall: false, canRemove: false }, preview };
  }
}

export async function installDeepSeekHarness(dependencies: DeepSeekHarnessSetupDependencies): Promise<DeepSeekHarnessSetupActionResult> {
  const action = "deepseek-harness-install";
  try {
    const current = getDeepSeekHarnessSetup(dependencies);
    if (!current.status.canInstall) return { ok: current.status.state === "configured", action, message: current.status.details, changed: false };
    prepareManagedBundle(dependencies);
    backupProfile(dependencies);
    const result = await dependencies.runCommand(current.preview.install, 60_000);
    const after = getDeepSeekHarnessSetup(dependencies);
    if (!result.ok || result.timedOut || result.overflow || after.status.state !== "configured") {
      return { ok: false, action, message: "DSH 插件安装尚未通过验证。请查看 DSH 的插件管理日志，解决后刷新；不会标记为已连接。", changed: after.status.canRemove };
    }
    return { ok: true, action, message: `已登记到 DSH 的 ${dependencies.profile} profile。请重启对应界面，再开始一次工作验证动作联动。`, changed: true };
  } catch (error) {
    return { ok: false, action, message: errorMessage(error), changed: false };
  }
}

export async function removeDeepSeekHarness(dependencies: DeepSeekHarnessSetupDependencies): Promise<DeepSeekHarnessSetupActionResult> {
  const action = "deepseek-harness-remove";
  try {
    const current = getDeepSeekHarnessSetup(dependencies);
    if (!current.status.canRemove) return { ok: current.status.state !== "conflict" && current.status.state !== "error", action, message: current.status.details, changed: false };
    backupProfile(dependencies);
    const result = await dependencies.runCommand(current.preview.remove, 60_000);
    const after = getDeepSeekHarnessSetup(dependencies);
    if (!result.ok || result.timedOut || result.overflow || after.status.canRemove) {
      return { ok: false, action, message: "DSH 插件移除未通过验证，请查看 DSH 的插件管理日志后刷新。", changed: false };
    }
    return { ok: true, action, message: "已从该 DSH profile 移除桌宠插件，用户的其他插件和配置保留。", changed: true };
  } catch (error) {
    return { ok: false, action, message: errorMessage(error), changed: false };
  }
}

export async function testDeepSeekHarness(dependencies: DeepSeekHarnessSetupDependencies): Promise<DeepSeekHarnessSetupActionResult> {
  const action = "deepseek-harness-test";
  try {
    const exports: unknown = await import(pathToFileURL(join(dependencies.bundleSourceDir, "runtime.mjs")).href);
    if (!isTestBundle(exports)) throw new Error("DSH 本机联动包不完整，请更新 desktop pet 后重试。");
    const client = exports.createOpenPetsClient({ discoveryPath: dependencies.discoveryPath, remote: false, connectTimeoutMs: 500, responseTimeoutMs: 500 });
    if (!(await client.status()).appRunning) throw new Error("请先显示桌宠，再运行本机联动测试。");
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    const pending: Promise<void>[] = [];
    let delivered = false;
    exports.registerDshListeners({ on: (event, handler) => handlers.set(event, handler) }, {
      enableStatusLineStream: false,
      enableToolEvents: false,
      clientFactory: () => ({
        say: async (_text, options) => {
          await client.say("我在思考中。", options);
          delivered = true;
        },
      }),
      schedule: (work) => {
        const job = work();
        pending.push(job);
        return job;
      },
    });
    handlers.get("agent/status")?.({ status: "running" });
    await Promise.all(pending);
    if (!delivered) throw new Error("本机状态事件未到达桌宠，请检查桌宠运行状态。");
    return { ok: true, action, message: "本机 Cordis 状态事件已到达桌宠；这只验证本机桥接，实际 DSH 仍需重启后开始工作验证。", changed: false };
  } catch (error) {
    return { ok: false, action, message: errorMessage(error), changed: false };
  }
}

interface TestClient {
  status(): Promise<{ readonly appRunning: boolean }>;
  say(text: string, options: { readonly reaction: string }): Promise<unknown>;
}

interface TestBundle {
  createOpenPetsClient(options: { discoveryPath: string; remote: false; connectTimeoutMs: number; responseTimeoutMs: number }): TestClient;
  registerDshListeners(context: { on: (event: string, handler: (...args: unknown[]) => unknown) => unknown }, options: {
    enableStatusLineStream: false;
    enableToolEvents: false;
    clientFactory: () => Pick<TestClient, "say">;
    schedule: (work: () => Promise<void>) => Promise<void>;
  }): unknown;
}

function isTestBundle(value: unknown): value is TestBundle {
  return typeof value === "object" && value !== null && "createOpenPetsClient" in value && typeof value.createOpenPetsClient === "function"
    && "registerDshListeners" in value && typeof value.registerDshListeners === "function";
}

function getProfileDir(dependencies: DeepSeekHarnessSetupDependencies): string {
  if (!isAbsolute(dependencies.dshHomeDir) || !isAbsolute(dependencies.managedBundleDir)) throw new Error("DSH 配置和联动目录必须是绝对路径。");
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(dependencies.profile) || dependencies.profile === "node_modules") throw new Error("DSH profile 名称无效。");
  return join(dependencies.dshHomeDir, "profiles", dependencies.profile);
}

function isOwnedSource(source: unknown, profileDir: string, managedDir: string): boolean {
  if (typeof source !== "string" || !/^(link:|file:)/.test(source)) return false;
  const path = source.replace(/^(link:|file:)/, "");
  const actual = resolve(profileDir, path);
  const expected = resolve(managedDir);
  return process.platform === "win32" ? actual.toLowerCase() === expected.toLowerCase() : actual === expected;
}

function isOwnedBundle(managedDir: string): boolean {
  const receipt = readOptionalJson(join(managedDir, ownershipFile));
  return receipt.integration === "desktop-pet-deepseek-harness-v1";
}

function prepareManagedBundle(dependencies: DeepSeekHarnessSetupDependencies): void {
  assertNoSymlinks(join(dependencies.managedBundleDir, ownershipFile));
  assertNoSymlinks(join(dependencies.managedBundleDir, "settings.json"));
  if (existsSync(dependencies.managedBundleDir) && !isOwnedBundle(dependencies.managedBundleDir)) {
    throw new Error("联动目录已有其他内容，未覆盖该目录。");
  }
  for (const name of bundleFiles) {
    const path = join(dependencies.bundleSourceDir, name);
    if (!existsSync(path) || !lstatSync(path).isFile()) throw new Error("DSH 本机联动包不完整，请更新 desktop pet 后重试。");
  }
  mkdirSync(dependencies.managedBundleDir, { recursive: true });
  for (const name of bundleFiles) {
    const target = join(dependencies.managedBundleDir, name);
    assertNoSymlinks(target);
    copyFileSync(join(dependencies.bundleSourceDir, name), target);
  }
  assertNoSymlinks(join(dependencies.managedBundleDir, "settings.json"));
  writeFileSync(join(dependencies.managedBundleDir, "settings.json"), `${JSON.stringify({ discoveryPath: dependencies.discoveryPath }, null, 2)}\n`, { mode: 0o600 });
  assertNoSymlinks(join(dependencies.managedBundleDir, ownershipFile));
  writeFileSync(join(dependencies.managedBundleDir, ownershipFile), `${JSON.stringify({ integration: "desktop-pet-deepseek-harness-v1" }, null, 2)}\n`, { mode: 0o600 });
}

function backupProfile(dependencies: DeepSeekHarnessSetupDependencies): void {
  const dir = getProfileDir(dependencies);
  const suffix = `.desktop-pet-${Date.now()}-${randomUUID()}.bak`;
  for (const name of ["package.json", "cordis.patch.yml", "pnpm-lock.yaml"]) {
    const path = join(dir, name);
    assertNoSymlinks(path);
    if (existsSync(path)) copyFileSync(path, `${path}${suffix}`, constants.COPYFILE_EXCL);
  }
}

function readOptionalJson(path: string): Record<string, unknown> {
  if (!existsSync(path)) return {};
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error("DSH 配置不是普通文件或超过 1 MiB。");
  const value: unknown = JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
  return optionalRecord(value, "根节点");
}

function optionalRecord(value: unknown, field: string): Record<string, unknown> {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`DSH 的 ${field} 必须是对象。`);
  return value as Record<string, unknown>;
}

function assertNoSymlinks(target: string): void {
  let path = resolve(target);
  while (true) {
    try {
      if (lstatSync(path).isSymbolicLink()) throw new Error("DSH 可写配置路径含符号链接，未改动该文件。");
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
    const parent = dirname(path);
    if (parent === path) break;
    path = parent;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "DeepSeek Harness 联动操作失败。";
}
