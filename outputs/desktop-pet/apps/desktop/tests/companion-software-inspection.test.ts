import assert from "node:assert/strict";
import childProcess, { type ExecFileOptions } from "node:child_process";
import * as fs from "node:fs/promises";
import path from "node:path";
import { describe, it, type TestContext } from "node:test";
import { companionInstallerPath, MAX_COMPANION_INSTALLER_BYTES, parseCompanionInstallerEvidence } from "../src/companion-software-core.js";
import { cancelCompanionSoftwareInspection, inspectCompanionInstaller } from "../src/companion-software-inspection.js";

const basic = (fileName = "offline-setup.exe", sizeBytes = 12) => ({
  version: 1,
  checkedAt: 1791259200000,
  fileName,
  sizeBytes,
  sizeAfterBytes: sizeBytes,
  sha256: "A".repeat(64),
  sha256After: "A".repeat(64),
  modifiedTicks: "638953248000000000",
  modifiedAfterTicks: "638953248000000000",
  signatureStatus: "Valid",
  signer: "CN=示例发布者",
  productName: "示例应用",
  publisher: "示例发布者",
  fileDescription: "离线安装程序",
  fileVersion: "1.2.3",
  productVersion: "1.2",
  zoneId: 3,
  sourceHost: "example.com",
});

type CollectorCallback = (error: Error | null, stdout: string, stderr: string) => void;

function collector(t: TestContext, handler: (arguments_: string[], options: ExecFileOptions, done: CollectorCallback) => void): void {
  t.mock.method(childProcess, "execFile", (executable: unknown, arguments_: unknown, options: unknown, callback: unknown) => {
    assert.equal(typeof executable, "string");
    assert.ok(Array.isArray(arguments_) && arguments_.every((value) => typeof value === "string"));
    assert.ok(options && typeof options === "object");
    assert.equal(typeof callback, "function");
    handler(arguments_ as string[], options as ExecFileOptions, callback as CollectorCallback);
    return new childProcess.ChildProcess();
  });
}

async function fixture(t: TestContext): Promise<{ directory: string; filePath: string; sizeBytes: number }> {
  const fixtureRoot = path.resolve("../../work");
  const directory = await fs.mkdtemp(path.join(fixtureRoot, "installer-inspection-"));
  t.after(async () => {
    assert.equal(path.dirname(directory), fixtureRoot);
    await fs.rm(directory, { recursive: true, force: true });
  });
  const filePath = path.join(directory, "安装 测试$`(1).msi");
  const content = Buffer.from("只读检查测试资料");
  await fs.writeFile(filePath, content);
  return { directory, filePath, sizeBytes: content.length };
}

describe("安装文件静态证据协议", () => {
  it("有效签名仍明确保留捆绑待确认，并保留版本与来源主机", () => {
    const evidence = parseCompanionInstallerEvidence(JSON.stringify(basic()), "C:\\下载\\offline-setup.exe");
    assert.equal(evidence.signatureStatus, "Valid");
    assert.equal(evidence.fileVersion, "1.2.3");
    assert.equal(evidence.sourceHost, "example.com");
    assert.ok(evidence.conclusion.includes("是否捆绑仍待确认"));
    assert.ok(evidence.conclusion.includes("签名有效不能证明无捆绑"));
  });

  it("签名和来源读取未知时不伪造有效或安全结论", () => {
    const raw = { ...basic(), signatureStatus: "UnknownError", signer: null, productName: null, zoneId: null, sourceHost: null };
    const evidence = parseCompanionInstallerEvidence(JSON.stringify(raw), "C:\\下载\\offline-setup.exe");
    assert.equal(evidence.signer, null);
    assert.equal(evidence.sourceHost, null);
    assert.ok(evidence.clues.some((clue) => clue.includes("未知")));
    assert.ok(evidence.conclusion.includes("未签名也不能证明有害"));
  });

  it("下载器关键词只生成需核对静态线索", () => {
    const evidence = parseCompanionInstallerEvidence(JSON.stringify({ ...basic(), fileDescription: "在线安装下载器" }), "C:\\下载\\offline-setup.exe");
    assert.ok(evidence.clues.some((clue) => clue.includes("关键词不能证明存在捆绑")));
  });

  it("坏协议、伪签名状态、超大文件和含完整URL的来源拒绝进入界面", () => {
    for (const patch of [
      { version: 2 }, { signatureStatus: "安全" }, { checkedAt: null }, { sha256: "bad" },
      { sizeBytes: MAX_COMPANION_INSTALLER_BYTES + 1 }, { zoneId: 7 },
      { sourceHost: "user:secret@example.com/private" }, { sourceHost: "https://example.com" },
      { fileName: "another.exe" }, { publisher: { name: "假的发布者" } },
    ]) {
      assert.throws(() => parseCompanionInstallerEvidence(JSON.stringify({ ...basic(), ...patch }), "C:\\下载\\offline-setup.exe"));
    }
    assert.throws(() => parseCompanionInstallerEvidence("[]", "C:\\下载\\offline-setup.exe"));
    assert.throws(() => parseCompanionInstallerEvidence("broken", "C:\\下载\\offline-setup.exe"));
  });

  it("前后摘要、大小或修改时间不同就拒绝证据", () => {
    for (const patch of [
      { sha256After: "B".repeat(64) }, { sizeAfterBytes: 13 }, { modifiedAfterTicks: "638953248000000001" },
    ]) {
      assert.throws(() => parseCompanionInstallerEvidence(JSON.stringify({ ...basic(), ...patch }), "C:\\下载\\offline-setup.exe"));
    }
  });

  it("UNC、设备路径、根目录、ADS与含跳转或Windows别名的路径拒绝", () => {
    for (const value of [
      "\\\\server\\download\\a.exe", "\\\\?\\C:\\a.exe", "C:\\", "C:\\a.exe:payload",
      "C:\\下载\\..\\a.exe", "C:\\下载\\NUL.exe", "C:\\下载\\a.exe ", "C:a.exe", "C:\\下载\\a.zip",
    ]) {
      assert.throws(() => companionInstallerPath(value));
    }
    assert.equal(companionInstallerPath("C:/下载/普通.msi"), "C:\\下载\\普通.msi");
  });
});

