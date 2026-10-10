import { constants, createReadStream, type Stats } from "node:fs";
import * as fs from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";

import type { CompanionFileEntry, CompanionFileScanOptions, CompanionFileScan, CompanionFileSearch, CompanionFilePlanItem, CompanionFilePlan, CompanionFileOperationItem, CompanionFileOperation, Fingerprint } from "./companion-files-types.js";
export type { CompanionFileEntry, CompanionFileScanOptions, CompanionFileScan, CompanionFileSearch, CompanionFilePlanItem, CompanionFilePlan, CompanionFileOperationItem, CompanionFileOperation, Fingerprint } from "./companion-files-types.js";

interface StoredPlan {
  public: CompanionFilePlan;
  fingerprints: Map<string, Fingerprint>;
  nestedSources?: boolean;
}

const CATEGORY_EXTENSIONS = new Map<string, string>([
  ...[".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".csv", ".rtf", ".odt"].map((extension) => [extension, "文档"] as const),
  ...[".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".heic", ".tif", ".tiff"].map((extension) => [extension, "图片"] as const),
  ...[".mp4", ".mkv", ".mov", ".avi", ".webm", ".wmv"].map((extension) => [extension, "视频"] as const),
  ...[".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg"].map((extension) => [extension, "音频"] as const),
  ...[".zip", ".7z", ".rar", ".tar", ".gz"].map((extension) => [extension, "压缩包"] as const),
]);
const MAX_PLAN_ITEMS = 500;
const MAX_OPERATION_BYTES = 10 * 1024 ** 3;
const PLAN_LIFETIME_MS = 10 * 60_000;
const JOURNAL_RENAME_RETRY_DELAYS_MS = [25, 50, 100, 200, 400];
const SIZE_MEANING = "文件逻辑大小之和，非实际磁盘占用或可释放空间；大文件和聊天目录均不表示可以删除。";
const CHAT_DIRECTORY_PATTERN = /(?:wechat|weixin|微信|tencent.?files|qq.?files|qq聊天|filestorage|msgattach)/iu;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
}

function boundedNumber(value: number | undefined, fallback: number, maximum: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.min(maximum, Math.floor(value!))) : fallback;
}

