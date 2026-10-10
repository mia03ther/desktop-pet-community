import { constants, closeSync, fstatSync, lstatSync, openSync, readSync } from "node:fs";
import * as fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { resolveCompanionScopedPath, walkDirectory } from "./companion-files.js";
import type {
  CompanionFileLibraryCategory,
  CompanionFileLibraryEntry,
  CompanionFileLibraryFileType,
  CompanionFileLibraryRecommendations,
  CompanionFileLibraryRoot,
  CompanionFileLibraryScan,
  CompanionFileLibrarySearch,
  CompanionFileLibrarySearchFilter,
  CompanionFileLibrarySnapshot,
} from "./companion-file-library-types.js";

interface LibraryState {
  version: 1;
  roots: CompanionFileLibraryRoot[];
  entries: CompanionFileLibraryEntry[];
}

const MAX_ROOTS = 12;
const MAX_ENTRIES = 20_000;
const MAX_STATE_BYTES = 16 * 1024 * 1024;
const SCAN_TIMEOUT_MS = 15_000;
const CATEGORIES = new Set<CompanionFileLibraryCategory>(["学习", "工作", "生活", "素材", "资料", "其他"]);
const FILE_TYPES = new Set<CompanionFileLibraryFileType>(["文档", "图片", "视频", "音频", "压缩包", "代码", "其他"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const FILE_TYPE_EXTENSIONS = new Map<string, CompanionFileLibraryFileType>([
  ...[".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".csv", ".rtf", ".odt", ".epub"].map((extension) => [extension, "文档"] as const),
  ...[".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".heic", ".tif", ".tiff", ".psd"].map((extension) => [extension, "图片"] as const),
  ...[".mp4", ".mkv", ".mov", ".avi", ".webm", ".wmv"].map((extension) => [extension, "视频"] as const),
  ...[".mp3", ".wav", ".flac", ".aac", ".m4a", ".ogg"].map((extension) => [extension, "音频"] as const),
  ...[".zip", ".7z", ".rar", ".tar", ".gz"].map((extension) => [extension, "压缩包"] as const),
  ...[".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".c", ".cpp", ".h", ".cs", ".rs", ".go", ".html", ".css", ".sql"].map((extension) => [extension, "代码"] as const),
]);
const NAME_RULES: Array<{ category: CompanionFileLibraryCategory; pattern: RegExp }> = [
  { category: "学习", pattern: /课件|课程|课本|作业|复习|考试|课堂|讲义|论文|学习|lecture|syllabus|homework|assignment|exam/iu },
  { category: "工作", pattern: /会议|合同|项目|周报|月报|工作|招聘|简历|proposal|meeting|contract|resume/iu },
  { category: "生活", pattern: /账单|发票|旅行|行程|家庭|生活|证件|保险|itinerary|invoice|receipt/iu },
];

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("分类库数据格式无效。");
  }
  return value as Record<string, unknown>;
}

function keys(value: Record<string, unknown>, expected: string[]): void {
  if (Object.keys(value).length !== expected.length || expected.some((key) => !Object.hasOwn(value, key))) {
    throw new Error("分类库数据含缺少或未知字段。");
  }
}

function text(value: unknown, maximum: number): string {
  if (typeof value !== "string" || !value || value.length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new Error("分类库文字或路径无效。");
  }
  return value;
}

function identifier(value: unknown): string {
  const id = text(value, 36);
  if (!UUID_PATTERN.test(id)) {
    throw new Error("分类库编号无效。");
  }
  return id;
}

function timestamp(value: unknown): string {
  const result = text(value, 40);
  if (!Number.isFinite(Date.parse(result))) {
    throw new Error("分类库时间无效。");
  }
  return result;
}

function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("分类库统计无效。");
  }
  return value;
}

function localPath(value: unknown): string {
  const result = pathText(value);
  if (!path.isAbsolute(result)
    || process.platform === "win32" && (/^[\\/]{2}/u.test(result) || result.slice(2).includes(":"))) {
    throw new Error("分类库只接受本机普通绝对路径。");
  }
  return path.resolve(result);
}

function pathText(value: unknown): string {
  if (typeof value !== "string" || !value || value.length > 4096 || value.includes("\0")) {
    throw new Error("分类库路径无效。");
  }
  return value;
}

function pathKey(value: string): string {
  return process.platform === "win32" ? value.toLowerCase() : value;
}

function inside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === "" || relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function relativePath(value: unknown): string {
  const result = pathText(value);
  if (path.isAbsolute(result) || result === "." || path.normalize(result) !== result
    || result.split(path.sep).includes("..") || process.platform === "win32" && result.includes(":")) {
    throw new Error("分类库文件引用必须留在选定目录内。");
  }
  return result;
}

function category(value: unknown): CompanionFileLibraryCategory {
  if (typeof value !== "string" || !CATEGORIES.has(value as CompanionFileLibraryCategory)) {
    throw new Error("请选择学习、工作、生活、素材、资料或其他分类。");
  }
  return value as CompanionFileLibraryCategory;
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function throwIfCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("分类库操作已取消，原索引保持不变。");
  }
}

