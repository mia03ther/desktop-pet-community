import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdir, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import sharp from "sharp";
import { assertLocalPackagePath, readLocalPackageFiles, selectLocalPackageRoot } from "./local-package-files.js";
import { assertOriginalProjectExecutable, assertOriginalProjectRunDependencies, findOriginalProjectExecutables, findOriginalProjectJava, inspectOriginalProjectJar, inspectOriginalProjectJava, type OriginalProjectRunTarget } from "./original-project-execution.js";
import { readBoundedRegularFile } from "./pet-file-safety.js";
import { validateInstalledPetMetadata, validatePetMediaBytes } from "./pet-media-files.js";
import { isMediaPetMetadata, uniquePetMediaFiles } from "./pet-media-contract.js";
import { getCodexPetSpriteLayout, maxCodexPetJsonBytes, validateCodexPetSpritesheet } from "./codex-pets-core.js";
import { collectDeclaredPluginFiles, preparePluginFileBytes, validatePluginSpriteBytes } from "./plugin-assets.js";
import { defaultMaxPluginManifestBytes } from "./plugin-manifest-reader.js";
import { localPluginManifestNames } from "./plugin-local-loader.js";
import { validateImportedPluginManifest } from "./plugin-manifest.js";
import type { OriginalProject, OriginalProjectCapability, OriginalProjectCompatibilityReport, OriginalProjectKind, OriginalProjectOperation, OriginalProjectStandalone } from "./original-project-types.js";

const packageLimits = { maxBytes: 200 * 1024 * 1024, maxFileBytes: 100 * 1024 * 1024, maxFiles: 1000 };
const projectIdPattern = /^project-[a-f0-9]{24}$/;

export interface InspectedOriginalProject {
  readonly kind: OriginalProjectKind;
  readonly displayName: string;
  readonly sourcePath: string;
  readonly files: ReadonlyMap<string, Buffer>;
  readonly report: OriginalProjectCompatibilityReport;
}

/** 只读取文件与清单；“原生”表示静态边界通过，不代表实际运行过。 */
export async function inspectOriginalProject(sourcePath: string, kind: OriginalProjectKind): Promise<InspectedOriginalProject> {
  const selectedPath = resolve(sourcePath);
  const sourceStat = await lstat(selectedPath);
  const manifestNames = kind === "pet" ? ["pet.json"] : [...localPluginManifestNames];
  const source = sourceStat.isFile() && manifestNames.includes(basename(selectedPath)) ? dirname(selectedPath) : selectedPath;
  const files = await readLocalPackageFiles(source, packageLimits);
  let displayName = basename(source).replace(/\.zip$/i, "");
  const report = await inspectCompatibility(files, kind);
  for (const [name, bytes] of files) {
    if (basename(name) !== "pet.json" && !(localPluginManifestNames as readonly string[]).includes(basename(name))) continue;
    try {
      const metadata = readJson(bytes, 1024 * 1024);
      if (!isRecord(metadata)) continue;
      const title = metadata.displayName ?? metadata.name;
      if (typeof title === "string" && !title.startsWith("$t:")) displayName = title.slice(0, 80);
    } catch {
      // 无法解析的清单仍可作为原件保存，报告已说明其运行限制。
    }
  }
  return { kind, displayName, sourcePath: source, files, report };
}

