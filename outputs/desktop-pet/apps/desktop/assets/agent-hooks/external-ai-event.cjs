const { createHash } = require("node:crypto");
const { resolve } = require("node:path");

function digest(value) { return createHash("sha256").update(value).digest("hex"); }
function createExternalAiEvent(payload, event, adapter) {
  const session = payload.session_id ?? payload.sessionId;
  if (typeof session !== "string" || !session || session.length > 512) return undefined;
  const names = { SessionStart: "session-start", UserPromptSubmit: "turn-start", PreToolUse: "tool-start",
    PostToolUse: "tool-complete", PostToolUseFailure: "tool-failed", PermissionRequest: "permission",
    Stop: "turn-end", Interrupt: "interrupt", SessionEnd: "session-end" };
  if (!Object.hasOwn(names, event)) return undefined;
  const tool = payload.tool_name ?? payload.toolName;
  const turn = payload.turn_id ?? payload.turnId;
  const call = payload.tool_use_id ?? payload.toolUseId;
  const input = payload.tool_input ?? payload.toolInput;
  const response = payload.tool_response ?? payload.toolResponse;
  const result = { adapter, sessionId: digest(session), event: names[event], sentAt: Date.now() };
  if (typeof turn === "string" && turn.length <= 512) result.turnId = digest(turn);
  if (typeof call === "string" && call.length <= 512) result.callId = digest(call);
  if (typeof tool === "string" && /^[a-zA-Z0-9_.:-]{1,100}$/.test(tool)) result.toolName = tool;
  // PostToolUse 在 Codex 中也可能表示失败；只有明确成功证据才能增加文件数。
  const output = typeof response === "string" ? response : response?.output;
  const failed = response?.is_error === true || response?.isError === true || response?.success === false
    || typeof response?.exit_code === "number" && response.exit_code !== 0;
  if (event === "PostToolUse" && failed) result.event = "tool-failed";
  if (event === "PostToolUse" && !failed) {
    const paths = [];
    if (tool === "apply_patch" && typeof output === "string" && /Success\. Updated the following files:/.test(output)) {
      for (const line of output.split(/\r?\n/)) {
        const match = /^[AMD] (.+)$/.exec(line);
        if (match) paths.push(match[1]);
      }
    } else if (["Edit", "Write", "MultiEdit"].includes(tool)
      && (adapter === "zcode" || response?.success === true || response?.is_error === false)) {
      const path = input?.file_path ?? input?.filePath ?? input?.path;
      if (typeof path === "string") paths.push(path);
    }
    const cwd = typeof payload.cwd === "string" ? payload.cwd : "";
    const files = paths.filter((path) => path.length > 0 && path.length <= 4096)
      .map((path) => digest(resolve(cwd, path).replaceAll("\\", "/")));
    if (files.length) result.editedFileIds = [...new Set(files)].slice(0, 100);
  }
  return result;
}
module.exports = { createExternalAiEvent };
