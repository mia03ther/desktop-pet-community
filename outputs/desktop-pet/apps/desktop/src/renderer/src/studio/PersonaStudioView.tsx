import { useEffect, useRef, useState } from "react";
import type { CompanionAiApi, CompanionAiSnapshot } from "../../../companion-ai-types.js";
import type { CompanionPersonaDocument, CompanionPersonaMode, CompanionPersonaEnvironment, CompanionPersonaSkillScan } from "../../../companion-persona-types.js";

export function PersonaStudioView({ api, onOpenProviders }: {
  api: CompanionAiApi;
  onOpenProviders: () => void;
}) {
  const [snapshot, setSnapshot] = useState<CompanionAiSnapshot | null>(null);
  const [document, setDocument] = useState<CompanionPersonaDocument | null>(null);
  const [mode, setMode] = useState<CompanionPersonaMode>("global-md");
  const [content, setContent] = useState("");
  const [profileId, setProfileId] = useState("");
  const [name, setName] = useState("我的桌宠");
  const [focus, setFocus] = useState("");
  const [material, setMaterial] = useState("");
  const [busy, setBusy] = useState("读取设置");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [environment, setEnvironment] = useState<CompanionPersonaEnvironment | null>(null);
  const [skillScan, setSkillScan] = useState<CompanionPersonaSkillScan | null>(null);
  const [selectedSkill, setSelectedSkill] = useState("");
  const mounted = useRef(false);
  const generation = useRef(0);
  const activeOperation = useRef<number | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const current = ++generation.current;
    void Promise.all([api.getSnapshot(), api.getPersonaDocument(), api.getPersonaEnvironment()]).then(([nextSnapshot, nextDocument, nextEnvironment]) => {
      if (!mounted.current || current !== generation.current) return;
      setSnapshot(nextSnapshot);
      setDocument(nextDocument);
      setMode(nextDocument?.mode ?? "global-md");
      setContent(nextDocument?.content ?? "");
      setEnvironment(nextEnvironment);
      setBusy("");
    }).catch((failure: unknown) => {
      if (!mounted.current || current !== generation.current) return;
      setError(failure instanceof Error ? failure.message : "人设设置读取失败，请重新打开。");
      setBusy("");
    });
    return () => {
      mounted.current = false;
      generation.current += 1;
      void api.cancelPersonaDistillation().catch(() => {});
    };
  }, [api]);

  async function run(label: string, operation: () => Promise<void>) {
    if (busy) return;
    const current = ++generation.current;
    cancelled.current = false;
    activeOperation.current = current;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (failure) {
      if (mounted.current && current === generation.current) {
        if (cancelled.current) setNotice("提炼已取消，现有人设与编辑内容保持不变。");
        else setError(failure instanceof Error ? failure.message : `${label}未完成，请重试。`);
      }
    } finally {
      if (activeOperation.current === current) activeOperation.current = null;
      if (mounted.current && current === generation.current) setBusy("");
    }
  }

  async function refreshDocument() {
    const [nextSnapshot, nextDocument, nextEnvironment] = await Promise.all([api.getSnapshot(), api.getPersonaDocument(), api.getPersonaEnvironment()]);
    if (!mounted.current) return;
    setSnapshot(nextSnapshot);
    setDocument(nextDocument);
    setMode(nextDocument?.mode ?? "global-md");
    setContent(nextDocument?.content ?? "");
    setEnvironment(nextEnvironment);
  }

  const profiles = snapshot?.monitor.profiles.filter((profile) =>
    ["openai-compatible-text", "openai-realtime", "anthropic-text"].includes(profile.adapter)) ?? [];
  const changed = content !== (document?.content ?? "") || mode !== (document?.mode ?? "global-md");
  const generating = busy === "生成草稿";

  return <section className="studio-section" aria-labelledby="persona-studio-title">
    <div className="studio-heading">
      <h2 id="persona-studio-title">人设与个性</h2>
      <p>人设适用于本桌宠的文字对话和协同分析，各 AI 来源共用同一份已启用文档。外部 AI 应用需要另行接入。</p>
      <div className="studio-actions">
        <button disabled={!!busy} onClick={() => void run("导入已蒸馏 Skill", async () => {
          const result = await api.importPersona("distilled-md");
          if (!result) {
            if (mounted.current) setNotice("已取消选择，编辑内容保持不变。");
            return;
          }
          await refreshDocument();
          if (mounted.current) setNotice("人设文档已导入并启用，后续每次桌宠对话自动应用，无需触发词。");
        })}>导入已蒸馏 Skill</button>
        <button disabled={!!busy} onClick={() => void run("导入完整 Skill 文件夹", async () => {
          const result = await api.importPersonaDirectory("distilled-md");
          if (!result) {
            if (mounted.current) setNotice("已取消选择，现有人设保持不变。");
            return;
          }
          await refreshDocument();
          if (mounted.current) setNotice(`完整 Skill 已导入并自动启用，保留 ${result.skillFileCount ?? 0} 个文件，加载 ${result.loadedReferenceCount ?? 0} 份明确引用的文本。后续对话无需触发词。`);
        })}>导入完整 Skill 文件夹</button>
      </div>
      <p>单文件选择 SKILL.md、Markdown 或 UTF-8 纯文本。完整文件夹须含 SKILL.md，可保留 manifest.json、references/ 和其他素材。</p>
    </div>
    {error && <div className="studio-error" role="alert">{error}</div>}
    {notice && <div className="studio-notice" role="status">{notice}</div>}
    <div className="studio-panel studio-fields">
      <h3>人物 Skill 环境</h3>
      <p>本应用支持人设提示词与目录 Skill 加载，已启用人物每轮自动应用。模型实际扮演效果需通过对话确认；外部 AI 平台是否原生支持 SKILL.md 尚未检测。</p>
      <p>当前文字 AI：{environment?.selectedProfile ? `${environment.selectedProfile.label} · ${environment.selectedProfile.model}（${environment.conversationReady ? "已配置，可进行桌宠对话" : "尚未就绪"}）` : "尚未配置"}。</p>
      <p>当前人物 Skill：{environment?.activeSkillName ?? "未选择目录 Skill"}{document?.enabled ? "（已启用）" : "（未启用）"}。</p>
      <p>本应用托管 skills 目录：<code style={{ overflowWrap: "anywhere" }}>{environment?.skillsDirectory ?? "正在读取…"}</code></p>
      <p>可将整个 Denia-skill 等人物文件夹复制到此目录，再点击扫描。只有一个且尚未选择人设时会自动启用；存在多个时由你选择，现有人设保留。此目录不会修改系统或 Codex 的全局 skills。</p>
      <div className="studio-actions">
        <button className="secondary" disabled={!!busy} onClick={() => void run("打开 skills 目录", async () => {
          await api.openPersonaSkillsDirectory();
        })}>打开 skills 目录</button>
        <button className="secondary" disabled={!!busy} onClick={() => void run("扫描 skills", async () => {
          const result = await api.scanPersonaSkills();
          if (!mounted.current) return;
          setSkillScan(result);
          await refreshDocument();
          if (mounted.current) setNotice(result.activated ? `已刷新并启用 ${result.activated}。` : result.requiresSelection ? "发现多个人物 Skill，请选择要启用的一项。" : "扫描完成，现有人设保持不变。");
        })}>扫描并刷新 Skill</button>
      </div>
      {skillScan && <>
        <label>目录中的人物 Skill<select value={selectedSkill} disabled={!!busy} onChange={(event) => setSelectedSkill(event.target.value)}>
          <option value="">请选择人物 Skill</option>
          {skillScan.candidates.map((candidate) => <option key={candidate.name} value={candidate.name} disabled={!!candidate.error}>{candidate.name}{candidate.error ? "（读取失败）" : ""}</option>)}
        </select></label>
        {skillScan.candidates.filter((candidate) => candidate.error).map((candidate) => <p key={candidate.name} role="status">{candidate.name}：{candidate.error}</p>)}
        <button disabled={!!busy || !selectedSkill} onClick={() => void run("启用所选 Skill", async () => {
          const result = await api.scanPersonaSkills(selectedSkill);
          if (!mounted.current) return;
          setSkillScan(result);
          await refreshDocument();
          if (mounted.current) setNotice(`已启用 ${result.activated}，后续每轮对话自动应用。`);
        })}>启用所选 Skill</button>
      </>}
    </div>
    <div className="studio-panel">
      <fieldset className="studio-fields" disabled={!!busy}>
        <legend>选择编写方式</legend>
        <label><input type="radio" name="persona-mode" value="global-md" checked={mode === "global-md"} onChange={() => setMode("global-md")} />全局 Markdown：自己编写或导入</label>
        <label><input type="radio" name="persona-mode" value="distilled-md" checked={mode === "distilled-md"} onChange={() => setMode("distilled-md")} />蒸馏人设：导入已有结果或由 AI 帮助提炼</label>
      </fieldset>
      <p>切换方式和编辑正文均不会改变已保存的人设。保存后默认停用，核对后再启用。</p>
      {mode === "distilled-md" && <div className="studio-fields">
        <h3>从提供的资料生成草稿</h3>
        <p>从文章、对话或自述中提炼人物特征，不训练模型。点击生成会将下面的名称、侧重点和素材发送给所选 AI 来源，可能消耗其额度；不会读取文档引用或自动抓取网址。</p>
        <label>文字 AI 来源<select value={profileId} disabled={!!busy} onChange={(event) => setProfileId(event.target.value)}>
          <option value="">请选择已配置的来源</option>
          {profiles.map((profile) => <option key={profile.id} value={profile.id} disabled={profile.configuration !== "ready"}>{profile.label} · {profile.model}{profile.configuration !== "ready" ? "（尚未就绪）" : ""}</option>)}
        </select></label>
        <label>人物名称<input value={name} maxLength={120} disabled={!!busy} onChange={(event) => setName(event.target.value)} /></label>
        <label>提炼侧重点（可选）<input value={focus} maxLength={1000} disabled={!!busy} placeholder="例如：日常陪伴、说话习惯、做决定的方式" onChange={(event) => setFocus(event.target.value)} /></label>
        <label>待发送的人物素材<textarea value={material} disabled={!!busy} rows={8} placeholder="粘贴自己写的资料或已获准使用的片段，最多 32 KiB；保留来源和场景有助于核对证据。" onChange={(event) => setMaterial(event.target.value)} /></label>
        <div className="studio-actions">
          <button disabled={!!busy || !profileId || !name.trim() || !material.trim()} onClick={() => void run("生成草稿", async () => {
            const draft = await api.distillPersona({ profileId, name, focus, material });
            if (!mounted.current) return;
            setMode("distilled-md");
            setContent(draft.content);
            setNotice(`草稿已生成，尚未保存或启用。请核对证据、删改后保存。${draft.usage?.totalTokens !== null && draft.usage?.totalTokens !== undefined ? `本次提供方返回 ${draft.usage.totalTokens} token。` : "提供方未返回总 token 用量。"}`);
          })}>{generating ? "正在提炼…" : "生成可编辑草稿"}</button>
          {generating && <button onClick={() => {
            const current = generation.current;
            cancelled.current = true;
            setNotice("已请求取消，等待本次请求结束。");
            void api.cancelPersonaDistillation().then((result) => {
              if (mounted.current && activeOperation.current === current && !result.cancelled) {
                cancelled.current = false;
                setNotice("当前没有可取消的提炼请求，正在等待结果或界面更新。");
              }
            }).catch((failure: unknown) => {
              if (mounted.current && activeOperation.current === current) setError(failure instanceof Error ? failure.message : "取消请求未完成。");
            });
          }}>取消提炼</button>}
          <button className="secondary" disabled={!!busy} onClick={onOpenProviders}>配置 AI 来源</button>
        </div>
      </div>}
    </div>
    <div className="studio-panel studio-fields">
      <h3>{mode === "global-md" ? "全局人设 Markdown" : "蒸馏人设 Markdown"}</h3>
      <label>可编辑正文<textarea value={content} disabled={!!busy} rows={16} placeholder={mode === "global-md" ? "写下桌宠的身份、语气、称呼、互动偏好和表达边界。" : "粘贴自己蒸馏好的 Markdown，或审阅上方 AI 生成的草稿。"} onChange={(event) => setContent(event.target.value)} /></label>
      <p>普通 Markdown 提示词最多 8 KiB，完整 Skill 与明确引用的资料最多 48 KiB，超限会明确拒绝。脚本和工具声明不会执行。保存此编辑正文会按普通 Markdown 保存；原完整 Skill 仍保留在托管目录，可重新扫描启用。</p>
      <div className="studio-actions">
        <button disabled={!!busy || !content.trim()} onClick={() => void run("保存人设", async () => {
          const next = await api.savePersonaDocument({ mode, content });
          if (!mounted.current) return;
          setDocument({ mode, content, enabled: false, format: "character-markdown", importedAt: next.importedAt ?? new Date().toISOString() });
          if (snapshot) setSnapshot({ ...snapshot, persona: next });
          setNotice("人设已保存，默认停用；核对后点击启用已保存人设。");
        })}>保存人设{changed ? "（有未保存修改）" : ""}</button>
        <button className="secondary" disabled={!!busy} onClick={() => void run("导入文档", async () => {
          const result = await api.importPersona(mode);
          if (!result) {
            if (mounted.current) setNotice("已取消选择，编辑内容保持不变。");
            return;
          }
          await refreshDocument();
          if (mounted.current) setNotice("文档已导入并自动启用，后续每轮对话自动应用，无需触发词。");
        })}>导入人设文档</button>
        <button className="secondary" disabled={!!busy || !document} onClick={() => void run("导出人设", async () => {
          const result = await api.exportPersona();
          if (mounted.current) setNotice(result.exported ? "已导出已保存的人设文档。" : "已取消导出。");
        })}>导出已保存文档</button>
        <button className="danger" disabled={!!busy || !document} onClick={() => void run("清除人设", async () => {
          await api.clearPersona();
          await refreshDocument();
          if (mounted.current) setNotice("已清除本桌宠保存的人设，原始导入文件保持不变。");
        })}>清除已保存人设</button>
      </div>
      <label><input type="checkbox" checked={document?.enabled ?? false} disabled={!!busy || !document || changed} onChange={(event) => {
        const enabled = event.target.checked;
        void run("更新启用状态", async () => {
          const next = await api.setPersonaEnabled(enabled);
          if (!mounted.current) return;
          setDocument((previous) => previous ? { ...previous, enabled } : null);
          if (snapshot) setSnapshot({ ...snapshot, persona: next });
          setNotice(enabled ? "已启用已保存人设，下一次对话或分析任务生效。" : "已停用人设，下一次对话或分析任务不再附加正文。");
        });
      }} />启用已保存人设{changed ? "（请先保存修改）" : ""}</label>
    </div>
  </section>;
}
