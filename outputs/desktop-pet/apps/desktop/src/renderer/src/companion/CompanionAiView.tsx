import { useEffect, useRef, useState } from "react";
import type { CompanionAiApi, CompanionAiSnapshot } from "../../../companion-ai-types.js";
import type { CompanionAiManualQuotaInput, CompanionAiProfileSnapshot } from "../../../companion-ai-monitor-types.js";
import { Button } from "../components/ui/Button.js";
import { defaultPetChatAppearance, normalizePetChatAppearance, petChatBackground, petChatFontFamily, type PetChatAppearancePreferences } from "../../../pet-chat-appearance.js";
import "./companion-ai.css";
import { externalAiProgressMessage } from "../../../external-ai-progress.js";
import type { CodexQuotaSnapshot } from "../../../codex-quota-types.js";

const activityLabels: Record<string, string> = {
  idle: "空闲", thinking: "思考中", acting: "处理事情中", responding: "回复中",
  cancelled: "已取消", failed: "未完成", unknown: "尚未接入",
};
function timeLabel(value: number | null): string {
  return value === null ? "尚无记录" : new Date(value).toLocaleString("zh-CN", { hour12: false });
}

export function CompanionAiView({ api, onOpenProviders, onOpenIntegrations, chatAppearance }: {
  readonly api: CompanionAiApi;
  readonly onOpenProviders: () => void;
  readonly onOpenIntegrations?: () => void;
  readonly chatAppearance?: PetChatAppearancePreferences;
}) {
  const [tab, setTab] = useState<"chat" | "quota" | "external">("chat");
  const [snapshot, setSnapshot] = useState<CompanionAiSnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(false);
  const generation = useRef(0);
  const conversationEnd = useRef<HTMLDivElement>(null);
  const configuredAppearance = normalizePetChatAppearance(chatAppearance);
  const appearance = configuredAppearance.enabled ? configuredAppearance : defaultPetChatAppearance;

  async function refresh() {
    const current = ++generation.current;
    const next = await api.getSnapshot();
    if (mounted.current && current === generation.current) setSnapshot(next);
  }
  useEffect(() => {
    mounted.current = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try { await refresh(); }
      catch (reason) {
        if (mounted.current) setError(reason instanceof Error ? reason.message : "宠物大脑暂时不可读取。");
      }
      if (mounted.current) timer = setTimeout(() => { void poll(); }, 1500);
    }
    void poll();
    return () => {
      mounted.current = false;
      generation.current += 1;
      clearTimeout(timer);
    };
  }, [api]);
  useEffect(() => {
    conversationEnd.current?.scrollIntoView({ block: "nearest" });
  }, [snapshot?.conversation.items.length]);
  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      if (mounted.current) await refresh();
    } catch (reason) {
      if (mounted.current) setError(reason instanceof Error ? reason.message : "额度操作未完成。");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return <section className="companion-ai">
    <nav className="cai-tabs" aria-label="宠物大脑内容">
      <button type="button" aria-current={tab === "chat" ? "page" : undefined} className={tab === "chat" ? "active" : ""} onClick={() => setTab("chat")}>对话</button>
      <button type="button" aria-current={tab === "quota" ? "page" : undefined} className={tab === "quota" ? "active" : ""} onClick={() => setTab("quota")}>对话 AI 额度</button>
      <button type="button" aria-current={tab === "external" ? "page" : undefined} className={tab === "external" ? "active" : ""} onClick={() => setTab("external")}>外部 AI 监测</button>
    </nav>
    {error && <p className="cai-error" role="alert">{error}</p>}
    {notice && <p className="cai-notice" role="status">{notice}</p>}
    {!snapshot && <p className="cai-empty" role="status">正在读取宠物大脑…</p>}
    {snapshot && tab === "chat" && <div className="cai-chat">
      <div className="cai-section-heading">
        <strong>桌宠对话</strong>
        <span className="cai-state">{activityLabels[snapshot.conversation.activity] ?? snapshot.conversation.activity}</span>
      </div>
      <p className="cai-hint">右键桌宠选择“对话”，或连续两次右键，打开输入框。提醒与协同回复也会显示在这里。</p>
      <div className="cai-messages" aria-label="桌宠对话记录" aria-live="polite">
        {snapshot.conversation.items.length === 0 && <p className="cai-empty">还没有对话。接入宠物大脑后，从桌宠旁的输入框开始聊天。</p>}
        {snapshot.conversation.items.map((item) => {
          const surface = item.role === "user" ? appearance.input : appearance.answer;
          return <article key={item.id} className={`cai-message ${item.role}`} style={{
            fontFamily: petChatFontFamily(appearance.fontFamily), fontSize: appearance.fontSize,
            fontWeight: appearance.fontWeight, background: petChatBackground(surface), color: surface.textColor,
            border: `${surface.borderWidth}px solid ${surface.borderColor}`, borderRadius: surface.radius,
            boxShadow: surface.shadow ? "0 8px 20px rgba(15, 23, 42, 0.14), 0 2px 5px rgba(15, 23, 42, 0.08)" : "none",
          }}>
            <header className="cai-message-meta">
              <span>{item.role === "user" ? "你" : item.role === "assistant" ? "桌宠" : "操作结果"}</span>
              <time dateTime={item.createdAt ? new Date(item.createdAt).toISOString() : undefined}>
                {item.createdAt ? timeLabel(item.createdAt) : "时间未记录"}
              </time>
            </header>
            <p>{item.text}</p>
          </article>;
        })}
        <div ref={conversationEnd} />
      </div>
    </div>}
    {snapshot && tab === "quota" && <div className="cai-monitor">
      <div className="cai-section-heading"><h3>桌宠对话 AI</h3><small>更新于 {timeLabel(snapshot.monitor.sampledAt)}</small></div>
      <p className="cai-hint">此处是与你的桌宠对话的来源；与 Codex、ZCode 等外部工具的会话和账户分别记录。</p>
      {snapshot.monitor.lastError && <p className="cai-error" role="alert">{snapshot.monitor.lastError}</p>}
      {snapshot.monitor.profiles.length === 0 && <div className="cai-empty">
        <p>尚未接入 AI。</p><Button variant="secondary" onClick={onOpenProviders}>接入宠物大脑</Button>
      </div>}
      {snapshot.monitor.profiles.map((profile) => <ProfileQuota key={profile.id} profile={profile} disabled={busy}
        onQuery={() => { void run(async () => { await api.queryQuota(profile.id); }); }}
        onSave={(input) => { void run(async () => {
          await api.setManualQuota(profile.id, input);
          if (mounted.current) setNotice("已保存手动记录。");
        }); }}
        onClear={() => { void run(async () => { await api.clearManualQuota(profile.id); }); }}
      />)}
    </div>}
    {snapshot && tab === "external" && <div className="cai-monitor">
      {snapshot.monitor.externalQuotas?.map((quota) => <CodexExternalQuota key={quota.provider} quota={quota} disabled={busy}
        available={Boolean(api.setCodexQuotaMonitoring && api.queryExternalQuota)}
        onEnabled={(enabled) => { void run(async () => { await api.setCodexQuotaMonitoring?.(enabled); }); }}
        onQuery={() => { void run(async () => { await api.queryExternalQuota?.(); }); }}
      />)}
      <div className="cai-section-heading"><h3>外部 AI 会话</h3><small>更新于 {timeLabel(snapshot.monitor.sampledAt)}</small></div>
      <p className="cai-hint">一个桌宠可接收多个会话的真实工作事件；配置存在不代表工具正在运行。文件数为本轮已收到的成功编辑事件，未覆盖的工具修改不计入。</p>
      {snapshot.monitor.agents.length === 0 && <div className="cai-empty"><p>尚未收到外部会话事件。完成 Hooks 接入并在原工具中新建会话后显示。</p>
        {onOpenIntegrations && <Button variant="secondary" onClick={onOpenIntegrations}>连接外部 AI 工具</Button>}</div>}
      {snapshot.monitor.agents.map((agent) => <article key={agent.id} className="cai-card">
        <div className="cai-section-heading"><h3>{agent.label}{agent.progress ? ` · 会话 ${agent.progress.sessionId.slice(0, 6)}` : ""}</h3>
          <span className="cai-state">{{ busy: "工作中", idle: "空闲", stale: "状态待确认", disconnected: "已结束", unknown: "未知" }[agent.activity.state]}</span></div>
        {agent.progress && <><p>{agent.activity.state === "stale" || agent.activity.state === "disconnected" ? "上次活动：" : ""}{externalAiProgressMessage(agent.progress)}</p>
          {agent.progress.toolName && <small>工具：{agent.progress.toolName}</small>}
          <p>已编辑{agent.progress.fileCountLimited ? "至少" : ""} {agent.progress.editedFileCount} 个文件</p></>}
        <p className="cai-hint">{agent.activity.reason} · {timeLabel(agent.activity.lastSeenAt)}</p>
        <p>{agent.progress?.adapter === "codex" ? "本会话账户归属：未提供" : "账户额度：未知"}</p><p className="cai-hint">{agent.quota.reason}</p>
      </article>)}
    </div>}
  </section>;
}

