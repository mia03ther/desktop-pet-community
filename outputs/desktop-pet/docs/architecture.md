---
description: Understand the OpenPets desktop app, companion pets, plugin host, catalogs, SDK packages, and local agent integrations as one system.
---

# Architecture

## 当前 desktop pet 产品

共创网站的开源伙伴复用既有内容目录、独立媒体播放器及原项目独立运行流程。能转换的动画分发原生媒体 ZIP；完整键鼠、Live2D 或 VRM 宿主使用固定官方完整发行，保留原程序逻辑。网页按实际格式预览，安装说明区分原生导入与原应用安装；固定下载重定向只引用维护者公开目录，不能由访问者指定地址。原程序的 AI 服务与模型仍在原宿主配置，不把官方下载条目当作本系统已完成 AI 联动。

本地原项目导入由 `original-projects.ts` 单独持有静态报告和原件存储，`control-center-original-project-ipc.ts` 持有窗口绑定的一次性检测凭证，`original-project-types.ts` 为无实现依赖的共享能力契约。确认导入后先完整保存原件，原生包才沿既有桌宠事务或插件 SDK 安装；其他宿主不进入本机运行时，不因为修改清单或转换素材就宣称原逻辑已运行。Shimeji 转换必须另行明确选择制作副本，原项目仍保留部分兼容状态。

原项目的“独立运行”使用 `original-project-execution.ts` 检查 Windows EXE 或 Main-Class JAR、Java 最低版本和已知声明依赖，再由窄 IPC 在用户点击后调用无 shell 启动。Java 路径由原项目档案保存，选定环境与运行前才进行 `-version` 探测；JAR 使用固定 `-jar` 参数及原资源目录，不读取上传启动脚本、不自动安装运行时。包内明确入口与包外原应用分别返回项目程序已请求启动和仅打开应用待导入两种结果，不改变兼容判定；缺少入口或已知运行环境时相应能力不可用。原件、许可证和用户原设置保留。

Windows 本地产品使用 desktop pet 名称和独立控制中心。桌宠输入框是对话入口，控制中心展示同一会话记录；提醒、协同分析和宠物大脑回复写入同一归档，下一轮模型读取这些内容。AI 额度页展示实际用量、受支持接口的余额或手动记录，未提供的数据显示未知。现有插件通过共创站下载，本机仅管理安装、权限、配置和启停。以下保留底层 SDK 与协议的技术架构说明，法定署名在许可证文件中。

外部 AI 接入扩展为 Codex 官方 Hooks、ZCode 用户级 MCP/Hooks、DeepSeek Harness Cordis bundle 和豆包方舟本机函数桥。`agent-setup.ts` 拥有操作锁与档案依赖，`agent-setup-external.ts` 组合四个适配器，`external-ai-setup-types.ts` 是主进程／渲染器共享契约；外部命令的子进程、超时、输出上限和结束自有进程树由 `external-command-runner.ts` 负责。事件复用现有本机 IPC 和动作所有者，不新增外部聊天来源或 HTTP 监听。Codex 的 Hooks 信任仍需用户在 Codex 内审阅；豆包只提供用户本机方舟应用可调用的开发接口，网页／PC 客户端自动监测当前未支持。配置登记和本机测试均不证明外部工具运行时已完成加载，也不提供账户额度。具体路径与边界见 [Agent 接入](/agent-integrations)。

OpenPets is a pnpm + TypeScript monorepo for an Electron desktop companion app
and a set of npm packages that let coding agents drive animated desktop pets.
This doc is the one-page mental model: what runs where, how a request travels
end to end, and the vocabulary used throughout the rest of the docs.

## The product in one sentence

A small animated pet lives on your desktop and reacts to what your coding agent
is doing - thinking, editing, waiting for permission, succeeding, failing - and
can be extended with companion plugins, while pets themselves are downloadable
from a public catalog.

## Runtime topology

There are three runtime worlds. Keep them distinct in your head.

1. **The desktop app** (`apps/desktop/`) - an Electron process tree. The main
   process owns state, windows, the tray, the pet windows, the plugin runtime,
   and a **local IPC server**, plus a separate opt-in remote-control listener.
   This is the only long-lived process; remote control is disabled by default.