async function inspectCompatibility(files: ReadonlyMap<string, Buffer>, kind: OriginalProjectKind): Promise<OriginalProjectCompatibilityReport> {
  const names = [...files.keys()];
  const has = (suffix: string): boolean => names.some((name) => name === suffix || name.endsWith(`/${suffix}`));
  if (kind === "pet" && has("pet.json")) {
    try {
      const selected = selectLocalPackageRoot(files, ["pet.json"]);
      const value = readJson(selected.files.get("pet.json")!, maxCodexPetJsonBytes);
      if (!isRecord(value) || typeof value.id !== "string") throw new Error("缺少桌宠编号。");
      const metadata = validateInstalledPetMetadata(value, value.id);
      if (isMediaPetMetadata(metadata)) {
        for (const file of uniquePetMediaFiles(metadata)) {
          const bytes = selected.files.get(file);
          if (!bytes) throw new Error(`缺少动作媒体：${file}`);
          await validatePetMediaBytes(bytes, file, metadata);
        }
      } else {
        const bytes = selected.files.get(metadata.spritesheetPath);
        if (!bytes) throw new Error("缺少桌宠图集。");
        await validateCodexPetSpritesheet(bytes, metadata);
        if (metadata.spriteVersionNumber !== 2) {
          const image = sharp(bytes, { animated: true, failOn: "error", limitInputPixels: 50_000_000 });
          const info = await image.metadata();
          const layout = getCodexPetSpriteLayout(metadata);
          if (info.format !== "webp" || (info.pages ?? 1) !== 1 || info.width !== layout.frameWidth * layout.columns || info.height !== layout.frameHeight * layout.rows) throw new Error("V1 图集必须是尺寸符合声明布局的单页 WebP。");
          await image.raw().toBuffer();
        }
      }
      return makeReport("native", isMediaPetMetadata(metadata) ? "desktop-pet-media" : "codex-pet", "desktop pet / Codex 素材契约", "清单及声明素材静态检查通过。可使用本机动作播放器；不代表原项目的 AI 或行为引擎已运行。", [], kind);
    } catch (error) {
      return makeReport("invalid", "pet-manifest", "原项目环境待确认", `当前桌宠运行边界未通过：${errorText(error)}。可完整保留原项目。`, ["有效的本机桌宠清单及声明素材"], kind);
    }
  }
  if (kind === "plugin" && names.some((name) => (localPluginManifestNames as readonly string[]).includes(basename(name)))) {
    try {
      if (files.size > 1000 || [...files.values()].some((bytes) => bytes.length > 5 * 1024 * 1024) || [...files.values()].reduce((total, bytes) => total + bytes.length, 0) > 32 * 1024 * 1024) throw new Error("本机插件安装只接受 32 MiB 总量、5 MiB 单文件以内的包。");
      const selected = selectLocalPackageRoot(files, localPluginManifestNames);
      const result = validateImportedPluginManifest(readJson(selected.files.get(selected.manifestName)!, defaultMaxPluginManifestBytes));
      if (!result.ok) throw new Error(result.errors.map((issue) => `${issue.path}: ${issue.message}`).join("；"));
      const manifest = result.manifest;
      if (manifest.manifestVersion !== 1) {
        const entry = selected.files.get(manifest.entry);
        if (!entry || entry.length > 1024 * 1024) throw new Error("插件入口缺失或超过 1 MiB。");
        for (const file of collectDeclaredPluginFiles(manifest)) {
          const bytes = selected.files.get(file.relPath);
          if (!bytes) throw new Error(`缺少声明文件：${file.relPath}`);
          await validatePluginSpriteBytes(file, preparePluginFileBytes(file, bytes), manifest);
        }
      }
      return makeReport("native", `desktop-pet-sdk-v${manifest.manifestVersion}`, "desktop pet 插件 SDK", "清单、权限声明与资源静态检查通过。安装仍需原权限确认，代码由原沙箱管理；静态图片仅是图片。", [], kind);
    } catch (error) {
      return makeReport("invalid", "plugin-manifest", "原项目插件环境待确认", `当前插件运行边界未通过：${errorText(error)}。不会执行其中的代码，可完整保留原件。`, ["兼容的 SDK 清单、权限及声明文件"], kind);
    }
  }
  if (has("conf/actions.xml")) {
    return makeReport("partial", "shimeji", "Shimeji / Java 及该项目的原行为引擎", "完整保留 XML、图像与原逻辑。当前宿主不运行 Java、条件表达式或窗口交互；可另建无条件 PNG 动作的转换副本。", ["Shimeji Java 行为引擎", "条件表达式、ActionReference、窗口交互与原生移动行为"], kind);
  }
  if (names.some((name) => name.toLowerCase().endsWith(".lps"))) {
    return makeReport("external", "vpet", "VPet / Windows .NET、WPF 及原 Mod 加载器", "保留 LPS、DLL 和素材原件。当前宿主没有 VPet 的程序环境，不加载或执行这些文件。", ["VPet 原宿主", ".NET / WPF 及原 Mod 接口"], kind);
  }
  for (const [name, bytes] of files) {
    if (basename(name) !== "package.json") continue;
    try {
      const metadata = readJson(bytes, 1024 * 1024);
      if (!isRecord(metadata)) continue;
      if (typeof metadata.$schema === "string" && metadata.$schema.includes("raycast") || Array.isArray(metadata.commands) && metadata.platforms !== undefined) {
        return makeReport("external", "raycast", "Raycast 及其扩展 API / 平台依赖", "这是原 Raycast 扩展项目。清单与代码完整保存，当前宿主不执行 Raycast API 或 npm scripts。", ["Raycast 扩展宿主", "原项目构建与平台环境"], kind);
      }
      if (typeof metadata.name === "string" && /(?:proj-airi|^@airi\/|^airi$)/i.test(metadata.name)) {
        return makeReport("external", "airi", "AIRI / 原项目 Node.js、Web 或桌面运行环境", "保留 AIRI 工程和原脚本。当前宿主不安装依赖、不运行原项目启动命令。", ["AIRI 原宿主与依赖", "原人物模型、音频及服务配置"], kind);
      }
    } catch {
      // 未知工程的清单解析失败不改变原件。
    }
  }
  return makeReport("external", "unknown", "原项目环境未识别", "尚未找到本宿主支持的运行契约。可以完整保留工程并选择自己的原应用；不会自动执行包内命令。", ["可识别的原宿主及运行接口"], kind);
}

