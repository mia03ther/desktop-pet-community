---
description: 通过本机事件连接 Claude Code、Codex、ZCode、DeepSeek Harness、豆包开发接口及其他 MCP 工具。
---

# Agent integrations

OpenPets reacts to coding agents. Most supported agents have an integration
package that does two jobs: **configure** the agent to talk to OpenPets, and at
runtime **translate** the agent's activity into safe pet reactions sent over
local IPC or an explicitly configured remote client. Zed is intentionally
configuration-only: it runs the MCP server but provides no lifecycle hooks of
its own. This doc covers Claude Code, MCP, OpenCode, Cursor, Zed, Pi, OpenClaw,
and DSH, the shared speech-safety
layer, and the CLI commands that orchestrate them.

For the local and remote wire protocols, see [IPC and remote control](/ipc). Source maps live
in each `packages/*/codemap.md`.

## 当前控制中心新增接入

“宠物大脑 → 外部 AI 接入”新增 Codex、ZCode、DeepSeek Harness 和豆包四张卡片。它们让外部应用的工作事件触发桌宠动作，不会替换宠物大脑的对话来源，也不把“配置已登记”或“本机测试通过”当成外部 AI 已完成真实连接。此页不提供账户剩余额度推断。

| 接入 | 配置与运行路径 | 需要用户完成的步骤 |
| --- | --- | --- |
| Codex | 使用官方生命周期 Hooks，管理 `CODEX_HOME/hooks.json`（默认 `~/.codex/hooks.json`）和其 `desktop-pet/codex-hook.mjs`。保留其他 Hooks，修改前备份。 | 安装后在 Codex `/hooks` 或桌面 Hooks 设置中审阅并信任命令，再开始新会话。控制中心无法确认 Codex 的信任状态；需支持生命周期 Hooks 的新版，本地命令 Hooks 不适用于云端编排。 |
| ZCode | 在用户级 `~/.zcode/cli/config.json` 中加入自有 `mcp.servers` 项和 `hooks.events`，复用打包的 `assets/agent-hooks/zcode-pet-hook.cjs`。保留其他服务器、Hooks 和设置。 | 在 ZCode 内检查 MCP 与 Hooks，开始新会话。用户关闭全局 Hooks 或已有其他来源同名 MCP 时报告冲突，不代替用户重新启用或覆盖。当前使用用户级配置，工作区级 Hooks 不执行。 |
| DeepSeek Harness | 通过官方 `dsh plugin --profile <profile> add/remove` 管理 Cordis bundle；读写 `<DSH_HOME>/profiles/<profile>/package.json`，自有 bundle 位于本档案的 `integrations/dsh`。`DSH_HOME` 默认 `~/.dsh`。 | 先安装 Harness；网页使用 `web`，桌面版使用 `desktop`。桌面版需先启动一次完成初始化，退出相应界面后安装，再重启并开始工作验证。其他来源的同名插件不覆盖。 |
| 豆包 PC／网页版 | 当前没有接通其客户端工作事件。卡片明确显示“PC／网页监测未支持”，安装与测试按钮禁用。独立方舟开发桥保留在本档案 `integrations/doubao`。 | PC／网页不能凭安装或登录推定已连接。自己的方舟应用可以调用开发桥，但不能替代客户端监测验收。 |

Codex 和 ZCode 的 Hooks、豆包桥接均固定使用当前桌宠档案及本机客户端，不能因远程环境变量改变路由。新卡片的本机链路测试不调用模型、不使用真实账户凭据；Codex 的信任及其他工具加载新配置后的工作事件仍需在工具内验证。

Codex、ZCode、Claude Code、OpenCode、DeepSeek Harness 与 Pi 的工作事件使用平台提供的真实会话编号，传给本机的是
SHA256 摘要、工具名称和成功编辑文件摘要，不传提示词、命令、路径、原工具结果或账号。
同一桌宠可分别显示多个会话，保持各来源动作；一个会话结束不清除另一个会话。
进度显示具体工具（例如“正在调用 JS”）和本轮唯一成功编辑文件数。Codex 的补丁计数
需要明确成功响应；普通 shell 输出不假定修改了文件。并行工具完成只撤销相同调用。
明确带有旧回合编号的迟到事件不污染当前计数，终态后的迟到结果不重新激活工作；新的正式开始事件才恢复活动。
九十秒无真实事件显示待确认并撤销活动动作，十分钟后移除会话；文件计数达到有界上限
显示“至少”，未接入工具的修改不计数。Codex 子代理 Hooks 共享父会话编号，当前归入
父会话，不声称能逐个分离其子代理。缺少会话编号的旧事件仍走匿名动作槽，不冒充已识别会话。
OpenClaw 当前只提供按插件实例区分的匿名思考／工具活动，不猜测具体工具、文件数或完成。
Cursor、Zed 保留原有接入能力，没有新增详细工作摘要。

