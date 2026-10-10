import { lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, parse } from "node:path";
import { pathToFileURL } from "node:url";

export const doubaoActivityReactions = {
  started: "thinking",
  working: "working",
  waiting: "waiting",
  completed: "success",
  failed: "error",
  idle: "idle",
} as const;

export interface DoubaoSetupDependencies {
  readonly integrationDir: string;
  readonly nodeCommand: string;
  readonly clientEntryPath: string;
  readonly discoveryPath: string;
  readonly runCommand?: (command: string, args: readonly string[]) => Promise<{ readonly ok: boolean }>;
}

export interface DoubaoSetupStatus {
  readonly state: "configured" | "needs_setup" | "conflict" | "error";
  readonly label: string;
  readonly details: string;
  readonly canInstall: boolean;
  readonly canRemove: boolean;
}

export interface DoubaoSetupPreview {
  readonly instructions: string;
  readonly functionTools: readonly Record<string, unknown>[];
  readonly command: readonly string[];
  readonly bridgePath: string;
  readonly documentationUrl: string;
  readonly cozeDocumentationUrl: string;
}

export interface DoubaoSetupActionResult {
  readonly ok: boolean;
  readonly action: "doubao-install" | "doubao-remove" | "doubao-test";
  readonly message: string;
  readonly changed: boolean;
}

const bridgeFileName = "doubao-pet-bridge.mjs";
const integrationLimitations = "通过火山方舟普通豆包模型的 Function Calling，由你本机的应用发送工作状态。豆包网页／PC 客户端自动监测未支持，额度也不会从此桥推测。";

export function getDoubaoSetup(dependencies: DoubaoSetupDependencies): {
  readonly status: DoubaoSetupStatus;
  readonly preview: DoubaoSetupPreview;
} {
  const preview = createPreview(dependencies);
  try {
    const source = createDoubaoBridgeSource(dependencies);
    assertSafeDirectory(dependencies.integrationDir);
    if (!pathExists(preview.bridgePath)) {
      return {
        status: { state: "needs_setup", label: "开发接口待配置", details: integrationLimitations, canInstall: true, canRemove: false },
        preview,
      };
    }
    const matches = readManagedBridge(preview.bridgePath) === source;
    return {
      status: matches
        ? { state: "configured", label: "本机桥已准备", details: integrationLimitations, canInstall: false, canRemove: true }
        : { state: "conflict", label: "本机桥文件存在冲突", details: "现有桥接文件与当前配置不同，请先检查该文件。" + integrationLimitations, canInstall: false, canRemove: false },
      preview,
    };
  } catch (error) {
    return {
      status: { state: "error", label: "本机桥不可用", details: error instanceof Error ? error.message : "无法读取本机桥。", canInstall: false, canRemove: false },
      preview,
    };
  }
}

export function installDoubaoBridge(dependencies: DoubaoSetupDependencies): DoubaoSetupActionResult {
  const action = "doubao-install";
  try {
    const source = createDoubaoBridgeSource(dependencies);
    assertSafeDirectory(dependencies.integrationDir);
    const bridgePath = join(dependencies.integrationDir, bridgeFileName);
    if (pathExists(bridgePath)) {
      if (readManagedBridge(bridgePath) !== source) throw new Error("已有本机桥文件与当前配置不同，未覆盖文件。");
      return { ok: true, action, message: "本机桥已准备；请在自己的方舟应用里接入工具执行。", changed: false };
    }
    mkdirSync(dependencies.integrationDir, { recursive: true });
    const pendingPath = join(dependencies.integrationDir, `${bridgeFileName}.${process.pid}.tmp`);
    writeFileSync(pendingPath, source, { encoding: "utf8", flag: "wx", mode: 0o600 });
    try {
      renameSync(pendingPath, bridgePath);
    } finally {
      if (pathExists(pendingPath)) unlinkSync(pendingPath);
    }
    return { ok: true, action, message: "已生成本机桥。尚未连接豆包客户端；将函数工具与执行命令接入自己的方舟应用后即可联动桌宠。", changed: true };
  } catch (error) {
    return { ok: false, action, message: error instanceof Error ? error.message : "本机桥生成失败。", changed: false };
  }
}

export function removeDoubaoBridge(dependencies: DoubaoSetupDependencies): DoubaoSetupActionResult {
  const action = "doubao-remove";
  try {
    assertSafeDirectory(dependencies.integrationDir);
    const bridgePath = join(dependencies.integrationDir, bridgeFileName);
    if (!pathExists(bridgePath)) return { ok: true, action, message: "本机桥已不存在。", changed: false };
    if (readManagedBridge(bridgePath) !== createDoubaoBridgeSource(dependencies)) {
      throw new Error("本机桥文件已改变，未删除文件，请先检查内容。");
    }
    unlinkSync(bridgePath);
    return { ok: true, action, message: "已移除 desktop pet 生成的本机桥。", changed: true };
  } catch (error) {
    return { ok: false, action, message: error instanceof Error ? error.message : "本机桥移除失败。", changed: false };
  }
}

