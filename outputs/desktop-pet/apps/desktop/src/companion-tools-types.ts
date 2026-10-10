import type { CompanionCursorWindowSnapshot, CompanionDiagnosticsSnapshot } from "./companion-diagnostics-types.js";
import type { CompanionFileScan, CompanionFileSearch, CompanionFilePlan, CompanionFileOperation } from "./companion-files-types.js";
import type { CompanionDownloadsSnapshot, CompanionInstallerEvidence, CompanionUninstallRecord } from "./companion-software-types.js";
import type { CompanionFileLibrarySnapshot, CompanionFileLibrarySearch, CompanionFileLibrarySearchFilter } from "./companion-file-library-types.js";
import type { CompanionFileLibraryAiPreview, CompanionFileLibraryAiDraft } from "./companion-file-library-ai-types.js";

export interface CompanionToolFinding {
  id: string;
  kind: "disk" | "memory" | "cpu" | "software";
  title: string;
  evidence: string;
  explanation: string;
}
/** 根据新鲜资源证据提供手动操作建议，不授权自动修改或清理。 */
export interface CompanionResourceRecommendation {
  id: string;
  kind: "disk" | "memory" | "cpu";
  sampledAt: number;
  title: string;
  evidence: string;
  steps: string[];
  limitation: string;
  systemPage: "storage" | "startup";
}
export interface CompanionToolsSettings {
  monitorEnabled: boolean;
  ignoredFindingIds: string[];
  snoozedUntil: Record<string, number>;
}
export interface CompanionToolsSnapshot {
  diagnostics: CompanionDiagnosticsSnapshot | null;
  findings: CompanionToolFinding[];
  resourceRecommendations: CompanionResourceRecommendation[];
  uninstallRecords: CompanionUninstallRecord[];
  settings: CompanionToolsSettings;
  lastError: string | null;
  scanning: boolean;
}
export interface CompanionFolderScope { id: string; path: string }
export interface CompanionToolsApi {
  getFileLibrary(): Promise<CompanionFileLibrarySnapshot>;
  chooseFileLibraryFolder(): Promise<CompanionFileLibrarySnapshot | null>;
  refreshFileLibrary(): Promise<CompanionFileLibrarySnapshot>;
  removeFileLibraryRoot(rootId: string): Promise<CompanionFileLibrarySnapshot>;
  searchFileLibrary(query: string, filter?: CompanionFileLibrarySearchFilter): Promise<CompanionFileLibrarySearch>;
  revealLibraryFile(entryId: string): Promise<void>;
  analyzeLibraryFolder(rootId: string): Promise<CompanionFileScan>;
  previewRecommendedOrganize(rootId: string): Promise<CompanionFilePlan>;
  getFileLibraryProfiles(): Promise<Array<{ id: string; label: string }>>;
  prepareFileLibraryAi(rootId: string): Promise<CompanionFileLibraryAiPreview>;
  generateFileLibraryAi(previewId: string, profileId: string): Promise<CompanionFileLibraryAiDraft>;
  applyFileLibraryAi(draftId: string): Promise<CompanionFileLibrarySnapshot>;
  getSnapshot(): Promise<CompanionToolsSnapshot>;
  refreshDiagnostics(): Promise<CompanionToolsSnapshot>;
  chooseInstaller(): Promise<CompanionInstallerEvidence | null>;
  cancelSoftwareCheck(): Promise<{ cancelled: boolean }>;
  getDownloadsSnapshot(): Promise<CompanionDownloadsSnapshot>;
  chooseDownloadsFolder(): Promise<CompanionDownloadsSnapshot | null>;
  setDownloadMonitoring(enabled: boolean): Promise<CompanionDownloadsSnapshot>;
  refreshDownloads(): Promise<CompanionDownloadsSnapshot>;
  setDownloadDisposition(id: string, action: "ignore" | "later"): Promise<CompanionDownloadsSnapshot>;
  resetDownloadIgnored(): Promise<CompanionDownloadsSnapshot>;
  checkUninstallDirectory(id: string): Promise<CompanionToolsSnapshot>;
  setMonitoring(enabled: boolean): Promise<CompanionToolsSnapshot>;
  setFindingDisposition(id: string, action: "ignore" | "later"): Promise<CompanionToolsSnapshot>;
  resetIgnoredFindings(): Promise<CompanionToolsSnapshot>;
  captureWindow(): Promise<CompanionCursorWindowSnapshot>;
  chooseFolder(): Promise<CompanionFolderScope | null>;
  analyzeFolder(scopeId: string): Promise<CompanionFileScan>;
  searchFiles(scopeId: string, query: string): Promise<CompanionFileSearch>;
  previewOrganize(scopeId: string): Promise<CompanionFilePlan>;
  previewCopy(scopeId: string): Promise<CompanionFilePlan | null>;
  executeFilePlan(planId: string): Promise<CompanionFileOperation>;
  getFileHistory(): Promise<CompanionFileOperation[]>;
  undoFileOperation(operationId: string): Promise<CompanionFileOperation>;
  cancelFileTask(): Promise<{ cancelled: boolean }>;
  revealFile(scopeId: string, path: string): Promise<void>;
  openFile(scopeId: string, path: string): Promise<void>;
  openSystemPage(page: "startup" | "storage" | "apps" | "security"): Promise<void>;
  copyDiagnosticsReport(): Promise<{ copied: boolean }>;
}

