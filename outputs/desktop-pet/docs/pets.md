---
description: Learn how OpenPets pet packages describe sprites, reactions, speech, motion, install paths, ZIP safety, and local authoring.
---

# Pets

A "pet" is an animated character that lives in a transparent desktop window and
reacts to agent activity. This doc covers the whole pet lifecycle: what a pet is
made of, how it gets onto disk, how reactions become animations, and how the
windows behave. For the catalog that ships pets see [Catalogs](/catalog);
for the command path that triggers reactions see [IPC and remote control](/ipc).

Source maps: `apps/desktop/src/codemap.md` (pet windows, controllers,
installation), `packages/install-pet/codemap.md` (standalone installer).

## 桌宠对话样式

控制中心的“设置 → 桌宠对话样式”可在本机自定义对话字体、10–20 号字号、字重和强调色，分别设置输入框与回答框的背景、文字颜色、背景透明度、圆角、边框和阴影。字体名称使用当前电脑已安装的字体；未安装时会回退到系统中文字体。设置对当前档案内的桌宠窗口生效，包括桌宠输入框、展开对话中的输入和消息，以及普通回答与提醒气泡。强调色用于输入聚焦和可用的发送按钮，按钮文字根据亮度选用深色或白色。

样式默认关闭，关闭后恢复原有外观。保存通过独立样式节点即时更新，保留当前输入草稿和对话记录。背景透明度不影响正文透明度；大字号输入和长回答在原有窗口边界内滚动。固定插件 HUD、表情与状态图标保持既有样式，错误与警告的语义颜色保留。

`pet-chat-appearance.ts` 统一校验有限的样式选项，`app-state.ts` 保存本地偏好；`pet-chat-appearance-styles.ts` 生成安全的本机 CSS。该设置不接受任意 CSS、远程字体或背景资源地址，也不修改共创网站的主题。

## What a pet is

### 独立视频与动画 WebP 动作

本地桌宠支持 V1/V2 图集，以及 `pet.json` 中声明 `mediaVersion: 1` 的独立动作包。动作文件可为包内相对子目录中的 `.mp4`、`.webm` 或动画 `.webp`，扩展名不区分大小写。只要求 `idle`；其余核心状态和自定义动作均可按作品实际提供，不强制补齐九种动画。文件夹、ZIP、导出、预览和桌宠窗口消费同一契约。附属文件可以留档，但只有声明的素材用于播放，桌宠包内代码不会执行。

```json
{
  "id": "my-video-pet",
  "displayName": "我的视频桌宠",
  "description": "独立动作媒体包",
  "mediaVersion": 1,
  "actions": {
    "idle": "idle.mp4",
    "running-right": "run-right.mp4",
    "running-left": "run-left.mp4",
    "waving": "wave.mp4",
    "jumping": "happy.mp4",
    "failed": "failed.mp4",
    "waiting": "waiting.mp4",
    "running": "working.mp4",
    "review": "thinking.mp4"
  },
  "background": { "mode": "chroma", "color": "#00ff00", "tolerance": 70 }
}
```

九核心状态对应待机、向右／向左走、招呼、庆祝、失败、等待、工作、思考。已有安静模式、点击随机候选和真实 AI 状态继续生效；水平翻转时补偿方向动作。`actions` 最多 128 项，编号支持 1–64 位小写英数、下划线和连字符；`actionDefinitions` 提供任意显示名称和分类，`stateBindings` 将核心状态及点击、拖拽、睡觉绑定到已声明的任意动作。未提供的状态回退 `idle`。例如：

```json
{
  "actions": { "idle": "media/idle.mp4", "greeting-custom": "media/greeting.mp4" },
  "actionDefinitions": { "greeting-custom": { "displayName": "轻轻问候", "category": "礼貌回应" } },
  "stateBindings": { "clicked": "greeting-custom" }
}
```

上述字段加入完整 `pet.json`；背景和作品身份字段仍按前例提供。控制中心“查看动作”列出本包全部动作及自定义名称、分类，不再只预览固定四种状态。

`actions` 另外可声明 `sleeping`、`clicked`、`dragged`，例如 `"sleeping": "sleeping.mp4"`；它们使用相同的文件、格式和去背校验，必须在清单中声明后再加入素材包。只含原九动作的旧包无需修改，缺少某个可选素材时保留原来的核心动作与方向补偿。

默认桌宠单击仍执行安静模式原有的随机候选选择；有 `clicked` 素材时展示六秒独立点击动画，然后回归。有 `dragged` 时从真实拖拽开始播放，松手、取消、导航或恢复清理结束；隐藏、暂停、锁屏等阻塞不继续展示交互动画。AI 工作期间单击不覆盖工作动作，拖拽结束恢复 AI 状态。睡眠仅跟随启用的 Virtual Pet 插件的实际养成快照，使用其 `sleptUntil` 到期时间，不把系统空闲当作睡眠。AI、手动选动作和点击可暂时覆盖睡眠，结束后在时限内恢复；插件唤醒、停用、损坏、重载或宿主停止清除投影。没有养成插件时仍按安静／随机模式运行，不产生自动睡眠行为。

