import { packageImportLimits } from "./package-import-limits.js";
/** 九种核心动作必需；交互和养成动作可选，兼容原有素材包。 */
export const petMediaActions = ["idle", "running-right", "running-left", "waving", "jumping", "failed", "waiting", "running", "review"] as const;
export const petMediaOptionalActions = ["sleeping", "clicked", "dragged"] as const;
export type PetMediaOptionalAction = typeof petMediaOptionalActions[number];
export type PetMediaAction = string;
export type PetMediaFile = `${string}.mp4` | `${string}.webm` | `${string}.webp`;
export interface PetMediaBackground {
  readonly mode: "alpha" | "chroma";
  readonly color?: string;
  readonly tolerance?: number;
}
export interface MediaPetMetadata {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly mediaVersion: 1;
  readonly actions: Readonly<Record<string, PetMediaFile>>;
  readonly actionDefinitions?: Readonly<Record<string, { readonly displayName: string; readonly category?: string }>>;
  readonly stateBindings?: Readonly<Partial<Record<typeof petMediaActions[number] | PetMediaOptionalAction, string>>>;
  readonly staticActions?: readonly string[];
  readonly background: PetMediaBackground;
}
export const maxPetMediaFileBytes = packageImportLimits.maxFileBytes;
export const maxPetMediaTotalBytes = packageImportLimits.maxBytes;

export function isPetMediaFile(value: unknown): value is PetMediaFile {
  return typeof value === "string" && value.length <= 240 && /\.(?:mp4|webm|webp)$/i.test(value)
    && value.split("/").every((part) => /^[\p{L}\p{N}][\p{L}\p{N} ._-]{0,79}$/u.test(part) && !/[. ]$/.test(part)
      && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
}

export function isPetMediaActionId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(value) && !["__proto__", "constructor", "prototype"].includes(value);
}

export function isMediaPetMetadata(value: unknown): value is MediaPetMetadata {
  return isRecord(value) && value.mediaVersion === 1;
}

export function validateMediaPetMetadata(value: unknown, petId: string): MediaPetMetadata {
  if (!isRecord(value) || value.mediaVersion !== 1) throw new Error("动作媒体包的 mediaVersion 必须为 1。");
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(petId) || petId === "builtin" || value.id !== petId) throw new Error("桌宠编号无效或与素材包不一致。");
  if (typeof value.displayName !== "string" || !value.displayName.trim() || value.displayName.length > 80) throw new Error("桌宠名称无效。");
  if (typeof value.description !== "string" || !value.description.trim() || value.description.length > 500) throw new Error("桌宠描述无效。");
  if (!isRecord(value.actions) || !Object.hasOwn(value.actions, "idle") || Object.keys(value.actions).length > 128) throw new Error("动作媒体包需要 idle 待机动作，最多支持 128 个动作。");
  const actions: Record<string, PetMediaFile> = {};
  for (const [action, file] of Object.entries(value.actions)) {
    if (!isPetMediaActionId(action) || !isPetMediaFile(file)) throw new Error(`动作 ${action} 需要有效编号及本包内的 MP4、WebM 或 WebP 文件。`);
    actions[action] = file;
  }
  const actionDefinitions: Record<string, { displayName: string; category?: string }> = {};
  if (value.actionDefinitions !== undefined) {
    if (!isRecord(value.actionDefinitions)) throw new Error("动作名称与分类无效。");
    for (const [action, definition] of Object.entries(value.actionDefinitions)) {
      if (!Object.hasOwn(actions, action) || !isRecord(definition) || typeof definition.displayName !== "string" || !definition.displayName.trim() || definition.displayName.length > 80
        || (definition.category !== undefined && (typeof definition.category !== "string" || !definition.category.trim() || definition.category.length > 80))) throw new Error("动作名称与分类必须对应已有动作，且不超过 80 字。");
      actionDefinitions[action] = { ...definition, displayName: definition.displayName.trim(), ...(typeof definition.category === "string" ? { category: definition.category.trim() } : {}) };
    }
  }
  const stateBindings: Record<string, string> = {};
  if (value.stateBindings !== undefined) {
    if (!isRecord(value.stateBindings)) throw new Error("状态动作绑定无效。");
    for (const [state, action] of Object.entries(value.stateBindings)) {
      if (!([...petMediaActions, ...petMediaOptionalActions] as readonly string[]).includes(state) || typeof action !== "string" || !Object.hasOwn(actions, action)) throw new Error("状态绑定必须引用已声明的动作。");
      stateBindings[state] = action;
    }
  }
  if (value.staticActions !== undefined && (!Array.isArray(value.staticActions) || value.staticActions.some((action) => typeof action !== "string" || !Object.hasOwn(actions, action)))) throw new Error("静态动作必须引用已声明动作。");
  if (!isRecord(value.background) || (value.background.mode !== "alpha" && value.background.mode !== "chroma")) throw new Error("请选择透明通道或纯色去背。");
  let background: PetMediaBackground;
  if (value.background.mode === "chroma") {
    const { color, tolerance } = value.background;
    if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) throw new Error("纯色去背需要六位背景颜色。");
    if (tolerance !== undefined && (!Number.isInteger(tolerance) || (tolerance as number) < 10 || (tolerance as number) > 160)) throw new Error("去背容差必须为 10 至 160。");
    background = { ...value.background, mode: "chroma", color: color.toLowerCase(), tolerance: typeof tolerance === "number" ? tolerance : 70 };
  } else {
    if (Object.values(actions).some((file) => file.toLowerCase().endsWith(".mp4"))) throw new Error("MP4 不含透明通道，请使用不与角色配色冲突的纯色背景并声明去背颜色。");
    background = { ...value.background, mode: "alpha" };
  }
  return { ...value, id: petId, displayName: value.displayName.trim(), description: value.description.trim(), mediaVersion: 1, actions, background,
    ...(value.actionDefinitions !== undefined ? { actionDefinitions } : {}), ...(value.stateBindings !== undefined ? { stateBindings } : {}),
    ...(Array.isArray(value.staticActions) ? { staticActions: value.staticActions as string[] } : {}) };
}

