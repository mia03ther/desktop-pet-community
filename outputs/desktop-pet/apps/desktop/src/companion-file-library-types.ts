import type { CompanionFileScan } from "./companion-files-types.js";

export type CompanionFileLibraryCategory = "学习" | "工作" | "生活" | "素材" | "资料" | "其他";
export type CompanionFileLibraryFileType = "文档" | "图片" | "视频" | "音频" | "压缩包" | "代码" | "其他";

export interface CompanionFileLibraryEntry {
  id: string;
  rootId: string;
  relativePath: string;
  name: string;
  size: number;
  modifiedAt: string;
  category: CompanionFileLibraryCategory;
  fileType: CompanionFileLibraryFileType;
  classificationSource: "rule" | "recommendation";
  reason: string;
  availability: "indexed" | "missing" | "unverified";
}

export interface CompanionFileLibraryScan extends Omit<CompanionFileScan, "largestFiles" | "children" | "sizeMeaning"> {
  partial: boolean;
}

export interface CompanionFileLibraryRoot {
  id: string;
  path: string;
  addedAt: string;
  lastScannedAt: string | null;
  scan: CompanionFileLibraryScan | null;
  lastError: string | null;
}

export interface CompanionFileLibrarySnapshot {
  version: 1;
  roots: CompanionFileLibraryRoot[];
  entries: CompanionFileLibraryEntry[];
  storageError: string | null;
}

export interface CompanionFileLibrarySearch {
  query: string;
  matches: CompanionFileLibraryEntry[];
  totalMatches: number;
  truncated: boolean;
}

export interface CompanionFileLibrarySearchFilter {
  category?: CompanionFileLibraryCategory;
  rootId?: string;
  excludeMissing?: boolean;
}

// 推荐只可调整已有索引的分类标签，不能提供路径、文件内容或执行动作。
export interface CompanionFileLibraryRecommendations {
  items: Array<{
    entryId: string;
    category: CompanionFileLibraryCategory;
  }>;
}
