import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import { getCodexSetup, installCodexHooks, removeCodexHooks, testCodexHooks, type CodexSetupDependencies } from "./agent-setup-codex.js";
import { getZCodeSetup, installZCodeGlobal, removeZCodeGlobal, type ZCodeSetupDependencies } from "./agent-setup-zcode.js";
import { getDeepSeekHarnessHome, getDeepSeekHarnessSetup, installDeepSeekHarness, removeDeepSeekHarness, testDeepSeekHarness, type DeepSeekHarnessSetupDependencies } from "./agent-setup-deepseek-harness.js";
import { getDoubaoSetup, installDoubaoBridge, removeDoubaoBridge, testDoubaoBridge, type DoubaoSetupDependencies } from "./agent-setup-doubao.js";
import type { ExternalAiSetup, ExternalAiSetupAction } from "./external-ai-setup-types.js";

export interface ExternalAiCommandResult {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
  readonly overflow?: boolean;
}

export interface ExternalAiSetupDependencies {
  readonly homeDir: string;
  readonly dataDir: string;
  readonly codexDir: string;
  readonly codexCommand?: string;
  readonly env: NodeJS.ProcessEnv;
  readonly platform: NodeJS.Platform;
  readonly nodeCommand: string;
  readonly dshCommand: string;
  readonly dshProfile: string;
  readonly clientEntryPath: string;
  readonly mcpEntryPath: string;
  readonly discoveryPath: string;
  readonly assetsDir: string;
  readonly runCommand: (command: string, args: readonly string[], timeoutMs?: number, input?: string) => Promise<ExternalAiCommandResult>;
  readonly openDocumentation: (url: string) => Promise<void>;
  readonly formatUserPath: (path: string | undefined) => string | undefined;
}

const documentation = {
  codex: "https://learn.chatgpt.com/docs/hooks",
  zcode: "https://zcode.z.ai/cn/docs/hooks",
  "deepseek-harness": "https://deepseek-harness.github.io/deepseek-harness/",
  doubao: "https://docs.volcengine.com/docs/ark/function-calling?lang=zh",
} as const;

async function adapterDependencies(context: ExternalAiSetupDependencies) {
  const [node, codex, zcode, dsh] = await Promise.all([
    context.runCommand(context.nodeCommand, ["-p", "process.execPath"], 2000),
    detectCommand(context.codexCommand || "codex", context),
    detectCommand("zcode", context),
    detectCommand(context.dshCommand, context),
  ]);
  const nodePath = node.ok && isAbsolute(node.stdout.trim()) && existsSync(node.stdout.trim()) ? node.stdout.trim() : context.nodeCommand;
  const common = { nodeCommand: nodePath, clientEntryPath: context.clientEntryPath, discoveryPath: context.discoveryPath };
  const codexDependencies: CodexSetupDependencies = {
    ...common, codexDir: context.codexDir, detected: codex.detected || existsSync(context.codexDir), platform: context.platform, formatUserPath: context.formatUserPath,
  };
  const zcodeDependencies: ZCodeSetupDependencies = {
    ...common, homeDir: context.homeDir, detected: zcode.detected || existsSync(join(context.homeDir, ".zcode", "cli", "config.json")),
    hookScriptPath: join(context.assetsDir, "zcode-pet-hook.cjs"), mcpCommand: nodePath, mcpArgs: [context.mcpEntryPath], formatUserPath: context.formatUserPath,
  };
  const dshDependencies: DeepSeekHarnessSetupDependencies = {
    dshHomeDir: getDeepSeekHarnessHome(context.homeDir, context.env), profile: context.dshProfile,
    bundleSourceDir: join(context.assetsDir, "deepseek-harness"), managedBundleDir: join(context.dataDir, "integrations", "dsh"),
    discoveryPath: context.discoveryPath, preferredCommand: dsh.command, detected: dsh.detected,
    runCommand: (args, timeout) => context.runCommand(dsh.command, args, timeout),
  };
  const doubaoDependencies: DoubaoSetupDependencies = {
    ...common, integrationDir: join(context.dataDir, "integrations", "doubao"),
    runCommand: (command, args) => context.runCommand(command, args, 2500),
  };
  return { codexDependencies, zcodeDependencies, dshDependencies, doubaoDependencies, nodePath, detectedPrograms: { codex, zcode, dsh } };
}

