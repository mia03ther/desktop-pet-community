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
  readonly state: "configured" | "needs_setup" | "needs_update" | "conflict" | "error";
  readonly label: string;
  readonly details: string;
  readonly canInstall: boolean;
  readonly canRemove: boolean;
}

export interface DoubaoSetupPreview {
  readonly instructions: string;
  readonly functionTools: readonly Record<string, unknown>[];
  readonly command: readonly string[];
  readonly eventCommand: readonly string[];
  readonly eventExample: Readonly<Record<string, unknown>>;
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
    const existing = readManagedBridge(preview.bridgePath);
    const matches = existing === source;
    const previousVersion = existing === createLegacyDoubaoBridgeSource(dependencies);
    return {
      status: matches
        ? { state: "configured", label: "本机桥已准备", details: integrationLimitations, canInstall: false, canRemove: true }
        : previousVersion
          ? { state: "needs_update", label: "本机桥可更新", details: "更新后可接收真实应用的会话、工具与文件编辑事件。" + integrationLimitations, canInstall: true, canRemove: true }
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
    let updating = false;
    if (pathExists(bridgePath)) {
      const existing = readManagedBridge(bridgePath);
      if (existing === source) return { ok: true, action, message: "本机桥已准备；请在自己的方舟应用里接入工具执行。", changed: false };
      if (existing !== createLegacyDoubaoBridgeSource(dependencies)) throw new Error("已有本机桥文件与当前配置不同，未覆盖文件。");
      updating = true;
    }
    mkdirSync(dependencies.integrationDir, { recursive: true });
    const pendingPath = join(dependencies.integrationDir, `${bridgeFileName}.${process.pid}.tmp`);
    writeFileSync(pendingPath, source, { encoding: "utf8", flag: "wx", mode: 0o600 });
    try {
      renameSync(pendingPath, bridgePath);
    } finally {
      if (pathExists(pendingPath)) unlinkSync(pendingPath);
    }
    return { ok: true, action, message: updating
      ? "已更新本机桥；自己的方舟应用可发送会话和工具事件，豆包客户端仍未连接。"
      : "已生成本机桥。尚未连接豆包客户端；将函数工具与执行命令接入自己的方舟应用后即可联动桌宠。", changed: true };
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
    const source = readManagedBridge(bridgePath);
    if (source !== createDoubaoBridgeSource(dependencies) && source !== createLegacyDoubaoBridgeSource(dependencies)) {
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
  validateBridgeDependencies(dependencies);
  return [
    "// desktop pet 豆包方舟本机事件桥；只传工作摘要，不传聊天内容或凭据。",
    'import { createHash } from "node:crypto";',
    'import { isAbsolute, normalize } from "node:path";',
    'import { pathToFileURL } from "node:url";',
    `import { createOpenPetsClient, readDiscoveryFile, sendRequest } from ${JSON.stringify(pathToFileURL(dependencies.clientEntryPath).href)};`,
    `const discoveryPath = ${JSON.stringify(dependencies.discoveryPath)};`,
    `const reactions = ${JSON.stringify(doubaoActivityReactions)};`,
    'const eventReactions = { "session-start": "idle", "turn-start": "thinking", "tool-start": "working", "tool-complete": "working", "tool-failed": "error", permission: "waiting", "turn-end": "success", interrupt: "idle", "session-end": "idle" };',
    'const allowedFields = ["event", "sessionId", "turnId", "callId", "toolName", "succeeded", "editedFiles"];',
    'const digest = value => createHash("sha256").update(value).digest("hex");',
    'function invalid() { throw new Error("工作事件无效；只接受有界的会话、工具与成功编辑摘要。"); }',
    'function identity(value) {',
    '  if (typeof value !== "string" || !value.trim() || value.length > 512) invalid();',
    '  return digest(value);',
    '}',
    'export async function reportDoubaoActivity(input) {',
    '  if (!input || typeof input !== "object" || Array.isArray(input) || JSON.stringify(input).length > 16 * 1024',
    '    || Object.keys(input).some(key => !allowedFields.includes(key)) || !Object.hasOwn(eventReactions, input.event)) invalid();',
    '  const event = { adapter: "doubao", sessionId: identity(input.sessionId), event: input.event, sentAt: Date.now() };',
    '  if (input.turnId !== undefined) event.turnId = identity(input.turnId);',
    '  if (input.callId !== undefined) event.callId = identity(input.callId);',
    '  if (input.toolName !== undefined) {',
    '    if (typeof input.toolName !== "string" || !/^[a-zA-Z0-9_.:-]{1,100}$/.test(input.toolName)) invalid();',
    '    event.toolName = input.toolName;',
    '  }',
    '  if (input.succeeded !== undefined && (typeof input.succeeded !== "boolean" || input.event !== "tool-complete")) invalid();',
    '  if (input.succeeded === false) event.event = "tool-failed";',
    '  if (input.editedFiles !== undefined) {',
    '    if (input.event !== "tool-complete" || !Array.isArray(input.editedFiles) || input.editedFiles.length > 100',
    '      || input.editedFiles.some(file => typeof file !== "string" || file.length > 4096 || /[\\0\\r\\n]/.test(file) || !isAbsolute(file))) invalid();',
    '    // 只有本机执行器明确确认成功才累计文件，模型文字和失败结果不能作依据。',
    '    if (input.succeeded === true) event.editedFileIds = [...new Set(input.editedFiles.map(file => digest(normalize(file).replaceAll("\\\\", "/"))))];',
    '  }',
    '  await sendRequest(readDiscoveryFile(discoveryPath), "pet.react", { reaction: eventReactions[event.event], externalAi: event });',
    '  return { ok: true, event: event.event };',
    '}',
    'async function readEventInput() {',
    '  const chunks = [];',
    '  let bytes = 0;',
    '  for await (const chunk of process.stdin) {',
    '    bytes += chunk.length;',
    '    if (bytes > 16 * 1024) invalid();',
    '    chunks.push(chunk);',
    '  }',
    '  return JSON.parse(Buffer.concat(chunks).toString("utf8"));',
    '}',
    'if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {',
    '  const state = process.argv[2];',
    '  if (process.argv.length !== 3 || (state !== "--event" && !Object.hasOwn(reactions, state))) {',
    "    process.stderr.write('仅支持六种工作状态，或 --event 从标准输入读取工作事件。\\n');",
    '    process.exitCode = 2;',
    '  } else {',
    '    try {',
    '      let result;',
    '      if (state === "--event") result = await reportDoubaoActivity(await readEventInput());',
    '      else {',
    '        const client = createOpenPetsClient({ discoveryPath, remote: false });',
    '        await client.react(reactions[state]);',
    '        result = { ok: true, state };',
    '      }',
    "      process.stdout.write(JSON.stringify(result) + '\\n');",
    '    } catch {',
    "      process.stderr.write('事件无效或无法连接桌宠，请检查输入并确认程序已启动。\\n');",
    '      process.exitCode = 1;',
    '    }',
    '  }',
    '}',
    '',
  ].join("\n");
}

function validateBridgeDependencies(dependencies: DoubaoSetupDependencies): void {
  if (!isAbsolute(dependencies.clientEntryPath) || /[\0\r\n]/.test(dependencies.clientEntryPath) || /\.asar(?:[\\/]|$)/i.test(dependencies.clientEntryPath)) {
    throw new Error("本机桥需要可由 Node.js 读取的桌宠客户端文件路径。");
  }
  if (!isAbsolute(dependencies.discoveryPath) || /[\0\r\n]/.test(dependencies.discoveryPath) || !dependencies.nodeCommand.trim() || /[\0\r\n]/.test(dependencies.nodeCommand)) {
    throw new Error("本机桥的 Node.js 命令或桌宠发现文件路径无效。");
  }
}

// 仅用于识别本项目上一版生成的文件，避免覆盖用户改写过的桥接程序。
function createLegacyDoubaoBridgeSource(dependencies: DoubaoSetupDependencies): string {
  validateBridgeDependencies(dependencies);
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
    eventCommand: [dependencies.nodeCommand, bridgePath, "--event"],
    eventExample: { event: "tool-start", sessionId: "应用的真实会话编号", turnId: "本轮编号", callId: "工具调用编号", toolName: "search" },
    documentationUrl: "https://docs.volcengine.com/docs/ark/function-calling?lang=zh",
    cozeDocumentationUrl: "https://docs.coze.cn/mcp",
    instructions: "1. 生成本机桥并测试。\n2. 在自己的方舟应用中导入桥接文件的 reportDoubaoActivity，或用 --event 参数并通过标准输入发送 JSON。\n3. 应用在真实会话开始、请求开始、工具执行前后、完成或失败时发送对应事件；sessionId、turnId、callId 用自己的真实标识，桥会转成摘要。\n4. 只有执行器实际确认成功的文件修改才发送 succeeded:true 与 editedFiles 绝对路径；不得将模型声称已编辑作为依据。\n5. desktop_pet_activity 函数工具与六状态命令仍可仅播放动作，不作为真实会话确认。\n豆包助手 API 的 doubao_app 工具不可与 Function Calling 混用。扣子云端 MCP 使用 HTTP/SSE，不能直接访问此本机桥。",
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
