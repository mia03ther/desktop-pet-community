import { useEffect, useState } from "react";
import type { StudioApi, StudioPreferences } from "./studio-api.js";
import { PetChatAppearanceSettings } from "./PetChatAppearanceSettings.js";

export function StudioSettingsView({ api, onChanged }: { api: StudioApi; onChanged: () => void }) {
  const [preferences, setPreferences] = useState<StudioPreferences | null>(null);
  const [login, setLogin] = useState<{ supported: boolean; enabled: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shortcut, setShortcut] = useState("");
  useEffect(() => {
    let cancelled = false;
    void Promise.all([api.getSettingsState(), api.getLaunchAtLogin()]).then(([state, launch]) => {
      if (cancelled) return;
      setPreferences(state.preferences); setShortcut(state.preferences.petToggleShortcut); setLogin(launch);
    }).catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    return () => { cancelled = true; };
  }, [api]);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice("已保存。"); onChanged(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(false); }
  }
  const switches = [
    ["openDefaultPetOnLaunch", "启动时显示桌宠"], ["speechBubblesEnabled", "允许台词气泡"],
    ["showChatButton", "显示对话按钮"], ["showTalkButton", "显示语音按钮"],
    ["idleCursorGazeEnabled", "V2 宠物看向鼠标"], ["petGravityEnabled", "启用桌宠重力"],
    ["petCrossDisplayEnabled", "允许跨屏活动"],
  ] as const;
  return <section className="studio-section">
    {error && <p className="studio-error" role="alert">{error}</p>}{notice && <p className="studio-notice" role="status">{notice}</p>}
    <div className="studio-panel"><h2>陪伴方式</h2>
      {!preferences && <p>正在读取设置…</p>}
      {preferences && <div className="studio-fields">
        {switches.map(([key, label]) => <label className="studio-toggle" key={key}><span>{label}</span><input type="checkbox" checked={preferences[key]} disabled={busy} onChange={(event) => { const value = event.target.checked; void run(async () => { await api.updatePreferences({ [key]: value }); setPreferences((current) => current ? { ...current, [key]: value } : current); }); }} /></label>)}
        <label>桌宠大小<select value={preferences.petScale} disabled={busy} onChange={(event) => { const value = Number(event.target.value); void run(async () => { await api.updatePreferences({ petScale: value }); setPreferences((current) => current ? { ...current, petScale: value } : current); }); }}>{[[.35, "很小"], [.5, "小"], [.75, "适中"], [1, "大"], [1.25, "很大"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>一键隐藏 / 显示快捷键<input value={shortcut} disabled={busy} onChange={(event) => setShortcut(event.target.value)} placeholder="例如 Ctrl+Alt+P；留空则停用" /></label>
        <div className="studio-actions"><button disabled={busy} onClick={() => { void run(async () => { await api.updatePreferences({ petToggleShortcut: shortcut }); }); }}>保存快捷键</button><button className="secondary" disabled={busy} onClick={() => { void run(() => api.resetDefaultPetPosition()); }}>找回桌宠位置</button></div>
      </div>}
      {login && <label className="studio-toggle"><span>{login.supported ? "开机自动启动" : "当前运行方式不支持开机设置"}</span><input type="checkbox" checked={login.enabled} disabled={busy || !login.supported} onChange={(event) => { const value = event.target.checked; void run(async () => setLogin(await api.setLaunchAtLogin(value))); }} /></label>}
    </div>
    {preferences && <PetChatAppearanceSettings api={api} initialValue={preferences.petChatAppearance} onSaved={(petChatAppearance) => {
      setPreferences((current) => current ? { ...current, petChatAppearance } : current);
      onChanged();
    }} />}
  </section>;
}
