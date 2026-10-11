# apps/desktop/src/

## Responsibility

桌宠工作室主进程及迁入功能模块。main.ts 与 tray.ts 重新组合本地系统；renderer/src/studio 是独立控制中心。动画、插件 SDK、提供方、本机桥接等功能保持原所有者、MIT 署名和档案兼容。

## Design/Patterns

- **外部接入就绪边界**：`agent-setup-external.ts` 分别投影 CLI 版本检测、原有连接配置与未确认的真实会话；配置目录不能代替程序检测，本机桥自测不作为会话连接证明。`provider-contract.ts` 共享官方额度来源判定，`companion-ai-host.ts`／`companion-ai-monitor.ts` 只向界面传递支持枚举，实际查询仍由 `provider-service.ts` 读取凭据执行。

- **原项目保留与兼容报告**：`original-projects.ts` 单独拥有有界静态检测、原文件逐字节托管及原宿主应用选择记录；`control-center-original-project-ipc.ts` 拥有窗口绑定的检测凭证、确认／取消和窄管理入口；共享无 Node 契约为 `original-project-types.ts`。原项目不混入本机桌宠或 SDK 运行时，native 才调用旧安装所有者；Shimeji 默认保留原逻辑，显式另建转换副本。原应用仅通过用户选择和点击打开，不执行工程清单命令。

- **原项目独立程序启动**：`original-project-execution.ts` 唯一持有 Windows PE／架构检查、有界 EXE／JAR 候选发现、Main-Class／基线字节码最低版本与本地依赖检查、Java／.NET 环境检查及无 shell 的独立启动。JAR 复用 `local-package-files.ts`，原 Java 的 `-version` 只在明确选择和运行时探测，固定 `-jar` 参数，不执行清单脚本。`original-projects.ts` 保留项目入口、原应用与选定 Java，动态计算 `standalone`／`runStandalone`／`chooseJava`；窄 IPC 只接收项目 ID。多入口需选择，缺环境置灰，用户点击时重新检查。原应用启动不等于原项目已加载；不自动安装、执行脚本或改写原逻辑。

- **完整包容量所有者**：`package-import-limits.ts` 统一网页、本机原件托管、原生插件与桌宠安装导出的 1 GiB／单文件 512 MiB／10000 文件边界；不放宽执行入口、清单、声明资源或原宿主运行授权。

- **开放本地包导入**：`local-package-files.ts` 唯一持有本地 ZIP／文件夹的有界读取、嵌套根选择、原包装层附件归档及路径隔离。宠物仍由 `pet-installation.ts` 和原事务安装，插件由 `plugin-local-loader.ts` 归一化三种清单名并保留原清单与附件，原 manifest／权限／SDK 校验保持不变。`shimeji-pet-import.ts` 仅将无条件 XML/Pose PNG 序列转换到媒体契约，不执行 Java／条件表达式／原行为引擎。

- **Modular Controllers**: Separate controllers for default pet vs agent pets (lease-based)
- **Protocol-First IPC**: Versioned JSON protocol over TCP/Unix sockets with token auth
- **Defensive I/O**: All file operations use temp+rename for atomicity, path traversal validation, symlink checks
- **Validation at Boundaries**: Catalog, ZIP entries, pet metadata, and IPC params all strictly validated
- **Lease Pattern**: Agent pets use expiring leases (15s TTL) with heartbeats; default pet is persistent
- **Sandboxed Renderers**: Control Center loads the Vite React/Tailwind bundle through a hardened BrowserWindow and narrow preload bridge; transparent pet windows and plugin SDK host windows stay separate
- **控制中心复用**：`windows.ts` 在首次打开时创建窗口，普通关闭只收起并撤销该窗口任务，真正退出才销毁；渲染器失效也销毁以便重建。`renderer/src/studio/StudioApp.tsx` 在原生页面隐藏时卸载功能页，停止页内轮询，重新显示后恢复当前路由，避免复用窗口继续做后台工作。
- **Structured Logging**: Scoped logging (app, ipc, lease, pet.*, state, tray, ui, voice, provider) with log rotation and redaction
- **Reaction Animation Mapping**: User-configurable mapping from reaction types to sprite animation states
- **独立动作媒体**：`pet-media-contract.ts` 统一九个必需动作与 `sleeping`／`clicked`／`dragged` 三个可选动作、透明／纯色去背契约与方向补偿；可选素材缺失时回退原反应。`pet-media-files.ts` 有界校验素材，原 `pet-installation.ts`／安装事务和 `pet-package-export.ts` 继续持有安装、导出。`installed-pet-layout.ts` 将媒体声明带入原预览快照，`app-state.ts` 沿原档案识别媒体完整性。`pet-media-player.mjs` 在沙箱 preload 和控制中心共用 192×208、24 fps 画布、静音循环视频及按帧解码动画 WebP，拥有取消、隐藏暂停、解码帧释放。`pet-window-render.ts` 与原内容更新通道传送可选媒体动作，不重载聊天即可切换；`windows.ts` 的已安装动作协议只提供已声明文件并支持范围请求。
- **本地动作所有者**：`pet-behavior-config.ts` 校验安静开关和最多 24 个现有图集命名动作；`pet-behavior.ts` 唯一持有随机、回归和外部活动兜底定时，读取原偏好及真实 AI 生命周期，不复制提供方或工作状态存档。
- **桌宠对话样式**：`pet-chat-appearance.ts` 定义字体和两类气泡的有界共享契约，`preference-patch.ts` 在原偏好 IPC 校验，`app-state.ts` 沿用原档案保存；`pet-chat-appearance-styles.ts` 生成安全 CSS。`pet-window-render.ts` 的独立样式节点由 `pet-window.ts` 原窗口所有者即时更新，保存与恢复无需重载或清空输入草稿；控制中心设置提供预设、预览和保存。学习记录见 `docs/research/pet-chat-style.md`。
- **Plugin Runtimes**: Plugins use validated manifests, approved permissions, persisted config, safe path checks, declarative timer-triggered actions, or sandboxed JavaScript entry modules through the SDK bridge.
- **Capability-Oriented SDK Surface**: The plugin bridge is split into focused SDK modules for audio, bus, config, events, quotas, routes, state, storage, types, and UI so permission checks and host effects stay localized.
- **Host-Rendered Plugin UI**: Plugins describe bubbles, alerts, commands, panels, assets, and pet behavior; the host validates descriptors and renders them through pet windows, Control Center IPC, or sandboxed panel windows.
- **Localized Runtime Content**: `i18n/` and plugin locale catalogs resolve host UI text, pet reaction messages, and plugin `$t:` strings through fallback-aware message catalogs.
- **Motion Engine Abstraction**: Advanced pet movement uses a small physics/interpolation engine rather than embedding movement math in window or SDK routing code.

## Data & Control Flow

当前制作与共创分享界面已移至 apps/community-web，控制中心只保留入口和本机配置。下述本机制作者为原格式/API所有者记录，当前 UI 不再挂载。
本地共创分享复用原宠物管理边界。`control-center-pet-management-ipc.ts`
确认已安装个人宠物，拥有原生保存选择与窗口取消；`pet-installation.ts`
在原安装锁内读取来源，`pet-package-export.ts` 校验运行素材、保留完整作品附件并写入新建
唯一目录，失败或取消只清理该目录。`pet-sharing-contract.ts` 定义纯共享选项、
字段白名单和大小上限；原生选择前校验，默认界面选 ZIP，也保留文件夹方式。
ZIP 使用 `yazl` 写入完整作品文件，按实际输出字节限制 200 MiB；新分享说明不会覆盖原包说明。导出不读取完整用户档案，图片与元数据仍由原格式校验
所有者决定。本地 ZIP／文件夹保留原清单扩展和附件，包装层许可进入 `import-wrapper/`；原线上目录导入规则保持严格。

桌宠制作仍沿同一 IPC 与安装所有者。原生选图后，宿主保留来源路径与摘要，
仅向渲染器返回十分钟有效、绑定窗口的选择凭证和缩小预览；换图、取消、
窗口关闭会撤销凭证。`pet-authoring-types.ts` 只定义共享数据契约。
`pet-installation.ts` 校验有界 V2 图集、可见与透明内容，创建时重新核对摘要，
在原宠物锁内拒绝已有编号，并以白名单元数据进入原安装事务的 `createOnly`
模式。提交前取消回滚本次候选，提交成功后返回真实成功结果。