export function uniquePetMediaFiles(metadata: MediaPetMetadata): readonly PetMediaFile[] {
  return [...new Set(Object.values(metadata.actions))];
}

export function petMediaContentType(file: PetMediaFile): string {
  if (file.toLowerCase().endsWith(".mp4")) return "video/mp4";
  return file.toLowerCase().endsWith(".webm") ? "video/webm" : "image/webp";
}

export function resolvePetMediaAction(reaction: string | undefined, motion: string | undefined, flipped: boolean): PetMediaAction {
  let action: PetMediaAction = (petMediaActions as readonly string[]).includes(reaction ?? "") ? reaction as PetMediaAction : "idle";
  if (action === "idle" && motion === "run-left") action = "running-left";
  if (action === "idle" && motion === "run-right") action = "running-right";
  if (flipped && action === "running-left") return "running-right";
  if (flipped && action === "running-right") return "running-left";
  return action;
}

/** 只在素材已声明时覆盖核心动作；旧包继续显示原有反应。 */
export function resolvePetMediaPlaybackAction(metadata: MediaPetMetadata, reaction: string | undefined, motion: string | undefined, flipped: boolean, interaction: string | undefined): PetMediaAction {
  if ((petMediaOptionalActions as readonly string[]).includes(interaction ?? "")) {
    const bound = metadata.stateBindings?.[interaction as PetMediaOptionalAction] ?? interaction!;
    if (Object.hasOwn(metadata.actions, bound)) return bound;
  }
  const state = resolvePetMediaAction(reaction, motion, flipped) as typeof petMediaActions[number];
  const bound = metadata.stateBindings?.[state] ?? state;
  return Object.hasOwn(metadata.actions, bound) ? bound : "idle";
}

/** 只改变匹配背景的像素透明度，绝不对整张画面设置不透明度。 */
export function removePetChroma(data: Uint8ClampedArray, background: PetMediaBackground): void {
  if (background.mode !== "chroma" || !background.color) return;
  const color = background.color.slice(1);
  const red = parseInt(color.slice(0, 2), 16);
  const green = parseInt(color.slice(2, 4), 16);
  const blue = parseInt(color.slice(4, 6), 16);
  const tolerance = background.tolerance ?? 70;
  for (let index = 0; index < data.length; index += 4) {
    const distance = Math.hypot(data[index]! - red, data[index + 1]! - green, data[index + 2]! - blue);
    const alpha = Math.min(1, Math.max(0, (distance - tolerance * 0.7) / (tolerance * 0.3)));
    data[index + 3] = Math.round(data[index + 3]! * alpha);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