function CodexExternalQuota({ quota, disabled, available, onEnabled, onQuery }: {
  quota: CodexQuotaSnapshot;
  disabled: boolean;
  available: boolean;
  onEnabled: (enabled: boolean) => void;
  onQuery: () => void;
}) {
  const labels = { disabled: "未启用", checking: "查询中", fresh: "官方记录", stale: "记录过期", unknown: "额度未知" };
  return <article className="cai-card">
    <div className="cai-section-heading"><h3>Codex 官方账户额度</h3><span className="cai-state">{labels[quota.status]}</span></div>
    <label className="cai-field">
      <span><input type="checkbox" checked={quota.enabled} disabled={!available}
        onChange={(event) => onEnabled(event.target.checked)} /> 启用只读监测</span>
    </label>
    <p className="cai-hint">读取当前配置的 Codex CLI 已登录账户，每两分钟查询一次。多个窗口共享账户限制；与桌宠对话 AI 分别记录。</p>
    <div className="cai-section-heading">
      <small>{quota.cliVersion ? `CLI ${quota.cliVersion}` : "CLI 版本未取得"} · {timeLabel(quota.recordedAt)}</small>
      <Button variant="secondary" size="compact" disabled={disabled || !available || !quota.enabled || quota.status === "checking"} onClick={onQuery}>立即查询</Button>
    </div>
    {quota.windows.map((window) => <div className="cai-quota" key={`${window.limitId}:${window.window}`}>
      <strong>{window.label} · {window.window === "primary" ? "主窗口" : "次窗口"}{window.windowDurationMins !== null ? `（${window.windowDurationMins} 分钟）` : ""}</strong>
      <p>已用 {window.usedPercent}% · 剩余 {window.remainingPercent}%</p>
      <small>恢复时间：{window.resetsAt === null ? "官方未提供" : timeLabel(window.resetsAt)}</small>
    </div>)}
    <p className="cai-hint">{quota.reason}</p>
  </article>;
}

