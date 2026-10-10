---
description: Tour the OpenPets desktop app process model, startup path, pet windows, plugin subsystem, local IPC, security model, and packaging notes.
---

# Desktop app

当前分支的整体控制中心、启动编排和托盘由本项目重新开发，使用方式见[桌宠工作室](/studio)。动画、插件 SDK、提供方和本机接入等迁入功能保留来源及兼容。下文团队章节明确作为遗留源码参考，当前应用不加载其服务或界面。

The desktop app (`apps/desktop/`) is the heart of OpenPets: the only long-lived
process, owner of all state, windows, the tray, pet rendering, the plugin
runtime, and the local IPC server that agents talk to. This doc explains its
process model, the major subsystems, and the rules that keep it secure and
stable. For the pet rendering specifics see [Pets](/pets); for the IPC wire
contract see [IPC and remote control](/ipc); for plugins see [Plugin platform](/plugins).

Source map: `apps/desktop/codemap.md` and `apps/desktop/src/codemap.md` are the
authoritative file-by-file maps. This doc is the narrative on top of them.

## Process model

独立工作室提供电脑/文件工具、AI 工作台、两种人设方式和本机插件配置。共创及下载改在独立网站，控制中心仅保留本站入口，见[共创网站](/community-website)。页面使用窄 preload
桥接；目录与计划、诊断预览及任务取消归属保留在主进程。AI 工作台沿用原提供方
凭据存储和唯一 Assistant 对话，不建立另一个聊天宿主。关闭窗口只取消该窗口
发起的工作，退出程序清理全部本地任务与订阅。功能与数据流见
[电脑与文件助手](/companion-tools)、[AI 工作台](/companion-ai)。

以下制作与导出为原 API 记录，当前本地界面已移除这些入口。宠物的共创导出复用 `control-center-pet-management-ipc.ts`：该边界
重新核查个人宠物身份，使用原生目录选择并绑定发起窗口的取消信号。
`pet-installation.ts` 持有源宠物锁，`pet-package-export.ts` 只负责已校验
素材的有界读取与新目录写入。关闭窗口、渲染器丢失和退出都撤销尚未完成
的导出；既有目录不覆盖。操作见[本地共创分享](/companion-sharing)。

已有 V2 图集的制作也复用这一边界。主进程持有选图路径、摘要和绑定窗口的
十分钟凭证，只返回缩小预览；创建时在原安装锁中重验图集并拒绝已有编号。
原安装事务新增仅创建条件，提交前取消回滚本次候选，提交后保持真实成功。
界面收到成功后回到原详情和导出流程；旧制作窗口的迟到刷新不能覆盖新窗口。

Electron gives us a **main process** and multiple **renderer processes**. In
OpenPets:

- The **main process** (`src/main.ts` and the modules it orchestrates) holds all
  authority: state, lifecycle, tray, windows, IPC, leases, catalog/install,
  plugins, i18n.
- **Renderers** are sandboxed and powerless by default. Each gets a *narrow*
  preload bridge exposing only the APIs it needs:
  - The **Control Center** renderer (the React/Tailwind UI) via
    `control-center-preload.cjs`.
  - **Pet windows** (transparent, frameless, always-on-top) via `pet-preload.cjs`.
  - **Plugin JS hosts** and **plugin panels** via `plugin-sdk-preload.cjs`.

There is **no default main window**. The app is tray-first: tray actions open
the singleton Control Center routed to a specific page. A single-instance lock
(`app.requestSingleInstanceLock()`) focuses the existing instance instead of
launching a second one.

控制中心第一次打开才创建并加载窗口；普通关闭改为收起，后续打开复用已加载的窗口。收起时仍撤销该窗口的提炼、导入、文件及提供方测试任务，工作室根据原生页面可见性卸载当前功能页，停止页内轮询；重新显示后按目标路由重新挂载并读取数据。侧栏外壳和语言信息保留，打开路径不发起电脑诊断或插件扫描。渲染器失效会销毁窗口供下次重建，真正退出程序则正常关闭窗口。右键菜单保留用于双右键对话的短暂判断，这一时间与选择菜单后的窗口显示耗时分别验收。

## Startup sequence

日常使用桌面“desktop pet”与“desktop pet 控制中心”快捷方式，直接启动最新已构建的 desktop pet 便携 EXE，分别显示桌宠和打开“我的桌宠”配置；不经过 CMD 或 PowerShell。`scripts/install-desktop-shortcuts.ps1` 只在安装或升级时创建入口。快捷方式通过绝对 `--desktop-pet-profile-dir=` 参数携带原 `userdata`，启动前应用档案与 IPC 隔离；相对或空目录拒绝启动。`--show-pet` 与 `--open-studio` 同时用于首次和重复启动，程序已运行时复用同一实例，初始化期间收到的显式意图延后执行。显示桌宠沿用不抢焦点的窗口链。Windows 开机启动登记也携带同一档案参数；本轮不自动开启自启。普通后台启动继续遵守显示偏好。

2026-10-09 的本机交付版本为 v13，启动器首选该独立包并保留 v12 后备。升级核对原档案，聊天与协同任务空闲后才优雅退出旧版；不重新初始化桌宠、插件、动作、样式或凭据。共创网站当前仍使用完整随包预览：Sites 版本已保存但公网部署没有成功回执，预留网址不作为可用入口。

本地桌宠分支使用 `personal-bootstrap.ts` 应用独立档案，再进入重新开发的 `main.ts` 启动编排。
`启动桌宠.cmd` 调用 `scripts/start-companion.ps1`，优先运行已打包程序，开发环境则运行
已构建的 Electron 应用。它通过 `DESKTOP_PET_PROFILE_DIR` 将独立数据保存在项目的
`userdata` 目录；首次启动使用简体中文，`Control+Shift+H` 隐藏或显示桌宠。
这些初始值只在设置文件不存在时写入，之后保留用户调整。控制中心由用户主动打开。
本地分支启动器关闭插件在线目录，使用随程序提供的插件；宠物画廊与本地宠物导入保留。
独立档案的 IPC 发现文件也放在 `userdata/runtime`，启动时不注册系统 `openpets://` 链接处理器。

用户主动隐藏桌宠时，托盘与快捷键将 `openDefaultPetOnLaunch` 设为 false。
外部事件的共同门控同时检查可见性、这一设置和暂停状态，因此插件气泡、提醒和 AI 事件
不能把已主动隐藏的桌宠唤出；用户显示后才恢复正常互动。

