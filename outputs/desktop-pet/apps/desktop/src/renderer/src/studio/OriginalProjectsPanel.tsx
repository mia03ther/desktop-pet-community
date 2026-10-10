import { useEffect, useRef, useState } from "react";
import type {
  OriginalProject,
  OriginalProjectCompatibilityReport,
  OriginalProjectKind,
  OriginalProjectOperation,
  OriginalProjectSelection,
  OriginalProjectsApi,
} from "../../../original-project-types.js";

const statusLabels = {
  native: "本系统兼容",
  partial: "部分兼容",
  external: "原宿主格式",
  invalid: "无法直接兼容",
} as const;

function formatLabel(format: string): string {
  if (format.startsWith("desktop-pet-sdk-v")) return `desktop pet 插件 SDK ${format.slice("desktop-pet-sdk-v".length)}`;
  const labels: Readonly<Record<string, string>> = {
    "desktop-pet-media": "desktop pet 独立动作包",
    "codex-pet": "Codex / desktop pet 图集包",
    "pet-manifest": "桌宠清单包",
    "plugin-manifest": "插件清单包",
    shimeji: "Shimeji 原项目",
    vpet: "VPet 原项目",
    raycast: "Raycast 插件项目",
    airi: "AIRI 工程",
    unknown: "未识别格式",
  };
  return labels[format] ?? format;
}

function operationLabels(kind: OriginalProjectKind): readonly [OriginalProjectOperation, string][] {
  return kind === "pet"
    ? [["activatePet", "设为当前桌宠"], ["customActions", "动作管理"], ["aiLink", "AI 状态联动"]]
    : [["pluginSettings", "本机启用与配置"], ["aiLink", "桌宠 AI 联动"]];
}

