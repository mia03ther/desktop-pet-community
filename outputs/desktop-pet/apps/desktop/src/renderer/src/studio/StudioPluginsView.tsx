import { useCallback, useEffect, useRef, useState } from "react";
import { displayProductText } from "../i18n.js";

import { getCompanionToolPluginKind, hasCompanionToolPluginAccess } from "../../../companion-tool-plugins.js";
import type { CompanionToolsApi } from "../../../companion-tools-types.js";
import type { CompanionAiApi } from "../../../companion-ai-types.js";
import { CompanionToolsView } from "../companion/CompanionToolsView.js";
import { CommunityPortalView, type CommunityPortalApi } from "./CommunityPortalView.js";
import { OriginalProjectsPanel } from "./OriginalProjectsPanel.js";
import type {
  StudioPluginApi,
  StudioPluginCommand as PluginCommand,
  StudioPluginConfig as PluginConfig,
  StudioPluginConfigField as PluginConfigField,
  StudioPluginConfigValue as PluginConfigValue,
  StudioPluginRecord as SafePluginRecord,
  StudioPluginResult as PluginServiceResult,
  StudioPluginSnapshot as PluginServiceSnapshot,
} from "./studio-plugin-types.js";

export type { StudioPluginApi } from "./studio-plugin-types.js";

type StudioPluginsApi = StudioPluginApi & CommunityPortalApi & {
  readonly companion: CompanionToolsApi;
  readonly ai: CompanionAiApi;
};

export function StudioPluginsView({ api }: {
  readonly api: StudioPluginsApi;
}) {
  const [tab, setTab] = useState<"installed" | "community">("installed");
  const [snapshot, setSnapshot] = useState<PluginServiceSnapshot>({ plugins: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const next = await api.getPluginsSnapshot();
      if (alive.current && generation.current === request) {
        setSnapshot(next);
        setError("");
      }
    } catch (failure) {
      if (alive.current && generation.current === request) {
        setSnapshot({ plugins: [] });
        setError(failureMessage(failure));
      }
    } finally {
      if (alive.current && generation.current === request) setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const unsubscribe = api.onPluginsRefresh(() => { void refresh(); });
    return () => {
      alive.current = false;
      generation.current += 1;
      unsubscribe();
    };
  }, [api, refresh]);

  function applyResult(result: PluginServiceResult) {
    if (!alive.current) return;
    generation.current += 1;
    setSnapshot(result.snapshot);
    setLoading(false);
    setError(result.ok ? "" : result.error);
  }

  const plugins = snapshot.plugins.filter((plugin) => plugin.source !== "team");
  return <section className="studio-section" aria-labelledby="studio-plugins-title">
    <div className="studio-panel">
      <h2 id="studio-plugins-title">插件</h2>
      <div className="studio-actions studio-tabs" role="tablist" aria-label="插件页面">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "installed"}
          onClick={() => setTab("installed")}
        >
          已安装
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "community"}
          onClick={() => setTab("community")}
        >
          共创网站
        </button>
      </div>
    </div>
    {error && <p className="studio-error" role="alert">{displayProductText(error)}</p>}
    {tab === "community" && <CommunityPortalView api={api} section="plugins" />}
    <div hidden={tab !== "installed"}>
      <OriginalProjectsPanel api={api} kind="plugin" onChanged={refresh} />
      <div className="studio-actions">
        <button type="button" className="secondary" onClick={() => { void refresh(); }}>
          刷新
        </button>
      </div>
      {loading && <p className="studio-notice" role="status">正在读取插件…</p>}
      {!loading && plugins.length === 0 && <p className="studio-notice">还没有本机兼容插件。先检测完整插件 ZIP、清单或文件夹，再确认导入。</p>}
      {plugins.map((plugin) => <StudioPluginCard key={plugin.id} plugin={plugin} api={api} onResult={applyResult} />)}
    </div>
  </section>;
}

