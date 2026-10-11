---
description: 独立人设工作室的全局 Markdown、完整人物 Skill、自动对话应用与文本提炼边界。
---

# 人设个性与文本提炼

本地人物接入由 `companion-persona.ts` 持有文档、托管 Skill 目录和启用状态，`companion-persona-skill.ts` 有界读取目录与明确引用，纯界面类型在 `companion-persona-types.ts`。
现有 `app-state.preferences.personality` 继续持有昵称、语气、风格、称呼和篇幅五项偏好，
`PetAssistantMemory` 继续持有会话上下文；不新建第二个 assistant 或复制历史存储。

## 交互与数据

控制中心的“人设个性”是独立页面，路由为 `persona`。顶部“导入已蒸馏 Skill”直接按蒸馏方式导入已准备好的 SKILL.md、Markdown 或 UTF-8 纯文本。它有两种编写方式：

- 全局 Markdown（`global-md`）：直接编写、编辑或导入人物 Markdown／`SKILL.md`。
- 蒸馏人设（`distilled-md`）：粘贴自己已经蒸馏好的文本，或选择已配置且就绪的文字 AI 来源，从提供的文章、对话、自述中提炼草稿。支持现有 OpenAI 兼容协议、Anthropic 等文字来源，不限于 Codex。

两种方式共用一份已保存人设。切换方式、编辑和生成均不改变保存状态。生成结果只填入编辑器；用户审阅、修改后点击“保存人设”，保存保留当前启用开关；初次编写并保存默认停用，再明确勾选“启用已保存人设”。用户主动导入人物文档或完整 Skill 时自动启用，后续每轮桌宠对话都应用，无需人物名或关键词触发。

“导入完整 Skill 文件夹”选择根目录含 `SKILL.md` 的文件夹，完整保留 `manifest.json`、`references/`、空子目录和其他素材到当前档案的 `skills/<文件夹名>/`。同名导入创建独立副本，不覆盖已有文件。文件最多 256 个、目录项目最多 512 个、深度最多 12 层、单文件最多 4 MiB、完整目录最多 16 MiB；读取时检查实际文件字节，拒绝链接、联接和异常文件。脚本可作为原始资料保留，但永不执行，manifest 中的工具或权限声明不会注册任何真实能力。

人物页显示本应用托管 skills 目录并提供“打开 skills 目录”“扫描并刷新 Skill”。用户也可直接将 Denia-skill 等完整文件夹复制到此处后扫描；不使用或修改系统、Codex 的全局 skills。只有一个有效候选且尚未保存人设时自动启用；多个候选需要明确选择，已有选中人物不会被其他候选抢占。刷新已停用的人物保持停用，明确“启用所选 Skill”才启用。

完整 Skill 只展开 `SKILL.md` 明确提到的 Markdown 链接、行内路径或 references 文本路径，限目录内 `.md`、`.markdown`、`.txt`、`.json`。去重后加载相应 UTF-8 文本，缺失、越界或超限时明确拒绝，保留现有人设；未引用文件仍完整保留但不无差别发送给模型。单文档导入不自动读取旁边的文件或抓取网络，实际人设遵从仍由用户所选模型决定。

主进程通过原生对话框选择用户提供的 `SKILL.md` 或角色 `.md`／`.markdown`／`.txt` 文件，
再调用 `CompanionPersonaService.importFile`。文件必须为本机普通文件，拒绝网络、设备、备用数据流、
符号链接和目录联接路径。UTF-8 严格解码，允许 UTF-8 BOM；无效编码、非文本控制字符和空内容拒绝。
读取最多 64 KiB 加一个越界检测字节，不因文件在读取期间增长而无界分配内存。

文档经过完整 JSON 序列化和信任边界说明后，普通人物风格提示词最多 8 KiB，完整 Skill 与明确引用资料合计最多 48 KiB；宿主 composition 上限为 64 KiB，给人格字段与固定规则留出空间。
超过时明确要求精简，保留原人物，不截断。导入不会解释 YAML 中的 `tools`、`permissionMode`、`model` 等键，不执行脚本，不抓取网址。

导入成功自动启用。主进程的现有 `compositionProvider` 在每轮开始时把 `getPromptStyle()` 加到
`personalityStyle`；该段作为受限人物资料，不能改动真实工具清单、权限或执行结果。
外围宿主规则仍在最前，实际工具权限和结果仍由原有能力执行器核验。
模型对人物风格的遵从程度取决于所选模型；提示词说明不替代主进程权限边界。

## 启停与存档

已启用人设适用于本桌宠的文字对话以及协同分析中的各个已选来源和汇总请求。
启用会将完整人物正文发送给这些来源，应只保存准备交给它们的资料。
它不会改变未接入本桌宠的外部 AI 应用。停用影响后续轮次或任务，已经开始的对话和任务保持开始时捕获的人设。
正文不加入单独会话历史索引、普通状态监测或日志。

