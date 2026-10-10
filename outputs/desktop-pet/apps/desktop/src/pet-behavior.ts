import type { OpenPetsReaction } from "./local-ipc-protocol.js";
import type { PetBehaviorPreferences } from "./pet-behavior-config.js";
import { resolveReactionSpriteState, type ReactionAnimationOverrides, type UserSelectableAnimationState } from "./reaction-animation-mapping.js";
import type { PetTransientDisplay } from "./pet-window-types.js";
import type { PetMediaOptionalAction } from "./pet-media-contract.js";

export function composePetBehaviorDisplay(
  display: PetTransientDisplay | null,
  animation: UserSelectableAnimationState | null,
  aiActive: boolean,
  randomActive: boolean,
): PetTransientDisplay | null {
  if (animation === null || (!aiActive && !randomActive && display?.reaction)) return display;
  return { ...(display ?? {}), animation };
}

export const petAutomaticActionIntervalMs = 45_000;
export const petRandomActionDurationMs = 6_000;
export const petExternalActivityLeaseMs = 120_000;

/** 只拥有随机动作和活动租约；偏好、AI 工作和窗口仍由原宿主持有。 */
export class PetBehaviorController {
  readonly #ai = new Map<string, OpenPetsReaction>();
  readonly #leases = new Map<string, ReturnType<typeof setTimeout>>();
  readonly #blocked = new Set<string>();
  #automaticTimer: ReturnType<typeof setTimeout> | null = null;
  #actionTimer: ReturnType<typeof setTimeout> | null = null;
  #sleepTimer: ReturnType<typeof setTimeout> | null = null;
  #sleepUntil = 0;
  #clicked = false;
  #manualAction = false;
  #animation: UserSelectableAnimationState = "idle";
  #randomActive = false;
  #active = false;

  constructor(private readonly options: {
    getPreferences: () => PetBehaviorPreferences;
    getReactionOverrides: () => ReactionAnimationOverrides | undefined;
    render: (animation: UserSelectableAnimationState, aiActive: boolean, randomActive: boolean, mediaAction: PetMediaOptionalAction | null) => void;
    random?: () => number;
  }) {}