function isWithin(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

function absoluteLocalPath(value: string): string {
  if (typeof value !== "string" || value.includes("\0") || !path.isAbsolute(value)) {
    throw new Error("请选择本机的绝对文件路径。");
  }
  if (process.platform === "win32" && (/^[\\/]{2}/u.test(value) || value.slice(2).includes(":"))) {
    throw new Error("本阶段只处理本机普通路径，不处理网络路径、设备路径或备用数据流。");
  }
  return path.resolve(value);
}

// 每层使用 lstat，拒绝符号链接和 Windows 目录联接，避免越过用户选择范围。
async function assertNoLinks(target: string): Promise<Stats> {
  const resolved = absoluteLocalPath(target);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  let stats = await fs.lstat(current);
  for (const component of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    stats = await fs.lstat(current);
    if (stats.isSymbolicLink()) {
      throw new Error("路径含符号链接或目录联接，已跳过。");
    }
  }
  return stats;
}

async function selectedDirectory(value: string, writable = false): Promise<string> {
  const root = absoluteLocalPath(value);
  if (!(await assertNoLinks(root)).isDirectory()) {
    throw new Error("选择的位置不是普通文件夹。");
  }
  if (writable) {
    if (root === path.parse(root).root) {
      throw new Error("请选具体资料文件夹，不能整理或收纳到磁盘根目录。");
    }
    const protectedRoots = process.platform === "win32"
      ? [process.env.WINDIR, process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.ProgramData, process.env.APPDATA, process.env.LOCALAPPDATA]
      : [];
    if (protectedRoots.some((protectedRoot) => protectedRoot && isWithin(path.resolve(protectedRoot), root))) {
      throw new Error("程序、系统和应用数据文件夹仅能分析，不能在这里整理或收纳。");
    }
  }
  return root;
}

/** 查看前重新核对已授权目录、真实位置和每层链接，不能由渲染器扩大路径范围。 */
export async function resolveCompanionScopedPath(rootValue: string, value: string): Promise<string> {
  const root = await selectedDirectory(rootValue);
  const target = absoluteLocalPath(value);
  if (!isWithin(root, target)) throw new Error("文件不在所选目录范围内。");
  await assertNoLinks(target);
  if (!isWithin(await fs.realpath(root), await fs.realpath(target))) throw new Error("文件真实位置超出所选目录。");
  return target;
}

function fingerprint(stats: Stats): Fingerprint {
  return { dev: stats.dev, ino: stats.ino, size: stats.size, mtimeMs: stats.mtimeMs, ctimeMs: stats.ctimeMs };
}

function sameFingerprint(actual: Stats, expected: Fingerprint): boolean {
  return actual.isFile() && !actual.isSymbolicLink() && actual.dev === expected.dev && actual.ino === expected.ino
    && actual.size === expected.size && actual.mtimeMs === expected.mtimeMs && actual.ctimeMs === expected.ctimeMs;
}

function fileEntry(target: string, stats: Stats): CompanionFileEntry {
  return { path: target, name: path.basename(target), size: stats.size, modifiedAt: stats.mtime.toISOString() };
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.lstat(target);
    return true;
  } catch (error) {
    if (errorCode(error) === "ENOENT") return false;
    throw error;
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("操作已取消。");
}

function newOperationId(): string {
  const timestamp = Date.now().toString(16).padStart(12, "0");
  const random = randomUUID().replaceAll("-", "");
  return `${timestamp.slice(0, 8)}-${timestamp.slice(8)}-7${random.slice(0, 3)}-a${random.slice(3, 6)}-${random.slice(6, 18)}`;
}

async function digestFile(target: string, signal?: AbortSignal): Promise<string> {
  throwIfAborted(signal);
  const hash = createHash("sha256");
  const stream = createReadStream(target, { signal });
  try {
    for await (const chunk of stream) hash.update(chunk);
    return hash.digest("hex");
  } finally {
    stream.destroy();
  }
}

export async function walkDirectory(
  rootValue: string,
  options: CompanionFileScanOptions,
  onFile: (entry: CompanionFileEntry, relative: string) => boolean,
): Promise<CompanionFileScan> {
  const root = await selectedDirectory(rootValue);
  const started = Date.now();
  const maxEntries = boundedNumber(options.maxEntries, 20_000, 100_000);
  const timeoutMs = boundedNumber(options.timeoutMs, 15_000, 60_000);
  const maxDepth = boundedNumber(options.maxDepth, 12, 30);
  const summary: CompanionFileScan = {
    root, measuredAt: new Date().toISOString(), elapsedMs: 0, entriesVisited: 0, filesCount: 0,
    directoriesCount: 0, bytes: 0, skippedLinks: 0, unreadable: 0, stopReason: "completed",
    depthLimited: false, chatDirectoryHint: CHAT_DIRECTORY_PATTERN.test(path.basename(root)),
    largestFiles: [], children: [], sizeMeaning: SIZE_MEANING,
  };
  const children = new Map<string, CompanionFileScan["children"][number]>();
  const stack = [{ directory: root, depth: 0 }];
  function shouldStop(): boolean {
    if (options.signal?.aborted) summary.stopReason = "cancelled";
    else if (Date.now() - started >= timeoutMs) summary.stopReason = "timeout";
    else if (summary.entriesVisited >= maxEntries) summary.stopReason = "entry-limit";
    return summary.stopReason !== "completed";
  }
  while (stack.length > 0 && !shouldStop()) {
    const { directory, depth } = stack.pop()!;
    try {
      if (!(await assertNoLinks(directory)).isDirectory()) {
        summary.unreadable += 1;
        continue;
      }
      const handle = await fs.opendir(directory);
      for await (const item of handle) {
        if (shouldStop()) break;
        summary.entriesVisited += 1;
        const target = path.join(directory, item.name);
        try {
          const stats = await fs.lstat(target);
          if (stats.isSymbolicLink()) {
            summary.skippedLinks += 1;
            continue;
          }
          if (stats.isDirectory()) {
            summary.directoriesCount += 1;
            if (depth < maxDepth) stack.push({ directory: target, depth: depth + 1 });
            else summary.depthLimited = true;
            continue;
          }
          if (!stats.isFile()) continue;
          summary.filesCount += 1;
          summary.bytes += stats.size;
          const relative = path.relative(root, target);
          const firstComponent = relative.split(path.sep)[0]!;
          const group = children.get(firstComponent) ?? {
            path: path.join(root, firstComponent), name: firstComponent, bytes: 0, filesCount: 0,
            chatDirectoryHint: CHAT_DIRECTORY_PATTERN.test(firstComponent),
          };
          group.bytes += stats.size;
          group.filesCount += 1;
          children.set(firstComponent, group);
          if (!onFile(fileEntry(target, stats), relative)) {
            summary.stopReason = "result-limit";
            break;
          }
        } catch {
          summary.unreadable += 1;
        }
      }
    } catch {
      summary.unreadable += 1;
    }
  }
  summary.children = [...children.values()].sort((a, b) => b.bytes - a.bytes).slice(0, 100);
  summary.elapsedMs = Date.now() - started;
  return summary;
}

export class CompanionFilesService {
  readonly #journalDirectory: string;
  readonly #plans = new Map<string, StoredPlan>();
  #busy = false;

  constructor(options: { journalDirectory: string }) {
    this.#journalDirectory = absoluteLocalPath(options.journalDirectory);
  }

  async analyzeDirectory(root: string, options: CompanionFileScanOptions = {}): Promise<CompanionFileScan> {
    const largest: CompanionFileEntry[] = [];
    const maxResults = boundedNumber(options.maxResults, 30, 100);
    const scan = await walkDirectory(root, options, (entry) => {
      largest.push(entry);
      largest.sort((a, b) => b.size - a.size);
      if (largest.length > maxResults) largest.pop();
      return true;
    });
    scan.largestFiles = largest;
    return scan;
  }

  async searchNames(root: string, query: string, options: CompanionFileScanOptions = {}): Promise<CompanionFileSearch> {
    if (typeof query !== "string" || !query.trim() || query.length > 200) {
      throw new Error("请输入 1 至 200 个字符的文件名关键词。");
    }
    const normalized = query.trim().toLocaleLowerCase();
    const maxResults = boundedNumber(options.maxResults, 100, 300);
    const matches: CompanionFileEntry[] = [];
    const scan = await walkDirectory(root, options, (entry) => {
      if (entry.name.toLocaleLowerCase().includes(normalized)) matches.push(entry);
      return matches.length < maxResults;
    });
    const { largestFiles: _largest, children: _children, ...metadata } = scan;
    return { root: scan.root, query: query.trim(), matches, scan: metadata };
  }

  async createOrganizePlan(rootValue: string): Promise<CompanionFilePlan> {
    const root = await selectedDirectory(rootValue, true);
    const items: CompanionFilePlanItem[] = [];
    const fingerprints = new Map<string, Fingerprint>();
    let truncated = false;
    let visited = 0;
    const started = Date.now();
    const directory = await fs.opendir(root);
    for await (const entry of directory) {
      if (items.length >= MAX_PLAN_ITEMS || visited >= 2_000 || Date.now() - started >= 15_000) {
        truncated = true;
        break;
      }
      visited += 1;
      const source = path.join(root, entry.name);
      const stats = await fs.lstat(source);
      if (stats.isDirectory() && !stats.isSymbolicLink()) continue;
      const category = CATEGORY_EXTENSIONS.get(path.extname(entry.name).toLocaleLowerCase());
      const destination = category ? path.join(root, category, entry.name) : source;
      let status: CompanionFilePlanItem["status"] = "ready";
      let reason = `按扩展名归入“${category}”，执行前会再次检查。`;
      if (!stats.isFile() || stats.isSymbolicLink()) {
        status = "skipped";
        reason = "不是普通文件，或是符号链接／目录联接。";
      } else if (!category || entry.name.startsWith(".")) {
        status = "skipped";
        reason = "仅整理常见资料类型；程序、配置、数据库和隐藏文件保留原位。";
      } else {
        try {
          await this.#checkDestinationParent(root, destination, false);
          if (await exists(destination)) {
            status = "conflict";
            reason = "目标已存在同名项目，不覆盖、不自动改名。";
          }
        } catch (error) {
          status = "conflict";
          reason = errorMessage(error);
        }
      }
      fingerprints.set(source, fingerprint(stats));
      items.push({ source, destination, size: stats.size, category: category ?? "保留原位", status, reason });
    }
    return this.#storePlan("organize", root, items, fingerprints, truncated);
  }

  async createCopyPlan(sourceFiles: string[], targetDirectory: string): Promise<CompanionFilePlan> {
    if (!Array.isArray(sourceFiles) || sourceFiles.length === 0 || sourceFiles.length > MAX_PLAN_ITEMS) {
      throw new Error(`一次请选择 1 至 ${MAX_PLAN_ITEMS} 个普通文件。`);
    }
    const root = await selectedDirectory(targetDirectory, true);
    const items: CompanionFilePlanItem[] = [];
    const fingerprints = new Map<string, Fingerprint>();
    const usedDestinations = new Set<string>();
    for (const sourceValue of sourceFiles) {
      const source = absoluteLocalPath(sourceValue);
      const stats = await assertNoLinks(source);
      if (!stats.isFile()) throw new Error("收纳只支持用户选中的普通文件，不复制文件夹。");
      const destination = path.join(root, path.basename(source));
      const key = process.platform === "win32" ? destination.toLocaleLowerCase() : destination;
      const conflict = usedDestinations.has(key) || await exists(destination);
      usedDestinations.add(key);
      fingerprints.set(source, fingerprint(stats));
      items.push({
        source, destination, size: stats.size, category: "收纳副本", status: conflict ? "conflict" : "ready",
        reason: conflict ? "目标已有同名项目或所选文件重名，不覆盖。" : "复制到所选位置，原文件保留。",
      });
    }
    return this.#storePlan("copy", root, items, fingerprints, false);
  }

  async createRecommendedOrganizePlan(rootValue: string, recommendations: readonly { relativePath: string; category: string }[], options: { signal?: AbortSignal } = {}): Promise<CompanionFilePlan> {
    const root = await selectedDirectory(rootValue, true);
    const categories = new Set(["学习", "工作", "生活", "素材", "资料", "其他"]);
    const items: CompanionFilePlanItem[] = [];
    const fingerprints = new Map<string, Fingerprint>();
    const destinations = new Set<string>();
    const sources = new Set<string>();
    const started = Date.now();
    for (const entry of recommendations.slice(0, MAX_PLAN_ITEMS)) {
      throwIfAborted(options.signal);
      if (Date.now() - started >= 15_000) throw new Error("推荐整理预览达到十五秒上限，请缩小目录范围。");
      if (!categories.has(entry.category) || path.isAbsolute(entry.relativePath)) throw new Error("推荐整理数据无效。");
      const source = await resolveCompanionScopedPath(root, path.resolve(root, entry.relativePath));
      if (sources.has(source)) throw new Error("推荐整理包含重复文件。");
      sources.add(source);
      const stats = await fs.lstat(source);
      const destination = path.join(root, entry.category, path.basename(source));
      let status: CompanionFilePlanItem["status"] = "ready";
      let reason = `按已保存推荐归入“${entry.category}”；执行后会改变实际位置。`;
      if (!stats.isFile() || !CATEGORY_EXTENSIONS.has(path.extname(source).toLowerCase())
        || entry.relativePath.split(path.sep).some((part) => part.startsWith("."))) {
        status = "skipped";
        reason = "目录、隐藏资料、程序、代码、配置和数据库保留原位。";
      } else if (source === destination) {
        status = "skipped";
        reason = "已经位于推荐分类目录。";
      } else {
        try {
          await selectedDirectory(path.dirname(source), true);
          await this.#checkDestinationParent(root, destination, false);
          const key = process.platform === "win32" ? destination.toLowerCase() : destination;
          if (destinations.has(key) || await exists(destination)) {
            status = "conflict";
            reason = "分类内出现同名文件，不覆盖、不自动改名。";
          }
          destinations.add(key);
        } catch (error) {
          status = "skipped";
          reason = errorMessage(error);
        }
      }
      fingerprints.set(source, fingerprint(stats));
      items.push({ source, destination, size: stats.size, category: entry.category, status, reason });
    }
    const plan = this.#storePlan("organize", root, items, fingerprints, recommendations.length > MAX_PLAN_ITEMS);
    this.#plans.get(plan.id)!.nestedSources = true;
    return plan;
  }

  #storePlan(kind: CompanionFilePlan["kind"], root: string, items: CompanionFilePlanItem[], fingerprints: Map<string, Fingerprint>, truncated: boolean): CompanionFilePlan {
    const now = Date.now();
    for (const [id, stored] of this.#plans) {
      if (Date.parse(stored.public.expiresAt) <= now) this.#plans.delete(id);
    }
    if (this.#plans.size >= 20) this.#plans.delete(this.#plans.keys().next().value!);
    const totalBytes = items.filter((item) => item.status === "ready").reduce((sum, item) => sum + item.size, 0);
    if (totalBytes > MAX_OPERATION_BYTES) throw new Error("本阶段一次最多操作 10 GiB，请缩小选定范围。");
    const plan: CompanionFilePlan = { id: randomUUID(), kind, root, createdAt: new Date(now).toISOString(), expiresAt: new Date(now + PLAN_LIFETIME_MS).toISOString(), items, totalBytes, truncated };
    this.#plans.set(plan.id, { public: structuredClone(plan), fingerprints });
    return plan;
  }

  async #checkDestinationParent(root: string, destination: string, create: boolean): Promise<void> {
    if (!isWithin(root, destination) || destination === root) throw new Error("目标不在所选文件夹内。");
    await selectedDirectory(root, true);
    const parent = path.dirname(destination);
    if (parent !== root && path.dirname(parent) !== root) throw new Error("整理目标只能是所选文件夹的直接分类子目录。");
    if (!(await exists(parent))) {
      if (!create) return;
      try {
        await fs.mkdir(parent);
      } catch (error) {
        if (errorCode(error) !== "EEXIST") throw error;
      }
    }
    if (!(await assertNoLinks(parent)).isDirectory()) throw new Error("目标分类位置不是普通文件夹。");
  }

  async #writeJournal(operation: CompanionFileOperation): Promise<void> {
    await assertNoLinks(path.dirname(this.#journalDirectory));
    try {
      await fs.mkdir(this.#journalDirectory);
    } catch (error) {
      if (errorCode(error) !== "EEXIST") throw error;
    }
    await assertNoLinks(this.#journalDirectory);
    const target = path.join(this.#journalDirectory, `${operation.id}.json`);
    const temporary = path.join(this.#journalDirectory, `${operation.id}.${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporary, JSON.stringify(operation, null, 2), { flag: "wx" });
      for (let attempt = 0; ; attempt += 1) {
        try {
          await fs.rename(temporary, target);
          break;
        } catch (error) {
          const code = errorCode(error);
          const retryDelay = JOURNAL_RENAME_RETRY_DELAYS_MS[attempt];
          const transientReadLock = process.platform === "win32" && (code === "EPERM" || code === "EACCES");
          if (!transientReadLock || retryDelay === undefined) {
            throw error;
          }
          // Windows 读锁可能暂时阻止替换；等待期间保留旧记录、原文件和同一份临时记录。
          await delay(retryDelay);
          await assertNoLinks(this.#journalDirectory);
          await assertNoLinks(temporary);
        }
      }
    } finally {
      await fs.rm(temporary, { force: true });
    }
  }

  async executePlan(planId: string, options: { signal?: AbortSignal } = {}): Promise<CompanionFileOperation> {
    if (this.#busy) throw new Error("另一个文件操作正在执行，请等待结束。");
    const stored = this.#plans.get(planId);
    if (!stored || Date.parse(stored.public.expiresAt) <= Date.now()) throw new Error("计划已失效，请重新预览。");
    if (!stored.public.items.some((item) => item.status === "ready")) throw new Error("这份计划没有可执行文件，请先处理冲突或改选范围。");
    this.#plans.delete(planId);
    this.#busy = true;
    const operation: CompanionFileOperation = {
      version: 1, id: newOperationId(), kind: stored.public.kind, root: stored.public.root,
      ...(stored.nestedSources ? { recommended: true as const } : {}),
      createdAt: new Date().toISOString(), status: "running",
      items: stored.public.items.filter((item) => item.status === "ready").map((item) => ({ source: item.source, destination: item.destination, status: "pending", message: "等待执行" })),
    };
    try {
      await this.#writeJournal(operation);
      for (const item of operation.items) {
        if (options.signal?.aborted) break;
        try {
          await this.#checkDestinationParent(operation.root, item.destination, true);
          if (operation.kind === "organize") {
            if (stored.nestedSources) await resolveCompanionScopedPath(operation.root, item.source);
            else if (path.dirname(item.source) !== operation.root) throw new Error("整理源文件越过所选顶层范围。");
          }
          const before = await assertNoLinks(item.source);
          const expected = stored.fingerprints.get(item.source)!;
          if (!sameFingerprint(before, expected)) throw new Error("文件在预览后发生变化，已保留原位。");
          if (await exists(item.destination)) throw new Error("目标后来出现同名项目，已跳过。 ");
          const sourceDigest = await digestFile(item.source, options.signal);
          if (!sameFingerprint(await assertNoLinks(item.source), expected)) throw new Error("文件在读取时变化，已保留原位。");
          // COPYFILE_EXCL 在实际创建时拒绝同名目标，不能仅依赖预先 exists 检查。
          await fs.copyFile(item.source, item.destination, constants.COPYFILE_EXCL);
          if (!sameFingerprint(await assertNoLinks(item.source), expected)) throw new Error("复制时源文件发生变化，保留两份文件以供核对。");
          await this.#checkDestinationParent(operation.root, item.destination, false);
          const destinationDigest = await digestFile(item.destination);
          if (destinationDigest !== sourceDigest) throw new Error("副本校验未通过，原文件保留，请核对目标副本。");
          item.digest = sourceDigest;
          item.destinationFingerprint = fingerprint(await assertNoLinks(item.destination));
          item.status = "prepared";
          item.message = "副本校验通过，正在保存操作记录。";
          await this.#writeJournal(operation);
          if (operation.kind === "organize") {
            if (!sameFingerprint(await assertNoLinks(item.source), expected)) throw new Error("源文件后来变化，保留两份文件以供核对。");
            await fs.unlink(item.source);
          }
          item.status = "completed";
          item.message = operation.kind === "organize" ? "已整理，可撤销。" : "已复制，原文件保留，可撤销副本。";
        } catch (error) {
          item.status = "failed";
          item.message = errorMessage(error);
        }
        await this.#writeJournal(operation);
      }
      operation.status = options.signal?.aborted ? "cancelled" : operation.items.every((item) => item.status === "completed") ? "completed" : "partial";
      await this.#writeJournal(operation);
      return structuredClone(operation);
    } finally {
      this.#busy = false;
    }
  }

  async #readJournal(operationId: string): Promise<CompanionFileOperation> {
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/u.test(operationId)) throw new Error("无效操作编号。");
    await assertNoLinks(this.#journalDirectory);
    const target = path.join(this.#journalDirectory, `${operationId}.json`);
    const stats = await assertNoLinks(target);
    if (!stats.isFile() || stats.size > 1024 * 1024) throw new Error("操作记录格式无效。");
    const data: unknown = JSON.parse(await fs.readFile(target, "utf8"));
    if (typeof data !== "object" || data === null) throw new Error("操作记录格式无效。");
    const value = data as Record<string, unknown>;
    if (value.version !== 1 || value.id !== operationId || (value.kind !== "organize" && value.kind !== "copy") || typeof value.root !== "string" || typeof value.createdAt !== "string" || !Array.isArray(value.items) || value.items.length > MAX_PLAN_ITEMS) {
      throw new Error("操作记录格式无效。");
    }
    const root = absoluteLocalPath(value.root);
    if (value.recommended !== undefined && value.recommended !== true) throw new Error("推荐整理记录格式无效。");
    for (const entry of value.items) {
      if (typeof entry !== "object" || entry === null) throw new Error("操作条目格式无效。");
      const item = entry as Record<string, unknown>;
      if (typeof item.source !== "string" || typeof item.destination !== "string" || typeof item.status !== "string" || typeof item.message !== "string") throw new Error("操作条目格式无效。");
      const source = absoluteLocalPath(item.source);
      const destination = absoluteLocalPath(item.destination);
      const sourceOutside = value.recommended === true ? !isWithin(root, source) || source === root : path.dirname(source) !== root;
      if (!isWithin(root, destination) || destination === root || (value.kind === "organize" && sourceOutside)) throw new Error("操作记录路径超出范围。");
      if (item.digest !== undefined && (typeof item.digest !== "string" || !/^[a-f0-9]{64}$/u.test(item.digest))) throw new Error("操作记录校验值无效。");
      if (item.destinationFingerprint !== undefined) {
        const expected = item.destinationFingerprint;
        if (typeof expected !== "object" || expected === null || !["dev", "ino", "size", "mtimeMs", "ctimeMs"].every((key) => key in expected && typeof (expected as Record<string, unknown>)[key] === "number" && Number.isFinite((expected as Record<string, unknown>)[key]))) throw new Error("操作记录文件状态无效。");
      }
    }
    return data as CompanionFileOperation;
  }

  async listHistory(): Promise<CompanionFileOperation[]> {
    if (!(await exists(this.#journalDirectory))) return [];
    await assertNoLinks(this.#journalDirectory);
    const entries = await fs.readdir(this.#journalDirectory);
    const operations: CompanionFileOperation[] = [];
    for (const name of entries.filter((entry) => /^[0-9a-f]{8}-[0-9a-f-]{27}\.json$/u.test(entry)).sort().slice(-200)) {
      try {
        operations.push(await this.#readJournal(name.slice(0, -5)));
      } catch {
        // 损坏记录不具有执行权限；正常记录仍可查看和撤销。
      }
    }
    return operations.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 50);
  }

  async undoOperation(operationId: string, options: { signal?: AbortSignal } = {}): Promise<CompanionFileOperation> {
    if (this.#busy) throw new Error("另一个文件操作正在执行，请等待结束。");
    this.#busy = true;
    try {
      const operation = await this.#readJournal(operationId);
      await selectedDirectory(operation.root, true);
      for (const item of [...operation.items].reverse()) {
        if (options.signal?.aborted) break;
        if (!["completed", "prepared", "undo-skipped"].includes(item.status) || !item.digest || !item.destinationFingerprint) continue;
        try {
          await this.#checkDestinationParent(operation.root, item.destination, false);
          const stats = await assertNoLinks(item.destination);
          if (!sameFingerprint(stats, item.destinationFingerprint) || await digestFile(item.destination, options.signal) !== item.digest) {
            throw new Error("目标文件在操作后变化，不撤销、不覆盖。 ");
          }
          if (operation.kind === "organize") {
            await selectedDirectory(path.dirname(item.source), true);
            if (await exists(item.source)) throw new Error("原位置已有项目，不覆盖；请人工核对。");
            await fs.copyFile(item.destination, item.source, constants.COPYFILE_EXCL);
            if (await digestFile(item.source) !== item.digest) throw new Error("恢复副本校验失败，两份文件均保留。 ");
          }
          if (!sameFingerprint(await assertNoLinks(item.destination), item.destinationFingerprint)) throw new Error("撤销时目标发生变化，保留文件以供核对。 ");
          await fs.unlink(item.destination);
          item.status = "undone";
          item.message = operation.kind === "organize" ? "已恢复原位置。" : "已撤销本次收纳副本，原文件未改变。";
        } catch (error) {
          item.status = "undo-skipped";
          item.message = errorMessage(error);
        }
        await this.#writeJournal(operation);
      }
      operation.status = options.signal?.aborted ? "cancelled" : operation.items.every((item) => item.status === "undone" || item.status === "pending" || item.status === "failed") ? "undone" : "partial";
      await this.#writeJournal(operation);
      return structuredClone(operation);
    } finally {
      this.#busy = false;
    }
  }
}

