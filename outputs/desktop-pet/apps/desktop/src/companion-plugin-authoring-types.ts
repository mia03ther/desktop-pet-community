export const companionPluginReactions = [
  "idle", "thinking", "working", "editing", "running", "testing",
  "waiting", "waving", "success", "error", "celebrating",
] as const;

export type CompanionPluginReaction = typeof companionPluginReactions[number];
export type CompanionPluginPermission = "timer" | "pet:speak" | "pet:reaction";

export interface CompanionPluginAuthoringInput {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly everyMinutes: number;
  readonly speech: string;
  readonly reaction?: CompanionPluginReaction;
  readonly author?: string;
  readonly source?: string;
  readonly license?: string;
}

export interface CompanionPluginPackageResult {
  readonly id: string;
  readonly title: string;
  readonly directoryPath: string;
  readonly manifestPath: string;
  readonly permissions: readonly CompanionPluginPermission[];
}

export interface PluginAuthoringApi {
  createPackage(input: CompanionPluginAuthoringInput): Promise<CompanionPluginPackageResult | null>;
  loadLocalPlugin(): Promise<{ readonly ok: boolean; readonly error?: string }>;
}

export const companionPluginFieldLimits = {
  id: 64,
  title: 120,
  description: 1000,
  speech: 140,
  author: 120,
  source: 1000,
  license: 200,
} as const;

const allowedFields = new Set([
  "id", "title", "description", "everyMinutes", "speech", "reaction", "author", "source", "license",
]);
const reservedWindowsNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

export function parseCompanionPluginAuthoringInput(value: unknown): CompanionPluginAuthoringInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("插件制作信息必须为对象。");
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error("插件制作信息格式无效。");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((field) => !allowedFields.has(field))) {
    throw new Error("插件制作信息包含不支持的字段。");
  }
  const id = textField(record.id, "插件 ID", companionPluginFieldLimits.id, true);
  if (!/^[a-z0-9][a-z0-9._-]{1,62}[a-z0-9]$/.test(id) || reservedWindowsNames.test(id) || id.startsWith("openpets.")) {
    throw new Error("插件 ID 需为 3 至 64 位小写字母、数字、点、短横线或下划线，不能使用内置插件前缀或系统保留名。");
  }
  const title = textField(record.title, "插件名称", companionPluginFieldLimits.title, true);
  const speech = textField(record.speech, "提醒台词", companionPluginFieldLimits.speech, true);
  if (title.startsWith("$t:") || speech.startsWith("$t:")) throw new Error("插件名称和台词不能使用未定义的翻译引用。");
  const everyMinutes = record.everyMinutes;
  if (typeof everyMinutes !== "number" || !Number.isInteger(everyMinutes) || everyMinutes < 5 || everyMinutes > 1440) {
    throw new Error("提醒间隔需为 5 至 1440 的整数分钟。");
  }
  const reaction = record.reaction;
  if (reaction !== undefined && !companionPluginReactions.some((item) => item === reaction)) {
    throw new Error("请选择支持的桌宠反应。");
  }
  const optional = (field: "description" | "author" | "source" | "license", label: string): string | undefined => {
    if (record[field] === undefined) return undefined;
    return textField(record[field], label, companionPluginFieldLimits[field], false) || undefined;
  };
  const description = optional("description", "插件说明");
  if (description?.startsWith("$t:")) throw new Error("插件说明不能使用未定义的翻译引用。");
  return {
    id, title, everyMinutes, speech,
    ...(description ? { description } : {}),
    ...(reaction ? { reaction: reaction as CompanionPluginReaction } : {}),
    author: optional("author", "作者"),
    source: optional("source", "来源"),
    license: optional("license", "许可声明"),
  };
}

export function getCompanionPluginPermissions(input: CompanionPluginAuthoringInput): CompanionPluginPermission[] {
  return input.reaction ? ["timer", "pet:speak", "pet:reaction"] : ["timer", "pet:speak"];
}

function textField(value: unknown, label: string, maxLength: number, required: boolean): string {
  if (typeof value !== "string" || value.length > maxLength || /[\p{Cc}\p{Cf}\u2028\u2029]/u.test(value) || hasBrokenUnicode(value)) {
    throw new Error(`${label}格式无效或超过 ${maxLength} 字。`);
  }
  const text = value.trim();
  if (required && !text) throw new Error(`请填写${label}。`);
  return text;
}

function hasBrokenUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      return true;
    }
  }
  return false;
}
