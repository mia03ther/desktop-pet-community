---
title: Official plugins
description: Reviewed OpenPets companion plugins, catalog lineup, bundling defaults, and companion-first behavior rules.
sidebar:
  label: Official plugins
---

OpenPets plugins are reviewed companion features that run through the desktop
plugin host. Users install and enable them from the Control Center. Maintainers
ship them through the plugin catalog, and plugin authors can study them as SDK v3
examples.

This page is intentionally practical. It answers:

- which plugins are in the current catalog
- which official plugins are bundled with the app
- which bundled plugins are enabled by default
- how OpenPets plugins should behave
- where to update code when the lineup changes

For the plugin architecture, permissions, runtime, sandbox, and packaging flow,
see [Plugin platform](/plugins). For the author-facing API, see
[Plugin SDK v3](/sdk).

## 本项目可选工具

本地导入支持插件 ZIP／JSON／文件夹及三种清单文件名，不改变下列插件的 SDK、权限或默认启用规则。共创作者自行开发后上传完整包；其他应用的插件可以留档分享，只有兼容本宿主 SDK 的插件才能在本机启用，见[插件平台](/plugins#local-development)。

文件助手 `lingyin.file-assistant` 和电脑守护 `lingyin.computer-care` 位于本项目 `plugins/community/`，通过独立共创网站下载。它们不属于下面的上游公共目录，也不加入官方捆绑或默认安装列表；用户需要下载、导入、确认权限并启用。工具能力与配置由匹配版本桌宠工作室宿主提供，入口仅声明启用状态。用途、权限与实际 ZIP 验证见[共创网站](/community-website#可选工具插件)及[插件平台](/plugins)。

启用偏好本身不代表授权完成：宿主还要求所需权限完整且插件真正运行。停用、卸载或运行损坏立即撤销任务和临时授权、暂停后台监测，保留已有数据与设置；不通过后台重新安装或静默启用恢复工具。

## Current catalog lineup

The public plugin catalog is `web/public/plugins/catalog.v2.json`. The current
catalog contains thirteen official plugins and five community plugins.

| Plugin | Type | What it does |
| --- | --- | --- |
| Anxiety Aid Tools | Official | Guided breathing, muscle relaxation, grounding, guided meditation, peaceful visualization, and relaxing sounds, rendered around the pet. Content from Anxiety Aid Tools. |
| Calendar Airmail | Official | Delivers Google Calendar event reminders through a selected bundled courier sprite. |
| Morning & Evening Routine | Official | Runs morning and evening check-ins. |
| Focus Buddy | Official | Starts focus sessions and refreshes timer progress through the pet each minute. |
| Daily Fortune Cookie | Official | Shows scheduled or command-triggered fortune messages. |
| Launch Buddy | Official | Helps with launch/checklist moments. |
| Magic 8-Ball | Official | Answers command-driven yes/no style questions. |
| Mood Check-in | Official | Prompts lightweight mood logging and check-ins. |
| Simple Timer | Official | Runs a one-shot countdown timer with a pet HUD, pause controls, and an expiry alert. |
| Quick Reminders | Official | Creates reminders with due/missed alerts, snooze, done, status, optional notifications, and sound. |
| Virtual Pet | Official | Adds Tamagotchi-style state, actions, and a pinned HUD. |
| Water Reminder | Official | Runs hydration reminders on a configurable cadence. |
| System Resources | Official | Reports host CPU, RAM, optional GPU and system-volume Disk metrics in an integrated pinned HUD, with optional battery/network reporting and configurable alerts. |
| Vocabulary Drag & Drop | Community | Drag words to see definitions and translations in a natively scrollable HUD card. |
| Higgsfield Watch | Community | Catalog-listed community plugin. |
| Spotify Buddy | Community | Catalog-listed community plugin. |
| Walkabout | Community | Lets the pet roam, follow the cursor, or patrol. |
| Usage Buddy | Community | Reflects live Claude and Codex usage from a local usage monitor endpoint. |

Official plugin source lives under `plugins/official/`. Community catalog
plugins are labeled `publisherType: "community"` and are never bundled or
enabled by default.

## Bundled defaults

### 本地中文桌宠分支

本分支全部插件改由独立共创网站下载，应用不预装插件，新档案的插件列表为空。
“生活伙伴” (`openpets.life-companion` 1.1.0) 是可选下载插件。升级保留已安装插件及其
数据、设置和授权，解除个人插件的旧内置标识后可正常卸载或更新；不删除退役编号的已有内容。
随机动作由宿主唯一负责，在“我的桌宠”配置：安静模式默认开启，未工作时
保持待机；单击随机切换、六秒回归，关闭安静后每 45 秒自动选择一次。
真实 AI 工作优先，隐藏、拖拽、暂停、锁屏和休眠取消随机计时。可自定义动作
名称、现有图集状态、随机候选和 AI 状态映射，见[本地动作模式](/pets#本地动作模式)。

生活伙伴不再另建自动散步、休息姿态、无聊玩耍或闲聊链，避免覆盖宿主。
它读取 Virtual Pet 的唯一照顾快照，主动命令可休息／唤醒／玩耍，双击玩耍，
拖拽有提起／放下反馈。Virtual Pet 1.2.2 不再处理单击自动抚摸；
饥饿、疲惫等照顾提醒默认关闭，用户可在插件配置启用。原养成数据与睡眠时限保留。
隐藏启动未创建窗口属于正常不可见状态，不修改用户启动选择，也不标为损坏。

“久坐提醒”（60 分钟）、“眼睛休息提醒”（20 分钟）和“凌晨晚安提醒”
全部默认关闭，在生活伙伴设置中单独启用。离开电脑或解锁后重新计时，
午夜提醒保留本地日期，重启不重复提示。喝水和番茄钟继续使用既有
Water Reminder / Focus Buddy 插件。宿主安静模式约束自身随机动作和这两个本地
生活插件的自动行为；其他由用户单独开启的提醒或移动插件仍按自身配置运行。
主动休息仍可短暂使用现有 `waiting` 动画，通用图集没有新增专用睡眠行。
独立媒体宠物若声明 `sleeping`，宿主会按 Virtual Pet 的真实睡眠快照播放，
在到期、唤醒或插件停止时清除；没有该素材时保持原行为。
本分支功能尚未上传上游公共插件目录，不应把本地新增项算进公共目录数量。

### SDK 内置模式参考

下面说明宿主 SDK 显式开启内置播种时的原有行为。本项目独立发行关闭该模式，
不采用下面的捆绑及默认启用列表。

The desktop app can ship selected official plugins inside the application bundle.
Those defaults are defined in `apps/desktop/src/bundled-plugins.ts` and consumed by `apps/desktop/src/plugin-service.ts`.

| Default | Plugins |
| --- | --- |
| Bundled with the app | Quick Reminders, Simple Timer, Anxiety Aid Tools, Focus Buddy, Launch Buddy, Daily Fortune Cookie, Virtual Pet, System Resources |
| Enabled by default | Quick Reminders, Simple Timer, Anxiety Aid Tools, Focus Buddy, Launch Buddy, Daily Fortune Cookie |
| Bundled but disabled by default | Virtual Pet, System Resources |

A bundled plugin's saved enabled state wins over the default. A plugin newly
added to the bundled lineup has no saved state yet, so users who upgrade get it
with its default (enabled for the list above), not only fresh installs.

Bundled plugins are approved with their manifest permissions. Anxiety Aid Tools
is the one bundled plugin with `network` access, limited to its media host
(`r2.anxietyaidtools.com`); it downloads narration and soundscape audio only
when the user opens one of those practices, then serves it from the local cache.

Everything else is installable from the catalog, not preloaded into a fresh app
install.

The bundled plugins below expose their useful operations as typed Pet
Assistant capabilities when enabled. Their assistant operations use the same
durable domain state as their pet-menu controls, while the host conversation
owns the spoken or chat response. Simple Timer, Anxiety Aid Tools and Daily
Fortune Cookie do not register assistant capabilities yet; they are driven from
the pet menu.

| Plugin | Assistant capabilities |
| --- | --- |
| Quick Reminders | Create, list, complete, snooze, and remove reminders. |
| Focus Buddy | Start, inspect, pause, resume, end, or skip to a break in a focus session. |
| Launch Buddy | Deliver the configured greeting on demand. |
| Virtual Pet | Inspect its status, then feed, play with, pet, or put it down for a nap. |
| System Resources | Read metrics and show or hide its pinned HUD. |

The same file also defines `staleBundledPluginIds`, a cleanup list for old
bundled plugins that should be removed during upgrade. Keep that list when old
plugin ids need a clean migration, but do not optimize new runtime behavior for
deprecated plugin names.

## Companion behavior rules

OpenPets plugins should feel like companion behaviors, not mini control panels.

- **Host-rendered UI.** Plugins describe bubbles, alerts, HUDs, commands,
  deliveries, sounds, schedules, and stored state. The desktop host validates
  and renders those effects.
- **No JSON editing for users.** Settings come from typed `configSchema` fields
  rendered by the Control Center.
- **Localized by default.** Manifests use `$t:` keys and code uses `ctx.t()`.
  Ship at least `locales/en.json`; add other locales when a plugin is part of
  the official lineup.
- **Small appliances beat giant knobs.** A plugin should do one clear thing and
  explain itself by name.
- **Commands belong on the pet.** Enabled plugins expose clear, verb-first
  commands through the default pet right-click menu. Bubble buttons and pinned
  HUDs handle in-the-moment actions such as snooze, done, feed, or dismiss.
- **The menu reflects the current state.** Commands appear only while they
  apply, and live controls sit at the menu root. See the
  [pet menu rules](/plugins#pet-menu-rules).
- **State survives sleep and restart.** Reminders, routines, focus sessions, and
  virtual-pet stats persist through `ctx.storage` and reconcile after resume.
- **One icon style.** Official plugins declare a colour SVG under
  `assets.icons`, shown in the Control Center and the catalog. Use Google Noto
  Emoji (Apache 2.0), fetched from `https://api.iconify.design/noto/<name>.svg`,
  so the lineup reads as one set. A partner plugin may use its own brand mark
  instead (Anxiety Aid Tools uses the lotus from its logo). Icons render as
  images, so they cannot follow the app theme: avoid `currentColor` and dark
  strokes that disappear on the dark theme.

## Pet menu by state

How the bundled plugins apply the [pet menu rules](/plugins#pet-menu-rules):

| Plugin | Menu root (live controls) | Plugin submenu |
| --- | --- | --- |
| Simple Timer | Running/paused: Pause *or* Resume timer, Add 5 minutes, Cancel timer. Finished: Snooze 5 minutes, Dismiss timer. | Idle or finished: Start timer… and presets. Running/paused: Start a new timer…, Show timer. |
| Focus Buddy | Focus: Pause *or* Resume focus session, Skip to break, End focus session. Break: Pause *or* Resume break, End break. | Idle: Start focus session. Session: Show status (plus Start focus session during a break). |
| Quick Reminders | — | Set reminder…, presets, Test reminder; View/Clear reminders only while one is pending. |
| System Resources | — | Hide resource HUD while it is on screen, otherwise Show resource HUD; Read resources. |
| Anxiety Aid Tools, Virtual Pet, Daily Fortune Cookie, Launch Buddy | — | Unchanged: every command applies at any time. Practice sessions have their own on-screen pause/stop controls. |

## Maintainer checklist

When plugin lineup, bundling, or catalog behavior changes:

1. Update `plugins/official/*/openpets.plugin.json` or the community plugin
   source.
2. Update `apps/desktop/src/plugin-service.ts` if bundled or default-enabled
   plugins changed.
3. Regenerate and commit the plugin catalog output under `web/public/plugins/`.
4. Update this page and [Plugin platform](/plugins) when behavior, permissions,
   commands, or packaging rules changed.
5. Run the plugin release validators listed in
   [Testing and validation](/testing-and-validation).

Do not leave an older plugin lineup in docs after changing catalog output. The
source of truth is the plugin source plus the generated catalog that the desktop
actually consumes.
