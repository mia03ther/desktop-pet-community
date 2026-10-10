import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { win32 } from "node:path";
import type { CompanionDiagnosticsSnapshot } from "./companion-diagnostics-types.js";
import type { CompanionToolFinding, CompanionToolsSettings, CompanionToolsSnapshot } from "./companion-tools-types.js";
import { deriveCompanionResourceRecommendations, isCompanionDiagnosticSampleFresh } from "./companion-diagnostics-core.js";
import type { CompanionUninstallDirectoryCheck, CompanionUninstallRecord } from "./companion-software-types.js";
import { checkCompanionUninstallDirectory } from "./companion-uninstall-check.js";

type SoftwareEntry = { id: string; name: string; version: string; installLocation?: string | null };
type SavedState = {
  version: 1;
  settings: CompanionToolsSettings;
  baseline: SoftwareEntry[] | null;
  softwareFindings: Array<CompanionToolFinding & { observedAt: number }>;
  uninstallRecords: CompanionUninstallRecord[];
  notifiedAt: Record<string, number>;
};
const hour = 60 * 60 * 1000;
const freshState = (): SavedState => ({ version: 1, settings: { monitorEnabled: false, ignoredFindingIds: [], snoozedUntil: {} }, baseline: null, softwareFindings: [], uninstallRecords: [], notifiedAt: {} });

function softwareFindingId(id: string, added: boolean): string {
  return `software:${added ? "added" : "removed"}:${createHash("sha256").update(id).digest("hex").slice(0, 24)}`;
}

function invalidUninstallRecord(item: CompanionUninstallRecord): boolean {
  return !item || !/^software:removed:[a-f0-9]{24}$/.test(item.id)
    || typeof item.name !== "string" || typeof item.version !== "string" || !Number.isFinite(item.observedAt)
    || (item.installLocation !== null && (typeof item.installLocation !== "string" || item.installLocation.length > 4096))
    || (item.result !== null && (!item.result || !Number.isFinite(item.result.checkedAt)
      || !["exists", "absent", "unreadable", "unsupported"].includes(item.result.status)
      || typeof item.result.explanation !== "string" || item.result.explanation.length > 4000));
}

function installLocationKey(location: string): string {
  return win32.normalize(location.trim()).replace(/[\\/]+$/, "").toLowerCase();
}

