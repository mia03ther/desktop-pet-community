# Repository Atlas: OpenPets 2.0 Workspace

## Project Responsibility

OpenPets is a pnpm/TypeScript monorepo for an Electron desktop companion app plus npm packages that let coding agents control animated desktop pets. The workspace provides a local IPC protocol, MCP server, CLI tooling, and editor/agent integrations for Claude Code, OpenCode, Cursor, Zed, Pi, and OpenClaw.

当前 desktop pet 控制中心另外管理 Codex 官方 Hooks、ZCode 用户级 MCP/Hooks、DeepSeek Harness Cordis bundle 和豆包方舟本机开发接口。这些接入复用现有本机事件和动作通道；不替换宠物大脑的文字来源，不根据动作推测账户额度，豆包网页／PC 自动监测当前未支持。

## System Entry Points

- `package.json`: workspace scripts for building, checking, testing, desktop packaging, and npm release orchestration.
- `pnpm-workspace.yaml`: workspace membership for `apps/*` and `packages/*`.
- `apps/desktop/src/main.ts`: Electron main-process bootstrap for the desktop pet app.
- `apps/desktop/src/personal-bootstrap.ts`：独立数据目录与首次中文设置入口，再进入重新开发的 `main.ts` 工作室启动编排。
- `apps/desktop/src/agent-setup-external.ts`：主进程外部 AI 接入聚合，组合 Codex、ZCode、DeepSeek Harness 与豆包适配器；共享契约在 `external-ai-setup-types.ts`，有界命令执行在 `external-command-runner.ts`。
- `apps/desktop/src/original-projects.ts` / `original-project-execution.ts`：保留完整原项目，报告本机能力与原宿主限制；用户明确选择后独立启动原 Windows EXE 或原 JAR，检测 Java／.NET，固定参数且不自动安装依赖。
- `启动桌宠.cmd` / `scripts/start-companion.ps1`：优先启动便携程序，使用本项目的 `userdata/` 保存设置。
- `scripts/install-desktop-shortcuts.ps1`：创建直接指向 v8 对话关闭修正版便携 EXE 的“desktop pet”和“desktop pet 控制中心”桌面快捷方式；携带原档案和启动意图，保留 v7 回退。
- `packages/cli/src/index.ts`: command-line setup, pet management, MCP launch, and plugin scaffold/validation entry point.
- `packages/mcp/src/index.ts`: MCP server entry point used by agents.
- `packages/client/src/index.ts`: public IPC client API consumed by integrations and tools.
- `packages/cursor/src/index.ts`: Cursor MCP/rules setup API.
- `packages/zed/src/index.ts`: Zed MCP settings management API.
- `packages/pi/src/extension.ts`: Pi coding-agent extension runtime entry point.
- `packages/openclaw/src/index.ts`: Native OpenClaw plugin entry point and lifecycle-management exports.
- `packages/sdk/src/index.ts`: public SDK v3 type contract for plugin authors.
- `scripts/capture.mjs`: `pnpm capture` runner for the long-running dev screenshot session (`docs/screenshots.md`); scenarios live in `scripts/capture-scenarios/`.
- `plugins/official/`: first-party SDK v3 plugin product source consumed by desktop dev mode and plugin packaging/catalog release workflows.

## Directory Map

