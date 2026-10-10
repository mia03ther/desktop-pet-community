export const COMPANION_PERSONA_IMPORT_LIMIT_BYTES = 64 * 1024;
export const COMPANION_PERSONA_STYLE_LIMIT_BYTES = 8 * 1024;
export const COMPANION_PERSONA_SKILL_STYLE_LIMIT_BYTES = 48 * 1024;

export type CompanionPersonaFormat = "skill-markdown" | "character-markdown";
export type CompanionPersonaMode = "global-md" | "distilled-md";

export interface CompanionPersonaTextInput {
  mode: CompanionPersonaMode;
  content: string;
}

/** 仅在用户打开人设编辑器时返回正文，普通监测快照不包含正文。 */
export interface CompanionPersonaDocument extends CompanionPersonaTextInput {
  format: CompanionPersonaFormat;
  enabled: boolean;
  importedAt: string;
  skillName?: string;
}

export interface CompanionPersonaSkillScan {
  candidates: { name: string; error: string | null }[];
  activated: string | null;
  requiresSelection: boolean;
}

/** 仅在人设配置页请求，目录路径不加入普通 AI 监测快照。 */
export interface CompanionPersonaEnvironment {
  skillsDirectory: string;
  activeSkillName: string | null;
  promptEnvironment: "host-supported";
  directorySkillLoading: "host-supported";
  externalNativeSkillLoading: "not-detected";
  modelRoleplay: "not-verified";
  appliesEveryTurn: true;
  conversationReady: boolean;
  selectedProfile: { id: string; label: string; model: string; ready: boolean } | null;
}

/** 界面仅接收人物设置元数据，不暴露导入路径或人物正文。 */
export interface CompanionPersonaSnapshot {
  version: 1;
  hasPersona: boolean;
  enabled: boolean;
  format: CompanionPersonaFormat | null;
  mode?: CompanionPersonaMode | null;
  contentBytes: number;
  promptBytes: number;
  importedAt: string | null;
  lastError: string | null;
  skillName?: string | null;
  skillFileCount?: number;
  loadedReferenceCount?: number;
}
