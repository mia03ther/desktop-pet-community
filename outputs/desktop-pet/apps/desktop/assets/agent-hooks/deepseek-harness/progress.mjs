import { createHash } from "node:crypto";
import { resolve } from "node:path";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const record = (value) => typeof value === "object" && value !== null;
const identity = (value) => typeof value === "string" && value.length > 0 && value.length <= 512;

// 只投影官方事件的身份、工具类别和成功文件摘要，不转发模型正文或工具参数。
export function createDshProgressBridge({ emit, now = Date.now }) {
  const states = new Map();
  const stateFor = (session) => {
    if (!record(session) || !identity(session.id)) return undefined;
    const id = digest(session.id);
    let state = states.get(id);
    if (!state) {
      state = { id, turn: undefined, failed: false, closed: false, lastHeartbeat: 0 };
      states.set(id, state);
      while (states.size > 100) states.delete(states.keys().next().value);
    }
    return state;
  };
  const send = (session, event, extras = {}) => {
    const state = stateFor(session);
    if (!state) return;
    emit({
      adapter: "deepseek-harness",
      sessionId: state.id,
      ...(state.turn === undefined ? {} : { turnId: digest(`${session.id}:${state.turn}`) }),
      event,
      ...extras,
      sentAt: now(),
    });
  };
  const toolFields = (exec) => {
    const fields = {};
    if (identity(exec.callId)) fields.callId = digest(`${exec.agent.session.id}:${exec.callId}`);
    if (typeof exec.name === "string" && /^[A-Za-z0-9_.:-]{1,100}$/.test(exec.name)) fields.toolName = exec.name;
    return fields;
  };
  return {
    sessionStart(payload) {
      const state = stateFor(payload?.agent?.session);
      if (state) { state.turn = undefined; state.failed = false; state.closed = false; }
      send(payload?.agent?.session, "session-start");
    },
    sessionEvent(session, event) {
      const state = stateFor(session);
      if (!state || !record(event)) return;
      if (event.type === "turn/start" && Number.isSafeInteger(event.data?.turn)) {
        state.turn = event.data.turn;
        state.failed = false;
        state.closed = false;
        send(session, "turn-start");
      } else if (event.type === "turn/end") {
        state.closed = true;
        const reason = event.data?.reason?.kind;
        if (reason === "error" || state.failed) send(session, "tool-failed");
        else if (reason === "aborted" || reason === "interrupted") send(session, "interrupt");
        else if (reason === "completed") send(session, "turn-end");
        else send(session, "tool-failed");
      }
    },
    status(payload) {
      const session = payload?.agent?.session;
      const state = stateFor(session);
      if (!state) return;
      if (payload.status === "running" && state.turn === undefined && !state.closed) send(session, "turn-start");
      if (payload.status === "idle" && !state.closed) {
        state.closed = true;
        // 空闲只证明停止；缺少正式结束事件时不冒称成功。
        send(session, state.failed ? "tool-failed" : "interrupt");
      }
    },
    stream(payload) {
      const session = payload?.agent?.session;
      const state = stateFor(session);
      if (!state || state.closed || payload?.frame?.type !== "chunk") return;
      // 只看事件类别，长时间思考时保活；不读取 reasoning/text 的内容。
      if (now() - state.lastHeartbeat >= 15_000 && state.turn !== undefined) {
        state.lastHeartbeat = now();
        send(session, "turn-start");
      }
    },
    error(payload) {
      const state = stateFor(payload?.agent?.session);
      if (state) { state.failed = true; state.closed = true; }
      send(payload?.agent?.session, "tool-failed");
    },
    permission(request) {
      if (record(request?.agent?.session)) send(request.agent.session, "permission");
    },
    toolStart(exec) {
      if (stateFor(exec?.agent?.session)?.closed) return;
      if (record(exec?.agent?.session)) send(exec.agent.session, "tool-start", toolFields(exec));
    },
    toolResult(exec, result) {
      if (stateFor(exec?.agent?.session)?.closed) return;
      if (!record(exec?.agent?.session) || !record(result) || typeof result.isError !== "boolean") return;
      const fields = toolFields(exec);
      const value = result.value;
      // 使用已接受的工具结果，不把 shell 输出或被拒绝的修改算作成功编辑。
      if (!result.isError && ["write", "edit"].includes(exec.name) && record(value)
        && typeof value.path === "string" && value.path.length > 0 && value.path.length <= 4096
        && typeof value.after === "string" && value.before !== value.after) {
        const cwd = typeof exec.agent.session.header?.cwd === "string" ? exec.agent.session.header.cwd : process.cwd();
        fields.editedFileIds = [digest(resolve(cwd, value.path).replaceAll("\\", "/"))];
      }
      send(exec.agent.session, result.isError ? "tool-failed" : "tool-complete", fields);
    },
    disposed(session) {
      send(session, "session-end");
      if (identity(session?.id)) states.delete(digest(session.id));
    },
  };
}

export function registerDesktopPetDshListeners(ctx, options) {
  let pending = Promise.resolve();
  let queued = 0;
  const bridge = createDshProgressBridge({
    ...options,
    emit(event) {
      if (queued >= 200) return;
      queued += 1;
      pending = pending.then(() => options.emit(event)).catch(() => {
        // 桌宠离线或桥接失败不能中断 Harness；下一条真实事件仍可重连。
      }).finally(() => { queued -= 1; });
    },
  });
  ctx.on("agent/session-start", (payload) => bridge.sessionStart(payload));
  ctx.on("agent/status", (payload) => bridge.status(payload));
  ctx.on("agent/assistant-stream", (payload) => bridge.stream(payload));
  ctx.on("agent/error", (payload) => bridge.error(payload));
  ctx.on("session/event", (session, event) => bridge.sessionEvent(session, event));
  ctx.on("session/disposed", (session) => bridge.disposed(session));
  ctx.on("approval/request", (request, next) => {
    bridge.permission(request);
    return next();
  });
  ctx.on("tools/execute", (exec, next) => {
    bridge.toolStart(exec);
    return next();
  });
  ctx.on("tools/result", (exec, result) => bridge.toolResult(exec, result));
  return { drain: () => pending };
}