function StudioPluginCard({ plugin, api, onResult }: {
  readonly plugin: SafePluginRecord;
  readonly api: StudioPluginsApi;
  readonly onResult: (result: PluginServiceResult) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<PluginConfig>({ ...plugin.effectiveConfig });
  const [complexDraft, setComplexDraft] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const alive = useRef(true);
  const toolKind = getCompanionToolPluginKind(plugin.id);
  const toolAvailable = toolKind !== undefined
    && hasCompanionToolPluginAccess(toolKind, plugin, plugin.active === true);
  const displayName = (plugin.name || "本地插件").replace(/OpenPets?/gi, "desktop pet");
  const displayDescription = (plugin.description || "暂无说明")
    .replace(/OpenPets?/gi, "desktop pet")
    .replace(/从宠物菜单设置/g, "在插件配置中设置");

  useEffect(() => {
    if (toolKind && !toolAvailable) {
      setExpanded(false);
    }
  }, [toolKind, toolAvailable]);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  useEffect(() => {
    if (!dirty) {
      setDraft({ ...plugin.effectiveConfig });
      setComplexDraft({});
    }
  }, [plugin.effectiveConfig, dirty]);

  const schema = plugin.configSchema ?? {};
  function updateField(key: string, value: PluginConfigValue) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setDirty(true);
  }

  async function run(operation: () => Promise<PluginServiceResult>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await operation();
      if (!alive.current) return;
      onResult(result);
      if (result.ok) setNotice(message);
      else setError(result.error);
    } catch (failure) {
      if (alive.current) setError(failureMessage(failure));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  async function saveConfig() {
    let next: PluginConfig;
    try {
      next = { ...draft };
      for (const [key, text] of Object.entries(complexDraft)) {
        const parsed: unknown = JSON.parse(text);
        next[key] = parseComplexValue(parsed, schema[key]!);
      }
    } catch (failure) {
      setError(failureMessage(failure));
      return;
    }
    await run(async () => {
      const result = await api.savePluginConfig(plugin.id, next);
      if (result.ok && alive.current) {
        setDirty(false);
        setComplexDraft({});
        setDraft({ ...result.snapshot.plugins.find((entry) => entry.id === plugin.id)?.effectiveConfig });
      }
      return result;
    }, "配置已保存。");
  }

  async function pickSound(key: string) {
    if (!api.pickPluginConfigSound) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.pickPluginConfigSound(plugin.id);
      if (!alive.current) return;
      if (!result.ok) setError(result.error);
      else if ("sound" in result) {
        updateField(key, result.sound);
        setComplexDraft((previous) => {
          const next = { ...previous };
          delete next[key];
          return next;
        });
      }
    } catch (failure) {
      if (alive.current) setError(failureMessage(failure));
    } finally {
      if (alive.current) setBusy(false);
    }
  }

  return <article className="studio-panel" aria-label={displayName}>
    <h3>{displayName}</h3>
    <p>{displayDescription}</p>
    <p>版本 {plugin.version} · {plugin.bundled ? "内置插件" : plugin.source === "local" ? "本地共创" : "目录导入"} · {plugin.enabled ? "已启用" : "已停用"}</p>
    <p>已批准权限：{plugin.approvedPermissions.join("、") || "无"}</p>
    {plugin.status && <p className="studio-notice">{displayProductText(plugin.status.text)}</p>}
    {plugin.brokenReason && <p className="studio-error" role="alert">插件异常：{displayProductText(plugin.brokenReason)}</p>}
    {plugin.catalogStatusReason && <p className="studio-notice">{displayProductText(plugin.catalogStatusReason)}</p>}
    {plugin.configErrors?.map((issue) => <p className="studio-error" key={issue.path}>{issue.path}：{displayProductText(issue.message)}</p>)}
    <div className="studio-actions">
      <button type="button" disabled={busy || plugin.catalogDisabled} onClick={() => { void run(() => api.setPluginEnabled(plugin.id, !plugin.enabled), plugin.enabled ? "插件已停用。" : "插件已启用。"); }}>{plugin.enabled ? "停用" : "启用"}</button>
      <button
        type="button"
        className="secondary"
        disabled={busy || Boolean(toolKind && !toolAvailable)}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {toolKind === "files" ? "配置文件助手" : toolKind === "computer" ? "配置电脑守护" : "配置与动作"}
      </button>
      <button
        type="button"
        className="secondary"
        disabled={busy}
        onClick={() => { void run(() => api.reloadPlugin(plugin.id), "插件已重新加载。"); }}
      >
        重新加载
      </button>
      {!plugin.bundled && (
        <button type="button" className="danger" disabled={busy} onClick={() => setConfirmRemove(true)}>
          卸载
        </button>
      )}
    </div>
    {toolKind && !toolAvailable && (
      <p className="studio-notice">启用并批准所需权限后，才能打开此工具。异常或停用时不会读取文件库与电脑状态。</p>
    )}
    {confirmRemove && <div className="studio-notice">
      <p>{toolKind ? "卸载将移除此插件及其插件数据；文件分类库、整理记录与电脑守护设置保留，重新安装后可继续使用。" : "卸载将移除此插件及其本地插件数据。"}</p>
      <div className="studio-actions">
        <button
          type="button"
          className="danger"
          disabled={busy}
          onClick={() => { void run(() => api.uninstallPlugin(plugin.id), "插件已卸载。"); }}
        >
          确认卸载
        </button>
        <button type="button" className="secondary" disabled={busy} onClick={() => setConfirmRemove(false)}>
          返回
        </button>
      </div>
    </div>}
    {expanded && <>
      {Object.keys(schema).length > 0 && <form onSubmit={(event) => { event.preventDefault(); void saveConfig(); }}>
        <fieldset className="studio-fields" disabled={busy}>
          {Object.entries(schema).map(([key, field]) => {
            const value = draft[key] ?? field.default;
            const label = displayProductText(field.label || key);
            let editor;
            if (field.type === "boolean") {
              editor = <input type="checkbox" checked={value === true} onChange={(event) => updateField(key, event.target.checked)} />;
            } else if (field.type === "number") {
              editor = <input type="number" min={field.min} max={field.max} step={field.step ?? "any"} value={typeof value === "number" ? value : ""} onChange={(event) => updateField(key, event.target.value === "" ? null : Number(event.target.value))} />;
            } else if (field.type === "select") {
              editor = <select value={typeof value === "string" ? value : ""} onChange={(event) => updateField(key, event.target.value)}>
                <option value="" disabled>请选择</option>
                {field.options?.map((option) => <option key={option.value} value={option.value}>{displayProductText(option.label)}</option>)}
              </select>;
            } else if (field.type === "multiSelect" || field.type === "list" || field.type === "sound") {
              const fallback = value ?? (field.type === "sound" ? null : []);
              editor = <>
                <textarea value={complexDraft[key] ?? JSON.stringify(fallback, null, 2)} rows={field.type === "list" ? 7 : 3} onChange={(event) => { setComplexDraft((previous) => ({ ...previous, [key]: event.target.value })); setDirty(true); }} />
                <small>按 JSON 编辑；保存前检查格式，保存时由宿主校验字段规则。空声音可填写 null，列表与多选使用数组。</small>
                {field.type === "sound" && api.pickPluginConfigSound && <button type="button" onClick={() => { void pickSound(key); }}>选择本地声音文件</button>}
                {field.type === "list" && field.itemSchema && <details><summary>查看每项允许的字段</summary><pre>{JSON.stringify(field.itemSchema, null, 2)}</pre></details>}
                {field.type === "multiSelect" && <small>可选值：{field.options?.map((option) => `${displayProductText(option.label)}（${option.value}）`).join("、")}</small>}
              </>;
            } else if (field.type === "textarea") {
              editor = <textarea value={typeof value === "string" ? value : ""} maxLength={field.maxLength} rows={3} onChange={(event) => updateField(key, event.target.value)} />;
            } else {
              editor = <input type={field.type === "secret" ? "password" : field.type === "time" || field.type === "date" ? field.type : "text"} value={typeof value === "string" ? value : ""} maxLength={field.maxLength} onChange={(event) => updateField(key, event.target.value)} />;
            }
            return <label key={key}>{label}{editor}{field.description && <small>{displayProductText(field.description)}</small>}</label>;
          })}
        </fieldset>
        <div className="studio-actions"><button type="submit" disabled={busy || !dirty}>保存此插件配置</button>{dirty && <span>有未保存的修改</span>}</div>
      </form>}
      {!Object.keys(schema).length && !toolKind && <p>此插件没有可配置的字段。</p>}
      {plugin.commands?.map((command) => <StudioPluginCommand key={command.id} command={command} disabled={busy || !plugin.enabled} run={(args) => run(() => api.executePluginCommand(plugin.id, command.id, args), "动作已执行。")} />)}
      {toolKind && toolAvailable && (
        <CompanionToolsView api={api.companion} ai={api.ai} mode={toolKind} />
      )}
    </>}
    {busy && <p className="studio-notice" role="status">正在处理…</p>}
    {error && <p className="studio-error" role="alert">{displayProductText(error)}</p>}
    {notice && <p className="studio-notice" role="status">{displayProductText(notice)}</p>}
  </article>;
}

