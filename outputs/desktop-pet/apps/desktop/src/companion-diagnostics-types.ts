/** 电脑助手的只读证据；不会把窗口所属进程等同于广告发布者。 */
export interface CompanionDiskEvidence {
  name: string;
  totalBytes: number;
  freeBytes: number;
  usedPercent: number;
}

export interface CompanionProcessEvidence {
  pid: number;
  name: string;
  executablePath: string | null;
  workingSetBytes: number;
  cpuPercent: number | null;
}

export interface CompanionStartupEvidence {
  id: string;
  name: string;
  source: string;
  /** 本地显示用途，不执行，也不自动发送给模型。 */
  command: string;
}

export interface CompanionInstalledAppEvidence {
  id: string;
  name: string;
  version: string;
  publisher: string;
  installLocation: string;
  source: string;
}

export interface CompanionWindowEvidence {
  handle: string;
  title: string;
  pid: number;
  processName: string;
  executablePath: string | null;
  isForeground: boolean;
}

export interface CompanionDiagnosticFinding {
  id: string;
  kind: "disk" | "memory" | "cpu";
  title: string;
  evidence: string;
  explanation: string;
}

export interface CompanionDiagnosticsSnapshot {
  version: 1;
  sampledAt: number;
  sampleDurationMs: number;
  cpuPercent: number | null;
  memory: { totalBytes: number; availableBytes: number; usedPercent: number } | null;
  disks: CompanionDiskEvidence[];
  processes: CompanionProcessEvidence[];
  startupItems: CompanionStartupEvidence[];
  installedApps: CompanionInstalledAppEvidence[];
  installedAppsComplete: boolean;
  windows: CompanionWindowEvidence[];
  collectionIssues: string[];
  coverage: string[];
  findings: CompanionDiagnosticFinding[];
}

export interface CompanionCursorWindowSnapshot {
  version: 1;
  sampledAt: number;
  window: CompanionWindowEvidence | null;
  note: string;
}