`main.ts` 组合生命周期、状态、事务恢复、独立托盘、显示协调、本机 IPC、插件、唯一
对话宿主、历史、电脑与下载观察、AI 编排和快捷键，再显示已选择桌宠。已配置的本机
远程监听按既有设置启用。退出清理显示订阅、快捷键、语音、对话、分析与提炼、文件任务、
插件、远程监听、本机 IPC 和宠物窗口。团队、经理签到及上游更新服务不初始化。

Key files: `main.ts` (entry/bootstrap), `lifecycle.ts` (app events + cleanup),
`state.ts` (shell pause flag).

## 团队遗留源码参考（当前入口未加载）

以下内容记录迁入的旧团队与签到模块。新工作室无对应导航、IPC、深链接或载体，团队来源插件也不执行；旧用户数据不删除。它们不属于当前桌宠能力。

Teams is an optional cloud lane. `openpets://teams/enroll?intent=...` is parsed
only by the main process; the singleton Control Center is focused and routed to
the Teams contract route. One stable installation ID and nonsecret enrollment
metadata are stored atomically in a dedicated state file. The device bearer
credential is stored only with Electron `safeStorage`. For enrollment, the
desktop generates an ephemeral proof, sends it with the intent ID, installation
ID, and display name, and uses that same proof for bounded completion retry as
part of the single Accept & Enroll action. The API returns the intent expiration
and the desktop retries lost completion responses with the same proof only until
that server-defined window ends. Neither the browser token nor the
proof is stored in desktop state or included in logs; the proof is cleared after
terminal completion/failure or app shutdown. The browser token authorizes
progress/status reads only; it cannot confirm or complete enrollment. The API
issues a deterministically derived 256-bit credential after the desktop
completion call. The Teams route keeps **Accept & Enroll** disabled until a
completed preview supplies the authoritative organization identity and future
expiry; when a deep link arrives while the Control Center is already running,
the main process reuses its route event to make the renderer refetch that
completed preview. Teams starts after the plugin service, polls with bounded
jitter, and stops before plugin shutdown. Snapshots expose separated Team
pets/plugins and status, never credentials, enrollment tokens, proofs, or full
server packs.

The Teams Control Center view presents a distinct empty-state when not joined:
a compact marketing CTA with feature highlights links externally to
`https://openpets.dev/organizations` via `openpets:open-organizations-page`,
accompanied by member deep-link enrollment guidance and the personal content
isolation guarantee.

Team synchronization, installation, and leave operations are serialized. Leaving
invalidates queued and in-flight Team work, so a late sync or install cannot
reapply organization state after departure. A Team Pack stays pending and is not
the current revision until its current artifact has received explicit first-install
permission approval in the Teams route. The approval view displays the artifact's
requested permissions and declared network hosts; organization configuration does
not bypass it, and approval is bound to the current artifact. Rejected staged or
activated Team installs roll back to the last approved state.

### Manager Check-ins

Manager Check-ins is a bundled desktop capability that shares Teams enrollment
and organization identity but does not use Team Pack configuration or transport.
The main-process `ManagerCheckInService` syncs the organization’s schedules and
the enrolled employee’s submitted history through the dedicated device API. Its
atomic local state lives at `userData/openpets-manager-check-in-state.json` and
is bounded to the newest 200 submissions and 512 KiB.

Managers create multiple named schedules in Teams. A schedule is independently
enabled and has its own prompt copy, feeling labels, start date, and structured
recurrence: every N days; every N weeks on selected weekdays; every N months on
selected dates or the last day; or selected months/dates within calendar
quarters. A numeric date that does not exist in a month is skipped. Scheduling
uses the enrolled desktop’s local calendar and is offered for the matching local
day only; it has no timed nudge, cron support, generic task surface, or
off-schedule submission.

The Control Center provides sync, a read-only personal history, and a
device-private pause. It is not a schedule editor or check-in submission
surface. A due schedule appears only on the default pet: one private Check-in
circle beside Chat/Talk, with a count for concurrent due schedules. It opens one
in-pet card at a time. The card uses that schedule’s prompt copy and the five
fixed feelings, accepts an optional 500-character note, shows the organization
disclosure, and requires an explicit Share action. Successful sharing advances
to the next local due schedule or clears the circle.

Closing the card, letting an offer disappear, pausing, or leaving a schedule
unanswered produces no server event. The local pause hides all scheduled pet
actions and is never synchronized to Teams. The service persists only the
minimal private queue lifecycle needed for scheduled offers and retries; the pet
projection exposes its current item and count, never a manager-visible pending
or activity signal.

Each submission is immutable, schedule/cycle-specific, and includes the prompt
snapshot that was shown. The API derives the canonical cycle ID from schedule
and local date, enforces one submission per employee/schedule/cycle, and keeps
client-generated-ID retries idempotent. A short-lived, device- and
payload-bound receipt permits an explicit submission retry immediately after
midnight without admitting a fresh late submission. The desktop and dashboard
never expose replies, skips, missing-response/activity tracking, pet-usage
telemetry, or anonymous mode.

## Linux display backend (Ozone/Wayland)

Electron 42 selects its Ozone platform before evaluating the application's
JavaScript entry point. A late `app.commandLine.appendSwitch("ozone-platform",
"x11")` in `main.ts` is therefore not sufficient to change the backend. Before
the bootstrap was added, GNOME Wayland testing showed that the app could log an
intended X11 backend while Electron created a native Wayland window; subsequent
X11 property operations failed against the invalid window handle.

Linux startup uses a package-entry bootstrap before the side-effectful `main.ts`.
On a normal launch without the canonical `--ozone-platform=x11` argument, it
starts a replacement process directly with Node's `child_process.spawn` and the
canonical argument, then imports `main.ts` only in that process. This avoids
Electron's relaunch API, which can lose the Linux setuid sandbox configuration.
The original process waits up to 15 seconds for a bounded IPC handoff: the child
reports readiness after importing `main.ts`, or reports startup failure. The
original exits successfully only after readiness and unsuccessfully if startup
fails or the handoff times out. Unpackaged launches—including development over
SSH—keep the replacement supervised, with signal and exit status propagated;
only packaged launches detach. A launch that already has the canonical argument
proceeds directly. Thus an unflagged launch normally has one short-lived initial
process followed by the corrected app process; this is expected, not a second
persistent app instance.

`OPENPETS_ALLOW_WAYLAND=1` opts out of the normal X11 relaunch and leaves the
system-selected backend (or a user-supplied Ozone argument) in effect. The
existing warning describes positioning, gravity, walkabout, and drag as
unsupported when native Wayland is active. The separate
`OPENPETS_NATIVE_WAYLAND=1` layer-shell path retains its dedicated backend
selection rather than using the normal X11 path. These native Wayland modes are
experimental; they do not provide the X11 window-property behavior below.

