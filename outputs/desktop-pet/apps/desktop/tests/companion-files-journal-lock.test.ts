import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import path from "node:path";
import { register } from "node:module";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";

// 真实创建、复制、校验和读取记录；只在自己的 prepared 记录替换点模拟 Windows 读锁。
const filesystemMock = `data:text/javascript,${encodeURIComponent(`
  import * as filesystem from "node:fs/promises";
  export * from "node:fs/promises";
  export const faults = {
    journal: null,
    remainingFailures: 0,
    codes: ["EPERM"],
    attempts: 0,
    sourceContents: [],
  };
  export async function rename(source, destination) {
    if (typeof destination === "string" && destination.startsWith(faults.journal + "/")
      || typeof destination === "string" && destination.startsWith(faults.journal + "\\\\")) {
      const record = JSON.parse(await filesystem.readFile(source, "utf8"));
      const prepared = record.items.find((item) => item.status === "prepared");
      if (prepared) {
        faults.attempts += 1;
        if (faults.remainingFailures > 0) {
          faults.remainingFailures -= 1;
          faults.sourceContents.push(await filesystem.readFile(prepared.source, "utf8"));
          const error = new Error("测试原子替换暂时受读锁阻止");
          error.code = faults.codes[(faults.attempts - 1) % faults.codes.length];
          throw error;
        }
      }
    }
    return filesystem.rename(source, destination);
  }
`)}`;
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (context.parentURL?.endsWith("/companion-files.js") && specifier === "node:fs/promises") {
      return { url: ${JSON.stringify(filesystemMock)}, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);
const { faults } = await import(filesystemMock) as {
  faults: {
    journal: string | null;
    remainingFailures: number;
    codes: string[];
    attempts: number;
    sourceContents: string[];
  };
};
const { CompanionFilesService } = await import("../src/companion-files.js");

async function fixture(): Promise<{ directory: string; root: string; journal: string; service: InstanceType<typeof CompanionFilesService> }> {
  const directory = await fs.mkdtemp(path.join(process.cwd(), "companion-journal-test-"));
  const root = path.join(directory, "selected");
  const journal = path.join(directory, "journal");
  await fs.mkdir(root);
  await fs.writeFile(path.join(root, "notes.txt"), "原文件必须等记录可靠落盘后才能移除");
  faults.journal = journal;
  faults.attempts = 0;
  faults.sourceContents = [];
  return { directory, root, journal, service: new CompanionFilesService({ journalDirectory: journal }) };
}

async function cleanup(directory: string): Promise<void> {
  faults.journal = null;
  faults.remainingFailures = 0;
  const resolved = path.resolve(directory);
  assert.equal(path.dirname(resolved), path.resolve(process.cwd()));
  assert.ok(path.basename(resolved).startsWith("companion-journal-test-"));
  await fs.rm(resolved, { recursive: true, force: true });
}

test("历史轮询期间 prepared 替换遭遇短暂 EPERM/EACCES 会重试，成功落盘后才能移除原文件", {
  skip: process.platform !== "win32",
}, async () => {
  const current = await fixture();
  try {
    faults.codes = ["EPERM", "EACCES"];
    faults.remainingFailures = 2;
    const plan = await current.service.createOrganizePlan(current.root);
    let finished = false;
    let historyReads = 0;
    const execution = current.service.executePlan(plan.id).finally(() => {
      finished = true;
    });
    const polling = (async () => {
      while (!finished) {
        await current.service.listHistory();
        historyReads += 1;
        await delay(5);
      }
    })();
    let operation;
    try {
      operation = await execution;
    } finally {
      await polling;
    }
    assert.ok(historyReads > 0);
    assert.equal(operation.status, "completed");
    assert.ok(faults.attempts > 1);
    assert.deepEqual(faults.sourceContents, [
      "原文件必须等记录可靠落盘后才能移除",
      "原文件必须等记录可靠落盘后才能移除",
    ]);
    await assert.rejects(fs.stat(path.join(current.root, "notes.txt")));
    assert.equal(await fs.readFile(path.join(current.root, "文档", "notes.txt"), "utf8"), "原文件必须等记录可靠落盘后才能移除");
    assert.equal((await current.service.listHistory())[0]?.status, "completed");
    assert.equal((await fs.readdir(current.journal)).some((name) => name.endsWith(".tmp")), false);
    assert.equal((await current.service.undoOperation(operation.id)).status, "undone");
    assert.equal(await fs.readFile(path.join(current.root, "notes.txt"), "utf8"), "原文件必须等记录可靠落盘后才能移除");
  } finally {
    await cleanup(current.directory);
  }
});

test("持续读锁只能有界重试，原文件与待核对副本均保留，不能报告全部完成", {
  skip: process.platform !== "win32",
  timeout: 5000,
}, async () => {
  const current = await fixture();
  try {
    faults.codes = ["EPERM"];
    faults.remainingFailures = Number.POSITIVE_INFINITY;
    const plan = await current.service.createOrganizePlan(current.root);
    const operation = await current.service.executePlan(plan.id);
    assert.equal(operation.status, "partial");
    assert.equal(operation.items[0]?.status, "failed");
    assert.ok(faults.attempts > 1 && faults.attempts <= 10, "持续锁不能无限重试");
    assert.equal(await fs.readFile(path.join(current.root, "notes.txt"), "utf8"), "原文件必须等记录可靠落盘后才能移除");
    assert.equal(await fs.readFile(path.join(current.root, "文档", "notes.txt"), "utf8"), "原文件必须等记录可靠落盘后才能移除");
    assert.equal((await current.service.listHistory())[0]?.status, "partial");
    assert.equal((await fs.readdir(current.journal)).some((name) => name.endsWith(".tmp")), false);
  } finally {
    await cleanup(current.directory);
  }
});

test("磁盘错误不是短暂读锁，不重试也不移除原文件", async () => {
  const current = await fixture();
  try {
    faults.codes = ["EIO"];
    faults.remainingFailures = 10;
    const plan = await current.service.createOrganizePlan(current.root);
    const operation = await current.service.executePlan(plan.id);
    assert.equal(operation.status, "partial");
    assert.equal(faults.attempts, 1);
    assert.equal(await fs.readFile(path.join(current.root, "notes.txt"), "utf8"), "原文件必须等记录可靠落盘后才能移除");
    assert.equal((await fs.readdir(current.journal)).some((name) => name.endsWith(".tmp")), false);
  } finally {
    await cleanup(current.directory);
  }
});
