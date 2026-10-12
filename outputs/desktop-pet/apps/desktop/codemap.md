# apps/desktop/

## Responsibility

当前 Windows 项目名为 desktop pet，自行开发控制中心、启动编排与托盘。
动画、插件 SDK 和接入模块保留档案及协议兼容，第三方署名收录在许可证文件；产品界面不展示来源区。六个页面及操作见 `docs/studio.md`。
`smoke-studio.mjs` 核验实际页面、素材、人设与插件；`smoke-persona-provider.mjs`
核验两个本机 AI 来源的真实生成、用量、启用和取消链路。启动器保留原用户档案。
`smoke-studio-ui.mjs` 专门承担多尺寸页面、布局与键盘焦点验收，使用隔离档案而非原 Toasty Tote 档案，不访问真实远程 AI。

Windows 日常入口使用直接指向 EXE 的桌宠与工作室快捷方式，启动参数应用原独立档案。main 在首次或单实例重复启动时处理显式显示／打开意图，初始化未完成时暂存；不增加 IPC 打开窗口接口。

主进程持有状态、权限与文件操作；渲染器只消费窄桥接。电脑协同只提供分析建议，
团队、组织签到及上游更新不进入当前运行链。

## Design

- **托盘与控制中心**：常驻桌宠，用户打开唯一控制中心；页面为我的桌宠、共创网站、宠物大脑、人设个性、插件管理、设置。文件助手和电脑守护在安装启用后挂载到对应插件配置，不是独立导航。
- **工作室界面**：陪伴与创作／助手与工具／工作室三组图标导航，页面直接显示功能标题，侧栏有当前桌宠陪伴席。蓝色主操作、次操作和危险样式区分操作层级；工作区及来源配置弹窗按实际容器宽度响应，目录详情默认收起。界面更新不改变桌宠偏好、IPC 权限或业务所有者。
- **Single Instance**: Uses `app.requestSingleInstanceLock()` with second-instance focusing
- **Security Model**: 
  - Sandboxed renderers with contextIsolation
  - Preload scripts expose limited APIs via `contextBridge`
  - CSP: `default-src 'none'`, inline styles only
  - Mock keychain to prevent OS credential prompts
  - IPC network security: loopback/private address filtering for TCP mode
- **State Management**: File-based JSON state with atomic writes (temp + rename), including bounded Pet Assistant personality preferences and a separate host-owned local conversation archive
- **Pet Architecture**: 
  - Default pet (always visible when enabled)
  - Agent pets (lease-based, appear on explicit agent requests)
  - Built-in fallback pet (bundled spritesheet)
  - Speech bubbles with reaction messages and status badges
  - User-configurable reaction-to-animation mapping
  - 本地安静模式默认开启；宿主独占单击随机、六秒回归和可选 45 秒自动动作，实际 AI 工作优先；命名动作只绑定现有图集状态
- **Lease Manager**: 15s TTL leases for agent pet routing with heartbeat renewal
- **Logging**: Structured logging with scopes, including `voice` and `provider`, log rotation (2MB max), and sensitive data redaction
- **Plugin Subsystem**: Declarative manifest plugins and JavaScript plugin hosting with permission approval, config schemas, command/status surfaces, catalog/local installs, SDK bridge quotas, storage, schedules, restricted HTTPS fetch, and safe path/ZIP/manifest validation
- **人设与共创**：全局／蒸馏 Markdown 编辑、AI 辅助草稿；宠物素材及定时插件的本地制作与分享。

## Flow

**启动**：`personal-bootstrap.ts` → `main.ts` → 生命周期与独立档案／动作偏好 → 迁入事务恢复 → 托盘、显示协调与本机 IPC → 插件、唯一对话宿主及历史 → 人设和 AI 编排 → 快捷键与已选择桌宠。main 启停默认动作所有者，锁屏／休眠暂停随机；原 AI 操作生命周期及有效 Agent 租约驱动工作动作，退出清理。电脑与下载监测只在电脑守护实际运行且授权时启动；停用暂停并保留原偏好。开发路由按显式参数打开；团队及签到服务不初始化。