For packaged AppImage launches, the bootstrap spawns through the original
`APPIMAGE` executable path so the AppImage environment is retained. A mounted
AppImage passed startup and X11 skip-hint checks on KDE; this does not verify all
AppImage environments or other packaged Linux formats. The
effective backend used by pet interaction code is decided in
`wayland-backend.ts` and cached by `pet-window.ts` at window-creation time.

On X11/XWayland, pet windows remain focusable so chat and plugin inputs can
receive keyboard focus. For a pet show, the X11 state lifecycle subscribes to
structure notifications and prepares `_NET_WM_STATE` with taskbar and pager
exclusion atoms, plus the KDE switcher exclusion atom when the root
`_NET_SUPPORTED` advertises it. Once the window is mapped, it sends EWMH
add-state requests because Chromium may replace the pre-map property during
mapping, then watches property changes until all supported required atoms are
present. Re-showing a pet reapplies the hints. A show coordinator prevents stale
readiness completions from showing a carrier after a later hide.

The show gate waits for watcher setup, not for proof that the window manager's
UI reflects the hints. Logs report property verification and explicitly do not
claim compositor/task-switcher behavior or absence of a visible flash. X11
state handling applies to pet windows only, not Control Center windows. The
experimental native Wayland path is not covered by this behavior.

On an arm64 KDE/X11 VM, packaged testing confirmed exclusion from the taskbar
and switcher, real typing in chat, and restoration after window-manager close
followed by tray re-show. A mounted KDE AppImage also passed startup and skip-hint
checks. Packaged arm64 GNOME testing confirmed an XWayland window with a valid
XID and the standard skip atoms. GUI checks verified typed text in the pet chat
field; the native GNOME Alt+Tab switcher showed Files and Terminal but not the
pet. First-run/keyring dialogs were cleared manually before keyboard interaction.
Development `dev:control-center` startup over SSH
and coordinated stop were also verified on the GNOME VM. DEB, RPM, and tar.gz
launches, and x86_64 behavior, remain untested. These checks do not establish
that there is no visible flash or that every compositor presents the hints
identically. The pure startup selection policy is covered by
`apps/desktop/tests/startup-backend-policy.test.ts`.

Windows 桌宠在被动状态使用 `focusable: false`，点击、拖动和后台事件
不会主动获取键盘焦点。打开紧凑输入、完整聊天或插件输入时，现有动态
焦点策略允许输入；紧凑聊天在用户主动打开后获取焦点，关闭后恢复被动状态。
macOS 和 X11 的现有焦点策略保持原样。

Windows 的置顶恢复由 `pet-window.ts` 一个共享的 1 秒定时器负责。
`window-tracker.ts` 复用现有 `get-windows` 适配器读取前台窗口，客户区物理
像素经 `screen.screenToDipRect` 转成 DIP；`pet-fullscreen-policy.ts` 判断它
是否覆盖桌宠所在显示器。匹配时取消桌宠置顶并停止重申，退出后恢复置顶，
不调用隐藏接口或修改用户显示偏好。普通最大化、其他显示器和本进程界面
不触发让位。所有桌宠关闭后清理定时器，异步查询使用现有重入锁。

这是按前台客户区判断的全屏让位：受保护进程可能无法查询，未知状态按正常
置顶处理；取消置顶也不是对所有无边框窗口的强制层级保证。当前 Windows
原生全屏测试确认桌宠在测试窗口后方、退出后恢复置顶，双屏混合 DPI 和
独占游戏尚需实机验证。macOS 的 `visibleOnFullScreen: true` 保持原有行为。

Separately, Chromium's native window occlusion tracker considers every window
on a display occluded while a fullscreen app is active there and stops
painting it - a transparent pet window goes blank even with its z-order
intact. `main.ts` disables `CalculateNativeWinOcclusion` on Windows so the
pet keeps its renderer ready; Windows fullscreen yielding is handled separately
by the z-order policy above.

## Subsystems

### Tray & windows

- `tray.ts` 提供独立菜单、七页面路由、显示隐藏、暂停恢复、日志与退出；图标加载复用 `assets.ts`，无上游更新状态。
- `windows.ts` is the Control Center coordinator: it creates the hardened
  `BrowserWindow`, loads the Vite renderer (dev) or packaged `dist/renderer`
  (prod), targets a route, registers renderer-facing IPC handlers,
  and defines the internal asset protocols.
- `display.ts` provides screen-geometry helpers for positioning pet windows,
  including the permissive `clampToNearestDisplayIfOffscreen` helper that allows
  pets to roam across display seams while only snapping when fully off-screen.

### Control Center (renderer)

`src/renderer/src/main.tsx` 加载独立 `studio/StudioApp.tsx`，自行开发的七页面和布局消费
主进程快照及窄操作 API，不持有系统权限。AI 工作台复用提供方连接等功能组件；整体
控制中心不加载旧 Dashboard 或 Teams。页面与来源见[工作室说明](/studio)，组件职责见
`src/renderer/src/codemap.md`。

Provider-profile bridge operations are exposed by
`control-center-preload.cjs` without a generic renderer-side settings store:
list profiles, the canonical adapter/preset catalog, role status, and derived
realtime status; atomically save a typed profile, credential, and selected roles;
create/update/delete a profile; select a profile independently for each role;
 update platform gates; set/check/delete a profile credential; and test an
  unsaved profile draft. The Hearing role supports both generic
  OpenAI-compatible transcription and the native ElevenLabs Scribe STT preset;
  the latter sends bounded multipart audio to ElevenLabs with `model_id` and
  `xi-api-key` authentication. A setup test resolves its inline credential only for
 that one request: it never writes the profile, role selection, headers, or
 credential. Text sends a tiny completion, TTS returns a short configured-voice
  preview through the trusted host player, STT uses a host-owned bounded transcription
  session on the shared microphone arbiter (ownership is reserved before
  device enumeration, and renderer loss/modal close/replacement/shutdown
  cancel every in-flight setup request and recording; the renderer never owns
  `getUserMedia` or `MediaRecorder`), Realtime creates a minimal session
  configuration, and system TTS uses the selected local speech-synthesis voice.
  Network speech previews and Talk/realtime remote audio use the persistent
  trusted voice-media player with a serialized per-operation ownership claim and
   output snapshot. Initialization cancellation cannot start late audio. Output
   capability is reported only after a bounded probe of
   `HTMLAudioElement.setSinkId` in the trusted player document, with explicit
   unavailable/unsupported states. Unsupported
   or rejected sink routing is reported as OS-default fallback; System TTS stays
   on `speechSynthesis` and does not claim speaker routing. Control Center
   Settings → General exposes a cohesive Voice Devices routing section allowing
   the user to inspect discovered inputs/outputs, select preferred devices with
   truthful disconnected fallbacks, and refresh hardware lists; microphone changes apply
   to the next turn without mutating in-progress audio. Responses contain only credential
   presence and header names, never secret references or header values.
   Ending one Talk session disposes only that session's playback owner and stops
   its request; it does not shut down the shared media player. Permanent shared
   player shutdown is reserved for application voice shutdown, so later Talk,
   preview, and plugin-generated speech remain usable.

