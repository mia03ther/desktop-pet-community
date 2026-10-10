import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, parse } from "node:path";
import { describe, it, type TestContext } from "node:test";
import { checkCompanionUninstallDirectory } from "../src/companion-uninstall-check.js";

function temporaryDirectory(t: TestContext): string {
  const directory = mkdtempSync(join(tmpdir(), "companion-uninstall-check-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  return directory;
}

describe("卸载目录只读路径边界", () => {
  it("目录存在只给待核对证据，不读取或修改目录内容", async (t) => {
    const directory = temporaryDirectory(t);
    const location = join(directory, "应用");
    mkdirSync(location);
    const document = join(location, "用户资料.txt");
    writeFileSync(document, "仍需保留的资料。");
    const result = await checkCompanionUninstallDirectory(location);
    assert.equal(result.status, "exists");
    assert.ok(result.explanation.includes("用户资料"));
    assert.ok(result.explanation.includes("不能判断文件可删除"));
    assert.equal(readFileSync(document, "utf8"), "仍需保留的资料。");
  });

  it("末层或中间层不存在均仅说明本次未见登记目录", async (t) => {
    const directory = temporaryDirectory(t);
    for (const location of [join(directory, "未安装"), join(directory, "不存在", "安装目录")]) {
      const result = await checkCompanionUninstallDirectory(location);
      assert.equal(result.status, "absent");
      assert.ok(result.explanation.includes("该登记路径"));
      assert.ok(result.explanation.includes("不能证明全盘"));
    }
  });

  it("普通文件不被当作可核对的安装目录", async (t) => {
    const directory = temporaryDirectory(t);
    const file = join(directory, "文件");
    writeFileSync(file, "普通文件。");
    assert.equal((await checkCompanionUninstallDirectory(file)).status, "unsupported");
    assert.equal((await checkCompanionUninstallDirectory(join(file, "目录"))).status, "unsupported");
  });

  it("拒绝安装目录本身和上级目录的符号链接或目录联接", async (t) => {
    const directory = temporaryDirectory(t);
    const target = join(directory, "实际目录");
    mkdirSync(join(target, "子目录"), { recursive: true });
    const link = join(directory, "联接目录");
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
    assert.equal((await checkCompanionUninstallDirectory(link)).status, "unsupported");
    assert.equal((await checkCompanionUninstallDirectory(join(link, "子目录"))).status, "unsupported");
    assert.equal((await checkCompanionUninstallDirectory(join(link, "不存在"))).status, "unsupported");
  });

  it("拒绝 UNC、ADS、相对路径、盘根和系统共享根", async (t) => {
    const directory = temporaryDirectory(t);
    const root = parse(directory).root;
    const locations = ["\\\\服务器\\共享\\应用", "安装目录", `${directory}:数据流`, root];
    if (process.platform === "win32") {
      locations.push(join(root, "Users"), join(root, "Program Files"), join(root, "Program Files (x86)"), join(root, "ProgramData"), join(root, "Windows", "System32"), join(root, "$Recycle.Bin"), join(root, "Program Files."), join(root, "PROGRA~1"));
    } else {
      locations.push("/Users", "/home", "/Applications", "/usr/bin");
    }
    for (const location of locations) assert.equal((await checkCompanionUninstallDirectory(location)).status, "unsupported", location);
  });

  it("已取消的请求不形成目录存在或缺失结论", async (t) => {
    const directory = temporaryDirectory(t);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(checkCompanionUninstallDirectory(directory, controller.signal), /已取消/);
  });
});
