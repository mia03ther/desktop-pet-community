export const updateRepository = "xunguangzlj-cloud/desktop-pet-community";
export const updateReleasesUrl = `https://github.com/${updateRepository}/releases`;

export interface UpdateRelease {
  readonly tag_name?: unknown;
  readonly name?: unknown;
  readonly html_url?: unknown;
  readonly draft?: unknown;
  readonly prerelease?: unknown;
  readonly assets?: unknown;
}
export interface UpdateAsset { readonly name: string; readonly size: number; readonly browser_download_url: string }
export interface UpdateDownload { readonly asset: UpdateAsset; readonly checksums: UpdateAsset; readonly tag: string }

export function selectUpdateDownload(release: UpdateRelease, platform: string, arch: string): UpdateDownload | null {
  if (release.draft === true || release.prerelease === true || typeof release.tag_name !== "string" || !/^v?\d+\.\d+\.\d+$/.test(release.tag_name)) throw new Error("只能更新本项目的正式版本。");
  const version = release.tag_name.replace(/^v/, "");
  const filename = platform === "win32" && (arch === "x64" || arch === "arm64")
    ? `desktop-pet-${version}-windows-${arch}-portable.zip`
    : platform === "darwin" && (arch === "x64" || arch === "arm64") ? `desktop-pet-${version}-mac-${arch}.zip` : null;
  if (!filename) return null;
  if (!Array.isArray(release.assets) || release.assets.length > 100) throw new Error("正式版本的下载清单无效。");
  const assets = release.assets.filter((value): value is UpdateAsset => typeof value === "object" && value !== null && typeof value.name === "string" && typeof value.size === "number" && Number.isSafeInteger(value.size) && value.size > 0 && typeof value.browser_download_url === "string");
  const asset = assets.find(item => item.name === filename);
  const checksums = assets.find(item => item.name === "SHA256SUMS.txt") ?? assets.find(item => item.name === `SHA256SUMS-${platform === "darwin" ? "macos" : "windows"}-${arch}.txt`);
  if (!asset || !checksums) return null;
  if (asset.size > 2 * 1024 ** 3 || checksums.size > 128 * 1024) throw new Error("更新包或校验清单超过上限。");
  for (const item of [asset, checksums]) {
    const expected = `https://github.com/${updateRepository}/releases/download/${release.tag_name}/${item.name}`;
    if (item.browser_download_url !== expected) throw new Error("更新只允许下载本仓库同一版本的正式资产。");
  }
  return { asset, checksums, tag: release.tag_name };
}

export function readUpdateChecksum(text: string, filename: string): string {
  const entries = text.split(/\r?\n/).map(line => /^([a-fA-F0-9]{64})\s+\*?(.+)$/.exec(line.trim())).filter((item): item is RegExpExecArray => item !== null && item[2] === filename);
  if (entries.length !== 1) throw new Error("更新包缺少唯一 SHA-256 校验值。");
  return entries[0]![1]!.toLowerCase();
}

export function assertUpdateRedirect(value: string): void {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || !["github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"].includes(url.hostname)) throw new Error("更新下载跳转到未经允许的地址。");
  if (url.hostname === "github.com" && !url.pathname.startsWith(`/${updateRepository}/releases/download/`)) throw new Error("更新下载跳转到了其他仓库。");
}