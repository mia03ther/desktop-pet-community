import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PersonaDistillationService, validatePersonaDistillationInput } from "../src/persona-distillation.js";
import { CompanionPersonaService } from "../src/companion-persona.js";
import { CompanionAiTasksService } from "../src/companion-ai-tasks.js";
import type { CompanionAiTaskPreview } from "../src/companion-ai-types.js";
import type { PetAssistantTextModel, PetAssistantTextModelRequest, PetAssistantTextModelResponse } from "../src/pet-assistant-types.js";

const input = { profileId: "profile-a", name: "小岚", focus: "日常说话习惯", material: "来源：自己写的记录。她会称呼用户同学，给建议前先问用户要不要。" };
const response: PetAssistantTextModelResponse = { type: "text", text: "# 小岚\n称呼用户同学。建议前先确认意愿。\n## 局限\n仅根据给出的记录推断。", usage: { inputTokens: 10, outputTokens: 8, totalTokens: 18 } };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}
function service(model: PetAssistantTextModel, timeout = 120_000) {
  return new PersonaDistillationService({ getProfiles: () => [{ id: input.profileId }], createModel: () => model, timeoutMs: timeout });
}

describe("人设资料提炼", () => {
  it("选择既有配置的固定操作、仅发送可见素材、返回草稿但不保存或启用", async () => {
    const directory = mkdtempSync(join(tmpdir(), "persona-distill-"));
    try {
      const persona = new CompanionPersonaService({ statePath: join(directory, "persona.json") });
      persona.saveText({ mode: "global-md", content: "# 原人设\n简短回答。" });
      persona.setEnabled(true);
      const previous = persona.getDocument();
      const requests: PetAssistantTextModelRequest[] = [];
      const distiller = service({
        beginOperation: async () => ({ generate: (request) => { requests.push(request); return response; } }),
        generate: () => { throw new Error("必须使用固定操作"); },
      });
      const draft = await distiller.generate(input, new AbortController().signal);
      assert.equal(draft.mode, "distilled-md");
      assert.equal(draft.content, response.text);
      assert.equal(draft.usage?.totalTokens, 18);
      assert.equal(distiller.getEvidence().length, 0, "结束后不继续显示工作中");
      assert.equal(distiller.getTokenUsage()[0]?.inputTokens, 10);
      assert.equal(JSON.stringify(distiller.getTokenUsage()).includes(input.material), false);
      assert.deepEqual(requests[0].tools, []);
      const userMessage = requests[0].messages[1];
      assert.ok(userMessage.role === "user");
      assert.deepEqual(JSON.parse(userMessage.content), { name: input.name, focus: input.focus, material: input.material });
      assert.deepEqual(persona.getDocument(), previous, "生成不能提交人设存档");
      persona.saveText({ mode: draft.mode, content: draft.content });
      assert.equal(persona.getSnapshot().enabled, false, "明确保存草稿也不自动启用");
      persona.setEnabled(true);
      assert.equal(persona.getSnapshot().mode, "distilled-md");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("无效请求或不可用来源在模型调用前拒绝，不自动截断素材", async () => {
    let calls = 0;
    const distiller = service({ generate: () => { calls += 1; return response; } });
    for (const bad of [null, [], { ...input, command: "运行脚本" }, { ...input, profileId: "missing" },
      { ...input, name: "x".repeat(121) }, { ...input, material: " " }, { ...input, material: "中".repeat(10_923) },
      { ...input, material: "正文\0" }, { ...input, material: "\ud800" }]) {
      await assert.rejects(distiller.generate(bad, new AbortController().signal));
    }
    assert.equal(calls, 0);
    assert.equal(validatePersonaDistillationInput({ ...input, material: "x".repeat(32 * 1024) }).material.length, 32 * 1024);
  });

  it("工具请求、空白和超完整提示词上限的输出不能作为草稿交付", async () => {
    const outputs: PetAssistantTextModelResponse[] = [
      { type: "tool-calls", toolCalls: [{ id: "bad", name: "shell", arguments: {} }] },
      { type: "text", text: " " },
      { type: "text", text: "角色".repeat(2000) },
      { type: "text", text: "正文\0" },
    ];
    for (const output of outputs) {
      await assert.rejects(service({ generate: () => output }).generate(input, new AbortController().signal));
    }
  });

  it("来源异常不暴露原接口消息，退出取消在途工作并拒绝新生成", async () => {
    const failing = service({ generate: () => { throw new Error("SECRET_SAMPLE at https://private.test/path"); } });
    await assert.rejects(failing.generate(input, new AbortController().signal), (failure: unknown) => {
      assert.ok(failure instanceof Error);
      assert.doesNotMatch(failure.message, /SECRET_SAMPLE|private.test/);
      assert.match(failure.message, /检查连接/);
      return true;
    });
    const waiting = deferred<PetAssistantTextModelResponse>();
    const distiller = service({ generate: () => waiting.promise });
    const generating = distiller.generate(input, new AbortController().signal);
    distiller.dispose();
    await assert.rejects(generating);
    assert.equal(distiller.getEvidence().length, 0);
    await assert.rejects(distiller.generate(input, new AbortController().signal));
    waiting.resolve(response);
  });

  it("取消与总时限不等待忽略信号的来源，迟到回复不再交付", async () => {
    const waiting = deferred<PetAssistantTextModelResponse>();
    const controller = new AbortController();
    const distiller = service({ generate: () => waiting.promise });
    const generating = distiller.generate(input, controller.signal);
    assert.equal(distiller.getEvidence()[0]?.profileId, input.profileId);
    assert.equal(JSON.stringify(distiller.getEvidence()).includes(input.material), false);
    controller.abort();
    await assert.rejects(generating);
    assert.equal(distiller.getEvidence().length, 0);
    waiting.resolve(response);
    const slow = deferred<PetAssistantTextModelResponse>();
    await assert.rejects(service({ generate: () => slow.promise }, 10).generate(input, new AbortController().signal));
    slow.resolve(response);
    let calls = 0;
    await assert.rejects(service({ generate: () => { calls += 1; return response; } }).generate(input, controller.signal));
    assert.equal(calls, 0);
  });

  it("已启用的人设覆盖本桌宠多来源分析和汇总，进行中的任务保持开始时的人设", async () => {
    const directory = mkdtempSync(join(tmpdir(), "persona-analysis-"));
    const requests: PetAssistantTextModelRequest[] = [];
    let style = "称呼用户同学，保持简短。";
    const firstReply = deferred<PetAssistantTextModelResponse>();
    const tasks = new CompanionAiTasksService({
      statePath: join(directory, "tasks.json"),
      getProfiles: () => [{ id: "a", label: "甲" }, { id: "b", label: "乙" }],
      getPersonaStyle: () => style,
      createModel: (profileId) => ({ generate: (request) => {
        requests.push(request);
        return profileId === "a" && requests.length <= 2 ? firstReply.promise : response;
      } }),
    });
    try {
      const preview: CompanionAiTaskPreview = { id: "preview", problem: "内存占用高", context: "只读数值", expiresAt: Date.now() + 100_000 };
      const task = tasks.startTask(preview, ["a", "b"], "a");
      style = "新的称呼不应进入在途任务。";
      firstReply.resolve(response);
      const deadline = Date.now() + 2000;
      while (tasks.getTasks().find((entry) => entry.id === task.id)?.state === "running") {
        assert.ok(Date.now() < deadline);
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
      assert.equal(requests.length, 3);
      for (const request of requests) {
        const systemMessage = request.messages[0];
        assert.ok(systemMessage.role === "system");
        assert.match(systemMessage.content, /称呼用户同学/);
        assert.doesNotMatch(systemMessage.content, /新的称呼/);
        assert.match(systemMessage.content, /没有工具.*执行/);
        assert.deepEqual(request.tools, []);
      }
      assert.equal(tasks.getTasks()[0].state, "completed");
    } finally {
      tasks.dispose();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
