import { createHash } from "node:crypto";
import { existsSync, readFileSync, renameSync, statSync, writeFileSync, type Stats } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import type { CompanionDownloadItem, CompanionDownloadsSnapshot, CompanionInstallerEvidence } from "./companion-software-types.js";

interface SavedState {
  version: 1;
  folderPath: string | null;
  enabled: boolean;
  ignoredIds: string[];
  snoozedUntil: Record<string, number>;
  deliveredIds: string[];
}

interface ObservedFile {
  filePath: string;
  fileName: string;
  fingerprint: string;
  sizeBytes: number;
  id: string;
  stableSince: number;
  baseline: boolean;
  inspected: boolean;
}

const HOUR = 60 * 60_000;
const MAX_FILE_BYTES = 256 * 1024 ** 2;
const freshState = (): SavedState => ({
  version: 1,
  folderPath: null,
  enabled: false,
  ignoredIds: [],
  snoozedUntil: {},
  deliveredIds: [],
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function savedIds(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 500
    && value.every((id) => typeof id === "string" && /^[a-f0-9]{64}$/u.test(id));
}

function savedState(value: unknown): value is SavedState {
  return isRecord(value) && value.version === 1 && typeof value.enabled === "boolean"
    && (value.folderPath === null || typeof value.folderPath === "string" && value.folderPath.length <= 32_768)
    && (!value.enabled || typeof value.folderPath === "string")
    && savedIds(value.ignoredIds) && savedIds(value.deliveredIds)
    && isRecord(value.snoozedUntil) && Object.keys(value.snoozedUntil).length <= 500
    && Object.entries(value.snoozedUntil).every(([id, until]) => /^[a-f0-9]{64}$/u.test(id)
      && typeof until === "number" && Number.isFinite(until) && until >= 0);
}

function localPath(value: string): string {
  if (typeof value !== "string" || value.includes("\0") || !path.isAbsolute(value)
    || /^[\\/]{2}/u.test(value)
    || process.platform === "win32" && value.slice(2).includes(":")) {
    throw new Error("请选择本机普通文件夹，不能使用网络路径、设备路径或备用数据流。");
  }
  const resolved = path.resolve(value);
  if (resolved === path.parse(resolved).root) {
    throw new Error("请选择具体下载文件夹，不能选择磁盘根目录。");
  }
  return resolved;
}

// 逐层检查，避免选中的普通子目录实际经过符号链接或 Windows 联接。
async function ordinaryDirectory(value: string): Promise<string> {
  const resolved = localPath(value);
  const root = path.parse(resolved).root;
  let current = root;
  let stats = await fs.lstat(root);
  for (const component of resolved.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    stats = await fs.lstat(current);
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new Error("下载范围必须是普通文件夹，路径不能含符号链接或目录联接。");
    }
  }
  return fs.realpath(resolved);
}

function fingerprint(stats: Stats): string {
  return [stats.dev, stats.ino, stats.size, stats.mtimeMs, stats.ctimeMs].join(":");
}

function identifier(filePath: string, value: string): string {
  return createHash("sha256").update(filePath).update("\0").update(value).digest("hex");
}

function hasReviewClue(evidence: CompanionInstallerEvidence): boolean {
  if (evidence.signatureStatus.trim().toLowerCase() !== "valid") return true;
  const descriptions = [evidence.fileName, evidence.productName, evidence.fileDescription, ...evidence.clues];
  return descriptions.some((value) => value !== null
    && /(?:downloader|download[ -]?manager|web[ -]?installer|bootstrapper|下载器|下载助手|下载工具|在线安装)/iu.test(value));
}

/** 下载目录、观察基线、定时器与处置规则的唯一所有者；不执行安装文件。 */
export class CompanionDownloadsService {
  #state = freshState();
  #items: CompanionDownloadItem[] = [];
  #observed = new Map<string, ObservedFile>();
  #baselineReady = false;
  #error: string | null = null;
  #timer: ReturnType<typeof setInterval> | null = null;
  #stopped = false;
  #generation = 0;
  #selection = 0;
  #controller: AbortController | null = null;
  #inFlight: Promise<CompanionDownloadsSnapshot> | null = null;

  constructor(private readonly options: {
    statePath: string;
    inspect: (filePath: string, signal?: AbortSignal) => Promise<CompanionInstallerEvidence>;
    notify: (item: CompanionDownloadItem) => boolean;
    now?: () => number;
    isAvailable?: () => boolean;
  }) {
    try {
      if (existsSync(options.statePath)) {
        if (statSync(options.statePath).size > 1_000_000) throw new Error("保存的下载监测设置过大。");
        const saved: unknown = JSON.parse(readFileSync(options.statePath, "utf8"));
        if (!savedState(saved)) throw new Error("保存的下载监测设置格式无效。");
        if (saved.folderPath !== null) localPath(saved.folderPath);
        this.#state = saved;
      }
    } catch (error) {
      this.#error = `下载监测设置读取失败，监测保持关闭：${errorMessage(error)}`;
    }
  }

  #now(): number {
    return this.options.now?.() ?? Date.now();
  }

  #save(): void {
    const temporary = `${this.options.statePath}.tmp`;
    writeFileSync(temporary, JSON.stringify(this.#state), "utf8");
    renameSync(temporary, this.options.statePath);
  }

  #cancel(): void {
    this.#generation++;
    this.#controller?.abort();
    this.#controller = null;
    this.#inFlight = null;
    if (this.#timer !== null) clearInterval(this.#timer);
    this.#timer = null;
  }

  #resetBaseline(): void {
    this.#observed.clear();
    this.#baselineReady = false;
  }

  #schedule(): void {
    if (this.#stopped || this.options.isAvailable?.() === false || !this.#state.enabled || this.#timer !== null) return;
    this.#timer = setInterval(() => { void this.refresh(); }, 30_000);
    this.#timer.unref();
  }

  getSnapshot(): CompanionDownloadsSnapshot {
    const now = this.#now();
    return structuredClone({
      folderPath: this.#state.folderPath,
      enabled: this.#state.enabled,
      scanning: this.#inFlight !== null,
      items: this.#items.filter((item) => !this.#state.ignoredIds.includes(item.id)
        && (this.#state.snoozedUntil[item.id] ?? 0) <= now),
      ignoredIds: this.#state.ignoredIds,
      snoozedUntil: this.#state.snoozedUntil,
      lastError: this.#error,
    });
  }

  start(): void {
    if (this.options.isAvailable?.() === false) {
      this.stop();
      return;
    }
    if (this.#stopped) this.#resetBaseline();
    this.#stopped = false;
    this.#schedule();
    if (this.#state.enabled) void this.refresh();
  }

  stop(): void {
    this.#stopped = true;
    this.#selection++;
    this.#cancel();
  }

  async chooseFolder(value: string, signal?: AbortSignal): Promise<CompanionDownloadsSnapshot> {
    if (signal?.aborted) throw new Error("文件夹选择已取消。");
    const selection = ++this.#selection;
    const folderPath = await ordinaryDirectory(value);
    if (signal?.aborted || selection !== this.#selection) throw new Error("文件夹选择已取消。");
    if (folderPath === this.#state.folderPath) return this.getSnapshot();
    const previous = this.#state;
    this.#state = { ...freshState(), folderPath };
    try {
      this.#save();
    } catch (error) {
      this.#state = previous;
      throw error;
    }
    this.#cancel();
    this.#resetBaseline();
    this.#items = [];
    this.#error = null;
    return this.getSnapshot();
  }

  async setEnabled(enabled: boolean): Promise<CompanionDownloadsSnapshot> {
    if (typeof enabled !== "boolean") throw new Error("下载监测开关无效。");
    if (enabled && this.#state.folderPath === null) throw new Error("请先通过原生对话框选择下载文件夹。");
    if (enabled === this.#state.enabled) {
      if (enabled) this.start();
      return this.refresh();
    }
    const previous = this.#state.enabled;
    this.#state.enabled = enabled;
    try {
      this.#save();
    } catch (error) {
      this.#state.enabled = previous;
      throw error;
    }
    this.#selection++;
    this.#cancel();
    this.#resetBaseline();
    this.#stopped = false;
    this.#schedule();
    return this.refresh();
  }

  setDisposition(id: string, action: "ignore" | "later"): CompanionDownloadsSnapshot {
    if (!this.getSnapshot().items.some((item) => item.id === id)) throw new Error("这条安装包记录已不在当前结果中。");
    if (action !== "ignore" && action !== "later") throw new Error("安装包提醒处置无效。");
    const previous = structuredClone(this.#state);
    if (action === "ignore") this.#state.ignoredIds = [...new Set([...this.#state.ignoredIds, id])].slice(-500);
    else {
      this.#state.snoozedUntil[id] = this.#now() + HOUR;
      this.#state.deliveredIds = this.#state.deliveredIds.filter((delivered) => delivered !== id);
    }
    this.#prune();
    try {
      this.#save();
    } catch (error) {
      this.#state = previous;
      throw error;
    }
    return this.getSnapshot();
  }

  resetIgnored(): CompanionDownloadsSnapshot {
    const previous = structuredClone(this.#state);
    const restored = new Set([...this.#state.ignoredIds, ...Object.keys(this.#state.snoozedUntil)]);
    this.#state.ignoredIds = [];
    this.#state.snoozedUntil = {};
    this.#state.deliveredIds = this.#state.deliveredIds.filter((id) => !restored.has(id));
    try {
      this.#save();
    } catch (error) {
      this.#state = previous;
      throw error;
    }
    return this.getSnapshot();
  }

  #prune(): void {
    for (const [id, until] of Object.entries(this.#state.snoozedUntil)) {
      if (until <= this.#now()) delete this.#state.snoozedUntil[id];
    }
    const excess = Object.keys(this.#state.snoozedUntil).length - 500;
    if (excess > 0) {
      for (const id of Object.keys(this.#state.snoozedUntil).slice(0, excess)) delete this.#state.snoozedUntil[id];
    }
    this.#state.deliveredIds = this.#state.deliveredIds.slice(-500);
  }

  #current(generation: number, signal: AbortSignal): boolean {
    return generation === this.#generation && !signal.aborted && !this.#stopped && this.#state.enabled
      && this.options.isAvailable?.() !== false;
  }

  // 先收齐有界浅层清单，完整读取成功前不修改基线或候选稳定时间。
  async #list(folderPath: string, signal: AbortSignal): Promise<Map<string, ObservedFile>> {
    await ordinaryDirectory(folderPath);
    const directory = await fs.opendir(folderPath);
    const files = new Map<string, ObservedFile>();
    let visited = 0;
    try {
      while (!signal.aborted) {
        const entry = await directory.read();
        if (entry === null) break;
        if (++visited > 200) throw new Error("下载文件夹超过 200 个顶层条目，本轮清单不完整；请缩小所选范围。");
        if (entry.isSymbolicLink() || !entry.isFile()
          || !/\.(?:exe|msi)$/iu.test(entry.name)
          || /\.(?:part|partial|tmp|temp|download|crdownload)$/iu.test(entry.name)) continue;
        const filePath = path.join(folderPath, entry.name);
        const stats = await fs.lstat(filePath);
        if (!stats.isFile() || stats.isSymbolicLink()) continue;
        const value = fingerprint(stats);
        files.set(filePath, {
          filePath,
          fileName: entry.name,
          fingerprint: value,
          sizeBytes: stats.size,
          id: identifier(filePath, value),
          stableSince: this.#now(),
          baseline: false,
          inspected: false,
        });
      }
    } finally {
      await directory.close();
    }
    if (signal.aborted) throw new Error("下载观察已取消。");
    await ordinaryDirectory(folderPath);
    return files;
  }

  #append(item: CompanionDownloadItem): void {
    this.#items = [...this.#items.filter((previous) => previous.id !== item.id), item].slice(-20);
  }

  async #inspect(file: ObservedFile, folderPath: string, generation: number, signal: AbortSignal): Promise<void> {
    const item: CompanionDownloadItem = {
      id: file.id,
      fileName: file.fileName,
      observedAt: this.#now(),
      evidence: null,
      error: null,
    };
    try {
      await ordinaryDirectory(folderPath);
      const current = await fs.lstat(file.filePath);
      if (!current.isFile() || current.isSymbolicLink() || fingerprint(current) !== file.fingerprint) return;
    } catch {
      // 清单读取后范围或文件已变化，不能让检查器读取原观察范围以外的对象。
      return;
    }
    if (!this.#current(generation, signal)) return;
    if (file.sizeBytes > MAX_FILE_BYTES) {
      item.error = "文件超过 256 MiB，只记录稳定文件，未进行静态检查。";
    } else {
      try {
        item.evidence = await this.options.inspect(file.filePath, signal);
      } catch (error) {
        // 手工检查占用唯一检查器时，候选仍待检查，不能永久记成失败结果。
        if (isRecord(error) && error.code === "COMPANION_INSPECTION_BUSY") return;
        // 检查器异常可能含完整路径，公开结果只保留失败状态和核对建议。
        item.error = "静态证据读取失败，尚无法核对该文件；请稍后重试或手动检查。";
      }
    }
    if (!this.#current(generation, signal)) return;
    try {
      await ordinaryDirectory(folderPath);
      const current = await fs.lstat(file.filePath);
      if (!current.isFile() || current.isSymbolicLink() || fingerprint(current) !== file.fingerprint) return;
    } catch {
      // 文件已消失或范围已无法校验，不能提交检查中的迟到证据。
      return;
    }
    if (!this.#current(generation, signal)) return;
    file.inspected = true;
    this.#append(item);
  }

  #notify(): void {
    const present = new Set([...this.#observed.values()].filter((file) => !file.baseline).map((file) => file.id));
    for (const item of this.getSnapshot().items) {
      if (!present.has(item.id) || item.evidence === null || item.error !== null
        || !hasReviewClue(item.evidence) || this.#state.deliveredIds.includes(item.id)) continue;
      // 宠物隐藏等情况下返回 false，保留待送达状态，下一轮完整观察后再试。
      if (this.options.notify(structuredClone(item))) this.#state.deliveredIds.push(item.id);
    }
  }

  refresh(): Promise<CompanionDownloadsSnapshot> {
    if (this.#inFlight !== null) return this.#inFlight;
    if (this.#stopped || this.options.isAvailable?.() === false || !this.#state.enabled || this.#state.folderPath === null) {
      return Promise.resolve(this.getSnapshot());
    }
    const folderPath = this.#state.folderPath;
    const generation = this.#generation;
    const controller = new AbortController();
    this.#controller = controller;
    const task = (async () => {
      try {
        const files = await this.#list(folderPath, controller.signal);
        if (!this.#current(generation, controller.signal)) return;
        if (!this.#baselineReady) {
          for (const file of files.values()) file.baseline = true;
          this.#baselineReady = true;
        } else {
          for (const [filePath, file] of files) {
            const previous = this.#observed.get(filePath);
            if (previous?.fingerprint === file.fingerprint) files.set(filePath, previous);
          }
        }
        this.#observed = files;
        const stable = [...files.values()].filter((file) => !file.baseline && !file.inspected
          && this.#now() - file.stableSince >= 10_000).slice(0, 2);
        for (const file of stable) {
          if (!this.#current(generation, controller.signal)) return;
          await this.#inspect(file, folderPath, generation, controller.signal);
        }
        if (!this.#current(generation, controller.signal)) return;
        this.#error = null;
        this.#prune();
        this.#notify();
        this.#save();
      } catch (error) {
        if (this.#current(generation, controller.signal)) {
          this.#error = `下载观察未完成：${errorMessage(error)}`;
        }
      }
    })();
    const result = task.then(() => {
      if (this.#inFlight === result) {
        this.#inFlight = null;
        this.#controller = null;
      }
      return this.getSnapshot();
    });
    this.#inFlight = result;
    return result;
  }
}

let sharedService: CompanionDownloadsService | null = null;

export function initializeCompanionDownloadsService(service: CompanionDownloadsService): void {
  sharedService = service;
}

export function getCompanionDownloadsService(): CompanionDownloadsService {
  if (sharedService === null) throw new Error("下载监测尚未初始化。");
  return sharedService;
}