### Pet Assistant In-Pet Attached Chat & Compact Composer

The default pet carrier contains an in-place compact text composer and an attached expandable
in-pet chat panel managed by `default-pet-chat.ts` and `pet-preload.cjs`. In its default collapsed
state (200×200), the carrier displays speech bubbles. Chat and Talk quick action buttons are opt-in
in Settings; once enabled, tapping Chat or the launcher switches the compact frame into an in-place
text composer (input/textarea, Send, cancel, busy state) without resizing the window or opening full
history. Submitting a turn hands off response rendering directly to the pet speech bubble.

When full history is explicitly opened via the transcript affordance, the carrier window expands to
420×640 using bijective coordinate transforms from `default-pet-chat-geometry.ts` that
preserve the pet's on-screen anchor point. The attached chat panel is anchored directly above
the scaled pet sprite with a 10px gap, growing upward from 220px to 500px as content changes
while the pet remains stationary at the bottom. Non-pinned floating speech bubbles and quick
launcher buttons are suppressed while full chat is open; pinned HUD bubbles remain visible and
lift both chat surfaces with the pet, regardless of HUD scale.

展开对话的最小和最大高度同时受窗口内剩余空间限制，桌宠或 HUD 放大后缩短记录区并滚动，标题栏和输入栏保持固定高度。右上角关闭按钮保留可见上边距，点击沿原收起路径关闭并保留输入草稿；Linux 命中区域跟随受限后的实际面板高度。

Assistant turn feedback routes operational context (header state, tool cards, turn status) inside
the expanded chat. Duplicate speech bubbles are suppressed while chat is open, while pet reaction
and activity animations (`thinking`, `working`, `error`) continue to play on the sprite.
Closing the chat never replays closed conversation turns; normal ambient speech bubbles resume
cleanly for subsequent turns. Draft text is preserved across open/close lifecycles, whether
triggered by Escape, the close button, launcher toggles, or carrier collapse.

On Linux, `pet-window-shape.ts` computes exact input masks (`setShape`) for collapsed,
compact-composer, and expanded carrier states, keeping mouse passthrough correct across
states. Focus semantics are handled separately by `shouldPetWindowBeFocusable()` in
`wayland-backend.ts`: X11/XWayland pet windows (the default under the forced
`--ozone-platform=x11`, see above) are always created focusable, because some X11 window
managers — KWin included, see #227 — never honor a later `setFocusable(true)` on a window
that started `focusable: false`; native Wayland compositors keep the passive pet
non-focusable until it hosts an interactive input, since treating an idle overlay as a
normal focusable toplevel there causes tiling/activation issues (e.g. on Niri). For
expanded chat, the mask aligns with the bottom-anchored panel bounds, tracking dynamic
panel height reported from the renderer via `ResizeObserver`. Compact open/close is owned
by the main process alongside expansion: opening widens the input shape to include the
composer rectangle and (on native Wayland only) makes the carrier focusable; closing
restores the passive pet shape and, on native Wayland, the passive focus policy. The
compact composer is anchored above the pet with a 12px visual gap
below its 6px tail. It has one shared maximum geometry contract: its
multiline textarea is capped at 68px and error feedback at 34px, producing a
152px maximum envelope used by both CSS and the Linux mask.

The in-pet chat interface exposes the current conversation snapshot, typed turn
actions, tool invocation cards, prompt suggestions, and Talk actions/events. The
renderer consumes the authoritative Talk snapshot (`status`, `activity`, and
`muted`) and snapshot events only; it does not maintain a parallel voice state.
Initial and streamed conversation/Talk snapshots are applied by sequence/revision
ordering so a late initial IPC response cannot replace newer streamed state.
Archive list/delete/clear operations remain host-owned Control Center IPC for Settings presentation
and are never exposed to the pet carrier. The local-only atomic archive at
`userData/openpets-conversation-history.json` remains the persistence/context seam.
Normalized voice transcript events remain an
integration seam for #147: their adapter must provide a process-lifetime
monotonic sequence within the voice source; voice ordering is deliberately
independent from the canonical assistant event sequence.
The provider UI is role-first: each of Text, STT, and TTS has its own selected
profile and readiness state, while Realtime is shown as a derived status from
the selected text profile. The guided modal renders adapter-specific controls,
including separate normal-text/realtime models for OpenAI Realtime and a
persistent voice control for network TTS. Credential changes use dedicated
host actions; opaque secret references are host-managed and are not editable in
Control Center. Existing static headers are redacted to names in snapshots and
edited through host-applied `add`/`replace`/`delete` operations, so their values
never need to cross into the renderer. The host commits profile, credential,
and role changes atomically.

Talk controls are exposed through narrow preload methods (`getVoiceAssistantSnapshot`,
`startVoiceAssistant`, `retryVoiceAssistant`, `muteVoiceAssistant`, `unmuteVoiceAssistant`,
`interruptVoiceAssistant`, `endVoiceAssistant`, and `onVoiceAssistantEvent`).
The stable generic and Realtime voice-session type contracts are owned by
`src/voice-assistant-session-contract.ts`; `src/voice-assistant-session.ts`
retains the mutable generic session stages and lifecycle implementation.
The shortcut accelerator is persisted in Settings and its runtime status and
reason are part of the authoritative Talk snapshot/event contract. Runtime
status is `registered`, `conflict`, `unavailable`, or `invalid`; registration and
unregistration failures are never presented as active, and a failed unregister
retains ownership so a replacement cannot create an untracked shortcut. The
default is the canonical `CommandOrControl+Shift+Space`. Replacing a preference
unregisters the exact previous accelerator before attempting the new one. Pet,
Pet, tray, and shortcut entry points all use one host-owned toggle (start when
inactive, submit the active generic recording when one is available, and become
an idempotent no-op once processing has begun). Ending is explicit through the
End Talk control or terminal one-shot completion; the native Realtime lane
likewise never ends from its primary toggle while active. A second, independent
global shortcut
(`chat-shortcut.ts`, preference `chatShortcut`, disabled by default via an
empty accelerator) toggles the compact pet chat composer using the same
manager/rollback semantics. Both shortcuts, plus the on-pet chat and talk
buttons (visibility, corner, and size — `showChatButton`, `showTalkButton`,
`petButtonsPosition`, `petButtonsSize`), are configured in the Settings →
Chat & Voice tab. Chat and Talk button visibility defaults to off for new or
unconfigured preferences. The talk button uses the same host-owned voice toggle; the
buttons hide during transient bubbles but stay visible alongside pinned plugin
HUDs. The contract reports only host-observed session
state, not fabricated microphone device metadata. Ending voice releases
voice-only state while preserving the shared assistant conversation.
Snapshots may include the optional `canSubmitRecording` capability flag for
the separate Talk UI lane; native Realtime leaves it unavailable.
The generic recording submit atomically clears `canSubmitRecording` and moves the
canonical snapshot out of `listening` before capture `stop()` settles. While STT,
the assistant, synthesis, or playback owns that one turn, primary Talk clicks do
not cancel, end, or start another turn. The collapsed response bubble is applied
once the final assistant transcript is available, before TTS starts or while it
plays; playback settlement only performs terminal cleanup/status handling. Late
activity snapshots cannot overwrite the settled result. The tray subscribes to
the same authoritative Talk snapshots so its Talk/End Talk label follows session
transitions without duplicating lifecycle state.
Typed chat and Talk share one host-owned modality lease for the current
conversation. A competing turn is rejected before capture or model work with
an actionable busy error; leases release on terminal settlement, end, or
shutdown. Terminal feedback is the only failure/missing-information trigger;
the latter is shown only when the structured capability boundary explicitly
declares `missingInformation: true`, including a missing required field at the
host-owned capability input validator.

