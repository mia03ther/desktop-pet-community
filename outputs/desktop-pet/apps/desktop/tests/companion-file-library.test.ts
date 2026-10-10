import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { register } from "node:module";
import { test } from "node:test";

// 保留真实目录和文件；只在明确夹具路径注入权限失败、取消和原子保存失败。
const filesystemMock = `data:text/javascript,${encodeURIComponent(`
  import * as filesystem from "node:fs/promises";
  export * from "node:fs/promises";
  export const faults = {
    deniedDirectory: null,
    cancelDirectory: null,
    controller: null,
    cancelSave: false,
    failSave: false,
    walks: 0,
  };
  export async function opendir(directory, ...args) {
    faults.walks += 1;
    if (directory === faults.deniedDirectory) {
      const error = new Error("测试目录暂时没有读取权限");
      error.code = "EACCES";
      throw error;
    }
    const handle = await filesystem.opendir(directory, ...args);
    if (directory === faults.cancelDirectory) faults.controller?.abort();
    return handle;
  }
  export async function open(target, ...args) {
    const handle = await filesystem.open(target, ...args);
    if (typeof target !== "string" || !target.endsWith(".tmp")) return handle;
    return {
      writeFile: async (...values) => {
        await handle.writeFile(...values);
        if (faults.cancelSave) faults.controller?.abort();
      },
      close: () => handle.close(),
    };
  }
  export async function rename(source, destination) {
    if (faults.failSave && destination.endsWith("companion-file-library.json")) {
      const error = new Error("测试元数据保存失败");
      error.code = "EIO";
      throw error;
    }
    return filesystem.rename(source, destination);
  }