function CompatibilityReport({ report, kind }: {
  readonly report: OriginalProjectCompatibilityReport;
  readonly kind: OriginalProjectKind;
}) {
  return <div className="project-compatibility-report">
    <p className="project-format"><strong>{formatLabel(report.format)}</strong><span className="project-status" data-status={report.status}>{statusLabels[report.status]}</span></p>
    <p>{report.summary}</p>
    <p className="project-environment">使用环境：{report.originalEnvironment}</p>
    <dl className="project-capabilities">
      {operationLabels(kind).map(([operation, label]) => <div key={operation}>
        <dt>{label}</dt>
        <dd data-supported={report.operations[operation].supported}>
          {report.operations[operation].supported ? "支持" : "当前不可用"}
          {!report.operations[operation].supported && report.operations[operation].reason && <small>{report.operations[operation].reason}</small>}
        </dd>
      </div>)}
    </dl>
    {report.missingCapabilities.length > 0 && <details className="project-missing-capabilities">
      <summary>查看兼容性限制</summary>
      <ul>{report.missingCapabilities.map((reason, index) => <li key={`${index}:${reason}`}>{reason}</li>)}</ul>
    </details>}
    <small>此报告依据项目清单和文件结构，不代表原应用的运行结果。</small>
  </div>;
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function OriginalProjectsPanel({ api, kind, onChanged }: {
  readonly api: OriginalProjectsApi;
  readonly kind: OriginalProjectKind;
  readonly onChanged: () => void | Promise<unknown>;
}) {
  const [projects, setProjects] = useState<readonly OriginalProject[]>([]);
  const [selection, setSelection] = useState<OriginalProjectSelection | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmRemove, setConfirmRemove] = useState("");
  const [confirmConvert, setConfirmConvert] = useState("");
  const alive = useRef(false);
  const requestGeneration = useRef(0);
  const selectionId = useRef<string | null>(null);

  async function refreshProjects(): Promise<void> {
    const request = ++requestGeneration.current;
    const next = await api.getOriginalProjects();
    if (alive.current && request === requestGeneration.current) setProjects(next.projects.filter((project) => project.kind === kind));
  }

  useEffect(() => {
    alive.current = true;
    void refreshProjects().catch((failure: unknown) => {
      if (alive.current) setError(messageFor(failure));
    });
    return () => {
      alive.current = false;
      requestGeneration.current += 1;
      const discarded = selectionId.current;
      selectionId.current = null;
      if (discarded) void api.discardInspectedProject(discarded).catch((failure: unknown) => {
        console.error("[OriginalProjects] 取消导入未完成", messageFor(failure));
      });
    };
  }, [api, kind]);

  async function perform(label: string, operation: () => Promise<void>): Promise<void> {
    if (busy) return;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (failure) {
      if (alive.current) setError(messageFor(failure));
    } finally {
      if (alive.current) setBusy("");
    }
  }

  async function inspect(): Promise<void> {
    if (selectionId.current) {
      await api.discardInspectedProject(selectionId.current);
      selectionId.current = null;
      if (alive.current) setSelection(null);
    }
    const next = await api.inspectLocalProject(kind);
    if (!alive.current) {
      if (next) await api.discardInspectedProject(next.selectionId);
      return;
    }
    selectionId.current = next?.selectionId ?? null;
    setSelection(next);
  }

  async function importSelection(): Promise<void> {
    if (!selection) return;
    const imported = await api.importInspectedProject(selection.selectionId);
    if (!alive.current || !imported) return;
    selectionId.current = null;
    setSelection(null);
    await refreshProjects();
    await onChanged();
    if (alive.current) setNotice(imported.nativeInstalled
      ? `「${imported.project.displayName}」已导入，可在已安装列表中配置。`
      : `「${imported.project.displayName}」已完整保存，可在下方配置独立运行入口。`);
  }

  async function updateProject(project: OriginalProject, operation: () => Promise<void>, success: string, nativeChanged = false): Promise<void> {
    await operation();
    if (!alive.current) return;
    await refreshProjects();
    if (nativeChanged) await onChanged();
    if (alive.current) {
      setConfirmRemove("");
      setConfirmConvert("");
      setNotice(success.replace("{name}", project.displayName));
    }
  }

  async function runStandalone(project: OriginalProject): Promise<void> {
    const result = await api.runOriginalProjectStandalone(project.id);
    if (!alive.current) return;
    await refreshProjects();
    if (alive.current) setNotice(result.projectStarted
      ? result.message
      : "已打开原应用，尚未加载项目。请在原应用中导入或打开已保留的项目目录。");
  }

  return <section className="studio-panel original-projects-panel" aria-label={`${kind === "pet" ? "桌宠" : "插件"}兼容性与原项目`}>
    <div className="project-panel-heading">
      <div><h2>导入{kind === "pet" ? "桌宠" : "插件"}</h2><p>先查看兼容性，再选择导入。原项目文件完整保留。</p></div>
      <button type="button" disabled={Boolean(busy)} onClick={() => { void perform("正在检测项目", inspect); }}>检测 ZIP 或文件夹</button>
    </div>
    {busy && <p className="studio-notice" role="status">{busy}…</p>}
    {notice && <p className="studio-notice" role="status">{notice}</p>}
    {error && <p className="studio-error" role="alert">{error}</p>}
    {selection && <article className="project-inspection" aria-label={`${selection.displayName} 检测结果`}>
      <h3>{selection.displayName}</h3>
      <CompatibilityReport report={selection.report} kind={kind} />
      <div className="studio-actions">
        <button type="button" disabled={Boolean(busy)} onClick={() => { void perform("正在导入项目", importSelection); }}>
          {selection.report.status === "native" ? "确认导入" : "完整保留原项目"}
        </button>
        <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => {
          void perform("正在取消", async () => {
            await api.discardInspectedProject(selection.selectionId);
            if (alive.current) { selectionId.current = null; setSelection(null); }
          });
        }}>取消</button>
      </div>
    </article>}
    {projects.length > 0 && <details className="original-projects-list" open={projects.some((project) => project.report.status !== "native")}>
      <summary>已保留的完整项目 <span>{projects.length}</span></summary>
      {projects.map((project) => <article className="original-project-card" key={project.id} aria-label={`${project.displayName} 原项目`}>
        <h3>{project.displayName}</h3>
        <CompatibilityReport report={project.report} kind={kind} />
        {project.nativeInstalled && <p className="studio-notice">已同步到本机已安装列表，可在下方切换与配置。</p>}
        {project.convertedCopyInstalled && <p className="studio-notice">另建的素材转换副本已导入，原项目继续保留。</p>}
        {project.report.status !== "native" && <div className="studio-actions project-unavailable-actions" aria-label="当前系统不可用的操作">
          {operationLabels(kind).filter(([operation]) => !project.report.operations[operation].supported).map(([operation, label]) => <button
            key={operation} type="button" className="secondary" disabled title={project.report.operations[operation].reason}
          >{label}</button>)}
        </div>}
        <div className="studio-actions">
          <button type="button" className="secondary" disabled={Boolean(busy) || !project.report.operations.openFolder.supported} onClick={() => {
            void perform("正在打开项目目录", () => updateProject(project, () => api.openOriginalProjectFolder(project.id), "「{name}」的项目目录已打开。"));
          }}>打开项目目录</button>
          {project.report.operations.convertPoses.supported && !project.convertedCopyInstalled && <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => setConfirmConvert(project.id)}>另建素材转换副本</button>}
          <button type="button" className="danger" disabled={Boolean(busy)} onClick={() => setConfirmRemove(project.id)}>移除保存副本</button>
        </div>
        <section className="project-standalone" aria-label={`${project.displayName} 独立运行`}>
          <h4>独立运行</h4>
          <p>{project.standalone?.message || project.report.operations.runStandalone?.reason || "请选择项目入口或已安装的原应用。"}</p>
          <div className="studio-actions">
            <button type="button" disabled={Boolean(busy) || project.report.operations.runStandalone?.supported !== true} title={project.report.operations.runStandalone?.reason} onClick={() => {
              void perform("正在独立启动", () => runStandalone(project));
            }}>独立运行</button>
            <button type="button" className="secondary" disabled={Boolean(busy) || project.report.operations.chooseEntry?.supported !== true} title={project.report.operations.chooseEntry?.reason} onClick={() => {
              void perform("正在选择项目入口", () => updateProject(project, () => api.chooseOriginalProjectEntry(project.id), "项目入口选择已结束。"));
            }}>选择项目入口</button>
            {project.report.operations.chooseJava?.supported && <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => {
              void perform("正在选择 Java", () => updateProject(project, () => api.chooseOriginalProjectJava(project.id), "Java 环境选择已结束。"));
            }}>{project.javaExecutablePath ? "更换 Java" : "选择 Java"}</button>}
            <button type="button" className="secondary" disabled={Boolean(busy) || !project.report.operations.chooseApplication.supported} onClick={() => {
              void perform("正在选择原应用", () => updateProject(project, () => api.chooseOriginalProjectApplication(project.id), "原应用选择已结束。"));
            }}>{project.applicationPath ? "更换原应用" : "选择原应用"}</button>
          </div>
          {project.standalone?.entryType && project.standalone.entryPath && <p className="project-application-path">项目入口：{project.standalone.entryPath}</p>}
          {project.standalone?.entryType === "jar" && <p className="project-application-path">
            Java 环境：{project.standalone.javaVersion ? `已检测 ${project.standalone.javaVersion}` : "尚未就绪"}
            {project.standalone.minimumJavaVersion && `；至少需要 Java ${project.standalone.minimumJavaVersion}`}
          </p>}
          {(project.standalone?.javaExecutablePath || project.javaExecutablePath) && <p className="project-application-path">Java 程序：{project.standalone?.javaExecutablePath || project.javaExecutablePath}</p>}
          {project.applicationPath && <p className="project-application-path">原应用：{project.applicationPath}</p>}
          <small>独立运行使用原项目入口或原应用，桌宠动作和插件配置仍按兼容性报告提供。</small>
        </section>
        {confirmConvert === project.id && <div className="studio-notice">
          <p>将无条件 PNG 姿势另建为本机素材，不改变原项目。Java、条件动作和原项目行为仍在原应用使用。</p>
          <div className="studio-actions">
            <button type="button" disabled={Boolean(busy)} onClick={() => { void perform("正在转换姿势素材", () => updateProject(project, () => api.convertOriginalProjectPoses(project.id), "素材副本已导入，原项目完整保留。", true)); }}>确认另建副本</button>
            <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => setConfirmConvert("")}>取消</button>
          </div>
        </div>}
        {confirmRemove === project.id && <div className="studio-notice">
          <p>仅移除这里保存的项目副本，原文件及已安装的桌宠或插件保留。</p>
          <div className="studio-actions">
            <button type="button" className="danger" disabled={Boolean(busy)} onClick={() => { void perform("正在移除保存副本", () => updateProject(project, () => api.removeOriginalProject(project.id), "保存副本已移除。")); }}>确认移除副本</button>
            <button type="button" className="secondary" disabled={Boolean(busy)} onClick={() => setConfirmRemove("")}>取消</button>
          </div>
        </div>}
      </article>)}
    </details>}
  </section>;
}