function ProfileQuota({ profile, disabled, onQuery, onSave, onClear }: {
  profile: CompanionAiProfileSnapshot;
  disabled: boolean;
  onQuery: () => void;
  onSave: (input: CompanionAiManualQuotaInput) => void;
  onClear: () => void;
}) {
  const [remaining, setRemaining] = useState("");
  const [used, setUsed] = useState("");
  const [unit, setUnit] = useState<CompanionAiManualQuotaInput["unit"]>("percent");
  const [reset, setReset] = useState("");
  const [error, setError] = useState("");
  const manual = profile.quota.source === "manual";
  const official = profile.officialQuota;
  const quotaSupported = Boolean(profile.officialQuotaProvider);
  const configuration = profile.configuration === "ready" ? "已配置" : profile.configuration === "missing-secret" ? "缺少凭据" : "配置未就绪";
  return <article className="cai-card">
    <div className="cai-section-heading"><div><h3>{profile.label}</h3><small>{profile.model || "未指定模型"}</small></div><span className="cai-state">{configuration}</span></div>
    <div className="cai-quota">
      <div className="cai-section-heading">
        <strong>{profile.officialQuotaProvider === "deepseek" ? "官方账户余额" : profile.officialQuotaProvider === "openrouter" ? "官方 key 剩余支出上限" : "官方额度来源"}</strong>
        {quotaSupported && <Button variant="secondary" size="compact" disabled={disabled || profile.configuration !== "ready"} onClick={onQuery}>查询额度</Button>}
      </div>
      {official ? <>
        {official.balances.map((balance, index) => <p key={index}>{balance.remaining === null ? official.kind === "key-spending-limit" ? "未设置 key 支出上限" : "余额未提供" : `${balance.remaining} ${balance.unit}`}</p>)}
        <small>{official.status === "stale" ? "记录已超过 5 分钟" : "官方接口返回"} · {timeLabel(official.recordedAt)}</small>
      </> : <p className="cai-hint">{quotaSupported
        ? profile.configuration === "ready" ? "尚未查询；点击后从官方接口获取当前记录。" : "请先完成来源配置并保存凭据，再查询官方额度。"
        : "此来源尚未接入官方额度查询，请在提供方后台核对；也可手动记录。"}</p>}
    </div>
    <details className="cai-manual-quota"><summary>配置手动用量与额度</summary>
      <form className="cai-quota-form" onSubmit={(event) => {
        event.preventDefault();
        const available = Number(remaining);
        const consumed = used.trim() ? Number(used) : null;
        const resetsAt = reset ? new Date(reset).getTime() : null;
        const maximum = unit === "percent" ? 100 : 1_000_000_000_000;
        if (!remaining.trim() || !Number.isFinite(available) || available < 0 || available > maximum
          || consumed !== null && (!Number.isFinite(consumed) || consumed < 0 || consumed > maximum)
          || resetsAt !== null && (!Number.isSafeInteger(resetsAt) || resetsAt <= 0)) {
          setError("请填写有效的非负数值；百分比范围为 0 到 100。");
          return;
        }
        setError("");
        onSave({ remaining: available, used: consumed, unit, resetsAt });
      }}>
        <label className="cai-field">已用（可选）<input type="number" min="0" max={unit === "percent" ? 100 : 1_000_000_000_000} step="any" value={used} disabled={disabled} onChange={(event) => setUsed(event.target.value)} /></label>
        <label className="cai-field">剩余<input type="number" min="0" max={unit === "percent" ? 100 : 1_000_000_000_000} step="any" value={remaining} disabled={disabled} onChange={(event) => setRemaining(event.target.value)} required /></label>
        <label className="cai-field">单位<select value={unit} disabled={disabled} onChange={(event) => setUnit(event.target.value as CompanionAiManualQuotaInput["unit"])}><option value="percent">百分比 %</option><option value="credits">credits</option><option value="requests">请求次数</option><option value="tokens">token</option><option value="CNY">人民币 CNY</option><option value="USD">美元 USD</option></select></label>
        <label className="cai-field">重置时间（可选）<input type="datetime-local" value={reset} disabled={disabled} onChange={(event) => setReset(event.target.value)} /></label>
        {error && <p className="cai-error" role="alert">{error}</p>}
        <div className="cai-actions"><Button type="submit" disabled={disabled} size="compact">保存记录</Button><Button variant="secondary" disabled={disabled || !manual} size="compact" onClick={onClear}>清除记录</Button></div>
      </form>
    </details>
  </article>;
}