`)}`;
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    const owner = context.parentURL?.endsWith("/companion-file-library.js")
      || context.parentURL?.endsWith("/companion-files.js");
    if (owner && specifier === "node:fs/promises") {
      return { url: ${JSON.stringify(filesystemMock)}, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);
const { faults } = await import(filesystemMock) as {
  faults: {
    deniedDirectory: string | null;
    cancelDirectory: string | null;
    controller: AbortController | null;
    cancelSave: boolean;
    failSave: boolean;
    walks: number;
  };
};
const { CompanionFileLibrary, getCompanionFileLibrary, initializeCompanionFileLibrary } = await import("../src/companion-file-library.js");

async function fixture(): Promise<{ directory: string; root: string; data: string }> {
  const directory = await fs.mkdtemp(path.join(process.cwd(), "companion-library-test-"));
  const root = path.join(directory, "selected");
  const data = path.join(directory, "data");
  await fs.mkdir(root);
  await fs.mkdir(data);
  return { directory, root, data };
}

async function removeFixture(directory: string): Promise<void> {
  const resolved = path.resolve(directory);
  assert.equal(path.dirname(resolved), path.resolve(process.cwd()));
  assert.ok(path.basename(resolved).startsWith("companion-library-test-"));
  await fs.rm(resolved, { recursive: true, force: true });
}

function clearFaults(): void {
  faults.deniedDirectory = null;
  faults.cancelDirectory = null;
  faults.controller = null;
  faults.cancelSave = false;
  faults.failSave = false;
}

test("分类库保存原位置引用，重启后保留标签，文件名搜索只读内存", async () => {
  const current = await fixture();
  try {
    const contents = new Map([
      ["课程复习 notes.PDF", "文件正文故意不是课程内容，分类只能解释文件名线索。"],
      ["会议纪要.docx", "工作记录"],
      ["旅行账单.xlsx", "生活记录"],
      ["人物素材.webp", "图片占位"],
      ["reference.txt", "参考资料"],
      ["unknown.bin", "未知类型"],
    ]);
    for (const [name, content] of contents) {
      await fs.writeFile(path.join(current.root, name), content);
    }
    const library = new CompanionFileLibrary(current.data);
    const snapshot = await library.addRoot(current.root);
    assert.equal(snapshot.roots.length, 1);
    assert.equal(snapshot.entries.length, contents.size);
    assert.equal(snapshot.roots[0]?.scan?.partial, false);
    assert.deepEqual(new Set(snapshot.entries.map((entry) => entry.category)), new Set(["学习", "工作", "生活", "素材", "资料", "其他"]));
    const study = library.search("notes 复习").matches[0];
    assert.ok(study);
    assert.equal(study.name, "课程复习 notes.PDF");
    assert.match(study.reason, /文件名/u);
    assert.equal(await library.resolveEntry(study.id), path.join(current.root, study.name));
    const walksBeforeSearch = faults.walks;
    const onlyStudy = library.search("PDF", { category: "学习", rootId: snapshot.roots[0]!.id });
    assert.equal(onlyStudy.totalMatches, 1);
    assert.equal(library.search("does-not-exist").totalMatches, 0);
    assert.equal(faults.walks, walksBeforeSearch, "再次查找不能重新遍历目录");
    onlyStudy.matches[0]!.category = "其他";
    snapshot.entries.length = 0;
    assert.equal(library.search("notes").matches[0]?.category, "学习", "公开结果不能改变内部索引");
    await library.applyRecommendations({ items: [{ entryId: study.id, category: "工作" }] });
    const restarted = new CompanionFileLibrary(current.data);
    assert.equal(restarted.search("notes").matches[0]?.id, study.id);
    assert.equal(restarted.search("notes").matches[0]?.classificationSource, "recommendation");
    assert.equal(restarted.search("notes").matches[0]?.category, "工作");
    await restarted.refresh();
    assert.equal(restarted.search("notes").matches[0]?.category, "工作", "刷新不覆盖用户采纳的标签");
    for (const [name, content] of contents) {
      assert.equal(await fs.readFile(path.join(current.root, name), "utf8"), content);
    }
    assert.deepEqual((await fs.readdir(current.root)).sort(), [...contents.keys()].sort(), "分类不创建物理分类目录、不复制或移动原文件");
    await assert.rejects(restarted.addRoot(current.root), "重复选择不得重复索引");
    await fs.mkdir(path.join(current.root, "nested"));
    await assert.rejects(restarted.addRoot(path.join(current.root, "nested")), "重叠目录不得重复计数");
    await restarted.removeRoot(restarted.getSnapshot().roots[0]!.id);
    assert.equal(restarted.search("").totalMatches, 0);
    assert.equal(new CompanionFileLibrary(current.data).getSnapshot().roots.length, 0);
    assert.equal(await fs.readFile(path.join(current.root, study.name), "utf8"), contents.get(study.name));
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});

test("多个目录、深度上限、权限不足和完整刷新分别报告未复验与丢失", async () => {
  const current = await fixture();
  try {
    const readable = path.join(current.root, "readable");
    const denied = path.join(current.root, "denied");
    await fs.mkdir(readable);
    await fs.mkdir(denied);
    await fs.writeFile(path.join(readable, "keep.txt"), "保留");
    await fs.writeFile(path.join(denied, "private.txt"), "有权时可索引");
    const secondRoot = path.join(current.directory, "second-selected");
    await fs.mkdir(secondRoot);
    await fs.writeFile(path.join(secondRoot, "项目计划.md"), "另一个选定范围");
    const library = new CompanionFileLibrary(current.data);
    await library.addRoot(current.root);
    await library.addRoot(secondRoot);
    assert.equal(library.getSnapshot().roots.length, 2);
    const oldPrivateId = library.search("private").matches[0]!.id;
    faults.deniedDirectory = denied;
    const partial = await library.refresh();
    assert.equal(partial.roots.find((root) => root.path === current.root)?.scan?.partial, true);
    assert.ok((partial.roots.find((root) => root.path === current.root)?.scan?.unreadable ?? 0) > 0);
    assert.equal(library.search("private").matches[0]?.availability, "unverified", "权限失败不能假称文件已丢失");
    assert.equal(library.search("项目").matches[0]?.availability, "indexed");
    clearFaults();
    await fs.rm(path.join(denied, "private.txt"));
    await fs.writeFile(path.join(readable, "new.txt"), "新增");
    const complete = await library.refresh();
    assert.equal(complete.roots.find((root) => root.path === current.root)?.scan?.partial, false);
    assert.equal(library.search("private").matches[0]?.availability, "missing");
    await assert.rejects(library.resolveEntry(oldPrivateId));
    assert.equal(library.search("new").matches[0]?.availability, "indexed");
    const keep = library.search("keep").matches[0]!;
    await fs.writeFile(path.join(readable, "keep.txt"), "已修改且长度不同");
    await assert.rejects(library.resolveEntry(keep.id), "编辑后的旧索引应先刷新");
    await library.refresh();
    assert.equal(await library.resolveEntry(keep.id), path.join(readable, "keep.txt"));
    let deepest = current.root;
    for (let depth = 0; depth < 14; depth += 1) {
      deepest = path.join(deepest, `depth-${depth}`);
      await fs.mkdir(deepest);
    }
    await fs.writeFile(path.join(deepest, "too-deep.txt"), "不应越过深度上限");
    const limited = await library.refresh();
    assert.equal(limited.roots.find((root) => root.path === current.root)?.scan?.depthLimited, true);
    assert.equal(limited.roots.find((root) => root.path === current.root)?.scan?.partial, true);
    assert.equal(library.search("too-deep").totalMatches, 0);
    faults.deniedDirectory = secondRoot;
    const rootDenied = await library.refresh();
    const second = rootDenied.roots.find((root) => root.path === secondRoot)!;
    assert.ok(second.scan?.partial || second.lastError, "整个目录权限失败必须显式报告");
    assert.equal(library.search("项目").matches[0]?.availability, "unverified");
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});

test("目录联接不能跨界索引或定位，重新绑定路径也不能使用旧引用", async () => {
  const current = await fixture();
  try {
    const nested = path.join(current.root, "nested");
    const outside = path.join(current.directory, "outside");
    await fs.mkdir(nested);
    await fs.mkdir(outside);
    await fs.writeFile(path.join(nested, "same.txt"), "原文件");
    await fs.writeFile(path.join(outside, "same.txt"), "范围外文件");
    await fs.writeFile(path.join(outside, "private.txt"), "范围外资料");
    await fs.symlink(outside, path.join(current.root, "linked"), process.platform === "win32" ? "junction" : "dir");
    const library = new CompanionFileLibrary(current.data);
    const initial = await library.addRoot(current.root);
    assert.equal(initial.roots[0]?.scan?.skippedLinks, 1);
    assert.equal(library.search("private").totalMatches, 0);
    const reference = library.search("same").matches[0]!;
    await fs.rename(nested, path.join(current.directory, "original-nested"));
    await fs.symlink(outside, nested, process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(library.resolveEntry(reference.id), "定位必须逐层重新检查链接边界");
    await assert.rejects(library.addRoot(nested), "不能索引目录联接");
    await library.refresh();
    assert.equal(library.search("same").matches[0]?.availability, "missing");
    assert.equal(await fs.readFile(path.join(outside, "private.txt"), "utf8"), "范围外资料");
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});

test("大量搜索结果明确截断，索引不保存文件正文", async () => {
  const current = await fixture();
  try {
    await Promise.all(Array.from({ length: 205 }, (_, index) =>
      fs.writeFile(path.join(current.root, `reference-${index}.txt`), "只属于原文件的独特正文，不得写入分类元数据")));
    const library = new CompanionFileLibrary(current.data);
    await library.addRoot(current.root);
    const results = library.search("reference");
    assert.equal(results.totalMatches, 205);
    assert.equal(results.matches.length, 200);
    assert.equal(results.truncated, true);
    const metadata = await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8");
    assert.equal(metadata.includes("只属于原文件的独特正文"), false);
    assert.equal((await fs.readdir(current.root)).length, 205);
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});

test("分类推荐拒绝路径、操作、未知或重复 ID，整体校验失败不能部分采纳", async () => {
  const current = await fixture();
  try {
    await fs.writeFile(path.join(current.root, "reference.pdf"), "原文件正文");
    const library = new CompanionFileLibrary(current.data);
    await library.addRoot(current.root);
    const entry = library.search("reference").matches[0]!;
    const before = await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8");
    const invalidInputs = [
      { items: [{ entryId: entry.id, category: "学习", path: path.join(current.root, entry.name) }] },
      { items: [{ entryId: entry.id, category: "../../目录" }] },
      { items: [{ entryId: entry.id, category: "工作" }], action: "move" },
      { items: [{ entryId: entry.id, category: "工作" }, { entryId: "00000000-0000-4000-8000-000000000000", category: "生活" }] },
      { items: [{ entryId: entry.id, category: "学习" }, { entryId: entry.id, category: "工作" }] },
      { items: [] },
    ];
    for (const input of invalidInputs) {
      await assert.rejects(library.applyRecommendations(input));
      assert.equal(library.search("reference").matches[0]?.category, "资料");
      assert.equal(await fs.readFile(path.join(current.data, "companion-file-library.json"), "utf8"), before);
    }
    assert.throws(() => Reflect.apply(library.search, library, ["reference", { category: "无效" }]));
    assert.throws(() => library.search("reference", { rootId: "../../目录" }));
    assert.equal(await fs.readFile(path.join(current.root, entry.name), "utf8"), "原文件正文");
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});

test("扫描中取消、原子写入取消和磁盘失败都保留旧内存与存档", async () => {
  const current = await fixture();
  try {
    await fs.writeFile(path.join(current.root, "kept.txt"), "原文件");
    const library = new CompanionFileLibrary(current.data);
    await library.addRoot(current.root);
    const original = library.getSnapshot();
    const statePath = path.join(current.data, "companion-file-library.json");
    const saved = await fs.readFile(statePath, "utf8");
    await fs.writeFile(path.join(current.root, "new.txt"), "新增原文件");
    const controller = new AbortController();
    faults.cancelDirectory = current.root;
    faults.controller = controller;
    await assert.rejects(library.refresh(controller.signal));
    assert.deepEqual(library.getSnapshot(), original);
    assert.equal(await fs.readFile(statePath, "utf8"), saved);
    clearFaults();
    const saveController = new AbortController();
    faults.cancelSave = true;
    faults.controller = saveController;
    await assert.rejects(library.refresh(saveController.signal));
    assert.deepEqual(library.getSnapshot(), original);
    assert.equal(await fs.readFile(statePath, "utf8"), saved);
    assert.deepEqual(await fs.readdir(current.data), ["companion-file-library.json"], "取消清理只清除本次临时元数据");
    clearFaults();
    faults.failSave = true;
    await assert.rejects(library.refresh());
    assert.deepEqual(library.getSnapshot().entries, original.entries);
    assert.deepEqual(library.getSnapshot().roots, original.roots);
    assert.ok(library.getSnapshot().storageError);
    assert.equal(library.search("new").totalMatches, 0, "保存失败不能更新内存搜索结果");
    assert.equal(await fs.readFile(statePath, "utf8"), saved);
    clearFaults();
    await library.refresh();
    assert.equal(library.search("new").totalMatches, 1);
    assert.equal(library.getSnapshot().storageError, null);
    assert.equal(await fs.readFile(path.join(current.root, "kept.txt"), "utf8"), "原文件");
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});

test("损坏或越界存档不能被覆盖，宿主分类库只允许初始化一次", async () => {
  const current = await fixture();
  try {
    const statePath = path.join(current.data, "companion-file-library.json");
    await fs.writeFile(statePath, "损坏的原存档");
    const broken = new CompanionFileLibrary(current.data);
    assert.ok(broken.getSnapshot().storageError);
    await assert.rejects(broken.addRoot(current.root));
    assert.equal(await fs.readFile(statePath, "utf8"), "损坏的原存档");
    await fs.rm(statePath);
    await fs.writeFile(path.join(current.root, "safe.txt"), "原文件");
    const library = new CompanionFileLibrary(current.data);
    await library.addRoot(current.root);
    const valid = JSON.parse(await fs.readFile(statePath, "utf8")) as { version: number; entries: Array<{ relativePath: string }> };
    valid.entries[0]!.relativePath = path.join("..", "outside.txt");
    const invalidReference = JSON.stringify(valid);
    await fs.writeFile(statePath, invalidReference);
    const rejected = new CompanionFileLibrary(current.data);
    assert.ok(rejected.getSnapshot().storageError);
    assert.equal(rejected.search("").totalMatches, 0);
    await assert.rejects(rejected.refresh());
    assert.equal(await fs.readFile(statePath, "utf8"), invalidReference);
    await fs.writeFile(statePath, "");
    await fs.truncate(statePath, 16 * 1024 * 1024 + 1);
    const oversized = new CompanionFileLibrary(current.data);
    assert.ok(oversized.getSnapshot().storageError);
    await assert.rejects(oversized.addRoot(current.root));
    assert.equal((await fs.stat(statePath)).size, 16 * 1024 * 1024 + 1, "超限存档必须保持原样");
    assert.throws(() => getCompanionFileLibrary());
    const hostData = path.join(current.directory, "host-data");
    await fs.mkdir(hostData);
    const initialized = initializeCompanionFileLibrary(hostData);
    assert.equal(getCompanionFileLibrary(), initialized);
    assert.throws(() => initializeCompanionFileLibrary(current.data));
  } finally {
    clearFaults();
    await removeFixture(current.directory);
  }
});