2. **Agent-side integrations** (`packages/*`) - short-lived code that runs
   inside or alongside a coding agent (Claude Code hooks, the MCP server,
    OpenCode plugin, Cursor config, Zed config, Pi extension, the native OpenClaw
    plugin, the DSH Cordis bundle, the CLI). Runtime integrations translate agent
    activity into pet commands and send them over local IPC unless an explicit
    remote endpoint/token configuration selects the separate remote protocol.
    OpenClaw is intentionally local-only and never selects that remote path. Zed
    is configuration-only: the desktop app and CLI manage its global settings
    file, while Zed itself runs the configured MCP server.
   `@open-pets/dsh` is the strict local-only v1 exception: it always uses local
   IPC and the default pet and ignores all remote configuration.
3. **The public web origin** (`openpets.dev`, source in `web/`) - static
   catalogs and asset hosting. The app fetches pet/plugin catalogs and downloads
   ZIPs from here. Only the *data* side of `web/` (catalogs, ZIP hosting, pet
   metadata) is in scope for these docs; the marketing site/frontend is not.

```
coding agent  ──(hook/MCP/plugin event)──▶  @open-pets/client
                                                  │  local IPC (socket/pipe/TCP)
                                                  ▼
                                         desktop app (main process)
                                          ├─ lease manager → pet windows
                                          ├─ app state (JSON)
                                          ├─ plugin runtime + SDK bridge
                                          └─ catalog/install
                                                  │  HTTPS
                                                  ▼
                                         openpets.dev (catalogs, ZIPs on R2)
```

An explicitly configured remote agent uses a separate path: private IPv4
endpoint plus a paired token → `@open-pets/client` → the remote-control service
→ the default pet only. It never reads local discovery, exposes the local IPC
router, or participates in LAN pet presence or leases. The v1 transport is raw
unencrypted TCP and is intended only for a trusted private network or an
encrypted overlay with its own ACLs; CGNAT addressing alone is not encryption.

The provider foundation is defined by the pure `provider-contract.ts` module.
It owns one canonical adapter catalog and one canonical preset catalog, including
role support, credential policy, default authentication, and adapter defaults.
Typed adapter-specific profiles then carry only the fields valid for that
adapter: an OpenAI Realtime profile has separate normal-text and realtime model
fields, while network TTS profiles persist a voice.

The host provider service owns exactly three independent selections: one text
profile, one STT profile, and one TTS profile. Realtime is derived from the
selected text profile and is ready only for an explicit native
`openai-realtime` profile with both models configured. Secret credential values
are resolved only from `PluginSecretsStore`; optional static provider header
values are persisted in local provider settings, while Control Center snapshots
expose header names and credential presence only. TTS uses the persisted profile
voice by default, with a request voice taking precedence. Generic
OpenAI-compatible text covers cloud gateways and Ollama/LM Studio/vLLM, while
native Anthropic, MiniMax speech, ElevenLabs speech, system TTS, and explicit
Whisper-compatible transcription retain their distinct wire contracts.

## The packages, and what each is for

| Package | Role | Doc |
|---------|------|-----|
| `@open-pets/client` | The IPC client used by runtime integrations to talk to the app | [IPC and remote control](/ipc) |
| `@open-pets/cli` | User-facing CLI: configure agents, manage pets, run MCP, scaffold/validate plugins | [Agent integrations](/agent-integrations), [Development](/development) |
| `@open-pets/mcp` | Stdio MCP server exposing `openpets_status` / `react` / `say` to MCP agents | [Agent integrations](/agent-integrations) |
| `@open-pets/claude` | Claude Code hooks + MCP/settings/memory management | [Agent integrations](/agent-integrations) |
| `@open-pets/opencode` | OpenCode plugin runtime + config management | [Agent integrations](/agent-integrations) |
| `@open-pets/cursor` | Cursor MCP config + project rules management | [Agent integrations](/agent-integrations) |
| `@open-pets/zed` | Zed global MCP settings management | [Agent integrations](/agent-integrations) |
| `@open-pets/pi` | Pi coding-agent extension + `/openpets` commands | [Agent integrations](/agent-integrations) |
| `@open-pets/openclaw` | Native OpenClaw plugin and OpenClaw plugin lifecycle management | [Agent integrations](/agent-integrations) |
| `@open-pets/agent-events` | Shared, validated speech pools for agent feedback | [Agent integrations](/agent-integrations) |
| `@open-pets/dsh` | Strict local-only v1 Cordis bundle for DSH lifecycle reactions | [Agent integrations](/agent-integrations) |
| `@open-pets/plugin-sdk` | Public SDK v3 type contract + deterministic test harness | [Plugin SDK v3](/sdk) |
| `install-pet` | Standalone pet installer (works with or without the running app) | [Pets](/pets) |
| `pet-format` | Tiny marker/identity type for pet packages | - |