/** 此模块是监测设置、软件比较基线和提醒冷却的唯一保存者。 */
export class CompanionToolsService {
  #state = freshState();
  #snapshot: CompanionDiagnosticsSnapshot | null = null;
  #error: string | null = null;
  #inFlight: Promise<CompanionToolsSnapshot> | null = null;
  #timer: ReturnType<typeof setInterval> | null = null;
  #stopped = false;
  #previousPressure = new Set<string>();
  #previousAt = 0;
  #generation = 0;
  #directoryController: AbortController | null = null;
  constructor(private readonly options: {
    statePath: string;
    collect: () => Promise<CompanionDiagnosticsSnapshot>;
    notify: (finding: CompanionToolFinding) => boolean;
    now?: () => number;
    checkDirectory?: typeof checkCompanionUninstallDirectory;
    isAvailable?: () => boolean;
  }) {
    try {
      if (existsSync(options.statePath)) {
        if (statSync(options.statePath).size > 1_000_000) throw new Error("保存的监测设置过大。");
        const saved = JSON.parse(readFileSync(options.statePath, "utf8")) as SavedState;
        if (saved.version !== 1 || typeof saved.settings?.monitorEnabled !== "boolean"
          || !Array.isArray(saved.settings.ignoredFindingIds) || saved.settings.ignoredFindingIds.length > 500
          || saved.settings.ignoredFindingIds.some((id) => typeof id !== "string" || id.length > 500)
          || !saved.settings.snoozedUntil || !saved.notifiedAt
          || (saved.baseline !== null && (!Array.isArray(saved.baseline) || saved.baseline.length > 1000
            || saved.baseline.some((item) => typeof item.id !== "string" || typeof item.name !== "string" || typeof item.version !== "string"
              || (item.installLocation !== undefined && item.installLocation !== null && (typeof item.installLocation !== "string" || item.installLocation.length > 4096)))))
          || !Array.isArray(saved.softwareFindings) || saved.softwareFindings.length > 100
          || saved.softwareFindings.some((item) => item.kind !== "software" || typeof item.id !== "string"
            || typeof item.title !== "string" || typeof item.evidence !== "string" || typeof item.explanation !== "string" || !Number.isFinite(item.observedAt))
          || (saved.uninstallRecords !== undefined && (!Array.isArray(saved.uninstallRecords) || saved.uninstallRecords.length > 100
            || saved.uninstallRecords.some(invalidUninstallRecord)))) {
          throw new Error("保存的监测设置格式无效。");
        }
        for (const map of [saved.settings.snoozedUntil, saved.notifiedAt]) {
          if (typeof map !== "object" || Array.isArray(map) || Object.keys(map).length > 500 || Object.values(map).some((value) => !Number.isFinite(value))) throw new Error("保存的提醒时间无效。");
        }
        this.#state = { ...saved, uninstallRecords: saved.uninstallRecords ?? [] };
      }
    } catch (error) { this.#error = `监测设置读取失败，自动监测保持关闭：${error instanceof Error ? error.message : String(error)}`; }
  }
  #now(): number { return this.options.now?.() ?? Date.now(); }
  #save(): void {
    const temporary = `${this.options.statePath}.tmp`;
    writeFileSync(temporary, JSON.stringify(this.#state), "utf8");
    renameSync(temporary, this.options.statePath);
  }
  getSnapshot(): CompanionToolsSnapshot {
    const now = this.#now();
    return structuredClone({
      diagnostics: this.#snapshot,
      findings: [...(this.#snapshot?.findings ?? []), ...this.#state.softwareFindings.filter((item) => now - item.observedAt < 7 * 24 * hour)]
        .filter((item) => !this.#state.settings.ignoredFindingIds.includes(item.id) && (this.#state.settings.snoozedUntil[item.id] ?? 0) <= now),
      resourceRecommendations: deriveCompanionResourceRecommendations(this.#snapshot, now),
      uninstallRecords: this.#state.uninstallRecords.filter((item) => now - item.observedAt < 7 * 24 * hour),
      settings: this.#state.settings,
      lastError: this.#error,
      scanning: this.#inFlight !== null,
    });
  }
  start(): void {
    if (this.options.isAvailable?.() === false) {
      this.stop();
      return;
    }
    this.#stopped = false;
    if (!this.#state.settings.monitorEnabled || this.#timer) return;
    this.#timer = setInterval(() => { void this.refresh(true).catch(() => {}); }, 5 * 60 * 1000);
    void this.refresh(true).catch(() => {});
  }
  stop(): void {
    this.#stopped = true;
    this.#generation++;
    this.#directoryController?.abort();
    if (this.#timer) clearInterval(this.#timer);
    this.#timer = null;
  }
  setMonitoring(enabled: boolean): CompanionToolsSnapshot {
    const previous = this.#state.settings.monitorEnabled;
    this.#state.settings.monitorEnabled = enabled;
    try { this.#save(); } catch (error) { this.#state.settings.monitorEnabled = previous; throw error; }
    this.stop();
    this.start();
    return this.getSnapshot();
  }
  setFindingDisposition(id: string, action: "ignore" | "later"): CompanionToolsSnapshot {
    if (!this.getSnapshot().findings.some((item) => item.id === id)) throw new Error("这条发现已不在当前结果中，请刷新。");
    const previous = structuredClone(this.#state.settings);
    if (action === "ignore") this.#state.settings.ignoredFindingIds = [...new Set([...this.#state.settings.ignoredFindingIds, id])].slice(-500);
    else this.#state.settings.snoozedUntil[id] = this.#now() + hour;
    this.#pruneTimes();
    try { this.#save(); } catch (error) { this.#state.settings = previous; throw error; }
    return this.getSnapshot();
  }
  resetIgnoredFindings(): CompanionToolsSnapshot {
    const previous = structuredClone(this.#state.settings);
    this.#state.settings.ignoredFindingIds = [];
    this.#state.settings.snoozedUntil = {};
    try { this.#save(); } catch (error) { this.#state.settings = previous; throw error; }
    return this.getSnapshot();
  }
  #setDirectoryResult(record: CompanionUninstallRecord, result: CompanionUninstallDirectoryCheck): CompanionToolsSnapshot {
    const previous = record.result;
    record.result = result;
    try { this.#save(); } catch (error) { record.result = previous; throw error; }
    return this.getSnapshot();
  }
  async checkUninstallDirectory(recordId: string, signal?: AbortSignal): Promise<CompanionToolsSnapshot> {
    if (signal?.aborted) throw new Error("已取消目录核对。");
    if (this.#stopped) throw new Error("电脑助手已停止，请重新打开后核对。");
    if (this.#directoryController) throw new Error("目录核对正在进行，请等待本次只读检查完成。");
    const record = this.#state.uninstallRecords.find((item) => item.id === recordId && this.#now() - item.observedAt < 7 * 24 * hour);
    if (!record) throw new Error("这条登记移除记录已不在当前结果中，请刷新。");
    const snapshot = this.#snapshot;
    let unsupported: string | null = null;
    if (!snapshot || this.#error || !snapshot.installedAppsComplete || !isCompanionDiagnosticSampleFresh(snapshot.sampledAt, this.#now())) {
      unsupported = "需要本次完整且新鲜的软件登记清单确认该登记仍未出现，请先刷新电脑体检；未读取目录。";
    } else if (snapshot.installedApps.some((item) => softwareFindingId(item.id, false) === recordId)) {
      unsupported = "该软件登记已重新出现，旧移除证据不再适用于目录核对。";
    } else if (!record.installLocation) {
      unsupported = "此前完整登记未保存安装目录，现有证据不足；不会按名称猜测路径，也不会从已移除的登记补取目录。";
    } else if (snapshot.installedApps.some((item) => item.installLocation
      && installLocationKey(item.installLocation) === installLocationKey(record.installLocation!))) {
      unsupported = "当前还有其他软件登记使用同一安装目录，无法把该目录归因于已移除登记；未读取目录，不能判断文件可删除。";
    }
    if (unsupported) return this.#setDirectoryResult(record, { checkedAt: this.#now(), status: "unsupported", explanation: unsupported });
    const controller = new AbortController();
    const abort = (): void => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    this.#directoryController = controller;
    const generation = this.#generation;
    try {
      const evidence = await (this.options.checkDirectory ?? checkCompanionUninstallDirectory)(record.installLocation!, controller.signal);
      if (this.#stopped || this.#generation !== generation || !this.#state.uninstallRecords.includes(record)) return this.getSnapshot();
      if (controller.signal.aborted) throw new Error("已取消目录核对。");
      if (this.#error || !isCompanionDiagnosticSampleFresh(snapshot!.sampledAt, this.#now()) || this.#now() - record.observedAt >= 7 * 24 * hour) return this.getSnapshot();
      return this.#setDirectoryResult(record, { checkedAt: this.#now(), ...evidence });
    } catch (error) {
      if (this.#stopped || this.#generation !== generation) return this.getSnapshot();
      if (controller.signal.aborted) throw new Error("已取消目录核对。");
      throw error;
    } finally {
      signal?.removeEventListener("abort", abort);
      if (this.#directoryController === controller) this.#directoryController = null;
    }
  }
  #pruneTimes(): void {
    const now = this.#now();
    for (const [map, lifetime] of [[this.#state.settings.snoozedUntil, 0], [this.#state.notifiedAt, 7 * 24 * hour]] as const) {
      for (const [id, at] of Object.entries(map)) if (at + lifetime < now) delete map[id];
      const excess = Object.keys(map).length - 500;
      if (excess > 0) for (const id of Object.keys(map).slice(0, excess)) delete map[id];
    }
  }
  refresh(notify = false): Promise<CompanionToolsSnapshot> {
    if (this.options.isAvailable?.() === false) return Promise.resolve(this.getSnapshot());
    if (this.#inFlight) return this.#inFlight;
    const previousAt = this.#previousAt;
    const previousPressure = this.#previousPressure;
    let generation = this.#generation;
    this.#inFlight = (async () => {
      try {
        const snapshot = await this.options.collect();
        if (this.#stopped || this.#generation !== generation || this.options.isAvailable?.() === false) return this.getSnapshot();
        this.#generation++;
        generation = this.#generation;
        this.#directoryController?.abort();
        this.#snapshot = snapshot;
        const now = this.#now();
        const fresh = isCompanionDiagnosticSampleFresh(snapshot.sampledAt, now);
        // 清单不完整时保留原基线，避免把读取失败误报为软件卸载。
        if (fresh) {
          const registeredIds = new Set(snapshot.installedApps.map((item) => softwareFindingId(item.id, false)));
          this.#state.uninstallRecords = this.#state.uninstallRecords.filter((item) => !registeredIds.has(item.id));
          this.#state.softwareFindings = this.#state.softwareFindings.filter((item) => !registeredIds.has(item.id));
        }
        if (snapshot.installedAppsComplete && fresh) {
          const current = snapshot.installedApps.map(({ id, name, version, installLocation }) => ({ id, name, version, installLocation: installLocation.trim() || null }));
          if (this.#state.baseline !== null) {
            const old = new Map(this.#state.baseline.map((item) => [item.id, item]));
            const next = new Map(current.map((item) => [item.id, item]));
            const changes = [
              ...current.filter((item) => !old.has(item.id)).map((item) => ({ item, added: true })),
              ...this.#state.baseline.filter((item) => !next.has(item.id)).map((item) => ({ item, added: false })),
            ];
            for (const { item, added } of changes.slice(0, 20)) {
              const id = softwareFindingId(item.id, added);
              this.#state.softwareFindings = this.#state.softwareFindings.filter((finding) => finding.id !== id);
              this.#state.softwareFindings.push({ id, kind: "software", title: `${item.name} 的登记项${added ? "新增" : "移除"}`, evidence: `${item.version || "版本未登记"}；与上一次完整登记清单比较。`, explanation: added ? "新增登记可能来自安装或升级；不能据此认定为捆绑软件。可在系统应用设置中核对。" : "卸载登记项已消失，不能据此认定卸载干净，也不能判定残留文件可删除。", observedAt: now });
            }
            const removed = this.#state.baseline.filter((item) => !next.has(item.id));
            for (const item of removed.slice(0, 20)) {
              const id = softwareFindingId(item.id, false);
              this.#state.uninstallRecords = this.#state.uninstallRecords.filter((record) => record.id !== id);
              this.#state.uninstallRecords.push({ id, name: item.name, version: item.version, observedAt: now, installLocation: item.installLocation ?? null, result: null });
            }
          }
          this.#state.baseline = current;
        }
        this.#state.softwareFindings = this.#state.softwareFindings.filter((item) => now - item.observedAt < 7 * 24 * hour).slice(-100);
        this.#state.uninstallRecords = this.#state.uninstallRecords.filter((item) => now - item.observedAt < 7 * 24 * hour).slice(-100);
        this.#pruneTimes();
        this.#previousPressure = new Set(fresh ? snapshot.findings.filter((item) => item.kind === "cpu" || item.kind === "memory").map((item) => item.id) : []);
        this.#previousAt = now;
        this.#error = null;
        if (notify && fresh && this.#state.settings.monitorEnabled) {
          const finding = this.getSnapshot().findings.find((item) => (this.#state.notifiedAt[item.id] ?? 0) + hour <= now
            && (item.kind !== "cpu" && item.kind !== "memory" || previousPressure.has(item.id) && now - previousAt >= 60_000 && now - previousAt <= 15 * 60_000));
          if (finding && this.options.notify(finding)) this.#state.notifiedAt[finding.id] = now;
        }
        this.#save();
      } catch (error) {
        if (!this.#stopped && this.#generation === generation && this.options.isAvailable?.() !== false) {
          this.#error = `电脑体检未完成：${error instanceof Error ? error.message : String(error)}`;
        }
      } finally { this.#inFlight = null; }
      return this.getSnapshot();
    })();
    return this.#inFlight;
  }
}

let sharedService: CompanionToolsService | null = null;
export function initializeCompanionToolsService(service: CompanionToolsService): void { sharedService = service; }
export function getCompanionToolsService(): CompanionToolsService {
  if (!sharedService) throw new Error("电脑助手尚未初始化。");
  return sharedService;
}