服务在主进程指定的 `userdata/companion-persona.json` 保存 `version: 3`、编写方式、人物正文、导入时间、文档类别和启用状态；目录 Skill 另存目录名、文件清单和已加载引用文本，原始完整目录保留在 `skills/`。
旧 v1 档案缺少方式字段时按 `global-md` 读取；v1/v2 均保留原启用状态，下次明确保存或修改启用状态时写入 v3。
使用临时文件加替换提交，保存失败保留已有内存状态。损坏、未知版本或越界存档读取失败时停用并展示
无路径的错误说明，不自动覆盖损坏原件。

`getSnapshot()` 仅返回快照版本、`hasPersona`、`enabled`、编写方式、文档类别、正文字节数、提示词字节数、导入时间及错误说明。
它不返回原路径、正文或 provider 凭据，只另提供 Skill 名称、文件数和加载引用数。授权工作室通过独立 `getPersonaDocument()` IPC 读取
`getDocument()` 返回的文档副本，用于编辑已保存正文；普通监测仍无正文。
`getPromptStyle()` 是主进程内部的完整提示词接口，不应当作为日志输出接口。

导出仅向用户在原生保存对话框选中的新 Markdown 文件写人物正文，不覆盖已有文件，
不导出模型连接配置或凭据，也不复制相对引用的其他文件。编辑器保存正文会成为普通 Markdown 人设；完整 Skill 仍在托管目录，可重新扫描选用。清除仅清除本地人物设置，
不删除用户原始导入文件或托管 Skill，不改动既有五字段人格或聊天历史。

## 角色卡与可移植人物配置

人物页现在也接收 Tavern V1、Character Card V2/V3 的 JSON 或标准 PNG 角色卡，以及 LobeChat 单个 agent JSON。AIRI 的标准 V3 导出沿相同格式读取。现有 Markdown、纯文本、完整 Skill、默认每轮自动启用、停用和会话开始时捕获人设等行为继续使用原所有者。模型连接与外部 AI 工作监测不由卡片改变。

角色卡编辑按名称、身份背景、性格、场景、例句、角色表达要求、回复补充要求和开场白风格示例分开，仍允许编辑完整 JSON。LobeChat 只编辑其真实拥有的 meta.title、meta.description 与 config.systemRole。已知字段编辑保留未知扩展、素材清单、世界书、作者和版本，不重新拼装丢字段的简化卡。作者备注只在人物页展示，永不作为角色提示词发送。人物身份不再要求只有一段通用 Markdown。

Character Card 的 {{char}}、<char>、<bot> 使用 nickname（若有）或名称，{{user}}、<user> 使用“用户”。{{original}} 不会把原宿主规则注入卡片。卡片系统提示与后置说明作为受限人物表达资料，不能替换本应用宿主规则，亦不改变真实聊天历史位置。开场白只作为说话风格例句，不自动新建一条真实消息或每轮问候。外部平台宏、深度插入、插件和工具没有转成实际执行能力。

启用的世界书常驻条目可以作为背景资料。关键词、正则、递归触发和消息深度目前没有对应引擎，原字段保留，界面明确提示限制；不把全部条件条目无差别塞入每轮对话。卡片素材 URI 只保留，不自动下载或用来替换桌宠。普通 PNG 立绘没有角色元数据时明确拒绝；标准 PNG 读取 tEXt 中 chara／ccv3 的 Base64 UTF-8 JSON，同时存在时优先 V3。导入仅保存人物 JSON，原 PNG 不修改，图片画面不通过角色卡 JSON 导出。

单个角色 JSON 上限 256 KiB，PNG 容器上限 32 MiB，容器内人物 JSON 仍上限 256 KiB。完整人物字段转换与信任边界序列化后不得超过 48 KiB 提示词；拒绝超限时保留已启用人物，不静默截断。Markdown 原 64 KiB 文件／8 KiB 提示词和完整 Skill 48 KiB 提示词限制保持不变。为保留 JSON 原字段，人物存档有界读取上限调整为 1 MiB。PNG 校验元数据块 CRC、Base64、UTF-8、边界和重复键，不执行图像、网络或脚本。

角色卡可在原生保存对话框选择 JSON，完整导出卡片的原字段；选择 Markdown 则只导出本应用已适配的人物表达内容，不含作者备注或未执行扩展。原 Markdown 导出行为保持，已有同名文件不覆盖。正文编辑保存保留当前启用开关；首次编写保存默认停用，明确启用后再参与下一轮。用户主动导入卡片则与主动导入 Skill 一样自动启用。

配置借鉴的官方资料（2026年10月11日读取，未复制项目代码或人物素材）：

