import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import path from "node:path";
import { CompanionFileLibrary } from "../src/companion-file-library.js";
import { CompanionFilesService } from "../src/companion-files.js";
import { CompanionFileClassification } from "../src/companion-file-classification.js";
import { installControlCenterFileLibraryIpcHandlers } from "../src/control-center-file-library-ipc.js";
import type { CompanionFileLibraryAiPreview, CompanionFileLibraryAiDraft } from "../src/companion-file-library-ai-types.js";

test("推荐整理只在执行后移动嵌套资料，冲突和程序保留，可恢复原位置", async () => {
  const fixture = await fs.mkdtemp(path.join(process.cwd(), "file-library-organize-test-"));
  try {
    const root = path.join(fixture, "selected");
    await fs.mkdir(path.join(root, "旧资料"), { recursive: true });
    await fs.mkdir(path.join(root, "另一目录"));
    await fs.writeFile(path.join(root, "旧资料", "课件.txt"), "原始学习资料");
    await fs.writeFile(path.join(root, "另一目录", "课件.txt"), "同名文件");
    await fs.writeFile(path.join(root, "program.exe"), "不执行");
    const files = new CompanionFilesService({ journalDirectory: path.join(fixture, "operations") });
    const plan = await files.createRecommendedOrganizePlan(root, [
      { relativePath: path.join("旧资料", "课件.txt"), category: "学习" },
      { relativePath: path.join("另一目录", "课件.txt"), category: "学习" },
      { relativePath: "program.exe", category: "资料" },
    ]);
    assert.deepEqual(plan.items.map((item) => item.status), ["ready", "conflict", "skipped"]);
    await assert.rejects(fs.stat(path.join(root, "学习")));
    const operation = await files.executePlan(plan.id);
    assert.equal(operation.status, "completed");
    assert.equal(await fs.readFile(path.join(root, "学习", "课件.txt"), "utf8"), "原始学习资料");
    assert.equal(await fs.readFile(path.join(root, "另一目录", "课件.txt"), "utf8"), "同名文件");
    assert.equal(await fs.readFile(path.join(root, "program.exe"), "utf8"), "不执行");
    assert.equal((await files.listHistory())[0].recommended, true);
    const undone = await files.undoOperation(operation.id);
    assert.equal(undone.status, "undone");
    assert.equal(await fs.readFile(path.join(root, "旧资料", "课件.txt"), "utf8"), "原始学习资料");
    await assert.rejects(files.createRecommendedOrganizePlan(root, [{ relativePath: "../escape.txt", category: "学习" }]));
  } finally {
    await fs.rm(fixture, { recursive: true, force: true });
  }
});

test("AI 预览与草稿受发送窗口和索引版本约束，采用只改分类", async () => {
  const fixture = await fs.mkdtemp(path.join(process.cwd(), "file-library-ipc-test-"));
  const handlers = new Map<string, Parameters<Parameters<typeof installControlCenterFileLibraryIpcHandlers>[0]["registerHandle"]>[1]>();
  try {
    const root = path.join(fixture, "课程资料");
    const data = path.join(fixture, "userdata");
    await fs.mkdir(root);
    await fs.mkdir(data);
    const original = path.join(root, "课程报告.txt");
    await fs.writeFile(original, "不能发送给模型的正文");
    const library = new CompanionFileLibrary(data);
    const snapshot = await library.addRoot(root);
    const files = new CompanionFilesService({ journalDirectory: path.join(data, "operations") });
    const classification = new CompanionFileClassification({
      getProfiles: () => [{ id: "local-fixture" }],
      createModel: () => ({ generate: (request) => {
        assert.deepEqual(request.tools, []);
        assert.equal(JSON.stringify(request).includes(root), false);
        assert.equal(JSON.stringify(request).includes("不能发送给模型的正文"), false);
        const message = request.messages[1];
        if (!("content" in message) || typeof message.content !== "string") throw new Error("分类请求没有文本资料。");
        const payload = JSON.parse(message.content) as { entries: Array<{ entryId: string }> };
        return { type: "text", text: JSON.stringify({ items: payload.entries.map((entry) => ({ entryId: entry.entryId, category: "生活" })), summary: "只按名称提出建议，需核对。" }) };
      } }),
    });
    const revealed: string[] = [];
    const ipc = installControlCenterFileLibraryIpcHandlers({
      assertAccess: () => undefined,
      registerHandle: (name, handler) => handlers.set(name, handler),
      authorizeSender: (event) => { if (![1, 2].includes(event.sender.id)) throw new Error("窗口未授权"); },
      library, files, getClassification: () => classification,
      getProfiles: async () => [{ id: "local-fixture", label: "本机测试" }],
      pickFolder: async () => null, reveal: (value) => revealed.push(value), rememberPlan: () => undefined,
    });
    const call = (name: string, senderId: number, ...args: unknown[]) => handlers.get(`openpets:companion-library-${name}`)!({ sender: { id: senderId } }, ...args);
    const preview = await call("ai-preview", 1, snapshot.roots[0].id) as CompanionFileLibraryAiPreview;
    await assert.rejects(call("ai-generate", 2, preview.id, "local-fixture"));
    const draft = await call("ai-generate", 1, preview.id, "local-fixture") as CompanionFileLibraryAiDraft;
    assert.notEqual(library.getSnapshot().entries[0].category, "生活");
    await call("ai-apply", 1, draft.id);
    assert.equal(library.getSnapshot().entries[0].category, "生活");
    assert.equal(await fs.readFile(original, "utf8"), "不能发送给模型的正文");
    await call("reveal", 1, snapshot.entries[0].id);
    assert.deepEqual(revealed, [original]);
    const newerPreview = await call("ai-preview", 1, snapshot.roots[0].id) as CompanionFileLibraryAiPreview;
    const stale = await call("ai-generate", 1, newerPreview.id, "local-fixture") as CompanionFileLibraryAiDraft;
    await library.removeRoot(snapshot.roots[0].id);
    await assert.rejects(call("ai-apply", 1, stale.id));
    await assert.rejects(call("snapshot", 3));
    ipc.dispose();
    classification.dispose();
  } finally {
    await fs.rm(fixture, { recursive: true, force: true });
  }
});
