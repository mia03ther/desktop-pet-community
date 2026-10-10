import { useEffect, useRef, useState } from "react";

import {
  companionPluginFieldLimits,
  companionPluginReactions,
  getCompanionPluginPermissions,
  parseCompanionPluginAuthoringInput,
  type CompanionPluginPackageResult,
  type PluginAuthoringApi,
} from "../../../companion-plugin-authoring-types.js";

export type { PluginAuthoringApi } from "../../../companion-plugin-authoring-types.js";

const reactionLabels: Record<typeof companionPluginReactions[number], string> = {
  idle: "待机", thinking: "思考", working: "工作", editing: "编辑", running: "奔跑",
  testing: "测试", waiting: "等待", waving: "招手", success: "成功", error: "出错", celebrating: "庆祝",
};

export function PluginAuthoringView({ api }: { readonly api: PluginAuthoringApi }) {
  const [id, setId] = useState("local.my-reminder");
  const [title, setTitle] = useState("我的提醒");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [speech, setSpeech] = useState("起来活动一下，喝口水。");
  const [reaction, setReaction] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [license, setLicense] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<CompanionPluginPackageResult | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const permissions = getCompanionPluginPermissions({
    id, title, everyMinutes: Number(minutes), speech,
    ...(companionPluginReactions.some((item) => item === reaction)
      ? { reaction: reaction as typeof companionPluginReactions[number] } : {}),
  });

  async function createPackage() {
    setError("");
    setNotice("");
    let draft;
    try {
      draft = parseCompanionPluginAuthoringInput({
        id, title, description, everyMinutes: Number(minutes), speech,
        ...(reaction ? { reaction } : {}), author, source, license,
      });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "请检查插件制作信息。");
      return;
    }
    setBusy(true);
    try {
      const exported = await api.createPackage(draft);
      if (!alive.current) return;
      if (exported) {
        setResult(exported);
        setNotice("共创插件已保存。导入文件夹并确认权限后才会启用。");
      } else {
        setNotice("已取消保存，填写内容已保留。");
      }
    } catch (failure) {
      if (alive.current) setError(failure instanceof Error ? failure.message : "插件保存失败，请重试。");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  async function importPackage() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const loaded = await api.loadLocalPlugin();
      if (!alive.current) return;
      if (!loaded.ok) setError(loaded.error || "插件导入失败。");
      else setNotice("导入流程已结束；取消或拒绝权限不会加载新插件。可在插件管理中查看实际状态。");
    } catch (failure) {
      if (alive.current) setError(failure instanceof Error ? failure.message : "插件导入失败。");
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return <section className="studio-section" aria-labelledby="plugin-authoring-title">
    <div className="studio-panel">
      <h2 id="plugin-authoring-title">共创插件</h2>
      <p>制作一个定时提醒插件，保存为可分享的文件夹。它通过桌宠显示台词，可选一个反应动作。</p>
      <form onSubmit={(event) => { event.preventDefault(); void createPackage(); }}>
        <fieldset className="studio-fields" disabled={busy}>
          <label>插件 ID<input value={id} maxLength={companionPluginFieldLimits.id} onChange={(event) => setId(event.target.value)} placeholder="local.my-reminder" required /></label>
          <label>插件名称<input value={title} maxLength={companionPluginFieldLimits.title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label>插件说明<input value={description} maxLength={companionPluginFieldLimits.description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label>间隔（分钟）<input type="number" min={5} max={1440} step={1} value={minutes} onChange={(event) => setMinutes(event.target.value)} required /></label>
          <label>提醒台词<input value={speech} maxLength={companionPluginFieldLimits.speech} onChange={(event) => setSpeech(event.target.value)} required /></label>
          <label>反应动作<select value={reaction} onChange={(event) => setReaction(event.target.value)}>
            <option value="">只显示台词</option>
            {companionPluginReactions.map((item) => <option key={item} value={item}>{reactionLabels[item]}</option>)}
          </select></label>
          <label>作者（可选）<input value={author} maxLength={companionPluginFieldLimits.author} onChange={(event) => setAuthor(event.target.value)} placeholder="未填写时标记为待核实" /></label>
          <label>来源（可选）<input value={source} maxLength={companionPluginFieldLimits.source} onChange={(event) => setSource(event.target.value)} placeholder="来源链接或素材说明" /></label>
          <label>许可声明（可选）<input value={license} maxLength={companionPluginFieldLimits.license} onChange={(event) => setLicense(event.target.value)} placeholder="由你核实后填写" /></label>
        </fieldset>
        <div className="studio-notice">
          <strong>权限预览：{permissions.join("、")}</strong>
          <p>定时触发、桌宠台词{reaction ? "与反应动作" : ""}。保存不会自动安装或启用；首次导入需确认权限。作者和许可为填写者声明。</p>
        </div>
        <div className="studio-actions">
          <button type="submit" disabled={busy}>{busy ? "正在处理…" : "保存共创插件文件夹"}</button>
          <button type="button" disabled={busy} onClick={() => { void importPackage(); }}>导入插件文件夹</button>
        </div>
      </form>
      {error && <p className="studio-error" role="alert">{error}</p>}
      {notice && <p className="studio-notice" role="status">{notice}</p>}
      {result && <div className="studio-notice">
        <p>已保存：<code>{result.directoryPath}</code></p>
        <p>本文件夹包含运行清单和 SHARE.md。导入时选择这个文件夹；请保留原包中的署名说明。</p>
      </div>}
    </div>
  </section>;
}