function makeReport(status: OriginalProjectCompatibilityReport["status"], format: string, environment: string, summary: string, missing: string[], kind: OriginalProjectKind): OriginalProjectCompatibilityReport {
  const native = status === "native";
  const disabled = (reason: string): OriginalProjectCapability => ({ supported: false, reason });
  const available: OriginalProjectCapability = { supported: true };
  const operations: Record<OriginalProjectOperation, OriginalProjectCapability> = {
    activatePet: native && kind === "pet" ? available : disabled("当前宿主不能以原项目引擎启动桌宠。"),
    customActions: native && kind === "pet" ? available : disabled("原动作与逻辑保留在工程中，当前播放器未接入其运行时。"),
    aiLink: native && kind === "pet" ? available : disabled("未接入本宿主动作状态契约。"),
    pluginSettings: native && kind === "plugin" ? available : disabled("此项目未运行在本机插件 SDK 中。"),
    openFolder: available,
    chooseApplication: available,
    openApplication: disabled("请先选择自己已安装的原应用。"),
    chooseEntry: disabled("请先保留原项目，再选择其中的独立程序。"),
    chooseJava: disabled("请先保留包含 JAR 的原项目，再选择已安装的 Java。"),
    runStandalone: disabled("尚未发现可启动的独立程序，也未选择原应用。"),
    convertPoses: format === "shimeji" && kind === "pet" ? available : disabled("当前格式没有独立的姿势转换入口。"),
  };
  return { status, format, originalEnvironment: environment, summary, inspection: "static", missingCapabilities: missing, operations };
}

/** 原项目与本机安装分开保存；此所有者不执行包内程序或写入原文件夹。 */
export class OriginalProjectStore {
  readonly #root: string;
  constructor(userDataPath: string) {
    this.#root = resolve(userDataPath, "original-projects");
  }

