import { execFile, spawn } from "node:child_process";
import { lstat, open, readdir, realpath } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { readLocalPackageFiles } from "./local-package-files.js";
import { readBoundedRegularFile } from "./pet-file-safety.js";

export interface OriginalProjectRunTarget {
  readonly path: string;
  readonly mode: "project-program" | "original-application";
  readonly format: string;
  readonly projectDirectory?: string;
  readonly javaExecutablePath?: string;
}

export interface OriginalProjectJavaRuntime {
  readonly path: string;
  readonly version: string;
  readonly major: number;
}

export interface OriginalProjectJar {
  readonly path: string;
  readonly mainClass: string;
  readonly minimumJavaVersion: number;
}

/** 复用有界 ZIP 读取，只识别可执行 JAR，不运行清单、类或依赖安装。 */
export async function inspectOriginalProjectJar(path: string, projectDirectory = dirname(path)): Promise<OriginalProjectJar> {
  if (extname(path).toLowerCase() !== ".jar") throw new Error("请选择原项目的 JAR 入口。");
  const stat = await lstat(path).catch(() => null);
  if (!stat) throw new Error("未找到原 JAR 入口，请保留原程序及声明资源。");
  if (!stat.isFile() || stat.isSymbolicLink() || await realpath(path) !== path) throw new Error("JAR 必须是未经过链接的普通文件。");
  const files = await readLocalPackageFiles(path, { maxBytes: 100 * 1024 * 1024, maxFileBytes: 100 * 1024 * 1024, maxFiles: 10000 });
  const manifest = files.get("META-INF/MANIFEST.MF");
  if (!manifest || manifest.length > 64 * 1024) throw new Error("JAR 缺少有效的 META-INF/MANIFEST.MF。");
  const section = manifest.toString("utf8").replace(/\r\n/g, "\n").replace(/\n /g, "").split(/\n\n/, 1)[0]!;
  const fields = new Map<string, string>();
  for (const line of section.split("\n").filter(Boolean)) {
    const colon = line.indexOf(": ");
    const key = line.slice(0, colon).toLowerCase();
    if (colon < 1 || fields.has(key)) throw new Error("JAR 主清单格式无效或字段重复。");
    fields.set(key, line.slice(colon + 2));
  }
  const mainClass = fields.get("main-class");
  if (!mainClass || !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(mainClass) || !files.has(`${mainClass.replaceAll(".", "/")}.class`)) {
    throw new Error("JAR 没有可识别的 Main-Class；库文件不能当作独立程序。");
  }
  let minimumJavaVersion = 1;
  for (const [name, bytes] of files) {
    if (!name.endsWith(".class") || name.startsWith("META-INF/versions/")) continue;
    if (bytes.length < 8 || bytes.readUInt32BE(0) !== 0xcafebabe || bytes.readUInt16BE(6) < 45) throw new Error("JAR 包含无法识别的 Java 类文件。");
    if (bytes.readUInt16BE(4) === 65535) throw new Error("此 JAR 使用 Java 预览特性，需要原项目自己的启动配置，当前不自动添加实验参数。");
    minimumJavaVersion = Math.max(minimumJavaVersion, bytes.readUInt16BE(6) - 44);
  }
  for (const dependency of (fields.get("class-path") ?? "").split(/\s+/).filter(Boolean)) {
    let name: string;
    try { name = decodeURIComponent(dependency); } catch { throw new Error("JAR 声明的依赖路径无效。"); }
    if (/[\u0000-\u001f:#?\\]/u.test(name) || isAbsolute(name)) throw new Error("JAR 声明远程或绝对依赖，当前不自动获取或加载。");
    const dependencyPath = resolve(dirname(path), name);
    const delta = relative(projectDirectory, dependencyPath);
    if (delta === ".." || delta.startsWith(`..${sep}`) || isAbsolute(delta)) throw new Error("JAR 依赖超出保留项目，请在原宿主中处理。");
    const stat = await lstat(dependencyPath).catch(() => null);
    if (!stat?.isFile() || stat.isSymbolicLink() || await realpath(dependencyPath) !== dependencyPath) throw new Error(`缺少 JAR 声明的本地依赖：${name}`);
  }
  return { path, mainClass, minimumJavaVersion };
}

function javaMajor(version: string): number {
  return Number(version.startsWith("1.") ? version.split(".")[1] : version.split(/[.+_-]/)[0]);
}

/** 读取完整 Java 安装的声明；选择时和实际启动时再探测 -version。 */
export async function inspectOriginalProjectJava(path: string, probe = false): Promise<OriginalProjectJavaRuntime> {
  if (!/^javaw?\.exe$/i.test(basename(path))) throw new Error("请选择已经安装的 Java 的 bin/java.exe 或 bin/javaw.exe。");
  await assertOriginalProjectExecutable(path);
  let version: string | undefined;
  if (probe) {
    const output = await new Promise<string>((complete, reject) => {
      execFile(path, ["-version"], { shell: false, windowsHide: true, timeout: 5000, maxBuffer: 16 * 1024, env: javaEnvironment() }, (error, stdout, stderr) => {
        if (error) reject(new Error("所选 Java 未能返回版本信息，请选择可正常运行的已安装 Java。"));
        else complete(stdout + stderr);
      });
    });
    version = /(?:openjdk|java) version "([\d][\w.+-]*)"/i.exec(output)?.[1];
  } else {
    const release = await readBoundedRegularFile(join(dirname(dirname(path)), "release"), 16 * 1024, "Java 运行环境信息");
    version = /^JAVA_VERSION="([\d][\w.+-]*)"/m.exec(release.toString("utf8"))?.[1];
  }
  if (!version || !Number.isSafeInteger(javaMajor(version)) || javaMajor(version) < 1) throw new Error("未能识别 Java 版本，请选择完整安装中的 Java 程序。");
  return { path, version, major: javaMajor(version) };
}

export async function findOriginalProjectJava(jar: OriginalProjectJar, selectedPath?: string, probe = false): Promise<OriginalProjectJavaRuntime> {
  if (selectedPath) {
    const runtime = await inspectOriginalProjectJava(selectedPath, probe);
    if (runtime.major < jar.minimumJavaVersion) throw new Error(`此 JAR 至少需要 Java ${jar.minimumJavaVersion}，所选 Java 为 ${runtime.version}；请另选已安装的运行环境。`);
    return runtime;
  }
  const roots = [join(dirname(jar.path), "jre"), join(dirname(jar.path), "runtime"), process.env.JAVA_HOME, process.env.JRE_HOME].filter((value): value is string => !!value);
  for (const root of roots) {
    for (const program of ["java.exe", "javaw.exe"]) {
      try {
        const runtime = await inspectOriginalProjectJava(join(root, "bin", program), probe);
        if (runtime.major >= jar.minimumJavaVersion) return runtime;
      } catch {
        // 未确认或版本不足的运行时不算可用，不在管理列表中执行上传程序。
      }
    }
  }
  throw new Error(`此 JAR 至少需要 Java ${jar.minimumJavaVersion}，尚未检测到兼容环境；请选择已经安装的 Java，不会自动安装。`);
}

function javaEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const name of ["JAVA_TOOL_OPTIONS", "_JAVA_OPTIONS", "JDK_JAVA_OPTIONS", "CLASSPATH"]) delete env[name];
  return env;
}