describe("固定只读采集执行边界", { skip: process.platform !== "win32" }, () => {
  it("所选路径作为LiteralPath单独传参，执行有30秒与1MiB界限", async (t) => {
    const selected = await fixture(t);
    collector(t, (arguments_, options, done) => {
      assert.ok(arguments_.includes("-File"));
      assert.equal(arguments_.at(-2), "-LiteralPath");
      assert.equal(arguments_.at(-1), selected.filePath);
      assert.equal(options.windowsHide, true);
      assert.equal(options.timeout, 30_000);
      assert.ok((options.maxBuffer ?? Infinity) <= 1024 * 1024);
      assert.ok(!options.shell);
      done(null, JSON.stringify(basic(path.basename(selected.filePath), selected.sizeBytes)), "");
    });
    const evidence = await inspectCompanionInstaller(selected.filePath);
    assert.equal(evidence.fileName, path.basename(selected.filePath));
  });

  it("已有取消信号不启动采集", async (t) => {
    const selected = await fixture(t);
    const controller = new AbortController();
    controller.abort();
    let called = false;
    collector(t, () => { called = true; });
    await assert.rejects(inspectCompanionInstaller(selected.filePath, controller.signal), /取消/u);
    assert.equal(called, false);
  });

  it("全局取消终止进行中的检查并允许后续检查", async (t) => {
    const selected = await fixture(t);
    let notifyStarted = () => {};
    const started = new Promise<void>((resolve) => { notifyStarted = resolve; });
    collector(t, (_arguments, options, done) => {
      options.signal?.addEventListener("abort", () => done(new Error("abort"), "", ""), { once: true });
      notifyStarted();
    });
    const pending = inspectCompanionInstaller(selected.filePath);
    await started;
    cancelCompanionSoftwareInspection();
    await assert.rejects(pending, /取消/u);
    t.mock.restoreAll();
    collector(t, (_arguments, _options, done) => done(null, JSON.stringify(basic(path.basename(selected.filePath), selected.sizeBytes)), ""));
    assert.equal((await inspectCompanionInstaller(selected.filePath)).sizeBytes, selected.sizeBytes);
  });

  it("采集前超过大小限制的普通文件不启动PowerShell", async (t) => {
    const selected = await fixture(t);
    await fs.truncate(selected.filePath, MAX_COMPANION_INSTALLER_BYTES + 1);
    let called = false;
    collector(t, () => { called = true; });
    await assert.rejects(inspectCompanionInstaller(selected.filePath));
    assert.equal(called, false);
  });

  it("采集期间源文件变化不会返回旧证据", async (t) => {
    const selected = await fixture(t);
    collector(t, (_arguments, _options, done) => {
      void fs.appendFile(selected.filePath, "已变更").then(() => done(null, JSON.stringify(basic(path.basename(selected.filePath), selected.sizeBytes)), ""));
    });
    await assert.rejects(inspectCompanionInstaller(selected.filePath), /变化/u);
  });

  it("含目录联接的上层路径在启动采集前拒绝", async (t) => {
    const selected = await fixture(t);
    const linked = path.join(selected.directory, "目录联接");
    const target = path.join(selected.directory, "实际目录");
    await fs.mkdir(target);
    await fs.writeFile(path.join(target, "a.exe"), "fixture");
    await fs.symlink(target, linked, "junction");
    let called = false;
    collector(t, () => { called = true; });
    await assert.rejects(inspectCompanionInstaller(path.join(linked, "a.exe")));
    assert.equal(called, false);
  });
});