function StudioPluginCommand({ command, disabled, run }: {
  readonly command: PluginCommand;
  readonly disabled: boolean;
  readonly run: (args?: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => Object.fromEntries(
    command.form?.fields.map((field) => [field.id, field.default ?? ""]) ?? [],
  ));
  return <form className="studio-panel" onSubmit={(event) => { event.preventDefault(); void run(command.form ? values : undefined); }}>
    <h4>{displayProductText(command.title)}</h4>
    {command.description && <p>{displayProductText(command.description)}</p>}
    <fieldset className="studio-fields" disabled={disabled}>
      {command.form?.fields.map((field) => {
        const value = values[field.id] ?? field.default;
        const update = (next: unknown) => setValues((previous) => ({ ...previous, [field.id]: next }));
        let editor;
        if (field.type === "boolean") {
          editor = <input type="checkbox" checked={value === true} onChange={(event) => update(event.target.checked)} />;
        } else if (field.type === "select" || field.type === "multiSelect") {
          const multiple = field.type === "multiSelect";
          const selected = multiple ? Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [] : typeof value === "string" ? value : "";
          editor = <select multiple={multiple} required={field.required} value={selected} onChange={(event) => update(multiple ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value)}>
            {!multiple && <option value="">请选择</option>}
            {field.options?.map((option) => <option value={option.value} key={option.value}>{displayProductText(option.label)}</option>)}
          </select>;
        } else if (field.type === "list") {
          editor = <><textarea rows={3} value={Array.isArray(value) ? value.join("\n") : ""} onChange={(event) => update(event.target.value.split("\n"))} /><small>每行填写一项。</small></>;
        } else if (field.type === "textarea") {
          editor = <textarea rows={3} required={field.required} maxLength={field.maxLength} value={typeof value === "string" ? value : ""} onChange={(event) => update(event.target.value)} />;
        } else {
          editor = <input type={field.type} required={field.required} min={field.min} max={field.max} step={field.type === "number" ? "any" : undefined} maxLength={field.maxLength} value={typeof value === "string" || typeof value === "number" ? value : ""} onChange={(event) => update(field.type === "number" && event.target.value !== "" ? Number(event.target.value) : event.target.value)} />;
        }
        return <label key={field.id}>{displayProductText(field.label)}{editor}</label>;
      })}
    </fieldset>
    <button type="submit" disabled={disabled}>{displayProductText(command.form?.submitLabel || command.title)}</button>
  </form>;
}

function parseComplexValue(value: unknown, field: PluginConfigField): PluginConfigValue {
  if (field.type === "multiSelect" && Array.isArray(value) && value.every((entry) => typeof entry === "string")) return value;
  if (field.type === "list" && Array.isArray(value) && value.every((entry) => entry !== null && typeof entry === "object" && !Array.isArray(entry))) return value as Array<Record<string, unknown>>;
  if (field.type === "sound") {
    if (value === null || typeof value === "string") return value;
    if (typeof value === "object" && value !== null && "kind" in value && value.kind === "user-sound" && "id" in value && typeof value.id === "string" && (!("name" in value) || typeof value.name === "string") && Object.keys(value).every((key) => ["kind", "id", "name"].includes(key))) {
      return { kind: "user-sound", id: value.id, ...("name" in value ? { name: value.name as string } : {}) };
    }
  }
  throw new Error(`${field.label || "复杂配置"} 的 JSON 类型不正确。`);
}

function failureMessage(failure: unknown): string {
  return failure instanceof Error ? failure.message : "插件操作失败，请重试。";
}
