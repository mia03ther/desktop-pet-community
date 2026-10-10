import type { CompanionPluginAuthoringInput, CompanionPluginPackageResult } from "../../../companion-plugin-authoring-types.js";
import type { OriginalProjectsApi } from "../../../original-project-types.js";

export type StudioPluginConfigValue = string | number | boolean | string[] | Array<Record<string, unknown>> | { kind: "user-sound"; id: string; name?: string } | null;
export type StudioPluginConfig = Record<string, StudioPluginConfigValue>;

export interface StudioPluginConfigField {
  readonly type: "text" | "textarea" | "number" | "boolean" | "select" | "time" | "date" | "multiSelect" | "list" | "secret" | "sound";
  readonly label?: string;
  readonly description?: string;
  readonly default?: StudioPluginConfigValue;
  readonly options?: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly maxLength?: number;
  readonly maxItems?: number;
  readonly itemSchema?: Record<string, StudioPluginConfigField>;
}

export interface StudioPluginCommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly form?: {
    readonly submitLabel?: string;
    readonly fields: ReadonlyArray<{
      readonly id: string;
      readonly type: "text" | "textarea" | "number" | "boolean" | "select" | "multiSelect" | "time" | "date" | "list";
      readonly label: string;
      readonly default?: string | number | boolean | string[];
      readonly options?: ReadonlyArray<{ readonly label: string; readonly value: string }>;
      readonly min?: number;
      readonly max?: number;
      readonly maxLength?: number;
      readonly required?: boolean;
    }>;
  };
}

export interface StudioPluginRecord {
  readonly id: string;
  readonly name?: string;
  readonly description?: string;
  readonly version: string;
  readonly source: "catalog" | "local" | "team";
  readonly bundled?: boolean;
  readonly enabled: boolean;
  readonly active: boolean;
  readonly brokenReason?: string;
  readonly approvedPermissions: readonly string[];
  readonly catalogDisabled?: boolean;
  readonly catalogStatusReason?: string;
  readonly configSchema?: Record<string, StudioPluginConfigField>;
  readonly effectiveConfig?: StudioPluginConfig;
  readonly configErrors?: ReadonlyArray<{ readonly path: string; readonly message: string }>;
  readonly commands?: readonly StudioPluginCommand[];
  readonly status?: { readonly text: string };
}

export interface StudioPluginSnapshot {
  readonly plugins: readonly StudioPluginRecord[];
}

export type StudioPluginResult =
  | { readonly ok: true; readonly snapshot: StudioPluginSnapshot }
  | { readonly ok: false; readonly error: string; readonly snapshot: StudioPluginSnapshot };

export type StudioPluginSoundPickResult =
  | { readonly ok: true; readonly sound: { readonly kind: "user-sound"; readonly id: string; readonly name?: string }; readonly snapshot: StudioPluginSnapshot }
  | { readonly ok: true; readonly canceled: true; readonly snapshot: StudioPluginSnapshot }
  | { readonly ok: false; readonly error: string; readonly snapshot: StudioPluginSnapshot };

export interface StudioPluginApi extends OriginalProjectsApi {
  getPluginsSnapshot(): Promise<StudioPluginSnapshot>;
  setPluginEnabled(id: string, enabled: boolean): Promise<StudioPluginResult>;
  savePluginConfig(id: string, config: StudioPluginConfig): Promise<StudioPluginResult>;
  reloadPlugin(id: string): Promise<StudioPluginResult>;
  executePluginCommand(id: string, commandId: string, args?: Record<string, unknown>): Promise<StudioPluginResult>;
  loadLocalPlugin(): Promise<StudioPluginResult>;
  uninstallPlugin(id: string): Promise<StudioPluginResult>;
  onPluginsRefresh(callback: () => void): () => void;
  createPluginPackage(input: CompanionPluginAuthoringInput): Promise<CompanionPluginPackageResult | null>;
  pickPluginConfigSound?(id: string): Promise<StudioPluginSoundPickResult>;
}
