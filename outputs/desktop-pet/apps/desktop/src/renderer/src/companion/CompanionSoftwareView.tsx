import { useEffect, useRef, useState } from "react";
import type { CompanionToolsApi, CompanionToolsSnapshot } from "../../../companion-tools-types.js";
import type { CompanionDownloadsSnapshot, CompanionInstallerEvidence } from "../../../companion-software-types.js";
import { Button } from "../components/ui/Button.js";
import { GlassCard } from "../components/ui/GlassCard.js";
import "./companion-diagnostics.css";
import "./companion-software.css";

function time(value: number): string {
  return new Date(value).toLocaleString("zh-CN", { hour12: false, timeZone: "Asia/Shanghai" });
}

function InstallerEvidence({ evidence }: { evidence: CompanionInstallerEvidence }) {
  return <div className="companion-installer-evidence">
    <p className="companion-software-conclusion">{evidence.conclusion}</p>
    <p className="companion-diag-subtle">检查时间：{time(evidence.checkedAt)}；仅检查这个文件当时的静态信息。</p>
    <ul className="companion-software-clues">
      {evidence.clues.map((clue) => <li key={clue}>{clue}</li>)}
    </ul>
    <details>
      <summary>查看文件证据</summary>
      <dl className="companion-diag-properties">
        <dt>文件</dt><dd>{evidence.fileName} · {(evidence.sizeBytes / 1024 ** 2).toFixed(1)} MiB</dd>
        <dt>签名状态</dt><dd>{evidence.signatureStatus}</dd>
        <dt>签名主体</dt><dd>{evidence.signer || "未读取到"}</dd>
        <dt>声明的产品</dt><dd>{evidence.productName || "未读取到"}</dd>
        <dt>声明的公司</dt><dd>{evidence.publisher || "未读取到"}</dd>
        <dt>文件版本</dt><dd>{evidence.fileVersion || "未读取到"}</dd>
        <dt>产品版本</dt><dd>{evidence.productVersion || "未读取到"}</dd>
        <dt>描述</dt><dd>{evidence.fileDescription || "未读取到"}</dd>
        <dt>来源标记</dt><dd>{evidence.zoneId === null ? "未读到下载区域标记" : `ZoneId ${evidence.zoneId}`}；{evidence.sourceHost || "没有可用来源主机"}</dd>
        <dt>SHA-256</dt><dd className="companion-diag-path">{evidence.sha256}</dd>
      </dl>
    </details>
    <p className="companion-diag-subtle">有效签名不能证明没有捆绑；缺少签名也不能证明有害。运行前核对官方来源和安装选项，留意默认勾选的附加软件、浏览器扩展与通知权限。</p>
  </div>;
}

