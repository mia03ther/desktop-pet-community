# OpenPets Documentation

This folder is the maintained, conceptual documentation for the OpenPets
workspace. It explains *concepts, contracts, and where things live* - it
deliberately avoids pasting code, which rots. When a doc points you at a file,
that file is the source of truth; the doc explains why it matters and how the
pieces fit.

For per-folder structural detail (every symbol, edge, and responsibility), see
the `codemap.md` files throughout the tree, starting at the root `codemap.md`.
Docs here are the *narrative* layer on top of those maps.

## Start here

- **[architecture.md](architecture.md)** - the one-page mental model: runtime
  topology, the package spine, end-to-end flows, cross-cutting invariants, and a
  glossary. Read this first.

## Desktop app

- **[desktop.md](desktop.md)** - the Electron app: process model, tray-first UX,
  Control Center, windows, app state, lifecycle, security model, logging, CSP.
- **[ipc.md](ipc.md)** - the local IPC protocol and `@open-pets/client`:
  discovery, transports, the lease model, request methods, security.
- **[pets.md](pets.md)** - the pet model end to end: spritesheets, reactions,
  reaction→animation mapping, installation, Codex pets, motion.
- **[lan-mode.md](lan-mode.md)** - experimental LAN office-pet mode: one
  shared default pet moves between PCs on the same network.

## Product direction

- **[studio.md](studio.md)** — 当前独立工作室的六个页面、可选工具插件、外观来源、宠物及插件共创。
- **[project-goals.md](project-goals.md)** — 用户最新确认的目标、四项电脑监测范围和已完成／待完成状态。
- **[companion-tools.md](companion-tools.md)** — 本地电脑诊断、可选监测和文件计划。
- **[companion-files.md](companion-files.md)** — 本地文件询问、持久虚拟分类库、AI 审阅草稿与可撤销推荐整理。
- **[companion-ai.md](companion-ai.md)** — 多来源配置、同一桌宠对话、只读协同分析、活动证据和额度边界。
- **[companion-persona.md](companion-persona.md)** — 两种人设方式、AI 辅助文本提炼、审阅启用及多来源作用范围。
- **[companion-sharing.md](companion-sharing.md)** — 已有 V2 图集的个人宠物制作、ZIP/文件夹分享、再导入、动作预览与填写者的署名及许可声明。

- **[openpets_v4.md](openpets_v4.md)** - v4 delivery direction: a conversational
  Pet Assistant that uses enabled companion-plugin capabilities through voice
  and chat.

## Content & catalogs (app-facing web data)

- **[catalog.md](catalog.md)** - the pet and plugin catalogs the app consumes:
  v3/v2 contracts, pagination, search, install/manifest artifacts, R2 ZIP
  hosting, and how the desktop reads them.

## Agent integrations

- **[agent-integrations.md](agent-integrations.md)** - how Claude Code, MCP,
  OpenCode, Cursor, Zed, Pi, and OpenClaw are configured and how each turns
  agent activity into pet reactions, plus the CLI that ties them together.

## Plugins & SDK

- **[plugins.md](plugins.md)** - the plugin platform: manifest schema,
  permission model, runtime, sandboxed JS host, catalog vs local install,
  packaging and publishing, troubleshooting.
- **[official-plugins.md](official-plugins.md)** - the reviewed official and
  community plugin lineup, bundling/enabled defaults, and the companion-first
  behavior rules.
- **[sdk.md](sdk.md)** - the public SDK v3 contract for plugin authors: the
  capability namespaces, the permission surface, and the deterministic test
  harness.

## Internationalization

- **[i18n.md](i18n.md)** - translations across the desktop host, pet reaction
  speech, and plugins; locale fallback; `$t:` and `ctx.t()`; adding a locale.

## Developer experience, testing & release

- **[development.md](development.md)** - DX: monorepo layout, the command
  surface, dev modes, build conventions, and the npm/desktop release flows.
- **[testing-and-validation.md](testing-and-validation.md)** - the full quality
  gate: behavior tests, contract tests, runtime checks, plugin release
  validators (`validate-release` / `validate-live`), catalog verification, and
  what "production-valid" means before shipping.
- **[screenshots.md](screenshots.md)** - the dev capture session: transparent,
  trimmed screenshots of the pet in any plugin state (`pnpm capture`).

## How to keep these docs healthy

- When you change behavior, update the matching doc in the same change. Stale
  docs are worse than missing ones.
- Keep code out of docs. Reference the file that owns the behavior instead.
- Plugin/catalog/i18n changes have an explicit "update these docs" rule in
  `AGENTS.md` - honor it.
- Ongoing improvement ideas and known issues are tracked in the root
  `improvements.md`, not here.