### Pet windows

Pet rendering and lifecycle setup live in `pet-window.ts` plus the two controllers
(`default-pet-controller.ts`, `agent-pet-controller.ts`) and the motion/mapping
helpers. `pet-display-coordinator.ts` owns display/power listener lifecycle and
cross-controller topology/recovery fanout. `pet-window-interaction.ts` owns the per-window mouse/drag and renderer
IPC lifecycle, recovery/watchdog, and speech-completion bridge. This is covered
in depth in [Pets](/pets).

Closing the default pet through the window manager temporarily hides its existing
window: it saves the current position and runs normal hide cleanup, but does not
change the persisted open-on-launch preference. The explicit context-menu Hide
action retains its persisted preference behavior. A canceled close is not a
destruction boundary, so interaction and gaze state remain installed for a later
show; app shutdown destroys the window directly rather than routing through the
canceled close request.

### Local IPC server

`local-ipc.ts` runs a `net.Server` over a Unix socket / Windows named pipe /
TCP, routes a versioned JSON protocol, and writes a discovery file so clients
can find it. The lease manager (`lease-manager.ts`) sits behind it. Full
contract in [IPC and remote control](/ipc).

### Remote control service

`remote-control-service.ts` is deliberately not a mode of `local-ipc.ts`. It is
disabled unless a local caller explicitly configures a concrete private,
loopback, link-local, or CGNAT-range IPv4 address and port. Wildcards, public
addresses, hostnames, IPv6, non-canonical IPv4 text, and port zero are rejected.
Its own versioned protocol has a 4 KiB payload cap, bounded socket lifetime,
concurrent-socket cap, and per-remote-address rate limit. The absolute deadline
remains through response shutdown so half-open peers are reclaimed without
truncating a complete response.

Pairing creates a named client and a high-entropy token. The plaintext token is
returned only by the local pairing/rotation API; persistence stores only its
SHA-256 verifier plus client metadata and activity timestamps. The main-process
IPC interface (`openpets:remote-*`) supports Control Center management: configuration,
pairing, listing, rotation, and revocation. Control Center (Settings → Remote)
provides a dedicated UI with listener configuration, explicit IPv4 bind validation,
a prominent unencrypted TCP transport warning with explicit acknowledgement before
enabling, paired client listing with scope badges, pairing with `say` unchecked by default,
a one-time token handoff panel with environment/CLI setup guidance (`OPENPETS_REMOTE_ENDPOINT="tcp://<address>:<port>"` derived from active listener state), and confirmation
modals for token rotation and client revocation.

Remote requests can only read a sanitized status snapshot, react to the default pet,
or say a short validated message with the `say` scope. Leases, installation, discovery,
files, media, paths, prompts, tool output, and arbitrary pet targets are not part of the
remote capability. Explanatory copy in Control Center highlights these default-pet-only
and no-files/media constraints. LAN ownership is initialized before the remote service
singleton and Control Center handlers; the persisted listener starts only after the normal
UI/local-IPC startup steps. While LAN ownership is unknown or belongs to another host,
remote reactions and speech return `shown: false` instead of waking or forwarding the
local default pet. With LAN mode off, local default-pet behavior is unchanged.

**Pet fallback notification:** when an agent requests a specific pet via
`--pet <id>` and that pet is not installed (or is invalid/broken), the lease
manager silently falls back to the default pet and window confinement does not
activate. `pet-fallback-notify.ts` detects this condition and fires a native
macOS notification (once per unique pet ID) so the user knows why confinement
is inactive. The notification includes the command to use once the pet is
installed.

### App state

`app-state.ts` persists a versioned JSON document under
`userData/openpets-state.json` using atomic temp-write + rename. It holds
installed pets, the default-pet config, reaction→animation overrides, onboarding
state, locale preference, the pet pool preference (ordered pet list +
`petPoolEnabled` toggle), the host Pet Assistant personality profile, and display-roaming preferences (`petConfinementEnabled`,
`petCrossDisplayEnabled`), plus the global `waitingAnimationDurationMs`
preference, the `idleCursorGazeEnabled` V2 idle-gaze toggle, and canonical
`voiceAssistantShortcut` accelerator. Idle cursor gaze defaults to enabled and
is configurable in Control Center → Settings → General. Eligible V2 pets treat
cursor movement as a short glance: they follow direction changes and return to
neutral after about 1.2 seconds without movement. Disabling it promptly returns
eligible V2 pets to their neutral idle pose and stops the shared gaze ticker;
enabling it resumes tracking. Reactions, motion, dragging, pausing, explicit
presentation overrides, and V1 pets are unaffected. That duration is normalized to `1010` ms (Normal) or `2200` ms
(Relaxed), with `1010` ms as the default. `app-state-core.ts` and
`pet-assistant-personality.ts` hold pure normalization helpers that are testable
without Electron.

Installed pet records persist their source ownership. That ownership selects the
Team or personal pet root; the app never infers ownership from whichever directory
currently contains an artifact. Team reconciliation and rejected installs restore
the prior Team state without overwriting or removing personal catalog or Codex
pets.

#### Pet pool preference

