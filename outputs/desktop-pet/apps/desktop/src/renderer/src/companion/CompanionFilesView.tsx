import { useEffect, useRef, useState } from "react";
import type { CompanionToolsApi } from "../../../companion-tools-types.js";
import type {
  CompanionFileLibraryCategory,
  CompanionFileLibraryEntry,
  CompanionFileLibraryRoot,
  CompanionFileLibrarySearch,
  CompanionFileLibrarySnapshot,
} from "../../../companion-file-library-types.js";
import type { CompanionFileOperation, CompanionFilePlan, CompanionFileScan } from "../../../companion-files-types.js";
import type { CompanionFileLibraryAiDraft, CompanionFileLibraryAiPreview } from "../../../companion-file-library-ai-types.js";
import "./companion-files.css";

type AiProfile = { id: string; label: string };

const CATEGORIES: CompanionFileLibraryCategory[] = ["学习", "工作", "生活", "素材", "资料", "其他"];
const STOP_LABELS: Record<CompanionFileScan["stopReason"], string> = {
  completed: "范围内扫描完成",
  cancelled: "已取消，显示目前读到的结果",
  timeout: "已到扫描时限，显示部分结果",
  "entry-limit": "已到条目上限，显示部分结果",
  "result-limit": "已到结果上限，仍可能有其他匹配",
};
const OPERATION_LABELS: Record<CompanionFileOperation["status"], string> = {
  running: "上次操作尚未结束，请核对逐项记录",
  completed: "操作完成",
  partial: "部分完成，请查看逐项结果",
  cancelled: "操作已取消，已完成项保留在记录中",
  undone: "撤销完成",
};
const ITEM_LABELS: Record<CompanionFileOperation["items"][number]["status"], string> = {
  pending: "未执行",
  prepared: "副本已校验，需核对原位置",
  completed: "已完成",
  failed: "未完成",
  undone: "已撤销",
  "undo-skipped": "未撤销",
};
const AVAILABILITY_LABELS: Record<CompanionFileLibraryEntry["availability"], string> = {
  indexed: "已索引",
  missing: "原文件已失效",
  unverified: "位置尚待复核",
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toLocaleString("zh-CN", { maximumFractionDigits: index === 0 ? 0 : 2 })} ${units[index]}`;
}

function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "时间未知" : date.toLocaleString("zh-CN");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作未完成，请重试或重新添加索引目录。";
}

function displayPath(root: CompanionFileLibraryRoot | undefined, entry: CompanionFileLibraryEntry): string {
  if (!root) return entry.relativePath;
  const separator = root.path.includes("\\") ? "\\" : "/";
  return `${root.path.replace(/[\\/]$/, "")}${separator}${entry.relativePath.replace(/[\\/]/g, separator)}`;
}

function canUndo(operation: CompanionFileOperation): boolean {
  return operation.items.some((item) => ["completed", "prepared", "undo-skipped"].includes(item.status) && Boolean(item.digest));
}

function OperationItems({ operation }: { operation: CompanionFileOperation }) {
  return (
    <ul className="companion-file-detail-list">
      {operation.items.map((item, index) => (
        <li className="companion-file-operation-item" key={`${item.source}-${index}`}>
          <div className="companion-file-row-heading">
            <strong>{ITEM_LABELS[item.status]}</strong>
            <span>{item.message}</span>
          </div>
          <div className="companion-file-path-pair">
            <span>原位置</span><code>{item.source}</code>
            <span>目标</span><code>{item.destination}</code>
          </div>
        </li>
      ))}
      {operation.items.length === 0 && <li className="companion-file-empty">这份记录没有已执行文件。</li>}
    </ul>
  );
}

export function CompanionFilesView({ api }: { api: CompanionToolsApi }) {
  const [library, setLibrary] = useState<CompanionFileLibrarySnapshot | null>(null);
  const [rootId, setRootId] = useState("");
  const [category, setCategory] = useState<CompanionFileLibraryCategory | "">("");
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [search, setSearch] = useState<CompanionFileLibrarySearch | null>(null);
  const [searching, setSearching] = useState(false);
  const [removeRootId, setRemoveRootId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CompanionFileScan | null>(null);
  const [plan, setPlan] = useState<CompanionFilePlan | null>(null);
  const [result, setResult] = useState<CompanionFileOperation | null>(null);
  const [history, setHistory] = useState<CompanionFileOperation[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<AiProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [aiPreview, setAiPreview] = useState<CompanionFileLibraryAiPreview | null>(null);
  const [aiDraft, setAiDraft] = useState<CompanionFileLibraryAiDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<string | null>(null);
  const [cancellable, setCancellable] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());
  const mounted = useRef(true);
  const taskRunning = useRef(false);
  const taskCancellable = useRef(false);
  const busy = loading || task !== null;
  const selectedRoot = library?.roots.find((root) => root.id === rootId);
  const scopedEntries = library?.entries.filter((entry) => !rootId || entry.rootId === rootId) ?? [];

  useEffect(() => {
    let active = true;
    mounted.current = true;
    setLoading(true);
    void Promise.allSettled([
      api.getFileLibrary(),
      api.getFileHistory(),
      api.getFileLibraryProfiles(),
    ]).then(([libraryResult, historyResult, profileResult]) => {
      if (!active) return;
      const failures: string[] = [];
      if (libraryResult.status === "fulfilled") {
        setLibrary(libraryResult.value);
      } else {
        failures.push(`分类库未能读取：${errorMessage(libraryResult.reason)}`);
      }
      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      } else {
        failures.push(`操作记录未能读取：${errorMessage(historyResult.reason)}`);
      }
      if (profileResult.status === "fulfilled") {
        setProfiles(profileResult.value);
        setProfileId(profileResult.value[0]?.id ?? "");
      } else {
        failures.push(`AI 来源未能读取：${errorMessage(profileResult.reason)}`);
      }
      setError(failures.join("；"));
      setLoading(false);
    });
    return () => {
      active = false;
      mounted.current = false;
      if (taskCancellable.current) {
        // 离开页面时只请求宿主取消，卸载后的清理失败不再写入界面。
        void api.cancelFileTask().catch(() => undefined);
      }
    };
  }, [api]);

  useEffect(() => {
    if (!library) return;
    let active = true;
    setSearching(true);
    setSearch(null);
    const filter = {
      ...(rootId ? { rootId } : {}),
      ...(category ? { category } : {}),
    };
    void api.searchFileLibrary(submittedQuery, filter).then((matches) => {
      if (active) setSearch(matches);
    }).catch((failure: unknown) => {
      if (!active) return;
      setSearch(null);
      setError(`检索未完成：${errorMessage(failure)}`);
    }).finally(() => {
      if (active) setSearching(false);
    });
    return () => { active = false; };
  }, [api, library, rootId, category, submittedQuery]);

  useEffect(() => {
    if (!plan && !aiPreview) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [plan, aiPreview]);

  function clearPreviews(): void {
    setAnalysis(null);
    setPlan(null);
    setAiPreview(null);
    setAiDraft(null);
  }

  function acceptLibrary(snapshot: CompanionFileLibrarySnapshot): void {
    if (!mounted.current) return;
    setLibrary(snapshot);
    clearPreviews();
    if (rootId && !snapshot.roots.some((root) => root.id === rootId)) setRootId("");
  }

  async function run(label: string, action: () => Promise<void>, mayCancel = false): Promise<void> {
    if (taskRunning.current || loading) return;
    taskRunning.current = true;
    taskCancellable.current = mayCancel;
    setTask(label);
    setCancellable(mayCancel);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      if (mounted.current) setError(errorMessage(failure));
    } finally {
      taskRunning.current = false;
      taskCancellable.current = false;
      if (mounted.current) {
        setTask(null);
        setCancellable(false);
        setCancelling(false);
      }
    }
  }

  async function refreshHistory(): Promise<void> {
    const records = await api.getFileHistory();
    if (mounted.current) setHistory(records);
  }

  async function refreshLibrary(): Promise<void> {
    acceptLibrary(await api.refreshFileLibrary());
  }

  async function cancel(): Promise<void> {
    if (!cancellable || cancelling) return;
    setCancelling(true);
    try {
      const response = await api.cancelFileTask();
      if (mounted.current) {
        setNotice(response.cancelled ? "已请求取消。已经完成的文件操作可在记录中核对和撤销。" : "当前操作已结束。");
      }
    } catch (failure) {
      if (mounted.current) setError(`取消请求未完成：${errorMessage(failure)}`);
    } finally {
      if (mounted.current) setCancelling(false);
    }
  }

  async function chooseFolder(): Promise<void> {
    const snapshot = await api.chooseFileLibraryFolder();
    if (!snapshot || !mounted.current) return;
    const addedRoot = snapshot.roots.find((root) => !library?.roots.some((oldRoot) => oldRoot.id === root.id));
    acceptLibrary(snapshot);
    if (addedRoot) setRootId(addedRoot.id);
    setNotice("已建立位置索引，文件仍在原来的文件夹。");
  }

  async function previewAi(): Promise<void> {
    if (!selectedRoot) return;
    const sources = await api.getFileLibraryProfiles();
    if (!mounted.current) return;
    setProfiles(sources);
    if (!sources.some((source) => source.id === profileId)) setProfileId(sources[0]?.id ?? "");
    if (sources.length === 0) {
      setNotice("目前没有就绪的文字 AI 来源，可先使用本地分类。到 AI 工作台配置来源后再生成建议。");
      return;
    }
    const preview = await api.prepareFileLibraryAi(selectedRoot.id);
    if (!mounted.current) return;
    setAiPreview(preview);
    setAiDraft(null);
  }

  const readyCount = plan?.items.filter((item) => item.status === "ready").length ?? 0;
  const conflictCount = plan?.items.filter((item) => item.status === "conflict").length ?? 0;
  const skippedCount = plan?.items.filter((item) => item.status === "skipped").length ?? 0;
  const planExpired = Boolean(plan && Date.parse(plan.expiresAt) <= now);
  const aiPreviewExpired = Boolean(aiPreview && aiPreview.expiresAt <= now);
  const displayedRoots = library?.roots.filter((root) => !rootId || root.id === rootId) ?? [];

  return (
    <section className="companion-files studio-section" aria-busy={busy}>
      <section className="studio-panel companion-file-library" aria-labelledby="file-library-title">
        <div className="companion-file-section-heading">
          <div>
            <h2 id="file-library-title">文件分类库</h2>
            <p>把资料归类到一个视图里，文件保留在原位置。本地可用，不需要账户。</p>
          </div>
          <button className="secondary" disabled={busy} onClick={() => void run("添加索引目录", chooseFolder, true)}>添加索引目录</button>
        </div>
        <div className="companion-file-action-strip">
          <label className="companion-file-root-filter">
            <span>查看范围</span>
            <select value={rootId} disabled={busy} onChange={(event) => {
              setRootId(event.target.value);
              setRemoveRootId(null);
              clearPreviews();
            }}>
              <option value="">全部索引目录</option>
              {library?.roots.map((root) => <option key={root.id} value={root.id}>{root.path}</option>)}
            </select>
          </label>
          <button className="secondary" disabled={busy || !library?.roots.length} onClick={() => void run("更新文件索引", refreshLibrary, true)}>更新索引</button>
          <button className="secondary" disabled={busy || !selectedRoot} onClick={() => void run("分析文件夹占用", async () => {
            if (!selectedRoot) return;
            const scan = await api.analyzeLibraryFolder(selectedRoot.id);
            if (mounted.current) setAnalysis(scan);
          }, true)}>查看空间占用</button>
          <button disabled={busy || !selectedRoot} onClick={() => void run("生成推荐整理预览", async () => {
            if (!selectedRoot) return;
            const preview = await api.previewRecommendedOrganize(selectedRoot.id);
            if (mounted.current) setPlan(preview);
          }, true)}>按推荐整理</button>
        </div>
        {!selectedRoot && Boolean(library?.roots.length) && <p className="companion-file-hint">可同时检索所有目录；分析、AI 建议或实体整理前，先选定一个目录。</p>}
        {library?.storageError && <div className="studio-error" role="alert">分类记录需要核对：{library.storageError}</div>}
        <details className="companion-file-root-details">
          <summary>被索引的目录 · {library?.roots.length ?? 0}</summary>
          {library?.roots.length ? <ul className="companion-file-root-list">
            {displayedRoots.map((root) => (
              <li key={root.id}>
                <div className="companion-file-section-heading">
                  <code>{root.path}</code>
                  <button className="secondary" disabled={busy} onClick={() => setRemoveRootId(removeRootId === root.id ? null : root.id)}>移除索引</button>
                </div>
                <p>{root.lastScannedAt ? `上次索引：${formatTime(root.lastScannedAt)}` : "尚未完成索引"}</p>
                {root.scan && <p>{STOP_LABELS[root.scan.stopReason]} · 读到 {root.scan.filesCount} 个文件{root.scan.partial ? " · 部分结果" : ""}{root.scan.depthLimited ? " · 深层目录未全部读取" : ""}</p>}
                {root.scan && (root.scan.unreadable > 0 || root.scan.skippedLinks > 0) && <p>无法读取 {root.scan.unreadable} 项；跳过链接 {root.scan.skippedLinks} 项。</p>}
                {root.lastError && <p className="companion-file-boundary">{root.lastError}；保留的旧引用需要重新核对。</p>}
                {removeRootId === root.id && <div className="companion-file-action-strip companion-file-remove-confirm">
                  <span>只移除这个目录的分类引用，原文件保留。</span>
                  <button className="danger" disabled={busy} onClick={() => void run("移除目录索引", async () => {
                    acceptLibrary(await api.removeFileLibraryRoot(root.id));
                    if (mounted.current) setRemoveRootId(null);
                  })}>确认移除索引</button>
                  <button className="secondary" disabled={busy} onClick={() => setRemoveRootId(null)}>保留索引</button>
                </div>}
              </li>
            ))}
          </ul> : <p className="companion-file-empty">添加下载、课程或工作资料目录，建立本机分类库；不会复制或移动文件。</p>}
        </details>
      </section>

      {(task || loading) && <div className="companion-file-progress" role="status">
        <span>{task ?? "读取文件分类库与操作记录"}…</span>
        {task && cancellable && <button className="secondary" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? "正在请求取消" : "取消"}</button>}
      </div>}
      {error && <div className="studio-error" role="alert">{error}</div>}
      {notice && <div className="studio-notice" role="status">{notice}</div>}

      <section className="studio-panel companion-file-results" aria-labelledby="file-search-title">
        <h3 id="file-search-title">文件快速定位</h3>
        <p>按文件名线索检索已有索引，点击结果打开所在文件夹。分类依据名称和扩展名，不读取正文。</p>
        <form className="companion-file-search-form" onSubmit={(event) => {
          event.preventDefault();
          setSubmittedQuery(query.trim());
        }}>
          <label className="companion-file-search-field">
            <span>文件名关键词</span>
            <input value={query} maxLength={200} placeholder="例如：论文、截图、预算" disabled={busy || !library?.roots.length} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <button type="submit" disabled={busy || !library?.roots.length}>查找</button>
          <button className="secondary" type="button" disabled={busy} onClick={() => {
            setQuery("");
            setSubmittedQuery("");
          }}>显示全部</button>
        </form>
        <div className="companion-file-categories" aria-label="按类别筛选">
          <button className={category === "" ? "" : "secondary"} aria-pressed={category === ""} disabled={busy} onClick={() => setCategory("")}>全部 · {scopedEntries.length}</button>
          {CATEGORIES.map((item) => <button key={item} className={category === item ? "" : "secondary"} aria-pressed={category === item} disabled={busy} onClick={() => setCategory(item)}>{item} · {scopedEntries.filter((entry) => entry.category === item).length}</button>)}
        </div>
        {searching && <p role="status">正在更新检索结果…</p>}
        {search && <p className="companion-file-result-caption">{search.query ? `“${search.query}”：` : "当前范围："}共 {search.totalMatches} 个引用，显示 {search.matches.length} 个{search.truncated ? " · 结果达到显示上限，建议缩小范围或补充关键词" : ""}</p>}
        {search?.matches.length ? <ul className="companion-file-list">
          {search.matches.map((entry) => (
            <li className="companion-file-list-row" key={entry.id} data-entry-id={entry.id}>
              <div className="companion-file-list-content">
                <div className="companion-file-row-heading">
                  <button className="companion-file-name" disabled={busy || entry.availability === "missing"} onClick={() => void run("打开所在文件夹", () => api.revealLibraryFile(entry.id))}>{entry.name}</button>
                  <span>{formatBytes(entry.size)}</span>
                </div>
                <code>{displayPath(library?.roots.find((root) => root.id === entry.rootId), entry)}</code>
                <p className="companion-file-entry-meta"><span>{entry.category} · {entry.fileType}</span><span>{entry.classificationSource === "rule" ? "本地规则" : "已采用的分类建议"}</span><span className={`availability-${entry.availability}`}>{AVAILABILITY_LABELS[entry.availability]}</span></p>
                <p className="companion-file-hint">{entry.reason}</p>
              </div>
              <button className="secondary" disabled={busy || entry.availability === "missing"} onClick={() => void run("打开所在文件夹", () => api.revealLibraryFile(entry.id))}>打开所在文件夹</button>
            </li>
          ))}
        </ul> : !searching && <p className="companion-file-empty">{library?.roots.length ? "本次索引范围内没有匹配，可换关键词、类别或更新索引。" : "先添加一个索引目录。"}</p>}
        <p className="companion-file-hint">引用可能在上次索引后变化。打开位置时会再核对；失效引用不能打开，可更新索引核对原位置。</p>
      </section>

      <section className="studio-panel companion-file-ai" aria-labelledby="file-ai-title">
        <div className="companion-file-section-heading">
          <div><h3 id="file-ai-title">用 AI 优化分类建议</h3><p>本地分类可直接使用。AI 建议先审阅，采用后只更新分类标签。</p></div>
          <button className="secondary" disabled={busy || !selectedRoot} onClick={() => void run("准备 AI 数据预览", previewAi)}>预览将发送的数据</button>
        </div>
        <div className="companion-file-action-strip">
          <label className="companion-file-root-filter"><span>就绪的文字 AI 来源</span><select value={profileId} disabled={busy} onChange={(event) => {
            setProfileId(event.target.value);
            setAiDraft(null);
          }}>{profiles.length ? profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.label}</option>) : <option value="">尚未配置就绪来源</option>}</select></label>
        </div>
        {!profiles.length && <p className="companion-file-hint">到 AI 工作台配置文字来源后，可回来预览数据；没有 AI 配置仍能索引、分类和定位文件。</p>}
        {aiPreview && <div className="companion-file-ai-preview">
          <h4>即将发送的名称数据</h4>
          <p>下方只含匿名 ID、文件名、类型和类别，不发送正文或完整路径。文件名也可能包含个人信息，请先检查。</p>
          <pre data-file-ai-payload>{JSON.stringify(aiPreview.entries, null, 2)}</pre>
          <p>共 {aiPreview.totalFiles} 个文件，本次发送 {aiPreview.entries.length} 个{aiPreview.truncated ? "，仅为部分结果" : ""}。{aiPreviewExpired ? "预览已过期，请重新准备。" : `有效至 ${formatTime(aiPreview.expiresAt)}`}</p>
          <div className="companion-file-action-strip">
            <button disabled={busy || aiPreviewExpired || !profileId || aiPreview.entries.length === 0} onClick={() => void run("生成分类建议", async () => {
              setAiDraft(null);
              const draft = await api.generateFileLibraryAi(aiPreview.id, profileId);
              if (mounted.current) setAiDraft(draft);
            }, true)}>发送这些名称并生成建议</button>
            <button className="secondary" disabled={busy} onClick={() => {
              setAiPreview(null);
              setAiDraft(null);
            }}>收起数据预览</button>
          </div>
        </div>}
        {aiDraft && <div className="companion-file-ai-draft">
          <h4>AI 建议草稿 · 尚未采用</h4>
          <p>{aiDraft.summary}</p>
          <ul className="companion-file-ai-suggestions">
            {aiDraft.items.map((item) => {
              const entry = aiPreview?.entries.find((candidate) => candidate.entryId === item.entryId);
              return <li key={item.entryId}><strong>{entry?.name ?? "待核对的文件"}</strong><span>{entry?.category ?? "原类别"} → {item.category}</span></li>;
            })}
          </ul>
          <p>采用只更新虚拟分类，不会移动或重命名文件。需要实体整理时，再点击“按推荐整理”核对原路径和目标。</p>
          <div className="companion-file-action-strip">
            <button disabled={busy || aiDraft.items.length === 0} onClick={() => void run("采用已审阅的分类建议", async () => {
              acceptLibrary(await api.applyFileLibraryAi(aiDraft.id));
              if (mounted.current) setNotice("已采用分类建议，文件仍在原位置。");
            })}>采用这份分类建议</button>
            <button className="secondary" disabled={busy} onClick={() => setAiDraft(null)}>放弃这份建议</button>
          </div>
        </div>}
      </section>

      {analysis && <section className="studio-panel companion-file-analysis">
        <div className="companion-file-section-heading"><div><h3>文件夹占用</h3><p>{STOP_LABELS[analysis.stopReason]}{analysis.depthLimited ? "；还有更深目录未读取" : ""}</p></div><span className="companion-file-hint">{formatTime(analysis.measuredAt)}</span></div>
        <code className="companion-file-analysis-root">{analysis.root}</code>
        <dl className="companion-file-measurements">
          <div><dt>已读文件逻辑大小</dt><dd>{formatBytes(analysis.bytes)}</dd></div>
          <div><dt>已读文件</dt><dd>{analysis.filesCount.toLocaleString("zh-CN")} 个</dd></div>
          <div><dt>用时</dt><dd>{(analysis.elapsedMs / 1000).toFixed(1)} 秒</dd></div>
        </dl>
        <p>{analysis.sizeMeaning}</p>
        {(analysis.skippedLinks > 0 || analysis.unreadable > 0) && <p className="companion-file-boundary">跳过链接 {analysis.skippedLinks} 项；无法读取 {analysis.unreadable} 项。受限项目未计入大小。</p>}
        {analysis.chatDirectoryHint && <p className="companion-file-boundary">目录名称像聊天资料位置。这里只统计文件大小，请用聊天软件自带的存储管理核对可清理内容。</p>}
        <h4>直接子项汇总</h4>
        <ul className="companion-file-child-list">
          {analysis.children.map((child) => <li key={child.path}><div><strong>{child.name}</strong>{child.chatDirectoryHint && <span>可能为聊天资料</span>}</div><span>{formatBytes(child.bytes)}</span></li>)}
        </ul>
        <h4>前列大文件</h4>
        <ul className="companion-file-child-list">
          {analysis.largestFiles.map((entry) => <li key={entry.path}><div><strong>{entry.name}</strong><code>{entry.path}</code></div><span>{formatBytes(entry.size)}</span></li>)}
        </ul>
        {analysis.largestFiles.length === 0 && <p className="companion-file-empty">本次扫描没有读到普通文件。</p>}
      </section>}

      {plan && <section className="studio-panel companion-file-plan-card">
        <div className="companion-file-section-heading"><div><h3>推荐整理预览</h3><p>尚未移动文件。核对每项原位置和目标后，再确认执行。</p></div><button className="secondary" disabled={busy} onClick={() => setPlan(null)}>收起预览</button></div>
        <div className="companion-file-plan-summary"><span>可执行 {readyCount} 项</span><span>冲突 {conflictCount} 项</span><span>保留原位 {skippedCount} 项</span><span>预计复制 {formatBytes(plan.totalBytes)}</span></div>
        <div className="companion-file-selected-path"><span>目标范围</span><code>{plan.root}</code></div>
        <p className="companion-file-boundary">确认后会把文件移入原目录下的推荐类别子目录。先复制并校验，再移除原位置，会暂时多占一份空间。同名不覆盖，后来变化的文件会跳过。</p>
        {plan.truncated && <p className="companion-file-boundary">本次预览达到条目或时间限制，只列出部分项目。请缩小范围或分批整理。</p>}
        <ul className="companion-file-plan-list">
          {plan.items.map((item, index) => <li className={`companion-file-plan-item status-${item.status}`} key={`${item.source}-${index}`}>
            <div className="companion-file-row-heading"><strong>{item.status === "ready" ? "可执行" : item.status === "conflict" ? "冲突，跳过" : "保留原位"} · {item.category}</strong><span>{formatBytes(item.size)}</span></div>
            <div className="companion-file-path-pair"><span>原位置</span><code>{item.source}</code><span>目标</span><code>{item.destination}</code></div>
            <p>{item.reason}</p>
          </li>)}
          {plan.items.length === 0 && <li className="companion-file-empty">这个目录没有可生成预览的文件。</li>}
        </ul>
        <div className="companion-file-plan-footer">
          <span>{planExpired ? "计划已过期，请重新预览。" : `预览有效至 ${formatTime(plan.expiresAt)}`}</span>
          <button disabled={busy || readyCount === 0 || planExpired} onClick={() => void run("执行已确认的推荐整理", async () => {
            const operation = await api.executeFilePlan(plan.id);
            if (!mounted.current) return;
            setResult(operation);
            setPlan(null);
            setNotice(OPERATION_LABELS[operation.status]);
            await refreshHistory();
            await refreshLibrary();
          }, true)}>确认移动整理 {readyCount} 个文件</button>
        </div>
      </section>}

      {result && <section className="studio-panel companion-file-operation-result">
        <h3>{OPERATION_LABELS[result.status]}</h3>
        <p>逐项结果保存在本地记录。取消或部分完成后，可核对记录再撤销已完成项。</p>
        <OperationItems operation={result} />
      </section>}

      <section className="studio-panel companion-file-history">
        <div className="companion-file-section-heading"><div><h3>最近操作记录</h3><p>撤销只处理本次生成、后来未改变的文件；原位置有同名项目时不覆盖。</p></div><button className="secondary" disabled={busy} onClick={() => void run("刷新操作记录", refreshHistory)}>刷新记录</button></div>
        {history.length === 0 ? <p className="companion-file-empty">确认执行整理后，记录会保存在这里。</p> : <ul className="companion-file-history-list">
          {history.map((operation) => <li className="companion-file-history-item" key={operation.id}>
            <div className="companion-file-section-heading">
              <div><strong>{operation.kind === "organize" ? "文件整理" : "历史复制操作"} · 共 {operation.items.length} 项</strong><p>{formatTime(operation.createdAt)} · {OPERATION_LABELS[operation.status]}</p></div>
              <div className="companion-file-row-actions">
                <button className="secondary" disabled={busy} onClick={() => setExpandedHistory(expandedHistory === operation.id ? null : operation.id)}>{expandedHistory === operation.id ? "收起" : "查看逐项记录"}</button>
                <button className="secondary" disabled={busy || !canUndo(operation)} title="目标后来变化或原位置出现同名项目时，会保留文件并跳过。" onClick={() => void run("撤销文件操作", async () => {
                  const undone = await api.undoFileOperation(operation.id);
                  if (!mounted.current) return;
                  setResult(undone);
                  setNotice(OPERATION_LABELS[undone.status]);
                  await refreshHistory();
                  await refreshLibrary();
                }, true)}>撤销这次{operation.kind === "organize" ? "整理" : "复制"}</button>
              </div>
            </div>
            <code className="companion-file-history-root">{operation.root}</code>
            {expandedHistory === operation.id && <OperationItems operation={operation} />}
          </li>)}
        </ul>}
      </section>
    </section>
  );
}