export function CompanionSoftwareView({ api, snapshot, onSnapshot }: {
  api: CompanionToolsApi;
  snapshot: CompanionToolsSnapshot;
  onSnapshot(snapshot: CompanionToolsSnapshot): void;
}) {
  const [installer, setInstaller] = useState<CompanionInstallerEvidence | null>(null);
  const [downloads, setDownloads] = useState<CompanionDownloadsSnapshot | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const active = useRef(true);
  const generation = useRef(0);

  useEffect(() => {
    active.current = true;
    const load = async () => {
      const ownGeneration = generation.current;
      try {
        const result = await api.getDownloadsSnapshot();
        if (active.current && generation.current === ownGeneration) setDownloads(result);
      } catch (failure) {
        if (active.current && generation.current === ownGeneration) setError(String((failure as Error)?.message ?? failure));
      }
    };
    void load();
    const timer = setInterval(() => { void load(); }, 5000);
    return () => {
      active.current = false;
      generation.current += 1;
      clearInterval(timer);
      void api.cancelSoftwareCheck().catch(() => console.warn("软件检查取消未完成。"));
    };
  }, [api]);

  async function run(label: string, action: (isCurrent: () => boolean) => Promise<void>): Promise<void> {
    if (busy) return;
    const ownGeneration = ++generation.current;
    const isCurrent = () => active.current && generation.current === ownGeneration;
    setBusy(label);
    setError("");
    setNotice("");
    try {
      await action(isCurrent);
    } catch (failure) {
      if (isCurrent()) setError(String((failure as Error)?.message ?? failure));
    } finally {
      if (isCurrent()) setBusy("");
    }
  }

  async function cancel(): Promise<void> {
    try {
      await api.cancelSoftwareCheck();
      if (active.current) setNotice("已请求取消，等待本次检查结束。后台下载提醒的开关不会改变。");
    } catch (failure) {
      if (active.current) setError(String((failure as Error)?.message ?? failure));
    }
  }

  const disposedCount = downloads ? downloads.ignoredIds.length
    + Object.values(downloads.snoozedUntil).filter((until) => until > Date.now()).length : 0;

  return <div className="companion-diagnostics companion-software" aria-busy={!!busy}>
    {error && <p className="companion-diag-error" role="alert">{error}</p>}
    {notice && <p className="companion-diag-message" role="status">{notice}</p>}
    {busy && <div className="companion-diag-actions">
      <span className="companion-diag-subtle">正在处理…</span>
      {["installer", "folder", "uninstall"].includes(busy) && <Button size="compact" variant="secondary" onClick={() => void cancel()}>取消本次检查</Button>}
    </div>}
    <GlassCard className="companion-software-installer">
      <div className="companion-diag-heading">
        <div><h2>安装前先核对</h2><p>选择一个 EXE 或 MSI，只读取文件、签名和下载来源标记，不运行安装程序。</p></div>
        <Button disabled={!!busy} onClick={() => void run("installer", async (isCurrent) => {
          setInstaller(null);
          const result = await api.chooseInstaller();
          if (!isCurrent()) return;
          setInstaller(result);
          if (!result) setNotice("已取消安装包检查。");
        })}>选择安装包检查</Button>
      </div>
      {installer ? <InstallerEvidence evidence={installer} /> : <p className="companion-diag-subtle">捆绑行为可能发生在安装过程或后续联网阶段，静态预检无法全面判定。没有证据时会明确显示待确认。</p>}
      <Button variant="secondary" size="compact" disabled={!!busy} onClick={() => void run("security", async () => { await api.openSystemPage("security"); })}>查看 Windows 安全设置</Button>
    </GlassCard>

    <GlassCard className="companion-software-downloads">
      <div className="companion-diag-heading">
        <div><h2>留意下载里的安装包</h2><p>只观察你选择目录的第一层，提醒核对新安装包的来源和选项。</p></div>
        <Button variant="secondary" disabled={!!busy} onClick={() => void run("folder", async (isCurrent) => {
          const result = await api.chooseDownloadsFolder();
          if (!isCurrent()) return;
          if (result) { setDownloads(result); setNotice("目录已选定，勾选下方开关才开始留意。原目录的待提醒记录已清除。"); }
          else setNotice("已取消下载目录选择。");
        })}>{downloads?.folderPath ? "更换下载目录" : "选择下载目录"}</Button>
      </div>
      {downloads?.folderPath && <p className="companion-diag-path">{downloads.folderPath}</p>}
      <label className="companion-diag-monitor-toggle">
        <input type="checkbox" checked={downloads?.enabled ?? false} disabled={!!busy || !downloads?.folderPath}
          onChange={(event) => {
            const enabled = event.target.checked;
            void run("monitor", async (isCurrent) => {
              const result = await api.setDownloadMonitoring(enabled);
              if (isCurrent()) setDownloads(result);
            });
          }} />
        <span>留意此目录里的新安装包</span>
      </label>
      <p className="companion-diag-subtle">启用后先记录现有文件；每 30 秒观察一次，新增 EXE/MSI 至少两轮大小与修改时间不变后才检查。重启会重新建立基线，离线期间的变化不补报。稳定不等于保证下载完成。</p>
      <div className="companion-diag-actions">
        <Button variant="secondary" size="compact" disabled={!!busy || !downloads?.enabled || downloads.scanning}
          onClick={() => void run("downloads", async (isCurrent) => {
            const result = await api.refreshDownloads();
            if (isCurrent()) setDownloads(result);
          })}>{downloads?.scanning ? "正在观察…" : "立即观察"}</Button>
        {disposedCount > 0 && <Button variant="secondary" size="compact" disabled={!!busy}
          onClick={() => void run("restore", async (isCurrent) => {
            const result = await api.resetDownloadIgnored();
            if (isCurrent()) setDownloads(result);
          })}>恢复下载提醒</Button>}
      </div>
      {downloads?.lastError && <p className="companion-diag-error" role="alert">{downloads.lastError}</p>}
      <div className="companion-software-items">
        {downloads?.items.map((item) => <article key={item.id} className="companion-diag-recommendation">
          <h3>{item.fileName}</h3>
          <p className="companion-diag-subtle">发现时间：{time(item.observedAt)}</p>
          {item.evidence && <InstallerEvidence evidence={item.evidence} />}
          {item.error && <p role="alert">检查未完成：{item.error}；不能视为安全或无捆绑。</p>}
          <div className="companion-diag-actions">
            {(["later", "ignore"] as const).map((action) => <Button key={action} variant="secondary" size="compact" disabled={!!busy}
              onClick={() => void run("disposition", async (isCurrent) => {
                const result = await api.setDownloadDisposition(item.id, action);
                if (isCurrent()) setDownloads(result);
              })}>{action === "later" ? "1 小时后提醒" : "不再提醒"}</Button>)}
          </div>
        </article>)}
      </div>
      {downloads && downloads.items.length === 0 && <p className="companion-diag-subtle">目前没有待核对的新安装包。这个清单不证明目录内已有文件安全，也不监测浏览器或程序内部的所有下载行为。</p>}
    </GlassCard>

    <GlassCard className="companion-software-uninstall">
      <div className="companion-diag-heading">
        <div><h2>卸载后的安装目录</h2><p>只核对两个完整登记清单之间消失的软件，使用卸载前记录的安装目录。</p></div>
        <Button variant="secondary" disabled={!!busy || snapshot.scanning} onClick={() => void run("diagnostics", async (isCurrent) => {
          const result = await api.refreshDiagnostics();
          if (isCurrent()) onSnapshot(result);
        })}>刷新软件登记清单</Button>
      </div>
      {snapshot.uninstallRecords.length === 0 && <p className="companion-diag-subtle">尚无可核对的移除记录。第一次检查建立基线；清单不完整时不会认定卸载。旧记录缺少安装目录时只能说明证据不足。</p>}
      <div className="companion-software-items">
        {snapshot.uninstallRecords.map((record) => <article key={record.id} className="companion-diag-recommendation">
          <h3>{record.name} {record.version}</h3>
          <p className="companion-diag-subtle">登记项消失：{time(record.observedAt)}</p>
          <p className="companion-diag-path">{record.installLocation || "卸载前未记录安装目录"}</p>
          {record.result && <p className="companion-software-directory-result">{record.result.explanation}（核对于 {time(record.result.checkedAt)}）</p>}
          <Button variant="secondary" size="compact" disabled={!!busy || snapshot.scanning}
            onClick={() => void run("uninstall", async (isCurrent) => {
              const result = await api.checkUninstallDirectory(record.id);
              if (isCurrent()) onSnapshot(result);
            })}>核对此前安装目录</Button>
        </article>)}
      </div>
      <p className="companion-diag-subtle">目录仍在只表示需要核对，可能包含用户资料或共享组件；未见该目录也不能证明卸载完全干净。这里不猜测 AppData 路径、不扫描全盘、不删除内容。</p>
    </GlassCard>
  </div>;
}