本地 AI 工作台复用 `provider-service.ts` 的凭据与 HTTP 所有权，新增按配置 ID
捕获的文字操作及固定官方额度 GET；`text-model-client.ts` 保留协议响应的可选
token 计数，无工具时不发送空工具字段。`provider-contract.ts` 的凭据规则同时
用于设置、请求和界面：已知官方云端要求凭据，自定义兼容网关按其配置处理。
`companion-ai-host.ts` 组合原会话、
只读任务、人物和监测，原 `pet-assistant-conversation.ts` 仍是唯一聊天 owner。
`companion-ai-tasks.ts` 拥有 1 至 3 来源分析、指定来源汇总、取消和最近十条结果；
它不拥有工具执行能力。`companion-ai-monitor.ts` 聚合真实回合、任务、有效租约
事件，保存手动额度，官方余额与 key 上限由宿主临时缓存并单独显示。
`companion-persona.ts` 拥有人物 Markdown、标准角色卡、托管 skills 目录与 v3 存档；`companion-character-card.ts` 纯解析 Tavern V1/V2/V3 与 LobeChat agent 核心字段、宏和保留扩展的编辑；`companion-character-card-png.ts` 有界提取 PNG 角色元数据；`companion-persona-skill.ts` 有界保留完整文件夹，只展开明确引用的目录内文本。主动导入自动启用，每轮注入原 composition，无需触发词；可见扫描保留已有选择。`CompanionAiHost.getPersonaEnvironment()` 区分宿主提示词/目录加载能力与模型效果、外部原生 Skill 未检测状态。
`control-center-ai-ipc.ts` 绑定发送方、一次性预览、取消与迟到结果；电脑诊断预览与派发要求电脑守护真实运行，停用撤销预览并取消分析任务，重新启用不恢复旧预览。对应
`companion-ai-types.ts`、`companion-ai-monitor-types.ts`、`companion-persona-types.ts`
为界面共享契约。生命周期由 `main.ts` 注入，窗口 adapter 在关闭时撤销授权。
使用与边界见 `docs/companion-ai.md`、`docs/companion-persona.md`。

可选文件助手与电脑守护由 `companion-tool-plugins.ts` 定义精确编号、所需权限与纯门禁，安装和运行事实只来自原 `PluginStateStore` 与 `PluginRuntime`；不捆绑或自动安装。`PluginService.subscribe` 组合两者事件，安全快照的 `active` 只表示真实运行。主进程监听可用性变化，暂停／恢复原后台服务；控制中心复用插件刷新事件撤下失效配置，不新增轮询或安装状态。

电脑守护由 `companion-tools.ts` 单独保存监测选择、软件比较基线、
忽略/延后和提醒冷却；未安装启用时不采集，后台检查默认关闭，每五分钟运行一次，持续压力需两次
新鲜测量。纯 `companion-diagnostics-core.ts` 依据有效资源数值和采样时间生成
手动优化建议；`CompanionToolsSnapshot.resourceRecommendations` 每次读取重新计算，
过期撤下，不持久化、不改变提醒处置或执行系统配置。`control-center-companion-ipc.ts` 校验控制中心发送方及对应插件门禁，保存原生选择
的范围与执行计划授权，处理取消、窗口关闭及迟到的选择结果；停用取消任务、清理目录／计划并递增权限代际，重新启用不能返回旧结果。不接收渲染器
提交的任意文件清单执行。`companion-files-types.ts` 与 `companion-tools-types.ts`
提供无 Node 实现依赖的界面共享契约。`windows.ts` 只适配原生选择、系统设置、
  文件定位/查看和剪贴板；`main.ts` 注入被动通知并拥有退出时的停止钩子。

`companion-software-inspection.ts` 拥有安装文件采集槽、子进程和取消；固定
`assets/companion/windows-software-inspection.ps1` 有界只读 EXE/MSI，不执行文件。
`companion-software-core.ts` 校验路径与证据协议，结论始终保留捆绑待确认。
`companion-downloads.ts` 单独保存用户选择的目录、可选开关、观察基线、
下载提醒处置和送达状态，拥有 30 秒定时器，暂忙时下轮重试；电脑守护不可用时停止观察、取消迟到检查并保留偏好，重新启用先重建现有文件基线；退出停止观察。
`companion-tools.ts` 保存完整软件登记消失后的历史安装路径与核对结果，
`companion-uninstall-check.ts` 只逐层读取该路径属性，不枚举或删除内容。
软件 IPC 的原生选择与检查归发送窗口所有，取消不修改后台监测开关；
共享契约在无实现依赖的 `companion-software-types.ts`。

本地桌宠分支由 `personal-bootstrap.ts` 进入原有 `bootstrap.ts`。启动器通过
`DESKTOP_PET_PROFILE_DIR` 或 `--desktop-pet-profile-dir=` 指定独立数据目录；首次启动写入中文与隐藏快捷键，后续沿用用户设置。
IPC 发现文件随档案隔离；`main.ts` 不注册上游团队系统链接处理器，不启动上游更新检查。

**Main Process Flow**:
```
bootstrap.ts (Electron package entry)
├── startup-backend-policy.ts (pre-main platform/argv/environment plan; selects launch or replacement-process argv)
└── main.ts (application bootstrap after backend selection)
    ├── lifecycle.ts (app events, cleanup)
    ├── logger.ts (structured logging init)
    ├── app-state.ts (state init)
    ├── pet-install-transaction.ts (startup recovery of interrupted pet commits)
    ├── codex-pet-migration.ts (safe legacy V2 marker repair)
    ├── plugin-service.ts (plugin state/runtime init, JS host wiring)
    ├── tray.ts (tray creation)
    ├── local-ipc.ts (IPC server start)
    ├── control-center-route.ts (canonical route/target validation and dev-only startup routing)
    └── windows.ts (UI handlers)
```

**IPC Request Flow**:
```
local-ipc.ts → local-ipc-request-handler.ts → parseIpcRequest() → handleRequest()
├── hello/status/pets.list/pets.install
└── lease.acquire/heartbeat/release
    └── lease-manager.ts
        ├── resolveTarget() (default vs explicit pet)
        ├── onFirstExplicitLease → agent-pet-controller.showAgentPet()
        └── onLastExplicitLease → agent-pet-controller.closeAgentPetIfOpen()
    └── local-ipc-confinement.ts → confinement-poller.ts → window-tracker.ts
└── Logging via logger.ts (ipc, lease scopes)
```

**Pet Display Flow**:
```

**LAN visiting-pet flow**: with `OPENPETS_LAN_PETS=multi`, each client
registers its selected default pet through `lan-http-controller.ts`.
`lan-controller.ts` reports positions for every pet currently hosted locally
and reconciles coordinator snapshots through `lan-pet-controller.ts`.
Visiting windows are keyed by owner host, use `lan-pet-presence.ts` for pure
show/close and asset-availability decisions, and stay isolated from agent
leases. The bundled pet can render explicitly for fresh-profile LAN testing;
missing or broken catalog assets are skipped without stopping LAN polling.
`lan-pet-activity.ts` gates coarse work signals to active meetings and plans
single-use visitor departures. `lan-pet-controller.ts` renders the built-in
return line plus `running` animation before `lan-controller.ts` requests the
coordinator return the visitor to its owner.
Registration also issues a random per-host session credential:
`lan-controller.ts` presents it for later position, claim, activity, and return
mutations, while `lan-http-controller.ts` rejects shared-token peers that claim
another active host identity.
pet-window.ts
├── createDefaultPetWindow() / createAgentPetWindow()
├── loadDefaultPetContent() / loadExplicitPetContent()
│   ├── HTML generation with CSS sprite animation
│   ├── reaction-animation-mapping.ts (resolveReactionSpriteState)
│   ├── reaction-messages.ts (pickReactionMessage for bubbles)
│   ├── i18n/reactions (localized reaction speech pools)
│   └── Speech bubbles, alert indicators, pinned HUDs, status reactions, and Linux compact/expanded input shapes
├── pet-preload.cjs (source renderer IPC entry; Vite bundles it with pet-chat-markdown.ts, pet-chat-view-state.ts, and ../pet-session/*.cjs into dist/pet-preload.cjs)
├── ../pet-session/session-overlay-view.cjs (ui:session renderer shell: card on top with the orb around the resting pet below it, card chrome, header practice picker, run states + lead-in countdown, frame loop, cue audio, geometry, descriptor intake; practices may override primary/secondary buttons and opt out of pausing)
├── ../pet-session/breathing-practice.cjs / pmr-practice.cjs / grounding-practice.cjs (per-kind practice views: clock, own card rows, shared-row content, orb target; guided breathing's pattern chips live in the breathing view; grounding is self-paced with a sense checklist and a finished summary)
├── ../pet-session/player-practice.cjs (compact media player for narrated tracks: cover, captions, progress, controls, host-cached audio)
├── ../pet-session/soundscape-practice.cjs (Web Audio soundscape mixer: crossfaded loops, randomized accents, volume, sleep timer)
├── ../pet-session/orb-renderer.cjs (WebGL night-sky orb)
  ├── pet-chat-markdown.ts (Electron-free chat escaping and supported markdown subset)
  ├── pet-drag-gesture.ts（纯手动拖拽手势：超过 4 像素才开始，保留原始按下坐标，真实拖动结束后抑制单击）
└── pet-chat-view-state.ts (Electron-free Talk, snapshot ordering, naming, draft derivation, and empty-conversation-only prompt suggestions)
pet-window-interaction.ts
└── mouse passthrough, drag, renderer lifecycle recovery/watchdog, IPC bridge, and speech completion subscriptions；导航与恢复清理会同步发布实际拖拽结束，迟到松手不重复通知

Windows 被动窗口焦点与全屏让位：`wayland-backend.ts` 提供焦点纯函数；
`pet-window.ts` 拥有共享置顶定时器及清理，复用 `window-tracker.ts` 的
`get-windows` 前台窗口查询；`pet-fullscreen-policy.ts` 只比较转换后的客户区
与宠物所在显示器。全屏期间取消置顶，不改隐藏状态，主动聊天仍可输入。

Plugin motion APIs:
plugin-sdk-bridge.ts → plugin-sdk-routes.ts → plugin-pet-registry.ts
└── pet-motion-engine.ts tick() calculates interpolated target vectors for spawned/default pets
```

