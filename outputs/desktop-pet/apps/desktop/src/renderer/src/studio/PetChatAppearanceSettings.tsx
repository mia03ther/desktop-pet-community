import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  defaultPetChatAppearance,
  normalizePetChatAppearance,
  petChatBackground,
  petChatAccentTextColor,
  petChatFontFamily,
  validatePetChatAppearance,
  type PetChatAppearancePreferences,
  type PetChatSurfaceStyle,
} from "../../../pet-chat-appearance.js";
import type { StudioApi } from "./studio-api.js";
import "./PetChatAppearanceSettings.css";

const fontCandidates = [
  { name: "Microsoft YaHei", label: "微软雅黑" },
  { name: "DengXian", label: "等线" },
  { name: "SimSun", label: "宋体" },
  { name: "SimHei", label: "黑体" },
  { name: "KaiTi", label: "楷体" },
  { name: "FangSong", label: "仿宋" },
  { name: "Segoe UI", label: "Segoe UI" },
  { name: "Consolas", label: "Consolas" },
];

function availableFontCandidates() {
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return [];
  const sample = "mmmmWWii 桌宠你好世界";
  const fallbacks = ["monospace", "serif"];
  return fontCandidates.filter(({ name }) => fallbacks.some((fallback) => {
    context.font = `72px ${fallback}`;
    const fallbackWidth = context.measureText(sample).width;
    context.font = `72px ${JSON.stringify(name)}, ${fallback}`;
    return Math.abs(context.measureText(sample).width - fallbackWidth) > 0.1;
  }));
}

const presets = [
  { id: "original", name: "原样式", value: defaultPetChatAppearance },
  {
    id: "cream",
    name: "奶油",
    value: {
      ...defaultPetChatAppearance,
      enabled: true,
      accentColor: "#a8783b",
      input: { ...defaultPetChatAppearance.input, background: "#fffaf0", textColor: "#4a3a2b", borderColor: "#ddc9a8", radius: 16 },
      answer: { ...defaultPetChatAppearance.answer, background: "#fff2d9", textColor: "#4a3a2b", borderColor: "#ddc9a8", radius: 18 },
    },
  },
  {
    id: "forest",
    name: "森林",
    value: {
      ...defaultPetChatAppearance,
      enabled: true,
      accentColor: "#35715c",
      input: { ...defaultPetChatAppearance.input, background: "#f2faf5", textColor: "#234838", borderColor: "#9ac6b0", radius: 12 },
      answer: { ...defaultPetChatAppearance.answer, background: "#e3f2e9", textColor: "#234838", borderColor: "#9ac6b0", radius: 16 },
    },
  },
  {
    id: "night",
    name: "夜色",
    value: {
      ...defaultPetChatAppearance,
      enabled: true,
      accentColor: "#9fc7ff",
      input: { ...defaultPetChatAppearance.input, background: "#242b3b", textColor: "#eef2ff", borderColor: "#58647f", radius: 10 },
      answer: { ...defaultPetChatAppearance.answer, background: "#313b50", textColor: "#eef2ff", borderColor: "#58647f", radius: 14 },
    },
  },
] satisfies readonly { id: string; name: string; value: PetChatAppearancePreferences }[];

function ColorField({ label, value, onChange }: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="pet-chat-color-field">
      <span>{label}</span>
      <span className="pet-chat-color-control">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <span>{value}</span>
      </span>
    </label>
  );
}

