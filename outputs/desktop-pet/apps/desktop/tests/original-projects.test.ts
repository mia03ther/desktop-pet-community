import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, win32 } from "node:path";
import sharp from "sharp";
import { inspectOriginalProject, isOriginalProjectPathInside, OriginalProjectStore } from "../src/original-projects.js";
import { readLocalPackageFiles } from "../src/local-package-files.js";
import { installControlCenterOriginalProjectIpcHandlers, type OriginalProjectIpcDependencies } from "../src/control-center-original-project-ipc.js";
import { assertOriginalProjectExecutable } from "../src/original-project-execution.js";

const root = await realpath(await mkdtemp(join(tmpdir(), "desktop-pet-original-projects-")));
const store = new OriginalProjectStore(join(root, "profile"));
const limits = { maxBytes: 200 * 1024 * 1024, maxFileBytes: 100 * 1024 * 1024, maxFiles: 1000 };
// 仅验证 PE 识别和 IPC 选择边界；该合成头不是可运行程序，测试从不执行它。
const executableHeader = Buffer.alloc(128);
executableHeader.write("MZ");
executableHeader.writeUInt32LE(64, 60);
executableHeader.writeUInt32LE(0x00004550, 64);
executableHeader.writeUInt16LE(0x8664, 68);
executableHeader.writeUInt16LE(0x0002, 86);
executableHeader.writeUInt16LE(0x20b, 88);
try {
  assert.equal(isOriginalProjectPathInside("C:\\profile", "D:\\Apps\\Shimeji.exe", win32.relative, win32.isAbsolute), false, "跨盘应用不是工程内程序");
  assert.equal(isOriginalProjectPathInside("C:\\profile", "C:\\profile\\project\\unsafe.exe", win32.relative, win32.isAbsolute), true);
  const source = join(root, "shimeji");
  await mkdir(join(source, "conf"), { recursive: true });
  const originalXml = '<Mascot><Action Name="OriginalJava" Type="Embedded" Class="original.behavior" /></Mascot>';
  await writeFile(join(source, "conf/actions.xml"), originalXml);
  await writeFile(join(source, "dangerous.exe"), "不能在导入时运行");
  const inspected = await inspectOriginalProject(source, "pet");
  assert.equal(inspected.report.status, "partial");
  assert.equal(inspected.report.inspection, "static");
  assert.equal(inspected.report.operations.activatePet.supported, false);
  assert.equal(inspected.report.operations.convertPoses.supported, true);
  assert.equal((await inspectOriginalProject(source, "plugin")).report.operations.convertPoses.supported, false);
  const project = await store.archive(inspected);
  const copied = await store.directory(project.id);
  assert.equal(await readFile(join(copied, "conf/actions.xml"), "utf8"), originalXml, "不把原 XML 改成宿主逻辑");
  await assert.rejects(() => readFile(join(copied, "pet.json")), "默认保存不隐式转换 Shimeji");
  await assert.rejects(() => store.setApplication(project.id, join(source, "dangerous.exe")), "不能执行导入项目自带的程序");
  const externalApp = join(root, "installed-app.exe");
  await writeFile(externalApp, "用户自行安装的应用占位；测试不执行");
  await assert.rejects(() => assertOriginalProjectExecutable(externalApp), "仅有 exe 后缀不等于可执行程序");
  await store.setApplication(project.id, externalApp);
  assert.equal((await store.get(project.id)).report.operations.openApplication.supported, true);
  assert.equal((await store.application(project.id)).applicationPath, externalApp);
  assert.equal((await store.get(project.id)).report.operations.runStandalone.supported, false);
  if (process.platform === "win32") {
    await writeFile(externalApp, executableHeader);
    assert.equal((await store.get(project.id)).standalone?.mode, "original-application");
    assert.equal((await store.get(project.id)).report.operations.runStandalone.supported, true);
  }

  const invalid = join(root, "unsupported-manifest");
  await mkdir(invalid);
  await writeFile(join(invalid, "plugin.json"), '{"manifestVersion":99,"entry":"main.js"}');
  await writeFile(join(invalid, "main.js"), 'throw new Error("不得执行")');
  const invalidSelection = await inspectOriginalProject(join(invalid, "plugin.json"), "plugin");
  assert.equal(invalidSelection.report.status, "invalid");
  assert.ok(!invalidSelection.report.summary.includes("[object Object]"));
  const invalidProject = await store.archive(invalidSelection);
  assert.equal(await readFile(join(await store.directory(invalidProject.id), "main.js"), "utf8"), 'throw new Error("不得执行")');

  const native = join(root, "native");
  await mkdir(native);
  const pluginJson = '{"manifestVersion":3,"id":"community.test","name":"测试","version":"1.0.0","runtime":"javascript","sdkVersion":"3.0.0","entry":"index.js","permissions":[]}';
  await writeFile(join(native, "plugin.json"), pluginJson);
  await writeFile(join(native, "index.js"), 'throw new Error("静态检测不执行入口")');
  const nativeSelection = await inspectOriginalProject(join(native, "plugin.json"), "plugin");
  assert.equal(nativeSelection.report.status, "native");
  const nativeOriginal = await store.archive(nativeSelection);
  const nativeOriginalDirectory = await store.directory(nativeOriginal.id);
  assert.equal((await store.archive(nativeSelection)).id, nativeOriginal.id, "原字节未变时可复用已有托管副本");
  await writeFile(join(nativeOriginalDirectory, "index.js"), 'throw new Error("用户编辑的副本")');
  await assert.rejects(() => store.archive(nativeSelection), "不能把已编辑托管副本当成本轮检测快照安装");
  assert.equal(await readFile(join(nativeOriginalDirectory, "index.js"), "utf8"), 'throw new Error("用户编辑的副本")', "拒绝后保留用户编辑，不覆盖");
  await writeFile(join(nativeOriginalDirectory, "index.js"), nativeSelection.files.get("index.js")!);
  await writeFile(join(nativeOriginalDirectory, "extra.txt"), "额外文件也属于原件变化");
  await assert.rejects(() => store.archive(nativeSelection));
  await rm(join(nativeOriginalDirectory, "extra.txt"));
  const nativePet = join(root, "native-pet");
  await mkdir(nativePet);
  await writeFile(join(nativePet, "pet.json"), '{"id":"original-test","displayName":"原桌宠","spritesheetPath":"spritesheet.webp"}');
  await writeFile(join(nativePet, "spritesheet.webp"), "坏图像");
  assert.equal((await inspectOriginalProject(nativePet, "pet")).report.status, "invalid");
  await writeFile(join(nativePet, "spritesheet.webp"), await sharp({ create: { width: 1536, height: 1872, channels: 4, background: "transparent" } }).webp().toBuffer());
  assert.equal((await inspectOriginalProject(join(nativePet, "pet.json"), "pet")).report.status, "native");

  // 凭证不能跨窗口，插件取消权限保留选择，外部原项目不进入本机运行时。
  const handlers = new Map<string, (event: { sender: { id: number } }, ...args: unknown[]) => unknown | Promise<unknown>>();
  let nextSource = source;
  let nativeCalls = 0;
  let cancelPlugin = true;
  const launches: string[] = [];
  const deps: OriginalProjectIpcDependencies = {
    registerHandle: (channel, handler) => { handlers.set(channel, handler); },
    authorizeSender: () => undefined,
    isCurrentSender: () => true,
    chooseSource: async () => nextSource,
    chooseApplication: async () => externalApp,
    chooseEntry: async (_event, directory) => join(directory, "program.exe"),
    chooseJava: async () => null,
    launchExecutable: async (target) => { launches.push(target.path); return 12345; },
    openPath: async () => undefined,
    store,
    installNativePet: async () => { nativeCalls += 1; },
    installNativePlugin: async () => { nativeCalls += 1; return { ok: true, canceled: cancelPlugin }; },
    convertShimeji: async () => undefined,
    onNativeChanged: () => undefined,
  };
  const lifecycle = installControlCenterOriginalProjectIpcHandlers(deps);
  const event = { sender: { id: 1 } };
  const selection = await handlers.get("openpets:project-inspect")!(event, "pet") as { selectionId: string };
  await assert.rejects(async () => handlers.get("openpets:project-import")!({ sender: { id: 2 } }, selection.selectionId));
  const imported = await handlers.get("openpets:project-import")!(event, selection.selectionId) as { nativeInstalled: boolean };
  assert.equal(imported.nativeInstalled, false);
  assert.equal(nativeCalls, 0);
  if (process.platform === "win32") {
    const opened = await handlers.get("openpets:project-run-standalone")!(event, project.id) as { projectStarted: boolean; mode: string };
    assert.equal(opened.mode, "original-application");
    assert.equal(opened.projectStarted, false, "启动包外原应用不能算作品已加载");
    assert.deepEqual(launches, [externalApp]);

    const programSource = join(root, "独立程序 空格&目录");
    await mkdir(programSource);
    await writeFile(join(programSource, "program.exe"), executableHeader);
    await writeFile(join(programSource, "README.txt"), "保持原目录资源，不改为宿主动作");
    const program = await store.archive(await inspectOriginalProject(programSource, "pet"));
    assert.equal(program.report.status, "external");
    assert.equal(program.report.operations.activatePet.supported, false);
    assert.equal(program.standalone?.mode, "project-program");
    const programDirectory = await store.directory(program.id);
    const started = await handlers.get("openpets:project-run-standalone")!(event, program.id) as { projectStarted: boolean; mode: string; pid: number };
    assert.equal(started.mode, "project-program");
    assert.equal(started.projectStarted, true);
    assert.equal(started.pid, 12345);
    assert.equal(launches.at(-1), join(programDirectory, "program.exe"));
    assert.equal(await readFile(join(programDirectory, "README.txt"), "utf8"), "保持原目录资源，不改为宿主动作");
    await assert.rejects(() => store.setEntry(program.id, externalApp), "项目入口不能越过托管目录");

    await writeFile(join(programDirectory, "program.runtimeconfig.json"), JSON.stringify({ runtimeOptions: { framework: { name: "Microsoft.WindowsDesktop.App", version: "99.0.0" } } }));
    assert.equal((await store.get(program.id)).report.operations.runStandalone.supported, false, "声明的桌面运行环境缺失时不能启用独立运行");
    assert.match((await store.get(program.id)).standalone?.message ?? "", /Microsoft.WindowsDesktop.App/);
    await rm(join(programDirectory, "program.runtimeconfig.json"));

    await writeFile(join(programDirectory, "second.exe"), executableHeader);
    assert.equal((await store.get(program.id)).report.operations.runStandalone.supported, false, "多个程序不能自动挑第一个运行");
    await handlers.get("openpets:project-choose-entry")!(event, program.id);
    assert.equal((await store.get(program.id)).entryRelativePath, "program.exe");
    assert.equal((await store.get(program.id)).report.operations.runStandalone.supported, true);
    await writeFile(join(programDirectory, "program.exe"), "程序已替换为无效文件");
    assert.equal((await store.get(program.id)).report.operations.runStandalone.supported, false);
    const before = launches.length;
    await assert.rejects(async () => handlers.get("openpets:project-run-standalone")!(event, program.id));
    assert.equal(launches.length, before, "点击前重新检测变更入口，不能执行已失效程序");

    const shimejiProgram = join(root, "shimeji-program");
    await mkdir(join(shimejiProgram, "conf"), { recursive: true });
    await writeFile(join(shimejiProgram, "conf/actions.xml"), originalXml);
    await writeFile(join(shimejiProgram, "Shimeji-ee.exe"), executableHeader);
    const incomplete = await store.archive(await inspectOriginalProject(shimejiProgram, "pet"));
    assert.equal(incomplete.report.operations.runStandalone.supported, false, "缺少 JAR 的 Shimeji 不是完整原运行环境");
    assert.match(incomplete.standalone?.message ?? "", /JAR/);
  }
  nextSource = native;
  const nativeToken = await handlers.get("openpets:project-inspect")!(event, "plugin") as { selectionId: string };
  assert.equal(await handlers.get("openpets:project-import")!(event, nativeToken.selectionId), null);
  cancelPlugin = false;
  assert.equal((await handlers.get("openpets:project-import")!(event, nativeToken.selectionId) as { nativeInstalled: boolean }).nativeInstalled, true);
  nextSource = invalid;
  const invalidToken = await handlers.get("openpets:project-inspect")!(event, "plugin") as { selectionId: string };
  assert.equal((await handlers.get("openpets:project-import")!(event, invalidToken.selectionId) as { nativeInstalled: boolean }).nativeInstalled, false);
  lifecycle.dispose();

  const fixtures: unknown = JSON.parse(process.env.DESKTOP_PET_ORIGINAL_FIXTURES ?? "[]");
  assert.ok(Array.isArray(fixtures));
  const reports: Record<string, unknown>[] = [];
  for (const input of fixtures) {
    assert.ok(input && typeof input.path === "string" && (input.kind === "pet" || input.kind === "plugin"));
    const check = await inspectOriginalProject(input.path, input.kind);
    assert.equal(check.report.format, input.format);
    assert.equal(check.report.status, input.status);
    const saved = await store.archive(check);
    const preserved = await readLocalPackageFiles(await store.directory(saved.id), limits);
    assert.deepEqual([...preserved.keys()].sort(), [...check.files.keys()].sort());
    for (const [name, bytes] of check.files) assert.deepEqual(preserved.get(name), bytes, `完整原件必须保留：${name}`);
    reports.push({ path: input.path, kind: input.kind, format: check.report.format, status: check.report.status, inspection: "static", fileCount: preserved.size, originalBytesPreserved: true, packageCodeExecuted: false });
  }
  if (process.env.DESKTOP_PET_ORIGINAL_REPORT) await writeFile(process.env.DESKTOP_PET_ORIGINAL_REPORT, `${JSON.stringify(reports, null, 2)}\n`);

  const recordPath = join(root, "profile/original-projects", project.id, "record.json");
  const damaged = JSON.parse(await readFile(recordPath, "utf8"));
  damaged.project.report.operations.activatePet.supported = "伪造布尔值";
  await writeFile(recordPath, JSON.stringify(damaged));
  await assert.rejects(() => store.get(project.id), "损坏报告不能强制交给渲染器");
  await store.remove(invalidProject.id);
  assert.equal(await readFile(join(invalid, "plugin.json"), "utf8"), '{"manifestVersion":99,"entry":"main.js"}', "移除仅删除托管副本");
} finally {
  await rm(root, { recursive: true, force: true });
}
console.log("原项目导入：完整原件、原宿主隔离、独立入口与缺失运行环境、用户点击启动、权限取消凭证、跨盘应用及托管删除边界通过。");
