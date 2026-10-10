import { useState } from "react";
import type { CompanionCursorWindowSnapshot } from "../../../companion-diagnostics-types.js";
import type { CompanionToolsApi, CompanionToolsSnapshot } from "../../../companion-tools-types.js";
import { isCompanionDiagnosticSampleFresh } from "../../../companion-diagnostics-core.js";
import { Button } from "../components/ui/Button.js";
import { GlassCard } from "../components/ui/GlassCard.js";
import "./companion-diagnostics.css";

export interface CompanionDiagnosticsViewProps {
  api: CompanionToolsApi;
  snapshot: CompanionToolsSnapshot;
  onSnapshot: (snapshot: CompanionToolsSnapshot) => void;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function Meter({ label, percent, note }: { label: string; percent: number | null; note: string }) {
  return (
    <div className="companion-diag-meter">
      <div className="companion-diag-meter-heading">
        <span>{label}</span>
        <strong>{percent === null ? "未读取到" : `${percent.toFixed(1)}%`}</strong>
      </div>
      <div className="companion-diag-track" aria-hidden="true">
        <span style={{ width: `${percent ?? 0}%` }} className={percent !== null && percent >= 85 ? "is-high" : ""} />
      </div>
      <small>{note}</small>
    </div>
  );
}

export function CompanionDiagnosticsView({ api, snapshot, onSnapshot }: CompanionDiagnosticsViewProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cursorResult, setCursorResult] = useState<CompanionCursorWindowSnapshot | null>(null);
  const diagnostic = snapshot.diagnostics;
  const recommendations = snapshot.resourceRecommendations.filter((item) =>
    isCompanionDiagnosticSampleFresh(item.sampledAt, Date.now()));
  const blocked = busy !== null || snapshot.scanning;
  const ignoredCount = snapshot.settings.ignoredFindingIds.length;
  const snoozedCount = Object.values(snapshot.settings.snoozedUntil).filter((until) => until > Date.now()).length;

  async function run(action: string, operation: () => Promise<void>): Promise<void> {
    if (blocked) return;
    setBusy(action);
    setError(null);
    setMessage(null);
    try {
      await operation();
    } catch (failure) {
      setMessage(null);
      setError(failure instanceof Error ? failure.message : "操作未完成，请重试。");
    } finally {
      setBusy(null);
    }
  }

  function setDisposition(id: string, action: "ignore" | "later"): void {
    void run("finding", async () => {
      onSnapshot(await api.setFindingDisposition(id, action));
      setMessage(action === "ignore" ? "已停止提醒这一问题，可随时恢复。" : "这一问题已延后 1 小时提醒。");
    });
  }

  function openSystemPage(page: "startup" | "storage" | "apps"): void {
    void run("system", async () => {
      await api.openSystemPage(page);
    });
  }