function SurfaceControls({ title, value, onChange }: {
  readonly title: string;
  readonly value: PetChatSurfaceStyle;
  readonly onChange: (value: PetChatSurfaceStyle) => void;
}) {
  return (
    <div className="pet-chat-surface-controls">
      <h3>{title}</h3>
      <div className="pet-chat-control-grid">
        <ColorField label={`${title}背景`} value={value.background} onChange={(background) => onChange({ ...value, background })} />
        <ColorField label={`${title}文字`} value={value.textColor} onChange={(textColor) => onChange({ ...value, textColor })} />
        <ColorField label={`${title}边框颜色`} value={value.borderColor} onChange={(borderColor) => onChange({ ...value, borderColor })} />
        <label>{title}边框宽度
          <select value={value.borderWidth} onChange={(event) => onChange({ ...value, borderWidth: Number(event.target.value) })}>
            {[0, 1, 2, 3].map((width) => <option key={width} value={width}>{width === 0 ? "无边框" : `${width} px`}</option>)}
          </select>
        </label>
        <label>{title}圆角 <output>{value.radius} px</output>
          <input type="range" min={0} max={24} step={1} value={value.radius} onChange={(event) => onChange({ ...value, radius: Number(event.target.value) })} />
        </label>
        <label>{title}背景不透明度 <output>{value.opacity}%</output>
          <input type="range" min={40} max={100} step={1} value={value.opacity} onChange={(event) => onChange({ ...value, opacity: Number(event.target.value) })} />
        </label>
      </div>
      <label className="pet-chat-shadow-toggle">
        <input type="checkbox" checked={value.shadow} onChange={(event) => onChange({ ...value, shadow: event.target.checked })} />
        {title}阴影
      </label>
    </div>
  );
}

function previewSurfaceStyle(appearance: PetChatAppearancePreferences, surface: PetChatSurfaceStyle): CSSProperties {
  return {
    background: petChatBackground(surface),
    color: surface.textColor,
    border: `${surface.borderWidth}px solid ${surface.borderColor}`,
    borderRadius: surface.radius,
    boxShadow: surface.shadow ? "0 6px 16px rgba(15, 23, 42, 0.16)" : "none",
    fontFamily: petChatFontFamily(appearance.fontFamily),
    fontSize: appearance.fontSize,
    fontWeight: appearance.fontWeight,
    lineHeight: 1.6,
  };
}

