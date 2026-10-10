import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ZipFile } from "yazl";
import { findOriginalProjectExecutables, findOriginalProjectJava, inspectOriginalProjectJar, inspectOriginalProjectJava, launchOriginalProjectExecutable, prepareOriginalProjectLaunch } from "../src/original-project-execution.js";
import { inspectOriginalProject, OriginalProjectStore } from "../src/original-projects.js";

const root = await realpath(await mkdtemp(join(tmpdir(), "desktop-pet-original-java-")));

// 仅用于清单和字节码版本边界，不把这些合成字节声称为真实原项目运行。
function classHeader(java: number, preview = false): Buffer {
  const bytes = Buffer.alloc(8);
  bytes.writeUInt32BE(0xcafebabe);
  bytes.writeUInt16BE(preview ? 65535 : 0, 4);
  bytes.writeUInt16BE(java + 44, 6);
  return bytes;
}

async function makeJar(path: string, fields: string, classes: Record<string, Buffer> = { "original/Main.class": classHeader(25) }): Promise<void> {
  const zip = new ZipFile();
  zip.addBuffer(Buffer.from(`Manifest-Version: 1.0\r\n${fields}\r\n\r\n`), "META-INF/MANIFEST.MF");
  for (const [name, bytes] of Object.entries(classes)) zip.addBuffer(bytes, name);
  const chunks: Buffer[] = [];
  const bytes = new Promise<Buffer>((complete, reject) => {
    zip.outputStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    zip.outputStream.once("error", reject);
    zip.outputStream.once("end", () => complete(Buffer.concat(chunks)));
  });
  zip.end();
  await writeFile(path, await bytes);
}