The dependency spine: every runtime integration, including `@open-pets/dsh` and
`@open-pets/openclaw`, depends on `@open-pets/client`; `openclaw` also uses
`@open-pets/agent-events` and the OpenClaw plugin SDK as an optional peer
dependency. The `cli` composes `claude`, `opencode`, `cursor`, `zed`, `mcp`, and
`openclaw` management. `claude`/`opencode`/`pi`/`dsh`/`openclaw` use curated
speech for safe automatic feedback. OpenClaw management is a native OpenClaw
plugin install, not an OpenPets SDK v3 catalog-plugin install. The Zed package
is configuration-only by design: the CLI and desktop Control Center manage its
global settings file, while Zed itself runs the configured MCP server.
`@open-pets/dsh` is strict local-only v1: it always uses local IPC and the
default pet and ignores remote configuration.

## End-to-end flows

### Host Pet Assistant loop (#138)

After `PluginService.start()` resolves, the desktop constructs one canonical
in-memory Pet Assistant service. Each turn reads the current host text-provider
provider operation and the current host-owned personality profile, discovers enabled
generation-pinned capabilities, and routes validated tool calls back through
`PluginService`. Provider codecs and the lifecycle enforce bounded context,
payloads, results, timeouts, cancellation, and final output. Assistant requests
do not use the plugin `ctx.ai` gateway.

The host composes each request in a fixed order: immutable host rules, optional
curated context, a serialized owner-authored personality data block, the
current local time with its UTC offset and timezone (models have no clock, so
relative requests like "in 10 minutes" would otherwise resolve against a
training-era date), recent bounded conversation messages, and the current provider-neutral capability
definitions/results. Personality values are communication preferences only and
cannot change host rules, permissions, available capabilities, or authoritative
capability outcomes. The profile is persisted with app state and captured at
turn start, so a Settings edit applies to the next turn without changing an
already-running turn. If any structured capability outcome is rejected,
unavailable, or indeterminate, the terminal user-visible response is a
deterministic host-generated status summary instead of untrusted model prose;
turns whose outcomes all complete retain the model response. The separately-owned
lazy companion chat renderer consumes a host-owned,
in-memory current-session projection of those canonical events. It is
presentation state only and remains distinct from the host-owned local archive
delivered by #149. The archive is atomic,
local-only, and stores only terminal user/assistant text from the canonical
shared voice/chat conversation. It retains at most 200 messages for 30 days and
512 KiB total, with a 64 KiB per-entry cap and newest entries preserved. Corrupt
or malformed data is quarantined when possible, replaced with an empty archive,
and never partially trusted. If the archive cannot be opened or repaired, it is
disabled for that session without blocking the Pet Assistant. A most-recent archive window of at most 24 entries
and 128 KiB may be added to the next assistant prompt; tool definitions/results,
provider payloads, and personality data never enter that archive window. Owner
delete-one/delete-all operations are exposed only through a narrow main-process
bridge to the Control Center Settings conversation archive management section; the companion
bridge never receives archive-management authority. There is no semantic
retrieval, summary, preferences, network synchronization, or provider call for
archive reads/erasure. Provider-profile management is implemented through the
host-owned Control Center bridge.

Capability tool names are readable lowercase names derived from the plugin and
capability ids. The host normalizes punctuation, bounds names for providers,
and adds a deterministic short suffix only for normalization collisions or
truncation. Conversation action rows use the capability description as their
friendly label while retaining the provider name separately for exact dispatch
and correlation.

### Generic host voice session and Talk controls (#147, #150)

The desktop owns a host controller/factory for one bounded generic session at a
time. Activation creates a fresh `VoiceAssistantSession`; ending it releases its
microphone reservation, and a later activation creates a new session rather than
reusing the terminal object. The session composes final-only bounded STT input,
the canonical Pet Assistant capability loop, and authoritative response TTS.
The text, STT, and TTS profiles are snapshotted independently; the STT snapshot is
captured before microphone acquisition and remains fixed through transcription.
#150 adds pet-owned Talk, tray/Control Center controls, and a conservative global
shortcut without changing the provider-neutral voice contract. The host supplies
one Talk snapshot/event contract over IPC: host-observed session state is paired
with shortcut status and its failure reason directly from the shortcut manager;
the contract does not fabricate microphone device metadata. Voice turns pass a
host-owned turn id into the canonical assistant service, so canonical events and
voice transcript projection use explicit correlation rather than matching text.
Ending voice releases voice-only resources without clearing the shared assistant
conversation. The shared conversation can contribute terminal text to the
host-owned local archive; Realtime protocol behavior remains separate work.
Typed chat and Talk acquire the same host-owned modality lease before model or
microphone work for this conversation; competing starts fail with an actionable
busy error and cleanup releases the lease on terminal, end, or shutdown. Pet
terminal feedback is driven only by canonical terminal events, remains visible
above resumed listening for a bounded lifetime, and recognizes missing
information only from an explicit structured capability outcome discriminator;
the host input validator marks missing required capability fields with that
discriminator before the result reaches canonical feedback.