function assertNoStoredLinks(target: string): void {
  const parsed = path.parse(target);
  let current = parsed.root;
  for (const component of target.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    if (lstatSync(current).isSymbolicLink()) {
      throw new Error("分类库数据目录不能含符号链接或目录联接。");
    }
  }
}

function validateScan(value: unknown, root: string): CompanionFileLibraryScan | null {
  if (value === null) {
    return null;
  }
  const input = record(value);
  keys(input, ["root", "measuredAt", "elapsedMs", "entriesVisited", "filesCount", "directoriesCount", "bytes", "skippedLinks", "unreadable", "stopReason", "depthLimited", "chatDirectoryHint", "partial"]);
  if (localPath(input.root) !== root || !["completed", "timeout", "entry-limit", "result-limit"].includes(String(input.stopReason))) {
    throw new Error("分类库扫描范围或结果无效。");
  }
  if (typeof input.depthLimited !== "boolean" || typeof input.chatDirectoryHint !== "boolean" || typeof input.partial !== "boolean") {
    throw new Error("分类库扫描状态无效。");
  }
  const partial = input.stopReason !== "completed" || input.depthLimited || count(input.unreadable) > 0;
  if (input.partial !== partial) {
    throw new Error("分类库部分扫描状态不一致。");
  }
  return {
    root,
    measuredAt: timestamp(input.measuredAt),
    elapsedMs: count(input.elapsedMs),
    entriesVisited: count(input.entriesVisited),
    filesCount: count(input.filesCount),
    directoriesCount: count(input.directoriesCount),
    bytes: count(input.bytes),
    skippedLinks: count(input.skippedLinks),
    unreadable: count(input.unreadable),
    stopReason: input.stopReason as CompanionFileLibraryScan["stopReason"],
    depthLimited: input.depthLimited,
    chatDirectoryHint: input.chatDirectoryHint,
    partial,
  };
}

function validateState(value: unknown): LibraryState {
  const input = record(value);
  keys(input, ["version", "roots", "entries"]);
  if (input.version !== 1 || !Array.isArray(input.roots) || input.roots.length > MAX_ROOTS
    || !Array.isArray(input.entries) || input.entries.length > MAX_ENTRIES) {
    throw new Error("分类库版本或容量无效。");
  }
  const roots: CompanionFileLibraryRoot[] = [];
  const rootIds = new Set<string>();
  for (const value of input.roots) {
    const item = record(value);
    keys(item, ["id", "path", "addedAt", "lastScannedAt", "scan", "lastError"]);
    const id = identifier(item.id);
    const rootPath = localPath(item.path);
    if (rootIds.has(id) || roots.some((root) => inside(root.path, rootPath) || inside(rootPath, root.path))) {
      throw new Error("分类库目录不能重复或嵌套。");
    }
    const scan = validateScan(item.scan, rootPath);
    roots.push({
      id,
      path: rootPath,
      addedAt: timestamp(item.addedAt),
      lastScannedAt: item.lastScannedAt === null ? null : timestamp(item.lastScannedAt),
      scan,
      lastError: item.lastError === null ? null : text(item.lastError, 2000),
    });
    rootIds.add(id);
  }
  const entryIds = new Set<string>();
  const entryPaths = new Set<string>();
  const entries: CompanionFileLibraryEntry[] = [];
  for (const value of input.entries) {
    const item = record(value);
    keys(item, ["id", "rootId", "relativePath", "name", "size", "modifiedAt", "category", "fileType", "classificationSource", "reason", "availability"]);
    const id = identifier(item.id);
    const rootId = identifier(item.rootId);
    const relative = relativePath(item.relativePath);
    const name = pathText(item.name);
    const referenceKey = `${rootId}:${pathKey(relative)}`;
    if (!rootIds.has(rootId) || entryIds.has(id) || entryPaths.has(referenceKey) || path.basename(relative) !== name
      || typeof item.fileType !== "string" || !FILE_TYPES.has(item.fileType as CompanionFileLibraryFileType)
      || item.classificationSource !== "rule" && item.classificationSource !== "recommendation"
      || !["indexed", "missing", "unverified"].includes(String(item.availability))) {
      throw new Error("分类库文件引用无效。");
    }
    entries.push({
      id,
      rootId,
      relativePath: relative,
      name,
      size: count(item.size),
      modifiedAt: timestamp(item.modifiedAt),
      category: category(item.category),
      fileType: item.fileType as CompanionFileLibraryFileType,
      classificationSource: item.classificationSource,
      reason: text(item.reason, 1000),
      availability: item.availability as CompanionFileLibraryEntry["availability"],
    });
    entryIds.add(id);
    entryPaths.add(referenceKey);
  }
  return { version: 1, roots, entries };
}

