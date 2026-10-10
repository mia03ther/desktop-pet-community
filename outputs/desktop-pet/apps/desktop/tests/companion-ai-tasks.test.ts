import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CompanionAiTasksService } from "../src/companion-ai-tasks.js";
import type { CompanionAiTask } from "../src/companion-ai-types.js";
import type { CompanionToolsSnapshot } from "../src/companion-tools-types.js";
import { initializePluginPlatformSettings, getPluginPlatformSettings, selectProviderProfile, updateProviderProfile } from "../src/plugin-platform-settings.js";
import { TextModelClient } from "../src/text-model-client.js";
import { hostSecretsOwner, providerSecretKey } from "../src/provider-service.js";
import type { PluginSecretsStore } from "../src/plugin-secrets.js";
import type { PetAssistantTextModel, PetAssistantTextModelRequest, PetAssistantTextModelResponse } from "../src/pet-assistant-types.js";
import { configureProvider } from "./provider-test-helpers.js";

const directory = mkdtempSync(join(tmpdir(), "openpets-ai-tasks-"));
const services: CompanionAiTasksService[] = [];
const now = 1_234_000;
const profiles = [{ id: "source-a", label: "来源甲" }, { id: "source-b", label: "来源乙" }, { id: "source-c", label: "来源丙" }];
const snapshot: CompanionToolsSnapshot = {
  diagnostics: {
    version: 1, sampledAt: now - 4_000, sampleDurationMs: 300, cpuPercent: 27,
    memory: { totalBytes: 16_000, availableBytes: 4_000, usedPercent: 75 },
    disks: [{ name: "C:", totalBytes: 100_000, freeBytes: 10_000, usedPercent: 90 }],
    processes: [{ pid: 12, name: "private-process-name", executablePath: "C:/private/process.exe", workingSetBytes: 100, cpuPercent: 2 }],
    startupItems: [{ id: "startup", name: "private-startup-name", source: "registry", command: "private-startup-command" }],
    installedApps: [{ id: "app", name: "private-installed-app", version: "1", publisher: "private-publisher", installLocation: "C:/private/app", source: "registry" }],
    installedAppsComplete: true,
    windows: [{ handle: "123", title: "private-window-title", pid: 12, processName: "private-window-process", executablePath: "C:/private/window.exe", isForeground: true }],
    collectionIssues: ["private-error-path"], coverage: ["private-coverage"], findings: [],
  }, findings: [], resourceRecommendations: [], uninstallRecords: [], settings: { monitorEnabled: false, ignoredFindingIds: [], snoozedUntil: {} }, lastError: null, scanning: false,
};
const textResponse = (text = "采样时内存占用较高，仍需要进一步确认原因。"): PetAssistantTextModelResponse => ({ type: "text", text });