Pet-window TTS is request-scoped. Audio and system speech retain a request id and
kind in the renderer, settle replacement/stop/error/close/renderer-loss/navigation
paths exactly once, and the main process rejects a lost or non-completing playback
request at a bounded, duration-aware deadline. System speech is split into bounded
utterance chunks while preserving the authoritative assistant text and emits one
completion after the final chunk. Voice activity is rendered through a dedicated
composable slot, leaving unrelated plugin display and status slots intact when
voice activity clears.

Provider profile management for issue #145 is a host-owned Control Center flow:
the renderer consumes redacted snapshots and the canonical preset catalog over
preload while the main process owns validation, persistence, migration, and
credentials. Profiles are configured through independent role selections; the
UI does not expose opaque secret references. These are the flows worth holding
in memory. Each links to the doc that details it.

- **Agent reaction → visible pet.** Agent activity is classified into a reaction
  category, sent via the client over IPC, the lease manager routes it to a pet
  window, and the window plays the mapped animation with localized speech.
  See [IPC and remote control](/ipc) and [Pets](/pets).
- **Remote agent reaction → default pet.** A paired remote client uses the
  separate versioned protocol. Scope checks, bounded payloads, timeouts, and
  address rate limiting happen before the default-pet adapter; no lease or
  arbitrary target is involved. See [IPC and remote control](/ipc).
- **Installing a pet.** The app fetches catalog v3 (paginated, with a v2/fixture
  fallback), downloads the pet ZIP from `zip.openpets.dev`, validates and
  extracts it, and records it in app state. See [Catalogs](/catalog) and
  [Pets](/pets).
- **本地开放包导入。** ZIP／文件夹先由 `local-package-files.ts` 完成有界读取、路径检查和唯一作品根定位，保留扩展信息与包装层许可，再进入原宠物事务或插件快照／权限流程。`shimeji-pet-import.ts` 只把无条件 PNG 姿势序列转换为媒体素材，不加载 Java 或原行为引擎。
- **Running a plugin.** The plugin service loads an approved manifest (catalog
  or local), the runtime starts a sandboxed JS host, and the SDK bridge applies
  permission-checked calls to pet/schedule/storage/UI/etc. See [Plugin platform](/plugins)
  and [Plugin SDK v3](/sdk).
- **Listening through a plugin.** `voice.listen()` performs one bounded capture in
  a host-owned temporary session, records live microphone ownership only after
  acquisition succeeds, transcribes through the configured provider, and cleans up
  on success, cancellation, timeout, teardown, or shutdown. Its transient privacy
  indicator is shown only after acquisition and is never ambient or always-on.
- **Realtime voice adapter.** The host contains an optional optimized OpenAI
  Realtime adapter over the same Pet Assistant conversation. A hidden sandboxed
  renderer validates and normalizes provider events; the main process validates
  them again and routes bounded tool calls through the generation-pinned
  PetAssistantService seam. Canonical capability outcomes are returned as
  structured `function_call_output` items followed by `response.create`.
  Realtime uses the selected text profile's endpoint and credential, but its
  negotiation model is the profile's independent realtime model rather than
  the normal text model. A missing or incompatible derived configuration is
  reported as status, without a provider fetch.
  Provider response IDs and input item IDs are carried through normalization and
  bound to the active canonical turn; retired response/item identities are
  dropped deterministically. Normalized transcripts and canonical activity/action
  events project into the shared Conversation surface. Provider wire events stop
  at this adapter; Realtime is not exposed to plugins and does not add memory or
  local-machine authority.
- **Configuring an agent.** The CLI or Control Center detects the agent, writes
  MCP config + hooks/rules atomically, and installs a memory/instructions file.
  OpenClaw is the separate native-plugin path: its status is read from the
  OpenClaw CLI's cold inventory and its managed install/update/enable/remove
  actions are issued through OpenClaw's plugin commands. See [Agent
  integrations](/agent-integrations).
