import { app, shell } from "electron";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, open, readFile, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createParsedUpdateStatus, normalizeVersion } from "./update-version.js";
import { assertUpdateRedirect, readUpdateChecksum, selectUpdateDownload, updateRepository, updateReleasesUrl, type UpdateDownload, type UpdateRelease } from "./update-release.js";
import { preparePortableUpdate, updateFileDigest } from "./update-package.js";
import type { UpdateStatus } from "./update-types.js";
export type { UpdateStatus, UpdateStatusState } from "./update-types.js";

let updateStatus: UpdateStatus = { state: "idle", currentVersion: getCurrentAppVersion() };
let checkInFlight: Promise<UpdateStatus> | null = null;
let downloadInFlight: Promise<UpdateStatus> | null = null;
let selectedDownload: UpdateDownload | null = null;
let installing = false;
let prepared: { path: string; sha256: string; manifestPath?: string } | null = null;

export function getUpdateStatus(): UpdateStatus { return updateStatus; }
export async function checkForGitHubReleaseUpdate(): Promise<UpdateStatus> {
  if (downloadInFlight || updateStatus.state === "installing") return updateStatus;
  if (checkInFlight) return checkInFlight;
  selectedDownload = null;
  prepared = null;
  updateStatus = { state: "checking", currentVersion: getCurrentAppVersion() };
  checkInFlight = (async () => {
    try {
      const response = await fetch(`https://api.github.com/repos/${updateRepository}/releases/latest`, { headers: { Accept: "application/vnd.github+json", "User-Agent": `desktop-pet/${getCurrentAppVersion()}` }, redirect: "error", signal: AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error(`正式版本查询失败（HTTP ${response.status}）。`);
      const bytes = await readResponse(response, 1024 * 1024);
      const release = JSON.parse(bytes.toString("utf8")) as UpdateRelease;
      selectedDownload = selectUpdateDownload(release, process.platform, process.arch);
      updateStatus = { ...createUpdateStatusFromLatestRelease(getCurrentAppVersion(), release, Date.now()), assetName: selectedDownload?.asset.name, message: selectedDownload ? undefined : "当前平台暂未提供完整安装包，可查看发布页面。" };
    } catch (error) { updateStatus = createUpdateErrorStatus(getCurrentAppVersion(), error, Date.now()); }
    return updateStatus;
  })().finally(() => { checkInFlight = null; });
  return checkInFlight;
}
export async function downloadAppUpdate(): Promise<UpdateStatus> {
  if (downloadInFlight) return downloadInFlight;
  if (updateStatus.state !== "available" || !selectedDownload) throw new Error("请先检查并选择本平台的正式更新。");
  const download = selectedDownload;
  updateStatus = { ...updateStatus, state: "downloading", receivedBytes: 0, totalBytes: download.asset.size, error: undefined };
  downloadInFlight = (async () => {
    let directory: string | undefined;
    try {
      const signal = AbortSignal.timeout(20 * 60_000);
      const checksumResponse = await fetchAsset(download.checksums.browser_download_url, signal);
      const checksum = readUpdateChecksum((await readResponse(checksumResponse, 128 * 1024)).toString("utf8"), download.asset.name);
      const root = join(app.getPath("userData"), "updates");
      await mkdir(root, { recursive: true });
      directory = await mkdtemp(join(root, "release-"));
      const partial = join(directory, `${download.asset.name}.partial`);
      const destination = join(directory, download.asset.name);
      const handle = await open(partial, "wx");
      const hash = createHash("sha256");
      let received = 0;
      try {
        const response = await fetchAsset(download.asset.browser_download_url, signal);
        if (!response.body) throw new Error("更新下载没有内容。");
        for await (const chunk of response.body) {
          received += chunk.length;
          if (received > download.asset.size) throw new Error("更新包实际大小超过发布清单。");
          let written = 0;
          while (written < chunk.length) written += (await handle.write(chunk, written, chunk.length - written)).bytesWritten;
          hash.update(chunk);
          updateStatus = { ...updateStatus, receivedBytes: received };
        }
        if (received !== download.asset.size || hash.digest("hex") !== checksum) throw new Error("更新包的大小或 SHA-256 校验不一致，已停止安装。");
      } finally { await handle.close(); }
      await rename(partial, destination);
      prepared = { path: destination, sha256: checksum };
      let message = process.platform === "darwin" ? "ZIP 已通过 SHA-256 校验。打开后将 desktop-pet.app 替换到原位置；用户档案保留。" : "ZIP 已通过 SHA-256 校验。可打开目录手动更新并保留用户档案。";
      if (process.platform === "win32" && app.isPackaged) {
        try {
          const staged = await preparePortableUpdate(destination, dirname(process.execPath), app.getPath("userData"), process.pid, process.argv.includes("--open-studio") ? "--open-studio" : "--show-pet");
          const helperSource = join(process.resourcesPath, "app.asar.unpacked", "assets", "companion", "windows-portable-update.ps1");
          await copyFile(helperSource, join(staged.plan.workDir, "update.ps1"));
          prepared.manifestPath = staged.manifestPath;
          message = "更新已准备好。安装时退出本次桌宠、保留原程序备份并重新启动；现有用户档案不变。";
        } catch (error) { message = `已校验 ZIP，可打开更新目录手动安装。${error instanceof Error ? error.message : String(error)}`; }
      }
      updateStatus = { ...updateStatus, state: "ready", canInstall: true, installMethod: prepared.manifestPath ? "windows-portable" : "open-zip", message };
    } catch (error) {
      if (directory) await rm(directory, { recursive: true, force: true }).catch(() => undefined);
      prepared = null;
      updateStatus = { ...updateStatus, state: "error", error: error instanceof Error ? error.message : String(error) };
    }
    return updateStatus;
  })().finally(() => { downloadInFlight = null; });
  return downloadInFlight;
}
export async function installAppUpdate(): Promise<UpdateStatus> {
  if (updateStatus.state !== "ready" || !prepared) throw new Error("尚无准备完成的更新。");
  if (await updateFileDigest(prepared.path) !== prepared.sha256) throw new Error("下载包已发生变化，请重新检查更新。");
  if (!prepared.manifestPath) {
    if (process.platform === "darwin") {
      const error = await shell.openPath(prepared.path);
      if (error) throw new Error(error);
    } else shell.showItemInFolder(prepared.path);
    return updateStatus;
  }
  if (installing) throw new Error("更新辅助程序正在准备，请稍候。");
  installing = true;
  const manifestPath = prepared.manifestPath;
  const directory = dirname(manifestPath);
  const helper = join(directory, "update.ps1");
  const readyFile = join(directory, "ready.json");
  const helperSource = join(process.resourcesPath, "app.asar.unpacked", "assets", "companion", "windows-portable-update.ps1");
  let child: ReturnType<typeof spawn> | undefined;
  try {
    if (await updateFileDigest(helper) !== await updateFileDigest(helperSource)) throw new Error("更新辅助程序已发生变化。");
    await rm(readyFile, { force: true });
    const powershell = join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    child = spawn(powershell, ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", helper, "-ManifestPath", manifestPath], { detached: true, windowsHide: true, shell: false, stdio: "ignore" });
    let exited = false;
    child.once("exit", () => { exited = true; });
    await new Promise<void>((done, reject) => { child!.once("spawn", done); child!.once("error", reject); });
    let ready = false;
    for (let attempt = 0; attempt < 240 && !exited; attempt++) {
      try {
        const value = JSON.parse((await readFile(readyFile, "utf8")).replace(/^\uFEFF/, "")) as { ready?: unknown; parentProcessId?: unknown };
        if (value.ready === true && value.parentProcessId === process.pid) { ready = true; break; }
      } catch { /* 等待本次辅助程序完成文件校验。 */ }
      await new Promise(done => setTimeout(done, 500));
    }
    if (!ready || exited) throw new Error("更新辅助程序未就绪，桌宠继续运行。");
    child.unref();
    updateStatus = { ...updateStatus, state: "installing", canInstall: false };
    setTimeout(() => app.quit(), 100);
  } catch (error) {
    child?.kill();
    prepared.manifestPath = undefined;
    updateStatus = { ...updateStatus, installMethod: "open-zip", message: `自动更新未启动，可打开已核验 ZIP 手动替换。${error instanceof Error ? error.message : String(error)}` };
  } finally { installing = false; }
  return updateStatus;
}
export async function openUpdateReleasePage(): Promise<void> { await shell.openExternal(updateStatus.releaseUrl || updateReleasesUrl); }
export function createUpdateStatusFromLatestRelease(currentVersion: string, release: UpdateRelease, checkedAt: number): UpdateStatus {
  return createParsedUpdateStatus(currentVersion, release, checkedAt, updateRepository, updateReleasesUrl);
}
export function createUpdateErrorStatus(currentVersion: string, error: unknown, checkedAt: number): UpdateStatus {
  return { state: "error", currentVersion, checkedAt, error: error instanceof Error ? error.message : "更新失败。" };
}
function getCurrentAppVersion(): string { const version = app.getVersion(); return normalizeVersion(version) ? version : "0.0.0"; }
async function fetchAsset(url: string, signal: AbortSignal): Promise<Response> {
  for (let redirects = 0; redirects < 6; redirects++) {
    assertUpdateRedirect(url);
    const response = await fetch(url, { redirect: "manual", signal, headers: { "User-Agent": "desktop-pet-updater" } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      await response.body?.cancel();
      if (!location) throw new Error("更新下载跳转缺少目标地址。");
      url = new URL(location, url).toString();
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`更新下载失败（HTTP ${response.status}）。`); }
    return response;
  }
  throw new Error("更新下载跳转次数过多。");
}
async function readResponse(response: Response, limit: number): Promise<Buffer> {
  if (!response.body) throw new Error("更新服务没有返回内容。");
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error("更新服务响应超过上限。");
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}