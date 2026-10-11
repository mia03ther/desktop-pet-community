export type UpdateStatusState = "idle" | "checking" | "available" | "current" | "downloading" | "ready" | "installing" | "error";
export interface UpdateStatus {
  readonly state: UpdateStatusState;
  readonly currentVersion: string;
  readonly latestVersion?: string;
  readonly releaseUrl?: string;
  readonly checkedAt?: number;
  readonly error?: string;
  readonly assetName?: string;
  readonly receivedBytes?: number;
  readonly totalBytes?: number;
  readonly canInstall?: boolean;
  readonly installMethod?: "windows-portable" | "open-zip";
  readonly message?: string;
}