- **Publishing content.** Pets and plugins are packaged into versioned catalogs
  and ZIPs, validated, and uploaded to R2 behind `openpets.dev`. See
  [Catalogs](/catalog) and [Testing and validation](/testing-and-validation).

## Cross-cutting invariants

These hold everywhere; the rest of the docs assume them.

- **Forward-only product direction.** Move the current app forward. Do not keep
  legacy compat code in current runtime paths. Old released apps must not break
  catastrophically on versioned data, but the current app carries no legacy
  bloat. (From `AGENTS.md`.)
- **Catalog v3 is the source of truth** for pets; catalog v2 is legacy/fallback
  only. Plugin catalog v2 is active; v1 is an empty compatibility shim.
- **Team state is serialized and explicitly owned.** Team operations are
  serialized, and leaving invalidates queued or in-flight Team work. A Team Pack
  remains pending and not current until its current artifact receives explicit
  first-install approval in Control Center; organization policy cannot bypass
  that approval, which displays the requested permissions and network hosts and
  is bound to the artifact. Persisted source ownership, never directory
  inference, selects Team versus personal roots. Rejected staged or activated
  Team installs roll back without touching personal assets.
- **Validate at every boundary.** Catalog entries, ZIP contents, pet metadata,
  IPC params, and plugin manifests are all strictly validated before use.
- **Atomic, safe I/O.** All persisted state uses temp-write + rename; all path
  handling rejects traversal and symlink escapes.
- **Least privilege.** Renderers are sandboxed with narrow preload bridges and a
  strict CSP; plugins run in a permission-gated sandbox; local IPC over TCP is
  restricted to private/loopback addresses; remote control is separate,
  disabled-by-default, explicitly bound, authenticated, and scope-limited.
- **Voice is bounded and tracked.** Listening is one-shot, one-at-a-time,
  explicitly cancellable, tracked while a media track is live without a detached
  indicator window, and bounded by separate microphone-acquisition and
  transcription timeouts.
- **Voice resource ownership is centralized.** Assistant, plugin one-shot, and
  native Realtime lanes release their own leases/tracks; only the shared voice
  resource owner resets live-track accounting after every lane has stopped.
- **Generated audio routing is explicit.** Network/generated audio is played by
  the trusted persistent voice-media player (or trusted realtime document) with
  a per-operation output snapshot. Unsupported or rejected sink routing is
  reported as OS-default fallback; System TTS remains OS-routed through
  `speechSynthesis` and never claims a selected speaker.
- **Provider configuration is canonical and bounded.** Adapter definitions and
  presets have one pure source of truth; credentials follow adapter-specific
  required/optional/none policies; persisted settings are versioned and invalid
  profiles are quarantined rather than silently discarded. Control Center
  snapshots never contain credential values, secret references, or header values.
- **Pet Assistant lifecycle is bounded.** The host loop is stopped and active
  turns are cancelled before plugin teardown; capability handles remain pinned
  to the plugin generation that registered them.

## Glossary

- **Default pet** - the always-on pet shown when enabled; persistent, not
  lease-bound.
- **Agent pet** - a pet shown on explicit agent request, routed by a lease and
  closed when the last lease for it is released.
- **Lease** - a short-lived (15s TTL) claim with heartbeat renewal that routes
  agent commands to a specific pet and governs agent-pet visibility. See
  [IPC and remote control](/ipc).
- **Reaction** - a categorical pet state (e.g. thinking, editing, waiting,
  success, error) that maps to a sprite animation and a speech pool. See
  [Pets](/pets).
- **Reaction → animation mapping** - user-configurable table from reaction types
  to sprite animation states.
- **Spritesheet** - the `spritesheet.webp` grid of frames a pet animates from.
- **Codex pet** - a locally-developed pet imported from `~/.codex/pets/`.
- **Control Center** - the React/Tailwind renderer UI (Dashboard, Pets,
  Integrations, Plugins, Settings) opened from the tray.
- **SDK v3 / manifestVersion 3** - the current plugin contract. See [Plugin SDK v3](/sdk)
  and [Plugin platform](/plugins).
- **Official plugins** - the reviewed companion plugin lineup and bundling
  rules. See [Official plugins](/official-plugins).
- **Catalog** - a versioned JSON index of installable pets or plugins served
  from `openpets.dev`. See [Catalogs](/catalog).
