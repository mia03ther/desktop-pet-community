# packages/opencode/src/

## Files

- **index.ts**: Barrel export. Re-exports all public modules including path-safety helpers.
- **plugin.ts**: OpenCode plugin definition (10 lines). Default export with `id` and `server` factory.
- **opencode-plugin-runtime.ts**: 官方会话、消息、工具前后与失败事件转换；`sessionID`／`callID` 经客户端摘要后生成本机默认桌宠工作气泡。成功编辑只读取 write/edit/apply_patch 的官方返回 metadata，不读取模型自报文件数；保留租约、排除设置与原动作／语音冷却。
- **opencode-config.ts**: Config file management. Path resolution, JSONC parsing, safe file operations, atomic writes with backups, actionable symlink/parent diagnostics.
- **opencode-path-safety.ts**: Shared safety message builders. Symlink target display, scope-aware (`global`/`project`) config/instruction/parent/directory error formatters, lstat-based existence helpers, and full-ancestor symlink rejection for global roots.
- **opencode-project-setup.ts**: Project-level setup. `prepareOpenCodeProjectSetup()`, `writePreparedOpenCodeProjectSetup()`, instruction block management with path-aware safety errors.
- **opencode-global-setup.ts**: Global setup management. `prepareOpenCodeGlobalSetup()`, `prepareOpenCodeGlobalRemove()`, cleanup writes, doctor command, config precedence handling, global state classification with actionable safety errors.
- **opencode-status.ts**: Status classification (147 lines). `classifyOpenCodeMcpStatus()`, `classifyOpenCodeInstructionsStatus()`, `classifyOpenCodePluginStatus()`, managed MCP/plugin/instruction detection helpers, OpenPets-like entry detection.
- **opencode-previews.ts**: Config entry builders (55 lines). `buildOpenCodeMcpEntry()`, `buildOpenCodePluginPreview()`, `buildOpenCodeInstructionPath()`, `formatOpenCodeMcpConfig()`, `validateOpenPetsPetArg()`.
- **check-opencode-foundation.ts**: Contract validation (excluded from detailed documentation).
- **check-opencode-plugin.ts**: Plugin contract validation (excluded from detailed documentation).
