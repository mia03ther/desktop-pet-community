export const companionToolPluginIds = {
  files: "lingyin.file-assistant",
  computer: "lingyin.computer-care",
} as const;

export type CompanionToolPluginKind = keyof typeof companionToolPluginIds;

export interface CompanionToolPluginRecord {
  readonly id: string;
  readonly enabled: boolean;
  readonly approvedPermissions: readonly string[];
  readonly source?: string;
  readonly brokenReason?: string;
  readonly catalogDisabled?: boolean;
}

const requiredPermissions: Record<CompanionToolPluginKind, readonly string[]> = {
  files: ["files"],
  computer: ["files", "system:metrics"],
};

export function getCompanionToolPluginKind(id: string): CompanionToolPluginKind | undefined {
  if (id === companionToolPluginIds.files) return "files";
  if (id === companionToolPluginIds.computer) return "computer";
  return undefined;
}

// 安装记录和运行事实由原插件宿主提供，不根据名称、目录或启用偏好推测。
export function hasCompanionToolPluginAccess(
  kind: CompanionToolPluginKind,
  plugin: CompanionToolPluginRecord | undefined,
  runtimeActive: boolean,
): boolean {
  return plugin?.id === companionToolPluginIds[kind]
    && plugin.enabled
    && plugin.source !== "team"
    && !plugin.brokenReason
    && !plugin.catalogDisabled
    && runtimeActive
    && requiredPermissions[kind].every((permission) => plugin.approvedPermissions.includes(permission));
}

export function assertCompanionToolPluginAccess(
  kind: CompanionToolPluginKind,
  plugin: CompanionToolPluginRecord | undefined,
  runtimeActive: boolean,
): void {
  if (!hasCompanionToolPluginAccess(kind, plugin, runtimeActive)) {
    const name = kind === "files" ? "文件助手" : "电脑守护";
    throw new Error(`请先安装并启用${name}插件，确认所需权限且插件正常运行后再使用。`);
  }
}
