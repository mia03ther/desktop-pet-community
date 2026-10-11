# apps/desktop/src/renderer/src/

## 当前职责

桌宠媒体详情按 `actions` 展示全部自定义动作、显示名称与分类。桌宠和插件导入均先进行静态兼容性检测，再确认导入；完整原项目单独管理。权限确认、归一化、素材读取和磁盘写入仍属于原主进程所有者。

独立桌宠工作室的 React 控制中心。主入口 main.tsx 只挂载 studio/StudioApp；不加载旧 styles.css、旧 Dashboard 或 TeamsView。组件通过窄 preload 获取授权数据，不直接访问文件、凭据或系统命令。

## 页面与所有者

- studio/StudioApp.tsx：贯穿全宽的深灰顶栏使用用户选定的D 款透明头像标识与 desktop pet 名称，由 Vite 导入 assets/brand-logo.png 并展示当前分区；侧栏保留三组六个页面（陪伴与创作／助手与工具／工作室）、直接功能标题、当前桌宠陪伴席与宿主路由事件。标识不改变默认桌宠。dashboard 兼容映射我的桌宠，integrations 映射 AI 接入，旧 computer 路由映射插件管理。gallery 和 persona 为独立页面，teams 为无效路由；电脑与文件不再是独立内置页。
- studio/studio.css：参考[鸣潮 WIKI](https://wiki.kurobbs.com/mc/home)的深灰顶栏、浅灰纸色工作区、白灰分区卡、细金色边线与选中下划线，青色用于轻提示；主操作使用深灰白字，次操作与危险样式保留清楚层级。工作区和提供方弹窗使用容器宽度响应表单、卡片与工具条，窗口断点收紧侧栏；键盘可见焦点和减少动态效果继续保留。Tailwind 仅提供公共工具类，暗色变体以显式 class 控制，不随系统暗色将白底正文变白。
- studio/studio-api.ts：界面所用的窄类型；保留旧桥接名称用于档案和功能兼容，不表示复用原控制中心整体结构。
- studio/PetStudioView.tsx 与 pet-studio-types.ts：只管理已安装桌宠，保留检索、动作、切换、显示、手动导入和移除；隐藏及网站按钮已移至桌宠/网站入口，产品页面不展示迁入来源；不读取远程目录，不再挂制作或分享表单。实际个人图使用安装图集，内置图使用打包资源。
- studio/OriginalProjectsPanel.tsx：桌宠与插件共用的检测、确认导入和原项目管理界面，直接消费 `original-project-types.ts` 窄接口。兼容原项目使用下方真实安装列表；不兼容项目不混入 SDK 运行列表，显示原宿主环境、具体限制及灰色不可用操作。独立运行由主进程的 `runOriginalProjectStandalone` 执行；缺环境时可原生选择包内 EXE／JAR 入口、已安装 Java 或原应用，按钮遵循实际能力。JAR 显示最低 Java 版本与实际检测结果；Java 选择仅调用主进程检测接口，不在渲染器拼装运行命令。外部应用启动返回 `projectStarted: false` 时明确提示手动导入原项目，不宣称作品已运行。可打开目录和移除保存副本，不展示来源字段。Shimeji 另建素材转换副本为二次确认可选操作，用 `convertedCopyInstalled` 单独记录。页面离开清理待确认选择，异步读取用代次阻止迟到结果。
- studio/PetBehaviorSettings.tsx：我的桌宠中的安静开关与可折叠动作配置。通过既有 getSettingsState、getReactionAnimationSettings 与 updatePreferences 管理宿主动作偏好和反应映射，不新增 IPC。动作改名、增删、动画绑定、随机候选与 AI 映射先编辑后保存；安静开关只即时保存已存动作，不顺带提交草稿。当前桌宠改变时重新读取真实图集布局与预览，V1/V2 继续沿用原投影；请求代次阻止迟到读取或保存覆盖当前页。
- studio/CommunityPortalView.tsx：gallery 路由及插件共创标签的本站入口，只通过 openCommunityWebsite 打开 pets/plugins/create，不复制网站画廊。
- integrations/IntegrationsView.tsx 与 integrations.css：组件自有接入卡片与 body Portal 详情沿用工作室的灰金青主题，保留中文真实配置状态与窄窗口布局；固定标题、独立滚动正文、Tab 循环/Esc 关闭/焦点恢复，长路径和 JSON 换行。
- integrations/IntegrationsView.tsx 消费 `AgentSetupSnapshot.externalIntegrations`，展示 Codex、ZCode、DeepSeek Harness、豆包四张动态卡片，沿用原生发送方校验后的安装、移除、本机测试、复制配置和官方文档入口。新增外部契约来自 `external-ai-setup-types.ts`；界面不读写配置或启动子进程。详情可保存 Node.js 路径，Harness 还可保存可执行文件与 `web`／`desktop` profile；Codex 的信任待确认及豆包“开发接口、客户端自动监测未支持”直接展示适配器状态，不把配置登记渲染为运行时已连接。
  若快照表明另一个接入操作仍在运行，页面等待一秒后读取新快照，并在结束后恢复安装操作；本页操作期间暂停此读取，离页取消定时器并忽略迟到结果。刷新状态只在本页操作期间禁用，读取失败后仍可手动重试。
- 外部卡片另显示命令行程序检测和近期工作事件，详情将程序、配置、近期正式事件分别展示；消费 `sessionStates` 和各卡片 `session`，没有收到正式工作事件时保持待确认，不把链路自测或单独会话开始当作已连接。豆包 PC／网页明确显示未支持并禁用安装测试，不使用方舟桥状态冒充。版本超时不判为未安装。CompanionAiView 只根据主进程 `officialQuotaProvider` 展示受支持来源的官方查询，配置未就绪禁用，其他来源不显示通用查询按钮。
- studio/StudioAiView.tsx：宠物大脑的对话与监测、对话 AI 来源、外部 AI 接入三页。CompanionAiView 展示同一桌宠会话及每条时间，共用对话外观；对话来源额度与外部真实会话分别展示。外部页显示工具、本轮成功文件数、失联状态及独立 Codex 官方账户额度开关／窗口／恢复时间；Hooks 不携带账户身份，不假定逐会话归属。没有公开额度接口的来源明确未知。原提供方和接入模块仍持有连接配置，Codex CLI 路径在接入页配置。
- studio/PersonaStudioView.tsx：全局与蒸馏两种方式，支持标准角色卡 JSON／PNG、按人物字段编辑及保留扩展的原格式导出；单文档或完整 Skill 文件夹导入、托管 skills 目录入口、可见扫描/人物选择、当前 AI 与宿主人设能力状态、正文编辑、提炼、导出及启停。主动导入自动启用并每轮应用；多个候选不抢占现有人设，编辑保存保留当前启用开关，首次编写保存默认停用，生成不自动落盘。
- studio/StudioPluginsView.tsx：独立插件卡片、权限、启停、配置、命令表单和导入；studio-tabs 保留标签角色与 aria-selected，刷新、配置和重载为辅助操作，卸载为危险操作。两个可选工具按已安装、已启用、权限齐全、非损坏且真实 runtime active 的快照挂载 CompanionToolsView；失效立即收起与卸载配置，读取快照失败不沿用旧权限。工具卸载提示保留工具库与设置，普通插件语义不变。复杂结构显式 JSON 编辑，保存仍由宿主校验。
- studio/PluginAuthoringView.tsx：旧本机制作者源码，当前控制中心不再挂载；制作迁至 apps/community-web。
- studio/StudioSettingsView.tsx：从真实 getSettingsState 设置快照读取陪伴显示、大小、快捷键和开机启动，并挂载桌宠对话样式设置；getPetsState 保持只提供默认桌宠标识与安装列表。来源区、旧团队、组织和更新入口已移除。
- studio/PetChatAppearanceSettings.tsx 与 PetChatAppearanceSettings.css：设置页面的字体、强调色、输入框及回答框配置；提供原样式、奶油、森林、夜色预设和独立草稿预览，保存才通过既有 updatePreferences 提交，取消恢复已保存值，恢复原样式实际保存停用的默认值。本机常见字体候选通过浏览器绘制测量筛选，也可手填已安装字体名；不访问字体文件、不安装字体。共享校验与渲染值来自 pet-chat-appearance.ts，默认未启用时保留桌宠原样式，窄容器下预览与两类表单转为单列。
- companion/CompanionToolsView.tsx：只由已授权工具插件卡片挂载，mode=files 单独复用文件库，不读取电脑快照；mode=computer 复用体检、软件提醒与 CompanionAnalysisControls；协同只提供发送前预览、来源选择、启动和取消，结果注入既有会话，读取完成后再安排下次轮询，卸载时停止轮询。studio-tool-tabs 以 aria-current 标记当前入口，重用功能所有者及其可取消操作。

## 素材与弹层

components/PetSprite.tsx 保持允许的图片协议与 V1/V2 SVG 动作投影。素材声明保留在既有包元数据与许可文件，当前本地产品操作区不展示来源说明。pets/PetCreator 和 PetShareDialog 为旧本机制作者源码，当前工作室不再挂载。

独立动作媒体的 `spriteLayout.media` 沿原安装与动作快照送达。`components/PetSprite.tsx` 的 `MediaPetPreview` 复用 `pet-media-player.mjs`，按当前动作播放本机 MP4／WebM 或动画 WebP；预览离开可见区域、页面隐藏或组件卸载时暂停／释放资源。`PetBehaviorSettings.tsx` 的自命名动作和 AI 状态映射使用同一媒体预览，不再对视频包作 SVG 图集裁切。两个控制中心 CSP 为已安装协议声明 `media-src` 和 `connect-src`。

settings/providers/ProviderModal.tsx 在真实弹窗容器上提供 provider-modal 类，模板按钮以 aria-pressed 公开选中状态；工作室 CSS 负责弹窗宽度与外观，来源选择、凭据输入、测试、保存与取消继续使用原功能所有者。

## 数据与生命周期

控制中心关闭收起后保留外壳；`studio/StudioApp.tsx` 通过原生 `visibilitychange` 卸载功能页，停止对话、额度与插件页轮询，重新显示时重新挂载。主进程仍取消该窗口的未完成工作，渲染器失效及程序真正退出时销毁窗口。

control-center-preload.cjs 提供宠物、插件、提供方、人设和电脑接口，windows.ts 负责发送者授权及原生对话框。关闭或渲染器失效会撤销制作、提炼和文件任务。页面读取使用取消标记或请求代次阻止迟到刷新覆盖当前状态。插件刷新事件更新原服务快照，不创建第二套插件状态。

## 验证

从 apps/desktop 运行 renderer 类型检查及 Vite 构建。smoke-studio.mjs 使用全新隔离档案，真实 DOM、桥接、文件写入和权限确认；smoke-persona-provider.mjs 使用本机 HTTP 模型替身验证多来源文本提炼与生效范围。截图需实际核对绘制结果，不能由 DOM 通过推断图片已刷新。

smoke-studio-ui.mjs 专门检查工作室界面：新隔离档案、隐藏真实窗口、六个页面、1280×860／980×720／820×620 三种内容尺寸，以及生产最小窗口的实际内容视口；检查水平溢出、控件重叠、透明文本和实际 Tab 焦点。它还执行来源与动作详情、人设保存读回、插件网站入口、提供方配置编辑取消、外部接入入口；两个实际工具源包通过原生目录选择和权限确认边界导入，真实启停、卸载、重装后核对文件库保留、电脑入口与 AI 诊断开关。文件模式应不访问电脑快照。原生窗口显示、安排好的目录选择与确认、定位被测试边界替代，远程网络被阻止；不验证真实远程 AI、额度或生成质量，也不修改用户档案。覆盖职责不代表本轮运行已全部通过，具体结果须读取运行记录。

动作配置验收还核对默认安静、开关保存、动作改名／新增／移除、候选和 AI 映射保存以及真实 renderer reload 的恢复。隔离默认桌宠短暂恢复原生 showInactive，不伪造可见状态；实际鼠标输入经 pet preload，读取绘制的图集行并截图，等待动作有界返回待机。使用同一隔离档案本地 IPC 的测试代理事件验证 AI 状态映射，结束后隐藏桌宠；控制中心仍隐藏且不可聚焦。

## 迁入历史

旧 teams/ 组件和部分设置辅助组件可能仍在源树，用于上游记录与测试；新入口不导入团队组件。公共按钮、提供方连接、动作预览等迁入功能保留来源。整体控制中心的布局和路由由上述 studio/ 所有者独立开发。具体说明见 docs/studio.md。

## 文件库交互

`companion/CompanionFilesView.tsx` 改为持久引用库，支持目录／六类／名称筛选、扫描覆盖提示、条目定位、添加／刷新／撤下目录；不提供复制收纳入口，旧记录仍能有条件撤销。AI 明确预览匿名名字与类型、选择已有来源、生成／审阅／采用分步；按推荐整理展示真实源目标与冲突，确认移动后刷新索引和记录。运行及离开页面时复用宿主取消，不在 UI 发 HTTP 或读写文件。`CompanionAiView.tsx` 仅在文件助手插件可用时，对受支持的本地问文件句式允许无 AI 发送，其余聊天继续原来源就绪判定。

已索引目录详情默认收起；文件列表、AI 建议、推荐计划和历史条目提供各自语义类，工作室容器样式决定紧凑布局与滚动边界，不改变预览、采用、确认移动和撤销授权。

smoke-community-website.mjs 以新隔离档案验证本地配置边界和三个本站入口；外部 AI 详情采用明确标注的配置状态夹具，覆盖正文逐屏几何及最小视口中段、底部、JSON和管理按钮截图，不验证真实外部工具连通性。它还使用真实主进程所有者检查 Codex 命令路径保存、拒绝非法字段与清除，并验证忙碌快照结束后安装按钮恢复、忙碌期间离页停止读取；`DESKTOP_PET_SMOKE_BUILD_DIR` 可指定隔离编译目录，`DESKTOP_PET_SMOKE_INTEGRATION_ONLY=1` 只运行这组回归。
