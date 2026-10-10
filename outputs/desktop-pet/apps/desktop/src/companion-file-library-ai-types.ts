import type { CompanionFileLibraryCategory } from "./companion-file-library-types.js";
import type { PetAssistantTokenUsage } from "./pet-assistant-types.js";

export interface CompanionFileLibraryAiEntry {
  entryId: string;
  name: string;
  fileType: string;
  category: CompanionFileLibraryCategory;
}

export interface CompanionFileLibraryAiPreview {
  id: string;
  expiresAt: number;
  entries: CompanionFileLibraryAiEntry[];
  totalFiles: number;
  truncated: boolean;
}

export interface CompanionFileLibraryAiDraft {
  id: string;
  items: Array<{ entryId: string; category: CompanionFileLibraryCategory }>;
  summary: string;
  usage: PetAssistantTokenUsage | null;
}