视频静音循环；隐藏或暂停后停止视频与绘制定时器，显示时恢复。动作切换或气泡刷新保留聊天草稿、窗口与现有拖拽通道。动画 WebP 通过 Chromium `ImageDecoder` 按原帧延时播放，隐藏停止解码，切换释放上一帧和解码器；不把动画文件当图集裁切。控制中心画布只在进入可见区域时播放。

MP4 不提供透明通道，必须使用声明的单一纯色背景去背；背景颜色应避开角色的衣服、头发与装饰。背景为透明 WebM 或透明动画 WebP 时使用 `background: { "mode": "alpha" }`；首帧必须在素材边角保留透明区域，假透明矩形拒绝显示。去色按固定 192×208 画布、最多约 24 帧／秒处理，保持全身比例并底部对齐，避免逐帧处理原始 4K 像素。压缩过重或背景不统一会留下边缘颜色，素材制作时需要检查，单一去色不能恢复已经混入背景的服装细节。

文件路径允许包内相对子目录和中文文件名，拒绝地址、绝对路径、父目录穿越、链接、系统保留名和大小写冲突。每文件最多 256 MiB，本地 ZIP／文件夹导入及分享最多 1 GiB、1000 个文件。动画 WebP 要求 2–600 帧；单帧素材必须在 `staticActions` 显式列出对应动作，不能把静态图冒称动画。单帧最多 2048×2048 且可完整解码。视频导入检查容器文件头；Chromium 在播放时确认可解码，并拒绝超过 4096×4096 或超过五分钟的媒体。制作任务的“每条至少十秒”属于角色制作要求，导入器不会拒绝合法短视频。优先使用 H.264 MP4 或 VP8／VP9 WebM；未知编码不能只凭扩展名保证可播。

### 检测兼容性、保留原项目与显式素材转换

控制中心“检测并导入”与素材制作分开。ZIP、JSON 清单或完整文件夹先进行静态检查，再展示本机兼容、部分兼容、需要原宿主或无法直接兼容的报告；这不是运行测试。用户确认后，`original-projects.ts` 将所有原文件按原路径和原字节保存到当前档案的 `original-projects/<编号>/project`，不写入原目录，不改原清单。结构不兼容的安全包仍可留档；不安全路径、链接或坏 ZIP 在读取阶段拒绝。原项目卡独立于已安装桌宠，不将未运行的原宿主项目登记为本机桌宠。

本机完整原包读取沿用总量1 GiB、单文件512 MiB、10000文件的统一边界。ZIP条目逐个解压，通过事件逐块读取以减少大包的调度开销；每块及条目末尾仍校验实读长度。解压错误、提前关闭、越界或长度不符会终止导入。文件内容仍在内存中持有，较大包需要足够内存；路径、链接、碰撞和格式检查保持原有约束。

再次导入同一原包时，复用前核对托管副本的完整文件集合和每个文件字节。若用户已经编辑、增删文件或副本不能安全读取，明确拒绝本次安装，保留现有编辑内容；不会覆盖副本，也不会将其冒充本轮检测快照安装。

原生图集／媒体包通过已有清单和声明素材边界后，再调用原桌宠安装事务；插件同样沿原权限和 SDK 路径安装。其他宿主保留原逻辑文件，本机不支持的动作、AI 联动或配置操作显示不可用和原因。可以打开保留目录，或者选择原应用和独立入口。移除原项目只删除托管副本，不删除原文件或已安装的桌宠。

“独立运行”复用原项目自己的 Windows EXE 或可执行 JAR，不将原行为换成本系统引擎。托管包中通过 PE 结构和架构检查的程序，或带有效 `Main-Class` 与类文件的 JAR，可成为候选；多个入口必须先明确选择，选定路径必须在托管项目内。已识别 Shimeji 使用原 `com.group_finity.mascot.Main` 入口，随附 JNA 的诊断主类和 Java 运行时自身不当桌宠入口。点击后再次检查普通文件、链接、格式与声明运行环境，通过 `spawn` 的独立参数数组、`shell:false` 和程序所在目录启动，不执行清单命令、脚本或依赖安装。控制台隐藏，原应用窗口仍由原程序管理。返回的 PID 只证明系统已接受启动请求，不证明全部资源、模型或功能正常；desktop pet 不将其标为本机桌宠。

另选包外已经安装的原应用时，“独立运行”只启动该应用，不猜测各宿主的加载参数。返回 `projectStarted:false` 并提示手动导入保留目录，不能把它计作原作品已经运行。只有素材、XML、LPS、DLL 或源码时，没有独立入口的按钮显示不可用及原因。SDK 插件依赖本系统，默认不具有独立入口。旧档案不做全局迁移；管理列表动态重算入口和能力，应用路径失效时恢复不可用。

JAR 保留原字节，并沿用包内相对 `Class-Path` 库。扫描基线类的字节码版本计算最低 Java；预览特性、缺失本地库、远程依赖或超出保留项目的依赖明确不可用。可使用随附 `jre`／`runtime`、`JAVA_HOME`／`JRE_HOME`，或者通过“选择 Java”选择另外安装的完整 `bin/java.exe`／`bin/javaw.exe`。管理列表只读取声明，选择时及实际启动前用无 shell 的 `-version` 再确认版本；不会自动安装 Java。启动参数固定为 `['-jar', 原JAR完整路径]`，工作目录为原 JAR 所在目录，不从上传清单拼命令。子进程移除会注入 JVM 参数的环境变量，系统环境不改。此检查不模拟完整模块、原生库、预览特性或全部第三方依赖兼容性。

