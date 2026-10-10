export interface CompanionFileEntry {
  path: string;
  name: string;
  size: number;
  modifiedAt: string;
}

export interface CompanionFileScanOptions {
  signal?: AbortSignal;
  maxEntries?: number;
  timeoutMs?: number;
  maxDepth?: number;
  maxResults?: number;
}

export interface CompanionFileScan {
  root: string;
  measuredAt: string;
  elapsedMs: number;
  entriesVisited: number;
  filesCount: number;
  directoriesCount: number;
  bytes: number;
  skippedLinks: number;
  unreadable: number;
  stopReason: "completed" | "cancelled" | "timeout" | "entry-limit" | "result-limit";
  depthLimited: boolean;
  chatDirectoryHint: boolean;
  largestFiles: CompanionFileEntry[];
  children: Array<{ path: string; name: string; bytes: number; filesCount: number; chatDirectoryHint: boolean }>;
  sizeMeaning: string;
}

export interface CompanionFileSearch {
  root: string;
  query: string;
  matches: CompanionFileEntry[];
  scan: Omit<CompanionFileScan, "largestFiles" | "children">;
}

export interface CompanionFilePlanItem {
  source: string;
  destination: string;
  size: number;
  category: string;
  status: "ready" | "skipped" | "conflict";
  reason: string;
}

export interface CompanionFilePlan {
  id: string;
  kind: "organize" | "copy";
  root: string;
  createdAt: string;
  expiresAt: string;
  items: CompanionFilePlanItem[];
  totalBytes: number;
  truncated: boolean;
}

export interface CompanionFileOperationItem {
  source: string;
  destination: string;
  status: "pending" | "prepared" | "completed" | "failed" | "undone" | "undo-skipped";
  message: string;
  digest?: string;
  destinationFingerprint?: Fingerprint;
}

export interface CompanionFileOperation {
  version: 1;
  id: string;
  kind: "organize" | "copy";
  recommended?: true;
  root: string;
  createdAt: string;
  status: "running" | "completed" | "partial" | "cancelled" | "undone";
  items: CompanionFileOperationItem[];
}

export interface Fingerprint {
  dev: number;
  ino: number;
  size: number;
  mtimeMs: number;
  ctimeMs: number;
}


