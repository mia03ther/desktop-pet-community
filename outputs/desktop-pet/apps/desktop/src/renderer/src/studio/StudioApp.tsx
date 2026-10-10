import { useEffect, useRef, useState } from "react";
import brandLogo from "../../../../assets/brand-logo.png";
import { normalizeControlCenterRouteTarget, type ControlCenterRouteTarget } from "../../../control-center-route.js";
import { I18nProvider, type I18nSnapshot } from "../i18n.js";
import { PetImage, SpriteFrame, installedPetSpritesheetUrl } from "../components/PetSprite.js";
import { PetStudioView } from "./PetStudioView.js";
import { CommunityPortalView } from "./CommunityPortalView.js";
import { PersonaStudioView } from "./PersonaStudioView.js";
import { StudioAiView } from "./StudioAiView.js";
import { StudioPluginsView } from "./StudioPluginsView.js";
import { StudioSettingsView } from "./StudioSettingsView.js";
import { getStudioApi } from "./studio-api.js";
import type { StudioPet } from "./pet-studio-types.js";
import "./studio.css";

const api = getStudioApi();
const pages = [
  { route: "pets", group: "陪伴与创作", label: "我的桌宠", description: "管理已安装的桌面伙伴，预览动作，调整本机配置。", icon: "M8 12c-3-3-5-2-5 1v4c0 2 2 4 5 4h8c3 0 5-2 5-4v-4c0-3-2-4-5-1M8 12c1-2 7-2 8 0M6 6v2m5-5v3m5-3v3m5 0v2" },
  { route: "gallery", group: "陪伴与创作", label: "共创网站", description: "在网站浏览、下载和共创；在这里管理本机配置。", icon: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM3 16l5-5 4 4 3-3 6 6M8 7h.01" },
  { route: "persona", group: "陪伴与创作", label: "人设个性", description: "写一份全局 Markdown，或从人物资料中提炼性格。", icon: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h5" },
  { route: "assistant", group: "助手与工具", label: "宠物大脑", description: "接入 AI，查看桌宠对话与额度。", icon: "M5 4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9l-5 3v-3a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8 11h.01m4 0h.01m4 0h.01" },
  { route: "plugins", group: "助手与工具", label: "插件管理", description: "管理已安装插件与本机配置。", icon: "M9 3h6v4h3a3 3 0 0 1 0 6h-3v8H9v-4H6a3 3 0 0 1 0-6h3V3Z" },
  { route: "settings", group: "工作室", label: "设置", description: "", icon: "M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
] as const;
const navigationGroups = ["陪伴与创作", "助手与工具", "工作室"] as const;

function initialTarget(): ControlCenterRouteTarget {
  const query = new URLSearchParams(window.location.search);
  return normalizeControlCenterRouteTarget({ route: query.get("route"), assistantTab: query.get("assistantTab") });
}

export function StudioApp() {
  const [target, setTarget] = useState<ControlCenterRouteTarget>(initialTarget);
  const [i18n, setI18n] = useState<I18nSnapshot | null>(null);
  const [pet, setPet] = useState<StudioPet | null>(null);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(() => document.visibilityState !== "hidden");
  const petRead = useRef(0);
  const languageRead = useRef(0);
  const route = target.route === "dashboard"
    ? "pets"
    : target.route === "integrations"
      ? "assistant"
      : target.route === "computer"
        ? "plugins"
        : target.route;
  const page = pages.find((item) => item.route === route) ?? pages[0];
  async function refreshPet() {
    const request = ++petRead.current;
    try {
      const state = await api.getPetsState();
      if (request === petRead.current) {
        setPet(state.pets.installed.find((item) => item.id === state.preferences.defaultPetId) ?? null);
      }
    } catch (reason) {
      if (request === petRead.current) setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  async function refreshLanguage() {
    const request = ++languageRead.current;
    try {
      const next = await api.getI18n();
      if (request === languageRead.current) setI18n(next);
    } catch (reason) {
      if (request === languageRead.current) setError(reason instanceof Error ? reason.message : String(reason));
    }
  }
  useEffect(() => {
    void refreshPet();
    void refreshLanguage();
    const unsubscribe = api.onRouteChange(setTarget);
    return () => {
      petRead.current++;
      languageRead.current++;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const updateVisibility = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);
  function navigate(next: ControlCenterRouteTarget) {
    setError("");
    setTarget(next);
  }
  return (
    <I18nProvider snapshot={i18n} onReload={() => { void refreshLanguage(); }}>
      <div className="studio-shell">
        <header className="studio-topbar">
          <div className="studio-wordmark">
            <img className="studio-mark" src={brandLogo} alt="" aria-hidden="true" />
            <strong>desktop pet</strong>
          </div>
          <span className="studio-topbar-section">{page.group}</span>
          <span className="studio-topbar-caption">让桌面多一点生活</span>
        </header>
        <aside className="studio-sidebar">
          <nav className="studio-navigation" aria-label="工作室功能">
            {navigationGroups.map((group) => (
              <div className="studio-nav-group" key={group}>
                <p className="studio-nav-caption">{group}</p>
                {pages.filter((item) => item.group === group).map((item) => (
                  <button
                    key={item.route}
                    data-route={item.route}
                    className="studio-nav-item"
                    aria-current={route === item.route ? "page" : undefined}
                    onClick={() => navigate({ route: item.route })}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                    <span className="studio-nav-indicator" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="studio-companion">
            <div className="studio-pet-stage">
              {pet && (pet.builtIn
                ? <PetImage src={pet.thumbnail} alt={pet.displayName} debugLabel="工作室当前桌宠" />
                : <SpriteFrame src={installedPetSpritesheetUrl(pet.id)} label={pet.displayName} spriteLayout={pet.spriteLayout} size="mini" />)}
            </div>
            <div className="studio-companion-caption">
              <small>当前桌面伙伴</small>
              <strong>{pet?.displayName ?? "正在迎接桌宠"}</strong>
            </div>
          </div>
          <p className="studio-sidebar-note">偏好保存在本机</p>
        </aside>
        <main className="studio-workspace" aria-labelledby="studio-page-title">
          <header className="studio-page-heading">
            <div>
              <span className="studio-eyebrow">{page.group}</span>
              <h1 id="studio-page-title">{page.label}</h1>
              {page.description && <p>{page.description}</p>}
            </div>
            <span className="studio-local-badge">本机工作室</span>
          </header>
          {error && <p className="studio-error" role="alert">{error}</p>}
          {!i18n ? <p className="studio-panel" role="status">正在打开工作室…</p> : visible && <>
            {route === "pets" && (
              <PetStudioView api={api} onStateChanged={() => { void refreshPet(); }} />
            )}
            {route === "gallery" && <CommunityPortalView api={api} />}
            {route === "assistant" && (
              <StudioAiView api={api} initialTab={target.route === "integrations" ? "integrations" : target.route === "assistant" ? target.assistantTab ?? "workbench" : "workbench"} />
            )}
            {route === "persona" && (
              <PersonaStudioView api={api.ai} onOpenProviders={() => navigate({ route: "assistant", assistantTab: "providers" })} />
            )}
            {route === "plugins" && <StudioPluginsView api={api} />}
            {route === "settings" && <StudioSettingsView api={api} onChanged={() => { void refreshPet(); }} />}
          </>}
        </main>
      </div>
    </I18nProvider>
  );
}
