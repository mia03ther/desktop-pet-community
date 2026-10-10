# packages/claude/src/

## Files

- **index.ts**: Barrel export (6 lines). Re-exports all public modules.
- **cli.ts**: CLI entry (51 lines). Command routing for `hook`, `doctor-hooks`, `install-hooks`, `uninstall-hooks`.
- **hooks.ts**: Hook 执行与工作气泡事件转换。官方 `session_id`、`tool_use_id` 经客户端摘要后传到本机默认桌宠；`PostToolUse` 成功的 Edit/Write/MultiEdit 才计编辑文件。逐工具和会话终态不受原语音／动作冷却影响，保留显式宠物租约和项目本地去重。
- **hook-settings.ts**: Hook 安装、诊断、卸载与备份；含会话开始／结束、工具完成／失败的十项官方事件，旧配置缺少事件时提示更新。
- **hook-messages.ts**: Speech re-exports (1 line). Re-exports from `@open-pets/agent-events`.
- **claude-code.ts**: MCP configuration (265 lines). `buildClaudeMcpPreview()`, `buildOpenPetsMcpServerCommand()`, `parseClaudeMcpGetOutput()`, `classifyClaudeMcpStatus()`, path validation, asar handling.
- **check-claude-code.ts**: MCP contract validation (excluded from detailed documentation).
- **check-claude-hooks.ts**: Hooks contract validation (excluded from detailed documentation).