async function detectCommand(command: string, context: ExternalAiSetupDependencies) {
  const candidates = context.platform === "win32" && !isAbsolute(command) && !command.endsWith(".cmd") ? [command, `${command}.cmd`] : [command];
  let timedOut = false;
  for (const candidate of candidates) {
    const result = await context.runCommand(candidate, ["--version"], 1500);
    timedOut ||= result.timedOut === true;
    if (result.ok) return { detected: true, command: candidate, timedOut: false };
  }
  return { detected: false, command, timedOut };
}

function programStatus(probe: { readonly detected: boolean; readonly timedOut: boolean }): ExternalAiSetup["program"] {
  return {
    detected: probe.detected,
    label: probe.detected ? "命令行程序可用" : probe.timedOut ? "程序检测超时" : "命令行程序未确认",
    details: probe.detected
      ? "版本命令已通过；这不代表账户已登录、连接配置生效或真实会话已联动。"
      : probe.timedOut
        ? "版本检测超时，未判定为未安装。请检查程序启动情况后刷新。"
        : "未通过命令行版本检测。已有配置文件或桌面应用仍可能存在，请检查原工具。",
  };
}

export async function getExternalAiSetups(context: ExternalAiSetupDependencies): Promise<readonly ExternalAiSetup[]> {
  const deps = await adapterDependencies(context);
  const codex = getCodexSetup(deps.codexDependencies);
  const zcode = getZCodeSetup(deps.zcodeDependencies);
  const dsh = getDeepSeekHarnessSetup(deps.dshDependencies);
  const doubao = getDoubaoSetup(deps.doubaoDependencies);
  return [
    {
      id: "codex", name: "Codex", state: codex.status.state === "needs_update" ? "needs_setup" : codex.status.state,
      label: codex.status.label, description: "通过官方 Hooks 联动本地 Codex 工作状态。", details: codex.status.details,
      configPath: codex.status.configPath, instructions: ["安装桌宠 Hooks。", "在 Codex /hooks 中审阅并信任当前命令，再新建会话。", "本机测试验证桌宠链路；Codex 的信任状态需在 Codex 内确认。"],
      canInstall: codex.status.canInstall, canRemove: codex.status.canRemove, canTest: codex.status.canTest, installLabel: "安装 Hooks",
      preview: JSON.stringify({ events: codex.preview.events, command: codex.preview.command, commandWindows: codex.preview.commandWindows }, null, 2), docsUrl: documentation.codex,
      program: programStatus(deps.detectedPrograms.codex),
      session: { state: "unconfirmed", details: "尚无可归属 Codex 的真实会话确认。请在 Codex 信任 Hooks 后新建会话；本机链路自测不等于真实工作事件。" },
    },
    {
      id: "zcode", name: "ZCode", state: zcode.status.state, label: zcode.status.label,
      description: "通过官方 MCP 与用户级 Hooks 联动 ZCode。", details: zcode.status.details, configPath: zcode.status.configPath,
      instructions: ["安装用户级 MCP 与桌宠 Hooks，原有配置会保留并备份。", "在 ZCode 设置中检查 MCP 与 Hooks，再新建会话。", "ZCode 当前不执行工作区级 Hooks，此处使用用户级配置。"],
      canInstall: zcode.status.canInstall, canRemove: zcode.status.canRemove, canTest: zcode.status.state === "configured", installLabel: "安装连接",
      preview: JSON.stringify({ mcp: { servers: zcode.preview.mcpEntry }, hooks: zcode.preview.hooksPreview }, null, 2), docsUrl: documentation.zcode,
      program: programStatus(deps.detectedPrograms.zcode),
      session: { state: "unconfirmed", details: "尚无可归属 ZCode 的真实会话确认。请在原工具新建会话并开始工作；配置登记和本机链路自测不等于实际联动。" },
    },
    {
      id: "deepseek-harness", name: "DeepSeek Harness", state: dsh.status.state === "disabled" ? "needs_setup" : dsh.status.state,
      label: dsh.status.label, description: "通过官方 Cordis 插件接收 Harness 工作状态。", details: dsh.status.details, configPath: dsh.status.configPath,
      instructions: ["选择正在使用的配置档案：网页为 web，桌面版为 desktop。", "先安装并初始化 DeepSeek Harness；桌面版需要先启动一次。", "退出对应 Harness 界面后安装连接，完成后重启。", "仅传工作状态；此连接不提供账户剩余额度。"],
      canInstall: dsh.status.canInstall, canRemove: dsh.status.canRemove, canTest: true, installLabel: "安装插件",
      preview: JSON.stringify({ profile: dsh.preview.profile, command: dsh.preview.command, args: dsh.preview.install }, null, 2), docsUrl: documentation["deepseek-harness"],
      program: programStatus(deps.detectedPrograms.dsh),
      session: { state: "unconfirmed", details: "尚无可归属当前 Harness profile 的真实会话确认。请重启对应界面并开始工作；插件登记和本机测试不能证明该会话已联动。" },
    },
    {
      id: "doubao", name: "豆包", state: doubao.status.state, label: doubao.status.label,
      description: "使用方舟 Function Calling 的本机开发接口。", details: doubao.status.details,
      configPath: doubao.preview.bridgePath, instructions: ["准备本机桥接脚本。", "将复制的函数声明加入自己的方舟应用，并由本机工具执行器调用桥接脚本。", "普通豆包模型支持该开发路径；豆包网页、PC 客户端自动监测未支持。", "测试桌宠联动不会调用豆包模型。"],
      canInstall: doubao.status.canInstall, canRemove: doubao.status.canRemove, canTest: doubao.status.state === "configured", installLabel: "准备本机桥",
      preview: JSON.stringify({ tools: doubao.preview.functionTools, command: doubao.preview.command }, null, 2), docsUrl: documentation.doubao,
      program: { detected: null, label: "本机开发接口", details: "不检测豆包网页或 PC 客户端。需要你自己的方舟应用执行本机工具调用。" },
      session: { state: "unconfirmed", details: "尚未确认你的方舟应用已执行真实调用。本机桥准备或联动自测成功，不代表豆包客户端已接入。" },
    },
  ];
}