X11/XWayland pet windows remain focusable for chat and plugin inputs. The
pre-show lifecycle subscribes to structure events and prepares `_NET_WM_STATE`;
after MapNotify it sends EWMH add-state requests and watches the property until
the standard taskbar/pager atoms, and the KDE switcher atom when advertised by
root `_NET_SUPPORTED`, are present. This is pet-window-only (not Control Center)
and does not cover experimental native Wayland. Property verification is not
proof of compositor UI behavior or no visible flash.

**团队移除**：当前入口不初始化团队或签到服务，不注册其深链接；默认宠物载体与桥接移除签到状态及面板。旧数据保留，团队插件不加载执行。

`pet-display-coordinator.ts` owns display-topology and power-resume events and
fans out to the default, agent, LAN visitor, and plugin reclamp leaves.

**Agent Setup Flow**:
```
windows.ts (IPC handler adaptation)
└── control-center-agent-setup-ipc.ts
    └── agent-setup.ts
        ├── agent-setup-cursor.ts (Cursor global MCP lifecycle adapter)
        ├── agent-setup-claude.ts (Claude Code MCP, hooks, and memory lifecycle adapter; receives façade command, formatting, preflight, runner, and journal dependencies)
        ├── agent-setup-opencode.ts (OpenCode global config lifecycle adapter; receives façade-computed paths, versions, detection, and formatting inputs)
        ├── agent-setup-openclaw.ts (OpenClaw global management status/preview/mutation adapter; receives command and runner inputs)
        ├── agent-setup-zed.ts (Zed global MCP settings lifecycle adapter; receives façade paths, command inputs, preflight, and journal completion callbacks)
        ├── agent-setup-external.ts（Codex、ZCode、DeepSeek Harness 与豆包状态聚合和动作分发，依赖由 façade 注入）
        │   ├── agent-setup-codex.ts（CODEX_HOME/hooks.json 与自有脚本；安装、备份、移除、本机测试，信任必须由用户在 Codex 审阅）
        │   ├── agent-setup-zcode.ts（~/.zcode/cli/config.json 用户级 MCP 与 Hooks；保留其他条目，使用打包的 zcode-pet-hook.cjs）
        │   ├── agent-setup-deepseek-harness.ts（DSH_HOME 下指定 profile 的 Cordis bundle；经官方 plugin 命令安装／移除并重新读回登记状态）
        │   └── agent-setup-doubao.ts（生成档案内本机函数桥与配置示例；仅传工作状态，不自动连接豆包客户端）
        ├── external-ai-setup-types.ts（新增四张卡片、动作标识及 IPC 白名单的共享契约）
        ├── external-command-runner.ts（外部检测／管理／测试的有界子进程、超时、Windows 批处理参数及自有进程树清理）
        ├── runAgentSetupAction() (global action lock, validation, and adapter dispatch)
        │   └── Claude lifecycle actions delegate to agent-setup-claude.ts
        ├── OpenCode global config façade orchestration (detection, bundled Node preflight, and action locking)
        ├── Cursor global MCP config management (@open-pets/cursor)
        ├── OpenClaw façade orchestration (command lookup, runner policy, and action locking)
        └── Zed global MCP façade orchestration (settings lookup, Node preflight, action locking, and journal completion)
```

**Pet Installation Flow**:
```
catalog/local ZIP/local folder/codex-pets.ts
├── fully validate and stage a private candidate as a direct child of pets/
└── pet-install-transaction.ts + pet-install-transaction-protocol.ts
    ├── protocol owns the durable journal/schema, managed names, topology classifiers, and recovery policy
    ├── transaction owns filesystem promotion, state mutation, rollback/recovery execution, and side effects
    ├── per-metadata.id lock (local parsing/staging stays parallel)
    ├── journal explicit prepared → backup-created → promoted → state-mutating → committed phases
    ├── preserve old final as a backup, atomically promote the candidate
    ├── mutate app-state.ts only after promotion; rollback ordinary rejection
    └── cleanup backup/marker only after successful mutation; startup recovery is conservative

pet-installation.ts
├── installPet() → getCatalogPet() → downloadPetZip() → extractPetZip()
├── installPetFromZipFile()/installPetFromFolder() → local validation/staging
└── all three paths → runPetInstallTransaction()
codex-pets.ts → validated Codex metadata/assets → runPetInstallTransaction()
```

**Catalog Flow**:
```
catalog.ts
├── catalog-remote.ts → bounded HTTP, final-URL validation, and remote caches
├── V3 index/pages/search → schema validation and V3-to-V2 page conversion
├── V3-only curated visibility and virtual page/search composition
└── V3 → V2 → fixture fallback, with all validated V2/fixture pets browseable and lookupable
```

**Control Center Flow**:
```
tray.ts → openControlCenterWindow(route) → windows.ts
├── hardened BrowserWindow loads Vite renderer or packaged dist/renderer/index.html
├── control-center-preload.cjs exposes page-specific APIs
├── studio/StudioApp.tsx：独立导航、工作区、当前伙伴、请求代次
├── 人设：全局／蒸馏 MD、资料提炼草稿及审阅启用
└── 我的桌宠／共创图库／AI 工作台／人设／插件工坊／设置来源；文件与电脑工具在可选插件配置中挂载
```

Control Center pet-management IPC:
```
windows.ts → control-center-pet-management-ipc.ts
└── injected Electron-free catalog, pet-state, installation, import, pool, and
    default-position handlers with sender authorization supplied by the window host
```

**Plugin Flow**:
```
main.ts → initializePluginService(userData, defaultPluginPetApi, appVersion, ElectronPluginJsHost).start()
├── plugin-state.ts reads/writes userData/openpets-plugin-state.json
├── provider-contract.ts provides the pure canonical adapter and preset catalogs, typed profile union, role support, and credential policy
├── plugin-platform-settings.ts gates audio/voice/microphone/quiet hours and persists versioned, validated provider profiles/selections with migration quarantine
├── provider-service.ts resolves redacted role operation snapshots, credentials, adapter URLs/headers/codecs, and provider diagnostics
├── provider-transport.ts owns provider-neutral fetch lifetime, timeout/cancellation composition, bounded response reads, JSON/SSE decoding, and sanitized HTTP errors
├── provider-configuration-test.ts validates and probes unsaved provider drafts without changing durable settings or credentials; network probes honor caller cancellation; STT uses the host session controller
├── provider-test-lifecycle.ts cancels all provider-test requests for a sender and serializes replacements across modal, renderer, and shutdown teardown
├── plugin-assets.ts validates/resolves declared plugin assets for SDK refs and rendered UI
├── plugin-user-sound-store.ts stores imported user sounds as plugin-scoped opaque refs
├── plugin-diagnostics.ts records plugin errors/quota/settings blocks for inspector/health UI
├── plugin-runtime.ts reloads enabled manifests
│   ├── declarative runtime schedules timer triggers
│   ├── plugin-js-host.ts starts hidden sandboxed BrowserWindow hosts for JavaScript plugins
│   └── plugin-sdk-bridge.ts dispatches namespaced SDK routes
│       ├── plugin-sdk-audio.ts/plugin-voice.ts → renderer/OS playback, MiniMax speech synthesis, and one-shot voice surfaces
│       │   ├── voice-capture.ts/voice-capture-electron.ts → bounded microphone ownership, cleanup, and lifecycle diagnostics
│       │   ├── voice-capture-cancellation.ts → idempotent renderer-cancel/window-destroy ordering
│       │   ├── voice-listening-service.ts → transcription timeout, cancellation, empty-text guard, and boundary diagnostics
│       │   ├── voice-operation-state.ts → internal tray cancellation state and phase tracking
│       │   └── voice-privacy-indicator*.ts → shared live-track accounting and the transient Electron privacy surface
│       ├── plugin-sdk-bus.ts/plugin-sdk-events.ts → curated pub/sub and host event streams
│       ├── plugin-sdk-config.ts/plugin-sdk-storage.ts/plugin-sdk-state.ts → config, persistent plugin data, and subscriptions
│       ├── plugin-sdk-ui.ts/plugin-panels.ts/plugin-toast.ts → bubbles, alerts, commands, panels, and toasts
│       ├── plugin-oauth.ts/plugin-secrets.ts/plugin-ai-gateway.ts → host-mediated auth, encrypted secrets, and AI gateway
│       └── plugin-pet-api.ts/plugin-pet-registry.ts/default-pet-controller → default/spawned pet actions
├── plugin-service.ts orchestrates UI actions, permission confirmation, config validation, install/update/uninstall/load-local, and runtime reloads
└── lifecycle.ts → stopPluginService() on quit

Control Center plugins route:
tray.ts → openControlCenterWindow("plugins") → windows.ts → renderer React app
└── control-center-plugin-ipc.ts (installed once by windows.ts) → injected sender authorization and PluginService access
    └── fixed openpets:plugins-* IPC handlers call PluginService methods

Catalog install/update:
plugin-catalog.ts → plugin-catalog-validation.ts
└── plugin-package.ts downloads HTTPS ZIP, validates SHA-256, extracts root manifest only, and installs to userData/plugins/{id}

Local development load:
plugin-local-loader.ts validates selected folder manifest and snapshots only openpets.plugin.json to userData/plugins-dev/{id}
```

