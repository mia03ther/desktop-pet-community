import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./integrations.css";
import { displayProductText, useI18n } from "../i18n.js";
import { Button } from "../components/ui/Button.js";
import { GlassCard } from "../components/ui/GlassCard.js";
import { StatusPill } from "../components/ui/StatusPill.js";
import { IntegrationIcon } from "./IntegrationIcon.js";
import { PathField } from "./PathField.js";
import {
  CloseIcon,
  ConfigureIcon,
  HookIcon,
  InstallIcon,
  MemoryIcon,
  NextIcon,
  RefreshIcon,
  RemoveIcon,
  ReplaceIcon,
} from "./icons.js";
import type {
  AgentSetupAction,
  AgentSetupCommandPaths,
  AgentSetupSnapshot,
  ClaudeCodeStatus,
  CursorSetupStatus,
  IntegrationsApi,
  IntegrationsViewProps,
  IntegrationStatusTone,
  OpenClawPluginStatus,
  OpenClawSetupState,
  OpenCodeSetupStatus,
  ZedSetupStatus,
} from "./types.js";

function IntegrationCopy({ children, label }: { children: React.ReactNode; label?: string }) {
  const [notice, setNotice] = useState("");
  const content = React.Children.toArray(children).map((item) => typeof item === "string" || typeof item === "number" ? String(item) : "").join("").trim();
  return <div className="integration-command-copy">
    <Button variant="secondary" onClick={() => {
      void navigator.clipboard.writeText(content)
        .then(() => setNotice("已复制"))
        .catch(() => setNotice("复制失败，请重试"));
    }}>{label ?? (content.startsWith("{") ? "复制配置" : "复制命令")}</Button>
    {notice && <span role="status">{notice}</span>}
  </div>;
}

export const commandModeLabelKeys: Record<AgentSetupSnapshot["commandMode"], string> = {
  published: "integrations.commandMode.published",
  bundled: "integrations.commandMode.bundled",
  local: "integrations.commandMode.local",
};

type IntegrationBadgeState =
  | AgentSetupSnapshot["status"]["state"]
  | AgentSetupSnapshot["opencodeStatus"]["state"]
  | AgentSetupSnapshot["cursorStatus"]["state"]
  | AgentSetupSnapshot["zedStatus"]["state"]
  | AgentSetupSnapshot["hookStatus"]["status"]
  | AgentSetupSnapshot["memoryStatus"]["state"];

const integrationBadgeLabels: Record<IntegrationBadgeState, string> = {
  configured: "已配置",
  detected: "已检测到",
  not_detected: "未检测到",
  needs_setup: "待配置",
  needs_update: "待更新",
  error: "状态异常",
  conflict: "存在冲突",
  disabled: "已禁用",
  installed: "已安装",
  custom: "自定义",
};

export function claudeStatusTone(state: ClaudeCodeStatus["state"]): IntegrationStatusTone {
  if (state === "configured") return "green";
  if (state === "error") return "red";
  if (state === "needs_setup" || state === "detected") return "blue";
  return "slate";
}

export function opencodeStatusTone(state: OpenCodeSetupStatus["state"]): IntegrationStatusTone {
  if (state === "configured") return "green";
  if (state === "error") return "red";
  if (state === "needs_setup") return "blue";
  return "slate";
}

export function cursorStatusTone(state: CursorSetupStatus["state"]): IntegrationStatusTone {
  if (state === "configured") return "green";
  if (state === "error" || state === "conflict") return "red";
  if (state === "needs_update") return "orange";
  if (state === "needs_setup") return "blue";
  return "slate";
}

export function openclawStatusTone(state: OpenClawSetupState): IntegrationStatusTone {
  if (state === "installed-enabled") return "green";
  if (state === "installed-disabled") return "yellow";
  if (state === "not-installed") return "blue";
  if (state === "invalid" || state === "conflict") return "red";
  if (state === "indeterminate") return "orange";
  return "slate";
}

export function openclawStatusLabel(state: OpenClawSetupState, t: (key: string) => string): string {
  return t(`integrations.openclaw.state.${state}`);
}

export function openclawSourceLabel(source: OpenClawPluginStatus["trackedSource"], t: (key: string) => string): string {
  return source ? t(`integrations.openclaw.source.${source}`) : t("integrations.openclaw.source.none");
}

export function zedStatusTone(state: ZedSetupStatus["state"]): IntegrationStatusTone {
  if (state === "configured") return "green";
  if (state === "error" || state === "conflict") return "red";
  if (state === "disabled" || state === "needs_update") return "orange";
  if (state === "needs_setup") return "blue";
  return "slate";
}