**Pet Display**: IPC Request → `local-ipc.ts` → `LeaseManager.acquire()` → `agent-pet-controller.ts` → `pet-window.ts` → HTML/CSS spritesheet animation with reaction-to-animation mapping; topology and resume recovery are coordinated by `pet-display-coordinator.ts`

**Installation**: Catalog fetch (V3 with pagination fallback to V2) → ZIP download → `yauzl` extraction → validation → `pet-install-transaction.ts` orchestrates filesystem promotion, state mutation, rollback, recovery, and side effects using the pure `pet-install-transaction-protocol.ts` journal/schema/naming/recovery policy → tray refresh

**Mac Harness Desktop**：未指定 profile 时探测系统与用户应用目录的官方 CLI，默认 desktop；显式设置保持优先，监测与对话分别验证。

**Agent Setup**: UI → `agent-setup.ts` → Claude/OpenCode/Cursor/Zed setup or OpenClaw version/list/inspect discovery → MCP/config/hooks changes or native OpenClaw install/update/enable/remove → post-action status refresh

**工作室**：托盘／桌宠菜单 → `windows.ts` 安全窗口与路由 → `control-center-preload.cjs` 窄 API → `renderer/src/main.tsx` → `studio/StudioApp.tsx` 七页面。页面独立设计，功能服务继续持有凭据、事务、对话历史、插件权限、人设与取消，界面不复制这些所有者。

**Plugins**: Control Center plugins route → `plugin-service.ts` → catalog or local manifest/entry loader → permission approval/state update → `plugin-runtime.ts` schedules declarative timers or starts `plugin-js-host.ts` → `plugin-sdk-bridge.ts` applies approved SDK calls to pet/schedule/storage/command/status/network APIs

## Integration Points

- **Workspace Packages**: `@open-pets/agent-events`, `@open-pets/claude`, `@open-pets/cli`, `@open-pets/cursor`, `@open-pets/mcp`, `@open-pets/opencode`, `@open-pets/openclaw`, `@open-pets/zed`
- **External Services**: 
  - `https://openpets.dev/pets/catalog.v2.json` (pet catalog V2)
  - `https://openpets.dev/pets/catalog.v3.json` (pet catalog V3 with pagination)
  - `https://openpets.dev/plugins/catalog.v1.json` (plugin catalog V1)
  - `https://zip.openpets.dev/pets/{id}.zip` (pet downloads)
  - `https://zip.openpets.dev/plugins/{id}.zip` (plugin downloads)
- **System Integration**:
  - Claude Code: `~/.claude/CLAUDE.md`, `~/.claude/settings.json`, `claude mcp` commands
  - OpenCode: `~/.opencode/config.json`
  - Cursor: `~/.cursor/mcp.json`, `.cursor/rules/openpets.mdc`
  - Zed: `~/.config/zed/settings.json` (platform-specific global settings)
  - OpenClaw: `openclaw plugins` registry and Gateway lifecycle
  - Codex: `~/.codex/pets/` (local pet development)
  - IPC: Discovery file at platform-specific path, Unix socket/Windows named pipe/TCP
  - Logs: `userData/logs/openpets.log`
- **Build**: `electron-builder` with ASAR, cross-platform (macOS/Windows/Linux)

## Key Files

