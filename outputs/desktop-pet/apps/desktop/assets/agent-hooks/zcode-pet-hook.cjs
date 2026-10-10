const { pathToFileURL } = require("node:url");
const { createExternalAiEvent } = require("./external-ai-event.cjs");

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function classify(payload, event) {
  if (event === "SessionStart" || event === "SessionEnd" || event === "Interrupt") return "idle";
  if (event === "UserPromptSubmit") return "thinking";
  if (event === "PermissionRequest") return "waiting";
  if (event === "PostToolUseFailure") return "error";
  if (event === "PostToolUse") return "thinking";
  if (event === "Stop") return "success";
  if (event === "PreToolUse") {
    const name = payload.tool_name ?? payload.toolName;
    if (["Write", "Edit", "MultiEdit"].includes(name)) return "editing";
    if (["Bash", "Shell", "Execute"].includes(name)) return "running";
    return "working";
  }
  return undefined;
}

async function run() {
  if (process.argv.includes("--test")) {
    const { createOpenPetsClient } = await import(pathToFileURL(argument("--client-entry")).href);
    const client = createOpenPetsClient({ discoveryPath: argument("--discovery-file"), remote: false, connectTimeoutMs: 500, responseTimeoutMs: 500 });
    if (!(await client.status()).appRunning) throw new Error("桌宠未运行");
    await client.react("waving");
    process.stdout.write(`${JSON.stringify({ ok: true, localOnly: true })}\n`);
    return;
  }
  // 只转发工具名称与会话/文件摘要，提示词、命令、路径和结果原文不离开此回调。
  let raw = "";
  for await (const chunk of process.stdin) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 64 * 1024) return;
  }
  const payload = JSON.parse(raw || "{}");
  const event = payload.hook_event_name ?? payload.hookEventName ?? argument("--event");
  const reaction = classify(payload, event);
  if (!reaction) return;
  const clientEntry = argument("--client-entry");
  const discoveryPath = argument("--discovery-file");
  if (!clientEntry || !discoveryPath) return;
  const { createOpenPetsClient, readDiscoveryFile, sendRequest } = await import(pathToFileURL(clientEntry).href);
  const externalAi = createExternalAiEvent(payload, event, "zcode");
  if (externalAi) await sendRequest(readDiscoveryFile(discoveryPath), "pet.react", { reaction, externalAi }, { connectTimeoutMs: 500, responseTimeoutMs: 500 });
  else await createOpenPetsClient({ discoveryPath, remote: false, connectTimeoutMs: 500, responseTimeoutMs: 500 }).react(reaction);
}

if (require.main === module) {
  // 桌宠不在线或输入格式错误时，不阻断 ZCode 正常工作。
  const testing = process.argv.includes("--test");
  const deadline = setTimeout(() => process.exit(testing ? 1 : 0), 1500);
  void run().catch(() => {
    if (testing) process.exitCode = 1;
  }).finally(() => clearTimeout(deadline));
}

module.exports = { classify };
