import { useEffect, useRef, useState } from "react";
import type { CompanionAiApi, CompanionAiSnapshot, CompanionAiTaskPreview } from "../../../companion-ai-types.js";
import { Button } from "../components/ui/Button.js";
import "./companion-ai.css";

/** 协同任务在电脑插件中发起，回复由同一桌宠对话展示。 */
export function CompanionAnalysisControls({ api }: { readonly api: CompanionAiApi }) {
  const [snapshot, setSnapshot] = useState<CompanionAiSnapshot | null>(null);
  const [problem, setProblem] = useState("");
  const [preview, setPreview] = useState<CompanionAiTaskPreview | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [leader, setLeader] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(false);
  const previewGeneration = useRef(0);

  useEffect(() => {
    mounted.current = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const next = await api.getSnapshot();
        if (mounted.current) setSnapshot(next);
      } catch (reason) {
        if (mounted.current) setError(reason instanceof Error ? reason.message : "AI 来源读取失败。");
      }
      if (mounted.current) timer = setTimeout(() => { void refresh(); }, 3000);
    }
    void refresh();
    return () => {
      mounted.current = false;
      previewGeneration.current += 1;
      clearTimeout(timer);
    };
  }, [api]);

  const profiles = snapshot?.monitor.profiles.filter((profile) => profile.configuration === "ready"
    && ["openai-compatible-text", "openai-realtime", "anthropic-text"].includes(profile.adapter)) ?? [];
  const available = selected.filter((id) => profiles.some((profile) => profile.id === id));
  const activeTask = snapshot?.tasks.find((task) => task.state === "running");
  const expired = preview !== null && preview.expiresAt <= Date.now();

  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      const next = await api.getSnapshot();
      if (mounted.current) setSnapshot(next);
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : "协同任务未完成。");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return <details className="companion-ai cai-card">
    <summary>让多个 AI 协同分析</summary>
    {error && <p className="cai-error" role="alert">{error}</p>}
    {notice && <p className="cai-notice" role="status">{notice}</p>}
    <p className="cai-hint">先采样电脑数据，再预览本次发送资料。分析回复会进入“宠物大脑 → 对话”。</p>
    <label className="cai-field">要分析的问题
      <textarea value={problem} maxLength={2000} rows={3} disabled={busy || Boolean(activeTask)} placeholder="例如：内存占用较高，怎样调整更合适？" onChange={(event) => {
        setProblem(event.target.value);
        setPreview(null);
        previewGeneration.current += 1;
      }} />
    </label>
    <Button variant="secondary" disabled={busy || !problem.trim() || Boolean(activeTask)} onClick={() => {
      const generation = ++previewGeneration.current;
      void run(async () => {
        const next = await api.previewDiagnostics(problem.trim());
        if (mounted.current && generation === previewGeneration.current) setPreview(next);
      });
    }}>预览发送资料</Button>
    {preview && <div className="cai-preview">
      <strong>{preview.problem}</strong>
      <pre>{preview.context}</pre>
      {expired && <p className="cai-error">预览已过期，请重新预览。</p>}
    </div>}
    <h3>参与的 AI</h3>
    {profiles.length === 0 && <p className="cai-hint">先在“宠物大脑 → 接入 AI”保存可用的文字模型。</p>}
    <div className="cai-profile-options">
      {profiles.map((profile) => <label className="cai-profile-option" key={profile.id}>
        <input type="checkbox" checked={available.includes(profile.id)} disabled={busy || Boolean(activeTask) || !available.includes(profile.id) && available.length >= 3} onChange={() => {
          const next = available.includes(profile.id) ? available.filter((id) => id !== profile.id) : [...available, profile.id];
          setSelected(next);
          if (!next.includes(leader)) setLeader(next[0] ?? "");
        }} />
        <span><strong>{profile.label}</strong><small>{profile.model}</small></span>
      </label>)}
    </div>
    <label className="cai-field">汇总回复的 AI
      <select value={available.includes(leader) ? leader : ""} disabled={busy || Boolean(activeTask)} onChange={(event) => setLeader(event.target.value)}>
        <option value="">选择已勾选的 AI</option>
        {profiles.filter((profile) => available.includes(profile.id)).map((profile) => <option value={profile.id} key={profile.id}>{profile.label}</option>)}
      </select>
    </label>
    <div className="cai-actions">
      <Button disabled={busy || Boolean(activeTask) || !preview || expired || available.length === 0 || !available.includes(leader)} onClick={() => {
        if (!preview) return;
        void run(async () => {
          await api.startTask(preview.id, available, leader);
          if (mounted.current) {
            setPreview(null);
            setNotice("协同分析已开始，回复将在桌宠对话中显示。");
          }
        });
      }}>确认并开始分析</Button>
      {activeTask && <Button variant="secondary" disabled={busy} onClick={() => {
        void run(async () => { await api.cancelTask(activeTask.id); });
      }}>取消当前分析</Button>}
    </div>
  </details>;
}