export async function testDoubaoBridge(dependencies: DoubaoSetupDependencies): Promise<DoubaoSetupActionResult> {
  const action = "doubao-test";
  if (getDoubaoSetup(dependencies).status.state !== "configured" || !dependencies.runCommand) {
    return { ok: false, action, message: "请先生成本机桥，再测试桌宠联动。", changed: false };
  }
  try {
    const result = await dependencies.runCommand(dependencies.nodeCommand, [join(dependencies.integrationDir, bridgeFileName), "idle"]);
    return {
      ok: result.ok,
      action,
      message: result.ok
        ? "本机事件已送达桌宠；此测试未调用豆包 API，也不代表豆包客户端已连接。"
        : "本机事件发送失败，请确认桌宠程序已启动。",
      changed: false,
    };
  } catch {
    return { ok: false, action, message: "本机事件发送失败，请确认桌宠程序已启动。", changed: false };
  }
}

export function createDoubaoBridgeSource(dependencies: DoubaoSetupDependencies): string {
  if (!isAbsolute(dependencies.clientEntryPath) || /[\0\r\n]/.test(dependencies.clientEntryPath) || /\.asar(?:[\\/]|$)/i.test(dependencies.clientEntryPath)) {
    throw new Error("本机桥需要可由 Node.js 读取的桌宠客户端文件路径。");
  }
  if (!isAbsolute(dependencies.discoveryPath) || /[\0\r\n]/.test(dependencies.discoveryPath) || !dependencies.nodeCommand.trim() || /[\0\r\n]/.test(dependencies.nodeCommand)) {
    throw new Error("本机桥的 Node.js 命令或桌宠发现文件路径无效。");
  }
  return [
    "// desktop pet 生成的豆包方舟本机事件桥；只传工作状态，不传聊天内容或凭据。",
    `import { createOpenPetsClient } from ${JSON.stringify(pathToFileURL(dependencies.clientEntryPath).href)};`,
    `const reactions = ${JSON.stringify(doubaoActivityReactions)};`,
    "const state = process.argv[2];",
    "if (process.argv.length !== 3 || !Object.hasOwn(reactions, state)) {",
    "  process.stderr.write('仅支持 started、working、waiting、completed、failed、idle 工作状态。\\n');",
    "  process.exitCode = 2;",
    "} else {",
    "  try {",
    `    const client = createOpenPetsClient({ discoveryPath: ${JSON.stringify(dependencies.discoveryPath)}, remote: false });`,
    "    await client.react(reactions[state]);",
    "    process.stdout.write(JSON.stringify({ ok: true, state }) + '\\n');",
    "  } catch {",
    "    process.stderr.write('无法连接桌宠，请确认程序已启动。\\n');",
    "    process.exitCode = 1;",
    "  }",
    "}",
    "",
  ].join("\n");
}

function createPreview(dependencies: DoubaoSetupDependencies): DoubaoSetupPreview {
  const bridgePath = join(dependencies.integrationDir, bridgeFileName);
  return {
    bridgePath,
    command: [dependencies.nodeCommand, bridgePath, "<state>"],
    documentationUrl: "https://docs.volcengine.com/docs/ark/function-calling?lang=zh",
    cozeDocumentationUrl: "https://docs.coze.cn/mcp",
    instructions: "1. 生成本机桥并测试。\n2. 在自己本机运行的方舟应用中，将函数工具加入普通豆包模型请求的 tools。\n3. 收到 desktop_pet_activity 调用时，把 state 作为单个参数传给本机执行命令；用 execFile 等参数数组调用，不拼接 shell 命令。\n4. 将执行结果回填给模型。应用也可在开始、等待、完成或失败时直接调用该命令。\n豆包助手 API 的 doubao_app 工具不可与 Function Calling 混用。扣子云端 MCP 使用 HTTP/SSE，不能直接访问此本机桥。",
    functionTools: [{
      type: "function",
      function: {
        name: "desktop_pet_activity",
        description: "通知用户桌面上的 desktop pet 当前工作状态；仅发送状态，不发送对话内容。",
        parameters: {
          type: "object",
          properties: { state: { type: "string", enum: Object.keys(doubaoActivityReactions) } },
          required: ["state"],
          additionalProperties: false,
        },
      },
    }],
  };
}

function readManagedBridge(bridgePath: string): string {
  const info = lstatSync(bridgePath);
  if (info.isSymbolicLink() || !info.isFile() || info.size > 16 * 1024) throw new Error("本机桥文件类型或大小异常，未修改文件。");
  return readFileSync(bridgePath, "utf8");
}

function assertSafeDirectory(directory: string): void {
  if (!isAbsolute(directory) || directory === parse(directory).root) throw new Error("本机桥必须放在本档案的独立集成目录。");
  let current = directory;
  while (true) {
    if (pathExists(current)) {
      const info = lstatSync(current);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new Error("本机桥目录不可使用链接或普通文件。");
    }
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function pathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw error;
  }
}
