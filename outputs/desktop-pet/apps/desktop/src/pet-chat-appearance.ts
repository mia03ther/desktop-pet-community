export interface PetChatSurfaceStyle {
  readonly background: string;
  readonly textColor: string;
  readonly borderColor: string;
  readonly radius: number;
  readonly borderWidth: number;
  readonly opacity: number;
  readonly shadow: boolean;
}

export interface PetChatAppearancePreferences {
  readonly enabled: boolean;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: 400 | 500 | 600 | 700;
  readonly accentColor: string;
  readonly input: PetChatSurfaceStyle;
  readonly answer: PetChatSurfaceStyle;
}

export const defaultPetChatAppearance: PetChatAppearancePreferences = {
  enabled: false,
  fontFamily: "system",
  fontSize: 12,
  fontWeight: 500,
  accentColor: "#2563eb",
  input: { background: "#ffffff", textColor: "#0f172a", borderColor: "#cbd5e1", radius: 12, borderWidth: 1, opacity: 98, shadow: true },
  answer: { background: "#eff6ff", textColor: "#172033", borderColor: "#cbd5e1", radius: 14, borderWidth: 1, opacity: 98, shadow: true },
};

const fontNamePattern = /^[\p{L}\p{N} _.-]{1,80}$/u;
const colorPattern = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= minimum && value <= maximum;
}

function normalizeSurface(value: unknown, fallback: PetChatSurfaceStyle): PetChatSurfaceStyle {
  const source = isRecord(value) ? value : {};
  return {
    background: typeof source.background === "string" && colorPattern.test(source.background) ? source.background.toLowerCase() : fallback.background,
    textColor: typeof source.textColor === "string" && colorPattern.test(source.textColor) ? source.textColor.toLowerCase() : fallback.textColor,
    borderColor: typeof source.borderColor === "string" && colorPattern.test(source.borderColor) ? source.borderColor.toLowerCase() : fallback.borderColor,
    radius: inRange(source.radius, 0, 24) ? source.radius : fallback.radius,
    borderWidth: inRange(source.borderWidth, 0, 3) ? source.borderWidth : fallback.borderWidth,
    opacity: inRange(source.opacity, 40, 100) ? source.opacity : fallback.opacity,
    shadow: typeof source.shadow === "boolean" ? source.shadow : fallback.shadow,
  };
}

export function normalizePetChatAppearance(value: unknown): PetChatAppearancePreferences {
  const source = isRecord(value) ? value : {};
  const fontWeight = source.fontWeight;
  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : false,
    fontFamily: typeof source.fontFamily === "string" && fontNamePattern.test(source.fontFamily.trim()) ? source.fontFamily.trim() : "system",
    fontSize: inRange(source.fontSize, 10, 20) ? source.fontSize : 12,
    fontWeight: fontWeight === 400 || fontWeight === 500 || fontWeight === 600 || fontWeight === 700 ? fontWeight : 500,
    accentColor: typeof source.accentColor === "string" && colorPattern.test(source.accentColor) ? source.accentColor.toLowerCase() : "#2563eb",
    input: normalizeSurface(source.input, defaultPetChatAppearance.input),
    answer: normalizeSurface(source.answer, defaultPetChatAppearance.answer),
  };
}

export function validatePetChatAppearance(value: unknown): PetChatAppearancePreferences {
  if (!isRecord(value)) throw new Error("桌宠对话样式必须是有效设置。");
  const normalized = normalizePetChatAppearance(value);
  const keys = ["enabled", "fontSize", "fontWeight"] as const;
  const validFont = typeof value.fontFamily === "string" && fontNamePattern.test(value.fontFamily.trim());
  const validAccent = typeof value.accentColor === "string" && colorPattern.test(value.accentColor);
  if (!validFont || !validAccent || keys.some((key) => value[key] !== normalized[key])) {
    throw new Error("请检查字体、字号、字重和主题色；字号范围为 10–20。");
  }
  for (const surface of ["input", "answer"] as const) {
    const source = value[surface];
    if (!isRecord(source) || Object.entries(normalized[surface]).some(([key, entry]) => {
      if (key === "background" || key === "textColor" || key === "borderColor") {
        return typeof source[key] !== "string" || !colorPattern.test(source[key]);
      }
      return source[key] !== entry;
    })) {
      throw new Error("请检查输入框和回答框的颜色、圆角、边框与透明度。");
    }
  }
  return normalized;
}

export function petChatFontFamily(fontFamily: string): string {
  const fallback = '"Microsoft YaHei", "PingFang SC", system-ui, sans-serif';
  return fontFamily === "system" ? fallback : `${JSON.stringify(fontFamily)}, ${fallback}`;
}

export function petChatBackground(surface: PetChatSurfaceStyle): string {
  const color = surface.background;
  const rgb = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  return `rgba(${rgb.join(", ")}, ${surface.opacity / 100})`;
}

export function petChatAccentTextColor(color: string): string {
  const [red, green, blue] = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  return red * 0.299 + green * 0.587 + blue * 0.114 >= 150 ? "#0f172a" : "#ffffff";
}
