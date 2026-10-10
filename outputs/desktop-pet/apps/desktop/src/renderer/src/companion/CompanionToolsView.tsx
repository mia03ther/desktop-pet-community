import { useEffect, useState } from "react";
import type { CompanionToolPluginKind } from "../../../companion-tool-plugins.js";
import type { CompanionAiApi } from "../../../companion-ai-types.js";
import type { CompanionToolsApi, CompanionToolsSnapshot } from "../../../companion-tools-types.js";
import { CompanionDiagnosticsView } from "./CompanionDiagnosticsView.js";
import { CompanionFilesView } from "./CompanionFilesView.js";
import { CompanionSoftwareView } from "./CompanionSoftwareView.js";
import { CompanionAnalysisControls } from "./CompanionAnalysisControls.js";

export function CompanionToolsView({ api, ai, mode }: {
  readonly api: CompanionToolsApi;
  readonly ai: CompanionAiApi;
  readonly mode: CompanionToolPluginKind;
}) {
  if (mode === "files") {
    return <CompanionFilesView api={api} />;
  }
  return <CompanionComputerToolsView api={api} ai={ai} />;
}

function CompanionComputerToolsView({ api, ai }: { readonly api: CompanionToolsApi; readonly ai: CompanionAiApi }) {
  const [tab, setTab] = useState<"diagnostics" | "software">("diagnostics");
  const [snapshot, setSnapshot] = useState<CompanionToolsSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const result = await api.getSnapshot();
        if (active) {
          setSnapshot(result);
          setError("");
        }
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "电脑守护设置读取失败。");
        }
      }
      if (active) {
        timer = setTimeout(() => { void load(); }, 5000);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api]);

  return (
    <section className="companion-tools" style={{ display: "grid", gap: 18 }}>
      <nav className="studio-tool-tabs" aria-label="电脑守护插件配置">
        <button
          type="button"
          className={`btn ${tab === "diagnostics" ? "btn-primary" : "btn-secondary"}`}
          aria-current={tab === "diagnostics" ? "page" : undefined}
          onClick={() => setTab("diagnostics")}
        >
          电脑体检
        </button>
        <button
          type="button"
          className={`btn ${tab === "software" ? "btn-primary" : "btn-secondary"}`}
          aria-current={tab === "software" ? "page" : undefined}
          onClick={() => setTab("software")}
        >
          软件提醒
        </button>
        <span className="studio-tools-hint">先看清证据，再决定处理</span>
      </nav>
      {error && <div className="error" role="alert">{error}</div>}
      {!snapshot ? <p>正在读取电脑守护设置…</p> : tab === "diagnostics" ? (
        <CompanionDiagnosticsView api={api} snapshot={snapshot} onSnapshot={setSnapshot} />
      ) : (
        <CompanionSoftwareView api={api} snapshot={snapshot} onSnapshot={setSnapshot} />
      )}
      {snapshot && <CompanionAnalysisControls api={ai} />}
    </section>
  );
}
