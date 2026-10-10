import type { CompanionAiMonitorSnapshot, CompanionAiManualQuotaInput } from "./companion-ai-monitor-types.js";
import type {
  CompanionPersonaDocument,
  CompanionPersonaMode,
  CompanionPersonaSnapshot,
  CompanionPersonaTextInput,
  CompanionPersonaEnvironment,
  CompanionPersonaSkillScan,
} from "./companion-persona-types.js";
import type { PetAssistantTokenUsage } from "./pet-assistant-types.js";

export interface CompanionAiTaskPreview {
  id: string;
  problem: string;
  context: string;
  expiresAt: number;
}
export interface CompanionAiTaskAnswer {
  profileId: string;
  label: string;
  state: "queued" | "running" | "completed" | "failed" | "cancelled";
  text: string;
  error: string | null;
  usage: PetAssistantTokenUsage | null;
  updatedAt: number;
}
export interface CompanionAiTask {
  id: string;
  problem: string;
  state: "running" | "completed" | "partial" | "failed" | "cancelled";
  createdAt: number;
  updatedAt: number;
  answers: CompanionAiTaskAnswer[];
  summary: CompanionAiTaskAnswer | null;
}
/** 对话仍由原 Assistant 持有，工作台只投影可显示的行。 */
export interface CompanionAiConversation {
  activity: string;
  activeTurnId: string | null;
  canSend: boolean;
  canCancel: boolean;
  items: { id: string; role: "user" | "assistant" | "action"; text: string; createdAt?: number | null }[];
}
export interface CompanionAiSnapshot {
  monitor: CompanionAiMonitorSnapshot;
  persona: CompanionPersonaSnapshot;
  tasks: CompanionAiTask[];
  conversation: CompanionAiConversation;
}
export interface CompanionPersonaDistillationInput {
  profileId: string;
  name: string;
  focus: string;
  material: string;
}

/** 模型只生成待审阅草稿，不保存或启用人设。 */
export interface CompanionPersonaDraft {
  mode: "distilled-md";
  content: string;
  usage: PetAssistantTokenUsage | null;
}

export interface CompanionAiApi {
  getSnapshot(): Promise<CompanionAiSnapshot>;
  sendMessage(text: string): Promise<void>;
  cancelMessage(): Promise<{ cancelled: boolean }>;
  previewDiagnostics(problem: string): Promise<CompanionAiTaskPreview>;
  startTask(previewId: string, profileIds: string[], leaderId: string): Promise<CompanionAiTask>;
  cancelTask(taskId: string): Promise<{ cancelled: boolean }>;
  getPersonaDocument(): Promise<CompanionPersonaDocument | null>;
  savePersonaDocument(input: CompanionPersonaTextInput): Promise<CompanionPersonaSnapshot>;
  importPersona(mode?: CompanionPersonaMode): Promise<CompanionPersonaSnapshot | null>;
  importPersonaDirectory(mode?: CompanionPersonaMode): Promise<CompanionPersonaSnapshot | null>;
  getPersonaEnvironment(): Promise<CompanionPersonaEnvironment>;
  scanPersonaSkills(selectedName?: string): Promise<CompanionPersonaSkillScan>;
  openPersonaSkillsDirectory(): Promise<{ opened: true }>;
  distillPersona(input: CompanionPersonaDistillationInput): Promise<CompanionPersonaDraft>;
  cancelPersonaDistillation(): Promise<{ cancelled: boolean }>;
  exportPersona(): Promise<{ exported: boolean }>;
  setPersonaEnabled(enabled: boolean): Promise<CompanionPersonaSnapshot>;
  clearPersona(): Promise<CompanionPersonaSnapshot>;
  setManualQuota(profileId: string, input: CompanionAiManualQuotaInput): Promise<CompanionAiMonitorSnapshot>;
  clearManualQuota(profileId: string): Promise<CompanionAiMonitorSnapshot>;
  queryQuota(profileId: string): Promise<CompanionAiSnapshot>;
  setCodexQuotaMonitoring?(enabled: boolean): Promise<CompanionAiSnapshot>;
  queryExternalQuota?(): Promise<CompanionAiSnapshot>;
}
