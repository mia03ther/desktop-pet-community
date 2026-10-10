import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { CompanionFilesService } from "../src/companion-files.js";

// Windows 临时目录通常属于 AppData，本产品禁止在那里整理；测试使用项目内独立夹具。
const fixture = await fs.mkdtemp(path.join(process.env.OPENPETS_FILES_TEST_DIR ?? process.cwd(), "openpets-files-test-"));
const service = new CompanionFilesService({ journalDirectory: path.join(fixture, "journal") });

async function directory(name: string): Promise<string> {
  const root = path.join(fixture, name);
  await fs.mkdir(root);
  return root;
}

async function missing(target: string): Promise<boolean> {
  try {
    await fs.lstat(target);
    return false;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return true;
    throw error;
  }
}

try {
  // 扫描只能读所选范围，目录联接指向范围外的大文件不能被统计。
  const scanRoot = await directory("scan");
  const outside = await directory("outside");
  await fs.writeFile(path.join(outside, "outside.bin"), Buffer.alloc(1000));
  await fs.mkdir(path.join(scanRoot, "WeChat Files"));
  await fs.writeFile(path.join(scanRoot, "readme.TXT"), "hello");
  await fs.writeFile(path.join(scanRoot, "WeChat Files", "record.db"), "012345678901234");
  await fs.symlink(outside, path.join(scanRoot, "linked"), process.platform === "win32" ? "junction" : "dir");
  const analysis = await service.analyzeDirectory(scanRoot);
  assert.equal(analysis.bytes, 20, "目录联接外的内容不能加入大小");
  assert.equal(analysis.skippedLinks, 1);
  assert.equal(analysis.largestFiles[0]?.name, "record.db");
  assert.equal(analysis.children.find((entry) => entry.name === "WeChat Files")?.chatDirectoryHint, true);
  assert.equal(analysis.stopReason, "completed");
  const search = await service.searchNames(scanRoot, "READme");
  assert.equal(search.matches[0]?.path, path.join(scanRoot, "readme.TXT"));
  assert.equal(search.matches.length, 1);
  const limited = await service.searchNames(scanRoot, ".", { maxResults: 1 });
  assert.equal(limited.matches.length, 1);
  assert.equal(limited.scan.stopReason, "result-limit");
  const cancelled = new AbortController();
  cancelled.abort();
  assert.equal((await service.analyzeDirectory(scanRoot, { signal: cancelled.signal })).stopReason, "cancelled");
  assert.equal((await service.analyzeDirectory(scanRoot, { maxEntries: 1 })).stopReason, "entry-limit");
  await assert.rejects(service.analyzeDirectory(path.join(scanRoot, "linked")));

  // 预览不写文件；执行后数据相同，原路径空缺；重建服务仍可依据本地记录撤销。
  const organizeRoot = await directory("organize");
  const original = path.join(organizeRoot, "notes.txt");
  await fs.writeFile(original, "课堂笔记");
  await fs.writeFile(path.join(organizeRoot, "settings.json"), "{}" );
  await fs.mkdir(path.join(organizeRoot, "existing"));
  await fs.writeFile(path.join(organizeRoot, "existing", "photo.png"), "inside");
  const plan = await service.createOrganizePlan(organizeRoot);
  assert.equal(plan.items.find((entry) => entry.source === original)?.status, "ready");
  assert.equal(plan.items.find((entry) => entry.source.endsWith("settings.json"))?.status, "skipped");
  assert.equal(await missing(path.join(organizeRoot, "文档")), true, "预览不能创建分类目录");
  const operation = await service.executePlan(plan.id);
  assert.equal(operation.status, "completed");
  assert.equal(await missing(original), true);
  assert.equal(await fs.readFile(path.join(organizeRoot, "文档", "notes.txt"), "utf8"), "课堂笔记");
  assert.equal(await fs.readFile(path.join(organizeRoot, "settings.json"), "utf8"), "{}");
  assert.equal(await fs.readFile(path.join(organizeRoot, "existing", "photo.png"), "utf8"), "inside");
  await assert.rejects(service.executePlan(plan.id), "计划只能执行一次");
  const restarted = new CompanionFilesService({ journalDirectory: path.join(fixture, "journal") });
  assert.equal((await restarted.listHistory()).some((entry) => entry.id === operation.id), true);
  assert.equal((await restarted.undoOperation(operation.id)).status, "undone");
  assert.equal(await fs.readFile(original, "utf8"), "课堂笔记");
  assert.equal(await missing(path.join(organizeRoot, "文档", "notes.txt")), true);

  // 模拟已移除源、来不及写 completed 的退出；prepared 记录仍能安全恢复。
  const interruptedRoot = await directory("interrupted");
  await fs.writeFile(path.join(interruptedRoot, "resume.txt"), "recoverable");
  const interruptedPlan = await service.createOrganizePlan(interruptedRoot);
  const interruptedOperation = await service.executePlan(interruptedPlan.id);
  interruptedOperation.status = "running";
  interruptedOperation.items[0]!.status = "prepared";
  await fs.writeFile(path.join(fixture, "journal", `${interruptedOperation.id}.json`), JSON.stringify(interruptedOperation));
  const recoveredHistory = await restarted.listHistory();
  assert.equal(recoveredHistory.find((entry) => entry.id === interruptedOperation.id)?.items[0]?.status, "prepared");
  assert.equal((await restarted.undoOperation(interruptedOperation.id)).status, "undone");
  assert.equal(await fs.readFile(path.join(interruptedRoot, "resume.txt"), "utf8"), "recoverable");

  // 整理前后出现冲突都不能覆盖；预览后修改的源文件也不能移动。
  const conflictRoot = await directory("conflict");
  await fs.mkdir(path.join(conflictRoot, "文档"));
  await fs.writeFile(path.join(conflictRoot, "paper.pdf"), "new");
  await fs.writeFile(path.join(conflictRoot, "文档", "paper.pdf"), "existing");
  const conflicts = await service.createOrganizePlan(conflictRoot);
  assert.equal(conflicts.items[0]?.status, "conflict");
  await fs.writeFile(path.join(conflictRoot, "late.txt"), "source");
  const latePlan = await service.createOrganizePlan(conflictRoot);
  await fs.writeFile(path.join(conflictRoot, "文档", "late.txt"), "created later");
  const lateOperation = await service.executePlan(latePlan.id);
  assert.equal(lateOperation.items[0]?.status, "failed");
  assert.equal(await fs.readFile(path.join(conflictRoot, "late.txt"), "utf8"), "source");
  assert.equal(await fs.readFile(path.join(conflictRoot, "文档", "late.txt"), "utf8"), "created later");
  await fs.writeFile(path.join(conflictRoot, "changing.txt"), "first");
  const changingPlan = await service.createOrganizePlan(conflictRoot);
  await fs.writeFile(path.join(conflictRoot, "changing.txt"), "changed after preview");
  const changingOperation = await service.executePlan(changingPlan.id);
  assert.equal(changingOperation.items.find((entry) => entry.source.endsWith("changing.txt"))?.status, "failed");
  assert.equal(await fs.readFile(path.join(conflictRoot, "changing.txt"), "utf8"), "changed after preview");

  // 目标分类目录是联接时，计划应标冲突且不向范围外写入。
  const linkedRoot = await directory("linked-target");
  await fs.writeFile(path.join(linkedRoot, "photo.png"), "picture");
  await fs.symlink(outside, path.join(linkedRoot, "图片"), process.platform === "win32" ? "junction" : "dir");
  const linkedPlan = await service.createOrganizePlan(linkedRoot);
  assert.equal(linkedPlan.items.find((entry) => entry.source.endsWith("photo.png"))?.status, "conflict");
  await assert.rejects(service.executePlan(linkedPlan.id), "零项计划不能报告已成功执行");
  assert.equal(await missing(path.join(outside, "photo.png")), true);

  // 收纳只复制普通文件；后来改动过的副本不可撤销删除。
  const storageRoot = await directory("storage");
  const source = path.join(outside, "reference.txt");
  await fs.writeFile(source, "参考资料");
  const undoCopyRoot = await directory("undo-copy");
  const undoCopyPlan = await service.createCopyPlan([source], undoCopyRoot);
  const undoCopyOperation = await service.executePlan(undoCopyPlan.id);
  assert.equal((await service.undoOperation(undoCopyOperation.id)).status, "undone");
  assert.equal(await missing(path.join(undoCopyRoot, "reference.txt")), true);
  assert.equal(await fs.readFile(source, "utf8"), "参考资料", "撤销复制只能撤回本次创建的副本");
  const copyPlan = await service.createCopyPlan([source], storageRoot);
  const copied = await service.executePlan(copyPlan.id);
  assert.equal(copied.status, "completed");
  assert.equal(await fs.readFile(source, "utf8"), "参考资料");
  await fs.writeFile(path.join(storageRoot, "reference.txt"), "后来修改的副本");
  const blockedUndo = await service.undoOperation(copied.id);
  assert.equal(blockedUndo.items[0]?.status, "undo-skipped");
  assert.equal(await fs.readFile(path.join(storageRoot, "reference.txt"), "utf8"), "后来修改的副本");
  await assert.rejects(service.createCopyPlan([path.join(scanRoot, "linked", "outside.bin")], storageRoot));
  assert.equal((await service.createCopyPlan([source], storageRoot)).items[0]?.status, "conflict");

  // 撤销整理遇到原路径后来出现的文件不能覆盖，也不能删除整理后的文件。
  const undoRoot = await directory("undo-conflict");
  await fs.writeFile(path.join(undoRoot, "kept.txt"), "original");
  const undoPlan = await service.createOrganizePlan(undoRoot);
  const undoOperation = await service.executePlan(undoPlan.id);
  await fs.writeFile(path.join(undoRoot, "kept.txt"), "new file");
  const undoResult = await service.undoOperation(undoOperation.id);
  assert.equal(undoResult.items[0]?.status, "undo-skipped");
  assert.equal(await fs.readFile(path.join(undoRoot, "kept.txt"), "utf8"), "new file");
  assert.equal(await fs.readFile(path.join(undoRoot, "文档", "kept.txt"), "utf8"), "original");

  // 执行前取消不改变数据，保留未完成记录；未知计划和路径式操作编号不能执行。
  const cancelledRoot = await directory("cancelled");
  await fs.writeFile(path.join(cancelledRoot, "stay.txt"), "stay");
  const cancelledPlan = await service.createOrganizePlan(cancelledRoot);
  const cancelledOperation = await service.executePlan(cancelledPlan.id, { signal: cancelled.signal });
  assert.equal(cancelledOperation.status, "cancelled");
  assert.equal(await fs.readFile(path.join(cancelledRoot, "stay.txt"), "utf8"), "stay");
  await assert.rejects(service.executePlan("../arbitrary"));
  await assert.rejects(service.undoOperation("../arbitrary"));
  console.log("文件助手范围、冲突、真实整理与复制、取消、记录重启和安全撤销测试通过。");
} finally {
  // 测试仅删除由 mkdtemp 创建的固定临时目录，不碰用户资料。
  await fs.rm(fixture, { recursive: true, force: true });
}
