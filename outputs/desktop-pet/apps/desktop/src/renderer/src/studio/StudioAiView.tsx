import { useEffect, useState } from "react";
import { CompanionAiView } from "../companion/CompanionAiView.js";
import { IntegrationsView } from "../integrations/IntegrationsView.js";
import { ProvidersSection } from "../settings/providers/ProvidersSection.js";
import type { ProviderControlCenterSnapshot } from "../settings/providers/types.js";
import type { StudioApi } from "./studio-api.js";
import { defaultPetChatAppearance, type PetChatAppearancePreferences } from "../../../pet-chat-appearance.js";

export function StudioAiView({ api, initialTab }: {
  api: StudioApi; initialTab: "workbench" | "providers" | "integrations";
}) {
  const [tab, setTab] = useState(initialTab);
  const [snapshot, setSnapshot] = useState<ProviderControlCenterSnapshot | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [chatAppearance, setChatAppearance] = useState<PetChatAppearancePreferences>(defaultPetChatAppearance);
  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => {
    let cancelled = false;
    void api.getProviderProfiles().then((next) => { if (!cancelled) setSnapshot(next); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason)); });
    void api.getSettingsState().then((next) => {
      if (!cancelled) setChatAppearance(next.preferences.petChatAppearance ?? defaultPetChatAppearance);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { cancelled = true; };
  }, [api, tab]);
  async function run(label: string, action: () => Promise<void>) {
    setBusy(label); setError(""); setMessage("");
    try { await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : String(reason)); }
    finally { setBusy(""); }
  }
  return <section className="studio-section">
    <nav className="studio-tabs" aria-label="AI 功能">
      {([{ id: "workbench", label: "对话与监测" }, { id: "providers", label: "对话 AI 来源" }, { id: "integrations", label: "外部 AI 接入" }] as const).map((item) => <button key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => setTab(item.id)}>{item.label}</button>)}
    </nav>
    {error && <p className="studio-error" role="alert">{error}</p>}
    {message && <p className="studio-notice" role="status">{message}</p>}
    {tab === "workbench" && (
      <CompanionAiView
        api={api.ai}
        chatAppearance={chatAppearance}
        onOpenProviders={() => setTab("providers")}
        onOpenIntegrations={() => setTab("integrations")}
      />
    )}
    {tab === "providers" && <ProvidersSection snapshot={snapshot} onSnapshotChange={setSnapshot} busy={busy} run={run} setMessage={setMessage} setError={setError} api={api} />}
    {tab === "integrations" && <IntegrationsView api={api} />}
  </section>;
}