function service(name: string, createModel: (profileId: string) => PetAssistantTextModel): CompanionAiTasksService {
  const value = new CompanionAiTasksService({ statePath: join(directory, `${name}.json`), getProfiles: () => profiles, createModel, now: () => now });
  services.push(value);
  return value;
}
async function terminal(value: CompanionAiTasksService, id: string): Promise<CompanionAiTask> {
  const deadline = Date.now() + 2_000;
  for (;;) {
    const task = value.getTasks().find((entry) => entry.id === id);
    assert(task);
    if (task.state !== "running") return task;
    assert(Date.now() < deadline, "任务应在测试时限内进入终态");
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}
function preview(value: CompanionAiTasksService) { return value.previewDiagnostics(snapshot, "  电脑卡顿，请分析  "); }

async function main(): Promise<void> {
  try {
    const singleRequests: PetAssistantTextModelRequest[] = [];
    let singleOperations = 0;
    const single = service("single", () => ({
      beginOperation() {
        singleOperations += 1;
        return { generate(request) { singleRequests.push(request); return { ...textResponse(), usage: { inputTokens: 10, outputTokens: 3, totalTokens: 13 } }; } };
      },
      generate() { throw new Error("任务必须使用捕获后的操作"); },
    }));
    const inspectedPreview = preview(single);
    const context = JSON.parse(inspectedPreview.context) as Record<string, unknown>;
    assert.equal(inspectedPreview.problem, "电脑卡顿，请分析");
    assert.equal(context.ageSeconds, 4);
    assert.equal(context.cpuPercent, 27);
    assert.deepEqual(context.memory, snapshot.diagnostics?.memory);
    assert.deepEqual(context.disks, snapshot.diagnostics?.disks);
    assert.equal(context.collectionIssueCount, 1);
    assert.doesNotMatch(inspectedPreview.context, /private-|processes|startupItems|installedApps|windows|command|executablePath/);
    assert.throws(() => single.previewDiagnostics({ ...snapshot, diagnostics: null }, "问题"), /先.*采样/);
    assert.throws(() => single.previewDiagnostics(snapshot, " "), /描述/);
    assert.throws(() => single.startTask({ ...inspectedPreview, expiresAt: now }, ["source-a"], "source-a"), /过期/);
    assert.throws(() => single.startTask(inspectedPreview, ["source-a", "source-a"], "source-a"), /不同/);
    assert.throws(() => single.startTask(inspectedPreview, ["source-a"], "source-b"), /汇总来源/);
    assert.throws(() => single.startTask(inspectedPreview, ["missing"], "missing"), /不可用/);
    assert.equal(single.getTasks().length, 0);
    const singleTask = single.startTask(inspectedPreview, ["source-a"], "source-a");
    const singleFinished = await terminal(single, singleTask.id);
    assert.equal(singleFinished.state, "completed");
    assert.equal(singleFinished.summary, null);
    assert.equal(singleOperations, 1);
    assert.equal(singleRequests.length, 1);
    assert.deepEqual(singleRequests[0]?.tools, []);
    const singleRules = singleRequests[0]?.messages[0];
    assert(singleRules?.role === "system");
    assert.match(singleRules.content, /没有工具.*执行/);
    assert.deepEqual(single.getTokenUsage(), [{ profileId: "source-a", inputTokens: 10, outputTokens: 3, source: "provider-response", recordedAt: now }]);
    singleFinished.answers[0]!.text = "外部修改不应改变历史";
    assert.notEqual(single.getTasks()[0]?.answers[0]?.text, singleFinished.answers[0]?.text);
    assert.equal(single.cancelTask(singleTask.id), false);

    // 两个真实 TextModelClient 使用原传输和配置所有者，汇总复用主来源的同一操作。
    initializePluginPlatformSettings(directory);
    configureProvider({ id: "source-a", label: "来源甲", adapter: "openai-compatible-text", model: "model-a", baseUrl: "https://task-a.test/v1", secretRef: "source-a" }, "text");
    configureProvider({ id: "source-b", label: "来源乙", adapter: "openai-compatible-text", model: "model-b", baseUrl: "https://task-b.test/v1", secretRef: "source-b" }, "text");
    selectProviderProfile("text", "source-b");
    const fakeSecrets = { get: async (owner: string, key: string) => {
      assert.equal(owner, hostSecretsOwner);
      assert([providerSecretKey("source-a"), providerSecretKey("source-b")].includes(key));
      return key === providerSecretKey("source-a") ? "fixture-a" : "fixture-b";
    } } as unknown as PluginSecretsStore;
    const dualRequests: Array<{ url: string; model: unknown; authorization: string | null; body: Record<string, unknown> }> = [];
    const dual = service("dual", (profileId) => new TextModelClient(fakeSecrets, { profileId, fetchImpl: async (input, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      dualRequests.push({ url: String(input), model: body.model, authorization: new Headers(init?.headers).get("authorization"), body });
      if (dualRequests.length === 1) {
        updateProviderProfile("source-a", { model: "model-a-edited", baseUrl: "https://task-a-edited.test/v1" });
        selectProviderProfile("text", "source-a");
      }
      return new Response(JSON.stringify({ choices: [{ message: { content: String(input).includes("task-a.test") ? "甲来源的只读分析" : "乙来源的只读分析" } }], usage: { prompt_tokens: 6, completion_tokens: 2, total_tokens: 8 } }), { status: 200 });
    } }));
    const dualTask = dual.startTask(preview(dual), ["source-a", "source-b"], "source-a");
    assert.throws(() => dual.startTask(preview(dual), ["source-b"], "source-b"), /已有分析任务/);
    const dualFinished = await terminal(dual, dualTask.id);
    assert.equal(dualFinished.state, "completed");
    assert.equal(dualFinished.summary?.state, "completed");
    assert.deepEqual(dualRequests.map(({ url, model, authorization }) => ({ url, model, authorization })), [
      { url: "https://task-a.test/v1/chat/completions", model: "model-a", authorization: "Bearer fixture-a" },
      { url: "https://task-b.test/v1/chat/completions", model: "model-b", authorization: "Bearer fixture-b" },
      { url: "https://task-a.test/v1/chat/completions", model: "model-a", authorization: "Bearer fixture-a" },
    ]);
    for (const call of dualRequests) assert.equal(Object.hasOwn(call.body, "tools"), false);
    const summaryMessages = dualRequests[2]?.body.messages as Array<{ role: string; content: string }>;
    const summaryPrompt = JSON.parse(summaryMessages[1]!.content) as { analyses: Array<{ label: string; text: string; state: string }> };
    assert.deepEqual(summaryPrompt.analyses.map(({ state }) => state), ["completed", "completed"]);
    assert.equal(getPluginPlatformSettings().selections.text, "source-a");
    assert.equal(dual.getEvidence().length, 3);
    assert.equal(dual.getTokenUsage().length, 3);

    const partialCalls: string[] = [];
    const partial = service("partial", (id) => ({ generate(request) {
      partialCalls.push(id);
      if (id === "source-b") throw new Error("fixture-secret-and-private-endpoint");
      if (partialCalls.length === 3) {
        const message = request.messages[1];
        assert(message?.role === "user");
        assert.match(message.content, /"state":"failed"/);
      }
      return textResponse();
    } }));
    const partialFinished = await terminal(partial, partial.startTask(preview(partial), ["source-a", "source-b"], "source-a").id);
    assert.equal(partialFinished.state, "partial");
    assert.equal(partialFinished.answers[1]?.state, "failed");
    assert.doesNotMatch(partialFinished.answers[1]?.error ?? "", /fixture-secret|private-endpoint/);
    assert.equal(partialFinished.summary?.state, "completed");
    assert.deepEqual(partialCalls, ["source-a", "source-b", "source-a"]);

    const failedLeaderCalls: string[] = [];
    const failedLeader = service("failed-leader", (id) => ({ generate() {
      failedLeaderCalls.push(id);
      if (id === "source-a") throw Object.assign(new Error("fixture-timeout"), { code: "provider.timeout" });
      return textResponse();
    } }));
    const failedLeaderFinished = await terminal(failedLeader, failedLeader.startTask(preview(failedLeader), ["source-a", "source-b"], "source-a").id);
    assert.equal(failedLeaderFinished.state, "partial");
    assert.equal(failedLeaderFinished.summary?.profileId, "source-a");
    assert.equal(failedLeaderFinished.summary?.state, "failed");
    assert.match(failedLeaderFinished.summary?.error ?? "", /没有自动换用/);
    assert.match(failedLeaderFinished.answers[0]?.error ?? "", /超时/);
    assert.deepEqual(failedLeaderCalls, ["source-a", "source-b"]);

    const summaryFailureCalls: string[] = [];
    const summaryFailure = service("summary-failure", (id) => ({ generate() {
      summaryFailureCalls.push(id);
      if (summaryFailureCalls.length === 3) throw new Error("汇总失败");
      return textResponse();
    } }));
    const summaryFailureFinished = await terminal(summaryFailure, summaryFailure.startTask(preview(summaryFailure), ["source-a", "source-b"], "source-a").id);
    assert.equal(summaryFailureFinished.state, "partial");
    assert.equal(summaryFailureFinished.summary?.state, "failed");
    assert.deepEqual(summaryFailureCalls, ["source-a", "source-b", "source-a"]);

    const allFailed = service("all-failed", () => ({ generate() { throw new Error("分析失败"); } }));
    const allFailedFinished = await terminal(allFailed, allFailed.startTask(preview(allFailed), ["source-a", "source-b"], "source-a").id);
    assert.equal(allFailedFinished.state, "failed");
    assert.equal(allFailedFinished.summary, null);

    let toolCalls = 0;
    const tools = service("tools", () => ({ generate(request) {
      toolCalls += 1;
      assert.deepEqual(request.tools, []);
      return { type: "tool-calls", text: "已经删除并修复电脑。", toolCalls: [{ id: "fake-delete", name: "shell", arguments: { command: "delete" } }] };
    } }));
    const toolsFinished = await terminal(tools, tools.startTask(preview(tools), ["source-a"], "source-a").id);
    assert.equal(toolsFinished.state, "failed");
    assert.equal(toolsFinished.answers[0]?.text, "");
    assert.match(toolsFinished.answers[0]?.error ?? "", /不会执行工具/);
    assert.equal(toolCalls, 1);

    let cancelStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => { cancelStarted = resolve; });
    const cancellation = service("cancelled", () => ({ generate(_request, signal) {
      cancelStarted?.();
      return new Promise<PetAssistantTextModelResponse>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(Object.assign(new Error("取消夹具"), { code: "provider.cancelled" })), { once: true });
      });
    } }));
    const cancelTask = cancellation.startTask(preview(cancellation), ["source-a"], "source-a");
    await started;
    assert.equal(cancellation.cancelTask("other-task"), false);
    assert.equal(cancellation.cancelTask(cancelTask.id), true);
    const cancelled = await terminal(cancellation, cancelTask.id);
    assert.equal(cancelled.state, "cancelled");
    assert.equal(cancelled.answers[0]?.state, "cancelled");
    assert.equal(cancelled.answers[0]?.text, "");

    let releaseResponse: ((response: PetAssistantTextModelResponse) => void) | undefined;
    const lateResponse = service("late-response", () => ({
      generate: () => new Promise<PetAssistantTextModelResponse>((resolve) => { releaseResponse = resolve; }),
    }));
    const lateResponseTask = lateResponse.startTask(preview(lateResponse), ["source-a"], "source-a");
    assert(releaseResponse);
    assert.equal(lateResponse.cancelTask(lateResponseTask.id), true);
    releaseResponse(textResponse("迟到结果不能把已取消任务标成完成。"));
    const lateResponseFinished = await terminal(lateResponse, lateResponseTask.id);
    assert.equal(lateResponseFinished.state, "cancelled");
    assert.equal(lateResponseFinished.answers[0]?.state, "cancelled");
    assert.equal(lateResponseFinished.answers[0]?.text, "");

    // 取消发生在操作捕获期间，迟到捕获结果也不能再触发模型请求。
    let releaseOperation: ((model: PetAssistantTextModel) => void) | undefined;
    let lateGenerateCalls = 0;
    const late = service("late-operation", () => ({
      beginOperation: () => new Promise<PetAssistantTextModel>((resolve) => { releaseOperation = resolve; }),
      generate() { throw new Error("不应使用未捕获操作"); },
    }));
    const lateTask = late.startTask(preview(late), ["source-a"], "source-a");
    assert.equal(late.cancelTask(lateTask.id), true);
    assert(releaseOperation);
    releaseOperation({ generate() { lateGenerateCalls += 1; return textResponse(); } });
    assert.equal((await terminal(late, lateTask.id)).state, "cancelled");
    assert.equal(lateGenerateCalls, 0);

    // 终态历史可在重启后恢复，getter 的外部修改不会污染磁盘记录。
    const persisted = JSON.parse(readFileSync(join(directory, "dual.json"), "utf8")) as { version: number; tasks: CompanionAiTask[] };
    assert.equal(persisted.version, 1);
    assert.equal(persisted.tasks[0]?.state, "completed");
    const restored = service("dual", () => { throw new Error("加载历史不能调用模型"); });
    assert.deepEqual(restored.getTasks(), dual.getTasks());
    assert.equal(restored.getStorageError(), null);
    assert.equal(restored.cancelTask(dualTask.id), false);
    writeFileSync(join(directory, "interrupted.json"), JSON.stringify({ version: 1, tasks: [{ ...persisted.tasks[0], state: "running", answers: [{ ...persisted.tasks[0]!.answers[0], state: "running" }], summary: null }] }));
    const interrupted = service("interrupted", () => { throw new Error("重启不应续跑旧任务"); });
    assert.equal(interrupted.getTasks()[0]?.state, "cancelled");
    assert.equal(interrupted.getTasks()[0]?.answers[0]?.state, "cancelled");
    assert.match(interrupted.getTasks()[0]?.answers[0]?.error ?? "", /已重启/);
    writeFileSync(join(directory, "invalid.json"), "not-json");
    const invalid = service("invalid", () => ({ generate: () => textResponse() }));
    assert.equal(invalid.getTasks().length, 0);
    assert.match(invalid.getStorageError() ?? "", /读取失败/);
    assert.equal(readFileSync(join(directory, "invalid.json"), "utf8"), "not-json");
  } finally {
    for (const value of services) value.dispose();
    rmSync(directory, { recursive: true, force: true });
  }
}

main().then(() => console.log("协同 AI 任务行为测试通过。"), (error) => { console.error(error); process.exitCode = 1; });