| Directory | Responsibility Summary | Detailed Map |
|-----------|------------------------|--------------|
| `apps/` | Deployable application workspace, currently the tray-first Electron desktop app that consumes shared packages, local IPC, pet windows, and desktop plugin support. | [View Map](apps/codemap.md) |
| `apps/community-web/` | 独立共创网站：画廊、动作预览、下载、图集与声明式插件制作；本地控制中心仅保留入口。 | [View Map](apps/community-web/codemap.md) |
| `apps/desktop/` | 独立桌宠工作室、托盘、动画与安装、生活陪伴、电脑文件、多 AI、人设及插件共创；迁入的功能模块保留署名与兼容。 | [View Map](apps/desktop/codemap.md) |
| `apps/desktop/contracts/` | Desktop public-boundary contract tests for catalog fixtures, local IPC protocol behavior, and plugin manifest schema validation. | [View Map](apps/desktop/contracts/codemap.md) |
| `apps/desktop/src/` | Main-process service layer for app lifecycle, state, tray/windows, IPC routing, lease-managed agent pets, catalog installation, SDK v3 plugin subsystem, i18n, and editor integration. | [View Map](apps/desktop/src/codemap.md) |
| `apps/desktop/src/i18n/` | Desktop host i18n catalogs and localized reaction speech pools. | [View Map](apps/desktop/src/i18n/codemap.md) |
| `apps/desktop/src/i18n/locales/` | Host UI locale dictionaries keyed by BCP-47 locale. | [View Map](apps/desktop/src/i18n/locales/codemap.md) |
| `apps/desktop/src/i18n/reactions/` | Localized pet reaction message pools. | [View Map](apps/desktop/src/i18n/reactions/codemap.md) |
| `apps/desktop/src/renderer/` | Vite renderer workspace for the sandboxed React/Tailwind Control Center bundle. | [View Map](apps/desktop/src/renderer/codemap.md) |
| `apps/desktop/src/renderer/src/` | 独立 `studio/` 六页面及按已启用插件挂载的文件与电脑工具，消费窄 preload；不加载旧 Dashboard、Teams 控制中心。 | [View Map](apps/desktop/src/renderer/src/codemap.md) |
| `apps/desktop/scripts/` | Desktop package cleanup and local release automation scripts. | [View Map](apps/desktop/scripts/codemap.md) |
| `infra/linux-vms/` | Reproducible VMware/Vagrant Linux desktop test VMs (GNOME, KDE X11, COSMIC), guest provisioning, and the host `vm` driver; see `docs/development.md`. | — |
| `packages/` | Publishable npm package workspace for shared protocol, CLI, MCP, and coding-agent integrations. | [View Map](packages/codemap.md) |
| `packages/agent-events/` | Shared agent speech/event message pools and validation utilities. | [View Map](packages/agent-events/codemap.md) |
| `packages/agent-events/src/` | Source implementation for agent event messages. | [View Map](packages/agent-events/src/codemap.md) |
| `packages/claude/` | Claude Code integration package for hooks, MCP setup, and settings/memory management. | [View Map](packages/claude/codemap.md) |
| `packages/claude/src/` | Claude Code hook handlers, hook settings, CLI integration, and exported setup APIs. | [View Map](packages/claude/src/codemap.md) |
| `packages/client/` | IPC client package that discovers and communicates with the desktop app. | [View Map](packages/client/codemap.md) |
| `packages/client/contracts/` | Client protocol contract tests for discovery, endpoint validation, responses, and pet result parsing. | [View Map](packages/client/contracts/codemap.md) |
| `packages/client/src/` | Protocol definitions, discovery logic, public client API, and smoke entry points. | [View Map](packages/client/src/codemap.md) |
| `packages/cli/` | User-facing OpenPets CLI package. | [View Map](packages/cli/codemap.md) |
| `packages/cli/src/` | CLI command parsing and orchestration across client, Claude, OpenCode, Cursor, Zed, and MCP packages. | [View Map](packages/cli/src/codemap.md) |
| `packages/cursor/` | Cursor editor integration package for managed MCP configuration and project-local rules. | [View Map](packages/cursor/codemap.md) |
| `packages/cursor/src/` | Cursor config/rules planning, status classification, safe writes, previews, and validation checks. | [View Map](packages/cursor/src/codemap.md) |
| `packages/zed/` | Zed editor integration package for managed global MCP settings. | [View Map](packages/zed/codemap.md) |
| `packages/zed/src/` | Zed JSONC settings path resolution, MCP entry construction, status classification, safe writes, and validation checks. | [View Map](packages/zed/src/codemap.md) |
| `packages/install-pet/` | Standalone installer package for gallery/catalog pets. | [View Map](packages/install-pet/codemap.md) |
| `packages/install-pet/src/` | Pet installation command implementation. | [View Map](packages/install-pet/src/codemap.md) |
| `packages/mcp/` | MCP server package exposing OpenPets tools to compatible agents. | [View Map](packages/mcp/codemap.md) |
| `packages/mcp/src/` | MCP server bootstrap, argument parsing, tool registration, and executable validation helpers. | [View Map](packages/mcp/src/codemap.md) |
| `packages/opencode/` | OpenCode editor integration package with plugin runtime and global setup helpers. | [View Map](packages/opencode/codemap.md) |
| `packages/opencode/src/` | OpenCode plugin, config mutation, previews, status, and project/global setup modules. | [View Map](packages/opencode/src/codemap.md) |
| `packages/pi/` | Pi coding-agent integration package with extension runtime and slash command support. | [View Map](packages/pi/codemap.md) |
| `packages/pi/src/` | Pi extension entry point, event classification, OpenPets command parsing, and validation checks. | [View Map](packages/pi/src/codemap.md) |
| `packages/openclaw/` | Native OpenClaw plugin package with local-only lifecycle reactions and OpenClaw install/status planning. | [View Map](packages/openclaw/codemap.md) |
| `packages/openclaw/src/` | OpenClaw plugin entry/runtime, management command planning, and package contract checks. | [View Map](packages/openclaw/src/codemap.md) |
| `packages/pet-format/` | Minimal package marker/type interface for OpenPets pet package identity. | [View Map](packages/pet-format/codemap.md) |
| `packages/pet-format/src/` | Marker source export for pet-format package consumers. | [View Map](packages/pet-format/src/codemap.md) |
| `packages/sdk/` | Public plugin SDK v3 type package and deterministic test harness. | [View Map](packages/sdk/codemap.md) |
| `packages/sdk/src/` | SDK type contract, mock runtime, fake clock, and plugin test harness implementation. | [View Map](packages/sdk/src/codemap.md) |
| `plugins/` | Root product source for first-party SDK v3 OpenPets plugins before catalog packaging and R2 upload. | [View Map](plugins/codemap.md) |
| `plugins/official/` | Official reviewed SDK v3 plugins with manifests, entries, assets, locales, and harness tests. | [View Map](plugins/official/codemap.md) |

