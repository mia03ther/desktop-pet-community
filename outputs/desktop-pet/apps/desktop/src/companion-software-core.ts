import path from "node:path";
import type { CompanionInstallerEvidence } from "./companion-software-types.js";

export const MAX_COMPANION_INSTALLER_BYTES = 256 * 1024 * 1024;
const SIGNATURE_STATUSES = new Set([
  "Valid", "UnknownError", "NotSigned", "HashMismatch", "NotTrusted", "NotSupportedFileFormat", "Incompatible",
]);
const CONCLUSION = "是否捆绑仍待确认。静态检查不能完整检出捆绑；签名有效不能证明无捆绑，未签名也不能证明有害。请核对下载来源和安装界面中的附加组件选项。";

/** 只接受具体的普通 Windows EXE/MSI 路径，不接受设备、网络或备用数据流。 */
export function companionInstallerPath(value: string): string {
  if (typeof value !== "string" || value.length > 32760 || !/^[a-z]:[\\/]/iu.test(value)
    || /[\0-\x1f]/u.test(value) || value.slice(2).includes(":")) {
    throw new Error("请选择本机普通 EXE 或 MSI 文件，不支持网络、设备路径或备用数据流。");
  }
  const components = value.slice(3).split(/[\\/]/u);
  if (components.some((component) => !component || component === "." || component === ".."
    || /[<>"|?*]/u.test(component) || /[. ]$/u.test(component)
    || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(component))) {
    throw new Error("请选择具体的普通文件，路径不能含特殊名称或相对跳转。");
  }
  const normalized = path.win32.normalize(value);
  if (!/\.(?:exe|msi)$/iu.test(normalized)) {
    throw new Error("本次安装前检查只接受 EXE 或 MSI 文件。");
  }
  return normalized;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("安装文件检查返回了无效数据。");
  }
  return value as Record<string, unknown>;
}

function nullableText(value: unknown, limit = 1024): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > limit || /[\0-\x08\x0b\x0c\x0e-\x1f]/u.test(value)) {
    throw new Error("安装文件检查返回了无效文本。");
  }
  return value.trim() || null;
}

function size(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > MAX_COMPANION_INSTALLER_BYTES) {
    throw new Error("安装文件超过 256 MiB 上限，或大小数据无效。");
  }
  return value;
}

function hash(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f\d]{64}$/iu.test(value)) {
    throw new Error("未取得有效 SHA256，不能确认本次检查的文件。");
  }
  return value.toUpperCase();
}

function sourceHost(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !value || value.length > 253) {
    throw new Error("下载来源主机数据无效。");
  }
  let parsed: URL;
  try {
    parsed = new URL(`https://${value}`);
  } catch {
    throw new Error("下载来源主机数据无效。");
  }
  if (parsed.username || parsed.password || parsed.port || parsed.pathname !== "/" || parsed.search || parsed.hash
    || parsed.hostname !== value || /[\s\\/]/u.test(value)) {
    throw new Error("下载来源只能包含规范主机名。");
  }
  return parsed.hostname;
}

/** 固定采集器的 JSON 边界；原始结论与任意线索不能由子进程直接带入界面。 */
export function parseCompanionInstallerEvidence(stdout: string, selectedPath: string): CompanionInstallerEvidence {
  if (stdout.length > 1024 * 1024) throw new Error("安装文件检查返回的数据超出限制。");
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.replace(/^\uFEFF/u, ""));
  } catch {
    throw new Error("安装文件检查返回的 JSON 无法读取。");
  }
  const raw = record(parsed);
  if (raw.version !== 1) throw new Error("安装文件检查的数据版本不受支持。");
  const fileName = path.win32.basename(companionInstallerPath(selectedPath));
  if (raw.fileName !== fileName) throw new Error("检查结果与所选安装文件不一致。");
  const sizeBytes = size(raw.sizeBytes);
  const sha256 = hash(raw.sha256);
  if (size(raw.sizeAfterBytes) !== sizeBytes || hash(raw.sha256After) !== sha256
    || typeof raw.modifiedTicks !== "string" || !/^\d{1,19}$/u.test(raw.modifiedTicks)
    || raw.modifiedAfterTicks !== raw.modifiedTicks) {
    throw new Error("安装文件在检查期间发生变化，请等下载完成后重新选择。");
  }
  if (typeof raw.checkedAt !== "number" || !Number.isSafeInteger(raw.checkedAt) || raw.checkedAt <= 0) {
    throw new Error("安装文件检查的时间数据无效。");
  }
  if (typeof raw.signatureStatus !== "string" || !SIGNATURE_STATUSES.has(raw.signatureStatus)) {
    throw new Error("安装文件检查的签名状态无效。");
  }
  if (raw.zoneId !== null && (typeof raw.zoneId !== "number" || !Number.isInteger(raw.zoneId) || raw.zoneId < 0 || raw.zoneId > 4)) {
    throw new Error("安装文件检查的来源区域数据无效。");
  }
  const evidence: CompanionInstallerEvidence = {
    checkedAt: raw.checkedAt,
    fileName,
    sizeBytes,
    sha256,
    signatureStatus: raw.signatureStatus,
    signer: nullableText(raw.signer),
    productName: nullableText(raw.productName),
    publisher: nullableText(raw.publisher),
    fileDescription: nullableText(raw.fileDescription),
    fileVersion: nullableText(raw.fileVersion),
    productVersion: nullableText(raw.productVersion),
    zoneId: raw.zoneId,
    sourceHost: sourceHost(raw.sourceHost),
    clues: [],
    conclusion: CONCLUSION,
  };
  if (/(?:downloader|download|web[-_ ]?setup|online[-_ ]?(?:setup|install)|下载器|在线安装|高速下载)/iu.test(`${fileName} ${evidence.fileDescription ?? ""}`)) {
    evidence.clues.push("文件名或描述含下载器、下载或在线安装关键词；请核对是否还会获取其他组件。关键词不能证明存在捆绑。");
  }
  if (evidence.signatureStatus === "UnknownError") {
    evidence.clues.push("签名读取或本机信任验证未取得可用结果，签名证据未知。");
  } else if (evidence.signatureStatus !== "Valid") {
    evidence.clues.push("本机未取得有效的 Authenticode 签名验证结果；请核对发布者与原始下载来源，不能据此认定有害。");
  }
  if (evidence.zoneId === null && evidence.sourceHost === null) {
    evidence.clues.push("下载来源标记缺失或无法读取，不能据此确认文件来源。");
  }
  return evidence;
}