**Localization Flow**:
```
main.ts/settings → i18n.setLocaleFromPreference(system/user locale)
├── i18n/catalog.ts resolves host message dictionaries with English fallback
├── reaction-messages.ts reads localized reaction pools for pet speech
├── windows.ts exposes active messages to the Control Center renderer
└── plugin-i18n.ts resolves plugin locales, manifest $t: fields, and ctx.t(...) runtime strings
```

## Integration Points

本地电脑助手：`companion-diagnostics.ts` 拥有固定 Windows PowerShell 采集的
子进程、超时、取消、同类请求合并及协议校验；`companion-diagnostics-types.ts`
是主进程与界面共享的证据类型。`assets/companion/windows-diagnostics.ps1`
只读采集固定磁盘、资源进程、登记软件、部分自启和窗口进程归属；输出有数量上限，
读取不足不会伪装成功。退出时调用 `cancelCompanionDiagnostics()`。
行为测试位于 `tests/companion-diagnostics.test.ts`；范围见
`docs/companion-diagnostics.md`。

- **Within src/**:
  - `main.ts` → all modules (orchestrator), including `ElectronPluginJsHost` for JavaScript plugins
  - `local-ipc.ts` ↔ `lease-manager.ts` ↔ `agent-pet-controller.ts`
  - `windows.ts` ↔ 状态、代理接入、素材、插件、提供方、电脑和人设等功能服务；不绑定团队或上游更新操作
  - `windows.ts` ↔ `plugin-service.ts`，提供工作室插件界面、权限、配置和动作入口
  - `pet-window.ts` ↔ `pet-window-interaction.ts`, `default-pet-controller.ts`, `agent-pet-controller.ts`
  - `default-pet-chat.ts` ↔ `pet-window.ts` for main-owned compact/expanded carrier focus and Linux input-shape transitions
  - `pet-window.ts` ↔ `plugin-bubble-arbiter.ts`, `plugin-pet-registry.ts`, `pet-motion-engine.ts` for plugin-driven bubbles, spawned pets, and movement updates
  - `pet-installation.ts` ↔ `app-state.ts`, `catalog.ts`, `zip-safety.ts`
  - `pet-install-transaction-protocol.ts` ↔ `pet-install-transaction.ts`; owns the stable durable journal/schema, managed naming, topology classifiers, and recovery policy
  - `pet-install-transaction.ts` ↔ `pet-installation.ts`, `codex-pets.ts`, `main.ts`; owns filesystem/side-effect orchestration, private staged promotion, per-ID serialization, journal cleanup, and conservative startup recovery
  - `plugin-service.ts` ↔ `plugin-state.ts`, `plugin-runtime.ts`, `plugin-catalog.ts`, `plugin-package.ts`, `plugin-local-loader.ts`, `plugin-js-host.ts`, `plugin-sdk-bridge.ts`, plugin SDK namespace modules, diagnostics, assets, settings, panels, voice, OAuth, secrets, and user sounds
  - `i18n/` ↔ `tray.ts`, `windows.ts`, `pet-window.ts`, `reaction-messages.ts`, `plugin-i18n.ts`

- **To packages/**:
  - `@open-pets/claude`: `buildClaudeMcpPreview`, `installClaudeHooks`, `doctorClaudeHooks`, etc.
  - `@open-pets/opencode`: `prepareOpenCodeGlobalSetup`, `doctorOpenCodeGlobalSetup`
  - `@open-pets/cursor`: `planCursorMcpInstall`, `executeCursorMcpWrite`, `buildCursorRulesPreview`, etc.
  - `@open-pets/openclaw`: `buildOpenClawCommand`, `classifyOpenClawStatus`, and `planOpenClawMutation` for native plugin management
  - `@open-pets/zed`: `getZedSetup`, `planZedMcpInstall`, `planZedMcpReplace`, `planZedMcpRemove`, etc.
  - `@open-pets/cli`: Version lookup for bundled mode
  - `@open-pets/plugin-sdk`: Published SDK contract mirrored by the desktop bridge and conformance checks

- **To System**:
  - File system: `app.getPath("userData")`, `userData/plugins/`, `userData/plugins-dev/`, plugin storage JSON, `~/.codex/pets/`, `~/.claude/`, `~/.opencode/`, platform-specific Zed settings
  - Network: `fetch()` to openpets.dev, GitHub API, plugin catalog at `https://openpets.dev/plugins/catalog.v1.json`, plugin ZIPs restricted to `https://zip.openpets.dev/plugins/`
  - Processes: `spawn()` for `claude`, `opencode`, `openclaw`, `node`

## Key Modules

**Core**:
- `companion-files.ts`：本地文件助手 owner；在用户选定范围内进行有界只读分析／文件名查找，生成主进程持有的整理／复制计划，执行无覆盖且内容校验的文件操作，保存操作记录并核对后续变化后撤销。Electron 文件选择和打开入口由控制中心 adapter 负责；规则见 `docs/companion-files.md`。
- `bootstrap.ts`: Package-entry pre-main backend bootstrap; uses `startup-backend-policy.ts` and starts a normalized replacement with Node `child_process.spawn` when needed, waits up to 15 seconds for a bounded ready/failure IPC handoff, supervises unpackaged replacements with signal/exit propagation, and detaches packaged replacements
- `startup-backend-policy.ts`: Pure platform/argv/environment policy for normal X11, Wayland opt-out, and native layer-shell startup selection
- `main.ts`：独立工作室启动编排，组合档案、插件、陪伴、AI、电脑工具、本机接入和快捷键；不初始化团队服务
- `personal-launch-options.ts`：解析独立档案及显示桌宠／打开工作室的显式启动意图；无效目录不能静默落回默认档案。
- `lifecycle.ts`：退出清理与单实例事件；显式快捷方式启动意图交给 main 执行，普通重复启动沿用窗口聚焦。
- `state.ts`: Simple shell pause state
- `app-state.ts`: Persistent JSON state with V1 schema, atomic writes, reaction animation overrides, validated waiting animation duration, persisted idle cursor-gaze preference, and host Pet Assistant personality preferences
- `default-pet-position-state.ts`: Electron-free default-pet position shape, coordinate/display-key normalization, and bounded per-monitor LRU updates
- `app-state-core.ts`: Pet scale options, waiting-duration options/normalization, idle cursor-gaze default/normalization, onboarding normalization
- `pet-assistant-host.ts` / `pet-assistant-service.ts`: Host-owned provider-neutral assistant lifecycle, per-turn prompt composition, terminal outcome reduction, and generation-pinned capability routing
- `pet-assistant-memory.ts`: Electron-/filesystem-free completed-turn memory owner with bounded active context, archive deduplication/context selection, canonical terminal-text appends, and archive list/delete/clear delegation
- `pet-assistant-archive.ts`: Host-owned local terminal-text archive with atomic writes, retention/quarantine, and bounded prompt-window support
- `pet-assistant-history-ipc.ts`: Pure narrow history list/delete/clear handler helpers, including startup and identifier validation
- `pet-assistant-conversation.ts`: Host-owned current-session presentation projection, stable typed-chat controller, cancellation seam, and normalized voice-transcript seam
- `pet-assistant-personality.ts`: Pure personality defaults, bounds, patch validation, and safe deterministic serialization
- `pet-assistant-feedback.ts`：原对话／实时语音活动和终态投影；开始思考或工作、终态清活动，成功及语音回退明确 `success`，失败 `error`。展开聊天抑制重复回复文字，保留动画。
- `team-service.ts`（遗留，当前运行入口未加载）: Teams enrollment preview lifecycle, authoritative identity/expiry snapshots, serialized enrollment/sync/leave operations, and preview-change subscriptions used to refresh an already-running Control Center route
- `manager-check-in-service.ts`（遗留，当前运行入口未加载）: Bundled weekly Manager Check-ins lifecycle; synchronizes organization settings/history, computes local-week due state, presents a history-free pet snapshot, owns explicit submission and idempotent retry behavior, and keeps pause state device-private
- `manager-check-in-state.ts`: Atomic local Manager Check-ins state with bounded history, pending client-generated submission identity, local-week offer/submission markers, and scheduled-offer pause
- `team-api-client.ts`（遗留，当前运行入口未加载）: Teams enrollment, Team Pack, and Manager Check-ins API adapter; validates fixed feelings and bounded submissions, while the pet card enforces its 500-character note limit and client-generated IDs provide idempotent immutable retries
- `logger.ts`: Structured logging with scopes (app, ipc, lease, pet.default, pet.agent, pet.window, state, tray, ui, voice, provider), log rotation, redaction
- `bundled-plugins.ts`: Canonical official plugin IDs shared by plugin seeding and packaged-output validation
- `packaging-contract.ts`: Packaged bundled-plugin manifest/asset/locale and unpacked integration-runtime contract helpers
- `packaging-output-contract.ts`: Pure packaged-output tree validation that rejects unowned app collateral and sensitive files without rejecting ordinary dependency paths
- `appimage-payload.ts`: Pure ELF64 parser that locates the Type-2 AppImage SquashFS payload immediately after its section-header table without executing the Linux artifact
- `artifact-payload.ts`: Cross-platform distributable extraction for target-aware packaged payload validation

**UI**:
- `tray.ts`：独立托盘菜单、显示隐藏、暂停恢复、新工作室页面及日志入口，无上游更新或组织入口
  - `windows.ts`：安全窗口、来源协议、路由、插件／宠物／提供方／人设／电脑桥接和原生选择；制作及提炼操作按发送窗口取消
  - `control-center-route.ts`: Canonical `ControlCenterRoute` and typed startup-target validation shared by window routing and the unpackaged development startup route
- `control-center-plugin-ipc.ts`: Injected fixed Control Center plugin IPC registrations, sender authorization, boundary validation, PluginService delegation, catalog refresh normalization, inspector access, and picker diagnostics
- `control-center-agent-setup-ipc.ts`: Injected fixed Control Center agent-setup IPC registrations, sender authorization, action validation, and agent-setup delegation
- `control-center-remote-ipc.ts`: Injected fixed Control Center remote-control IPC registrations, sender authorization, request validation, snapshot composition, and RemoteControlService delegation
- `control-center-pet-management-ipc.ts`：控制中心宠物/目录管理边界，负责状态与布局投影、安装与导入、排序、位置复位及绑定窗口的共创导出与取消。
- `preference-patch.ts`: Pure validation of Control Center preference patches (`validatePreferencePatch`/`PreferencePatch`) for the `update-preferences` IPC path, including waiting animation duration, idle cursor gaze, `petCrossDisplayEnabled`, and Pet Assistant personality fields; consumed by `windows.ts`
- `assets.ts`: Tray icon loading with generated fallback
- `display.ts`: Screen geometry helpers, pet window positioning
- `pet-window-shape.ts`: Pure Linux pet hit-shape calculation, including input masks for the compact carrier and the bottom-anchored expanded attached chat panel
- `default-pet-chat.ts`: Host-side in-pet chat coordinator, handling attached chat expansion, dynamic panel height synchronization, IPC dispatch, conversation transcript streams, talk status, and prompt suggestions
- `default-pet-chat-geometry.ts`: Bijective coordinate mappings and anchor-preserving window bounds for collapsed, expanded-chat (420x640), and pet-scale-derived session carrier states, plus bottom-relative panel positioning and session orb/window sizing calculations
- `pet-session-overlay.ts`: Practice session overlay coordinator for the `ui:session` plugin surface — owns the single active session descriptor (breathing or PMR; tracks the overlay's pattern pick as the live selection) the per-practice carrier height hint, and the renderer-measured carrier height (card + orb) the carrier then fits, host-localized chrome strings, plugin-driven pause/resume/stop controls, in-place same-plugin session replacement without carrier flicker, practice-switch event relay to the owning plugin, the Info window lifecycle, and carrier open/replace/displacement/close lifecycles
- `session-media-cache.ts`: Host-owned cache for player-session media — downloads each approved-host https segment once via `safeHttpFetchBytes`, keeps it under userData (LRU cap), and serves it on the privileged `openpets-session-media:` scheme
- `session-icons.ts`: Stroke-only SVG paths for the allowlisted session icon names, shared by the Info window and (via the coordinator's renderer payload) the pet overlay's practice picker and grounding senses
- `pet-session-info-window.ts`: Host-rendered, script-free session Info window (logo header, mechanism/science cards with allowlisted study links, checklists, citations, disclaimer, site attribution) built from the validated descriptor
- `plugin-session-descriptor.ts`: Pure validation and types for the practice session overlay descriptor union (breathing patterns/phases vs PMR 10s tense/release steps and cues vs self-paced grounding senses with items, practice-switching options, Info content with sections/items/cards, https-only links, manifest logo ref)
- `window-tracker-latch.ts`: Re-entrancy latch helper (`createLatchedTick`) that prevents overlapping async ticks from stacking; used by the window-tracking poller
- `renderer/`：studio/ 独立工作室及明确迁入的功能组件，旧 Dashboard 和 Teams 不进入主入口。

**Pets**:
- `pet-window.ts`: Public pet-window lifecycle facade: transparent frameless window creation, HTML/CSS composition, sprite and transient presentation updates, companion launcher, attached chat styling, bubble suppression, status badges, validated atlas layout selection, context-menu installation delegation, and Linux X11 show/hide gating
- `x11-pet-window-state.ts`: X11 client adapter that subscribes to StructureNotify before show, waits for matching MapNotify, sends post-map EWMH state additions, and observes `_NET_WM_STATE` until standard exclusion atoms and the KDE switcher atom when advertised by root `_NET_SUPPORTED` are present
- `x11-pet-window-state-core.ts`: Electron-free EWMH atom/property helpers for merging existing state and checking required atoms
- `pet-window-x11-map-core.ts`: Electron-free matching/cancellation state for the target window's MapNotify transition
- `pet-window-show-coordinator.ts`: Generation-based readiness gate that prevents stale asynchronous completion from showing a pet after a later hide
- `pet-window-interaction.ts`: Per-window interaction controller owning mouse passthrough, drag and renderer lifecycle IPC, recovery/watchdog timers, dragging state, and process-wide speech-completion subscriptions
- `wayland-layer-backend.ts`: Electron adapter that owns the native helper process/socket, reconnect generations, timers, frame scheduling, `NativeImage` conversion, renderer pointer replay, drag/menu behavior, and patched pet-window methods
- `wayland-layer-protocol.ts`: Electron-free layer-shell wire encoders, incremental helper-message decoder, transparent BGRA cropping, and pointer button/coordinate mapping
- `pet-window-context-menu.ts`：原生／layer-shell 五项右键菜单、单次与双次右键判断、已保存动作和安静开关、隐藏、同一桌宠输入框、全局大小设置；隐藏／导航／关闭清理延迟菜单。
- `pet-window-gaze.ts`: Shared preference-gated, movement-driven V2 idle cursor-gaze controller, including renderer/window lifecycle, cursor tracking, gaze eligibility, and gaze IPC updates
- `default-pet-chat.ts`：桌宠对话展开与收起、菜单及双击共用输入框、发送窗口授权、唯一对话流、语音订阅和资源清理。
- `desktop-pet-messages.ts`：启动期间有界暂存实际显示的文字／Markdown 提醒与发生时间；同一气泡去重，接到唯一桌宠会话后写入归档，不发起模型请求；动态内容和 HUD 不入文字历史，退出清理暂存。
- `pet-transient-presentation.ts`: Reusable per-pet owner for transient display/badge state, transition-unique opaque render-composition tokens, independent display/badge timer guards, timer cleanup, and deterministic transition callbacks; default/agent controllers retain window/voice/lease role ownership
- `pet-display-coordinator.ts`: Electron-free display/power listener lifecycle, independent topology debounce lanes, cache invalidation, ordered reclamp fanout, and resume recovery
- `default-pet-controller.ts`：默认桌宠显示隐藏、位置、临时反应与行为组合。单击归宿主随机动作；真实 AI 和当前随机动画优先，但保留气泡文字。旧有限反应结束刷新组合，不盲写 idle；移动门禁检查真实临时反应与工作状态，合成 idle 不阻塞手动移动。隐藏、拖拽、暂停及窗口关闭取消随机计时。
- `pet-behavior-config.ts`：纯偏好验证，默认安静、旧／坏档案回安静待机；动作编号唯一、名称有界、最多 24 个，只绑定七种已有图集状态。
- `pet-behavior.ts`：随机候选去重／避开当前状态，六秒回待机，非安静每 45 秒自动动作；基础 idle 与随机直接绑定动画，AI 用既有 reaction 映射。按真实来源聚合 AI 活动，持有有界失联租约和隐藏／暂停／拖拽／锁屏阻塞；沿真实点击／拖拽投影可选媒体动作，观察唯一养成快照并持有睡眠到期定时，stop 清定时与活动，不复制睡眠存档；纯 compose 保留原反馈文字。
- `agent-pet-controller.ts`: Lease-triggered pet windows, dismissal tracking, transient displays, status badges, logging
- `pet-motion-engine.ts`: Interpolated movement vector/tick engine for plugin-driven pet motion and target-following behavior
- `built-in-pet.ts`: Built-in pet constant
- `reaction-messages.ts`: Message pools for each reaction type
- `reaction-animation-mapping.ts`: Reaction-to-animation state mapping, user-configurable overrides, bundled V2 Hoodie Cat atlas metadata, canonical sprite state definitions, and derived waiting-duration state tables
- `i18n/`: Host message catalogs and localized reaction pools; see [i18n/codemap.md](i18n/codemap.md)

**IPC**:
- `local-ipc.ts`：原本机服务、发现、网络门禁及请求／约束组合；租约按 leaseId 投影，外部平台的工作摘要由单一 `ExternalAiActivityTracker` 投影为独立来源、工具进度与本轮成功文件数，一个会话结束不清其他会话。九十秒失联撤销活动，十分钟有限保留；退出清理全部来源。缺少身份的旧事件仍走原匿名槽，不猜测账户。
- `local-ipc-request-handler.ts`：纯本机 IPC 解析、校验、请求路由、效果顺序与响应；效果前校验 `externalAi` 最小元数据，禁止与租约混用身份，原请求与响应保持不变。
- `external-ai-activity.ts`／`external-ai-progress.ts`：有限会话、并行工具调用和唯一成功文件计数；平台白名单包含十类接入，方舟应用与豆包客户端区分，白名单不代表全部宿主已提供事件。无调用编号的终态工具失败清除该会话挂起工具；纯显示格式供控制中心与默认宠物浮层共用，不传原始提示词／命令／文件路径。
- `local-ipc-confinement.ts`: Electron-free module-lifetime coordination between explicit leases, terminal tracking, confinement state updates, and tracker cancellation
- `local-ipc-protocol.ts`: Protocol constants, request/response types, validation functions
- `local-ipc-paths.ts`: Platform-specific socket paths and discovery file locations

**Capture (dev only)**:
- `capture-session.ts`: Dev-only screenshot session driven by `scripts/capture.mjs` via `OPENPETS_CAPTURE_SESSION_DIR` (ignored when packaged): isolated userData + sRGB color profile before app ready, a private Unix control socket separate from local IPC, plugin-command/say/react/quit handlers, chat panel/send/clear and Chat/Talk button handlers, provider listing and first-profile auto-selection, default-pet selection, Control Center opening/sizing, selector-based UI click/type for staged states, and pet- or Control Center-window `capturePage()` shots written as trimmed PNGs (see `docs/screenshots.md`)
- `capture-image-core.ts`: Pure alpha-bounds detection and even-padding re-framing for capture bitmaps
- `lease-manager.ts`: Lease lifecycle (acquire, heartbeat, release, cleanup), target resolution

**Installation**:
- `pet-installation.ts`：ZIP 下载、有界解包、宠物校验及锁内安装、移除、个人宠物导出和从 V2 图集制作的编排。
- `pet-authoring-types.ts`：制作输入、缩小预览及成功结果的纯共享契约，不暴露来源路径或摘要。
- `pet-package-export.ts`：有界读取并校验个人宠物运行素材，只写新建唯一分享目录；失败或取消仅清理本次目录。
- `pet-sharing-contract.ts`：不依赖 Node/Electron 的分享格式、结果、字段限额及选项校验；不承载凭据或来源路径。
- `pet-install-transaction-protocol.ts`: Electron-free stable pet-install journal/schema, managed naming, topology classifiers, and recovery decision policy
- `pet-install-transaction.ts`: Electron-free staged pet commit filesystem/side-effect orchestrator, canonical private-root/marker validation, per-ID lock, rollback execution, bounded cleanup warnings, and idempotent startup recovery
  本地 ZIP 在取得可信宠物编号前失败时，通过 `discardPetInstallStagingCandidate` 清理具有正确所有权标记的暂存目录与标记；已交给事务或存在不可解析日志时保留，由事务恢复处理。
- `pet-paths.ts`: Safe path resolution for pet directories
- `pet-file-safety.ts`: Bounded, no-follow regular-file reads shared by pet import and installed-pet rendering
- `codex-pets.ts`: Import from `~/.codex/pets/` with validation
- `codex-pets-core.ts`: Codex V1/V2 metadata, exact V2 atlas, and neutral-pose layout validation
- `codex-pet-migration.ts`: Idempotent startup repair for legacy Codex V2 imports gated by canonical source, exact local atlas validation, and byte hash equality
- `installed-pet-layout.ts`: Bounded installed-manifest reader shared by pet windows and Control Center sprite previews
- `catalog-remote.ts`: Remote catalog HTTP, bounded streaming, endpoint checks, validation, and per-client V3/V2 caches
- `catalog.ts`: Public catalog façade with V3 pagination/search composition, V3-only curated visibility, all-pet V2/fixture fallback, lookup, and V1/V2 sprite metadata conversion
- `catalog-validation.ts`: CatalogV2/V3 schema validation, including optional exact V2 sprite-version metadata
- `zip-safety.ts`: ZIP entry path validation (traversal prevention, case collision detection)

**Plugins**:
- `plugin-manifest.ts`: Manifest V1/V2/V3 schema/types and validation for declarative and JavaScript runtimes, permissions (`timer`/`schedule`, `pet:*`, `pets:*`, `audio`, `events`, `ui:*`, `notify`, `bus`, `ai`, `secrets`, `voice:*`, `auth`, `files`, `system:*`, `clipboard`, `network:*`), config schema, timer triggers, assets, panels, entry files, and pet actions.
- `plugin-manifest-reader.ts`: Safe manifest reader with realpath/allowed-root checks, root filename enforcement, size limit, and expected id/version matching.
- `plugin-config.ts`: Config defaulting, replacement validation, and runtime resolution for string/number config references.
- `plugin-state.ts`: Persistent plugin state store (`openpets-plugin-state.json`) with atomic temp+rename writes, normalized records, approved permissions, config, source, and broken reason；真实提交／读取后发布状态事件。
- `plugin-runtime.ts`: Runtime that compiles enabled declarative timer triggers, starts/stops JavaScript plugin hosts, verifies approved permissions, exposes public command/status state, validates actions, schedules cancellable timers, and marks broken plugins on validation/action failure；发布启动／停止／重载事件并提供真实 `isPluginActive`，握手未完成不视为运行。
- `plugin-pet-api.ts`: Narrow adapter from plugin actions to default pet external `say`/`react` controller calls.
- `plugin-service.ts`: Application-facing plugin orchestrator for safe snapshots, enable/disable, config save, command execution, reload, catalog install/update, local load, uninstall, permission prompts, compatibility checks, JavaScript host/SDK bridge integration, and runtime reloads；组合原状态与运行事件订阅，快照投影真实 `active`。独立发行关闭内置播种，新档案无预装插件；升级只解除个人安装的旧 `bundled` 标识，保留插件文件、配置、权限、来源与退役编号内容，恢复普通卸载和更新。显式开启播种时保留原 SDK 行为。
  - 开发目录同步的清理范围按平台路径语义限定为 `plugins-dev` 的严格子目录；Windows 分隔符可正常识别，根目录、相似前缀和跨盘目标拒绝清理。
- `plugin-catalog.ts`: Remote plugin catalog fetch with timeout, redirect rejection, response size cap, cache, and refresh support.
- `plugin-catalog-validation.ts`: Catalog V1 schema validation, duplicate id checks, semver/SHA fields, permissions canonicalization, and optional minimum OpenPets version.
- `plugin-package.ts`: Catalog plugin package download/install with HTTPS host/path allowlist, SHA-256 verification, ZIP size/entry restrictions, manifest/catalog consistency checks, and safe uninstall path resolution.
- `plugin-local-loader.ts`: Developer loader that validates a selected local folder and snapshots only the manifest into `plugins-dev` with symlink/path/size protections.
- `plugin-js-host.ts`: Sandboxed hidden BrowserWindow host for JavaScript plugin entry modules with per-plugin session partitioning, navigation/window-open hardening, SDK IPC tokening, registration handshake, config listener cleanup, and teardown.
- `plugin-sdk-bridge.ts`: Permission-checked JavaScript plugin SDK bridge that validates routes, creates plugin contexts, enforces approved permissions/quotas, and delegates namespace behavior to focused SDK modules.
- `plugin-sdk-network.ts`: Guarded DNS and agent transport, bounded dispatch/response limits, and bounded agent cleanup; the bridge tracks, aborts, and drains requests by API generation.
- `plugin-sdk-audio.ts`: Audio SDK facade that checks global audio settings, resolves plugin/user sound refs, and reports blocked playback through diagnostics.
- `plugin-sdk-bus.ts`：插件间发布／订阅、JSON 规范化与插件范围路由；权限与配额通过后允许已注入的宿主被动观察，宿主观察失败不影响插件订阅者，不增加插件 API。
- `plugin-sdk-config.ts`: Runtime config read/change namespace backed by validated plugin config state.
- `plugin-sdk-events.ts`: Curated host event subscription namespace for pet clicks, drag/drop, display, power, idle, and config change signals.
- `plugin-sdk-quotas.ts`: Shared quota counters and limits for SDK namespaces.
- `plugin-sdk-routes.ts`: Route table and dispatch contract between preload IPC calls and host SDK handlers.
- `plugin-sdk-state.ts`: Shared plugin context state, listener cleanup, and lifecycle bookkeeping used by route handlers.
- `plugin-sdk-storage.ts`: Quota-bound plugin storage namespace with key enumeration and subscriptions.
- `plugin-sdk-types.ts`: Internal host-side SDK interfaces mirroring the published `@open-pets/plugin-sdk` contract.
- `plugin-sdk-ui.ts`: Host-rendered UI namespace for bubbles, alerts, menu items, panels, practice session overlays, and dynamic interaction callbacks.
- `plugin-assets.ts`: Declared asset resolution and validation for icon/image/svg/sprite/sound references used by plugin SDK calls and catalog cards.
- `plugin-bubble-arbiter.ts`: Priority/coalescing arbiter for transient and pinned plugin bubble slots.
- `system-metrics-core.ts`: Electron-independent metric/counter types, pure parsers/calculations, network throughput sampler, and stale-while-revalidate cache.
- `system-metrics.ts`: Best-effort OS command/filesystem adapters for GPU, disk, battery, and aggregate network throughput; optional fields carry extended-sample freshness metadata.
- `plugin-diagnostics.ts`: Per-plugin error/quota/settings-block collector surfaced to inspector and plugin health views.
- `plugin-events-source.ts`: Host event source adapter for pet/window/system events consumed by `plugin-sdk-events.ts`.
- `plugin-host-capabilities.ts`: Main-process capability bundle injected into the bridge for Electron side effects.
- `plugin-i18n.ts`: Plugin locale catalog loader and `$t:`/`ctx.t()` resolver with English fallback.
- `plugin-oauth.ts`: Host-mediated OAuth/PKCE flow and token session lifecycle for plugins.
- `plugin-panels.ts`: Sandboxed plugin panel BrowserWindow coordinator and message bridge.
- `plugin-pet-registry.ts`: Registry for default and plugin-spawned pets, including lifecycle and SDK targeting；默认句柄无窗口时返回保存位置及不可见状态，读取不创建窗口，未知句柄仍拒绝。
- `plugin-platform-settings.ts`: Global plugin-platform settings for audio, voice, speech, microphone, quiet hours, and independent provider profiles/selections; versioned migration/quarantine; host-owned atomic profile/credential/role saves and redacted-header add/replace/delete patches; no legacy `ai` object is read.
- `provider-contract.ts`: Pure canonical provider adapter definitions, typed adapter-specific profiles (including native ElevenLabs Scribe STT), role support, credential policies, default auth, and preset catalog owned by the host and exposed through the renderer contract.
- `provider-service.ts`: Host-owned provider operation boundary; resolves snapshots and credentials, constructs adapter URLs/headers/payloads, validates adapter responses, and emits bounded outbound/terminal diagnostics. Transcription preserves the generic OpenAI-compatible multipart route and uses the typed ElevenLabs `/speech-to-text` `model_id` route for Scribe.
- `provider-transport.ts`: Provider-neutral fetch lease with redirect rejection, timeout/caller-abort composition, bounded body consumption, JSON/SSE decoding, sanitized HTTP error detail, and idempotent response cleanup.
- `plugin-secrets.ts`: Plugin-scoped encrypted secret storage backed by Electron safe storage primitives.
- `plugin-toast.ts`: Host toast/notification routing for plugin UI events.
- `plugin-user-sound-store.ts`: Plugin-scoped imported user sound registry that stores opaque sound refs instead of raw filesystem paths.
 - `plugin-voice.ts`: Voice/TTS and one-shot listen facade gated by settings and permissions; owns host cancellation hooks, shared operation reservations, and the private realtime conversation entry points.
- `provider-configuration-test-session.ts` / `voice-media-player.ts`: Bounded provider transcription session with ownership reserved before initialization, and a serialized trusted persistent-partition player for generated audio, with explicit sink-routing fallback and trusted output capability probing.
- `provider-test-lifecycle.ts`: Shared per-sender cancellation and replacement-lane helpers ensuring rapid provider tests serialize teardown, renderer loss reaches queued/initializing work, and only the latest replacement starts capture.
- `voice-assistant-session-contract.ts`: Pure exported generic/Realtime voice-session contracts shared by the host, Realtime adapter, feedback reducer, tray, and session implementation.
- `voice-assistant-host-core.ts` / `voice-assistant-session.ts`: Host-owned one-shot Talk toggle and generic recording state machine; the implementation retains mutable stage/lifecycle ownership while consuming the pure session contracts. Submission clears its capability before capture stop settles, terminal output ends the session without automatic re-listen, and primary toggles are non-destructive during processing and native Realtime activity.
- `voice-device-service.ts` / `voice-device-resolver.ts` / `voice-device-electron.ts` / `voice-device-permissions.ts`: Host-owned durable voice input/output preferences, capability-safe snapshots, immutable per-operation input resolution, trusted `setSinkId` probing, shared trusted media partition, and restricted audio permission boundary.
- `voice-capture.ts` / `voice-capture-electron.ts`: One-active-at-a-time microphone capture with separate acquisition timeout, media-track cleanup, temporary-session teardown, and bounded lifecycle diagnostics.
- `voice-microphone-arbiter.ts`: Shared lease boundary preventing one-shot and realtime microphone ownership from overlapping.
- `voice-conversation.ts` / `voice-realtime-electron.ts`: Generation-safe host conversation lifecycle and thin hidden renderer/WebRTC adapter; intentionally not exposed through the plugin SDK.
- `voice-capture-cancellation.ts`: Idempotent renderer-cancel/window-destroy ordering for Electron capture teardown.
- `voice-listening-service.ts`: Transcription timeout, abort handling, whitespace-only rejection, late-event suppression, capture stop/submit forwarding, and capture/transcription boundary diagnostics.
- `voice-operation-state.ts`: Internal acquisition/recording/transcription state surfaced to host tray controls, including reservations held during asynchronous listen initialization.
- `voice-privacy-indicator.ts`: Host-owned live microphone-track accounting shared by one-shot capture and realtime conversation; it creates no detached UI surface.

**Agent Integration**:
- `agent-setup.ts`: Claude/OpenCode/Cursor detection, OpenClaw native plugin discovery/mutation, MCP configuration, hooks management, action journaling
- `agent-setup-external.ts`：消费 façade 的当前档案、Node／DSH 命令和解包资源，聚合 Codex、ZCode、DeepSeek Harness、豆包开发接口，保留配置状态与运行时验证的区别；外部工具接入不改变宠物大脑提供方。
  `agent-setup.ts` 的命令路径白名单包含 Codex，使用既有绝对路径与可执行文件校验保存到当前桌宠档案；空值清除覆盖，不改 Codex 本身的配置。
  `main.ts` 在正式 IPC 就绪后通过 `bindAgentSetupActivitySource()` 注入同一个会话投影读取器；快照分别显示配置与近期正式工作事件，不新建第二套会话状态，自测与单独 session-start 不算会话确认。
- `agent-setup-codex.ts` / `agent-setup-zcode.ts`：管理各工具用户级官方 Hooks／MCP 及本项目条目，固定本机发现文件；Codex 状态始终保留“信任待确认”，ZCode 全局 Hooks 已停用或同名 MCP 不属本项目时报告冲突。
- `agent-setup-deepseek-harness.ts`：拥有本档案 `integrations/dsh` bundle 准备与源校验、profile 备份、官方 plugin 命令调用和读回验证；`web` 与 `desktop` 档案分别配置，安装登记不代表当前运行界面已加载。
- `agent-setup-doubao.ts`：拥有本档案 `integrations/doubao/doubao-pet-bridge.mjs` 的生成、冲突检查、移除和本机测试；兼容六种简短状态，另接收有界的正式应用会话／工具事件，`remote: false`，不读豆包登录状态，不建立 HTTP 服务，不传聊天文本或额度。聚合卡片明确禁用 PC／网页自动连接，开发桥不算其客户端已连接。
- `external-ai-setup-types.ts` / `external-command-runner.ts`：前者定义渲染器可消费的窄卡片、动作与白名单；后者单独管理新增外部工具的命令运行、16 KiB 输出流和超时后自有进程树清理，不替代既有 runner。
- `claude-memory.ts`: Claude instructions file management (`~/.claude/openpets.md`)
- `update-checker.ts`：只读取本仓库正式 Release，拥有目标平台包的流式 SHA-256 下载、状态和用户点击后的安装；不接收界面 URL 或路径。`update-release.ts` 持有固定仓库、平台资产、校验清单和 HTTPS 跳转白名单；`update-types.ts` 为无 Node 的窄快照。`update-package.ts` 在全新同盘目录中安全解压并生成逐文件摘要，拒绝程序目录内的个人档案；解包的 `assets/companion/windows-portable-update.ps1` 复核清单、确认就绪、等本次程序退出后替换并保留原程序备份，失败回退，以原档案和启动意图重启。只支持可写普通便携目录，不满足条件则保留已核验 ZIP 手动更新；Mac 只打开已核验 ZIP。`control-center-update-ipc.ts` 对所有更新操作验证控制中心发送方。
- `update-version.ts`: Version parsing and comparison

**Tests** (excluded from detailed codemap coverage per repository conventions):
- Behavior tests live in `tests/*.test.ts` (compiled to `.test-dist/tests/`); provider foundation persistence, migration, credential ownership, preset/role behavior, routing, TTS voice precedence, and realtime boundaries are covered by `provider-profiles.test.ts`, `provider-presets-and-roles.test.ts`, `provider-migration.test.ts`, `provider-credential-deletion.test.ts`, `provider-service.test.ts`, `voice-assistant-host-core.test.ts`, `voice-realtime-assistant.test.ts`, `voice-device-state.test.ts`, `voice-device-selection.test.ts`, `pet-assistant-feedback.test.ts`, `text-model-client.test.ts`, and `plugin-ai-gateway.test.ts`; Talk tests cover atomic recording submission, non-destructive repeated toggles, immediate response feedback, one-shot terminal cleanup, explicit next-turn activation, and Realtime response completion; voice device tests cover durable preference normalization, device resolution, operation snapshots, and selected-input propagation without OS hardware; `codex-pets.test.ts` asserts released V1/V2 metadata fixtures and strict V2 atlas contracts; `pet-install-transaction.test.ts` covers staged promotion, rollback, conservative recovery, and path/marker safety
- Contract tests live in `contracts/*.contract.ts` (compiled to `.test-dist/contracts/`)
- Runtime checks (`check-*.ts`) remain in `src/` for packaging/validation (compiled to `dist/`)

## Data Flow Summary

| Source | Destination | Data |
|--------|-------------|------|
| Catalog API | `catalog.ts` | `CatalogV2/V3` JSON with pagination |
| ZIP/local/Codex staging | `pet-installation.ts` / `codex-pets.ts` | Fully validated private candidate under `userData/pets/` |
| Pet promotion/recovery | `pet-install-transaction-protocol.ts` + `pet-install-transaction.ts` | Stable journal/schema/naming/recovery policy plus filesystem/side-effect orchestration for journaled atomic promotion to `userData/pets/{id}/`, rollback, and startup recovery |
| `app-state.ts` | `userData/openpets-state.json` | Atomic JSON writes with reaction animation overrides |
| `pet-assistant-service.ts` | `pet-assistant-memory.ts` | 完成回合正文与每条首次展示时间；生命周期继续拥有模型、能力和终态事件，语音部分转写时间沿既有会话投影回传 |
| `pet-assistant-memory.ts` | `pet-assistant-archive.ts` | 规范用户/回答正文及各自首次时间；重启原样恢复，旧时间不推算；有界历史提示词窗口与查询/删除入口 |
| CLI via IPC | `local-ipc.ts` | `pet.react`, `pet.say`, `lease.*` |
| `lease-manager.ts` | `agent-pet-controller.ts` | Show/close agent pets |
| `windows.ts` | Renderer | State snapshots via IPC invoke |
| `team-api-client.ts` / `manager-check-in-service.ts` | `default-pet-controller.ts` / `default-pet-chat.ts` / `pet-preload.cjs` | Local-week due state, private pet action circle, five-feeling card, explicit submission, and success state |
| `manager-check-in-service.ts` | `windows.ts` / Teams renderer | Sync, immutable history, and device-private scheduled-offer pause controls; no Control Center submission surface |
| `manager-check-in-state.ts` | `userData/openpets-manager-check-in-state.json` | Atomic bounded local history, pending idempotent submission payload, local-week markers, and private pause preference |
| `agent-setup.ts` | Claude/OpenCode/Cursor CLI | MCP add/remove, config writes |
| All modules | `logger.ts` | Structured logs to `userData/logs/openpets.log` |
| Plugin catalog | `plugin-catalog.ts`/`plugin-service.ts` | Discoverable plugin metadata filtered by app version and install state |
| Plugin ZIP/local folder | `plugin-package.ts`/`plugin-local-loader.ts` | Validated manifest snapshot installed under `userData/plugins*` |
| `plugin-state.ts` | `userData/openpets-plugin-state.json` | Installed plugins, enabled flag, approved permissions, config, broken status |
| Control Center renderer | `control-center-preload.cjs`/`windows.ts` | Narrow Dashboard/Pets/Integrations/Plugins/Settings snapshots and route-targeted actions |
| `plugin-runtime.ts` | `plugin-pet-api.ts`/`plugin-js-host.ts`/`plugin-sdk-bridge.ts` | Declarative timers and JavaScript SDK actions on default/spawned pets, schedules, storage, commands, status, logs, network, UI, audio, events, bus, AI, OAuth, secrets, voice, and panels |
| Plugins renderer | `windows.ts`/`plugin-service.ts` | Snapshot, enable, config, command, reload, install/update/uninstall, local-load operations |
| Locale preference | `i18n/`/`plugin-i18n.ts` | Host UI dictionaries, localized reaction pools, manifest `$t:` values, and runtime `ctx.t()` strings |
| Plugin SDK asset refs | `plugin-assets.ts`/`plugin-package.ts`/`plugin-sdk-ui.ts` | Validated icons, images, SVGs, sprites, panels, and sounds rendered by host surfaces |

## 独立工作室的新流程

main.ts → 插件、提供方、人设、电脑及本机桥接 → windows.ts 授权适配 → studio/StudioApp.tsx。companion-plugin-authoring-types 定义纯制作契约；companion-plugin-authoring 拥有唯一目录写入及清理；control-center-plugin-authoring-ipc 在原生选择前校验并处理关闭取消。persona-distillation 拥有固定提供方操作、单次素材请求、120 秒时限和草稿；companion-persona 拥有 v2 双方式存档及 v1 迁移；启用的人设在对话和只读协同开始时捕获。companion-pet-origin 只投影来源，不猜作者或素材许可。

原团队模块的源码索引只用于迁入历史与旧测试参考；上述新运行链不初始化服务，不加载团队插件，也不提供签到 IPC。完整操作及边界见 docs/studio.md。

## 文件定位、索引与分类所有权

- `companion-file-library-types.ts`：无实现依赖的根目录、条目、分类、扫描、筛选与快照契约。
- `companion-file-library.ts`：唯一持久索引／分类 owner；多根目录有界扫描、原子存档、内存名称检索、引用失效状态和真实路径复验。不写原资料目录，取消不提交半份索引。
- `file-location-query.ts`：纯本地问文件句式提取；`companion-file-location.ts`：文件助手可用时索引查找、唯一匹配定位、多候选和失效反馈；查库和打开前均核验门禁。`main.ts` 注入原 `PetAssistantService` 的 localResponse 回合，监听插件事件使单次请求授权永久失效，沿同一历史／取消／终态，不新建对话宿主。
- `companion-file-library-ai-types.ts`：匿名有界资料预览与临时建议契约。
- `companion-file-classification.ts`：固定所选 `TextModelClient` 操作、严格输入／输出、空工具、时限、取消与实际 token 计数；不拥有库写入、文件移动或凭据。
- `control-center-file-library-ipc.ts`：控制中心授权、文件助手门禁、原生选择、目录编号、预览／草稿归属和索引快照验证；停用或关闭窗口取消任务、撤销临时资料，迟到结果与元数据提交不可越过取消。推荐计划登记到原 `control-center-companion-ipc.ts`，不接受 renderer 任意路径移动。
- `companion-files.ts`：新增推荐分类计划允许已选根目录内嵌套普通资料；具体执行、无覆盖校验、持久记录与撤销沿原 owner。`recommended` 是兼容原 version 1 记录的可选字段，旧顶层整理／复制记录不放宽范围。
- `companion-ai-host.ts`：组合原对话、电脑分析、人设提炼、分类操作的真实开始／结束／取消反馈，向动作所有者投影活动；接管已忙碌的会话初始快照即投影，替换空闲会话及关闭清原对话槽；不以保存 AI 配置推断正在工作。组合分类活动证据和用量，监测无正文。分类库默认不移文件，明确推荐移动入口才交原事务。
- `codex-quota-types.ts`／`codex-quota-client.ts`：Codex 外部 CLI 官方账户额度的身份无关投影；固定 App Server 只读协议、输出预算、二十秒时限与自有进程清理，不发登录／刷新／生成请求。
- `codex-quota-monitor.ts`：宿主持有的唯一外部额度轮询和缓存，默认停用；开启后两分钟查询、五分钟过期，关闭／换 CLI／退出撤销旧查询；持久开关与程序选择复用 `app-state`／`agent-setup`。

动作行为由 `tests/pet-behavior.test.ts` 覆盖偏好验证、安静／自动／单击、回归、暂停恢复、多来源及失联兜底和显示组合；`companion-ai-host.test.ts` 核验真实会话投影，分类操作测试核验并发／成功／取消／关闭。生活与虚拟宠物 SDK harness 核验默认无自主覆盖、单击归宿主和显式提醒，既有可选工具门禁不变。

使用见 `docs/companion-files.md`；新的三组行为测试保护索引不改原文件、实际回合定位、AI 审阅／采用分离、嵌套整理与撤销，旧文件／AI／Assistant 测试继续回归。

`tests/companion-tool-plugins.test.ts` 以真实状态与运行宿主保护门禁、握手与损坏、停用后的旧目录／计划／草稿失效、资源暂停与设置保留，以及下载取消／重新启用基线；不依赖 Windows 文件符号链接权限。

Windows 原子替换遇到短暂 EPERM／EACCES：文件操作记录有有限异步重试，持续失败保留原文件／副本并报告；内置插件初始化的状态提交也有有限重试，旧状态只有真实落盘后才更新。`plugin-service` 使用真实 runtimeLogger 作为缺少 runtime.log 的备用入口，避免初始化失败无日志。相应两组新测试保护读锁恢复与持续失败，不将失败静默当成功。

## 共创网站入口

community-website.ts 使用预先登记的 HTTPS 站点时直接返回公开入口，不启动本机服务器；未提供托管地址时按需提供回环静态预览，只有公开资源白名单和 GET/HEAD，禁止任意路径和写入，并拥有启动并发与关闭生命周期。公开图集、单帧缩略图和安装 ZIP 按编译时固定作品名单登记，客户端模块也逐项登记，构建清单不成为文件接口；未登记资源即使存在于公开目录也不开放。windows.ts 校验控制中心发送方，调用固定 pets/plugins/create 入口并使用 shell.openExternal，网页内排行、需求和合集路由不扩展桌面契约。网站代码、图集和 ZIP 随便携包资源复制；公共投稿和互动由网站服务持有，草稿仍存当前网站源的浏览器，网页不消费桌面 IPC 或本机档案。
