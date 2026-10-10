# Claude Code 与 OpenCode 工作气泡

控制中心的工作监测与桌宠对话使用不同接入。本文描述官方运行事件进入本机桌宠的方式；模型是否已登录、是否有额度和是否完成真实会话仍须分别验收。

## Claude Code

更新桌宠管理的 Hooks 后，默认桌宠接收 `SessionStart`、`UserPromptSubmit`、`PreToolUse`、`PostToolUse`、`PostToolUseFailure`、`PermissionRequest`、`Stop`、`StopFailure` 和 `SessionEnd`。`Notification` 保留旧支持，不据此推测工具进度。

只有官方负载提供 `session_id` 才登记工作会话。工具名称来自 `tool_name`，工具关联来自 `tool_use_id`。成功的 `PostToolUse` 执行 Edit、Write、MultiEdit 时，才从实际工具输入的 `file_path` 产生文件摘要；失败、不完整事件和模型回答中的“已编辑”不计数。会话开始、工具完成／失败和结束均在原动作冷却之前送达。

旧的 Hooks 配置缺少新增事件会显示需要更新。项目本地 Hook 与全局 Hook 的去重保留；`--pet` 明确指定另一只宠物时仍走原租约，不把该任务登记给默认桌宠。

## OpenCode

官方插件 Hook `chat.message`、`tool.execute.before`、`tool.execute.after` 与会话事件驱动进度；官方 `sessionID` 和 `callID` 关联同一会话及工具。`message.part.updated` 中明确的工具错误产生失败事件，`session.status` 的 idle 结束回合。没有会话标识的旧事件只保留原简短动作反馈。

编辑文件数只来自工具成功返回的结构化 metadata：write 的 `filepath`、edit 的 `filediff.file`、apply_patch 的 `files`。移动文件使用 `movePath` 作为实际目标。没有成功返回值的 Task、失败标记、模型文字和工具提交参数不算成功编辑。重复编辑由桌宠按文件摘要去重。

用户排除的动作不被绕过：若明确排除 success 等对应事件，该事件也不发工作 IPC；桌宠在无新活动 90 秒后回到待机。显式指定宠物时保留租约，不向默认桌宠登记进度。详细事件不受简短动作或语音冷却影响。

## 隐私与范围

会话、回合、工具调用和文件路径在客户端转换成固定 SHA-256 摘要。发送的内容限于平台名称、生命周期、工具名称、文件摘要和时间；不发送提示词、聊天、源码、命令、工具参数和工具输出。工作气泡只走本机默认桌宠，不能通过远程桌宠连接上报。

豆包 PC／网页的登录与方舟开发桥是不同路径。当前没有凭网页登录推定已经接通其工具运行事件；开发桥不能作为 PC／网页真实监测验收的替代。

## 官方依据

- [Claude Code 官方 Hooks 参考](https://code.claude.com/docs/en/hooks)：会话、工具成功／失败、许可与结束事件的负载。
- [OpenCode 官方插件](https://opencode.ai/docs/plugins/)与[插件接口源码](https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts)：消息、工具前后 Hook 的输入和返回契约。
- [OpenCode write](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/tool/write.ts)、[edit](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/tool/edit.ts)、[apply_patch](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/tool/apply_patch.ts)：成功执行后的 metadata。

行为检查覆盖连续生命周期不丢事件、成功编辑与失败区分、文件去重依据、隐私字段、显式宠物与排除动作设置；模拟负载不算正式 AI 会话验收。
