import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { CompanionFileLibrary } from "../src/companion-file-library.js";
import { CompanionFilesService } from "../src/companion-files.js";
import { respondToFileLocation } from "../src/companion-file-location.js";
import { CompanionFileClassification } from "../src/companion-file-classification.js";
import { PetAssistantService } from "../src/pet-assistant-service.js";
import type { CompanionFileLibraryAiEntry } from "../src/companion-file-library-ai-types.js";
import type { PetAssistantCapabilityRuntime, PetAssistantTextModel, PetAssistantTextModelRequest, PetAssistantTextModelResponse } from "../src/pet-assistant-types.js";

async function fixture(files: Readonly<Record<string, string>>) {
  const directory = await fs.mkdtemp(path.join(process.cwd(), "companion-file-assistance-test-"));
  const root = path.join(directory, "selected");
  const data = path.join(directory, "data");
  await fs.mkdir(root);
  await fs.mkdir(data);
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  const library = new CompanionFileLibrary(data);
  await library.addRoot(root);
  return { directory, root, data, library };
}

async function removeFixture(directory: string): Promise<void> {
  const resolved = path.resolve(directory);
  assert.equal(path.dirname(resolved), path.resolve(process.cwd()));
  assert.ok(path.basename(resolved).startsWith("companion-file-assistance-test-"));
  await fs.rm(resolved, { recursive: true, force: true });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function aiEntries(library: CompanionFileLibrary): CompanionFileLibraryAiEntry[] {
  return library.search("").matches.map((entry) => ({ entryId: entry.id, name: entry.name, fileType: entry.fileType, category: entry.category }));
}

function response(entryId: string, usage: PetAssistantTextModelResponse["usage"] = { inputTokens: 31, outputTokens: 17, totalTokens: 48 }): PetAssistantTextModelResponse {
  return { type: "text", text: JSON.stringify({ items: [{ entryId, category: "工作" }], summary: "只依据文件名；内容尚未核实。" }), ...(usage === undefined ? {} : { usage }) };
}

function classifier(model: PetAssistantTextModel) {
  return new CompanionFileClassification({ getProfiles: () => [{ id: "source-a" }], createModel: (id) => { assert.equal(id, "source-a"); return model; } });
}

test("文件助手未启用时不读取文件库，普通聊天不受影响", async () => {
  const current = await fixture({ "考试复习.txt": "测试资料" });
  const revealed: string[] = [];
  current.library.getSnapshot = () => { throw new Error("未启用时不应读取库"); };
  try {
    const signal = new AbortController().signal;
    assert.match((await respondToFileLocation("考试复习.txt在哪", current.library, (target) => revealed.push(target), signal, () => false))!, /安装并启用/);
    assert.equal(await respondToFileLocation("你好", current.library, (target) => revealed.push(target), signal, () => false), null);
    assert.deepEqual(revealed, []);
  } finally { await removeFixture(current.directory); }
});

test("文件定位等待路径时停用插件，迟到结果不会打开文件夹", async () => {
  const current = await fixture({ "考试复习.txt": "测试资料" });
  const revealed: string[] = [];
  let enabled = true;
  const resolveEntry = current.library.resolveEntry.bind(current.library);
  current.library.resolveEntry = async (id) => {
    const target = await resolveEntry(id);
    enabled = false;
    return target;
  };
  try {
    const answer = await respondToFileLocation("考试复习.txt在哪", current.library, (target) => revealed.push(target), new AbortController().signal, () => enabled);
    assert.match(answer!, /安装并启用/);
    assert.deepEqual(revealed, []);
  } finally { await removeFixture(current.directory); }
});

test("启用文件助手后唯一定位跳过模型，普通聊天继续模型并沿用对话", async () => {
  const current = await fixture({ "考试复习.txt": "只属于原文件的正文，定位不需要上传。" });
  const requests: PetAssistantTextModelRequest[] = [];
  const revealed: string[] = [];
  let begun = 0;
  let snapshots = 0;
  const runtime: PetAssistantCapabilityRuntime = {
    snapshot: () => { snapshots += 1; return { capabilities: [] }; },
    execute: () => { throw new Error("此场景不能执行插件"); },
  };
  const assistant = new PetAssistantService({
    beginOperation: () => {
      begun += 1;
      return { generate: (request) => { requests.push(request); return { type: "text", text: "今天也陪你一起学习。" }; } };
    },
    generate: () => { throw new Error("普通聊天必须使用固定来源操作"); },
  }, runtime, { localResponse: (message, signal) => respondToFileLocation(message, current.library, (target) => revealed.push(target), signal, () => true) });
  try {
    const before = await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8");
    const located = await assistant.startTurn("file-and-chat", "考试复习.txt在哪？");
    assert.equal(located.status, "completed");
    assert.match(located.response ?? "", /已请求系统打开所在文件夹/u);
    assert.deepEqual(revealed, [path.join(current.root, "考试复习.txt")]);
    assert.equal(begun, 0, "本地定位不需要配置或创建模型操作");
    assert.equal(snapshots, 0, "本地定位不加载插件能力");
    assert.equal(requests.length, 0);
    const chatted = await assistant.startTurn("file-and-chat", "陪我聊聊今天的学习计划");
    assert.equal(chatted.status, "completed");
    assert.equal(chatted.response, "今天也陪你一起学习。");
    assert.equal(begun, 1);
    assert.equal(snapshots, 1);
    assert.equal(requests.length, 1);
    assert.ok(requests[0]!.messages.some((message) => message.role === "assistant" && message.content === located.response), "定位回复保留在同一个对话历史");
    assert.equal(JSON.stringify(requests[0]).includes(current.root), false, "后续聊天不携带定位所得真实路径");
    assert.equal(await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8"), before);
    assert.equal(await fs.readFile(path.join(current.root, "考试复习.txt"), "utf8"), "只属于原文件的正文，定位不需要上传。");
  } finally {
    await assistant.stop();
    await removeFixture(current.directory);
  }
});

test("同名多结果、无结果和过期索引不会误开文件，也无需 AI", async () => {
  const current = await fixture({ "甲/会议纪要.md": "甲的会议", "乙/会议纪要.md": "乙的会议", "独有记录.txt": "原始内容" });
  const revealed: string[] = [];
  let modelCalls = 0;
  const assistant = new PetAssistantService({ generate: () => { modelCalls += 1; throw new Error("文件定位不能请求 AI"); } }, {
    snapshot: () => { throw new Error("文件定位不能请求插件"); },
    execute: () => { throw new Error("文件定位不能执行插件"); },
  }, { localResponse: (message, signal) => respondToFileLocation(message, current.library, (target) => revealed.push(target), signal, () => true) });
  try {
    const many = await assistant.startTurn("multiple", "会议纪要.md在哪");
    assert.equal(many.status, "completed");
    assert.match(many.response ?? "", /2 个匹配/u);
    assert.deepEqual(revealed, []);
    const none = await assistant.startTurn("none", "不存在的文件在哪");
    assert.equal(none.status, "completed");
    assert.match(none.response ?? "", /当前索引没有找到/u);
    await fs.rename(path.join(current.root, "独有记录.txt"), path.join(current.root, "已移动记录.txt"));
    const stale = await assistant.startTurn("stale", "独有记录.txt在哪");
    assert.equal(stale.status, "completed");
    assert.match(stale.response ?? "", /当前无法定位/u);
    assert.deepEqual(revealed, []);
    assert.equal(modelCalls, 0);
    await current.library.removeRoot(current.library.getSnapshot().roots[0]!.id);
    const empty = await assistant.startTurn("no-root", "独有记录.txt在哪");
    assert.match(empty.response ?? "", /添加要查找的文件夹/u);
    assert.equal(modelCalls, 0);
    assert.equal(await fs.readFile(path.join(current.root, "已移动记录.txt"), "utf8"), "原始内容");
  } finally {
    await assistant.stop();
    await removeFixture(current.directory);
  }
});

test("真实推荐移动和撤销刷新后，旧位置丢失引用不影响唯一文件定位", async () => {
  const current = await fixture({ "索引演示.txt": "推荐移动和撤销都必须保留正文" });
  const files = new CompanionFilesService({ journalDirectory: path.join(current.directory, "journal") });
  const revealed: string[] = [];
  const signal = new AbortController().signal;
  try {
    const entry = current.library.search("索引演示.txt").matches[0]!;
    await current.library.applyRecommendations({ items: [{ entryId: entry.id, category: "工作" }] });
    const recommendations = current.library.getSnapshot().entries.map((item) => ({ relativePath: item.relativePath, category: item.category }));
    const plan = await files.createRecommendedOrganizePlan(current.root, recommendations);
    const operation = await files.executePlan(plan.id);
    assert.equal(operation.status, "completed");
    await current.library.refresh();
    assert.equal(current.library.search("索引演示.txt").totalMatches, 2, "界面默认仍展示新位置和失效旧引用");
    assert.equal(current.library.search("索引演示.txt", { excludeMissing: false }).totalMatches, 2);
    assert.equal(current.library.search("索引演示.txt", { excludeMissing: true }).totalMatches, 1);
    for (const invalid of ["true", 1, null]) {
      assert.throws(() => Reflect.apply(current.library.search, current.library, ["索引演示.txt", { excludeMissing: invalid }]));
    }
    const movedPath = path.join(current.root, "工作", "索引演示.txt");
    const moved = await respondToFileLocation("索引演示.txt在哪？", current.library, (target) => revealed.push(target), signal, () => true);
    assert.match(moved ?? "", /已请求系统打开所在文件夹/u);
    assert.deepEqual(revealed, [movedPath]);
    assert.equal(await fs.readFile(movedPath, "utf8"), "推荐移动和撤销都必须保留正文");
    assert.equal((await files.undoOperation(operation.id)).status, "undone");
    await current.library.refresh();
    const restoredPath = path.join(current.root, "索引演示.txt");
    const restored = await respondToFileLocation("索引演示.txt在哪？", current.library, (target) => revealed.push(target), signal, () => true);
    assert.match(restored ?? "", /已请求系统打开所在文件夹/u);
    assert.deepEqual(revealed, [movedPath, restoredPath]);
    await fs.rm(restoredPath);
    await current.library.refresh();
    const missing = await respondToFileLocation("索引演示.txt在哪？", current.library, (target) => revealed.push(target), signal, () => true);
    assert.match(missing ?? "", /当前索引没有找到/u);
    assert.match(missing ?? "", /不代表电脑里不存在/u);
    assert.deepEqual(revealed, [movedPath, restoredPath], "只剩丢失引用时不能猜测打开位置");
  } finally {
    await removeFixture(current.directory);
  }
});

test("本地定位在途取消后不定位、不转 AI，迟到回复不能改变终态", async () => {
  const current = await fixture({ "取消记录.txt": "保留原文件" });
  const waiting = deferred<void>();
  const controller = new AbortController();
  const revealed: string[] = [];
  const assistant = new PetAssistantService({ generate: () => { throw new Error("取消本地定位不能转 AI"); } }, {
    snapshot: () => { throw new Error("取消本地定位不能转插件"); },
    execute: () => { throw new Error("取消本地定位不能执行插件"); },
  }, { localResponse: async (message, signal) => { await waiting.promise; return respondToFileLocation(message, current.library, (target) => revealed.push(target), signal, () => true); } });
  const terminals: string[] = [];
  assistant.subscribe((event) => { if (event.type === "terminal") terminals.push(event.result.status); });
  try {
    const pending = assistant.startTurn("cancel-location", "取消记录.txt在哪", controller.signal);
    controller.abort();
    const result = await pending;
    assert.equal(result.status, "cancelled");
    assert.equal(result.response, undefined);
    waiting.resolve();
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(terminals, ["cancelled"]);
    assert.deepEqual(revealed, []);
    assert.equal(await fs.readFile(path.join(current.root, "取消记录.txt"), "utf8"), "保留原文件");
  } finally {
    waiting.resolve();
    await assistant.stop();
    await removeFixture(current.directory);
  }
});

test("分类实际模型请求仅含有界文件摘要，无路径正文与工具，草稿不改库", async () => {
  const current = await fixture({ "reference.pdf": "正文秘密 FIXTURE_CONTENT_不可上传" });
  const entries = aiEntries(current.library);
  const replies = deferred<PetAssistantTextModelResponse>();
  const requests: PetAssistantTextModelRequest[] = [];
  let begun = 0;
  const service = classifier({
    beginOperation: () => { begun += 1; return { generate: (request) => { requests.push(request); return replies.promise; } }; },
    generate: () => { throw new Error("必须使用既有来源的固定操作"); },
  });
  try {
    const before = await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8");
    const generating = service.generate("source-a", entries, new AbortController().signal);
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(begun, 1);
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0]!.tools, []);
    const user = requests[0]!.messages[1]!;
    assert.ok(user.role === "user");
    assert.deepEqual(JSON.parse(user.content), { entries });
    const serialized = JSON.stringify(requests[0]);
    assert.equal(serialized.includes(current.root), false);
    assert.equal(serialized.includes("FIXTURE_CONTENT"), false);
    assert.equal(serialized.includes("relativePath"), false);
    assert.equal(service.getEvidence()[0]?.profileId, "source-a");
    assert.equal(service.getEvidence()[0]?.state, "running");
    assert.equal(JSON.stringify(service.getEvidence()).includes("reference.pdf"), false, "监测只记录状态，不复制素材");
    replies.resolve(response(entries[0]!.entryId));
    const draft = await generating;
    assert.deepEqual(draft.items, [{ entryId: entries[0]!.entryId, category: "工作" }]);
    assert.equal(draft.usage?.totalTokens, 48);
    assert.equal(service.getEvidence().length, 0);
    assert.equal(service.getTokenUsage()[0]?.inputTokens, 31);
    assert.equal(service.getTokenUsage()[0]?.outputTokens, 17);
    assert.equal(service.getTokenUsage()[0]?.source, "provider-response");
    assert.equal(await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8"), before, "生成草稿不能直接提交虚拟分类");
    assert.equal(current.library.search("reference").matches[0]?.category, "资料");
    await current.library.applyRecommendations({ items: draft.items });
    assert.equal(current.library.search("reference").matches[0]?.category, "工作", "单独明确采纳才写分类元数据");
    assert.deepEqual(await fs.readdir(current.root), ["reference.pdf"]);
    assert.equal(await fs.readFile(path.join(current.root, "reference.pdf"), "utf8"), "正文秘密 FIXTURE_CONTENT_不可上传");
  } finally {
    service.dispose();
    await removeFixture(current.directory);
  }
});

test("分类来源坏 JSON、未知编号、路径、命令、坏类别和重复项都拒绝，实际用量仍记录", async () => {
  const current = await fixture({ "reference.txt": "原正文不参与分类" });
  const entries = aiEntries(current.library);
  const entryId = entries[0]!.entryId;
  const badOutputs: PetAssistantTextModelResponse[] = [
    { type: "text", text: "不是 JSON" },
    { type: "text", text: JSON.stringify({ items: [{ entryId: "unknown-id", category: "学习" }], summary: "错误编号" }) },
    { type: "text", text: JSON.stringify({ items: [{ entryId, category: "学习", path: current.root }], summary: "夹带路径" }) },
    { type: "text", text: JSON.stringify({ items: [{ entryId, category: "学习" }], summary: "夹带命令", command: "move" }) },
    { type: "text", text: JSON.stringify({ items: [{ entryId, category: "不存在的分类" }], summary: "错误类别" }) },
    { type: "text", text: JSON.stringify({ items: [{ entryId, category: "学习" }, { entryId, category: "工作" }], summary: "重复编号" }) },
    { type: "tool-calls", toolCalls: [{ id: "forbidden", name: "shell", arguments: {} }] },
  ];
  try {
    const before = await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8");
    for (const output of badOutputs) {
      let calls = 0;
      const service = classifier({ generate: (request) => { calls += 1; assert.deepEqual(request.tools, []); return { ...output, usage: { inputTokens: 53, outputTokens: 29, totalTokens: 82 } }; } });
      await assert.rejects(service.generate("source-a", entries, new AbortController().signal));
      assert.equal(calls, 1, "验证真实模型返回，而不是只直接调用解析函数");
      assert.equal(service.getEvidence().length, 0);
      assert.equal(service.getTokenUsage()[0]?.inputTokens, 53, "提供方已经完成的响应不能因为草稿被拒绝而丢失实际用量");
      assert.equal(service.getTokenUsage()[0]?.outputTokens, 29);
      assert.equal(await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8"), before);
      service.dispose();
    }
  } finally {
    await removeFixture(current.directory);
  }
});

test("分类在途取消及时拒绝草稿，忽略信号的迟到来源不写库或覆盖既有实际用量", async () => {
  const current = await fixture({ "kept.txt": "原文件" });
  const entries = aiEntries(current.library);
  const replies = deferred<PetAssistantTextModelResponse>();
  let calls = 0;
  let sourceSignal: AbortSignal | undefined;
  const service = classifier({ generate: (_request, signal) => { calls += 1; sourceSignal = signal; return calls === 1 ? response(entries[0]!.entryId) : replies.promise; } });
  try {
    await service.generate("source-a", entries, new AbortController().signal);
    const previousUsage = service.getTokenUsage();
    const before = await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8");
    const controller = new AbortController();
    const generating = service.generate("source-a", entries, controller.signal);
    assert.equal(service.getEvidence().length, 1);
    controller.abort();
    await assert.rejects(generating, /取消/u);
    assert.equal(sourceSignal?.aborted, true);
    assert.equal(service.getEvidence().length, 0);
    replies.resolve(response(entries[0]!.entryId, { inputTokens: 999, outputTokens: 999, totalTokens: 1998 }));
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.deepEqual(service.getTokenUsage(), previousUsage, "未交付的迟到响应不能被当作新一轮完成证据");
    assert.equal(await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8"), before);
    assert.equal(await fs.readFile(path.join(current.root, "kept.txt"), "utf8"), "原文件");
  } finally {
    service.dispose();
    await removeFixture(current.directory);
  }
});

test("无效来源、越界资料、夹带路径正文和预先取消都在模型调用前拒绝", async () => {
  const entry: CompanionFileLibraryAiEntry = { entryId: "fixture-id", name: "reference.txt", fileType: "文档", category: "资料" };
  let calls = 0;
  const service = classifier({ generate: () => { calls += 1; return response(entry.entryId); } });
  const signal = new AbortController().signal;
  await assert.rejects(service.generate("missing-source", [entry], signal));
  await assert.rejects(service.generate("source-a", [], signal));
  await assert.rejects(service.generate("source-a", Array.from({ length: 201 }, (_, index) => ({ ...entry, entryId: `fixture-${index}` })), signal));
  await assert.rejects(service.generate("source-a", [{ ...entry, name: "中".repeat(30_000) }], signal));
  const withPrivateFields = { ...entry, path: "C:\\private\\secret.txt", content: "禁止上传的正文" };
  await assert.rejects(service.generate("source-a", [withPrivateFields], signal));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(service.generate("source-a", [entry], controller.signal), /取消/u);
  assert.equal(calls, 0);
  assert.deepEqual(service.getTokenUsage(), []);
  assert.equal(service.getEvidence().length, 0);
  service.dispose();
});

test("未返回完整计数的来源不会把文本长度估计成实际用量", async () => {
  const entry: CompanionFileLibraryAiEntry = { entryId: "fixture-id", name: "reference.txt", fileType: "文档", category: "资料" };
  const service = classifier({ generate: () => response(entry.entryId, { inputTokens: null, outputTokens: null, totalTokens: null }) });
  const draft = await service.generate("source-a", [entry], new AbortController().signal);
  assert.deepEqual(draft.usage, { inputTokens: null, outputTokens: null, totalTokens: null });
  assert.deepEqual(service.getTokenUsage(), []);
  service.dispose();
});
