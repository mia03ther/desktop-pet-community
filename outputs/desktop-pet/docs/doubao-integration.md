---
description: 豆包官方方舟开发接口、本机桌宠事件桥与已验证的能力边界。
---

# 豆包与桌宠联动

豆包网页／PC 客户端监测与方舟开发接口是两项不同能力。当前尚未取得网页／PC 客户端的正式工作事件接口，不能因为方舟桥准备成功就把客户端标为已连接。`apps/desktop/src/agent-setup-doubao.ts` 保留开发者使用的方舟路径：生成本档案独立集成目录中的 `doubao-pet-bridge.mjs`，通过现有桌宠客户端和发现文件发送动作与工作摘要。它没有新建 HTTP 服务，不读取豆包登录状态，不改豆包客户端配置，也不占用“宠物大脑”的文字来源。

“本机桥已准备”只表示桌宠自己的桥接文件已生成并与当前档案匹配。用户还需在本机方舟应用中配置工具执行。“测试本机联动”只验证本机事件送达，不调用豆包 API，不表示豆包网页或 PC 客户端已连接。

## 官方实现路径

火山方舟的普通豆包模型提供 Function Calling。应用在请求的 `tools` 中声明函数，模型返回函数名与参数后，由应用执行函数，并把执行结果回填给模型。[方舟官方函数调用文档](https://docs.volcengine.com/docs/ark/function-calling?lang=zh)

原 `desktop_pet_activity` 函数声明与六状态本机命令仍用于单纯动作通知。唯一参数 `state` 支持 `started`、`working`、`waiting`、`completed`、`failed`、`idle`，映射成既有的 `thinking`、`working`、`waiting`、`success`、`error`、`idle` 动作。它们不带会话元数据，测试这些命令不会把账户标为真实会话已连接；仅让模型自行调用函数也不保证每个工作阶段都有事件。

本机应用可导入生成文件的 `reportDoubaoActivity`，也可用参数数组执行 `[node, bridgePath, "--event"]`，将单个不超过 16 KiB 的 JSON 对象写入标准输入。以下字段由应用的真实执行器填写，而不是由模型自行声称完成：

| 字段 | 规则 |
| --- | --- |
| `event` | `session-start`、`turn-start`、`tool-start`、`tool-complete`、`tool-failed`、`permission`、`turn-end`、`interrupt`、`session-end` |
| `sessionId` | 必填，使用应用实际会话标识；传输前转为 SHA-256 摘要 |
| `turnId`、`callId` | 可选，分别使用真实请求、工具调用标识；传输前转为摘要 |
| `toolName` | 可选，真实执行的工具名称，不含命令、参数或提示词 |
| `succeeded` | 仅用于 `tool-complete`；`false` 转为工具失败；未明确成功时不累计编辑文件 |
| `editedFiles` | 可选，最多 100 个绝对路径；只接受执行器已确认成功的编辑，`succeeded:true` 时才归一化并转为摘要 |

例如，应用在收到真实模型工具调用并开始执行时发送 `{event:"tool-start",sessionId,turnId,callId,toolName}`，执行器完成后再发送相同关联标识的 `tool-complete` 或 `tool-failed`；调用前后的真实生命周期分别发送 `turn-start` 与 `turn-end`／`interrupt`。只有实际执行器知道文件已经成功修改时，才附带 `succeeded:true` 和 `editedFiles`。桥不根据模型回复或未经确认的工具结果推断文件数，也不独立扫描工作目录。相同会话的并行工具与重复编辑计数由既有主进程事件所有者统一处理。

## 网页／PC 客户端的边界

2026 年 10 月 10 日检查的[豆包开放平台](https://open.doubao.com/)公开入口说明平台正在内测，提供 Skill、Plugin 与 OpenAPI 的入驻方向；公开页面没有提供本项目可直接安装的会话／工具生命周期 Hooks。[官方桌面下载页](https://www.doubao.com/download/desktop)介绍桌面助手和 AI 浏览器，但不能据此推断已有工作事件接口。方舟 API 可以供自己的应用使用，不能代表监听已登录的豆包网页／PC 客户端。

若另行实现用户授权的网页可见状态观察，只能根据页面确实显示的生成／停止控件报告“网页正在回答”或“已结束”；这属于界面观察设计推断，尚未在本项目接通，不能假装获得工具名称、成功编辑文件数或账户余额。没有采用提取 Cookie、逆向私有会话接口或复用客户端登录令牌的路线。

豆包助手 API 的 `doubao_app` 工具是一条不同路径，官方明确说明它不能与自定义函数或 MCP 工具混合调用，因此当前桥接方案使用普通模型 Function Calling。[豆包助手 API 官方说明](https://docs.volcengine.com/docs/ark/doubao-assistant?lang=zh)

扣子支持自定义 MCP，但官方当前说明仅支持 Streamable HTTP 和 SSE，不支持 STDIO。本项目此桥是本机文件和 IPC，不能把本机文件、命名管道或 `localhost` 地址直接填进扣子云端当成可达服务。[扣子官方 MCP 文档](https://docs.coze.cn/mcp)

扣子另有已发布工作流执行 API。若用户自己的本机应用调用该 API，可在本机调用前后分别发送开始、完成或失败状态；当前并未新增工作流运行器，也不记录扣子账号凭据。[扣子官方工作流执行 API](https://docs.coze.cn/developer_guides_workflow_run)

## 已学习的一手项目

以下星数为 2026 年 10 月 8 日读取 GitHub 页面时的快照，并非排名或效果保证。官方小型 SDK 与高星平台分别列出，未将 SDK 夸大为高星项目。

| 项目 | 星数快照 | 许可 | 学习内容与本次采用方式 |
| --- | --- | --- | --- |
| [coze-dev/coze-studio](https://github.com/coze-dev/coze-studio) | 约 21.7k | Apache-2.0 | 阅读官方说明与工作流目录，学习模型、插件、工作流以及 API 的职责分离；没有把整个平台搬进桌宠。 |
| [volcengine/veadk-python](https://github.com/volcengine/veadk-python) | 344 | Apache-2.0 | 阅读官方 `examples/02_custom_tools/main.py`，学习本机函数作为工具、由运行器执行的方式；本项目继续使用现有 Node IPC 客户端。 |
| [coze-dev/coze-js](https://github.com/coze-dev/coze-js) | 293 | MIT | 阅读官方 SDK 说明，确认聊天、实时接口和工作流应通过公开 SDK/API 进入，不能等同于监听消费端客户端。 |

本次新桥接代码自行实现，没有复制上述项目源文件；若后续实际迁入源代码，应另行保存对应版权和许可声明。VeADK 官方示例源码可见：[自定义工具示例](https://github.com/volcengine/veadk-python/blob/main/examples/02_custom_tools/main.py)。

研究中还发现第三方 `Fullstop000/doubao-cli` 声称接入原生豆包连接器，但其 README 明确标注依赖未公开的客户端内部接口，且面向 macOS。本 Windows 项目没有采用该路线，不把它称为官方支持。[第三方项目自行声明的实现边界](https://github.com/Fullstop000/doubao-cli)

## 桥接文件和验证

模块仅管理自己生成的单个桥接文件，不递归删除目录。相同配置重复生成不会改文件；上一版六状态桥只有逐字节匹配本项目原生成结果时才可原子更新。发现用户修改或其他不一致文件时，安装和移除都会保留原文件并报告冲突。目录和文件不可使用符号链接，客户端入口必须是外部 Node 可以读取的真实文件，不能位于 ASAR 内部。

六状态脚本明确传入 `remote: false`，结构化事件直接读取当前档案的发现文件并使用本机 `sendRequest`，环境变量中的远程配置不会改变其路由。传输只含工作状态、工具名称和会话／调用／文件摘要，不含聊天文本、模型密钥、原文件路径或额度。API 额度未知时不会根据动作事件推断剩余额度。导入脚本本身不会自动发送事件。

`apps/desktop/tests/agent-setup-doubao.test.ts` 通过真实 Node 子进程运行生成脚本，覆盖六种状态映射、结构化生命周期、调用关联、摘要传输、失败或未确认编辑不累计、未知字段／相对路径／超限输入拒绝、当前档案隔离、环境远程配置不生效、导入不触发事件、重复生成、用户修改文件保留、移除时保留同目录资料，以及 ASAR 内入口拒绝。这些本机测试不使用真实豆包账号或付费接口，不属于豆包网页／PC 或真实模型会话验收。
