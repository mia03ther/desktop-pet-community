import { isUserSelectableAnimationState, type UserSelectableAnimationState } from "./reaction-animation-mapping.js";

export interface PetBehaviorAction {
  readonly id: string;
  readonly name: string;
  readonly animation: UserSelectableAnimationState;
  readonly random: boolean;
}

export interface PetBehaviorPreferences {
  readonly quietMode: boolean;
  readonly actions: readonly PetBehaviorAction[];
}

export const defaultPetBehaviorPreferences: PetBehaviorPreferences = {
  quietMode: true,
  actions: [
    { id: "idle", name: "待机", animation: "idle", random: false },
    { id: "review", name: "思考", animation: "review", random: true },
    { id: "running", name: "忙碌", animation: "running", random: true },
    { id: "waiting", name: "等待", animation: "waiting", random: true },
    { id: "waving", name: "打招呼", animation: "waving", random: true },
    { id: "jumping", name: "开心", animation: "jumping", random: true },
    { id: "failed", name: "失落", animation: "failed", random: true },
  ],
};

export function validatePetBehaviorPreferences(value: unknown): PetBehaviorPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("桌宠动作设置无效。");
  const config = value as Record<string, unknown>;
  if (Object.keys(config).some((key) => key !== "quietMode" && key !== "actions")
    || typeof config.quietMode !== "boolean" || !Array.isArray(config.actions) || config.actions.length > 24) {
    throw new Error("动作设置须包含安静开关和最多 24 个动作。");
  }
  const ids = new Set<string>();
  const actions = config.actions.map((value): PetBehaviorAction => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("动作条目无效。");
    const action = value as Record<string, unknown>;
    if (Object.keys(action).some((key) => !["id", "name", "animation", "random"].includes(key))
      || typeof action.id !== "string" || !/^[a-z0-9][a-z0-9_-]{0,63}$/u.test(action.id) || ids.has(action.id)
      || typeof action.name !== "string" || !action.name.trim() || action.name.trim().length > 32
      || /[\u0000-\u001f\u007f]/u.test(action.name) || !isUserSelectableAnimationState(action.animation)
      || typeof action.random !== "boolean") {
      throw new Error("动作编号须唯一，名称须为 1 至 32 字，动画须使用已有图集状态。");
    }
    ids.add(action.id);
    return { id: action.id, name: action.name.trim(), animation: action.animation, random: action.random };
  });
  return { quietMode: config.quietMode, actions };
}

export function normalizePetBehaviorPreferences(value: unknown): PetBehaviorPreferences {
  try {
    return validatePetBehaviorPreferences(value);
  } catch {
    // 旧档案或无效设置采用安静待机，不能意外开启自动动作。
    return { quietMode: true, actions: defaultPetBehaviorPreferences.actions.map((action) => ({ ...action })) };
  }
}