/** 仅验证 Windows 程序结构；不运行文件，也不将静态检查称为运行测试。 */
export async function assertOriginalProjectExecutable(path: string): Promise<void> {
  if (process.platform !== "win32") throw new Error("当前独立程序入口只支持 Windows EXE。");
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || await realpath(path) !== path || extname(path).toLowerCase() !== ".exe") {
    throw new Error("请选择普通 EXE 文件，不接受脚本、链接或清单命令。");
  }
  const handle = await open(path, "r");
  try {
    const header = Buffer.alloc(64);
    if ((await handle.read(header, 0, 64, 0)).bytesRead !== 64 || header.toString("ascii", 0, 2) !== "MZ") {
      throw new Error("文件不是有效的 Windows 程序。");
    }
    const offset = header.readUInt32LE(60);
    if (offset < 64 || offset > 1024 * 1024 || offset + 26 > stat.size) {
      throw new Error("Windows 程序头无效。");
    }
    const pe = Buffer.alloc(26);
    if ((await handle.read(pe, 0, 26, offset)).bytesRead !== 26 || pe.readUInt32LE(0) !== 0x00004550 || !(pe.readUInt16LE(22) & 0x0002) || pe.readUInt16LE(22) & 0x2000) {
      throw new Error("文件不是可执行程序入口。");
    }
    const machine = pe.readUInt16LE(4);
    const machines = process.arch === "arm64" ? [0x14c, 0x8664, 0xaa64] : process.arch === "x64" ? [0x14c, 0x8664] : [0x14c];
    if (!machines.includes(machine) || ![0x10b, 0x20b].includes(pe.readUInt16LE(24))) {
      throw new Error("程序架构不适用于当前 Windows。");
    }
  } finally {
    await handle.close();
  }
}

/** 已知原宿主的必要文件检查，不下载或自动执行 Java/.NET/npm。 */
export async function assertOriginalProjectRunDependencies(format: string, executable: string, javaExecutablePath?: string, projectDirectory = dirname(executable)): Promise<void> {
  if (extname(executable).toLowerCase() === ".jar") {
    await findOriginalProjectJava(await inspectOriginalProjectJar(executable, projectDirectory), javaExecutablePath);
    return;
  }
  await assertDeclaredDotNetRuntime(executable);
  if (format !== "shimeji") return;
  const directory = dirname(executable);
  const jar = join(directory, basename(executable, extname(executable)) + ".jar");
  const stat = await lstat(jar).catch(() => null);
  if (!stat?.isFile() || stat.isSymbolicLink() || await realpath(jar) !== jar) {
    throw new Error("该 Shimeji 入口缺少同目录的原 JAR 行为引擎，不能只凭 EXE 启动完整项目。");
  }
  await findOriginalProjectJava(await inspectOriginalProjectJar(jar, projectDirectory), javaExecutablePath);
}