  start(): void {
    if (this.#active) return;
    this.#active = true;
    this.refresh();
  }

  stop(): void {
    this.#active = false;
    this.#clearRandomTimers();
    this.#clearSleep();
    for (const timer of this.#leases.values()) clearTimeout(timer);
    this.#leases.clear();
    this.#ai.clear();
    this.#animation = "idle";
    this.#randomActive = false;
    this.#clicked = false;
    this.#manualAction = false;
    this.options.render("idle", false, false, null);
  }

  setBlocked(reason: string, blocked: boolean): void {
    if (blocked) this.#blocked.add(reason);
    else this.#blocked.delete(reason);
    this.refresh();
  }

  refresh(): void {
    this.#clearRandomTimers();
    this.#clicked = false;
    this.#manualAction = false;
    this.#animation = "idle";
    this.#randomActive = false;
    this.#render();
    this.#schedule();
  }

  setAiActivity(source: string, reaction: OpenPetsReaction | null, leaseMs?: number): void {
    const previous = this.#leases.get(source);
    if (previous) clearTimeout(previous);
    this.#leases.delete(source);
    this.#ai.delete(source);
    if (reaction && reaction !== "idle") {
      this.#ai.set(source, reaction);
      if (leaseMs !== undefined) {
        const timer = setTimeout(() => {
          this.#leases.delete(source);
          this.#ai.delete(source);
          this.refresh();
        }, leaseMs);
        timer.unref?.();
        this.#leases.set(source, timer);
      }
    }
    this.refresh();
  }

  setExternalAiActivity(source: string, reaction?: OpenPetsReaction): void {
    // 只有显式终态才结束工作；没有反应的普通消息不能清除活动。
    if (reaction === undefined) return;
    const busy = ["thinking", "working", "editing", "running", "testing", "waiting"].includes(reaction);
    this.setAiActivity(source, busy ? reaction : null, petExternalActivityLeaseMs);
  }

  click(): void {
    if (!this.#canRandomize()) return;
    this.#clicked = true;
    this.#playRandom();
  }

  playAction(actionId: string): boolean {
    if (!this.#canRandomize()) return false;
    const action = this.options.getPreferences().actions.find((candidate) => candidate.id === actionId);
    if (!action) return false;
    this.#clicked = false;
    this.#manualAction = true;
    this.#playAnimation(action.animation);
    return true;
  }

  /** 只投影已启用养成插件的快照，不复制或修改其睡眠存档。 */
  updateCareState(pluginId: string, topic: string, payload: unknown): void {
    if (!this.#active || pluginId !== "openpets.virtual-pet" || topic !== "openpets.virtual-pet/state" || !payload || typeof payload !== "object" || Array.isArray(payload)) return;
    const state = payload as Record<string, unknown>;
    if (state.version !== 1 || typeof state.available !== "boolean") return;
    if (!state.available) {
      this.#clearSleep();
      this.#render();
      return;
    }
    if (typeof state.sleptUntil !== "number" || !Number.isFinite(state.sleptUntil) || state.sleptUntil < 0 || state.sleptUntil > Date.now() + 24 * 60 * 60_000 || typeof state.mood !== "string") return;
    this.#clearSleep();
    if (state.mood === "sleeping" && state.sleptUntil > Date.now()) {
      this.#sleepUntil = state.sleptUntil;
      this.#sleepTimer = setTimeout(() => {
        this.#sleepTimer = null;
        this.#sleepUntil = 0;
        this.#render();
      }, state.sleptUntil - Date.now());
      this.#sleepTimer.unref?.();
    }
    this.#render();
  }

  #clearSleep(): void {
    if (this.#sleepTimer) clearTimeout(this.#sleepTimer);
    this.#sleepTimer = null;
    this.#sleepUntil = 0;
  }

  #canRandomize(): boolean {
    return this.#active && this.#blocked.size === 0 && this.#ai.size === 0;
  }

  #clearRandomTimers(): void {
    if (this.#automaticTimer) clearTimeout(this.#automaticTimer);
    if (this.#actionTimer) clearTimeout(this.#actionTimer);
    this.#automaticTimer = null;
    this.#actionTimer = null;
  }

  #render(): void {
    const reaction = [...this.#ai.values()].at(-1);
    const available = this.#active && this.#blocked.size === 0;
    const animation = reaction ? resolveReactionSpriteState(reaction, this.options.getReactionOverrides()) : this.#animation;
    const mediaAvailable = this.#active && [...this.#blocked].every((reason) => reason === "dragging");
    const mediaAction = !mediaAvailable ? null : this.#blocked.has("dragging") ? "dragged"
      : reaction ? null : this.#clicked ? "clicked" : !this.#manualAction && Date.now() < this.#sleepUntil ? "sleeping" : null;
    this.options.render(available ? animation : "idle", available && Boolean(reaction), available && this.#randomActive && !reaction, mediaAction);
  }

  #schedule(): void {
    if (!this.#canRandomize() || this.options.getPreferences().quietMode || this.#automaticTimer) return;
    this.#automaticTimer = setTimeout(() => {
      this.#automaticTimer = null;
      if (this.#canRandomize() && !this.options.getPreferences().quietMode) this.#playRandom();
    }, petAutomaticActionIntervalMs);
    this.#automaticTimer.unref?.();
  }

  #playRandom(): void {
    const animations = [...new Set(this.options.getPreferences().actions.filter((action) => action.random).map((action) => action.animation))];
    const different = animations.filter((animation) => animation !== this.#animation);
    const candidates = different.length ? different : animations;
    if (!candidates.length) {
      if (this.#clicked) {
        this.#playAnimation("idle", false);
        return;
      }
      this.#animation = "idle";
      this.#render();
      this.#schedule();
      return;
    }
    const animation = candidates[Math.floor((this.options.random?.() ?? Math.random()) * candidates.length)] ?? candidates[0]!;
    this.#playAnimation(animation);
  }

  #playAnimation(animation: UserSelectableAnimationState, randomActive = true): void {
    this.#clearRandomTimers();
    this.#animation = animation;
    this.#randomActive = randomActive;
    this.#render();
    this.#actionTimer = setTimeout(() => {
      this.#actionTimer = null;
      this.#animation = "idle";
      this.#randomActive = false;
      this.#clicked = false;
      this.#manualAction = false;
      this.#render();
    }, petRandomActionDurationMs);
    this.#actionTimer.unref?.();
    this.#schedule();
  }
}