- [SillyTavern](https://github.com/SillyTavern/SillyTavern) 约 34.3k stars；[官方角色设计](https://docs.sillytavern.app/usage/core-concepts/characterdesign/)将人物身份、性格、场景、例句和作者信息分开；[PNG 元数据读取实现](https://github.com/SillyTavern/SillyTavern/blob/release/src/character-card-parser.js)明确 V3 优先。
- [AIRI](https://github.com/moeru-ai/airi) 约 50.3k stars；[官方手册](https://airi.moeru.ai/docs/en/docs/manual/tamagotchi/setup-and-use/)将标准角色卡与 Chat/Vision/Speech 模型模块分离，作者备注不参与回复。这里沿用人物与模型分离的配置方式，不把 AIRI ACT 或动作扩展当成本应用已执行的功能。
- [LobeHub](https://github.com/lobehub/lobehub) 约 83.1k stars；[官方 agent 模板](https://github.com/lobehub/lobe-chat-agents/blob/main/agent-template-full.json)以 config.systemRole 配置表达、meta 保存标题简介。这里只适配人物核心字段，不导入其连接凭据、模型配置和插件。
- [Character Card V2](https://github.com/malfoyslastname/character-card-spec-v2)、[V3 规范](https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md)：读取公开格式契约，保留原扩展，明确本宿主支持的核心内容与未执行功能。

## 环境能力检测

`CompanionAiHost.getPersonaEnvironment()` 根据本机现有配置、凭据是否就绪和实际聊天控制器报告当前文字 AI 是否可用于桌宠对话；不发送付费探测请求。宿主人设提示词和本地目录 Skill 加载已实现，默认每轮注入。模型本身能否忠实角色扮演需实际对话确认，不能把适配器支持 system 提示词当成质量保证。

目录解析由本应用完成，外部 AI 只接收受限人设文本。外部 Codex、ZCode、DeepSeek Harness、豆包等工具是否原生加载 `SKILL.md` 显示“未检测”，不因接入 Hooks/MCP 而宣称平台支持目录 Skill。托管目录完整路径只由授权人物设置页单独请求，不加入普通监测快照或日志。

## AI 辅助提炼与监测

`persona-distillation.ts` 使用原提供方服务、凭据读取和固定操作快照发送名称、侧重点与用户粘贴的材料；不新建 HTTP 或凭据所有者。
材料最多 32 KiB，名称最多 120 字符，侧重点最多 1000 字符；草稿必须通过相同的完整 8 KiB 人设提示词限制。

生成请求没有工具，不读取材料里的本地文件引用、不自动抓网页，也不执行文档指令。一个窗口同时只能生成一次；支持取消、关闭窗口取消与两分钟总时限，迟到结果不交付到编辑器。材料和草稿不会自动存档或启用；取消不覆盖已保存人设或编辑中的正文。

生成时，对应来源的监测状态有实际任务证据，显示忙碌；结束后去掉在途证据。提供方响应返回的 input/output token 数值进入该来源实际用量，未知计数不会补成零。这些生成状态和用量只在内存中保存。

这里的“蒸馏”是人物风格文本提炼，不训练模型权重，也不实现语音克隆、完整 Agent skill 执行或任意格式的完整 Agent 执行；上述标准角色卡适配只覆盖明确列出的字段与格式。参考项目、固定源码阅读范围和未知边界见项目上层 `outputs/人设蒸馏项目学习.md`。

## 验证

`tests/companion-persona.test.ts` 验证真实导入／导出、严格 UTF-8、读取和提示词大小边界、
关闭后重新启用、重启存档、联接路径拒绝、无脚本／相对引用执行和快照不泄露正文。
测试还用现有 `PetAssistantService` 和本地模型替身验证宿主规则保留、人物不能增加工具、
未知工具请求不会执行、模型假完成台词不能覆盖实际结果。`companion-persona-skill.test.ts` 另验证完整目录保留、明确引用去重、无需关键词的连续两轮应用、重启副本、越界/联接拒绝、扫描选择与引用容量边界。环境与 IPC 回归测试验证配置未就绪、原生 Skill 未检测、目录选择、授权和关窗后的迟到选择不生效。测试不调用真实付费模型。
提炼与 IPC 测试还覆盖草稿不保存、来源校验、输入输出边界、实际用量、取消、窗口归属及迟到响应。
`smoke-persona-provider.mjs` 用隔离档案、真实工作室和本机 HTTP 来源验收界面到适配器链路；这不代表已经连接用户的远程账号。

角色卡回归另见 `tests/companion-character-card.test.ts`：真实文件导入、V1/V2/V3、PNG 优先级/损坏与普通图拒绝、作者备注隔离、常驻和条件世界书、JSON 编辑后扩展往返、重启、失败保留人物，以及 LobeChat 模型与插件不接入。
