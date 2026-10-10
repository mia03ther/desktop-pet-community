/** 分享选项仅包含填写者的公开说明，不保存账号或运行状态。 */
export interface PetPackageExportOptions {
  readonly format: "folder" | "zip";
  readonly author?: string;
  readonly source?: string;
  readonly license?: string;
}

export interface PetPackageExportResult {
  readonly petId: string;
  readonly displayName: string;
  readonly directoryPath: string;
  readonly archivePath?: string;
}

export const petShareFieldLimits = { author: 120, source: 1000, license: 200 } as const;
export const maxPetShareArchiveBytes = 200 * 1024 * 1024;
export const maxPetShareReadmeBytes = 16 * 1024;

/** 主进程在打开原生选择器之前验证分享参数；省略选项保持文件夹导出。 */
export function parsePetPackageExportOptions(value: unknown): PetPackageExportOptions {
  if (value === undefined) return { format: "folder" };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("分享选项无效。");
  }
  const record = value as Record<string, unknown>;
  if (record.format !== "folder" && record.format !== "zip") {
    throw new Error("请选择 ZIP 或文件夹分享格式。");
  }
  const allowed = new Set(["format", "author", "source", "license"]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new Error("分享选项包含不支持的字段。");
  }
  const result: { format: "folder" | "zip"; author?: string; source?: string; license?: string } = { format: record.format };
  for (const key of ["author", "source", "license"] as const) {
    const field = record[key];
    if (field === undefined) continue;
    if (typeof field !== "string" || field.length > petShareFieldLimits[key]
      || /[\x00-\x1f\x7f]/u.test(field)) {
      throw new Error("分享说明过长或含不支持的控制字符。");
    }
    result[key] = field.trim();
  }
  return result;
}
