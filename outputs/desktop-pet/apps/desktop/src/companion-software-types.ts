/** 软件检查的只读证据，不代表完整检出捆绑、恶意软件或卸载残留。 */
export interface CompanionInstallerEvidence {
  checkedAt: number;
  fileName: string;
  sizeBytes: number;
  sha256: string;
  signatureStatus: string;
  signer: string | null;
  productName: string | null;
  fileVersion: string | null;
  productVersion: string | null;
  publisher: string | null;
  fileDescription: string | null;
  zoneId: number | null;
  sourceHost: string | null;
  clues: string[];
  conclusion: string;
}

export interface CompanionDownloadItem {
  id: string;
  fileName: string;
  observedAt: number;
  evidence: CompanionInstallerEvidence | null;
  error: string | null;
}

export interface CompanionDownloadsSnapshot {
  folderPath: string | null;
  enabled: boolean;
  scanning: boolean;
  items: CompanionDownloadItem[];
  ignoredIds: string[];
  snoozedUntil: Record<string, number>;
  lastError: string | null;
}

export interface CompanionUninstallDirectoryCheck {
  checkedAt: number;
  status: "exists" | "absent" | "unreadable" | "unsupported";
  explanation: string;
}

export interface CompanionUninstallRecord {
  id: string;
  name: string;
  version: string;
  observedAt: number;
  installLocation: string | null;
  result: CompanionUninstallDirectoryCheck | null;
}
