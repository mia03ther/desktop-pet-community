export type OriginalProjectKind = "pet" | "plugin";
export type OriginalProjectOperation = "activatePet" | "customActions" | "aiLink" | "pluginSettings" | "openFolder" | "chooseApplication" | "openApplication" | "chooseEntry" | "chooseJava" | "runStandalone" | "convertPoses";

export interface OriginalProjectStandalone {
  readonly mode: "project-program" | "original-application" | "unavailable";
  readonly entryPath?: string;
  readonly entryType?: "exe" | "jar";
  readonly javaExecutablePath?: string;
  readonly javaVersion?: string;
  readonly minimumJavaVersion?: number;
  readonly message: string;
  readonly candidates: readonly string[];
}

export interface OriginalProjectStandaloneResult {
  readonly mode: "project-program" | "original-application";
  readonly projectStarted: boolean;
  readonly pid: number;
  readonly message: string;
}

export interface OriginalProjectCapability {
  readonly supported: boolean;
  readonly reason?: string;
}

export interface OriginalProjectCompatibilityReport {
  readonly status: "native" | "partial" | "external" | "invalid";
  readonly format: string;
  readonly originalEnvironment: string;
  readonly summary: string;
  readonly inspection: "static";
  readonly missingCapabilities: readonly string[];
  readonly operations: Readonly<Record<OriginalProjectOperation, OriginalProjectCapability>>;
}

export interface OriginalProject {
  readonly id: string;
  readonly kind: OriginalProjectKind;
  readonly displayName: string;
  readonly importedAt: string;
  readonly report: OriginalProjectCompatibilityReport;
  readonly applicationPath?: string;
  readonly nativeInstalled?: boolean;
  readonly convertedCopyInstalled?: boolean;
  readonly entryRelativePath?: string;
  readonly javaExecutablePath?: string;
  readonly standalone?: OriginalProjectStandalone;
}

export interface OriginalProjectSelection {
  readonly selectionId: string;
  readonly displayName: string;
  readonly report: OriginalProjectCompatibilityReport;
}

export interface OriginalProjectsApi {
  inspectLocalProject(kind: OriginalProjectKind): Promise<OriginalProjectSelection | null>;
  importInspectedProject(selectionId: string): Promise<{ readonly project: OriginalProject; readonly nativeInstalled: boolean } | null>;
  discardInspectedProject(selectionId: string): Promise<void>;
  getOriginalProjects(): Promise<{ readonly projects: readonly OriginalProject[] }>;
  openOriginalProjectFolder(id: string): Promise<void>;
  chooseOriginalProjectApplication(id: string): Promise<void>;
  openOriginalProjectApplication(id: string): Promise<void>;
  chooseOriginalProjectEntry(id: string): Promise<void>;
  chooseOriginalProjectJava(id: string): Promise<void>;
  runOriginalProjectStandalone(id: string): Promise<OriginalProjectStandaloneResult>;
  convertOriginalProjectPoses(id: string): Promise<void>;
  removeOriginalProject(id: string): Promise<void>;
}