已知运行限制依据官方说明处理：[Shimeji](https://github.com/DalekCraft2/Shimeji-Desktop#how-to-start) 从原 JAR 或配套 EXE 启动，图片集由原程序的 `img` 目录加载；当前 1.0.22 要 Java 25。选择配套 EXE 时沿用相邻同名原 JAR 的官方 Java 启动方式，避免错误 JVM 被包装器选中。[VPet](https://github.com/LorisYounger/VPet#桌面端部署方法) 源码需要编译 Windows 项目并提供 Core 模组，仅有 LPS 不是程序。[AIRI](https://github.com/moeru-ai/airi#development) 源码需要自己的依赖和开发环境，不在这里执行 `pnpm`。VPet、AIRI 已安装的原应用可以由用户选择后单独启动，但没有核实的作品载入参数时仍需手动在原应用中导入；仅打开宿主不会计作作品已运行。声明 `.runtimeconfig.json` 的 EXE 还检查本机是否存在相同主次版本的 .NET 运行环境；此检查不模拟所有 roll-forward 策略，不会安装缺失运行时。

2026-10-09 的隔离实跑使用官方 [Shimeji 1.0.22 发布包](https://github.com/DalekCraft2/Shimeji-Desktop/releases/tag/bleedingedge) 和 [Temurin 25 便携 JRE](https://github.com/adoptium/temurin25-binaries/releases/tag/jdk-25.0.4.1%2B1)，下载与官方 SHA256 一致。完整导入 145 个原文件，缺 Java 时按钮不可用，选择 Java 25.0.4.1 后由原 JAR 实际创建单只 `mascot1`，日志确认原 XML 和 `Fall` 行为初始化，原窗口有响应且正常关闭；运行前后原文件逐字节相同。只配置隔离副本的官方虚拟窗口模式、单角色与禁止繁殖，不更改用户档案、PATH 或注册表；未验收所有姿势、脚本、桌面窗口交互或 AI 功能。没有为此另行安装 VPet 或 AIRI，不能将其静态入口检查称为实跑完成。

本地导入接受 `pet.json` 位于 ZIP／文件夹根部或唯一下载包装目录内。原 V1/V2 `pet.json`、`spritesheet.webp`、`submission.json`、许可、说明及扩展字段可一并导入；缺少可选简介时以名称作为默认简介。选定作品根目录外的仓库许可和说明归档到 `import-wrapper/`（名称冲突时加序号），不会因 GitHub 的下载目录层级丢失。安装仍经过原暂存、宠物锁和事务；不改用户偏好或应用档案。

Shimeji 默认保留原项目并标为部分兼容，不再自动改成当前格式。用户另行确认“制作素材副本”后，才将单角色 `conf/actions.xml` 和 PNG 姿势序列转换为 WebP。转换仅消费 `Stay`、`Move`、`Animate` 中无条件的 `Animation/Pose`，统一锚点，按原 `Duration` 的 25 fps 单位换算；单姿势超过十秒明确拒绝，不静默截短；单帧姿势如实标记静态。原项目、XML、PNG 和许可证不变，转换完成也不改变原项目的部分兼容报告。Java `Embedded`、条件表达式、`ActionReference`、繁殖、窗口交互和原生移动引擎不会执行，也不将这些跳过的行为记为已适配。XML 禁止 DTD／实体；图片、动作数、帧数与输出总大小均有界。真实样本与边界见[导入开放性研究](/research/import-openness-20261009)。

`pet-media-contract.ts` 是共享纯契约与方向／去色计算所有者，`pet-media-files.ts` 拥有有界文件验证。原安装事务与导出仍各自持有磁盘写入；`pet-media-player.mjs` 同时服务沙箱 preload 和控制中心，管理播放、帧与取消；`windows.ts` 沿已安装宠物协议提供经过白名单检查的媒体和字节范围响应。

A pet package is small and asset-driven:

- **`pet.json`** - metadata: `id`, `displayName`, `description`,
  `spritesheetPath`, and optional `category` / `subcategory` / `sourceUrl` /
  `xHandle`. (Catalog entries carry the same identity plus hosting URLs - see
  [Catalogs](/catalog).)
- **`spritesheet.webp`** - a grid of animation frames. Frames are at least
  `192x208`; thumbnails are derived from the spritesheet.

There are three sources a pet can come from at runtime:

1. **Built-in pet** (`built-in-pet.ts`) - the bundled V2 Hoodie Cat spritesheet
   that always works as a fallback, even offline with nothing installed. It uses
   the exact 8×11 atlas and row 0, column 6 neutral pose, including V2 idle gaze.
2. **Catalog pets** - downloaded from the public catalog and extracted into
   `userData/pets/{id}/`.
3. **Codex pets** - locally-developed pets imported from `~/.codex/pets/`
   (`codex-pets.ts`), the dev workflow for authoring a new pet before
   publishing it.

## Teams-owned pets

Teams adds a fourth explicit source kind, `team`. Persisted source ownership
selects the dedicated Team pet root versus the personal catalog/Codex roots; the
app never infers ownership from a directory. Team pets appear separately in
snapshots while remaining selectable. Team Packs remain pending and not current
until the current artifact's explicit first-install approval in the Teams route
succeeds; the approval displays requested permissions and network hosts and
cannot be bypassed by organization configuration. Immutable
organization/item/artifact/release references ensure reconciliation removes only
matching Team records. Rejected staged or activated Team installs roll back to
the last approved Team state, while personal catalog and Codex pets remain
isolated and are never overwritten or removed on ID collision. Removing the Team
default falls back to the built-in pet.

## Default pet vs agent pets

### 本地动作模式

“我的桌宠”统一配置宿主动作。新档案和缺少动作设置的旧档案默认开启安静模式：
未发生真实 AI 活动时保持 `idle` 待机，不自动散步、变换动作或冒生活闲聊。
单击从已勾选的随机候选中切换动画，存在不同候选时避开当前动画；六秒后回到待机。
关闭安静模式后每 45 秒自动选择一次动作。隐藏、拖拽、暂停、锁屏和休眠取消本轮
随机计时，恢复后重新计时；停止宿主清理全部动作定时器。

用户可保存最多 24 个命名动作，绑定现有 `idle`、`review`、`running`、`waiting`、
`waving`、`jumping`、`failed` 图集状态，并选择是否加入随机候选。动作库可为空，
此时保持待机。命名只改变本地动作标签，不能增加素材中不存在的图集行。
随机动作直接使用所绑定动画；基础待机固定使用 `idle`，不被 AI 的 `idle` 映射覆盖。
AI 状态到动画的自定义继续复用 `reaction-animation-mapping.ts`，保存或清空立即生效。

实际 AI 工作优先于随机动作：桌宠对话与实时语音沿用原活动／终态事件，电脑分析、
人设提炼和已授权文件分类沿用各操作的开始、结束和取消事实。保存 API 配置本身
不表示 AI 正在工作。有租约的本机 Agent 活动按有效会话独立聚合，
租约释放或过期撤销对应工作状态，有效心跳延长原动作的失联兜底。
Codex、ZCode 和豆包本机 Hooks 等没有租约的已验证请求共用匿名默认动作槽，
仍经过身份和参数校验，不推测其提供方或额度归属；工作动画持续到显式终态或
最后状态两分钟后的失联兜底，不再随短气泡消失。普通无反应消息不结束工作。
没有会话编号的多个 Hooks 无法独立识别，精确并发归属需使用租约接入。
经授权远程事件也有两分钟失联兜底；终态清工作状态，成功／失败可短暂显示用户所映射的完成／失败动作。
插件短暂反应和气泡仍保留，但不能遮住正在播放的随机动作或真实 AI 工作动画。

生活伙伴保留主动照顾、双击玩耍和拖拽反馈，其健康提醒默认关闭；虚拟宠物的照顾
提醒也默认关闭，不再用单击自动抚摸。用户显式开启的提醒仍可送达。详细插件约束
见[官方插件](/official-plugins#本地中文桌宠分支)。

本地中文分支在已安装个人桌宠详情提供“导出共创包”。主进程选择保存位置，
在该位置新建唯一文件夹；导出完整作品包及原有附件、扩展元数据，增加中文分享说明。原包已有 `SHARE.md`（含大小写变体）时，新说明使用不冲突的 `DESKTOP-PET-SHARE-N.md`，不覆盖原文件。安装所有者在宠物锁内确认身份与来源，文件导出模块复用
有界读取、元数据和图片校验，不读取完整用户档案。内置、团队及损坏的桌宠
不能通过此入口导出，已有文件夹不会覆盖。取消或关闭发起窗口会撤销未完成
的导出并清理本次新建目录。素材包可通过原本地文件夹导入入口安装，详情页
沿用原动画预览。原作者与许可信息随作品包保留，应用不把填写者声明当作已核实授权。见[本地共创分享](/companion-sharing)。

本地中文分支也提供“制作宠物”：选择已有 V2 WebP 动作图集，填写名称、简介
和新编号，检查四种动作预览后创建个人桌宠。图集需为 1536×2288、8×11 帧，
具有完全透明背景像素与可见内容。校验格式通过不能代替视觉质量检查。
宿主持有选图路径和摘要，创建时重新验证文件；选择凭证绑定窗口，十分钟后
过期。已有编号和本地素材目录均拒绝覆盖；取消在提交前回滚，成功后可从
原详情入口导出共创包。本地个人素材的预览以已安装文件为准，避免与远程
目录的同名编号混用。完整使用步骤见[本地共创分享](/companion-sharing)。

Two distinct window roles, two controllers:

- **Default pet** (`default-pet-controller.ts`) - the always-on companion shown
  when enabled. Persistent. Remembers its position per connected monitor and
  clamps it back into the visible work area after display changes. Shows
  transient reactions and status badges, and hosts the expandable in-pet attached
  Pet Assistant chat panel (`default-pet-chat.ts`).
  Not lease-bound.

The default carrier's compact composer and expanded chat are main-process-owned
states. In expanded chat, the panel anchors 10px directly above the pet sprite and
grows upward as content changes while the pet remains stationary at the bottom.
Unpinned floating bubbles are suppressed during full chat, while assistant activity
and reaction animations continue on the pet sprite without duplicating speech text.
On Linux, opening the compact composer makes the carrier focusable and
adds its composer rectangle to the input shape; closing it restores the passive
pet-only focus and shape. Its shared maximum geometry contract bounds multiline
input and error feedback so the Linux mask covers every compact control. The
expanded panel uses the same transition seam, with dynamic height tracking for
precise Linux hit-mask shapes.
- **Agent pets** (`agent-pet-controller.ts`) - shown on explicit agent request,
  routed by a **lease**. The first lease opens the window; the last lease
  released closes it. This lets several agents each get their own pet without
  colliding with the default pet. Agent pets roam with the same physics as
  the default pet (gravity + bounce, driven by `pet-roaming-controller.ts`).
  Session lifetime is tracked via PID liveness: when a client process
  terminates, the lease is released within ~5 s and the pet window closes.
  See the lease model in [IPC and remote control](/ipc).

Both are created by the `pet-window.ts` lifecycle facade as transparent, frameless,
always-on-top windows. `pet-window-interaction.ts` owns the per-window mouse
passthrough, drag, renderer lifecycle, recovery/watchdog, and IPC bridge driven
through `pet-preload.cjs`.

手动拖拽由 `pet-drag-gesture.ts` 区分按下与实际拖动：屏幕坐标位移超过
4 像素后才发送拖拽开始，开始事件保留原始按下坐标，随后发送当前位置。
普通点击和阈值内抖动不发送拖拽开始／结束，避免生活伙伴误说拖起或落地台词。
真实拖动结束后短暂抑制单击；即使拖出后移回起点，也不会触发抚摸。
松手、失焦、隐藏及指针取消共用结束路径；漏掉松手事件时，后续无按键移动也会清理旧手势。
主进程在导航、加载失败或鼠标恢复时，也为实际进行中的拖拽发布一次结束；
迟到的渲染器松手不重复通知，防止插件在页面重载后一直认为用户仍在拖动。
Wayland 原生拖动继续沿用原来的系统窗口移动路径。

Experimental multi-pet LAN mode adds a third, isolated controller for visiting
pets. Windows are keyed by LAN owner host rather than pet ID, so they do not
collide with lease-managed agent pets or with another visitor using the same
pet package. Unavailable remote assets are logged and skipped safely.
Fresh coarse work activity can temporarily render a built-in return-to-work
line with the visitor's `running` animation; after the dash delay, coordinator
state returns that visitor to its owner.

While a pet is click-through it only learns that the cursor is over it through
*forwarded* mouse events (`setIgnoreMouseEvents(true, { forward: true })`), which
Electron delivers on macOS and Windows but not on Linux (Linux pet windows are
kept interactive instead). Both compositors can silently stop forwarding - macOS
across Space switches, display sleep, and fullscreen transitions; Windows after
rapid pet reloads and fullscreen sweeps - which would leave the pet stuck
click-through and impossible to grab. A cursor-probe watchdog in
`pet-window-interaction.ts` re-arms forwarding from the main process
(`screen.getCursorScreenPoint()`), which keeps working even when forwarding is
dead. The platform predicates live in `mouse-forwarding.ts`.

桌宠右键仅有“打开控制中心、动作、隐藏、对话、大小”五项。动作子菜单读取
本地已保存的动作名称，并保留安静模式开关和自定义动作入口；播放沿用唯一
动作宿主，真实 AI 忙碌时不覆盖工作动画。插件操作在控制中心或对话中使用，
不再加入桌宠右键菜单。

单次右键等待 300 毫秒后显示菜单，等待期间同一位置附近的第二次右键取消
菜单并打开桌宠输入框；左键双击和菜单“对话”也打开该输入框。它们复用
`default-pet-chat.ts` 的原会话和草稿，已展开对话时切回输入，不创建另一位助手。
隐藏、导航或关闭会撤销待打开的菜单。输入框可展开查看同一对话历史。

“大小”使用设置中的全局倍率，当前项勾选：最小 0.35、小 0.5、中 0.75、
大 1、最大 1.25。修改后同时保存桌宠和 HUD 的大小，并刷新默认及其他桌宠。
素材的既有镜像偏好继续由显示模块读取；右键不再提供镜像操作。

## Reactions → animations → speech

A **reaction** is a categorical pet state (thinking, editing, testing, waiting
for permission, success, error, idle, …). The rendering pipeline turns a
reaction into something visible:

1. `reaction-animation-mapping.ts` resolves a reaction to a **sprite animation
   state** (`resolveReactionSpriteState`). This mapping is **user-configurable** - users can override which animation a reaction plays, and overrides persist in
   app state. The selectable animation states include idle, review, running,
   waiting, waving, jumping, and failed; `waving` covers attention/notification
   style reactions.
2. `reaction-messages.ts` picks a **speech message** from the pool for that
   reaction; `i18n/reactions/` provides the localized pools so speech matches the
   active locale (see [Internationalization](/i18n)).
3. `pet-window.ts` renders the chosen animation via CSS sprites or a bounded local media canvas, and
   shows speech bubbles, alert indicators, pinned HUDs, and status badges as
   requested. The sprite is sized by the pet scale preference; the pinned
   plugin HUD is sized by the separate HUD scale preference (`hudScale`, in
   Settings → General next to pet scale), so HUD readability is independent of
   pet size. The transient display (bubble) expires after a few seconds while
   a busy status badge (`thinking`/`working`/`editing`/`running`/`testing`/
   `waiting`) survives much longer; when the display reaction is gone, a badge
   that resolves to a looping animation (`resolveEffectiveSpriteState`) keeps
   the pet visibly animated, while a badge that resolves to a finite one-shot
   (`waving`/`success`/`error`/`celebrating`) falls back to idle so terminal
   reactions stay bounded.

The waiting animation cycle is a global preference in Control Center → Settings
→ Reactions. **Normal** keeps the default `1010` ms cycle and **Relaxed** uses
`2200` ms. The renderer derives a fresh sprite-state table for the selected
duration instead of mutating `defaultPetSprite.states`, so all other reaction
mappings and animation durations stay unchanged. The setting applies to both
built-in and installed pets; plugin-provided sprite overrides continue to use
their own FPS and loop settings. Changing the preference refreshes open default
and agent pet windows, and the duration is part of their render identity so
already-open windows reload their CSS immediately. The Settings preview uses the
same configured duration.

This separation - mapping vs message vs render - is deliberate: agents and
plugins speak in *reactions*, and the host owns *how* those look and sound.

## Motion

The motion engine (`pet-motion-engine.ts`) drives all pet windows through a
single shared ticker (≈60 fps). Each registered pet gets its own `MotionState`
entry in a `Map<petHandleId, MotionState>`, but all pets share one `setInterval`
so positions advance in lock-step with one `getAllDisplaysCached()` read per
tick.

`pet-roaming-controller.ts` is the host-side orchestrator: it registers every
live pet (default and agent) with the engine and applies the active roaming
configuration (gravity + bounce). When a pet is despawned the controller
unregisters it before the window is destroyed, so the shared ticker never
touches a closed window.

Plugin-driven movement (`plugin-sdk-routes.ts` → `plugin-pet-registry.ts`) feeds
target vectors and physics overrides through the engine's public API
(`motionMoveTo`, `motionSetPhysics`, `motionSetFollowCursor`). The engine is the
**sole continuous position writer**; all per-pet step loops were eliminated to
prevent jitter from competing writers. Sub-pixel fractional accumulators
(`fracX` / `fracY` in `MotionState`) ensure smooth movement at any tick rate.
Gravity and per-tick containment use the live native pet-window bounds, not only
the nominal canvas dimensions, so platform-specific window chrome cannot place
the window below a display work area.
See [Plugin platform](/plugins) and [Plugin SDK v3](/sdk) for the plugin side.

### Display containment and cross-display roaming

`display.ts` owns all screen-geometry decisions. Per-tick clamping in
`clampPosition()` follows a strict priority order:

1. **Confinement** - if a pet has a terminal-bounds assignment (see below), it
   is always snapped into those bounds regardless of any other flag.
2. **Cross-display roaming** (default **off**) - if the
   `petCrossDisplayEnabled` preference is on, `clampToNearestDisplayIfOffscreen`
   is used: the pet is left alone while its bottom-center anchor overlaps any
   display's work area, and is only snapped to the nearest display edge when
   fully off-screen. This lets pets cross seams between adjacent displays
   freely.
3. **Legacy single-display mode** - if `petCrossDisplayEnabled` is off, the
   original `clampToVisibleWorkArea` behavior is used (pet is clamped to the
   display nearest its geometric center).

**Wide gaps between non-adjacent displays:** a pet moving toward an empty
region will stick at the edge of its current display and cannot teleport across
a gap wider than the pet. This is expected behavior and is by design.

**Topology changes** (monitor plugged/unplugged, resolution changed) are
coordinated by `pet-display-coordinator.ts`. It invalidates the display cache
immediately, debounces each native display-event reason independently, and fans
out reclamping to the default pet, agent pets, LAN visitors, and plugin pets.
Pets on a removed display are snapped to the nearest remaining display; pets on
surviving displays are left untouched. The coordinator also owns immediate and
delayed recovery of default-pet mouse interop after power resume.

The `petCrossDisplayEnabled` toggle lives in Control Center → Settings, under
the **Movement** section, and is a global flag (not per-pet). It is shown
disabled with explanatory helper text until a movement plugin - one granted the
`pet:move` permission, such as Walkabout - is enabled, since cross-display
roaming has no effect without a mover driving motion. Confinement remains
strictly per-pet and always takes priority regardless of the cross-display flag.

### Linux & Wayland

All pet motion depends on the app being able to **programmatically position a
top-level window** and keep it **always-on-top** (`setPosition`/`setBounds` plus
`setAlwaysOnTop`). Native Wayland deliberately forbids clients from positioning
or restacking their own toplevels, so under a native Wayland backend every
position write is silently ignored by the compositor: gravity, walkabout,
follow-cursor, cross-display roaming, drag, and z-order all become no-ops even
though the motion engine keeps computing new coordinates. (This is the root
cause behind "pet doesn't move / gravity doesn't work" reports on KDE/KWin
Wayland.)

To keep motion working, OpenPets forces the Linux Ozone backend to **x11
(XWayland)**, where these window operations are honored. Drag selects its path
at window creation via `isEffectiveWaylandBackend()` in `pet-window.ts` (which
delegates the pure decision to `computeEffectiveWaylandBackend()` in
`wayland-backend.ts`): under the forced x11 backend it returns `false` and the
working `setBounds` drag path is used. The backend-forcing itself lives in `main.ts` and is documented in
[Desktop app](/desktop#linux-display-backend-ozonewayland), including the
`OPENPETS_ALLOW_WAYLAND=1` opt-out (which restores native Wayland and therefore
disables the motion/drag/always-on-top behavior above, with a one-time startup
warning).

## Installation

Two install paths exist; they share the same safety rules.

### Through the running app (preferred)

`pet-installation.ts`:

1. `getCatalogPet()` resolves the pet from the catalog (`catalog.ts`).
2. `downloadPetZip()` streams the ZIP from `zip.openpets.dev`, validating magic
   bytes.
3. `extractPetZip()` extracts with `yauzl` under strict entry validation
   (`zip-safety.ts`): no path traversal, no symlinks, case-collision detection,
   size/file-count caps.
4. Extraction is atomic (temp dir → rename) into `userData/pets/{id}/`, and
   `installPetState()` records it in app state.

The stable journal/schema, naming, and recovery-classification protocol lives in
`pet-install-transaction-protocol.ts`; `pet-install-transaction.ts` remains the
filesystem and side-effect orchestrator. The final promotion has a private per-pet journal under
`userData/pets/.openpets-pet-transactions/`. Journal records are written to a
private temporary marker and renamed into place. On process interruption,
startup recovery verifies the actual canonical final/candidate/backup
topology before either restoring the pre-install assets or cleaning a proven
committed install; it does not trust a stale phase by itself. A state-mutating
record whose relationship to app state cannot be proven is retained, warned
about, and fences operations for that same pet while other pet IDs continue to
work. Explicitly uncertain state callbacks likewise preserve the assets for
manual/retry recovery. Transaction directory names carry a trusted pet ID, so
malformed, contradictory, or duplicate same-pet transaction artifacts are
preserved and fence only that pet; another ID can still recover. Pre-metadata
staging candidates have a private ownership marker established before their
directory is created. Recovery removes only candidates validated by that
marker, leaving legacy or unmarked dot directories untouched. The marker is
handed off to the per-ID journal before it is deleted, so an interruption
cannot leave a staged candidate without an owner. A trusted empty transaction
directory is treated as completed cleanup, while directories with unknown
entries are preserved. This journal protocol does not fsync files or directory
metadata, so it does not claim power-loss durability; it only provides
process-interruption recovery and protection when cross-resource state proof is
missing.
The state mutation callback must return synchronously. A returned thenable is
recorded as an explicit uncertain outcome, and recovery never assumes it can
undo asynchronous state side effects. ZIP imports use a separate private
pre-metadata staging name, so the valid pet ID `local` remains independently
fenced when it is the actual imported pet.

Local pet packages can also be installed through the running app via the CLI:
- `openpets install --from-zip <path-to-zip>`
- `openpets install --from-folder <path-to-folder>`

These send a `pets.install-local` request to the running app over IPC, which validates and imports the local zip file or folder.
The CLI resolves relative paths before sending them; the IPC/client protocol
itself requires an absolute path plus an explicit `zip` or `folder` kind.

### Standalone installer (`install-pet`)

`packages/install-pet/` is a standalone CLI (`install-pet <pet-id>` or
`npx -y install-pet <pet-id>`). It prefers the running app via
`@open-pets/client` and **falls back** to a direct download + extract when the
app is unavailable. Direct mode uses a lock file (`.install-pet.lock`, 10-min
stale timeout) to prevent concurrent installs, the same ZIP safety limits (50MB
download / 200MB extracted / 500 files / 100MB per file), and the same
platform-specific user-data path resolution. This is what powers
"`npx install-pet <id>`" without requiring the app to be open.

### ZIP safety (shared)

Both paths enforce: HTTPS-only catalog/ZIP hosts on an allowlist, no encrypted
entries, only stored/deflate compression, valid Unix modes, required files
(`pet.json` + `spritesheet.webp`), and atomic extraction with private
permissions. The pet `id` must match `^[a-z0-9][a-z0-9_-]{0,63}$` and cannot be
`builtin`.

## Codex pets (local authoring)

`codex-pets.ts` imports pets from `~/.codex/pets/` with the same metadata
validation, so an author can iterate on a pet locally before it is published to
the catalog. The publishing path (zipping, thumbnailing, uploading to R2,
regenerating the catalog) lives in `web/`'s sync scripts. The contract those
scripts produce is in [Catalogs](/catalog), with release checks in
[Testing and validation](/testing-and-validation).

### Codex sprite versions

The bundled default Hoodie Cat uses the same V2 atlas contract as imported
Codex V2 pets. Its public `builtin` identity and `Hoodie Cat` display name stay
unchanged; only the desktop asset and runtime layout have been upgraded.

OpenPets preserves the original Codex V1 package shape: an unmarked
`spritesheet.webp` with the nine standard `192×208` animation rows. It also
imports V2 only when `pet.json` has `"spriteVersionNumber": 2` and its source
asset is a fully decodable, single-image, alpha-enabled WebP with the exact `1536×2288`
(`8×11`) grid. Any other supplied version marker, a non-WebP/non-alpha image,
or a mismatched V2 atlas is rejected before the atomic import writes anything.

The V2 adapter uses the unchanged standard rows 0–8 for OpenPets reactions and
horizontal run motion, and uses V2's neutral pose (row 0, column 6) whenever
the existing runtime is idle. This matches the released
[Malou V2 manifest](https://raw.githubusercontent.com/mySebbe/malou-codex-pet/v2.0.0/dist/malou/pet.json)
and its [8×11 atlas specification](https://raw.githubusercontent.com/mySebbe/malou-codex-pet/v2.0.0/metadata/atlas.json).

The Control Center carries that sprite layout with Codex-source and installed
pet entries. Its Pets, Dashboard, and Settings previews therefore scale V1
atlases as 8×9, V2 atlases as 8×11, and show the static V2 neutral cell instead
of treating the extra rows as part of a nine-row animation.

动作设置快照从当前桌宠自己的图集布局组合播放时序，不继承内置 V2 的静止帧。
V1 待机预览播放原六帧；V2 才使用其自身声明的 row 0、column 6 静止姿态。
该快照由 `reaction-animation-mapping.ts` 的纯组合函数提供给 `windows.ts`。

At startup, OpenPets also performs an idempotent repair for Codex V2 imports
created by older releases that copied the 11-row atlas but dropped the version
marker from the installed `pet.json`. It restores only that marker, and only
when the persisted source still points to the expected canonical Codex pet,
the source manifest is valid V2, the local atlas passes the exact V2
`1536×2288` contract, and SHA-256 hashes of the source and local atlas bytes
match. Already-current and unverifiable imports are skipped; per-pet results,
repaired/skipped counts, and skip reasons are logged, and a migration problem
never prevents the desktop app from starting.

V2's sixteen look-direction cells (rows 9–10) are retained in the imported
atlas and selected while an installed V2 pet is visually idle. OpenPets samples
the global cursor around the pet carrier's bottom-center anchor, quantizes the
direction into sixteen clockwise 22.5° sectors, and returns to the neutral pose
inside a small dead zone. Reactions, movement, dragging, plugin sprite
overrides, and paused pets suspend gaze; V1 pets retain their existing idle
behavior. Horizontal flips compensate the selected atlas cell so the pet still
looks toward the cursor. Control Center → Settings → General exposes the
persisted **Idle cursor gaze** setting, enabled by default; disabling it keeps
all V2 pets on the neutral idle pose and stops the shared ticker, without
changing reactions, movement, or V1 behavior. When enabled, cursor movement
drives a short glance: the current direction is held while the cursor is moving
and for about 1.2 seconds afterward, then eligible idle V2 pets return to
neutral. No additional blink frames are used.

Catalog V2 entries may declare the same version with an exact numeric
`spriteVersionNumber: 2`; the desktop carries that marker into Pets previews so
their 8×11 layout is resolved consistently with imported/local V2 pets. Older
catalog entries omit the marker and retain V1 compatibility.

Codex integration remains import-only: OpenPets does not write installed or
catalog pets back into `~/.codex/pets/`.

## Image protocols & CSP

Pet images are served to renderers through internal protocols
(`openpets-codex:`, `openpets-installed:`, `openpets-pet-preview:`). Any new
protocol or image source must be added to the CSP in **both**
`apps/desktop/vite.config.ts` and `apps/desktop/src/renderer/index.html`, or
images silently fall back to the default pet. This is the single most common
"why is my pet showing the wrong sprite" bug - see [Desktop app](/desktop).

## Where to look first

| If you're touching… | Start in |
|---------------------|----------|
| How a reaction looks | `reaction-animation-mapping.ts` |
| What a pet says | `reaction-messages.ts` + `i18n/reactions/` |
| Window behavior (drag, click-through, horizontal flip) | `pet-window.ts`, `pet-window-interaction.ts`, `pet-preload.cjs` |
| Default vs agent visibility | `default-pet-controller.ts`, `agent-pet-controller.ts` |
| Installing / extracting | `pet-installation.ts`, `zip-safety.ts` |
| Standalone install | `packages/install-pet/` |
| Local pet authoring | `codex-pets.ts` |
| Movement | `pet-motion-engine.ts` |
| Display containment / cross-screen | `display.ts`, `confinement-manager.ts` |
| Topology-change reclamp | `pet-display-coordinator.ts` → default and pet-controller reclamp leaves |