  async archive(selection: InspectedOriginalProject): Promise<OriginalProject> {
    await this.#ensureRoot();
    const digest = createHash("sha256").update(selection.kind);
    for (const [name, bytes] of [...selection.files].sort(([left], [right]) => left.localeCompare(right))) digest.update(JSON.stringify([name, bytes.length])).update(bytes);
    const id = `project-${digest.digest("hex").slice(0, 24)}`;
    const destination = join(this.#root, id);
    let existing = false;
    try {
      await lstat(destination);
      existing = true;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    if (existing) {
      const project = await this.get(id);
      let preserved: ReadonlyMap<string, Buffer>;
      try {
        preserved = await readLocalPackageFiles(await this.directory(id), packageLimits);
      } catch (error) {
        throw new Error(`托管原件无法与本次检测快照核对，已保留现有副本，未安装或覆盖：${errorText(error)}`);
      }
      const changed = preserved.size !== selection.files.size || [...selection.files].some(([name, bytes]) => !preserved.get(name)?.equals(bytes));
      if (changed) {
        throw new Error("托管原件与本次检测快照不一致，可能已被编辑。已保留现有副本，未安装或覆盖；请先另存编辑内容，再移除该托管副本后重新导入。");
      }
      return project;
    }
    const temporary = join(this.#root, `.pending-${randomUUID()}`);
    const project: OriginalProject = { id, kind: selection.kind, displayName: selection.displayName, importedAt: new Date().toISOString(), report: selection.report };
    await mkdir(join(temporary, "project"), { recursive: true });
    try {
      for (const [name, bytes] of selection.files) {
        const output = join(temporary, "project", name);
        await mkdir(dirname(output), { recursive: true });
        await writeFile(output, bytes, { flag: "wx", mode: 0o600 });
      }
      await writeFile(join(temporary, "record.json"), JSON.stringify({ schemaVersion: 1, project, sourcePath: selection.sourcePath }), { flag: "wx", mode: 0o600 });
      await rename(temporary, destination);
      return await this.get(id);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }

  async list(): Promise<readonly OriginalProject[]> {
    await this.#ensureRoot();
    const projects: OriginalProject[] = [];
    for (const entry of await readdir(this.#root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || !projectIdPattern.test(entry.name)) continue;
      projects.push(await this.get(entry.name));
    }
    return projects.sort((left, right) => right.importedAt.localeCompare(left.importedAt));
  }

  async get(id: string): Promise<OriginalProject> {
    const directory = await this.#directory(id);
    const record = readJson(await readBoundedRegularFile(join(directory, "record.json"), 64 * 1024, "原项目记录"), 64 * 1024);
    if (!isRecord(record) || record.schemaVersion !== 1 || !isRecord(record.project) || record.project.id !== id) throw new Error("原项目记录无效。");
    const project = record.project;
    if ((project.kind !== "pet" && project.kind !== "plugin") || typeof project.displayName !== "string" || typeof project.importedAt !== "string" || !isCompatibilityReport(project.report) || project.applicationPath !== undefined && typeof project.applicationPath !== "string" || project.entryRelativePath !== undefined && typeof project.entryRelativePath !== "string" || project.javaExecutablePath !== undefined && typeof project.javaExecutablePath !== "string" || project.nativeInstalled !== undefined && typeof project.nativeInstalled !== "boolean" || project.convertedCopyInstalled !== undefined && typeof project.convertedCopyInstalled !== "boolean") throw new Error("原项目记录无效。");
    const value = project as unknown as OriginalProject;
    const standalone = await this.#standalone(value, join(directory, "project"));
    const canChooseJava = process.platform === "win32" && (value.report.format === "shimeji" || standalone.candidates.some((path) => path.toLowerCase().endsWith(".jar")));
    const report = {
      ...value.report,
      operations: {
        ...value.report.operations,
        chooseEntry: { supported: process.platform === "win32", reason: process.platform === "win32" ? undefined : "当前项目程序选择仅支持 Windows EXE / JAR。" },
        chooseJava: canChooseJava ? { supported: true } : { supported: false, reason: "此项目未发现可执行 JAR，Java 不能直接运行其他宿主的源码或插件。" },
        runStandalone: { supported: standalone.mode !== "unavailable", reason: standalone.mode === "unavailable" ? standalone.message : undefined },
      },
    };
    return { ...value, standalone, report };
  }

  async directory(id: string): Promise<string> {
    await this.get(id);
    const directory = join(await this.#directory(id), "project");
    await assertRealDirectory(directory);
    return directory;
  }

  async setNativeInstalled(id: string): Promise<OriginalProject> {
    return this.#update(id, { nativeInstalled: true });
  }

  async setConvertedCopyInstalled(id: string): Promise<void> {
    await this.#update(id, { convertedCopyInstalled: true });
  }

  async setApplication(id: string, applicationPath: string): Promise<void> {
    const application = resolve(applicationPath);
    const file = await lstat(application);
    if (!file.isFile() || file.isSymbolicLink() || await realpath(application) !== application || process.platform === "win32" && extname(application).toLowerCase() !== ".exe") throw new Error("请选择已安装的原应用程序；Windows 只接受 EXE，不接受脚本、快捷方式或包内命令。");
    const record = readJson(await readBoundedRegularFile(join(await this.#directory(id), "record.json"), 64 * 1024, "原项目记录"), 64 * 1024);
    const source = isRecord(record) && typeof record.sourcePath === "string" ? record.sourcePath : "";
    if (isOriginalProjectPathInside(this.#root, application) || source && (application === source || isOriginalProjectPathInside(source, application))) throw new Error("不能选择导入工程或托管副本中的程序，请选择另外安装的原宿主应用。");
    const project = await this.get(id);
    const report = { ...project.report, operations: { ...project.report.operations, openApplication: { supported: true } } };
    await this.#update(id, { applicationPath: application, entryRelativePath: undefined, report });
  }

  async application(id: string): Promise<{ readonly applicationPath: string; readonly directory: string }> {
    const project = await this.get(id);
    if (!project.applicationPath) throw new Error("请先选择原应用。");
    await this.setApplication(id, project.applicationPath);
    return { applicationPath: project.applicationPath, directory: await this.directory(id) };
  }

  async setEntry(id: string, path: string): Promise<void> {
    const directory = await this.directory(id);
    const entry = resolve(path);
    if (!isOriginalProjectPathInside(directory, entry)) throw new Error("请选择托管原项目文件夹中的独立 EXE 入口。");
    const name = relative(directory, entry).split("\\").join("/");
    assertLocalPackagePath(name);
    if (extname(entry).toLowerCase() === ".jar") await inspectOriginalProjectJar(entry, directory);
    else await assertOriginalProjectExecutable(entry);
    await this.#update(id, { entryRelativePath: name, applicationPath: undefined });
  }

  async setJava(id: string, path: string): Promise<void> {
    const javaPath = resolve(path);
    const directory = await this.directory(id);
    const record = readJson(await readBoundedRegularFile(join(await this.#directory(id), "record.json"), 64 * 1024, "原项目记录"), 64 * 1024);
    const source = isRecord(record) && typeof record.sourcePath === "string" ? record.sourcePath : "";
    if (isOriginalProjectPathInside(this.#root, javaPath) || isOriginalProjectPathInside(directory, javaPath) || source && (javaPath === source || isOriginalProjectPathInside(source, javaPath))) throw new Error("请选择另外安装的 Java，不能把导入工程中的程序作为已安装运行环境。");
    await inspectOriginalProjectJava(javaPath, true);
    await inspectOriginalProjectJava(javaPath);
    await this.#update(id, { javaExecutablePath: javaPath });
  }

  async standaloneTarget(id: string): Promise<OriginalProjectRunTarget> {
    const project = await this.get(id);
    const standalone = project.standalone;
    if (!standalone || standalone.mode === "unavailable" || !standalone.entryPath) throw new Error(standalone?.message ?? "此项目没有独立运行入口。");
    if (standalone.mode === "original-application") {
      const application = await this.application(id);
      await assertOriginalProjectExecutable(application.applicationPath);
      await assertOriginalProjectRunDependencies("original-application", application.applicationPath);
      return { path: application.applicationPath, mode: "original-application", format: "original-application" };
    }
    assertLocalPackagePath(standalone.entryPath);
    const directory = await this.directory(id);
    const path = resolve(directory, standalone.entryPath);
    if (!isOriginalProjectPathInside(directory, path)) throw new Error("独立程序入口超出项目目录。");
    if (extname(path).toLowerCase() !== ".jar") await assertOriginalProjectExecutable(path);
    await assertOriginalProjectRunDependencies(project.report.format, path, project.javaExecutablePath, directory);
    return { path, mode: "project-program", format: project.report.format, projectDirectory: directory, javaExecutablePath: project.javaExecutablePath };
  }

  async #standalone(project: OriginalProject, directory: string): Promise<OriginalProjectStandalone> {
    const unavailable = (message: string, candidates: readonly string[] = []): OriginalProjectStandalone => ({ mode: "unavailable", message, candidates });
    if (process.platform !== "win32") return unavailable("当前独立运行仅接入 Windows EXE / Java JAR；请在原环境中使用此项目。");
    try {
      await assertRealDirectory(directory);
      const discovered = await findOriginalProjectExecutables(directory);
      let candidates = discovered.filter((entry) => project.report.format !== "shimeji" || !entry.toLowerCase().endsWith(".exe") || !discovered.some((jar) => jar.toLowerCase() === entry.slice(0, -4).toLowerCase() + ".jar"));
      if (project.report.format === "shimeji") {
        const engines: string[] = [];
        for (const entry of candidates.filter((path) => path.toLowerCase().endsWith(".jar"))) {
          const jar = await inspectOriginalProjectJar(resolve(directory, entry), directory);
          if (jar.mainClass === "com.group_finity.mascot.Main") engines.push(entry);
        }
        // 官方 Shimeji 主类可明确识别；JNA 的诊断 Main-Class 不是桌宠入口。
        if (engines.length) candidates = engines;
      }
      const program = async (entry: string): Promise<OriginalProjectStandalone> => {
        const path = resolve(directory, entry);
        const jarPath = extname(path).toLowerCase() === ".jar" ? path : project.report.format === "shimeji" ? join(dirname(path), basename(path, extname(path)) + ".jar") : undefined;
        if (jarPath) {
          const jar = await inspectOriginalProjectJar(jarPath, directory);
          const details = { entryPath: entry, entryType: "jar" as const, minimumJavaVersion: jar.minimumJavaVersion, candidates };
          try {
            const java = await findOriginalProjectJava(jar, project.javaExecutablePath);
            return { ...details, mode: "project-program", javaExecutablePath: java.path, javaVersion: java.version, message: `已检测原 JAR 与 Java ${java.version}。独立运行将使用原程序和资源，不改写行为引擎；未验证所有动作和依赖。` };
          } catch (error) {
            return { ...details, mode: "unavailable", message: errorText(error) };
          }
        }
        await assertOriginalProjectRunDependencies(project.report.format, path);
        return { mode: "project-program", entryPath: entry, entryType: "exe", candidates, message: "可独立启动原 Windows 程序并沿用原资源；静态检查不证明完整功能已经可用。" };
      };
      if (project.entryRelativePath) {
        assertLocalPackagePath(project.entryRelativePath);
        if (!discovered.includes(project.entryRelativePath)) return unavailable("原项目程序已缺失、格式不正确或架构不适用，请重新选择入口。", candidates);
        return await program(project.entryRelativePath);
      }
      if (project.applicationPath) {
        try {
          await assertOriginalProjectExecutable(project.applicationPath);
          await assertOriginalProjectRunDependencies("original-application", project.applicationPath);
          return { mode: "original-application", entryPath: project.applicationPath, candidates, message: "仅启动你选择的原应用。此项目不会自动加载，请在原应用中导入保留目录。" };
        } catch (error) {
          return unavailable(`所选原应用暂不可独立运行：${errorText(error)}`, candidates);
        }
      }
      if (candidates.length === 1) {
        return await program(candidates[0]!);
      }
      if (candidates.length > 1) return unavailable("发现多个程序，无法判断原项目入口，请先选择项目入口。", candidates);
      return unavailable(project.report.status === "native" ? "此素材或 SDK 插件依赖 desktop pet，没有独立程序入口。" : "原项目没有可执行 EXE 或带 Main-Class 的 JAR，可能只有源码、素材或需要原宿主；请先选择已经安装的原应用。");
    } catch (error) {
      return unavailable(`无法检测独立入口：${errorText(error)}`);
    }
  }

  async remove(id: string): Promise<void> {
    await this.get(id);
    await rm(await this.#directory(id), { recursive: true, force: true });
  }

  async #update(id: string, patch: Partial<OriginalProject>): Promise<OriginalProject> {
    const directory = await this.#directory(id);
    const record = readJson(await readBoundedRegularFile(join(directory, "record.json"), 64 * 1024, "原项目记录"), 64 * 1024);
    const project = { ...await this.get(id), ...patch };
    const temporary = join(directory, `.record-${randomUUID()}.json`);
    await writeFile(temporary, JSON.stringify({ ...record as Record<string, unknown>, project }), { flag: "wx", mode: 0o600 });
    try {
      await rename(temporary, join(directory, "record.json"));
    } finally {
      await rm(temporary, { force: true });
    }
    return this.get(id);
  }

  async #ensureRoot(): Promise<void> {
    await mkdir(this.#root, { recursive: true });
    await assertRealDirectory(this.#root);
  }

  async #directory(id: string): Promise<string> {
    if (!projectIdPattern.test(id)) throw new Error("原项目编号无效。");
    await this.#ensureRoot();
    const directory = join(this.#root, id);
    await assertRealDirectory(directory);
    return directory;
  }
}

function readJson(bytes: Buffer, maximum: number): unknown {
  if (bytes.length > maximum) throw new Error("清单超过读取上限。");
  return JSON.parse(bytes.toString("utf8"));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : "结构无法识别").slice(0, 500);
}

function isMissing(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

async function assertRealDirectory(directory: string): Promise<void> {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(directory) !== directory) throw new Error("原项目目录无效或经过链接。");
}

export function isOriginalProjectPathInside(root: string, path: string, pathRelative: (root: string, path: string) => string = relative, absolute: (path: string) => boolean = isAbsolute): boolean {
  const delta = pathRelative(root, path);
  return delta !== "" && delta !== ".." && !delta.startsWith("../") && !delta.startsWith("..\\") && !absolute(delta);
}

function isCompatibilityReport(value: unknown): value is OriginalProjectCompatibilityReport {
  if (!isRecord(value) || !["native", "partial", "external", "invalid"].includes(String(value.status)) || value.inspection !== "static" || typeof value.format !== "string" || typeof value.originalEnvironment !== "string" || typeof value.summary !== "string" || !Array.isArray(value.missingCapabilities) || !value.missingCapabilities.every((capability) => typeof capability === "string") || !isRecord(value.operations)) return false;
  for (const operation of ["activatePet", "customActions", "aiLink", "pluginSettings", "openFolder", "chooseApplication", "openApplication", "convertPoses"]) {
    const capability = value.operations[operation];
    if (!isRecord(capability) || typeof capability.supported !== "boolean" || capability.reason !== undefined && typeof capability.reason !== "string") return false;
  }
  return true;
}