export function IntegrationsView({ api: injectedApi }: IntegrationsViewProps) {
  const { t } = useI18n();
  const api = injectedApi ?? (window as unknown as { openPetsControlCenter: IntegrationsApi }).openPetsControlCenter;

  const [snapshot, setSnapshot] = useState<AgentSetupSnapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<"remove" | "update" | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const previousFocus = document.activeElement;
    const closeButton = dialogRef.current?.querySelector<HTMLButtonElement>(
      ".integration-inspector-head button",
    );
    closeButton?.focus();

    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [selectedId]);

  const load = async (selectedPetId?: string, commandMode?: AgentSetupSnapshot["commandMode"]) => {
    try {
      const petId = selectedPetId === undefined ? snapshot?.selectedPetId : selectedPetId;
      const mode = commandMode === undefined ? snapshot?.commandMode : commandMode;
      const next = await api.getIntegrationsState(petId, mode);
      setSnapshot(next);
      setError("");
    } catch (err) {
      setError(displayProductText(String((err as Error)?.message ?? err)));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const run = async (label: string, action: AgentSetupAction) => {
    try {
      setBusy(label);
      setError("");
      setMessage("");
      const next = await api.runIntegrationAction(action, snapshot?.selectedPetId, snapshot?.commandMode);
      setSnapshot(next);
      if (next.lastAction) {
        if (next.lastAction.ok) setMessage(displayProductText(next.lastAction.message));
        else setError(displayProductText(next.lastAction.message));
      }
    } catch (err) {
      setError(displayProductText(String((err as Error)?.message ?? err)));
    } finally {
      setBusy("");
    }
  };

  const updatePath = async (key: keyof AgentSetupCommandPaths, value: string) => {
    try {
      setBusy(t("integrations.busy.savingPath"));
      await api.updateIntegrationCommandPaths({ [key]: value });
      await load();
      setMessage(t("integrations.toast.pathSaved"));
    } catch (err) {
      setError(displayProductText(String((err as Error)?.message ?? err)));
    } finally {
      setBusy("");
    }
  };

  const changeCommandMode = (mode: AgentSetupSnapshot["commandMode"]) => {
    void load(snapshot?.selectedPetId, mode);
  };

  if (!snapshot) {
    return (
      <GlassCard className="integration-loading">
        <p className="text-sm font-semibold text-slatecopy">{error || t("integrations.loading")}</p>
        {error && (
          <Button variant="secondary" size="compact" icon={<RefreshIcon />} onClick={() => void load()}>
            {t("common.retry")}
          </Button>
        )}
      </GlassCard>
    );
  }

  const isBusy = Boolean(busy) || snapshot.busy;
  const integrationDialogTitleId = selectedId ? `integration-detail-title-${selectedId}` : undefined;
  const selectedExternal = snapshot.externalIntegrations?.find((item) => item.id === selectedId);

  const integrations = [
    ...(snapshot.externalIntegrations ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      icon: item.id,
      status: item.label,
      tone: (item.state === "configured" ? "green" : item.state === "error" || item.state === "conflict" ? "red" : "blue") as IntegrationStatusTone,
      description: item.description,
    })),
    {
      id: "claude",
      name: t("integrations.claude.name"),
      icon: "claude",
      status: snapshot.status.label,
      tone: claudeStatusTone(snapshot.status.state),
      description: t("integrations.claude.description"),
    },
    {
      id: "opencode",
      name: t("integrations.opencode.name"),
      icon: "opencode",
      status: snapshot.opencodeStatus.label,
      tone: opencodeStatusTone(snapshot.opencodeStatus.state),
      description: t("integrations.opencode.description"),
    },
    {
      id: "cursor",
      name: t("integrations.cursor.name"),
      icon: "cursor",
      status: snapshot.cursorStatus.label,
      tone: cursorStatusTone(snapshot.cursorStatus.state),
      description: t("integrations.cursor.description"),
    },
    {
      id: "openclaw",
      name: t("integrations.openclaw.name"),
      icon: "openclaw",
      status: snapshot.openclawStatus.label,
      tone: openclawStatusTone(snapshot.openclawStatus.state),
      description: t("integrations.openclaw.description"),
    },
    {
      id: "zed",
      name: t("integrations.zed.name"),
      icon: "zed",
      status: snapshot.zedStatus.label,
      tone: zedStatusTone(snapshot.zedStatus.state),
      description: t("integrations.zed.description"),
    },
    {
      id: "pi",
      name: t("integrations.pi.name"),
      icon: "pi",
      status: t("integrations.pi.status"),
      tone: "blue" satisfies IntegrationStatusTone,
      description: t("integrations.pi.description"),
    },
  ] as const;

  const soon = [
    { name: t("integrations.soon.vscode"), icon: "vscode" },
    { name: t("integrations.soon.windsurf"), icon: "windsurf" },
  ];

  const selectedIntegrationName =
    selectedId === "pi"
      ? t("integrations.pi.name")
      : integrations.find((item) => item.id === selectedId)?.name;

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setSelectedId(null);
      setConfirmingAction(null);
      return;
    }
    if (event.key !== "Tab") {
      return;
    }

    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        ".integration-inspector button:not(:disabled), .integration-inspector input:not(:disabled), .integration-inspector select:not(:disabled), .integration-inspector textarea:not(:disabled), .integration-inspector summary",
      ) ?? [],
    ).filter((control) => control.getClientRects().length > 0);
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];

    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl?.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl?.focus();
    }
  };

  return (
    <div className="studio-integrations" aria-busy={isBusy}>
      <header className="integration-introduction">
        <div>
          <h2>连接外部 AI 工具</h2>
          <p>
            配置工具与桌宠的连接，让桌宠响应工作状态。
            桌宠自己的对话来源在“接入 AI”中配置。
          </p>
        </div>
        <Button
          variant="secondary"
          size="compact"
          icon={<RefreshIcon />}
          disabled={isBusy}
          onClick={() => void load()}
        >
          {t("integrations.refreshStatus")}
        </Button>
      </header>
      {!selectedId && error && (
        <div className="integration-notice integration-notice-error" role="alert">
          {error}
        </div>
      )}
      {!selectedId && message && (
        <div className="integration-notice integration-notice-success" role="status">
          {message}
        </div>
      )}
      {!selectedId && isBusy && (
        <div className="integration-notice" role="status">
          {busy || "正在处理接入配置…"}
        </div>
      )}

      <div className="integration-grid integration-catalog">
        {integrations.map((item) => (
          <article
            key={item.id}
            className="integration-card integration-setup-card"
            data-integration={item.id}
            data-selected={selectedId === item.id}
          >
            <div className="integration-card-body">
              <div className="integration-card-icon">
                <IntegrationIcon id={item.icon} />
              </div>
              <div className="integration-card-content">
                <div className="integration-card-heading">
                  <strong>{item.name}</strong>
                  <StatusPill tone={item.tone}>{item.status}</StatusPill>
                </div>
                <small>{item.description}</small>
                {snapshot.externalIntegrations?.find((external) => external.id === item.id) && <small className="integration-readiness">
                  {snapshot.externalIntegrations.find((external) => external.id === item.id)?.program.label} · 真实会话待确认
                </small>}
              </div>
            </div>
            <div className="integration-card-footer">
              <div className="integration-card-actions">
                {snapshot.externalIntegrations?.find((external) => external.id === item.id && external.canInstall) && (
                  <Button variant="primary" size="compact" icon={<InstallIcon />} disabled={isBusy}
                    onClick={() => void run("正在配置连接…", `${item.id}-install` as AgentSetupAction)}>
                    {snapshot.externalIntegrations.find((external) => external.id === item.id)?.installLabel}
                  </Button>
                )}
                {item.id === "claude" && snapshot.status.canConfigure && (
                  <Button
                    variant="primary"
                    size="compact"
                    icon={<InstallIcon />}
                    disabled={isBusy}
                    onClick={() => run(t("integrations.busy.installing"), "configure")}
                  >
                    {t("integrations.install")}
                  </Button>
                )}
                {item.id === "opencode" && snapshot.opencodeStatus.canInstall && (
                  <Button
                    variant="primary"
                    size="compact"
                    icon={<InstallIcon />}
                    disabled={isBusy}
                    onClick={() => run(t("integrations.busy.installing"), "opencode-install")}
                  >
                    {t("integrations.install")}
                  </Button>
                )}
                {item.id === "cursor" && snapshot.cursorStatus.canInstall && (
                  <Button
                    variant="primary"
                    size="compact"
                    icon={<InstallIcon />}
                    disabled={isBusy}
                    onClick={() => run(t("integrations.busy.installing"), "cursor-install")}
                  >
                    {t("integrations.install")}
                  </Button>
                )}
                {item.id === "openclaw" && (snapshot.openclawStatus.canInstall || snapshot.openclawStatus.canEnable) && (
                  <Button
                    variant="primary"
                    size="compact"
                    icon={<InstallIcon />}
                    disabled={isBusy}
                    onClick={() =>
                      run(
                        snapshot.openclawStatus.canEnable && !snapshot.openclawStatus.canInstall
                          ? t("integrations.openclaw.busy.enabling")
                          : t("integrations.busy.installing"),
                        "openclaw-install",
                      )
                    }
                  >
                    {snapshot.openclawStatus.canEnable && !snapshot.openclawStatus.canInstall
                      ? t("integrations.openclaw.enable")
                      : t("integrations.install")}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="compact"
                  icon={<ConfigureIcon />}
                  fullWidth={item.id === "pi"}
                  onClick={() => {
                    setSelectedId(item.id);
                    setConfirmingAction(null);
                  }}
                >
                  {item.id === "pi" ? t("integrations.viewSetup") : t("integrations.configure")}
                </Button>
                {item.id === "zed" && snapshot.zedStatus.canInstall && (
                  <Button
                    variant="primary"
                    size="compact"
                    icon={<InstallIcon />}
                    disabled={isBusy}
                    onClick={() => run(t("integrations.busy.installing"), "zed-install")}
                  >
                    {t("integrations.install")}
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <section className="integration-upcoming" aria-label={t("integrations.soon.status")}>
        <h3>{t("integrations.soon.status")}</h3>
        <div className="integration-grid integration-catalog">
          {soon.map((item) => (
            <article
              key={item.name}
              className="integration-card integration-setup-card integration-unavailable"
            >
              <div className="integration-card-body">
                <div className="integration-card-icon">
                  <IntegrationIcon id={item.icon} />
                </div>
                <div className="integration-card-content">
                  <div className="integration-card-heading">
                    <strong>{item.name}</strong>
                    <StatusPill tone="slate">{t("integrations.soon.status")}</StatusPill>
                  </div>
                  <small>{t("integrations.soon.description")}</small>
                </div>
              </div>
              <div className="integration-card-footer">
                <Button variant="secondary" size="compact" fullWidth disabled>
                  {t("integrations.soon.button")}
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedId && createPortal(
        <div
          className="studio-integrations plugin-config-overlay integration-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby={integrationDialogTitleId}
          ref={dialogRef}
          onKeyDown={handleDialogKeyDown}
        >
          <button
            className="plugin-config-backdrop integration-backdrop"
            type="button"
            aria-label={t("integrations.closeAria")}
            tabIndex={-1}
            onClick={() => {
              setSelectedId(null);
              setConfirmingAction(null);
            }}
          />
          <GlassCard className="plugin-inspector integration-inspector">
            <div className="plugin-inspector-head integration-inspector-head">
              <div className="integration-inspector-icon">
                <IntegrationIcon id={selectedId} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="eyebrow">{t("integrations.detail")}</p>
                <h2 id={integrationDialogTitleId}>{selectedIntegrationName}</h2>
              </div>
              <Button
                variant="secondary"
                size="compact"
                icon={<CloseIcon />}
                onClick={() => {
                  setSelectedId(null);
                  setConfirmingAction(null);
                }}
              >
                {t("integrations.close")}
              </Button>
            </div>

            <div className="integration-inspector-body">
              {error && (
                <div className="integration-notice integration-notice-error" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <div className="integration-notice integration-notice-success" role="status">
                  {message}
                </div>
              )}
              {isBusy && (
                <div className="integration-notice" role="status">
                  {busy || "正在处理接入配置…"}
                </div>
              )}
              {selectedExternal && <>
                <section className="integration-section">
                  <div className="integration-section-title"><small>程序检测</small><strong>{selectedExternal.program.label}</strong></div>
                  <p className="text-sm text-slatecopy leading-relaxed">{selectedExternal.program.details}</p>
                </section>
                <section className="integration-section">
                  <div className="integration-section-title"><small>连接配置</small><strong>{selectedExternal.label}</strong></div>
                  <p className="text-sm text-slatecopy leading-relaxed">{selectedExternal.details}</p>
                  {selectedExternal.configPath && <p className="integration-file-path">{selectedExternal.configPath}</p>}
                </section>
                <section className="integration-section">
                  <div className="integration-section-title"><small>近期真实事件</small><strong>会话待确认</strong></div>
                  <p className="text-sm text-slatecopy leading-relaxed">{selectedExternal.session.details}</p>
                </section>
                <section className="integration-section">
                  <PathField label="Node.js 可执行文件" value={snapshot.commandPaths.node} placeholder="自动检测，或填写 node.exe 完整路径"
                    onSave={(value) => void updatePath("node", value)} disabled={isBusy} />
                  {selectedExternal.id === "codex" && <PathField label="Codex CLI 可执行文件" value={snapshot.commandPaths.codex ?? ""} placeholder="留空自动检测，或填写 codex.exe 完整路径"
                    onSave={(value) => void updatePath("codex", value)} disabled={isBusy} />}
                  {selectedExternal.id === "deepseek-harness" && <>
                    <PathField label="DeepSeek Harness 可执行文件" value={snapshot.commandPaths.dsh ?? ""} placeholder="填写完整路径，留空自动检测"
                      onSave={(value) => void updatePath("dsh", value)} disabled={isBusy} />
                    <PathField label="DeepSeek Harness 配置档案" value={snapshot.commandPaths.dshProfile ?? "web"} placeholder="web 或 desktop"
                      onSave={(value) => void updatePath("dshProfile", value)} disabled={isBusy} />
                  </>}
                </section>
                <section className="integration-section">
                  <div className="integration-section-title"><small>官方接入路径</small><strong>完成连接</strong></div>
                  <ol className="integration-setup-steps">{selectedExternal.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ol>
                  <div className="integration-management-actions">
                    {selectedExternal.canInstall && <Button variant="primary" disabled={isBusy} icon={<InstallIcon />}
                      onClick={() => void run("正在配置连接…", `${selectedExternal.id}-install` as AgentSetupAction)}>{selectedExternal.installLabel}</Button>}
                    {selectedExternal.canTest && <Button variant="secondary" disabled={isBusy}
                      onClick={() => void run("正在测试本机桌宠链路…", `${selectedExternal.id}-test` as AgentSetupAction)}>测试桌宠联动</Button>}
                    <Button variant="secondary" disabled={isBusy}
                      onClick={() => void run("打开官方文档", `${selectedExternal.id}-docs` as AgentSetupAction)}>官方文档</Button>
                    {selectedExternal.canRemove && <Button variant="danger" disabled={isBusy} icon={<RemoveIcon />}
                      onClick={() => setConfirmingAction("remove")}>移除连接</Button>}
                  </div>
                  {confirmingAction === "remove" && <div className="integration-notice">
                    <p>移除本项目添加的连接配置，保留原有工具设置。</p>
                    <div className="integration-management-actions">
                      <Button variant="danger" disabled={isBusy} onClick={() => { setConfirmingAction(null); void run("正在移除连接…", `${selectedExternal.id}-remove` as AgentSetupAction); }}>确认移除</Button>
                      <Button variant="secondary" disabled={isBusy} onClick={() => setConfirmingAction(null)}>取消</Button>
                    </div>
                  </div>}
                </section>
                {selectedExternal.preview && <section className="integration-section">
                  <div className="integration-section-title"><small>开发者配置</small><strong>配置与桥接示例</strong></div>
                  <IntegrationCopy label="复制接入配置">{selectedExternal.preview}</IntegrationCopy>
                </section>}
              </>}
              {!selectedExternal && selectedId !== "pi" && selectedId !== "openclaw" && (
                <section className="integration-section">
                  <div className="integration-section-title">
                    <small>{t("integrations.commandSource")}</small>
                    <strong>{t("integrations.cliMode")}</strong>
                  </div>
                  <select
                    className="integration-select"
                    value={snapshot.commandMode}
                    disabled={isBusy}
                    onChange={(event) =>
                      changeCommandMode(event.target.value as AgentSetupSnapshot["commandMode"])
                    }
                  >
                    <option value="published">{t(commandModeLabelKeys.published)}</option>
                    <option value="bundled">{t(commandModeLabelKeys.bundled)}</option>
                    <option value="local" disabled={!snapshot.localDevAvailable}>
                      {t(commandModeLabelKeys.local)}
                      {snapshot.localDevAvailable ? "" : t("integrations.localUnavailable")}
                    </option>
                  </select>
                  <p className="text-xs text-slatecopy mt-2">{t("integrations.commandModeHelp")}</p>
                </section>
              )}

              {selectedId === "claude" && (
                <>
                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.connection")}</small>
                      <strong>{t("integrations.statusRouting")}</strong>
                    </div>
                    <div className="integration-connection-state">
                      <div className="flex flex-col">
                        <strong className="text-sm text-navy">{snapshot.status.label}</strong>
                        <small className="text-xs text-slatecopy">{displayProductText(snapshot.status.details)}</small>
                      </div>
                      <StatusPill tone={claudeStatusTone(snapshot.status.state)}>
                        {integrationBadgeLabels[snapshot.status.state]}
                      </StatusPill>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-bold text-slatecopy uppercase tracking-wider mb-1 block">
                        {t("integrations.petRouting")}
                      </label>
                      <select
                        className="integration-select"
                        value={snapshot.selectedPetId || ""}
                        onChange={(e) => void load(e.target.value)}
                        disabled={isBusy}
                      >
                        <option value="">{t("integrations.defaultPet")}</option>
                        {snapshot.petOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.configuration")}</small>
                      <strong>{t("integrations.commandPaths")}</strong>
                    </div>
                    <div className="flex flex-col gap-3">
                      <PathField
                        label={t("integrations.claudeCommand")}
                        value={snapshot.commandPaths.claude}
                        placeholder="claude"
                        onSave={(v) => updatePath("claude", v)}
                        disabled={isBusy}
                      />
                      <PathField
                        label={t("integrations.nodeCommand")}
                        value={snapshot.commandPaths.node}
                        placeholder="node"
                        onSave={(v) => updatePath("node", v)}
                        disabled={isBusy}
                      />
                    </div>
                  </section>

                  <div className="integration-option-grid">
                    <section className="integration-section">
                      <div className="integration-section-title">
                        <small>{t("integrations.optional")}</small>
                        <strong>{t("integrations.claudeHooks")}</strong>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusPill tone={snapshot.hookStatus.status === "installed" ? "green" : "blue"}>
                          {integrationBadgeLabels[snapshot.hookStatus.status]}
                        </StatusPill>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="primary"
                          size="compact"
                          icon={<HookIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.installingHooks"), "install-hooks")}
                        >
                          {t("integrations.installHooks")}
                        </Button>
                        <Button
                          variant="danger"
                          size="compact"
                          icon={<RemoveIcon />}
                          disabled={isBusy || snapshot.hookStatus.status === "needs_setup"}
                          onClick={() => run(t("integrations.busy.removingHooks"), "uninstall-hooks")}
                        >
                          {t("integrations.removeHooks")}
                        </Button>
                      </div>
                    </section>
                    <section className="integration-section">
                      <div className="integration-section-title">
                        <small>{t("integrations.included")}</small>
                        <strong>{t("integrations.instructions")}</strong>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <StatusPill tone={snapshot.memoryStatus.state === "installed" ? "green" : "blue"}>
                          {integrationBadgeLabels[snapshot.memoryStatus.state]}
                        </StatusPill>
                      </div>
                      <Button
                        variant="secondary"
                        size="compact"
                        icon={<MemoryIcon />}
                        disabled={isBusy}
                        onClick={() => run(t("integrations.busy.updatingInstructions"), "install-memory")}
                      >
                        {t("integrations.updateInstructions")}
                      </Button>
                    </section>
                  </div>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.actions")}</small>
                      <strong>{t("integrations.management")}</strong>
                    </div>
                    <div className="integration-management-actions">
                      {snapshot.status.canConfigure && (
                        <Button
                          variant="primary"
                          icon={<InstallIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.installing"), "configure")}
                        >
                          {t("integrations.installMcp")}
                        </Button>
                      )}
                      {snapshot.status.canReplace && (
                        <Button
                          variant="warning"
                          icon={<ReplaceIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.replacing"), "replace")}
                        >
                          {t("integrations.replaceMcp")}
                        </Button>
                      )}
                      {snapshot.status.canRemove && (
                        <Button
                          variant="danger"
                          icon={<RemoveIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.removing"), "remove")}
                        >
                          {t("integrations.removeMcp")}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        icon={<RefreshIcon />}
                        disabled={isBusy}
                        onClick={() => void load()}
                      >
                        {t("integrations.refreshStatus")}
                      </Button>
                    </div>
                  </section>

                  <details className="integration-section integration-advanced">
                    <summary className="integration-advanced-summary">
                      <div className="integration-section-title">
                        <small>{t("integrations.advanced")}</small>
                        <strong>{t("integrations.mcpJsonPreview")}</strong>
                      </div>
                      <span className="integration-chevron">
                        <NextIcon />
                      </span>
                    </summary>
                    <IntegrationCopy>
                      {JSON.stringify(snapshot.preview.mcpJson, null, 2)}
                    </IntegrationCopy>
                  </details>
                </>
              )}

              {selectedId === "opencode" && (
                <>
                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.connection")}</small>
                      <strong>{t("integrations.globalSetup")}</strong>
                    </div>
                    <div className="integration-connection-state">
                      <div className="flex flex-col">
                        <strong className="text-sm text-navy">{snapshot.opencodeStatus.label}</strong>
                        <small className="text-xs text-slatecopy">{displayProductText(snapshot.opencodeStatus.details)}</small>
                      </div>
                      <StatusPill tone={opencodeStatusTone(snapshot.opencodeStatus.state)}>
                        {integrationBadgeLabels[snapshot.opencodeStatus.state]}
                      </StatusPill>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-bold text-slatecopy uppercase tracking-wider mb-1 block">
                        {t("integrations.petRouting")}
                      </label>
                      <select
                        className="integration-select"
                        value={snapshot.selectedPetId || ""}
                        onChange={(e) => void load(e.target.value)}
                        disabled={isBusy}
                      >
                        <option value="">{t("integrations.defaultPet")}</option>
                        {snapshot.petOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.configuration")}</small>
                      <strong>{t("integrations.commandPaths")}</strong>
                    </div>
                    <div className="flex flex-col gap-3">
                      <PathField
                        label={t("integrations.opencodeCommand")}
                        value={snapshot.commandPaths.opencode}
                        placeholder="opencode"
                        onSave={(v) => updatePath("opencode", v)}
                        disabled={isBusy}
                      />
                      <PathField
                        label={t("integrations.nodeCommand")}
                        value={snapshot.commandPaths.node}
                        placeholder="node"
                        onSave={(v) => updatePath("node", v)}
                        disabled={isBusy}
                      />
                    </div>
                  </section>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.actions")}</small>
                      <strong>{t("integrations.management")}</strong>
                    </div>
                    <div className="integration-management-actions">
                      {snapshot.opencodeStatus.canInstall && (
                        <Button
                          variant="primary"
                          icon={<InstallIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.installing"), "opencode-install")}
                        >
                          {t("integrations.installGlobal")}
                        </Button>
                      )}
                      {snapshot.opencodeStatus.canRemove && (
                        <Button
                          variant="danger"
                          icon={<RemoveIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.removing"), "opencode-remove")}
                        >
                          {t("integrations.removeGlobal")}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        icon={<RefreshIcon />}
                        disabled={isBusy}
                        onClick={() => void load()}
                      >
                        {t("integrations.refreshStatus")}
                      </Button>
                    </div>
                  </section>

                  <details className="integration-section integration-advanced">
                    <summary className="integration-advanced-summary">
                      <div className="integration-section-title">
                        <small>{t("integrations.advanced")}</small>
                        <strong>{t("integrations.configPreview")}</strong>
                      </div>
                      <span className="integration-chevron">
                        <NextIcon />
                      </span>
                    </summary>
                    <IntegrationCopy>
                      {JSON.stringify(snapshot.opencodePreview.configPreview, null, 2)}
                    </IntegrationCopy>
                  </details>
                </>
              )}

              {selectedId === "cursor" && (
                <>
                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.connection")}</small>
                      <strong>{t("integrations.globalMcp")}</strong>
                    </div>
                    <div className="integration-connection-state">
                      <div className="flex flex-col">
                        <strong className="text-sm text-navy">{snapshot.cursorStatus.label}</strong>
                        <small className="text-xs text-slatecopy">{displayProductText(snapshot.cursorStatus.details)}</small>
                      </div>
                      <StatusPill tone={cursorStatusTone(snapshot.cursorStatus.state)}>
                        {integrationBadgeLabels[snapshot.cursorStatus.state]}
                      </StatusPill>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-bold text-slatecopy uppercase tracking-wider mb-1 block">
                        {t("integrations.petRouting")}
                      </label>
                      <select
                        className="integration-select"
                        value={snapshot.selectedPetId || ""}
                        onChange={(e) => void load(e.target.value)}
                        disabled={isBusy}
                      >
                        <option value="">{t("integrations.defaultPet")}</option>
                        {snapshot.petOptions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.actions")}</small>
                      <strong>{t("integrations.management")}</strong>
                    </div>
                    <div className="integration-management-actions">
                      {snapshot.cursorStatus.canInstall && (
                        <Button
                          variant="primary"
                          icon={<InstallIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.installing"), "cursor-install")}
                        >
                          {t("integrations.installMcp")}
                        </Button>
                      )}
                      {snapshot.cursorStatus.canReplace && (
                        <Button
                          variant="warning"
                          icon={<ReplaceIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.replacing"), "cursor-replace")}
                        >
                          {t("integrations.replaceMcp")}
                        </Button>
                      )}
                      {snapshot.cursorStatus.canRemove && (
                        <Button
                          variant="danger"
                          icon={<RemoveIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.removing"), "cursor-remove")}
                        >
                          {t("integrations.removeMcp")}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        icon={<RefreshIcon />}
                        disabled={isBusy}
                        onClick={() => void load()}
                      >
                        {t("integrations.refreshStatus")}
                      </Button>
                    </div>
                  </section>

                  <details className="integration-section integration-advanced">
                    <summary className="integration-advanced-summary">
                      <div className="integration-section-title">
                        <small>{t("integrations.advanced")}</small>
                        <strong>{t("integrations.mcpEntryPreview")}</strong>
                      </div>
                      <span className="integration-chevron">
                        <NextIcon />
                      </span>
                    </summary>
                    <IntegrationCopy>
                      {JSON.stringify({ mcpServers: snapshot.cursorPreview.mcpEntry }, null, 2)}
                    </IntegrationCopy>
                  </details>

                  <details className="integration-section integration-advanced">
                    <summary className="integration-advanced-summary">
                      <div className="integration-section-title">
                        <small>{t("integrations.advanced")}</small>
                        <strong>{t("integrations.rulesPreview")}</strong>
                      </div>
                      <span className="integration-chevron">
                        <NextIcon />
                      </span>
                    </summary>
                    <p className="integration-file-path">{snapshot.cursorPreview.rulesPath}</p>
                    <IntegrationCopy>
                      {snapshot.cursorPreview.rulesContent}
                    </IntegrationCopy>
                  </details>
                </>
              )}

              {selectedId === "openclaw" && (
                <>
                  <div className="integration-notice">
                    <strong className="text-navy font-semibold block mb-1">
                      {t("integrations.openclaw.localTitle")}
                    </strong>
                    {t("integrations.openclaw.localDescription")}
                  </div>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.connection")}</small>
                      <strong>{t("integrations.statusRouting")}</strong>
                    </div>
                    <div className="integration-connection-state">
                      <div className="flex flex-col">
                        <strong className="text-sm text-navy">{snapshot.openclawStatus.label}</strong>
                        <small className="text-xs text-slatecopy">{displayProductText(snapshot.openclawStatus.details)}</small>
                      </div>
                      <StatusPill tone={openclawStatusTone(snapshot.openclawStatus.state)}>
                        {openclawStatusLabel(snapshot.openclawStatus.state, t)}
                      </StatusPill>
                    </div>

                    <div className="integration-metadata-grid">
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col">
                        <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.hostVersion")}
                        </span>
                        <span className="font-mono text-navy font-semibold">
                          {snapshot.openclawStatus.version || t("integrations.openclaw.notDetected")}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col">
                        <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.installedPlugin")}
                        </span>
                        <span className="font-mono text-navy font-semibold">
                          {snapshot.openclawStatus.installedVersion || t("integrations.openclaw.notInstalled")}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col">
                        <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.installationSource")}
                        </span>
                        <span className="font-mono text-navy font-semibold">
                          {openclawSourceLabel(snapshot.openclawStatus.trackedSource, t)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col">
                        <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.targetVersion")}
                        </span>
                        <span className="font-mono text-navy font-semibold">
                          v{snapshot.openclawPreview.targetVersion}
                        </span>
                      </div>
                    </div>
                  </section>

                  {snapshot.openclawStatus.state === "management-disabled" && (
                    <div className="integration-notice integration-notice-warning">
                      <strong>{t("integrations.openclaw.nixTitle")}</strong> {t("integrations.openclaw.nixDescription")}
                    </div>
                  )}

                  {snapshot.openclawStatus.state === "conflict" && (
                    <div className="integration-notice integration-notice-error">
                      <strong>{t("integrations.openclaw.conflictTitle")}</strong> {t("integrations.openclaw.conflictDescription")}
                    </div>
                  )}

                  {(snapshot.openclawStatus.state === "indeterminate" || snapshot.openclawStatus.state === "invalid") && (
                    <div className="integration-notice integration-notice-warning">
                      <strong>{t("integrations.openclaw.unverifiedTitle")}</strong> {displayProductText(snapshot.openclawStatus.details)}{" "}
                      {t("integrations.openclaw.unverifiedDescription")}
                    </div>
                  )}

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.configuration")}</small>
                      <strong>{t("integrations.commandPaths")}</strong>
                    </div>
                    <div className="flex flex-col gap-3">
                      <PathField
                        label={t("integrations.openclaw.command")}
                        value={snapshot.commandPaths.openclaw}
                        placeholder="openclaw"
                        onSave={(v) => updatePath("openclaw", v)}
                        disabled={isBusy}
                      />
                    </div>
                  </section>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.actions")}</small>
                      <strong>{t("integrations.management")}</strong>
                    </div>
                    <div className="integration-management-actions">
                      {(snapshot.openclawStatus.canInstall || snapshot.openclawStatus.canEnable) && (
                        <Button
                          variant="primary"
                          icon={<InstallIcon />}
                          disabled={isBusy}
                          onClick={() =>
                            run(
                              snapshot.openclawStatus.canEnable && !snapshot.openclawStatus.canInstall
                                ? t("integrations.openclaw.busy.enabling")
                                : t("integrations.openclaw.busy.installing"),
                              "openclaw-install",
                            )
                          }
                        >
                          {snapshot.openclawStatus.canEnable && !snapshot.openclawStatus.canInstall
                            ? t("integrations.openclaw.enable")
                            : t("integrations.openclaw.install")}
                        </Button>
                      )}

                      {snapshot.openclawStatus.canUpdate && !snapshot.openclawStatus.canInstall && (
                        confirmingAction === "update" ? (
                          <Button
                            variant="warning"
                            icon={<ReplaceIcon />}
                            disabled={isBusy}
                            onClick={() => {
                              setConfirmingAction(null);
                              void run(t("integrations.openclaw.busy.updating"), "openclaw-update");
                            }}
                          >
                            {t("integrations.openclaw.confirmUpdate")}
                          </Button>
                        ) : (
                          <Button
                            variant="warning"
                            icon={<ReplaceIcon />}
                            disabled={isBusy}
                            onClick={() => setConfirmingAction("update")}
                          >
                            {t("integrations.openclaw.update")}
                          </Button>
                        )
                      )}

                      {snapshot.openclawStatus.canRemove && (
                        confirmingAction === "remove" ? (
                          <Button
                            variant="danger"
                            icon={<RemoveIcon />}
                            disabled={isBusy}
                            onClick={() => {
                              setConfirmingAction(null);
                              void run(t("integrations.openclaw.busy.removing"), "openclaw-remove");
                            }}
                          >
                            {t("integrations.openclaw.confirmRemove")}
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            icon={<RemoveIcon />}
                            disabled={isBusy}
                            onClick={() => setConfirmingAction("remove")}
                          >
                            {t("integrations.openclaw.remove")}
                          </Button>
                        )
                      )}

                      {confirmingAction && (
                        <Button variant="secondary" disabled={isBusy} onClick={() => setConfirmingAction(null)}>
                          {t("common.cancel")}
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        icon={<RefreshIcon />}
                        disabled={isBusy}
                        onClick={() => {
                          setConfirmingAction(null);
                          void load();
                        }}
                      >
                        {t("integrations.refreshStatus")}
                      </Button>
                    </div>
                  </section>

                  <details className="integration-section integration-advanced">
                    <summary className="integration-advanced-summary">
                      <div className="integration-section-title">
                        <small>{t("integrations.advanced")}</small>
                        <strong>{t("integrations.openclaw.commandPreviews")}</strong>
                      </div>
                      <span className="integration-chevron">
                        <NextIcon />
                      </span>
                    </summary>
                    <div className="mt-3 flex flex-col gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col gap-1">
                        <span className="text-[10px] font-sans font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.install")}
                        </span>
                        <IntegrationCopy>
                          {snapshot.openclawPreview.command} {snapshot.openclawPreview.install.join(" ")}
                        </IntegrationCopy>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col gap-1">
                        <span className="text-[10px] font-sans font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.enable")}
                        </span>
                        <IntegrationCopy>
                          {snapshot.openclawPreview.command} {snapshot.openclawPreview.enable.join(" ")}
                        </IntegrationCopy>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col gap-1">
                        <span className="text-[10px] font-sans font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.update")}
                        </span>
                        <IntegrationCopy>
                          {snapshot.openclawPreview.command} {snapshot.openclawPreview.update.join(" ")}
                        </IntegrationCopy>
                      </div>
                      <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/5 flex flex-col gap-1">
                        <span className="text-[10px] font-sans font-bold text-slatecopy uppercase tracking-wider">
                          {t("integrations.openclaw.remove")}
                        </span>
                        <IntegrationCopy>
                          {snapshot.openclawPreview.command} {snapshot.openclawPreview.remove.join(" ")}
                        </IntegrationCopy>
                      </div>
                    </div>
                  </details>
                </>
              )}

              {selectedId === "zed" && (
                <>
                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.connection")}</small>
                      <strong>{t("integrations.globalMcp")}</strong>
                    </div>
                    <div className="integration-connection-state">
                      <div className="flex flex-col">
                        <strong className="text-sm text-navy">{snapshot.zedStatus.label}</strong>
                        <small className="text-xs text-slatecopy">{displayProductText(snapshot.zedStatus.details)}</small>
                      </div>
                      <StatusPill tone={zedStatusTone(snapshot.zedStatus.state)}>
                        {integrationBadgeLabels[snapshot.zedStatus.state]}
                      </StatusPill>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs font-bold text-slatecopy uppercase tracking-wider mb-1 block">
                        {t("integrations.petRouting")}
                      </label>
                      <select
                        className="integration-select"
                        value={snapshot.selectedPetId || ""}
                        onChange={(e) => void load(e.target.value)}
                        disabled={isBusy}
                      >
                        <option value="">{t("integrations.defaultPet")}</option>
                        {snapshot.petOptions.map((pet) => (
                          <option key={pet.id} value={pet.id}>
                            {pet.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3 flex flex-col gap-1">
                      <span className="text-xs font-bold text-slatecopy uppercase tracking-wider">
                        {t("integrations.zed.settingsPath")}
                      </span>
                      <code className="integration-file-path">{snapshot.zedStatus.settingsPath}</code>
                    </div>
                  </section>

                  <section className="integration-section">
                    <div className="integration-section-title">
                      <small>{t("integrations.actions")}</small>
                      <strong>{t("integrations.management")}</strong>
                    </div>
                    <div className="integration-management-actions">
                      {snapshot.zedStatus.canInstall && (
                        <Button
                          variant="primary"
                          icon={<InstallIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.installing"), "zed-install")}
                        >
                          {t("integrations.installMcp")}
                        </Button>
                      )}
                      {snapshot.zedStatus.canReplace && (
                        <Button
                          variant="warning"
                          icon={<ReplaceIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.replacing"), "zed-replace")}
                        >
                          {t("integrations.replaceMcp")}
                        </Button>
                      )}
                      {snapshot.zedStatus.canRemove && (
                        <Button
                          variant="danger"
                          icon={<RemoveIcon />}
                          disabled={isBusy}
                          onClick={() => run(t("integrations.busy.removing"), "zed-remove")}
                        >
                          {t("integrations.removeMcp")}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        icon={<RefreshIcon />}
                        disabled={isBusy}
                        onClick={() => void load()}
                      >
                        {t("integrations.refreshStatus")}
                      </Button>
                    </div>
                  </section>

                  <details className="integration-section integration-advanced">
                    <summary className="integration-advanced-summary">
                      <div className="integration-section-title">
                        <small>{t("integrations.advanced")}</small>
                        <strong>{t("integrations.zed.mcpEntryPreview")}</strong>
                      </div>
                      <span className="integration-chevron">
                        <NextIcon />
                      </span>
                    </summary>
                    <IntegrationCopy>
                      {JSON.stringify({ context_servers: { openpets: snapshot.zedPreview.mcpEntry } }, null, 2)}
                    </IntegrationCopy>
                  </details>
                </>
              )}

              {selectedId === "pi" && (
                <section className="integration-section">
                  <div className="integration-section-title">
                    <small>{t("integrations.pi.manualSetup")}</small>
                    <strong>{t("integrations.pi.extension")}</strong>
                  </div>
                  <p className="text-sm text-slatecopy leading-relaxed">{t("integrations.pi.intro")}</p>
                  <div className="integration-command-list">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                        {t("integrations.pi.globalInstall")}
                      </span>
                      <IntegrationCopy>
                        pi install npm:@open-pets/pi
                      </IntegrationCopy>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                        {t("integrations.pi.projectInstall")}
                      </span>
                      <IntegrationCopy>
                        pi install -l npm:@open-pets/pi
                      </IntegrationCopy>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                        {t("integrations.pi.remove")}
                      </span>
                      <IntegrationCopy>
                        pi remove npm:@open-pets/pi
                      </IntegrationCopy>
                    </div>
                  </div>
                  <div className="integration-command-list">
                    <span className="text-[10px] font-bold text-slatecopy uppercase tracking-wider">
                      {t("integrations.pi.slashCommands")}
                    </span>
                    <IntegrationCopy label="复制状态命令">
                      /openpets status
                    </IntegrationCopy>
                    <IntegrationCopy label="复制测试命令">
                      /openpets test
                    </IntegrationCopy>
                    <IntegrationCopy label="复制动作命令">
                      /openpets react &lt;reaction&gt;
                    </IntegrationCopy>
                    <IntegrationCopy label="复制说话命令">
                      /openpets say &lt;message&gt;
                    </IntegrationCopy>
                  </div>
                  <p className="text-xs text-slatecopy mt-2">{t("integrations.pi.outro")}</p>
                </section>
              )}
            </div>
          </GlassCard>
        </div>,
        document.body,
      )}
    </div>
  );
}