function classify(name: string): Pick<CompanionFileLibraryEntry, "category" | "fileType" | "reason" | "classificationSource"> {
  const extension = path.extname(name).toLowerCase();
  const fileType = FILE_TYPE_EXTENSIONS.get(extension) ?? "其他";
  for (const rule of NAME_RULES) {
    const clue = name.match(rule.pattern)?.[0];
    if (clue) {
      return {
        category: rule.category,
        fileType,
        classificationSource: "rule",
        reason: `文件名包含“${clue}”，建议归为${rule.category}；未读取或识别文件内容。`,
      };
    }
  }
  let selected: CompanionFileLibraryCategory = "其他";
  if (["图片", "视频", "音频", "代码"].includes(fileType)) {
    selected = "素材";
  } else if (fileType === "文档" || fileType === "压缩包") {
    selected = "资料";
  }
  return {
    category: selected,
    fileType,
    classificationSource: "rule",
    reason: fileType === "其他"
      ? "扩展名没有可解释的分类规则，保留在其他；未读取文件内容。"
      : `根据扩展名${extension}识别为${fileType}，建议归为${selected}；未读取文件内容。`,
  };
}

export class CompanionFileLibrary {
  readonly #dataDirectory: string;
  readonly #statePath: string;
  #state: LibraryState = { version: 1, roots: [], entries: [] };
  #index: Array<{ entry: CompanionFileLibraryEntry; name: string }> = [];
  #storageError: string | null = null;
  #readError = false;
  #busy = false;

