# Pi 与 OpenClaw 工作气泡

两个适配器都通过 `@open-pets/client` 的 `reportActivity()` 接入桌宠已有的工作气泡，和桌宠对话所用的 AI 配置分开。仅提交有界的活动摘要，不传提示词、回复、命令、路径原文或工具输出。桌宠未运行或 IPC 失败不会阻塞宿主。

## Pi

`packages/pi/src/runtime.ts` 从正式扩展上下文 `ctx.sessionManager.getSessionId()` 获取稳定会话 ID，在客户端哈希后发送。同一个会话的各模型迭代与自动续跑保留同一个本机工作轮次，直到最终结算；本机轮次标识不是提供方账户或模型 ID。没有正式会话 ID 的事件只能触发普通动作，不伪造可监测会话；`/openpets test` 仅检查连通性。

`tool_execution_start` 提供工具名称、调用 ID 与实际参数。仅对 `write`、`edit` 暂存真实 `args.path` 和当时的工作目录；匹配的 `tool_execution_end` 明确 `isError:false` 才将成功文件摘要计入，同一文件由桌宠去重。失败结果、缺少匹配调用的结果、Shell 文本和自定义工具名都不会凭空增加编辑数。暂存调用上限为 200，会话上限为 100，待提交事件上限为 200。

`agent_end` 之后可能还有自动恢复、压缩和续跑，因此不将它作为详细气泡的结束信号。读取 `agent_before_settle.outcome` 的正式结果类别，并在 `agent_settled` 才报告完成、失败或中止；缺少结果类别时不猜测成功，由已有的失联时限清理。会话关闭单独释放对应活动。

官方依据：[Pi 扩展说明](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)、[扩展事件类型](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts)。原 `badlogic/pi-mono` 地址目前重定向至该官方仓库。

## OpenClaw

保留 `packages/openclaw/src/index.ts` 原本完全不读取 payload 的回调边界，只订阅正式的 `model_call_started` 和 `before_tool_call`。前者表示思考活动，后者表示正在调用工具。

`packages/openclaw/src/runtime.ts` 为每个本机插件实例生成独立匿名活动槽。槽的随机 ID 只用来避免不同实例相互覆盖，不代表 OpenClaw 的真实会话，也不证明模型或账户已连接。不会展示未知工具名称、编辑文件数或虚构完成；当前没有可靠的结束事件进入此适配器，最后活动超过 90 秒后由桌宠清理。

同一种活动使用现有冷却窗口并限制为一个待发送任务。官方可能提供更多 hook，但各运行路径不保证发出同样事件，本版本不扩大读取范围来推测不存在的字段。

官方依据：[OpenClaw 插件 hooks](https://docs.openclaw.ai/plugins/hooks)、[插件加载与运行检查](https://docs.openclaw.ai/tools/plugin)。

## 验证范围

包内行为测试覆盖摘要隐私、稳定会话身份、成功文件去重依据、失败不增加文件数、正式结算与中止、匿名槽隔离以及恶意 payload 完全不被读取。本机尚未安装 Pi/OpenClaw，因此这些是适配器行为验证，不能记为已安装宿主的真实 AI 会话验收。真实验收需宿主安装登录后，通过正常模型会话触发实际事件，并观察桌宠窗口。
