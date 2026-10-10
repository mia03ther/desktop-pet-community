import { queryCodexOfficialQuota, unknownCodexQuota, type CodexQuotaCommandContext } from "./codex-quota-client.js";
import type { CodexQuotaSnapshot } from "./codex-quota-types.js";

export const codexQuotaPollIntervalMs = 120_000;
export const codexQuotaFreshnessMs = 5 * 60_000;
/** 外部账户额度的唯一短期缓存；启用偏好仍由原 app-state 所有者保存。 */
export class CodexQuotaMonitor {
  #snapshot: CodexQuotaSnapshot = { ...unknownCodexQuota("未启用 Codex 官方额度监测。"), enabled: false, status: "disabled" };
  #timer: ReturnType<typeof setTimeout> | null = null;
  #controller: AbortController | null = null;
  #inFlight: Promise<CodexQuotaSnapshot> | null = null;
  #disposed = false;
  #generation = 0;
  #command: string | null = null;
  constructor(private readonly options: {
    getEnabled: () => boolean;
    setEnabled: (enabled: boolean) => void;
    getContext: () => CodexQuotaCommandContext;
    query?: (context: CodexQuotaCommandContext, signal: AbortSignal) => Promise<CodexQuotaSnapshot>;
    now?: () => number;
  }) {
    this.synchronize();
  }

  private synchronize(): void {
    if (this.#disposed) return;
    const enabled = this.options.getEnabled();
    const command = this.options.getContext().command;
    if (!enabled) {
      if (this.#snapshot.enabled || this.#controller) this.cancel();
      this.#snapshot = { ...unknownCodexQuota("未启用 Codex 官方额度监测。"), enabled: false, status: "disabled" };
      this.#command = command;
      return;
    }
    if (!this.#snapshot.enabled || this.#command !== command) {
      this.cancel();
      this.#command = command;
      this.#snapshot = { ...unknownCodexQuota("正在读取当前已登录 Codex CLI 的官方额度。"), status: "checking" };
      void this.refresh();
    }
  }
  getSnapshot(): CodexQuotaSnapshot {
    this.synchronize();
    const stale = this.#snapshot.recordedAt !== null && (this.options.now?.() ?? Date.now()) - this.#snapshot.recordedAt > codexQuotaFreshnessMs;
    return structuredClone(stale && this.#snapshot.status === "fresh"
      ? { ...this.#snapshot, status: "stale", reason: "官方记录已超过五分钟，等待下一次只读查询；不会当作实时额度。" }
      : this.#snapshot);
  }
  async setEnabled(enabled: boolean): Promise<CodexQuotaSnapshot> {
    if (this.#disposed) throw new Error("额度监测正在关闭。");
    this.options.setEnabled(enabled);
    this.synchronize();
    return this.getSnapshot();
  }
  refresh(): Promise<CodexQuotaSnapshot> {
    if (this.#disposed || !this.options.getEnabled()) return Promise.resolve(this.getSnapshot());
    if (this.#inFlight) return this.#inFlight;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const generation = this.#generation;
    const controller = new AbortController();
    this.#controller = controller;
    const context = this.options.getContext();
    const operation = Promise.resolve().then(() => (this.options.query ?? queryCodexOfficialQuota)(context, controller.signal))
      .catch(() => unknownCodexQuota("Codex 官方额度暂时无法读取；请检查原工具，不使用桌宠对话用量替代。"))
      .then((snapshot) => {
        if (!this.#disposed && generation === this.#generation && this.options.getEnabled() && !controller.signal.aborted) {
          this.#snapshot = snapshot;
        }
        return this.getSnapshot();
      }).finally(() => {
        if (generation !== this.#generation) return;
        this.#controller = null;
        this.#inFlight = null;
        if (!this.#disposed && this.options.getEnabled()) {
          this.#timer = setTimeout(() => {
            this.#timer = null;
            void this.refresh();
          }, codexQuotaPollIntervalMs);
          this.#timer.unref?.();
        }
      });
    this.#inFlight = operation;
    return operation;
  }
  private cancel(): void {
    this.#generation++;
    this.#controller?.abort();
    this.#controller = null;
    this.#inFlight = null;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
  }
  dispose(): void {
    this.#disposed = true;
    this.cancel();
  }
}
