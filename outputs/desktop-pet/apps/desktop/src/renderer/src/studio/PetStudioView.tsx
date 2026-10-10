import { useEffect, useMemo, useRef, useState } from "react";
import bundledSpritesheetUrl from "../../../../assets/default-pet-spritesheet.webp";
import { MediaPetPreview, SpriteFrame, installedPetSpritesheetUrl } from "../components/PetSprite.js";
import { buildPetSpritePreviewModel, catalogV2SpriteLayout } from "../pet-preview-state.js";
import type { PetStudioApi, StudioPet, StudioPetsSnapshot } from "./pet-studio-types.js";
import { PetBehaviorSettings } from "./PetBehaviorSettings.js";
import { OriginalProjectsPanel } from "./OriginalProjectsPanel.js";

interface ViewPet extends StudioPet {
  readonly key: string;
  readonly sourceKind: "installed";
}

const previewActions = [
  { state: "idle", label: "待机", row: 0, frames: 6, duration: "1.65s" },
  { state: "thinking", label: "思考", row: 8, frames: 6, duration: "1.55s" },
  { state: "happy", label: "开心", row: 4, frames: 5, duration: "1.35s" },
  { state: "wave", label: "挥手", row: 3, frames: 4, duration: "1.25s" },
] as const;

function PetPreview({ pet, action, compact = false }: {
  pet: StudioPet;
  action: typeof previewActions[number];
  compact?: boolean;
}) {
  const label = `${pet.displayName} · ${action.label}`;
  if (!pet.builtIn) {
    return <SpriteFrame src={pet.spritesheet} label={label} spriteLayout={pet.spriteLayout} state={action.state} size={compact ? "mini" : "detail"} />;
  }
  // 内置图片由打包资源导入，不能用当前默认宠物的动态图片替代。
  const width = compact ? 56 : 144;
  const height = compact ? 61 : 156;
  const model = buildPetSpritePreviewModel(catalogV2SpriteLayout, action, action.state === "idle");
  return (
    <svg className={`sprite-frame sprite-${action.state}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <image href={bundledSpritesheetUrl} x={-(model.frameColumns[0] ?? 0) * width} y={-model.row * height} width={model.atlasColumns * width} height={model.atlasRows * height} preserveAspectRatio="none">
        {model.animated && <animate attributeName="x" values={model.frameColumns.map((column) => -column * width).join(";")} dur={action.duration} repeatCount="indefinite" calcMode="discrete" />}
      </image>
    </svg>
  );
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function PetStudioView({ api, onStateChanged }: {
  api: PetStudioApi;
  onStateChanged(): void;
}) {
  const [snapshot, setSnapshot] = useState<StudioPetsSnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(false);
  const readGeneration = useRef(0);
  const operationGeneration = useRef(0);
  const detailRef = useRef<HTMLElement | null>(null);

  async function refreshData(): Promise<StudioPetsSnapshot> {
    const generation = ++readGeneration.current;
    const state = await api.getPetsState();
    if (!mounted.current || readGeneration.current !== generation) return state;
    setSnapshot(state);
    console.info(`[PetStudio] loaded installed=${state.pets.installed.length}`);
    return state;
  }

  useEffect(() => {
    mounted.current = true;
    setBusy("");
    setError("");
    const generation = operationGeneration.current;
    void refreshData().catch((failure: unknown) => {
      if (mounted.current && operationGeneration.current === generation) setError(errorText(failure));
    });
    return () => {
      mounted.current = false;
      readGeneration.current += 1;
      operationGeneration.current += 1;
    };
  }, [api]);

  const pets = useMemo<ViewPet[]>(() => {
    const installed = (snapshot?.pets.installed ?? []).filter((pet) => pet.source?.kind !== "team");
    return installed.map<ViewPet>((pet) => ({
      ...pet,
      key: `installed:${pet.id}`,
      sourceKind: "installed",
      installed: true,
      spritesheet: pet.builtIn ? undefined : installedPetSpritesheetUrl(pet.id),
      spriteLayout: pet.builtIn ? catalogV2SpriteLayout : pet.spriteLayout,
    }));
  }, [snapshot]);

  const filtered = pets.filter((pet) => {
    const preset = pet.builtIn || pet.source?.kind === "catalog";
    if (sourceFilter === "preset" && !preset) return false;
    if (sourceFilter === "local" && preset) return false;
    const text = [pet.displayName, pet.id, pet.description, pet.searchText, pet.category, ...(pet.tags ?? [])].join(" ").toLocaleLowerCase();
    return text.includes(query.trim().toLocaleLowerCase());
  });
  const selected = pets.find((pet) => pet.key === selectedKey) ?? null;
  const defaultId = snapshot?.preferences.defaultPetId;

  useEffect(() => {
    if (selected) detailRef.current?.focus();
  }, [selectedKey]);

  async function runAction(label: string, task: () => Promise<unknown>, success: string): Promise<void> {
    if (busy) return;
    const generation = ++operationGeneration.current;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await task();
      if (!mounted.current || operationGeneration.current !== generation) return;
      await refreshData();
      if (!mounted.current || operationGeneration.current !== generation) return;
      setNotice(success);
      onStateChanged();
    } catch (failure) {
      if (mounted.current && operationGeneration.current === generation) setError(errorText(failure));
    } finally {
      if (mounted.current && operationGeneration.current === generation) setBusy("");
    }
  }

  return (
    <section className="studio-section" aria-label="我的桌宠">
      <div className="studio-panel">
        <div className="studio-actions">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => void runAction("正在显示桌宠", () => api.showDefaultPet(), "桌宠已显示。")}
          >
            显示桌宠
          </button>
          <button
            type="button"
            className="secondary"
            disabled={Boolean(busy)}
            onClick={() => void runAction("正在刷新", () => Promise.resolve(), "列表已刷新。")}
          >
            刷新
          </button>
        </div>
        <div className="studio-fields pet-library-filters">
          <label>搜索名称或标签
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索我的桌宠" />
          </label>
          <label>安装方式
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="all">全部桌宠</option>
              <option value="preset">预置素材</option>
              <option value="local">本机导入素材</option>
            </select>
          </label>
        </div>
      </div>
      {busy && <p className="studio-notice" role="status">{busy}…</p>}
      {notice && <p className="studio-notice" role="status">{notice}</p>}
      {error && <p className="studio-error" role="alert">{error}</p>}
      <OriginalProjectsPanel api={api} kind="pet" onChanged={async () => { await refreshData(); onStateChanged(); }} />
      {defaultId && <PetBehaviorSettings api={api} petId={defaultId} />}
      <div className="pet-gallery">
        {filtered.map((pet) => (
          <article className="pet-card" data-current={pet.id === defaultId && pet.installed} key={pet.key}>
            <div className="pet-card-preview">
              <PetPreview pet={pet} action={previewActions[0]} compact />
            </div>
            <h3>{pet.displayName}</h3>
            <p>{pet.description || "内置陪伴外观"}</p>
            <p>{pet.spriteLayout?.media ? "独立视频 / WebP 动作" : `${pet.spriteLayout?.version === 2 || pet.spriteVersionNumber === 2 ? "V2" : "V1"} 动画`}</p>
            <span className="pet-card-status">{pet.id === defaultId ? "当前桌宠" : "已安装"}</span>
            <button
              type="button"
              className="secondary"
              disabled={Boolean(busy)}
              aria-label={`查看 ${pet.displayName} 动作`}
              aria-expanded={selectedKey === pet.key}
              onClick={() => { setSelectedKey(pet.key); }}
            >
              查看动作
            </button>
          </article>
        ))}
      </div>
      {!filtered.length && <p className="studio-notice">{snapshot ? "没有符合搜索条件的素材。" : "正在读取本机桌宠…"}</p>}
      {selected && <section className="studio-panel" ref={detailRef} tabIndex={-1} aria-label={`${selected.displayName} 详情`}>
        <div className="studio-actions">
          <h2>{selected.displayName}</h2>
          <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => setSelectedKey("")}>收起详情</button>
        </div>
        <p>{selected.description}</p>
        <div className="pet-gallery" aria-label="桌宠动作预览">
          {selected.spriteLayout?.media ? Object.keys(selected.spriteLayout.media.actions).map((action) => {
            const media = selected.spriteLayout!.media!;
            const definition = media.actionDefinitions?.[action];
            const label = definition?.displayName ?? action;
            return <figure key={action} className="pet-card">
              <div className="pet-card-preview"><MediaPetPreview metadata={media} action={action} label={`${selected.displayName} · ${label}`} /></div>
              <figcaption>{label}{definition?.category ? ` · ${definition.category}` : ""}</figcaption>
            </figure>;
          }) : previewActions.map((action) => <figure key={action.state} className="pet-card">
            <div className="pet-card-preview">
              <PetPreview pet={selected} action={action} />
            </div>
            <figcaption>{action.label}</figcaption>
          </figure>)}
        </div>
        {selected.broken && <p className="studio-error">{selected.brokenReason || "素材不可用，请重新导入有效包。"}</p>}
        <div className="studio-actions">
          {selected.installed && !selected.broken && selected.id !== defaultId && <button type="button" disabled={Boolean(busy)} onClick={() => void runAction("正在切换桌宠", () => api.setDefaultPet(selected.id), "当前桌宠已切换。")}>设为当前桌宠</button>}
          {selected.installed && !selected.builtIn && !selected.protected && (
            <button
              type="button"
              className="danger"
              disabled={Boolean(busy)}
              onClick={() => void runAction("正在移除桌宠", () => api.removePet(selected.id), "所选桌宠已移除。")}
            >
              移除这个桌宠
            </button>
          )}
        </div>
      </section>}
    </section>
  );
}
