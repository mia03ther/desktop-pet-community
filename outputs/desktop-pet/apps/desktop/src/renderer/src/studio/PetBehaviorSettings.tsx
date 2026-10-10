import { useEffect, useRef, useState } from "react";
import type { PetBehaviorAction, PetBehaviorPreferences } from "../../../pet-behavior-config.js";
import type { ReactionAnimationOverrides, UserSelectableAnimationState } from "../../../reaction-animation-mapping.js";
import { MediaPetPreview, safePetImage } from "../components/PetSprite.js";
import { buildPetSpritePreviewModel } from "../pet-preview-state.js";
import type { PetAnimationSettingsSnapshot, PetStudioApi } from "./pet-studio-types.js";

function ActionPreview({ settings, action }: {
  readonly settings: PetAnimationSettingsSnapshot;
  readonly action: PetBehaviorAction;
}) {
  if (settings.sprite.media) return <MediaPetPreview metadata={settings.sprite.media} action={action.animation} label={`${action.name}动作预览`} size="mini" />;
  const source = safePetImage(settings.previewSpriteUrl);
  const state = settings.sprite.states[action.animation];
  const model = buildPetSpritePreviewModel(settings.sprite, state, action.animation === "idle");
  if (!source) return <span className="pet-action-preview">暂无法预览</span>;
  const width = 56;
  const height = 61;
  return (
    <svg className="pet-action-preview" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${action.name}动作预览`}>
      <image href={source} x={-(model.frameColumns[0] ?? 0) * width} y={-model.row * height} width={model.atlasColumns * width} height={model.atlasRows * height} preserveAspectRatio="none">
        {model.animated && (
          <animate attributeName="x" values={model.frameColumns.map((column) => -column * width).join(";")} dur={`${state.durationMs}ms`} repeatCount="indefinite" calcMode="discrete" />
        )}
      </image>
    </svg>
  );
}

export function PetBehaviorSettings({ api, petId }: {
  readonly api: PetStudioApi;
  readonly petId: string;
}) {
  const [settings, setSettings] = useState<PetAnimationSettingsSnapshot | null>(null);
  const [saved, setSaved] = useState<PetBehaviorPreferences | null>(null);
  const [draft, setDraft] = useState<PetBehaviorPreferences | null>(null);
  const [overrides, setOverrides] = useState<ReactionAnimationOverrides>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const generation = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const request = ++generation.current;
    setBusy(true);
    setSettings(null);
    setSaved(null);
    setDraft(null);
    setError("");
    setNotice("");
    void Promise.all([api.getSettingsState(), api.getReactionAnimationSettings()])
      .then(([state, animations]) => {
        if (!mounted.current || generation.current !== request) return;
        setSettings(animations);
        setSaved(state.preferences.petBehavior);
        setDraft(state.preferences.petBehavior);
        setOverrides(animations.overrides);
        setDirty(false);
      })
      .catch((failure: unknown) => {
        if (mounted.current && generation.current === request) {
          setError(failure instanceof Error ? failure.message : "动作配置读取失败。");
        }
      })
      .finally(() => {
        if (mounted.current && generation.current === request) setBusy(false);
      });
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, [api, petId]);

  async function setQuietMode(quietMode: boolean) {
    if (!saved || busy) return;
    const next = { ...saved, quietMode };
    const request = ++generation.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.updatePreferences({ petBehavior: next });
      if (!mounted.current || generation.current !== request) return;
      setSaved(next);
      setDraft((current) => current ? { ...current, quietMode } : next);
      setNotice(quietMode ? "安静模式已开启。" : "安静模式已关闭，空闲时可随机播放动作。");
    } catch (failure) {
      if (mounted.current && generation.current === request) {
        setError(failure instanceof Error ? failure.message : "安静模式保存失败。");
      }
    } finally {
      if (mounted.current && generation.current === request) setBusy(false);
    }
  }

  function editAction(id: string, patch: Partial<PetBehaviorAction>) {
    setDraft((current) => current ? {
      ...current,
      actions: current.actions.map((action) => action.id === id ? { ...action, ...patch } : action),
    } : current);
    setDirty(true);
    setNotice("");
  }

  function addAction() {
    if (!draft || draft.actions.length >= 24) return;
    const action: PetBehaviorAction = {
      id: `custom-${crypto.randomUUID()}`,
      name: "新动作",
      animation: "waving",
      random: true,
    };
    setDraft({ ...draft, actions: [...draft.actions, action] });
    setDirty(true);
    setNotice("");
  }

  async function saveActions() {
    if (!draft || busy) return;
    const next: PetBehaviorPreferences = {
      ...draft,
      actions: draft.actions.map((action) => ({ ...action, name: action.name.trim() })),
    };
    const request = ++generation.current;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.updatePreferences({ petBehavior: next, reactionAnimationOverrides: overrides });
      const animations = await api.getReactionAnimationSettings();
      if (!mounted.current || generation.current !== request) return;
      setSettings(animations);
      setSaved(next);
      setDraft(next);
      setOverrides(animations.overrides);
      setDirty(false);
      setNotice("动作名称、随机候选与 AI 状态映射已保存。");
    } catch (failure) {
      if (mounted.current && generation.current === request) {
        setError(failure instanceof Error ? failure.message : "动作配置保存失败。");
      }
    } finally {
      if (mounted.current && generation.current === request) setBusy(false);
    }
  }

  return (
    <section className="studio-panel pet-behavior-settings" aria-labelledby="pet-behavior-title" aria-busy={busy}>
      <div className="pet-behavior-heading">
        <div>
          <h2 id="pet-behavior-title">陪伴方式与动作</h2>
          <p>默认安静待机。点击桌宠可随机播放动作；有 AI 工作状态时，按对应动作联动。</p>
        </div>
        <label className="pet-quiet-toggle">
          <input type="checkbox" checked={saved?.quietMode ?? true} disabled={!saved || busy} onChange={(event) => { void setQuietMode(event.target.checked); }} />
          <span><strong>安静模式</strong><small>{saved?.quietMode === false ? "空闲时自动随机播放" : "空闲时保持待机"}</small></span>
        </label>
      </div>
      {error && <p className="studio-error" role="alert">{error}</p>}
      {notice && <p className="studio-notice" role="status">{notice}</p>}
      {!settings || !draft ? <p role="status">正在读取当前图集与动作配置…</p> : (
        <details className="pet-action-details">
          <summary>自定义动作与 AI 联动{dirty ? " · 有未保存修改" : ""}</summary>
          <form onSubmit={(event) => { event.preventDefault(); void saveActions(); }}>
            <fieldset disabled={busy}>
              <div className="pet-action-section-heading">
                <h3>动作库</h3>
                <button type="button" className="secondary" disabled={draft.actions.length >= 24} onClick={addAction}>添加动作类型</button>
              </div>
              <p>为动作起名字，并选择当前图集已有的动画。预览使用当前桌宠的 V{settings.sprite.version} 图集。</p>
              <div className="pet-action-list">
                {draft.actions.map((action) => (
                  <div className="pet-action-row" key={action.id} data-action-id={action.id}>
                    <ActionPreview settings={settings} action={action} />
                    <label>动作名称<input value={action.name} required maxLength={32} onChange={(event) => editAction(action.id, { name: event.target.value })} /></label>
                    <label>图集动画<select value={action.animation} onChange={(event) => editAction(action.id, { animation: event.target.value as UserSelectableAnimationState })}>
                      {settings.animations.map((animation) => <option key={animation.id} value={animation.id}>{animation.label}</option>)}
                    </select></label>
                    <label className="pet-action-random"><input type="checkbox" checked={action.random} onChange={(event) => editAction(action.id, { random: event.target.checked })} />参与随机</label>
                    <button type="button" className="secondary" aria-label={`移除动作${action.name || "未命名"}`} onClick={() => {
                      setDraft({ ...draft, actions: draft.actions.filter((entry) => entry.id !== action.id) });
                      setDirty(true);
                      setNotice("");
                    }}>移除</button>
                  </div>
                ))}
              </div>
              <p className="pet-action-help">勾选的动作参与单击与空闲随机播放。最多 24 个动作类型；没有随机候选时保持待机。动作名称与设置应用于桌宠，切换素材后继续使用。</p>
              <h3>AI 状态对应动作</h3>
              <p>联动来自已接入 AI 的实际工作事件。保存 API 配置不会让未连接的 AI 自动产生状态。</p>
              <div className="pet-reaction-grid">
                {settings.reactions.map((reaction) => (
                  <label key={reaction.id} title={reaction.description}>{reaction.label}
                    <select value={overrides[reaction.id] ?? reaction.defaultAnimation} onChange={(event) => {
                      const value = event.target.value as UserSelectableAnimationState;
                      const next = { ...overrides };
                      if (value === reaction.defaultAnimation) delete next[reaction.id];
                      else next[reaction.id] = value;
                      setOverrides(next);
                      setDirty(true);
                      setNotice("");
                    }}>
                      {settings.animations.map((animation) => {
                        const names = [...new Set(draft.actions.filter((action) => action.animation === animation.id && action.name.trim() && action.name.trim() !== animation.label).map((action) => action.name.trim()))];
                        return <option key={animation.id} value={animation.id}>{animation.label}{names.length ? ` · ${names.join("、")}` : ""}</option>;
                      })}
                    </select>
                  </label>
                ))}
              </div>
              <div className="studio-actions">
                <button type="submit" disabled={!dirty}>保存动作配置</button>
                {dirty && <span>修改将在保存后生效</span>}
              </div>
            </fieldset>
          </form>
        </details>
      )}
    </section>
  );
}
