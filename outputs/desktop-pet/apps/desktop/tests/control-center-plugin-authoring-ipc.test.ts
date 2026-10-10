import assert from "node:assert/strict";
import { test } from "node:test";

import {
  installControlCenterPluginAuthoringIpcHandlers,
  type ControlCenterPluginAuthoringIpcDependencies,
  type ControlCenterPluginAuthoringIpcHandler,
} from "../src/control-center-plugin-authoring-ipc.js";

const event = { sender: { id: 7 } };
const input = { id: "local.my-reminder", title: "提醒", everyMinutes: 30, speech: "休息一下。" };
const output = {
  id: input.id, title: input.title, directoryPath: "/selected/new-package",
  manifestPath: "/selected/new-package/openpets.plugin.json", permissions: ["timer", "pet:speak"] as const,
};

function harness(overrides: Partial<ControlCenterPluginAuthoringIpcDependencies> = {}) {
  let handler: ControlCenterPluginAuthoringIpcHandler | undefined;
  let picks = 0;
  const created: Array<{ input: unknown; parent: string; signal?: AbortSignal }> = [];
  const lifecycle = installControlCenterPluginAuthoringIpcHandlers({
    registerHandle(_channel, registered) { handler = registered; },
    authorizeSender() {},
    isCurrentControlCenterSender() { return true; },
    getOwnerForSender() { return "current-window"; },
    async showOpenDialog() { picks += 1; return { canceled: false, filePaths: ["/selected"] }; },
    async createPackage(draft, parent, signal) { created.push({ input: draft, parent, signal }); return output; },
    ...overrides,
  });
  return { invoke: (value: unknown = input) => handler!(event, value), lifecycle, created, pickCount: () => picks };
}

test("插件制作 IPC 先检查发送者和输入，非法请求不弹选择器或写文件", async () => {
  const denied = harness({ authorizeSender() { throw new Error("发送者无权访问"); } });
  await assert.rejects(denied.invoke());
  assert.equal(denied.pickCount(), 0);
  assert.equal(denied.created.length, 0);
  const invalid = harness();
  for (const value of [null, { ...input, entry: "run.js" }, { ...input, everyMinutes: 0 }, { ...input, speech: "a".repeat(141) }]) {
    await assert.rejects(invalid.invoke(value));
  }
  assert.equal(invalid.pickCount(), 0);
  assert.equal(invalid.created.length, 0);
});

test("取消原生保存不会制作，成功只使用原生选定路径及经过校验的输入", async () => {
  const cancelled = harness({ async showOpenDialog() { return { canceled: true, filePaths: ["/unused"] }; } });
  assert.equal(await cancelled.invoke(), null);
  assert.equal(cancelled.created.length, 0);
  const successful = harness();
  assert.deepEqual(await successful.invoke({ ...input, title: "  提醒  ", author: " 作者 " }), output);
  assert.equal(successful.created[0]!.parent, "/selected");
  assert.equal((successful.created[0]!.input as { author: string }).author, "作者");
  assert.equal(successful.created[0]!.signal?.aborted, false);
});

test("窗口关闭或替换后延迟的选择结果不会写入，单窗口防止重复制作", async () => {
  let choose!: (selection: { canceled: boolean; filePaths: string[] }) => void;
  const pending = harness({
    showOpenDialog() { return new Promise((complete) => { choose = complete; }); },
  });
  const operation = pending.invoke();
  await assert.rejects(pending.invoke());
  pending.lifecycle.cancelForSender(event.sender.id);
  choose({ canceled: false, filePaths: ["/selected"] });
  assert.equal(await operation, null);
  assert.equal(pending.created.length, 0);

  let current = true;
  const replaced = harness({
    isCurrentControlCenterSender() { return current; },
    async showOpenDialog() { current = false; return { canceled: false, filePaths: ["/selected"] }; },
  });
  assert.equal(await replaced.invoke(), null);
  assert.equal(replaced.created.length, 0);
});

test("销毁生命周期终止写入，正常失败会反馈且允许重试", async () => {
  let signal: AbortSignal | undefined;
  const pending = harness({
    createPackage(_draft, _parent, activeSignal) {
      signal = activeSignal;
      return new Promise((_complete, reject) => {
        activeSignal!.addEventListener("abort", () => reject(new Error("已取消")), { once: true });
      });
    },
  });
  const operation = pending.invoke();
  await Promise.resolve();
  assert.equal(signal?.aborted, false);
  pending.lifecycle.dispose();
  assert.equal(await operation, null);
  assert.equal(signal?.aborted, true);
  assert.equal(await pending.invoke(), null);

  let attempts = 0;
  const retry = harness({ async createPackage() {
    attempts += 1;
    if (attempts === 1) throw new Error("保存失败");
    return output;
  } });
  await assert.rejects(retry.invoke(), /保存失败/);
  assert.deepEqual(await retry.invoke(), output);
});
