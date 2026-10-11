import { useEffect, useRef, useState } from "react";
import type { UpdateStatus } from "../../../update-types.js";
import type { StudioApi } from "./studio-api.js";

export function AppUpdateSettings({ api }: { readonly api: StudioApi }) {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    void api.getAppUpdateStatus().then(value => { if (alive.current) setStatus(value); }).catch(reason => { if (alive.current) setError(String(reason)); });
    return () => { alive.current = false; };
  }, [api]);
  useEffect(() => {
    if (status?.state !== "downloading") return;
    let cancelled = false;
    const timer = setInterval(() => {
      void api.getAppUpdateStatus().then(value => {
        if (!cancelled) setStatus(current => current?.state === "downloading" ? value : current);
      }).catch(reason => { if (!cancelled) setError(String(reason)); });
    }, 1000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [api, status?.state]);
  async function update(action: "check" | "download" | "install") {
    setBusy(true); setError("");
    if (action === "download") setStatus(current => current ? { ...current, state: "downloading", receivedBytes: 0 } : current);
    try {
      const value = await (action === "check" ? api.checkAppUpdate() : action === "download" ? api.downloadAppUpdate() : api.installAppUpdate());
      if (alive.current) setStatus(value);
    } catch (reason) { if (alive.current) setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { if (alive.current) setBusy(false); }
  }
  const stateLabels = { idle: "尚未检查", checking: "正在检查…", available: "有正式更新", current: "已是最新正式版本", downloading: "正在下载并校验…", ready: "更新已准备好", installing: "正在退出并安装…", error: "更新失败" };
  return <div className="studio-panel" aria-label="程序更新"><h2>程序更新</h2>
    <p>当前版本：{status?.currentVersion ?? "正在读取…"}{status?.latestVersion && ` · 最新版本：${status.latestVersion}`}</p>
    {status && <p role="status">{stateLabels[status.state]}{status.state === "downloading" && status.totalBytes ? ` ${Math.floor((status.receivedBytes ?? 0) / 1024 ** 2)} / ${Math.ceil(status.totalBytes / 1024 ** 2)} MB` : ""}</p>}
    {(error || status?.error) && <p className="studio-error" role="alert">{error || status?.error}</p>}
    {status?.message && <p>{status.message}</p>}
    <div className="studio-actions">
      <button disabled={busy || !status || status.state === "ready" || status.state === "installing"} onClick={() => { void update("check"); }}>检查更新</button>
      {status?.state === "available" && status.assetName && <button disabled={busy} onClick={() => { void update("download"); }}>下载并准备更新</button>}
      {status?.state === "ready" && <button disabled={busy || !status.canInstall} onClick={() => { void update("install"); }}>{status.installMethod === "windows-portable" ? "安装并重新启动" : "打开更新包"}</button>}
      <button className="secondary" disabled={busy} onClick={() => { void api.openAppUpdateRelease().catch(reason => setError(String(reason))); }}>查看正式发布</button>
      <button className="secondary" disabled={busy} onClick={() => { void api.openCommunityWebsite("pets").catch(reason => setError(String(reason))); }}>打开最新共创网站</button>
    </div>
  </div>;
}