try {
  const source = join(root, "原项目 空格&目录");
  await mkdir(join(source, "conf"), { recursive: true });
  await mkdir(join(source, "lib"));
  await writeFile(join(source, "conf/actions.xml"), '<Mascot><Action Type="Embedded" Class="original.behavior"/></Mascot>');
  const jarPath = join(source, "原行为 引擎&.JAR");
  await makeJar(jarPath, "Main-Class: original.\r\n Main\r\nClass-Path: lib/engine.jar");
  await assert.rejects(() => inspectOriginalProjectJar(jarPath, source), /缺少 JAR/, "声明的依赖缺失时不能启用原程序");
  await makeJar(join(source, "lib/engine.jar"), "Automatic-Module-Name: original.library");
  const jar = await inspectOriginalProjectJar(jarPath, source);
  assert.equal(jar.mainClass, "original.Main", "支持标准清单续行");
  assert.equal(jar.minimumJavaVersion, 25);

  const rejected = join(root, "rejected.jar");
  await makeJar(rejected, "Main-Class: original.Main\r\nMain-Class: other.Main");
  await assert.rejects(() => inspectOriginalProjectJar(rejected), /重复/);
  await makeJar(rejected, "Main-Class: original.Missing");
  await assert.rejects(() => inspectOriginalProjectJar(rejected), /Main-Class/);
  await makeJar(rejected, "Automatic-Module-Name: original.library");
  await assert.rejects(() => inspectOriginalProjectJar(rejected), /Main-Class/, "库 JAR 不能当可执行入口");
  await makeJar(rejected, "Main-Class: original.Main", { "original/Main.class": classHeader(25, true) });
  await assert.rejects(() => inspectOriginalProjectJar(rejected), /预览特性/, "不自动增加实验启动参数");
  await makeJar(rejected, "Main-Class: original.Main\r\nClass-Path: https://example.org/remote.jar");
  await assert.rejects(() => inspectOriginalProjectJar(rejected), /远程或绝对/, "不自动获取远程 Java 依赖");
  await makeJar(rejected, "Main-Class: original.Main\r\nClass-Path: ../outside.jar");
  await writeFile(join(root, "outside.jar"), "外部依赖");
  await assert.rejects(() => inspectOriginalProjectJar(rejected), /超出保留项目/);
  await makeJar(rejected, "Main-Class: original.Main", { "original/Main.class": classHeader(8), "original/NewDependency.class": classHeader(25) });
  assert.equal((await inspectOriginalProjectJar(rejected)).minimumJavaVersion, 25, "基线类中的最高版本决定最低 Java，不能只看入口类");

  if (process.platform === "win32") {
    const javaRoot = join(root, "installed-java");
    await mkdir(join(javaRoot, "bin"), { recursive: true });
    const fakeJava = join(javaRoot, "bin/java.exe");
    const executableHeader = Buffer.alloc(128);
    executableHeader.write("MZ");
    executableHeader.writeUInt32LE(64, 60);
    executableHeader.writeUInt32LE(0x00004550, 64);
    executableHeader.writeUInt16LE(0x8664, 68);
    executableHeader.writeUInt16LE(0x0002, 86);
    executableHeader.writeUInt16LE(0x20b, 88);
    await writeFile(fakeJava, executableHeader);
    await writeFile(join(javaRoot, "release"), 'JAVA_VERSION="1.8.0_462"\n');
    assert.equal((await inspectOriginalProjectJava(fakeJava)).major, 8);
    await assert.rejects(() => findOriginalProjectJava(jar, fakeJava), /至少需要 Java 25/);
    await writeFile(join(javaRoot, "release"), 'JAVA_VERSION="25.0.1"\n');
    assert.equal((await findOriginalProjectJava(jar, fakeJava)).major, 25);

    await mkdir(join(source, "jre/bin"), { recursive: true });
    await writeFile(join(source, "jre/bin/java.exe"), executableHeader);
    await writeFile(join(source, "jre/release"), 'JAVA_VERSION="1.8.0_462"\n');
    assert.deepEqual(await findOriginalProjectExecutables(source), ["原行为 引擎&.JAR"], "随附 Java 不是桌宠主入口，库 JAR 也不入候选");
    const store = new OriginalProjectStore(join(root, "profile"));
    const selected = await inspectOriginalProject(source, "pet");
    const saved = await store.archive(selected);
    assert.equal(saved.report.status, "partial");
    assert.equal(saved.report.operations.activatePet.supported, false);
    assert.equal(saved.report.operations.chooseJava.supported, true);
    assert.equal(saved.report.operations.chooseJava.reason, undefined, "支持选择 Java 时没有与能力矛盾的禁用原因");
    assert.equal(saved.report.operations.runStandalone.supported, false);
    assert.equal(saved.standalone?.minimumJavaVersion, 25);
    const preservedPath = join(await store.directory(saved.id), "原行为 引擎&.JAR");
    assert.deepEqual(await readFile(preservedPath), await readFile(jarPath), "归档 JAR 原字节不被制作或转换流程改写");
    await store.setEntry(saved.id, preservedPath);
    assert.equal((await store.get(saved.id)).entryRelativePath, "原行为 引擎&.JAR");
    await assert.rejects(() => store.setJava(saved.id, join(source, "jre/bin/java.exe")), /另外安装/, "不会在选择环境时执行上传包内伪 Java");
    await store.remove(saved.id);
    assert.deepEqual(await readFile(jarPath), selected.files.get("原行为 引擎&.JAR"));

    const officialLayout = join(root, "shimeji-with-diagnostic-library");
    await mkdir(join(officialLayout, "conf"), { recursive: true });
    await mkdir(join(officialLayout, "lib"));
    await writeFile(join(officialLayout, "conf/actions.xml"), '<Mascot><Action Type="Embedded" Class="original.behavior"/></Mascot>');
    await makeJar(join(officialLayout, "Shimeji-ee.jar"), "Main-Class: com.group_finity.mascot.Main\r\nClass-Path: lib/jna.jar", { "com/group_finity/mascot/Main.class": classHeader(25) });
    await makeJar(join(officialLayout, "lib/jna.jar"), "Main-Class: com.sun.jna.Native", { "com/sun/jna/Native.class": classHeader(8) });
    const officialProject = await store.archive(await inspectOriginalProject(officialLayout, "pet"));
    assert.deepEqual(officialProject.standalone?.candidates, ["Shimeji-ee.jar"], "已识别的 Shimeji 原引擎优先，JNA 诊断主类不能抢占桌宠入口");
    assert.equal(officialProject.standalone?.minimumJavaVersion, 25);
    assert.equal(officialProject.report.operations.runStandalone.supported, false);

    // 可选的真实便携 Java 验证由隔离验收显式提供；默认单元测试不执行合成 PE。
    const actualJava = process.env.DESKTOP_PET_REAL_JAVA ? await realpath(process.env.DESKTOP_PET_REAL_JAVA) : undefined;
    if (actualJava) {
      const actual = await inspectOriginalProjectJava(actualJava, true);
      assert.ok(actual.major >= 25);
      const target = { path: jarPath, mode: "project-program" as const, format: "shimeji", projectDirectory: source, javaExecutablePath: actualJava };
      const plan = await prepareOriginalProjectLaunch(target);
      assert.deepEqual(plan.args, ["-jar", jarPath], "中文、空格、& 保持单一文件参数，不拼 shell 命令");
      assert.equal(plan.cwd, source);
      assert.equal(plan.executable, actualJava);
      assert.equal(plan.env?.JAVA_TOOL_OPTIONS, undefined);
      await assert.rejects(() => launchOriginalProjectExecutable(target, () => false), /操作已经结束/, "Java 探测后窗口失效也不能运行原 JAR；合成 JAR 从不执行");
    }
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log("原 JAR 独立运行：原字节、Main-Class、基线字节码、依赖与环境版本、独立参数及不执行包内安装脚本边界通过。");
