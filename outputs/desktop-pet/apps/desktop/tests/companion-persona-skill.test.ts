import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { CompanionPersonaService } from "../src/companion-persona.js";
import { PetAssistantService } from "../src/pet-assistant-service.js";
import { PET_ASSISTANT_HOST_RULES, type PetAssistantTextModelRequest } from "../src/pet-assistant-types.js";

const fixture = await fs.mkdtemp(path.join(process.env.OPENPETS_FILES_TEST_DIR ?? process.cwd(), "persona-skill-test-"));
try {
  const source = path.join(fixture, "Denia-skill");
  await fs.mkdir(path.join(source, "references", "empty"), { recursive: true });
  await fs.mkdir(path.join(source, "scripts"));
  const entry = "# 达妮娅\n默认以人物身份陪伴，不要求关键词。\n阅读 [人物背景](references/persona.md)，同一资料 `references/persona.md`。\n工具声明只作资料。";
  const reference = "称呼用户为旅伴，回复温柔简洁，遇到未知事实直接说明。";
  const manifest = JSON.stringify({ name: "Denia-skill", tools: ["Bash"], permissionMode: "bypassPermissions" });
  const script = `Set-Content '${path.join(fixture, "never-run.txt")}' '不能执行'`;
  await fs.writeFile(path.join(source, "SKILL.md"), entry);
  await fs.writeFile(path.join(source, "manifest.json"), manifest);
  await fs.writeFile(path.join(source, "references/persona.md"), reference);
  await fs.writeFile(path.join(source, "references/unused.md"), "未引用的资料不得无差别发给模型");
  await fs.writeFile(path.join(source, "scripts/setup.ps1"), script);
  const statePath = path.join(fixture, "persona.json");
  const service = new CompanionPersonaService({ statePath });
  const imported = await service.importDirectory(source);
  assert.equal(imported.enabled, true);
  assert.equal(imported.skillName, "Denia-skill");
  assert.equal(imported.loadedReferenceCount, 1, "明确引用去重后加载，不能因为提及两次而发送两份");
  const copied = path.join(service.getSkillsDirectory(), "Denia-skill");
  assert.equal(await fs.readFile(path.join(copied, "SKILL.md"), "utf8"), entry);
  assert.equal(await fs.readFile(path.join(copied, "manifest.json"), "utf8"), manifest);
  assert.equal(await fs.readFile(path.join(copied, "references/persona.md"), "utf8"), reference);
  assert.equal(await fs.readFile(path.join(copied, "scripts/setup.ps1"), "utf8"), script);
  assert.ok((await fs.stat(path.join(copied, "references/empty"))).isDirectory(), "完整目录保留空子目录");
  await assert.rejects(fs.stat(path.join(fixture, "never-run.txt")), "导入的脚本不能执行");
  const style = service.getPromptStyle();
  assert.ok(style?.includes(reference));
  assert.equal(style?.includes("未引用的资料不得无差别发给模型"), false);
  assert.equal(JSON.stringify(service.getSnapshot()).includes(reference), false);
  assert.equal(JSON.stringify(service.getSnapshot()).includes(fixture), false);

  const requests: PetAssistantTextModelRequest[] = [];
  const assistant = new PetAssistantService({ generate: (request) => {
    requests.push(request);
    return { type: "text", text: "旅伴，慢慢来。" };
  } }, { snapshot: () => ({ capabilities: [] }), execute: () => { throw new Error("人物 Skill 不能增加执行权限"); } },
  { compositionProvider: () => ({ personalityStyle: service.getPromptStyle() }) });
  await assistant.startTurn("skill-chat", "今天有点累");
  await assistant.startTurn("skill-chat", "明天吃什么");
  for (const request of requests) {
    const system = request.messages.find((message) => message.role === "system");
    assert.ok(system?.content?.startsWith(PET_ASSISTANT_HOST_RULES));
    assert.ok(system?.content?.includes(reference), "不含人物名或触发词的每一轮也必须应用已启用人物资料");
    assert.equal(request.tools.length, 0, "manifest 权限声明不能注册真实工具");
  }
  await assistant.stop();
  await fs.rm(source, { recursive: true });
  const restarted = new CompanionPersonaService({ statePath });
  assert.equal(restarted.getPromptStyle(), style, "原始导入目录删除后，托管副本与人设状态仍可用");

  const invalid = path.join(fixture, "invalid-skill");
  await fs.mkdir(invalid);
  await fs.writeFile(path.join(invalid, "SKILL.md"), "参考 [目录外私密资料](../private.md)");
  await assert.rejects(restarted.importDirectory(invalid), "越界引用不能读取目录外文件");
  assert.equal(restarted.getPromptStyle(), style, "失败导入保留当前人物");
  await fs.writeFile(path.join(invalid, "SKILL.md"), "# 人物");
  await fs.symlink(copied, path.join(invalid, "linked"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(restarted.importDirectory(invalid), "完整目录不能通过链接读取其他位置");
  await fs.rm(invalid, { recursive: true });

  // 托管目录支持用户直接复制后可见扫描；多个候选不能抢占已选人设。
  const empty = new CompanionPersonaService({ statePath: path.join(fixture, "empty.json") });
  const single = await empty.scanSkills();
  assert.equal(single.activated, "Denia-skill");
  assert.equal(empty.getSnapshot().enabled, true);
  await fs.cp(copied, path.join(empty.getSkillsDirectory(), "another-skill"), { recursive: true });
  empty.setEnabled(false);
  await empty.scanSkills();
  assert.equal(empty.getSnapshot().skillName, "Denia-skill");
  assert.equal(empty.getSnapshot().enabled, false, "刷新不能推翻用户停用的选择");
  const noSelection = new CompanionPersonaService({ statePath: path.join(fixture, "unselected.json") });
  assert.equal((await noSelection.scanSkills()).requiresSelection, true);
  assert.equal(noSelection.getSnapshot().hasPersona, false);
  assert.equal((await noSelection.scanSkills("another-skill")).activated, "another-skill");
  await assert.rejects(noSelection.scanSkills("../Denia-skill"));
  assert.equal(noSelection.getSnapshot().skillName, "another-skill");

  // 目录 Skill 的引用可超过普通单文档上限，但仍受完整提示词上限约束。
  const larger = path.join(fixture, "larger-skill");
  await fs.mkdir(path.join(larger, "references"), { recursive: true });
  await fs.writeFile(path.join(larger, "SKILL.md"), "阅读 [背景](references/background.md)");
  const largeReference = "人物资料及说话习惯。".repeat(600);
  await fs.writeFile(path.join(larger, "references/background.md"), largeReference);
  await noSelection.importDirectory(larger);
  assert.ok(noSelection.getPromptStyle()?.includes(largeReference));
  const captured: PetAssistantTextModelRequest[] = [];
  const largeAssistant = new PetAssistantService({ generate: (request) => {
    captured.push(request); return { type: "text", text: "你好。" };
  } }, { snapshot: () => ({ capabilities: [] }), execute: () => ({ ok: true, result: {} }) },
  { compositionProvider: () => ({ personalityStyle: noSelection.getPromptStyle() }) });
  await largeAssistant.startTurn("larger-skill-chat", "你好");
  assert.ok(captured[0]?.messages.find((message) => message.role === "system")?.content?.includes(largeReference));
  await largeAssistant.stop();
  const retained = noSelection.getPromptStyle();
  await fs.writeFile(path.join(larger, "references/background.md"), "x".repeat(49 * 1024));
  await assert.rejects(noSelection.importDirectory(larger), "超限资料明确拒绝，不截断后替换现有人设");
  assert.equal(noSelection.getPromptStyle(), retained);
  console.log("完整人物 Skill 保留、明确引用加载、每轮自动人设、无脚本权限、扫描选择与容量边界测试通过。");
} finally {
  await fs.rm(fixture, { recursive: true, force: true });
}