工作摘要复用 `@open-pets/client` 的 `createAgentActivityEvent()` 与 `reportActivity()`，只发往本机默认桌宠；显式宠物租约和远程连接不混入此进度。成功文件计数需要各适配器收到真实工具成功事件。Claude Code／OpenCode 的契约见[工作气泡](/agent-work-progress)，Harness 见[插件接入](/deepseek-harness-integration)，Pi／OpenClaw 见[对应说明](/pi-openclaw-progress)。

控制中心将配置状态与近期会话事件分别展示。“已收到工作事件”只表示本次启动收到该平台的正式事件，不等于模型与工具均已验收；链路自测和单独会话开始不改变此状态。真实验收结论见[本机验收记录](/ai-session-validation)。

已安装旧 Hooks 时需在接入页更新，再在原工具信任并新建会话。真实生成脚本与正式
ZCode 脚本、公开本机客户端、临时鉴权 TCP IPC、行为控制和自定义映射的测试覆盖
多会话接线；本机测试仍不代替外部工具信任与新会话加载确认。

“外部 AI 监测”另有可选 Codex 官方账户额度。默认关闭；用户启用后读取当前配置的
Codex CLI（Windows 为直接可执行 `codex.exe`），每两分钟启动一次有界的官方 App Server
只读查询，每次最多二十秒（版本探测另限两秒），结束后清理自有进程。
协议固定为 `initialize`、`initialized`、`account/read`（`refreshToken:false`）、
`account/rateLimits/read`，不调用登录、认证刷新或模型生成，平台请求认证交互时停止。
界面只保留 CLI 版本、额度窗口百分比与恢复时间，不返回邮件、账号编号或原响应。
优先使用 `rateLimitsByLimitId` 多窗口；缺失、未登录、API key 登录不支持订阅额度、
版本不兼容或超时均明确未知。窗口属于当前 CLI 账户，不凭 Hooks 推断每个会话的账户归属。
关闭开关、退出应用或换 CLI 会取消旧查询；超过五分钟的记录不称为实时额度。
ZCode 等没有接入公开账户额度接口的来源继续显示未知，桌宠对话 token 不替代外部额度。
官方协议见 [Codex App Server](https://developers.openai.com/codex/app-server)。

官方路径见 [Codex Hooks](https://learn.chatgpt.com/docs/hooks)、[ZCode Hooks](https://zcode.z.ai/cn/docs/hooks)、[DeepSeek Harness 文档](https://deepseek-harness.github.io/deepseek-harness/)及[火山方舟 Function Calling](https://docs.volcengine.com/docs/ark/function-calling?lang=zh)。豆包助手 API 的 `doubao_app` 工具不能与 Function Calling 混用；扣子云端 MCP 仅支持 HTTP/SSE，不能直接访问本机文件或命名管道。豆包方案、官方证据及已学习项目见 [豆包接入](/doubao-integration)。

主进程 `agent-setup.ts` 继续拥有全局操作锁、保存的命令选择和既有 IPC 边界；`agent-setup-external.ts` 聚合四个独立适配器的状态、预览和动作分发，`external-ai-setup-types.ts` 定义共享卡片与动作白名单。`control-center-agent-setup-ipc.ts` 仍校验发送方和动作；渲染器只消费快照，不直接改外部配置。

接入页打开时若另一个操作仍在运行，会等待一秒后读取新快照，在操作结束后自动恢复安装按钮。离开页面停止读取并忽略迟到结果；本页操作运行期间暂停该读取，刷新状态在本页操作结束后可用。Codex CLI 的自定义路径使用同样的绝对路径与现有可执行文件校验，只保存到当前桌宠档案，留空恢复自动检测。

新 `external-command-runner.ts` 专门运行外部检测、管理和本机测试命令，限制各输出流为 16 KiB，使用参数数组、超时和隐藏窗口；Windows `.cmd` 通过明确的 COMSPEC 引号规则执行。超时时只结束本次启动的进程树，状态不会把超时或溢出当作成功。它不替代原有 Claude/OpenClaw runner，也不读取用户 shell 配置。

## The shared shape

Every integration follows the same contract, which is worth internalizing once:

- **Configuration is safe and reversible.** Each integration uses a transaction
  suited to its config format. Most writes use temp-file + rename with a backup
  first; Zed settings use a sibling lock, an fsynced temp file, an exclusive
  backup, journaled claim and withdrawal artifacts, and no-clobber hard-link
  publication.
  Paths are validated against traversal/symlink escape; managed entries are
  marked so they can be detected, updated, and removed without clobbering the
  user's own config. Status is always classified
  (`missing`/`installed`/`needs-update`/`conflict`/`invalid`/…), so the UI and
  CLI can offer the right action.
- **Runtime is fire-and-forget.** Agent events are classified into a reaction
  and/or a speech category, dispatched non-blocking, and any IPC failure is
  swallowed. The pet must never slow down or break the agent.
- **Speech is always safe.** Automatic messages come from validated pools (see
  below), never from raw prompt/output text.
- **Leases route the pet.** Integrations acquire a lease on first activity,
  heartbeat it, and release on shutdown. See the lease model in [IPC and remote control](/ipc).

OpenClaw is the deliberate exception to this shared runtime shape. Its native
plugin is local-only, targets the default pet through the local client, does not
acquire a lease, and observes hook invocation without reading event arguments.

Remote mode is the explicit exception to the lease rule: it is default-pet-only
and does not acquire, heartbeat, or release leases. It is selected only through
`@open-pets/client` remote options or the named `OPENPETS_REMOTE_ENDPOINT`,
`OPENPETS_REMOTE_TOKEN`, and optional `OPENPETS_REMOTE_CLIENT_ID` environment
configuration. The client does not read local discovery in that mode. The
remote server exposes only scoped status, default-pet reactions, and optional
short safe messages; it does not accept arbitrary pet IDs, prompt/output text,
paths, files, media, installs, or discovery operations.

Remote v1 is unencrypted raw TCP. Do not use it on public Internet paths,
port-forwarded listeners, or shared/untrusted Wi-Fi; prefer an encrypted
overlay with its own ACLs. A CGNAT-range endpoint is only an allowed private
address classification, not an encryption boundary. Remote control configuration,
client pairing, token rotation, and credential revocation can be managed directly
in Control Center under Settings → Remote.

## Pet pool: multiple agents, multiple pets

By default every agent session that does not pass `--pet <id>` shares the single
default pet. The **pet pool** preference (Control Center → Settings → General,
`petPoolEnabled`, off by default) changes this so concurrent sessions each get
their own pet from a user-configured ordered list.

**How it works when enabled:**

- The user configures an ordered list of installed pets in Settings. Slot 1 is
  the primary/default pet; subsequent slots are assigned to additional concurrent
  sessions in order.
- When a new session starts without `--pet`, the lease manager assigns it the
  first pool slot not currently held by an active session.
- Once every pool slot is occupied, additional sessions are assigned a random
  eligible pet (installed, non-broken, excluding the built-in default).
- When a session ends its lease, its pet slot is freed and available to the next
  session.
- **`--pet <id>` always takes priority** and bypasses the pool entirely - unchanged from current behavior.

**Eligible pool pets** are installed, non-broken pets excluding the built-in
default. Broken or uninstalled pets are skipped silently.

**Cross-platform and agent-agnostic.** Pool assignment is pure lease logic with
no platform dependency - it works on macOS, Windows, and Linux. Any agent that
acquires a lease through the shared OpenPets client benefits automatically: Claude
Code CLI, opencode, Cursor, and any other MCP client all go through the same
`lease.acquire` path.

When the pool is disabled (the default), behavior is unchanged: all sessions
without `--pet` share the single default pet.

## Safe speech: `@open-pets/agent-events`

`packages/agent-events/` is the shared guardrail. It provides curated speech
pools by category - `thinking`, `success`, `error`, `permission` - and the
validators that keep messages safe: single line, 1–140 chars, and rejecting
code, URLs, file paths, and secret-like tokens. `pickHookSpeech(category)`
selects a message; `validateHookSpeech()` enforces the rules. `claude`,
`opencode`, and `pi` all depend on it so no integration can leak sensitive text
into a bubble.

## Claude Code - `@open-pets/claude`

The deepest integration, because Claude Code has a rich hook system.

- **MCP setup** (`claude-code.ts`): registers an MCP server named `openpets`
  using `claude mcp add/get/remove`. Command modes: `published`
  (`npx -y @open-pets/mcp`), `local`, `bundled` (ASAR-unpacked path). Paths are
  validated to stay within expected directories. Packaged builds default to
  `bundled` but honor an explicit `published` choice, and command probing
  includes fnm default-alias directories plus the standard Windows npm
  global shim directory, so version-manager installs and globally
  installed CLIs resolve without shell profile evaluation.
- **Hooks** (`hook-settings.ts` + `hooks.ts`): installs command hooks into
  `~/.claude/settings.json` for the lifecycle events `UserPromptSubmit`,
  `PreToolUse`, `PermissionRequest`, `Notification`, `Stop`, `StopFailure`. Each
  managed entry carries the `--openpets-managed` marker. `runClaudeHookFromStdin()`
  maps an event to a reaction: prompt submit → thinking, permission → waiting,
  stop → success, stop-failure → error, and `PreToolUse` is classified by tool
  (Edit/Write/MultiEdit → editing, Bash test commands → testing).
- **Project-local awareness**: if a project defines its own OpenPets hook
  (`.claude/settings.local.json` with `--project-local`), the global hook stands
  down to avoid double-firing.
- **Throttling**: ~20s speech / ~3s permission / ~10s reaction cooldowns via a
  JSON state file, so the pet doesn't chatter.
- **Memory**: the desktop's `claude-memory.ts` manages `~/.claude/openpets.md`
  (the instructions file telling Claude how to use the pet).

Doctor/install/uninstall helpers (`installClaudeHooks`, `doctorClaudeHooks`, …)
are what the Control Center Integrations page and the CLI call.

![OpenPets Integrations window showing the Claude Code card installed alongside other editor integration cards.](/docs/claude-integrations-grid.png)

![Claude Code detail screen showing connection status, pet routing, advanced detection, replace and remove actions, and MCP details.](/docs/claude-connection-advanced.png)

## MCP server - `@open-pets/mcp`

A standalone stdio MCP server (`open-pets-mcp`) for any MCP-capable agent. It
registers exactly three tools - `openpets_status`, `openpets_react`,
`openpets_say` - with Zod-validated input and read-only/idempotent annotations.
On startup it acquires a lease, heartbeats every ~5s, and releases on transport
close or SIGINT/SIGTERM. Shutdown marks the shared lease context as closing,
stops timers, waits for in-flight startup and single-flight recovery from either
the heartbeat timer or a reaction/say tool, then best-effort releases every
retained lease ID exactly once before closing the server and exiting. A heartbeat
failure that arrives after closing begins cannot erase the active lease needed
for teardown; a failure just before closing retains its stale ID alongside any
eventual recovery lease. No new recovery acquisition starts after teardown
begins, so an agent that replaces an MCP process cannot leave a temporary second
pool pet behind. Errors are sanitized so IPC paths/tokens/sockets never leak
into tool output. It is spawned by the CLI (`runMcp()`) which forwards stdio and
signals. `--pet <id>` targets a specific pet.

> **Window confinement requires an installed pet.** Passing `--pet <id>` only
> activates window confinement when the requested pet is actually installed. If
> the pet ID is misspelled or not yet installed, the MCP server silently falls
> back to the default (unconfined) pet. OpenPets now surfaces this via a desktop
> notification when the fallback occurs. To list installed pets run
> `openpets pets`; to install one use `openpets install <pet-id>` or the Pets
> tab in Control Center.

## OpenCode - `@open-pets/opencode`

Ships both a config manager and a runtime plugin.

- **Config** (`opencode-config.ts`, JSONC-aware): manages `mcp`, `instructions`,
  and `plugin` arrays in the effective OpenCode config (project `.opencode/` or
  global `~/.config/opencode/`), choosing the right file among `config.json` /
  `opencode.json` / `opencode.jsonc` and preserving user arrays. Managed
  instruction blocks use `<!-- OPENPETS:START/END -->` markers. Full
  prepare/write/remove/doctor lifecycle. OpenCode uses the XDG-style
  `~/.config/opencode/` location on Windows as well; it does not use
  `%APPDATA%\opencode`.
- **Path safety** (`opencode-path-safety.ts`): OpenPets never follows or
  overwrites symlinks when writing OpenCode config or instruction files.
  Atomic temp-file + rename writes stay inside the validated root with backups,
  and symlink/parent rejections name the offending path, its resolved target
  when safely obtainable, and the project-local remediation. To fix a symlinked
  global config, materialize the symlink as a regular file or use project-local
  setup instead.
- **CLI surfaces**: `openpets configure --agent opencode` writes project-local
  `.opencode/` files by default; `openpets configure --agent opencode --global`
  writes the shared global config through the same preparation path as desktop
  setup. `openpets doctor` reports global OpenCode status read-only and exits
  non-zero on genuine diagnostic errors.
- **Runtime** (`opencode-plugin-runtime.ts`, plugin id `open-pets-opencode`):
  hooks `event`, `chat.message`, `tool.execute.before/after`, classifies them to
  reactions/speech, manages a lease (renew with a 2s buffer), and applies the
  same throttle windows as Claude. The optional `excludeReactions` plugin option is an
  array of reactions to suppress before IPC or throttling. It can be used without a
  `pet` target: `["@open-pets/opencode", { "excludeReactions": ["success", "thinking"] }]`.
- **Windows detection**: the desktop app checks user and global Scoop shim
  directories before falling back to `opencode` / `opencode.cmd` on `PATH`, so
  a Scoop installation is detectable even when Electron inherited an older
  environment.

![OpenPets Integrations window showing the OpenCode card ready to install.](/docs/opencode-integrations-grid.png)

![OpenCode setup detail screen showing global setup status, pet routing, advanced detection, install and remove buttons, and config preview.](/docs/opencode-global-setup.png)

## Cursor - `@open-pets/cursor`

Pure file management for Cursor, no runtime hooks (Cursor drives the pet via the
MCP server). It manages the `openpets` entry in `mcp.json` (global
`~/.cursor/mcp.json` or project `.cursor/mcp.json`) and optional project rules at
`.cursor/rules/openpets.mdc`. Strong safety posture: strict JSON only, size caps
(256 KiB config / 64 KiB rules), symlink rejection at every path level, atomic
writes with backup, recursive redaction of sensitive keys/values, and refusal of
unpinned versions (`@latest`). Rules ownership requires an exact
`OPENPETS:CURSOR_RULES:START/END` marker pair. The desktop uses preview/copy;
the CLI writes project rules.

## Zed - `@open-pets/zed`

Pure global settings management for Zed, with no runtime hooks of its own. It
manages the `openpets` entry in Zed's global `settings.json` under
`context_servers`, using JSONC-aware targeted edits so comments, trailing
commas, unrelated settings, and other context servers survive. The settings
path is `~/.config/zed/settings.json` on macOS, `$XDG_CONFIG_HOME/zed/settings.json`
on Linux/FreeBSD (with `FLATPAK_XDG_CONFIG_HOME` taking precedence), and
`%APPDATA%\Zed\settings.json` on Windows.

The package supports pinned published MCP commands (`npx -y
@open-pets/mcp@VERSION`), plus local and bundled Node entry paths (using the
desktop's configured Node.js command when applicable). It reports
`missing`, `installed`, `disabled`, `needs-update`, `conflict`, `invalid`, and
`error` states, refuses unsafe or ambiguous mutations, strips unsupported
`remote` execution during correction while preserving managed environment and
timeout fields, and requires explicit replacement to re-enable a disabled entry.
Configured Node.js paths are validated through their resolved executable but
stored in their original safe form so version-manager symlinks continue to
follow upgrades.
Planned writes are rejected when the settings file changes before execution.
The desktop Control Center manages the same status-aware lifecycle through
`apps/desktop/src/agent-setup.ts`; the CLI
manages the global file with `openpets configure --agent zed`. Both paths use
the package's journaled, crash-recoverable write APIs rather than editing JSONC
directly. Existing settings remain in place while their verified backup is
prepared; publication uses a temporary claim and no-clobber hard link, and an
interrupted claim is restored from the journal on the next attempt. Ambiguous
recovery state is rejected rather than guessed.

## Pi - `@open-pets/pi`

A Pi coding-agent extension (declared in `pi.extensions`). It maps Pi lifecycle
events (`session_start`, `agent_start`, `turn_start`, …) to reactions and
registers a `/openpets` slash command namespace (`status`, `test`,
`react <reaction>`, `say <message>`). MVP scope is default-pet-only and
non-blocking; it registers **no** model-callable tools, and never forwards
prompt/assistant/tool/command text, paths, URLs, or secrets.

## OpenClaw - `@open-pets/openclaw`

OpenClaw is a native OpenClaw plugin, not an OpenPets SDK v3 catalog plugin and
not an MCP configuration. The published package contains the compiled runtime
and the native `openclaw.plugin.json` manifest. Its package metadata points
OpenClaw at `dist/index.js` through `openclaw.extensions`; the default export is
the `openpets` plugin entry created with OpenClaw's `definePluginEntry()`.
The manifest declares startup activation and an empty inline configuration
schema, so OpenClaw can inventory the plugin before loading its runtime.

### Exact runtime contract

The plugin registers only these OpenClaw lifecycle hooks. Both handlers are
argument-free by contract; the integration never reads model, tool, prompt,
result, path, or other hook payloads.

| OpenClaw hook | OpenPets effect |
|---------------|-----------------|
| `model_call_started` | `thinking`: a curated thinking speech may be sent, subject to the speech cooldown; otherwise the thinking reaction is sent. |
| `before_tool_call` | `working` reaction. |

Dispatch is scheduled and non-blocking. It uses a local-only OpenPets client
with bounded connection/response timeouts, and automatic failures do not reach
OpenClaw. There are **no terminal success or error hooks**: the integration does
not emit success/error feedback when a model or tool call finishes. It also does
not forward arbitrary OpenClaw text to the pet.

### Native package and lifecycle commands

OpenPets manages the owned package at the exact workspace package version. The
underlying OpenClaw commands are:

```sh
openclaw plugins install npm:@open-pets/openclaw@<version>
openclaw plugins enable openpets
openclaw plugins update @open-pets/openclaw@<version>
openclaw plugins uninstall openpets --force
```

The install must remain an npm-tracked `@open-pets/openclaw` installation. A
different source using the `openpets` id is a conflict rather than something
OpenPets silently replaces.

Use OpenClaw's inventory commands when inspecting the installation directly:

```sh
openclaw plugins list --json
openclaw plugins inspect openpets --json
openclaw plugins inspect openpets --runtime --json
```

`list` and ordinary `inspect` are cold inventory reads. They can establish what
OpenClaw's persisted registry and manifest metadata say, but **cold inventory
cannot prove that a running Gateway loaded the plugin**. `inspect --runtime`
performs a separate runtime inspection pass; after install, update, enablement,
or entry/config changes, restart the Gateway and verify the actual Gateway
process separately.

### Status states and ownership

The desktop and CLI classify the same OpenClaw observations into these states:

An OpenClaw executable installed in a nonstandard location is supported when
the user supplies its absolute executable path in the Control Center. That is
different from a nonstandard plugin source: the `openpets` id remains owned
only when its tracked install is the `@open-pets/openclaw` npm package.

| State | Meaning |
|-------|---------|
| `installed-enabled` / `installed-disabled` | The owned npm installation is present and OpenClaw reports its enablement. |
| `not-installed` | OpenClaw is supported and the owned plugin is absent. |
| `unavailable` | The configured OpenClaw executable is missing or does not report a version. |
| `unsupported-host` | The host is outside the supported desktop platforms, or OpenClaw is older than the supported `2026.7.1` minimum. |
| `management-disabled` | OpenPets itself sees `OPENCLAW_NIX_MODE=1`; Nix owns the plugin files/configuration, so OpenPets does not mutate them. OpenClaw currently exposes no machine-readable Nix-mode status to a separate parent process. |
| `conflict` | Plugin id `openpets` is present but its source is not the tracked npm `@open-pets/openclaw` package. |
| `invalid` | OpenClaw returned incomplete plugin metadata or reports a load/dependency problem for the owned installation. |
| `indeterminate` | A list/inspect or post-action status refresh failed or returned malformed data; no mutation should be retried based on this state alone. |

The **Control Center** is the desktop-owned setup surface. The main process
resolves the configured `openclaw` executable, reads version/list/inspect
status, presents command previews, and owns install, update, enable-as-part-of-
setup, and remove actions through the agent-setup IPC boundary. It reports known Nix,
unsupported, conflict, invalid, and indeterminate states instead of treating
them as installable.

The **OpenPets CLI** exposes the global ensure flow as:

```sh
openpets configure --agent openclaw
```

Only `--yes` is meaningful for this target. OpenClaw setup does not accept
`--cwd`, `--pet`, `--force`, `--local-dev`, or Cursor rules flags. The CLI
discovers version/list/inspect, plans install-or-update followed by enable, and
refreshes status after each command before declaring success. It has no separate
OpenPets `list`, `inspect`, or `remove` subcommand for OpenClaw; use the native
OpenClaw commands above for direct inventory or lower-level lifecycle control.
OpenClaw remains the owner of its plugin registry and Gateway restart lifecycle.

## DSH - `@open-pets/dsh`

Install the strict local-only v1 DSH plugin for a DSH profile:

```sh
dsh plugin --profile <profile> add @open-pets/dsh
```

Or mount into user configuration patch (`~/.dsh/cordis.patch.yml`):

```yaml
- insert:
    - id: plugin-openpets-dsh
      name: '@open-pets/dsh'
      disabled: false
      config:
        enabled: true
        minSpeechIntervalMs: 1200
        enableStatusLineStream: true
        enableToolEvents: true
        enableApprovalEvents: true
```

The plugin can be toggled on or off at the Cordis loader level (`disabled: true/false`) or dynamically via plugin config (`enabled: false/true`).

`@open-pets/dsh` is a Cordis bundle that automatically maps DSH lifecycle
events to OpenPets reactions:

DSH always uses local IPC and the default pet, and ignores remote configuration.

| DSH event | OpenPets reaction | Speech / Behavior |
|-----------|-------------------|-------------------|
| `running` (`agent/status`) | `thinking` | Curated thinking speech |
| `idle` (`agent/status`) | `success` | Curated success speech (suppressed for 5s after error) |
| `error` (`agent/error`) | `error` | Curated error speech |
| `approval/request` | `waiting` | Curated permission speech |
| `agent/assistant-stream` | `working` | Sanitized `⏵` status line |
| `tools/result (bash)` | `running` | Sanitized tool description |
| `tools/result (edit, write)` | `editing` | Sanitized file action |
| `tools/result (read)` | `working` | Sanitized file read action |

Automatic dispatch is non-blocking and uses only curated categorical speech or sanitized status text.
The bundle never forwards prompts, full tool payloads, raw results, full paths, URLs,
secrets, or arbitrary event text. Idle/success is briefly suppressed after an
error so the error state remains visible. DSH adds no model tools or MCP setup;
the existing OpenPets MCP integration remains separately configurable.

## The CLI - `@open-pets/cli`

The user-facing front door (`openpets`), and the package that composes the
others. Commands:

| Command | Does |
|---------|------|
| `configure` | Configure Claude / OpenCode / Cursor for a project, OpenCode globally with `--global`, Zed globally, or ensure the global OpenClaw plugin is installed and enabled |
| `doctor` | Read-only diagnostics for Claude hooks, Cursor project MCP, global OpenCode setup, and app reachability (human and `--json` output) |
| `install <pet-id>` | Install a pet via the client |
| `status` | Print app/pet status JSON over IPC |
| `pets` | List installed pets |
| `react <reaction>` / `say <message>` | Drive the active pet |
| `mcp` | Launch the MCP stdio server |
| `hook` | Run a Claude Code lifecycle hook |
| `plugin validate <dir>` | Validate a plugin before install/release |
| `plugin new <name> --template <t>` | Scaffold an SDK v3 plugin |

The plugin subcommands are the author-side DX entry point - see
[Plugin platform](/plugins), [Plugin SDK v3](/sdk), and [Development](/development).
The CLI enforces safe project paths and atomic config writes throughout.

The CLI's `status`, `react`, and `say` commands also work with an explicitly
configured remote client because they use the shared client factory. Remote
credentials are consumed in memory and are not included in command output.
The MCP wrapper skips local lease setup in remote mode and sends only the three
remote-allowlisted operations; local users with no remote configuration retain
discovery-based behavior unchanged.

## Quick orientation

| Agent | Config home | Runtime mechanism |
|-------|-------------|-------------------|
| Claude Code | `~/.claude/` (settings, MCP, `openpets.md`) | lifecycle hooks |
| MCP (generic) | agent's MCP config | stdio MCP tools |
| OpenCode | `.opencode/` or `~/.config/opencode/` | plugin event hooks |
| Cursor | `.cursor/mcp.json` + rules | MCP tools |
| Zed | `~/.config/zed/settings.json` (platform-specific) | MCP tools |
| Pi | `pi.extensions` | extension events + `/openpets` |
| OpenClaw | OpenClaw plugin registry | native plugin hooks; local-only default-pet reactions |