## Architecture Flow

1. The desktop app starts `apps/desktop/src/main.ts`, initializes app state, creates tray/task windows, and starts a local IPC server.
2. Agent integrations (`packages/claude`, `packages/opencode`, `packages/cursor`, `packages/zed`, `packages/pi`, `packages/openclaw`, and `packages/mcp`) configure agents or emit pet commands through their configuration APIs and, for runtime integrations, `@open-pets/client`. OpenClaw is a native OpenClaw plugin with strict local-only, payload-free hooks; Zed is configuration-only and runs the configured MCP server.
3. The client discovers Unix sockets, Windows named pipes, or TCP endpoints for WSL cross-platform access.
4. The desktop IPC server routes commands through lease-managed controllers so default and agent pets can coexist safely.
5. The plugin service loads approved catalog or local `openpets.plugin.json` manifests, persists plugin state/config, schedules declarative timers, and bridges SDK v3 calls through permission-checked host modules for UI, audio, events, storage, AI, OAuth, voice, panels, and pet control. Plugin voice input remains one-shot, live-track-accounted, cancellable, timeout-bounded, and never ambient; the separate realtime conversation foundation is host-private and not exposed through the SDK.
6. Pet windows render reaction-driven animations, localized speech, host-rendered bubbles/alerts/HUDs, and status reactions using desktop state plus reaction mapping metadata.
7. Pet assets are resolved from built-in assets, locally developed Codex pets, or remotely downloaded catalog ZIPs.
8. Workspace packages share TypeScript/ESM build conventions and are wired together through pnpm `workspace:*` dependencies.

新增外部接入沿 `control-center-agent-setup-ipc.ts → agent-setup.ts → agent-setup-external.ts → 独立适配器／external-command-runner.ts` 编排，保持全局操作锁和固定动作白名单。Codex 信任由 Codex 自己持有；ZCode 管理用户级配置；Harness 经官方插件命令修改选定 profile；豆包仅生成本档案桥接脚本供用户自己的方舟应用执行。已配置、已登记、本机链路测试与外部工具真实运行加载分别报告，范围见 `docs/agent-integrations.md` 和 `docs/doubao-integration.md`。

## Working Notes

- For repository-level orientation, start here, then open the specific folder codemap before editing.
- Contract validation files named `check-*.ts` are intentionally excluded from detailed codemap coverage except where they define package contract boundaries.
- Build artifacts, dependencies, tests, documentation, and binary assets are excluded from codemap state.
- `web/` is intentionally excluded from this codemap run; plugin source coverage is under `plugins/` only.

## 本地文件分类库

桌宠文件目标已改为本地询问定位与虚拟分类库。`companion-file-library` 是持久索引／分类所有者，`companion-file-location` 接入原 Assistant 回合，`companion-file-classification` 复用提供方生成只读草稿，`control-center-file-library-ipc` 持有窗口预览和计划归属；实际推荐移动仍由 `companion-files` 执行与记录。当前不用收藏箱或跨设备传输。范围见 `docs/companion-files.md`。
