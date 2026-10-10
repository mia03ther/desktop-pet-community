import type { PetAuthoringInput, PetAuthoringResult, PetAuthoringSelection } from "../../../pet-authoring-types.js";
import type { PetPackageExportOptions, PetPackageExportResult } from "../../../pet-sharing-contract.js";
import type { PetBehaviorPreferences } from "../../../pet-behavior-config.js";
import type { OpenPetsReaction } from "../../../local-ipc-protocol.js";
import type { ReactionAnimationOverrides, SpriteStateDefinition, UniversalSpriteState, UserSelectableAnimationState } from "../../../reaction-animation-mapping.js";
import type { PetSpriteLayout } from "../pet-preview-state.js";
import type { OriginalProjectsApi } from "../../../original-project-types.js";

export interface PetBehaviorPreferencePatch {
  readonly petBehavior?: PetBehaviorPreferences;
  readonly reactionAnimationOverrides?: ReactionAnimationOverrides;
}

export interface PetAnimationSettingsSnapshot {
  readonly animations: readonly {
    readonly id: UserSelectableAnimationState;
    readonly label: string;
    readonly description: string;
  }[];
  readonly reactions: readonly {
    readonly id: OpenPetsReaction;
    readonly label: string;
    readonly description: string;
    readonly defaultAnimation: UserSelectableAnimationState;
  }[];
  readonly sprite: PetSpriteLayout & {
    readonly states: Readonly<Record<UniversalSpriteState, SpriteStateDefinition>>;
  };
  readonly overrides: ReactionAnimationOverrides;
  readonly previewSpriteUrl: string;
}

export interface StudioPet {
  readonly id: string;
  readonly displayName: string;
  readonly description?: string;
  readonly searchText?: string;
  readonly tags?: readonly string[];
  readonly preview?: string;
  readonly thumbnail?: string;
  readonly spritesheet?: string;
  readonly spriteLayout?: PetSpriteLayout;
  readonly spriteVersionNumber?: 2;
  readonly category?: string;
  readonly installed?: boolean;
  readonly builtIn?: boolean;
  readonly protected?: boolean;
  readonly broken?: boolean;
  readonly brokenReason?: string;
  readonly exportable?: boolean;
  readonly sourceKind?: string;
  readonly source?: { readonly kind?: string; readonly preview?: string };
}

export interface StudioPetsSnapshot {
  readonly preferences: { readonly defaultPetId: string };
  readonly pets: { readonly installed: readonly StudioPet[] };
}

export interface StudioCatalogSnapshot {
  readonly pets: readonly StudioPet[];
  readonly source: string;
  readonly error?: string;
  readonly page?: number;
  readonly pageCount?: number;
  readonly total?: number;
}

export interface PetStudioApi extends OriginalProjectsApi {
  getPetsState(): Promise<StudioPetsSnapshot>;
  getSettingsState(): Promise<{ readonly preferences: { readonly petBehavior: PetBehaviorPreferences } }>;
  getReactionAnimationSettings(): Promise<PetAnimationSettingsSnapshot>;
  updatePreferences(patch: PetBehaviorPreferencePatch): Promise<unknown>;
  getCatalog(): Promise<StudioCatalogSnapshot>;
  getCatalogPage(page: number): Promise<StudioCatalogSnapshot>;
  getCodexPets(): Promise<{ readonly pets: readonly StudioPet[]; readonly error?: string }>;
  setDefaultPet(petId: string): Promise<unknown>;
  installPet(petId: string): Promise<unknown>;
  installLocalPet(): Promise<unknown>;
  importCodexPet(petId: string): Promise<unknown>;
  removePet(petId: string): Promise<unknown>;
  showDefaultPet(): Promise<void>;
  hideDefaultPet(): Promise<void>;
  openCodexPetGallery(): Promise<void>;
  exportPetPackage(petId: string, options?: PetPackageExportOptions): Promise<PetPackageExportResult | null>;
  choosePetSpritesheet(): Promise<PetAuthoringSelection | null>;
  createPet(selectionId: string, input: PetAuthoringInput): Promise<PetAuthoringResult | null>;
  discardPetDraft(selectionId?: string): Promise<void>;
}
