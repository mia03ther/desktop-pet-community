---
description: DeepSeek Harness 官方 Cordis 工作事件、本机进度气泡与真实会话验收边界。
---

# DeepSeek Harness 工作气泡

控制中心安装的是本机 Cordis bundle。新版观察官方 `agent/session-start`、
`agent/status`、`session/event`、`agent/assistant-stream`、`tools/execute`、
`tools/result`、`approval/request` 和 `session/disposed`。工具和审批的 waterfall
继续调用原来的 `next()`，桌宠不会修改工具结果或替用户批准。监听随 Cordis
插件卸载而释放。

会话、回合、调用和成功文件路径只发送 SHA256 摘要；不发送提示词、推理正文、
回答、命令、路径原文或结果原文。工作气泡显示真实工具名称，`write`／`edit`
只有在最终结果 `isError:false` 且实际前后内容不同的情况下才增加文件计数。
Shell 等间接改文件不会凭工具输出推断。长时间输出期间最多每十五秒发送一次
类别保活，同回合身份保留已有计数。错误、取消、完成和会话释放分别处理，
错误回合不会由随后的空闲状态改成成功。

插件按顺序发送事件，待发送队列最多二百条，保留最多一百个活动会话。
本机 IPC 离线、超时或失败不阻断 Harness；下一条真实事件可以重新连接。
来源固定为 `deepseek-harness`，不受远程环境变量影响。

安装页同时比较自有 bundle 和当前程序附带文件，旧版会提示更新；仅仅在
profile 里有同名包不会被当作新版就绪。更新后需重启相应 Harness 进程，
已有进程不会自动重新载入 bundle。`web`、`desktop`、`headless` 是不同的
profile，真实会话必须使用安装了该 bundle 的 profile。

官方 CLI 的 `dsh --profile headless "任务"` 可以驱动独立真实回合。真实验收
要求官方运行时实际调用模型、产生工具或回合事件并到达桌宠；注册监听器后
手动发事件的测试只证明桥接行为，不证明账号、模型或运行中的桌面客户端已连接。
没有凭据或模型请求失败时必须保留未验收状态。

本次事件签名依据本机官方 `@deepseek-ai/dsh 0.1.5-rc.2` 所附
`dsh-agent`、`dsh-session`、`dsh-tools` 和 `dsh-user-approval` 类型及运行时源码。
官方仓库说明项目仍处于开发预览期，升级后需要重新检查事件契约：
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)、
[官方文档](https://deepseek-harness.github.io/deepseek-harness/)。

所有者是 `assets/agent-hooks/deepseek-harness/progress.mjs`，安装与升级检查位于
`agent-setup-deepseek-harness.ts`；事件验证、会话汇总和气泡由主进程原有所有者完成。