- `main.ts`: Entry point, lifecycle coordination
- `tray.ts`: System tray icon and menu
- `windows.ts`：工作室安全窗口、路由、功能 IPC、内部素材协议及窗口绑定取消
- `control-center-route.ts`: Canonical Control Center route validation plus unpackaged development route selection
- `renderer/`：独立 `studio/` 工作室与明确迁入的功能组件，无团队入口
- `renderer/src/studio/StudioApp.tsx` / `studio.css`：分组导航、功能标题、当前桌宠、统一控件及工作区容器响应；`PetStudioView.tsx` 提供当前卡片状态与预览语义类。
- `renderer/src/settings/providers/ProviderModal.tsx`：真实弹窗的 `provider-modal` 样式挂接与模板 `aria-pressed` 选中状态，不复制凭据和连接业务。
- `smoke-studio-ui.mjs`：全新隔离档案中的七页面、三种内容尺寸与生产最小窗口内容视口、真实键盘焦点、关键入口、窗口截图及布局记录。
- `local-ipc.ts`: TCP/Unix socket server for CLI communication
- `lease-manager.ts`: Pet routing lease lifecycle
- `pet-window.ts`: Pet-window lifecycle facade and rendering (transparent frameless windows, CSS sprite animation, V2 idle cursor gaze, speech bubbles, status badges, compact default-pet launcher, bottom-anchored upward-growing attached chat panel styles, floating bubble suppression during full chat, and Linux focus/input-shape transitions)
- `pet-window-interaction.ts`: Pet-window mouse passthrough, manual/native drag bridge, renderer lifecycle recovery/watchdog, IPC event bridge, dragging state, and speech-completion subscriptions
- Windows 被动焦点和全屏让位由 `pet-window.ts` 继续统一管理；`window-tracker.ts` 复用原生前台查询，`pet-fullscreen-policy.ts` 提供显示器客户区判断，不创建第二套隐藏状态。
- `wayland-layer-backend.ts`/`wayland-layer-protocol.ts`: Native layer-shell Electron adapter plus its Electron-free length-prefixed protocol, incremental decoding, cropped BGRA frame handling, and pointer replay mapping
- `default-pet-chat.ts`: Host-side in-pet chat coordinator, handling main-owned compact/attached chat expansion, dynamic panel height synchronization, IPC dispatch, conversation transcript streams, talk status, and prompt suggestions
- `manager-check-in-service.ts` / `manager-check-in-state.ts`：迁入的遗留源码和旧测试参考，当前入口未加载
- `default-pet-chat-geometry.ts`: Bijective coordinate mappings and anchor-preserving window bounds for collapsed (200x200) and expanded (420x640) carrier states, plus bottom-relative panel positioning calculations
- `pet-window-shape.ts`: Shared compact-composer maximum geometry plus Linux X11/Wayland input shape masks for collapsed carrier and bottom-anchored expanded attached chat panel
- `pet-assistant-feedback.ts`: Reducer mapping canonical assistant turns and active voice sessions to pet reactions, suppressing duplicate text when chat is open while keeping sprite activity/reaction animations
- `pet-transient-presentation.ts`: Reusable per-pet owner for transient display/badge state, transition-unique opaque render-composition tokens, independent display/badge timer guards, timer cleanup, and deterministic transition callbacks; default/agent controllers retain window/voice/lease role ownership
- `pet-display-coordinator.ts`: Electron-free display/power event coordinator; owns listener lifecycle, per-reason debounce, cache invalidation, and ordered live-pet reclamping/recovery fanout
- `default-pet-controller.ts`/`agent-pet-controller.ts`: Pet visibility/state management with transient displays; `reclampDefaultPetWindow()` and the agent reclamp leaf retain window-specific geometry work
- `pet-roaming-controller.ts`: Host-side roaming orchestrator — registers every live pet (default + agent) with the motion engine and applies the active physics configuration (gravity + bounce). Unregisters before window destroy to prevent the shared ticker from touching closed windows.
- `pet-motion-engine.ts`: Shared-ticker motion engine (~60 fps) — `Map<petHandleId, MotionState>`, single `setInterval` for all pets, sub-pixel fractional accumulators, bottom-center gravity-floor anchor, `registerPet`/`unregisterPet` seams, sole continuous position writer.
- `display.ts`: Screen-geometry helpers — `getDefaultPetInitialPosition`, `clampToVisibleWorkArea` (legacy single-display), `clampToNearestDisplayIfOffscreen` (permissive multi-display), `isOnAnyDisplay`, `setCrossDisplayRoamingEnabled`/`isCrossDisplayRoamingEnabled` flag; display list cache with `invalidateDisplayCache()`
- `app-state.ts`: Persistent state management (JSON file)
- `pet-assistant-host.ts`/`pet-assistant-service.ts`: Host-owned provider-neutral assistant lifecycle, readable provider-safe capability names, friendly action presentation metadata, and terminal-turn coordination
- `pet-assistant-memory.ts`: Electron-/filesystem-free owner of completed-turn active context, archive-plus-active prompt selection, canonical terminal-text archive appends, and archive management delegation
- `pet-assistant-archive.ts`: Atomic local archive with 200-message/30-day/512KiB retention, 64KiB entry cap, quarantine recovery, and bounded prompt-window support
- `agent-setup.ts`: Claude/OpenCode/Cursor/Zed integration logic plus OpenClaw management/status actions
- `plugin-service.ts`: Plugin orchestration for snapshots, enable/config/reload, command execution, catalog install/update/uninstall, local loading, permission approval, JavaScript host wiring, and runtime reloads；状态与运行事件供工具门禁、任务撤销及工作室刷新复用
- `companion-tool-plugins.ts`：纯可选工具编号、权限与真实运行门禁；文件助手和电脑守护不加入默认捆绑，不保存平行安装状态
- `plugin-manifest.ts`: `openpets.plugin.json` v1/v2 schema/types/validator for declarative timer plugins and JavaScript SDK plugins, config fields, permissions, commands/status/network, and actions
- `plugin-runtime.ts`: Runtime that compiles enabled declarative timers and starts JavaScript plugin hosts for approved pet/schedule/storage/command/status/network actions
- `plugin-state.ts`: Atomic JSON state store for installed plugins, enabled flag, approved permissions, config, broken state, and update metadata
- `plugin-config.ts`: Plugin default/effective config validation and config reference resolution
- `plugin-catalog.ts`/`plugin-catalog-validation.ts`: Plugin catalog fetch/cache and strict catalog entry validation
- `plugin-package.ts`: Catalog plugin ZIP download, SHA-256 verification, manifest extraction, install, and safe uninstall path resolution
- `plugin-local-loader.ts`: Local developer plugin folder validation and manifest snapshotting into app data
- `plugin-manifest-reader.ts`: Safe installed-manifest reader enforcing allowed roots, size limits, path containment, and expected id/version
- `plugin-pet-api.ts`: Runtime bridge from plugin actions to default pet speech/reaction APIs
- `plugin-js-host.ts`: Hidden sandboxed BrowserWindow host for JavaScript plugin entry modules, SDK IPC tokening, session hardening, startup handshake, and teardown
- `plugin-sdk-bridge.ts`: Permission-checked SDK API for JavaScript plugins with quotas, plugin storage, schedules, config listeners, commands/status, logs, and restricted HTTPS fetch
- `plugin-sdk-network.ts`: Guarded DNS and agent transport, bounded dispatch/response limits, and bounded agent cleanup; the bridge tracks, aborts, and drains requests by API generation
- `voice-assistant-session-contract.ts`: Pure generic/Realtime voice-session contracts shared by host, Realtime, feedback, tray, and implementation modules.
- `plugin-voice.ts` plus `voice-capture*.ts`, `voice-conversation.ts`, `voice-realtime-electron.ts`, `voice-microphone-arbiter.ts`, `voice-listening-service.ts`, `voice-privacy-indicator*.ts`, and `voice-assistant-session.ts`: Host-owned one-shot capture plus the private realtime lifecycle, shared microphone lease, reference-counted privacy indicator, mutable generic session stages, and teardown cleanup
- `pet-installation.ts`：目录下载、解包和本地安装事务，并在原宠物锁内编排个人素材包导出、V2 图集制作与重名保护。
- `pet-authoring-types.ts`：宿主与界面共享制作契约；原宠物 IPC 持有原生选图凭证、十分钟期限和窗口取消，渲染器不能提交文件路径。
- `pet-package-export.ts`：共创包的有界读取、校验、新目录写入与取消清理，不读取完整应用档案。
- `pet-sharing-contract.ts`：ZIP/文件夹分享的纯契约、字段白名单与限额；声明仅写入分享说明，不进入运行档案。
- `pet-install-transaction-protocol.ts`: Stable pet-install journal/schema, naming, and recovery-classification protocol
- `pet-install-transaction.ts`: Filesystem and side-effect orchestration for staged promotion, state mutation, rollback, cleanup, locking, and startup recovery
- `codex-pets.ts`: Local Codex pet import
- `catalog-remote.ts`: Bounded remote catalog HTTP, endpoint validation, schema validation, and module-instance caches for V3 index/pages/search plus V2
- `catalog.ts`: Public catalog façade owning V3→V2→fixture fallback, V3-only curated visibility, virtual pagination/search composition, and all-pet V2/fixture fallback lookup
- `logger.ts`: Structured logging with scopes (app, ipc, lease, pet, state, tray, ui)
- `reaction-animation-mapping.ts`: Reaction-to-animation state mapping with user overrides and the bundled V2 Hoodie Cat atlas metadata
- `reaction-messages.ts`: Message pools for each reaction type
- `control-center-preload.cjs` / `pet-preload.cjs` / `plugin-sdk-preload.cjs`：工作室、桌宠聊天与交互、插件 SDK 的窄桥接；不提供团队和签到操作
- `electron-builder.yml`: Packaging configuration with a darwin-only `afterPack` trim (`scripts/mac-trim-sharp.cjs`) of non-darwin sharp binaries
- `scripts/release-local.mjs`: macOS-local release automation as resumable checkpointed stages, with target-aware temporary and actual-artifact payload validation, SHA-256 checkpoint output digests, and GitHub draft creation
- `contracts/catalog-fixture.contract.ts`: Catalog V2 validation contract tests against fixture data
- `contracts/local-ipc-protocol.contract.ts`: IPC protocol validation contract tests for request/response parsing
- `contracts/plugin-manifest.contract.ts`: Plugin manifest boundary contract for v1 schema, config references, permissions, deferred features, and action validation