export async function runExternalAiSetupAction(action: ExternalAiSetupAction, context: ExternalAiSetupDependencies) {
  if (action.endsWith("-docs")) {
    const id = action.slice(0, -5) as keyof typeof documentation;
    await context.openDocumentation(documentation[id]);
    return { ok: true, action, changed: false, message: "已打开官方文档。" };
  }
  const deps = await adapterDependencies(context);
  switch (action) {
    case "codex-install": return installCodexHooks(deps.codexDependencies);
    case "codex-remove": return removeCodexHooks(deps.codexDependencies);
    case "codex-test": return testCodexHooks(deps.codexDependencies);
    case "zcode-install": return installZCodeGlobal(deps.zcodeDependencies);
    case "zcode-remove": return removeZCodeGlobal(deps.zcodeDependencies);
    case "zcode-test": {
      const result = await context.runCommand(deps.nodePath, [deps.zcodeDependencies.hookScriptPath, "--test", "--client-entry", context.clientEntryPath, "--discovery-file", context.discoveryPath], 2500, "{}");
      let acknowledged = false;
      try { const reply = JSON.parse(result.stdout.trim()) as { ok?: boolean; localOnly?: boolean }; acknowledged = result.ok && reply.ok === true && reply.localOnly === true; } catch {}
      return { ok: acknowledged, action, changed: false, message: acknowledged ? "ZCode 本机桌宠链路测试通过；实际会话请在 ZCode 中开始验证。" : "ZCode 本机测试失败，请检查 Node.js 路径并启动桌宠。" };
    }
    case "deepseek-harness-install": return installDeepSeekHarness(deps.dshDependencies);
    case "deepseek-harness-remove": return removeDeepSeekHarness(deps.dshDependencies);
    case "deepseek-harness-test": return testDeepSeekHarness(deps.dshDependencies);
    case "doubao-install": return installDoubaoBridge(deps.doubaoDependencies);
    case "doubao-remove": return removeDoubaoBridge(deps.doubaoDependencies);
    case "doubao-test": return testDoubaoBridge(deps.doubaoDependencies);
    default: throw new Error("不支持的外部 AI 接入操作。");
  }
}
