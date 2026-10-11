/** 网页与本机共用完整包边界；执行入口和可显示资源仍使用各自的安全限额。 */
export const packageImportLimits = { maxBytes: 1024 * 1024 * 1024, maxFileBytes: 512 * 1024 * 1024, maxFiles: 10000 } as const;