The **pet pool** is an ordered list of installed pets plus a master enable/disable
toggle (`petPoolEnabled`, default `true`), both configurable in Control Center →
Settings → General. When enabled, the lease manager uses the ordered list to
assign a distinct pet to each concurrent agent session that does not explicitly
request one via `--pet <id>`. Slot 1 is the primary/default pet; slot 2 onwards
are assigned to additional sessions in order. When all pool slots are taken,
further sessions receive a random eligible pet (installed, non-broken, not the
built-in default). Slots free up when their session ends. `--pet <id>` bypasses
the pool entirely. When disabled, all sessions without `--pet` share the single
default pet (legacy behavior). Pool assignment is pure lease logic and works on
all platforms.

**Toggle side-effects:** disabling the pool immediately despawns all active pool
pets (releases their leases, which closes their windows). Re-enabling respawns a
pool pet for every session whose client PID is still alive - those sessions
acquire new leases and their windows reopen. Sessions whose processes have already
terminated are skipped. This is handled by `dispatchPoolToggle` in `local-ipc.ts`,
wired from the `update-preferences` IPC handler in `windows.ts`.

**Session teardown:** a periodic liveness sweep (the `local-ipc.ts` cleanup timer
calling `lease-manager.ts`'s `checkPidLiveness`) releases an agent pet's lease - and so closes its window - once the owning session is gone. It probes the
**terminal owner PID** (when known) as well as the client PID, so an orphaned but
still-running client can't keep a pet alive indefinitely. Expiring the 15s TTL is
the backstop; liveness is the prompt path.

See [Agent integrations](/agent-integrations) for the
full behavioral description.

### Plugin subsystem

A large, self-contained subsystem (`plugin-*.ts`) covering manifests, state,
runtime, the sandboxed JS host, the permission-checked SDK bridge, catalog/local
install, assets, panels, diagnostics, and platform settings. Fully documented in
[Plugin platform](/plugins) and [Plugin SDK v3](/sdk).

The plugin voice foundation is deliberately smaller than a conversation platform.
  `voice-device-service.ts` owns durable opaque input/output preferences, capability
snapshots, and immutable per-operation input resolution. Its Electron companion
enumerates devices in one trusted, persistent `openpets-voice-media` partition and
  limits `media` permission to the capture and realtime documents; the media
  player receives only `speaker-selection`. `voice-capture-electron.ts`
owns a hidden, sandboxed microphone window and shared session; `voice-capture.ts` owns exactly-once cleanup and cancellation; and
`voice-privacy-indicator.ts` tracks live microphone ownership after
`getUserMedia()` succeeds and drives the transient Electron privacy surface. The
surface is reference-counted across one-shot and Realtime owners, appears only
while at least one microphone track is live, and is destroyed during shared
voice shutdown. A capture is one-shot and one-at-a-
time, with a 15-second acquisition timeout, a separate 30-second transcription
timeout, and an explicit host cancellation path. Plugin teardown and app shutdown
cancel the active capture, abort transcription, stop tracks, destroy the capture
window and clear the live-track accounting. No ambient or
wake-word listening is implemented. While active, the existing tray menu exposes
**Stop microphone listening** during acquisition/recording and **Cancel
transcription** while provider transcription is pending; the control disappears
when the operation settles.

The private `VoiceConversationService` and hidden, sandboxed realtime renderer
remain host infrastructure. When the explicitly selected text profile uses the
native `openai-realtime` adapter and the derived realtime status is ready, the
Talk surface creates the optional
`OpenAIRealtimeVoiceAssistantSession`; other text profiles keep the generic
STT -> Pet Assistant -> TTS path. The realtime lane shares the microphone and
modality leases, tracks interruptions and mute state, rejects stale events, and
releases only its own resources on close. It never resets shared live-track
accounting; `voice-resource-owner.ts` performs final teardown after every lane
stops. The renderer owns `getUserMedia`, WebRTC, the data channel, and remote
audio. It emits only bounded normalized transcripts and tool-call requests; the
host keeps credentials, builds canonical tools, executes capabilities through
the Pet Assistant service, and encodes provider-specific results back to
Realtime. Response IDs and input item IDs remain attached through the normalized
event boundary so delayed events from an interrupted response cannot mutate the
replacement canonical turn. No plugin SDK route or plugin permission exposes
this adapter.

#### Generic host voice session and Talk controls (#147, #150)

`voice-assistant-host.ts` exposes a host controller/factory, not an app-lifetime
terminal session. Each activation creates one `VoiceAssistantSession`; ending it
releases the microphone reservation and the next activation creates a fresh
session. The composition is bounded final-only capture/transcription → canonical
Pet Assistant → authoritative TTS. Text, STT, and TTS provider profiles are
independent, with the STT profile snapshotted before capture begins. #150 adds
bounded host controls and a pet-owned Talk entry. Generic session transcript
events and the optional Realtime adapter are normalized
into the #148 current-session Conversation projection; terminal text is also
eligible for the #149 host archive, while voice lifecycle itself remains
host-owned. A single app-lifetime feedback reducer consumes typed and
voice canonical events plus listening and actual playback transitions. Canonical
`responding` remains thinking, speaking is emitted only after playback starts,
cancellation is not failure, and missing-information is shown only when the
canonical outcome explicitly marks it. Talk is one-shot: after the submitted
recording reaches terminal synthesis/playback completion or failure, the voice
session ends, releases its resources, and does not reopen capture. A fresh
explicit Talk activation is required for the next recording. Native Realtime
uses `response-completed` as its safe terminal boundary and closes its transport
after that response; its primary toggle remains non-destructive while active.

Pet-window playback is request-scoped by `{ requestId, kind }`. Renderer audio and
system speech settle replacement, matching/unscoped stop, error, close, renderer
loss, navigation, and timeout paths exactly once. Deadlines are bounded but
duration-aware: system speech accounts for the complete chunked text and speech
rate, while provider audio receives a generous allowance under the hard maximum.
System speech reports one completion only after the last chunk, preserving the
authoritative assistant text. Voice activity uses its own composable pet slot, so
voice animation/status cleanup cannot erase an unrelated plugin message, media
bubble, or status badge. It maps listening/thinking/acting/speaking to
waiting/thinking/working/running and clears the voice slot on mute, pause, end,
and shutdown.

#### Pet Assistant host integration (#138, #146)

Once `PluginService.start()` resolves, `pet-assistant-host.ts` constructs the
single host-owned `PetAssistantService`. `text-model-client.ts` uses a stable
operation snapshot from `provider-service.ts` for the selected text profile;
secret credential values are resolved from `PluginSecretsStore` and never enter
settings or snapshots; optional static provider header values remain in the
local provider-profile settings and snapshots expose only their names. The adapter never uses the
plugin `ctx.ai` gateway. Capability discovery and execution call the
generation-pinned `PluginService` APIs; pre-invocation lifecycle rejection is
unavailable, while a disable/reload after invocation is indeterminate.

`PetAssistantMemory` is the Electron-/filesystem-free owner of completed-turn
active context and the optional archive seam. It bounds active turns, selects
archive context before active context with archive-turn deduplication, appends
only canonical terminal user/assistant text for the default conversation, and
delegates archive list/delete/clear operations. The service keeps model,
capability, cancellation, terminal-reduction, and realtime lifecycle ownership;
it hands memory the outcome only after canonical terminal text replacement.
普通对话的用户消息与回答分别保留首次出现的时间；语音部分转写后续更新沿用该条首次时间。宿主事件将时间交给会话投影，并随完成回合经 memory 写入逐条归档，重启后不改为整轮完成时间。时间元数据不进入提供方消息；旧历史已有的时间原样保留，不追溯推算。
The service validates whole tool batches before side effects, bounds
context/tool/final payloads, and cancels active model/capability waits during idempotent shutdown. Missing model
configuration fails a turn clearly and does not prevent desktop startup. The
host injects a synchronous composition provider backed by `app-state.ts`.
`PetAssistantService` captures the returned profile at the beginning of each
turn, so Settings edits are visible to the next turn while an active turn keeps
one stable composition snapshot. The profile contains bounded `petName`, `tone`,
`style`, `ownerAddress`, and `responseLength` fields with neutral defaults.

The system prompt order is immutable host rules, optional curated context, a
fixed-order JSON personality data block with escaped prompt markers, and a
current-time section (local ISO timestamp with UTC offset plus the IANA
timezone) so absolute-time capabilities such as `reminders.create` receive
future timestamps. Realtime voice sessions compose it once when the session
opens. The
most-recent local archive window follows the system message and is bounded to
24 entries/128 KiB; active in-memory context remains a separate bounded layer.
The archive contains only terminal user/assistant text from the canonical shared
conversation. Tool definitions/results, provider payloads, and personality data
never enter it. The current structured capability definitions and authoritative
results remain provider-neutral tool data. Personality is explicitly
communication-only and cannot grant capabilities, change permissions, or
rewrite failed, rejected, unavailable, or indeterminate outcomes. When any
such non-completed outcome exists, the terminal response is a deterministic
host-generated status summary rather than model prose; all-completed turns
preserve the model response. The archive is local-only and atomic, with 200
messages/30 days/512 KiB retention and a 64 KiB per-entry cap; corrupt data is
quarantined/replaced. A narrow Control Center bridge permits only listing,
deleting one archived message, or clearing the archive; its local-history panel
is separate from the active session and updates after a terminal turn or owner
deletion. There is no semantic retrieval, summary, preference, network
synchronization, or provider call for archive reads. Provider-profile management
is implemented in the Control Center
through the host-owned bridge.

Capability tools use readable lowercase provider names derived from plugin and
capability ids. The host adds a deterministic suffix only when normalization
collides or a provider length limit requires truncation. The in-pet action row
shows the capability description as a friendly label while retaining the exact
provider name separately for dispatch and event correlation.
The attached chat header and Dashboard hero title use the companion's personal
display name from the saved personality `petName` (falling back to the active
pet asset name if the personal name is unusable, and `Assistant` if neither is
available). Pet manager cards, the pet catalog, and system tray continue to display
the pet asset name. Personality preference updates broadcast to the Control Center
and pet carrier to refresh the hero title and chat header live.

The plugin subsystem also owns **display deliveries**: a lazy, transparent,
host-owned surface used by `ctx.ui.delivery`. A delivery is rendered as a single
courier-and-banner surface on the cursor display, rather than as a spawned pet
or a plugin-controlled overlay. Each display advances a bounded FIFO queue;
expiry, dismissal, display removal, plugin reload/disable/uninstall, and app
shutdown are host lifecycle events. The host animates the declared courier strip
and owns its layout; plugins only supply a trusted sprite reference and text.

Calendar Airmail's configuration is a plugin-exclusive courier picker. It is an
accessible animated sprite grid whose selected/hovered/focused cards animate,
while reduced-motion users see a static first frame. It does not select, preview,
or validate installed pets; its bundled courier sprites remain available wherever
the plugin is installed.

### Agent setup

`agent-setup.ts` detects installed agents and runs configuration actions (MCP
add/replace/remove, hooks install/uninstall/doctor, memory file install),
delegating to the integration packages. It also owns the OpenClaw setup
boundary: the configured `openclaw` executable is used for version, list, and
inspect discovery, while install/update/enable/remove actions are run only for
the owned npm package and are verified by a post-action refresh. Nix mode,
unsupported hosts/versions, nonstandard plugin ownership, invalid metadata, and
failed refreshes remain explicit status states rather than being auto-mutated.
`claude-memory.ts` manages the Claude instructions file. The Control Center
consumes the setup snapshot and actions through `windows.ts`; the CLI's global
`configure --agent openclaw` flow uses the same OpenClaw management contract but
does not use a project path or pet selection. See [Agent integrations](/agent-integrations).

### Catalog & installation

`catalog.ts` fetches the pet catalog (v3 paginated, with v2/fixture fallback);
`pet-installation.ts` downloads + validates + extracts pet ZIPs; `codex-pets.ts`
imports locally-developed pets. See [Catalogs](/catalog) and [Pets](/pets).

### i18n

`src/i18n/` resolves the active locale and serves localized host UI text and pet
reaction speech, with English fallback. See [Internationalization](/i18n).

### 上游更新遗留源码

`update-checker.ts` 与 `update-version.ts` 仍供迁入历史和旧测试参考；当前启动、托盘及工作室不使用其更新入口。

### Logging

`logger.ts` provides scoped, structured logging (scopes include `app`, `ipc`, `lease`,
`pet.*`, `state`, `tray`, `ui`, `voice`, `provider`, and the dev-only `capture`) with log rotation (~2MB) and redaction of
sensitive data, written to `userData/logs/openpets.log`. Renderer diagnostics
should be routed here so failures are visible in the log file, not only DevTools
(see the logging guidance in `AGENTS.md`).

Talk diagnostics make the one-shot path readable in production logs: session start;
capture requested/acquired/finished, cancelled, or failed; STT requested/succeeded,
cancelled, or failed; brain turn requested/completed, cancelled, or failed; speech
synthesis requested/returned or failed; and playback started/completed, cancelled,
or failed, followed by session end. Provider diagnostics independently record the
outbound and terminal lifecycle of text, STT, TTS, and realtime requests, including
role, adapter, profile ID, safe API path, status/elapsed time, and bounded output
size or transcript/reply character counts.

Diagnostics deliberately exclude credentials and auth headers, base URLs, request
payloads, raw user or assistant text, audio bytes, and full provider responses.
Cancellation records include the available reason (`user`, `session`, or `capture`)
so a user stop, teardown, and capture failure are not conflated.

## Security model

This is non-negotiable surface area. The app handles remote content (catalogs,
ZIPs) and runs third-party plugin code, so it is defensive by construction:

- **Sandboxed renderers** with `contextIsolation`; capabilities reach them only
  through narrow `contextBridge` preload APIs.
- **Strict CSP**: `default-src 'none'`, inline styles only. Any new
  renderer-visible URL scheme, image source, dev endpoint, or internal protocol
  **must** be added to the CSP in *both* `apps/desktop/vite.config.ts` and
  `apps/desktop/src/renderer/index.html`. Common pet image protocols:
  `openpets-codex:`, `openpets-installed:`, `openpets-pet-preview:`, and
  `openpets-plugin-asset:`. Forgetting the CSP makes images fall back to the
  default pet even when install/render logic is correct. (This is a documented,
  easy-to-hit footgun in `AGENTS.md`.)
- **桌宠媒体 CSP**：原图集窗口继续只播放宿主提供的音频与会话缓存；独立动作媒体窗口另外允许 `openpets-installed:` 媒体及连接来源。控制中心的两个 CSP 同时声明该来源，主进程在 ready 前登记标准、受保护且支持流和 CORS 的协议。动作端点只读取已安装宠物元数据声明的本包 MP4／WebM／动画 WebP，拒绝链接、任意路径和未知动作，支持有界字节范围与 HEAD；不开放远程媒体地址。沙箱内的纯色去背和帧解码不能访问本机任意文件。
- **Mock keychain** to avoid OS credential prompts.
- **IPC network security**: local TCP mode is restricted to loopback/private
  addresses; public IPs and hostnames are rejected. Remote control is separate,
  opt-in, explicitly bound, authenticated per client, and scope limited; it
  never writes a discovery file. See [IPC and remote control](/ipc).
- **Defensive I/O**: atomic writes everywhere; path-traversal and symlink checks
  on every filesystem boundary; strict ZIP entry validation (`zip-safety.ts`).
- **Plugin sandbox**: plugins run in hidden, session-partitioned BrowserWindows
  with navigation/window-open hardening and permission-gated SDK calls. See
  [Plugin platform](/plugins).

- **Trusted plugin assets**: `openpets-plugin-asset:` serves only an enabled,
  exact-version JavaScript plugin's declared sprite. The protocol accepts only a
  narrow sprite route, resolves it beneath the real install root, rechecks WebP
  dimensions against manifest frame metadata, and returns no filesystem paths to
  a renderer. Delivery documents have their own restrictive CSP and can load
  only this protocol (or data URLs).

## Packaging

`electron-builder.yml` configures cross-platform packaging (macOS/Windows/Linux)
with ASAR. Bundled mode unpacks the integration runtimes from ASAR so hooks, MCP,
editor setup, and the native OpenClaw plugin can spawn them.
`scripts/release-local.mjs` builds an isolated unpacked package for every
platform/architecture target and then extracts the actual DMG, ZIP, AppImage,
DEB, RPM, and tar.gz payloads for target-aware `check-packaging-contract --output`
validation before copy/tag/publication. See [Development](/development) for the
release flow.

## Where to look first

本地分支已接入控制中心的“电脑助手”页，体检和文件操作的步骤见
[电脑与文件助手](/companion-tools)，范围与撤销契约见
[文件助手](/companion-files)。这些功能不需要模型密钥；自动 AI 派单尚未接入。

本地桌宠分支的电脑助手只读采集、窗口进程指认和软件清单完整性契约见
[Windows 电脑诊断](/companion-diagnostics)。入口是
`companion-diagnostics.ts`；采集脚本随包解压，退出时取消子进程。

本轮源码的 **电脑助手 → 软件提醒** 已接入安装前 EXE/MSI 静态检查、
可选下载目录观察和卸载登记目录核对的只读最小版本，已完成实际窗口验收和便携包重建。
`companion-software-inspection.ts` 拥有固定 PowerShell 采集的取消与超时，
`companion-software-core.ts` 校验 SHA256、签名、版本及 MOTW 来源主机；
结论保持捆绑待确认。检查不运行或上传安装包、不调用远程信誉库；
Windows 证书链验证可能查询系统证书服务，不能把它描述为绝对离线。

`companion-downloads.ts` 单独拥有用户原生选择的下载范围、默认关闭的开关、
30 秒定时器及忽略和 1 小时稍后规则。它只读取第一层最多 200 个顶层条目，
新增 EXE/MSI 经过至少两次有效观察、相隔不少于 10 秒且属性稳定才检查；
首次、重启或重新启用先建基线，不补报未观察期间的变化。
隐藏桌宠时不消耗未送达状态，后续有效观察才重试，不唤出隐藏的宠物。

`companion-tools.ts` 保存新鲜完整软件基线和有界移除记录，
`companion-uninstall-check.ts` 只逐层核对此前保存的安装目录属性，
不猜测 AppData、不枚举或删除内容，也不判定全盘干净。
`control-center-companion-ipc.ts` 继续拥有原生选择与窗口取消归属；
软件检查只接受主进程所选路径或已保存记录 ID，渲染器通过
`companion-software-types.ts` 和 `companion-tools-types.ts` 接收证据。
界面所有者是 `renderer/src/companion/CompanionSoftwareView.tsx`。
具体操作、证据解释与验收状态见[电脑与文件助手](/companion-tools)。

| If you're touching… | Start in |
|---------------------|----------|
| Tray menu / Control Center routing | `tray.ts`, `windows.ts` |
| Pet appearance / animation | `pet-window.ts`, `reaction-animation-mapping.ts` ([Pets](/pets)) |
| Pet drag / click-through / interaction lifecycle | `pet-window-interaction.ts`, `pet-preload.cjs` ([Pets](/pets)) |
| Agent → pet command path | `local-ipc.ts`, `lease-manager.ts` ([IPC and remote control](/ipc)) |
| Persisted settings | `app-state.ts` |
| Plugin behavior | `plugin-service.ts` + `plugin-*.ts` ([Plugin platform](/plugins)) |
| Agent configuration | `agent-setup.ts` ([Agent integrations](/agent-integrations)) |
| Install / catalog | `catalog.ts`, `pet-installation.ts` ([Catalogs](/catalog)) |
| Anything renderer-visible with a URL | also update the CSP (both files) |