## Test Structure

- **Behavior tests** (`tests/*.test.ts`): Unit tests for lease manager (incl. PID liveness + pool toggle), state management, version checking, ZIP safety, Codex pets, Claude memory, reaction animation mapping, catalog V2/fixture fallback visibility and lookup (`catalog-fallback.test.ts`), host Pet Assistant/archive retention and prompt boundaries, plugin bridge/gateway guards, bounded voice capture lifecycle (`voice-lifecycle.test.ts`), private realtime conversation lifecycle (`voice-conversation.test.ts`), display geometry helpers (`display.test.ts`), pet motion-engine clamping and shared-ticker (`pet-motion-engine-clamp.test.ts`, `pet-motion-engine-shared-ticker.test.ts`), gravity seam (`pet-motion-engine-gravity-seam.test.ts`), single-writer invariant (`pet-motion-engine-single-writer.test.ts`), roaming controller (`pet-roaming-controller.test.ts`), and pool toggle (`pool-toggle.test.ts`). Compiled to `.test-dist/tests/`.
- **Contract tests** (`contracts/*.contract.ts`): Public API boundary validation for catalog fixtures, IPC protocol, and plugin manifest schema. Compiled to `.test-dist/contracts/`.
- **Runtime checks** (`src/check-*.ts`): Remaining runtime validation checks compiled to `dist/`.
- `packaging-contract.ts` centralizes the canonical bundled-plugin and unpacked integration-runtime checks used by the packaged-output validator and its artifact fixtures.
- **Test runner** (`scripts/run-tests.mjs`): Orchestrates preload syntax checks → test compilation → behavior tests → contract tests → dist checks.

`smoke-studio-ui.mjs` 在隐藏真实 Electron 窗口中覆盖 1280×860、980×720、820×620，以及生产最小窗口扣除边框后的实际内容视口，检查横向溢出、重叠控件、透明文本和 Tab 可见焦点。原生显示、目录选择和文件定位在测试边界替代；DOM、IPC、人设隔离保存、文件索引与路径复核实际执行，夹具摘要检查原文件未改写。外部网络被阻止，不配置真实凭据或验证远程 AI 服务；通过情况以本轮运行记录为准，不能只凭页面截图判断全部业务已验证。

## 文件分类库的新增流程

原生选择目录 → `companion-file-library.ts` 有界扫描并保存引用 → `CompanionFilesView.tsx` 分类／目录／名称筛选 → 主进程复验真实路径后定位。`file-location-query.ts` 与 `companion-file-location.ts` 在唯一 Assistant 的模型请求之前完成本地文件询问，无 AI 也可用。AI 分类预览由新窄 IPC 绑定窗口和快照，固定来源生成临时草稿，明确采用只改元数据；可选推荐整理登记到原文件计划授权，再执行、刷新与有条件撤销。`smoke-file-library.mjs` 验证真实窗口和本机 HTTP 链路，正式档案不作为夹具。