async function assertDeclaredDotNetRuntime(executable: string): Promise<void> {
  const directory = dirname(executable);
  const configPath = join(directory, basename(executable, extname(executable)) + ".runtimeconfig.json");
  const stat = await lstat(configPath).catch(() => null);
  if (!stat) return;
  const config: unknown = JSON.parse((await readBoundedRegularFile(configPath, 64 * 1024, ".NET 运行要求")).toString("utf8"));
  if (!config || typeof config !== "object" || !("runtimeOptions" in config)) throw new Error("原程序的 .NET 运行要求无效。");
  const options = config.runtimeOptions;
  if (!options || typeof options !== "object") throw new Error("原程序的 .NET 运行要求无效。");
  const frameworks = "frameworks" in options && Array.isArray(options.frameworks)
    ? options.frameworks
    : "framework" in options ? [options.framework] : [];
  // includedFrameworks 为自包含发布；仍由原程序负责其实际加载，不启动系统安装器。
  for (const framework of frameworks) {
    if (!framework || typeof framework !== "object" || typeof framework.name !== "string" || typeof framework.version !== "string" || !/^[A-Za-z0-9._-]+$/.test(framework.name) || !/^\d+\.\d+\.\d+$/.test(framework.version)) {
      throw new Error("无法识别原程序声明的 .NET 运行环境。");
    }
    const requested = framework.version.split(".").map(Number);
    const roots = [join(directory, "dotnet"), process.env.DOTNET_ROOT, process.env.ProgramFiles && join(process.env.ProgramFiles, "dotnet")].filter((value): value is string => !!value);
    let found = false;
    for (const root of roots) {
      const versions = await readdir(join(root, "shared", framework.name)).catch(() => []);
      if (versions.some(version => {
        if (!/^\d+\.\d+\.\d+$/.test(version)) return false;
        const actual = version.split(".").map(Number);
        return actual[0] === requested[0] && actual[1] === requested[1] && actual[2]! >= requested[2]!;
      })) {
        found = true;
        break;
      }
    }
    if (!found) throw new Error(`缺少原程序声明的 ${framework.name} ${framework.version} 运行环境；不会自动安装。`);
  }
}

export async function findOriginalProjectExecutables(directory: string): Promise<readonly string[]> {
  if (process.platform !== "win32") return [];
  const candidates: string[] = [];
  let entries = 0;
  async function visit(current: string, depth: number): Promise<void> {
    if (depth > 12) return;
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (++entries > 2000) throw new Error("项目文件过多，无法检测独立入口。");
      const path = join(current, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (await realpath(path) !== path) continue;
        if (/^(?:jre|runtime|dotnet|jdk(?:[-_].*)?)$/i.test(entry.name)) continue;
        await visit(path, depth + 1);
      }
      else if (entry.isFile() && [".exe", ".jar"].includes(extname(entry.name).toLowerCase())) {
        try {
          if (extname(entry.name).toLowerCase() === ".jar") await inspectOriginalProjectJar(path, directory);
          else await assertOriginalProjectExecutable(path);
          candidates.push(relative(directory, path).split(sep).join("/"));
        } catch {
          // 坏程序、库 JAR、错误架构和 DLL 仍保留为原件，不成为可启动入口。
        }
      }
    }
  }
  await visit(directory, 0);
  return candidates.sort();
}

/** 此入口只由明确的用户点击调用；参数不经 shell，不读取包内启动命令。 */
export async function prepareOriginalProjectLaunch(target: OriginalProjectRunTarget): Promise<{ readonly executable: string; readonly args: readonly string[]; readonly cwd: string; readonly env?: NodeJS.ProcessEnv }> {
  const jarPath = extname(target.path).toLowerCase() === ".jar" ? target.path
    : target.format === "shimeji" && target.mode === "project-program" ? join(dirname(target.path), basename(target.path, extname(target.path)) + ".jar") : undefined;
  if (jarPath) {
    const jar = await inspectOriginalProjectJar(jarPath, target.projectDirectory ?? dirname(jarPath));
    const java = await findOriginalProjectJava(jar, target.javaExecutablePath, true);
    return { executable: java.path, args: ["-jar", jarPath], cwd: dirname(jarPath), env: javaEnvironment() };
  }
  await assertOriginalProjectExecutable(target.path);
  await assertOriginalProjectRunDependencies(target.format, target.path);
  return { executable: target.path, args: [], cwd: dirname(target.path) };
}

/** 此入口只由明确的用户点击调用；参数不经 shell，不读取包内启动命令。 */
export async function launchOriginalProjectExecutable(target: OriginalProjectRunTarget, canLaunch: () => boolean = () => true): Promise<number> {
  const plan = await prepareOriginalProjectLaunch(target);
  if (!canLaunch()) throw new Error("控制中心操作已经结束，未启动原程序。");
  return new Promise<number>((resolve, reject) => {
    const child = spawn(plan.executable, [...plan.args], {
      cwd: plan.cwd,
      env: plan.env,
      shell: false,
      windowsHide: true,
      detached: true,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("spawn", () => {
      if (!child.pid) {
        reject(new Error("原程序未能启动。"));
        return;
      }
      child.unref();
      resolve(child.pid);
    });
  });
}