  return (
    <div className="companion-diagnostics" aria-busy={blocked}>
      <GlassCard className="companion-diag-intro">
        <div className="companion-diag-heading">
          <div>
            <h2>看看电脑现在的状态</h2>
            <p>先看空间和资源占用，再决定是否需要处理。</p>
          </div>
          <Button disabled={blocked} onClick={() => void run("scan", async () => {
            onSnapshot(await api.refreshDiagnostics());
          })}>
            {busy === "scan" || snapshot.scanning ? "正在检查…" : diagnostic ? "重新检查" : "开始检查"}
          </Button>
        </div>
        <div className="companion-diag-monitor-row">
          <label className="companion-diag-monitor-toggle">
            <input type="checkbox" checked={snapshot.settings.monitorEnabled} disabled={blocked}
              onChange={(event) => {
                const enabled = event.target.checked;
                void run("monitor", async () => {
                  onSnapshot(await api.setMonitoring(enabled));
                  setMessage(enabled ? "已开启后台检查。" : "已关闭后台检查。");
                });
              }} />
            <span>在后台留意空间和电脑状态</span>
          </label>
          <span className="companion-diag-subtle">{snapshot.settings.monitorEnabled ? "已开启" : "按需开启"}</span>
        </div>
        <p className="companion-diag-subtle">
          {diagnostic ? `最近检查：${formatTime(diagnostic.sampledAt)} · CPU 采样约 ${(diagnostic.sampleDurationMs / 1000).toFixed(1)} 秒` : "尚未检查。点击“开始检查”获取本机证据。"}
        </p>
      </GlassCard>

      {(error || snapshot.lastError) && <div className="companion-diag-error" role="alert">{error || snapshot.lastError}</div>}
      {message && <div className="companion-diag-message" role="status">{message}</div>}

      {diagnostic && (
        <>
          <GlassCard>
            <div className="companion-diag-heading">
              <h3>值得留意</h3>
              {(ignoredCount > 0 || snoozedCount > 0) && <Button variant="secondary" size="compact" disabled={blocked}
                onClick={() => void run("restore", async () => {
                  onSnapshot(await api.resetIgnoredFindings());
                  setMessage("已恢复提醒。");
                })}>恢复提醒</Button>}
            </div>
            {snapshot.findings.length === 0 ? (
              <p className="companion-diag-subtle">
                {ignoredCount > 0 || snoozedCount > 0 ? "当前没有待提醒的问题。已忽略或延后的问题不会反复打扰。" : "这次没有达到提醒条件的空间或资源问题。短采样无法排除所有电脑问题。"}
              </p>
            ) : (
              <div className="companion-diag-findings">
                {snapshot.findings.map((finding) => (
                  <article key={finding.id} className="companion-diag-finding">
                    <div>
                      <h4>{finding.title}</h4>
                      <p className="companion-diag-evidence">{finding.evidence}</p>
                      <p className="companion-diag-subtle">{finding.explanation}</p>
                    </div>
                    <div className="companion-diag-actions">
                      <Button size="compact" variant="secondary" disabled={blocked} onClick={() => setDisposition(finding.id, "later")}>1 小时后提醒</Button>
                      <Button size="compact" variant="secondary" disabled={blocked} onClick={() => setDisposition(finding.id, "ignore")}>不再提醒</Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {(ignoredCount > 0 || snoozedCount > 0) && <p className="companion-diag-subtle">已忽略 {ignoredCount} 项，延后 {snoozedCount} 项。</p>}
          </GlassCard>

          <GlassCard>
            <h3>资源与空间</h3>
            <div className="companion-diag-meters">
              <Meter label="CPU" percent={diagnostic.cpuPercent} note="本次短采样；一次峰值不能证明持续卡顿。" />
              <Meter label="物理内存" percent={diagnostic.memory?.usedPercent ?? null}
                note={diagnostic.memory ? `可用 ${formatBytes(diagnostic.memory.availableBytes)} / 总共 ${formatBytes(diagnostic.memory.totalBytes)}` : "未读取到系统物理内存。"} />
              {diagnostic.disks.map((disk) => <Meter key={disk.name} label={disk.name} percent={disk.usedPercent}
                note={`可用 ${formatBytes(disk.freeBytes)} / 总共 ${formatBytes(disk.totalBytes)}`} />)}
            </div>
            <div className="companion-diag-actions">
              <Button variant="secondary" size="compact" disabled={blocked} onClick={() => openSystemPage("storage")}>打开系统存储设置</Button>
              <Button variant="secondary" size="compact" disabled={blocked} onClick={() => void run("copy", async () => {
                const result = await api.copyDiagnosticsReport();
                if (!result.copied) throw new Error("诊断摘要尚未复制，请重试。");
                setMessage("诊断摘要已复制到剪贴板。分享前请检查其中的本地信息。");
              })}>复制诊断摘要</Button>
            </div>
          </GlassCard>

          <GlassCard>
            <h3>可以怎样改善</h3>
            <p className="companion-diag-subtle">建议只供核对和手动操作，不会自动修改保存路径、结束程序或删除文件。</p>
            {recommendations.length === 0 ? (
              <p className="companion-diag-subtle">
                {isCompanionDiagnosticSampleFresh(diagnostic.sampledAt, Date.now())
                  ? "本次可用测量没有触发资源建议。未读取到的数据不能当作零占用；若仍觉得卡顿，可先打开任务管理器复查。"
                  : "这次采样已超过建议的有效时间，或时间异常。请重新检查后再判断资源与保存位置。"}
              </p>
            ) : (
              <div className="companion-diag-recommendations">
                {recommendations.map((recommendation) => (
                  <article key={recommendation.id} className="companion-diag-recommendation">
                    <h4>{recommendation.title}</h4>
                    <p className="companion-diag-evidence">{recommendation.evidence}</p>
                    <p className="companion-diag-subtle">建议依据：{formatTime(recommendation.sampledAt)} 的采样。</p>
                    <ol>{recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                    <p className="companion-diag-subtle">{recommendation.limitation}</p>
                    <Button variant="secondary" size="compact" disabled={blocked}
                      onClick={() => openSystemPage(recommendation.systemPage)}>
                      {recommendation.systemPage === "storage" ? "查看系统存储设置" : "查看系统启动应用设置"}
                    </Button>
                  </article>
                ))}
              </div>
            )}
          </GlassCard>
        </>
      )}

      <GlassCard>
        <div className="companion-diag-heading">
          <div>
            <h3>这个窗口属于哪个程序？</h3>
            <p className="companion-diag-subtle">点击后，把鼠标移到目标窗口上，停留 3 秒。</p>
          </div>
          <Button variant="secondary" disabled={blocked} onClick={() => void run("capture", async () => {
            setCursorResult(null);
            setMessage("请把鼠标移到目标窗口，保持停留 3 秒。正在读取所属进程…");
            setCursorResult(await api.captureWindow());
            setMessage(null);
          })}>{busy === "capture" ? "请指向目标窗口…" : "指认窗口"}</Button>
        </div>
        {cursorResult && (
          <div className="companion-diag-window-result">
            <p className="companion-diag-subtle">指认时间：{formatTime(cursorResult.sampledAt)}</p>
            {cursorResult.window ? (
              <dl className="companion-diag-properties">
                <dt>窗口标题</dt><dd>{cursorResult.window.title || "没有标题"}</dd>
                <dt>所属进程</dt><dd>{cursorResult.window.processName || "未读取到名称"} · PID {cursorResult.window.pid}</dd>
                <dt>程序路径</dt><dd className="companion-diag-path">{cursorResult.window.executablePath || "未读取到，可能权限受限或进程已退出。"}</dd>
              </dl>
            ) : <p>未找到鼠标位置的可见窗口，请重试。</p>}
            <p className="companion-diag-subtle">{cursorResult.note}</p>
          </div>
        )}
        {!cursorResult && <p className="companion-diag-subtle">这里只提供窗口的进程归属；系统通知宿主和浏览器不能直接代表具体通知应用或网站。</p>}
      </GlassCard>

      {diagnostic && (
        <GlassCard className="companion-diag-lists">
          <details>
            <summary>资源占用进程 · 前 20 个</summary>
            <p className="companion-diag-subtle">按工作集排序。共享内存不可简单相加；资源占用高并不意味着应该结束程序。</p>
            <div className="companion-diag-table-scroll">
              <table><thead><tr><th>进程 / PID</th><th>工作集</th><th>CPU</th></tr></thead>
                <tbody>{diagnostic.processes.slice(0, 20).map((process) => (
                  <tr key={process.pid}><td><strong>{process.name}</strong><small>PID {process.pid}</small></td>
                    <td>{formatBytes(process.workingSetBytes)}</td><td>{process.cpuPercent === null ? "未读取到" : `${process.cpuPercent.toFixed(1)}%`}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </details>
          <details>
            <summary>自启线索 · {diagnostic.startupItems.length} 项</summary>
            <p className="companion-diag-subtle">覆盖登录启动项与启动文件夹，不含服务和计划任务；是否影响开机仍需进一步调查。</p>
            <div className="companion-diag-actions"><Button variant="secondary" size="compact" disabled={blocked} onClick={() => openSystemPage("startup")}>打开系统启动应用设置</Button></div>
            <ul className="companion-diag-evidence-list">{diagnostic.startupItems.map((item) => (
              <li key={item.id}><strong>{item.name || "未命名条目"}</strong><small>{item.source}</small><code>{item.command || "未登记路径或命令"}</code></li>
            ))}</ul>
            {diagnostic.startupItems.length === 0 && <p className="companion-diag-subtle">本次在覆盖范围内没有读到条目。</p>}
          </details>
          <details>
            <summary>登记的软件 · {diagnostic.installedApps.length} 项</summary>
            <p className="companion-diag-subtle">
              {diagnostic.installedAppsComplete ? "登记清单读取完整；不涵盖所有商店应用、便携软件和未登记软件。" : "本次登记清单不完整，不能据此认定某个软件已卸载。"}
              名称或短期新增条目不能证明是捆绑软件。
            </p>
            <div className="companion-diag-actions"><Button variant="secondary" size="compact" disabled={blocked} onClick={() => openSystemPage("apps")}>打开系统已安装应用</Button></div>
            <ul className="companion-diag-evidence-list">{diagnostic.installedApps.map((app) => (
              <li key={app.id}><strong>{app.name} {app.version}</strong><small>{app.publisher || "未登记发布者"} · {app.source}</small>
                {app.installLocation && <code>{app.installLocation}</code>}
              </li>
            ))}</ul>
          </details>
          <details>
            <summary>可见窗口 · {diagnostic.windows.length} 个</summary>
            <p className="companion-diag-subtle">最近检查时的非最小化顶层窗口；清单不会持续跟随窗口变化。</p>
            <ul className="companion-diag-evidence-list">{diagnostic.windows.map((window) => (
              <li key={window.handle}><strong>{window.title || "没有标题"}{window.isForeground ? " · 前台" : ""}</strong>
                <small>{window.processName || "未读取到名称"} · PID {window.pid}</small><code>{window.executablePath || "未读取到程序路径"}</code></li>
            ))}</ul>
          </details>
          <details>
            <summary>检查范围与读取问题{diagnostic.collectionIssues.length > 0 ? ` · ${diagnostic.collectionIssues.length} 项` : ""}</summary>
            {diagnostic.collectionIssues.length > 0 && <ul className="companion-diag-issues">{diagnostic.collectionIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
            <ul className="companion-diag-coverage">{diagnostic.coverage.map((coverage) => <li key={coverage}>{coverage}</li>)}</ul>
          </details>
        </GlassCard>
      )}
    </div>
  );
}
