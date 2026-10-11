import type { UpdateStatus } from "../../../update-types.js";
import type { CompanionAiApi } from "../../../companion-ai-types.js";
import type { CompanionToolsApi } from "../../../companion-tools-types.js";
import type { ControlCenterRouteTarget } from "../../../control-center-route.js";
import type { I18nSnapshot } from "../i18n.js";
import type { IntegrationsApi } from "../integrations/types.js";
import type { ProvidersSectionApi } from "../settings/providers/ProvidersSection.js";
import type { ProviderControlCenterSnapshot } from "../settings/providers/types.js";
import type { PetBehaviorPreferencePatch, PetStudioApi } from "./pet-studio-types.js";
import type { StudioPluginApi } from "./studio-plugin-types.js";
import type { CommunityPortalApi } from "./CommunityPortalView.js";
import type { PetChatAppearancePreferences } from "../../../pet-chat-appearance.js";
import type { PetBehaviorPreferences } from "../../../pet-behavior-config.js";

export interface StudioPreferences extends PetBehaviorPreferencePatch {
  readonly petBehavior: PetBehaviorPreferences;
  readonly openDefaultPetOnLaunch: boolean;
  readonly speechBubblesEnabled: boolean;
  readonly petScale: number;
  readonly petToggleShortcut: string;
  readonly showChatButton: boolean;
  readonly showTalkButton: boolean;
  readonly idleCursorGazeEnabled: boolean;
  readonly petGravityEnabled: boolean;
  readonly petCrossDisplayEnabled: boolean;
  readonly petChatAppearance?: PetChatAppearancePreferences;
}
export interface StudioApi extends PetStudioApi, ProvidersSectionApi, IntegrationsApi, StudioPluginApi, CommunityPortalApi {
  readonly ai: CompanionAiApi;
  readonly companion: CompanionToolsApi;
  getSettingsState(): Promise<{ readonly preferences: StudioPreferences }>;
  getI18n(): Promise<I18nSnapshot>;
  getProviderProfiles(): Promise<ProviderControlCenterSnapshot>;
  updatePreferences(patch: Partial<StudioPreferences>): Promise<unknown>;
  getAppUpdateStatus(): Promise<UpdateStatus>;
  checkAppUpdate(): Promise<UpdateStatus>;
  downloadAppUpdate(): Promise<UpdateStatus>;
  installAppUpdate(): Promise<UpdateStatus>;
  openAppUpdateRelease(): Promise<void>;
  getLaunchAtLogin(): Promise<{ supported: boolean; enabled: boolean }>;
  setLaunchAtLogin(enabled: boolean): Promise<{ supported: boolean; enabled: boolean }>;
  resetDefaultPetPosition(): Promise<void>;
  onRouteChange(callback: (target: ControlCenterRouteTarget) => void): () => void;
}

export function getStudioApi(): StudioApi {
  return (window as unknown as { openPetsControlCenter: StudioApi }).openPetsControlCenter;
}