export function PetChatAppearanceSettings({ api, initialValue, onSaved }: {
  readonly api: StudioApi;
  readonly initialValue: PetChatAppearancePreferences | undefined;
  readonly onSaved: (value: PetChatAppearancePreferences) => void;
}) {
  const [saved, setSaved] = useState(() => normalizePetChatAppearance(initialValue));
  const [draft, setDraft] = useState(saved);
  const [fonts] = useState(availableFontCandidates);
  const [customFont, setCustomFont] = useState(() => saved.fontFamily !== "system" && !fonts.some((font) => font.name === saved.fontFamily));
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const selectedPreset = presets.find((preset) => JSON.stringify(preset.value) === JSON.stringify(draft))?.id;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function edit(patch: Partial<PetChatAppearancePreferences>) {
    setDraft((current) => ({ ...current, ...patch }));
    setNotice("");
    setError("");
  }

  function usePreset(value: PetChatAppearancePreferences) {
    const next = normalizePetChatAppearance(value);
    setDraft(next);
    setCustomFont(next.fontFamily !== "system" && !fonts.some((font) => font.name === next.fontFamily));
    setError("");
    setNotice("");
  }

  async function save(value: PetChatAppearancePreferences, restoring = false) {
    if (busy) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const validated = validatePetChatAppearance({ ...value, fontFamily: value.fontFamily.trim() });
      await api.updatePreferences({ petChatAppearance: validated });
      if (!mounted.current) return;
      setSaved(validated);
      setDraft(validated);
      setCustomFont(validated.fontFamily !== "system" && !fonts.some((font) => font.name === validated.fontFamily));
      setNotice(restoring ? "已恢复桌宠原样式。" : validated.enabled ? "已保存，桌宠对话样式已生效。" : "已保存，桌宠继续使用原样式。");
      onSaved(validated);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : "样式保存失败，请重试。");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <section className="studio-panel pet-chat-appearance" aria-labelledby="pet-chat-appearance-title" aria-busy={busy}>
      <div className="pet-chat-appearance-heading">
        <div>
          <h2 id="pet-chat-appearance-title">桌宠对话样式</h2>
          <p>设置桌宠的字体、输入框和回答框。修改先预览，保存后生效。</p>
        </div>
        <span className="pet-chat-draft-status">{dirty ? "有未保存修改" : saved.enabled ? "自定义样式已启用" : "正在使用原样式"}</span>
      </div>
      {error && <p className="studio-error" role="alert">{error}</p>}
      {notice && <p className="studio-notice" role="status">{notice}</p>}
      <form onSubmit={(event) => { event.preventDefault(); void save(draft); }}>
        <fieldset disabled={busy} className="pet-chat-appearance-form">
          <label className="studio-toggle">
            <span>启用自定义样式</span>
            <input type="checkbox" checked={draft.enabled} onChange={(event) => edit({ enabled: event.target.checked })} />
          </label>
          <div className="pet-chat-preset-row" role="group" aria-label="选择样式预设">
            {presets.map((preset) => (
              <button type="button" className="secondary" key={preset.id} aria-pressed={selectedPreset === preset.id} onClick={() => usePreset(preset.value)}>
                <span className="pet-chat-preset-dot" style={{ background: preset.value.answer.background, borderColor: preset.value.answer.borderColor }} aria-hidden="true" />
                {preset.name}
              </button>
            ))}
            <span>选择预设仅更新预览</span>
          </div>
          <div className="pet-chat-overview">
            <div className="pet-chat-font-controls">
              <h3>字体</h3>
              <label>字体选择
                <select value={customFont ? "custom" : draft.fontFamily} onChange={(event) => {
                  const value = event.target.value;
                  setCustomFont(value === "custom");
                  edit({ fontFamily: value === "custom" ? "" : value });
                }}>
                  <option value="system">系统默认</option>
                  {fonts.map((font) => <option value={font.name} key={font.name}>{font.label}</option>)}
                  <option value="custom">自定义字体名称</option>
                </select>
              </label>
              {customFont && <label>本机字体名称
                <input value={draft.fontFamily} maxLength={80} required placeholder="例如 Microsoft YaHei" onChange={(event) => edit({ fontFamily: event.target.value })} />
              </label>}
              <small>支持已安装的字体；未安装的字体使用系统默认。</small>
              <div className="pet-chat-control-grid">
                <label>字号 <output>{draft.fontSize} px</output>
                  <input type="range" min={10} max={20} step={1} value={draft.fontSize} onChange={(event) => edit({ fontSize: Number(event.target.value) })} />
                </label>
                <label>字重
                  <select value={draft.fontWeight} onChange={(event) => edit({ fontWeight: Number(event.target.value) as PetChatAppearancePreferences["fontWeight"] })}>
                    <option value={400}>常规</option>
                    <option value={500}>中等</option>
                    <option value={600}>稍粗</option>
                    <option value={700}>粗体</option>
                  </select>
                </label>
              </div>
              <ColorField label="强调色" value={draft.accentColor} onChange={(accentColor) => edit({ accentColor })} />
            </div>
            <div className="pet-chat-preview" aria-label="桌宠对话样式预览">
              <div className="pet-chat-preview-heading"><strong>样式预览</strong><span>{draft.enabled ? "保存后应用" : "启用并保存后应用"}</span></div>
              <div className="pet-chat-preview-stage">
                <div className="pet-chat-preview-answer" style={previewSurfaceStyle(draft, draft.answer)}>
                  <strong style={{ color: draft.accentColor }}>桌宠</strong>
                  <p>我在这里陪你。今天想一起做些什么？</p>
                </div>
                <label className="pet-chat-preview-input" style={previewSurfaceStyle(draft, draft.input)}>
                  <span>输入框</span>
                  <textarea readOnly aria-label="输入框样式预览" value="你好，陪我聊一会儿吧。" style={{ color: draft.input.textColor }} />
                  <span className="pet-chat-preview-send" style={{ background: draft.accentColor, color: petChatAccentTextColor(draft.accentColor) }} aria-hidden="true">发送 ↗</span>
                </label>
              </div>
            </div>
          </div>
          <div className="pet-chat-surface-grid">
            <SurfaceControls title="输入框" value={draft.input} onChange={(input) => edit({ input })} />
            <SurfaceControls title="回答框" value={draft.answer} onChange={(answer) => edit({ answer })} />
          </div>
          <div className="studio-actions pet-chat-appearance-actions">
            <button type="submit" disabled={!dirty}>{busy ? "正在保存…" : "保存对话样式"}</button>
            <button type="button" className="secondary" disabled={!dirty} onClick={() => usePreset(saved)}>取消修改</button>
            <button type="button" className="secondary" onClick={() => { void save(defaultPetChatAppearance, true); }}>恢复原样式</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