  constructor(dataDirectory: string) {
    this.#dataDirectory = localPath(dataDirectory);
    this.#statePath = path.join(this.#dataDirectory, "companion-file-library.json");
    try {
      assertNoStoredLinks(this.#dataDirectory);
      if (!lstatSync(this.#dataDirectory).isDirectory()) {
        throw new Error("分类库数据位置不是普通目录。");
      }
      try {
        assertNoStoredLinks(this.#statePath);
      } catch (error) {
        if (errorCode(error) === "ENOENT") {
          return;
        }
        throw error;
      }
      const descriptor = openSync(this.#statePath, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const stats = fstatSync(descriptor);
        if (!stats.isFile() || stats.size > MAX_STATE_BYTES) {
          throw new Error("分类库存档不是有界普通文件。");
        }
        const buffer = Buffer.alloc(stats.size + 1);
        let length = 0;
        while (length < buffer.length) {
          const read = readSync(descriptor, buffer, length, buffer.length - length, null);
          if (read === 0) {
            break;
          }
          length += read;
        }
        const after = fstatSync(descriptor);
        if (length !== stats.size || after.size !== stats.size || after.mtimeMs !== stats.mtimeMs || after.ctimeMs !== stats.ctimeMs) {
          throw new Error("分类库存档在读取中变化，已停止读取。");
        }
        const bytes = buffer.subarray(0, length);
        const content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        this.#state = validateState(JSON.parse(content));
        this.#rebuildIndex();
      } finally {
        closeSync(descriptor);
      }
    } catch (error) {
      this.#readError = true;
      this.#storageError = `分类库存档读取失败，已停止修改并保留原文件：${message(error)}`;
    }
  }

  getSnapshot(): CompanionFileLibrarySnapshot {
    return structuredClone({ ...this.#state, storageError: this.#storageError });
  }

  #rebuildIndex(): void {
    this.#index = this.#state.entries.map((entry) => ({ entry, name: entry.name.normalize("NFKC").toLowerCase() }));
  }

  async #mutate(action: () => Promise<LibraryState>, signal?: AbortSignal): Promise<CompanionFileLibrarySnapshot> {
    if (this.#readError) {
      throw new Error(this.#storageError ?? "分类库存档不可用。");
    }
    if (this.#busy) {
      throw new Error("已有分类库操作正在进行，请等待或取消。");
    }
    throwIfCancelled(signal);
    this.#busy = true;
    try {
      const next = await action();
      throwIfCancelled(signal);
      await this.#commit(next, signal);
      return this.getSnapshot();
    } finally {
      this.#busy = false;
    }
  }

  async #commit(next: LibraryState, signal?: AbortSignal): Promise<void> {
    const validated = validateState(next);
    const content = JSON.stringify(validated);
    if (Buffer.byteLength(content, "utf8") > MAX_STATE_BYTES) {
      throw new Error("分类库元数据超过16 MiB，请减少索引目录；原索引保持不变。");
    }
    const temporary = path.join(this.#dataDirectory, `companion-file-library.${randomUUID()}.tmp`);
    let created = false;
    try {
      await resolveCompanionScopedPath(this.#dataDirectory, this.#dataDirectory);
      try {
        if (!(await fs.lstat(this.#statePath)).isFile()) {
          throw new Error("分类库存档位置不是普通文件。");
        }
        await resolveCompanionScopedPath(this.#dataDirectory, this.#statePath);
      } catch (error) {
        if (errorCode(error) !== "ENOENT") {
          throw error;
        }
      }
      throwIfCancelled(signal);
      const handle = await fs.open(temporary, "wx");
      created = true;
      try {
        await handle.writeFile(content, "utf8");
      } finally {
        await handle.close();
      }
      throwIfCancelled(signal);
      await fs.rename(temporary, this.#statePath);
      created = false;
      this.#state = validated;
      this.#rebuildIndex();
      this.#storageError = null;
    } catch (error) {
      if (!signal?.aborted) {
        this.#storageError = `分类库保存失败，原索引保持不变：${message(error)}`;
      }
      throw error;
    } finally {
      if (created) {
        await fs.rm(temporary, { force: true });
      }
    }
  }

  async addRoot(value: string, signal?: AbortSignal): Promise<CompanionFileLibrarySnapshot> {
    return this.#mutate(async () => {
      const rootPath = localPath(value);
      await resolveCompanionScopedPath(rootPath, rootPath);
      if (!(await fs.lstat(rootPath)).isDirectory()) {
        throw new Error("请选择需要索引的普通资料目录。");
      }
      if (this.#state.roots.some((root) => inside(root.path, rootPath) || inside(rootPath, root.path))) {
        throw new Error("目录已经索引，或与已有目录重叠，请刷新已有目录。");
      }
      if (this.#state.roots.length >= MAX_ROOTS) {
        throw new Error("分类库最多索引12个目录，请先移除不再使用的目录。");
      }
      const root: CompanionFileLibraryRoot = {
        id: randomUUID(),
        path: rootPath,
        addedAt: new Date().toISOString(),
        lastScannedAt: null,
        scan: null,
        lastError: null,
      };
      return this.#scan([root], [...this.#state.roots, root], signal);
    }, signal);
  }

  async refresh(signal?: AbortSignal): Promise<CompanionFileLibrarySnapshot> {
    return this.#mutate(() => this.#scan(this.#state.roots, this.#state.roots, signal), signal);
  }

  async #scan(selected: CompanionFileLibraryRoot[], roots: CompanionFileLibraryRoot[], signal?: AbortSignal): Promise<LibraryState> {
    const next = structuredClone({ version: 1 as const, roots, entries: this.#state.entries });
    const started = Date.now();
    let entriesVisited = 0;
    for (const selectedRoot of selected) {
      throwIfCancelled(signal);
      const root = next.roots.find((candidate) => candidate.id === selectedRoot.id)!;
      const previous = next.entries.filter((entry) => entry.rootId === root.id);
      const otherEntries = next.entries.filter((entry) => entry.rootId !== root.id);
      const previousByPath = new Map(previous.map((entry) => [pathKey(entry.relativePath), entry]));
      const found: CompanionFileLibraryEntry[] = [];
      const seen = new Set<string>();
      const remainingTime = SCAN_TIMEOUT_MS - (Date.now() - started);
      const remainingEntries = MAX_ENTRIES - entriesVisited;
      if (remainingTime <= 0 || remainingEntries <= 0) {
        const measuredAt = new Date().toISOString();
        root.scan = {
          root: root.path,
          measuredAt,
          elapsedMs: 0,
          entriesVisited: 0,
          filesCount: 0,
          directoriesCount: 0,
          bytes: 0,
          skippedLinks: 0,
          unreadable: 0,
          stopReason: remainingTime <= 0 ? "timeout" : "entry-limit",
          depthLimited: false,
          chatDirectoryHint: false,
          partial: true,
        };
        root.lastScannedAt = measuredAt;
        root.lastError = "本轮刷新达到总扫描上限，此目录沿用上次引用，尚未复验。";
        for (const entry of previous) {
          entry.availability = "unverified";
        }
        continue;
      }
      try {
        const summary = await walkDirectory(root.path, {
          signal,
          maxEntries: remainingEntries,
          timeoutMs: remainingTime,
          maxDepth: 12,
        }, (entry, relative) => {
          const referenceKey = pathKey(relative);
          if (found.length + otherEntries.length >= MAX_ENTRIES) {
            return false;
          }
          const old = previousByPath.get(referenceKey);
          const classification = old?.classificationSource === "recommendation"
            ? { category: old.category, fileType: classify(entry.name).fileType, classificationSource: old.classificationSource, reason: old.reason }
            : classify(entry.name);
          found.push({
            id: old?.id ?? randomUUID(),
            rootId: root.id,
            relativePath: relative,
            name: entry.name,
            size: entry.size,
            modifiedAt: entry.modifiedAt,
            ...classification,
            availability: "indexed",
          });
          seen.add(referenceKey);
          return true;
        });
        throwIfCancelled(signal);
        const { largestFiles: _largest, children: _children, sizeMeaning: _meaning, ...scan } = summary;
        const partial = scan.stopReason !== "completed" || scan.depthLimited || scan.unreadable > 0;
        root.scan = { ...scan, partial };
        root.lastScannedAt = scan.measuredAt;
        root.lastError = null;
        entriesVisited += scan.entriesVisited;
        const unseen = previous.filter((entry) => !seen.has(pathKey(entry.relativePath)));
        for (const entry of unseen) {
          entry.availability = partial ? "unverified" : "missing";
        }
        const retained = unseen.slice(0, Math.max(0, MAX_ENTRIES - otherEntries.length - found.length));
        next.entries = [...otherEntries, ...found, ...retained];
      } catch (error) {
        throwIfCancelled(signal);
        root.scan = null;
        root.lastError = `目录刷新失败：${message(error)}`.slice(0, 2000);
        for (const entry of previous) {
          entry.availability = errorCode(error) === "ENOENT" ? "missing" : "unverified";
        }
      }
    }
    return next;
  }

  async removeRoot(id: string, signal?: AbortSignal): Promise<CompanionFileLibrarySnapshot> {
    return this.#mutate(async () => {
      identifier(id);
      if (!this.#state.roots.some((root) => root.id === id)) {
        throw new Error("索引目录已移除或不存在。");
      }
      return {
        version: 1,
        roots: this.#state.roots.filter((root) => root.id !== id),
        entries: this.#state.entries.filter((entry) => entry.rootId !== id),
      };
    }, signal);
  }

  search(query: string, filter: CompanionFileLibrarySearchFilter = {}): CompanionFileLibrarySearch {
    if (typeof query !== "string" || query.length > 200 || /[\u0000-\u001f\u007f]/u.test(query)) {
      throw new Error("请输入200字符以内的文件名关键词。");
    }
    const input = record(filter);
    if (Object.keys(input).some((key) => key !== "category" && key !== "rootId" && key !== "excludeMissing")) {
      throw new Error("文件库筛选字段无效。");
    }
    if (input.excludeMissing !== undefined && typeof input.excludeMissing !== "boolean") {
      throw new Error("文件库失效引用筛选必须是布尔值。");
    }
    const selectedCategory = input.category === undefined ? undefined : category(input.category);
    const selectedRoot = input.rootId === undefined ? undefined : identifier(input.rootId);
    if (selectedRoot && !this.#state.roots.some((root) => root.id === selectedRoot)) {
      throw new Error("索引目录已移除或不存在。");
    }
    const terms = query.normalize("NFKC").trim().toLowerCase().split(/\s+/u).filter(Boolean);
    const results = this.#index.filter(({ entry, name }) =>
      (!selectedCategory || entry.category === selectedCategory)
      && (!selectedRoot || entry.rootId === selectedRoot)
      && (input.excludeMissing !== true || entry.availability !== "missing")
      && terms.every((term) => name.includes(term)));
    return {
      query: query.trim(),
      matches: structuredClone(results.slice(0, 200).map(({ entry }) => entry)),
      totalMatches: results.length,
      truncated: results.length > 200,
    };
  }

  async resolveEntry(id: string): Promise<string> {
    identifier(id);
    const entry = this.#state.entries.find((candidate) => candidate.id === id);
    const root = entry && this.#state.roots.find((candidate) => candidate.id === entry.rootId);
    if (!entry || !root || entry.availability === "missing") {
      throw new Error("文件引用已移除或丢失，请刷新分类库。");
    }
    const target = path.resolve(root.path, relativePath(entry.relativePath));
    const resolved = await resolveCompanionScopedPath(root.path, target);
    const stats = await fs.lstat(resolved);
    if (!stats.isFile() || stats.size !== entry.size || stats.mtime.toISOString() !== entry.modifiedAt) {
      throw new Error("文件已变化或不再是普通文件，请刷新分类库后定位。");
    }
    if (!this.#state.roots.some((candidate) => candidate.id === root.id && candidate.path === root.path)
      || !this.#state.entries.some((candidate) => candidate.id === entry.id && candidate.availability !== "missing")) {
      throw new Error("文件引用在定位期间已移除，请重新选择。");
    }
    return resolved;
  }

  async applyRecommendations(value: unknown, signal?: AbortSignal): Promise<CompanionFileLibrarySnapshot> {
    return this.#mutate(async () => {
      const input = record(value);
      keys(input, ["items"]);
      if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 500) {
        throw new Error("一次请选择1至500个已有文件分类。");
      }
      const items: CompanionFileLibraryRecommendations["items"] = [];
      const ids = new Set<string>();
      for (const value of input.items) {
        const item = record(value);
        keys(item, ["entryId", "category"]);
        const entryId = identifier(item.entryId);
        const entry = this.#state.entries.find((candidate) => candidate.id === entryId);
        if (!entry || entry.availability === "missing" || ids.has(entryId)) {
          throw new Error("分类推荐必须引用不同的现有文件，丢失文件需先刷新。");
        }
        items.push({ entryId, category: category(item.category) });
        ids.add(entryId);
      }
      const next = structuredClone(this.#state);
      for (const item of items) {
        const entry = next.entries.find((candidate) => candidate.id === item.entryId)!;
        entry.category = item.category;
        entry.classificationSource = "recommendation";
        entry.reason = "用户采纳的分类推荐标签；未读取文件内容，原文件保持原位置。";
      }
      return next;
    }, signal);
  }
}

let library: CompanionFileLibrary | null = null;

export function initializeCompanionFileLibrary(dataDirectory: string): CompanionFileLibrary {
  if (library) {
    throw new Error("文件分类库已经初始化。");
  }
  library = new CompanionFileLibrary(dataDirectory);
  return library;
}

export function getCompanionFileLibrary(): CompanionFileLibrary {
  if (!library) {
    throw new Error("文件分类库仍在初始化，请稍后重试。");
  }
  return library;
}
