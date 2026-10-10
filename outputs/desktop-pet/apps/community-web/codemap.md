# apps/community-web

共创平台的顶栏标记为正式版；桌面安装包的版本与签名状态独立保留。超过 Pages 单文件上限的原生视频动作 ZIP 使用维护者登记的固定 HTTPS 完整包地址，`packageManifest` 与 `packageLicense` 及逐项动作素材在本站公开，完整 ZIP 的大小和 SHA-256 随目录保存。打包器登记这些文件，包测试仍调用实际媒体清单和文件校验器；公网下载验收另核完整发行 ZIP 的原字节。下载接口不接受访客提供的目标地址。

新增开源伙伴沿用 `catalog.js` 唯一目录：`distribution:media` 保留已验收的完整独立动作 ZIP，`mediaActions` 指向逐项公开素材；`distribution:standalone` 指向固定官方完整应用发行。`build-packages.mjs` 不把这两类重新生成图集包，只登记公开的动作、缩略图及原生 ZIP。`app.js` 按是否含 atlas 选择预览，原应用无动作时显示封面、运行要求和对应真实下载名称；不存在素材的原应用不伪造动作或本机兼容状态。下载仍进入原 `/api/download/{id}`，其原应用分支只按构建目录重定向，不接受客户端提供的目标 URL。新作品的作者与法定声明保留；本机个人设置不进入网站或素材包。

制作出口由 `package-core.js` 的 `prepareWorkPackage` 统一持有：制作需通过原生契约与文件上限，导入只添加作品说明而保留原件。`build-native-contract.mjs` 从桌面原所有者生成 `dist/native-package-contract.js`，复用插件清单、媒体清单、图集元数据和九加三种状态；生成阶段去除 Node 与图片解码依赖，浏览器产物无外部导入，不复制校验规则。`app.js` 在制作出口实际解码图集、插件 sprite 和动画 WebP，动画逐帧解码失败不导出；检查 MP4／WebM 文件头不代表验证全部视频播放或执行插件逻辑。`tests/creation-export.test.mjs` 用真实桌面加载器、图集与动作解码器检查制作 ZIP，同时保护无效制作包仍可从导入入口完整归档。来源字段隐藏且可空，旧草稿及原版权文件保留；插件封面在广场卡片、详情与排行共用 cover／presentation.cover。

独立共创网站，静态网页与公开服务分工。`dist/index.html` 定义「共创平台」首页、桌宠／插件广场、排行／需求／合集三页、桌宠制作／导入与插件上传工作台与安装指南。顶部导航为桌宠广场、需求广场、插件广场、共创平台和安装指南；首页「榜单」和「查看全部」分别进入原 `#rankings`、`#collections` 页面，制作工作台与 `#create` 路由保留。`style.css` 学习 Codex Pet 的固定顶栏、首页居中标题与作品带、全宽搜索、分类计数和四列卡片，支持浅色／深色与响应布局，按用户最新确认默认使用之前的浅色背景。HTML 初始主题及未保存明确深色偏好、存储不可用时均使用浅色，仍可手动切换并记忆显式深色选择。`app.js` 管理网站路由、广场筛选、随机发现、18 项逐批展示、安装／分享菜单、公共赞、下载共享统计与本机记录后备，以及九组动作、V2 十六向单帧预览、独立视频动作、自定义名称种类与状态绑定、完整包导入和浏览器文件草稿，不接触桌面 IPC。

`dist/community-data.js` 定义四个明确标注的本站创作提案示例和六个只引用本站作品的合集；提案参考图使用已收录作品的公开单帧，不冒充上游实时公共请求。`dist/community-core.js` 是无 DOM、持久化或网络依赖的纯计算 owner：需求字段校验、有界需求记录恢复、按本站收录数统计作者榜、按实际统计作用域计算近七日或累计互动排行、按实际作品 ID 解析合集成员。桌宠与插件采用同一真实互动计算；没有互动时返回空榜，不预填公共热度。`tests/community-core.test.mjs` 通过输入与输出保护这些行为。

完整`#rankings`采用作品／贡献者／系列与本周／总榜双筛选，宠物和插件保留各自路由。长行、统计快照和作者页DOM仍由`community-pages.js`唯一持有；`community-core.js`新增`workStatistics`与`contributorProfile`按原作者字段、实际唯一作品ID聚合，不把署名当作认证账号，未知统计返回null。作者路由为`#contributors/pets/{编码署名}`与`#contributors/plugins/{编码署名}`，两类作品共享同一作者关注。`publication-client.js`拥有作者关注GET／PUT和会话能力适配；`app.js`以interactionsAvailable／anonymousInteractions控制匿名互动，直接上传available与仓库投稿submissionAvailable独立，不展示账号登录入口。缺服务的关注按钮灰色、关注者为“—”，只采用当前作者的服务回执。`tests/community-pages.test.mjs`实际调用按钮事件和异步回执，保护类型切换、原路由、作者作品列表与过期请求隔离，不替代真实浏览器视觉验收。

`dist/community-pages.js` 拥有首页社区模块及 `#rankings`（含 plugins、plugin-authors）、`#requests`、`#collections` 的 DOM 适配，复用原广场的详情、预览和 ZIP 下载，不另建桌宠安装链。它唯一持有本浏览器需求键 `pet-community-requests-v1` 的 `entries`、`supported`、`following` 读写：校验后保存最多100件草稿，独立发布按钮打开本站仓库普通需求Issue，不把已打开或提交表单算作公共收录；支持／关注仍为浏览器偏好，持久保存失败保留当前页面及Markdown导出。需求导出显示到`#request-export-text`并复用下载适配；生成正文不等于文件保存。`app.js`仍持有广场互动和主题键，所有浏览器记录受同源限制。

`publication-config.js`唯一配置已创建核实的自有投稿仓库`xunguangzlj-cloud/desktop-pet-community`，`publication-client.js`纯函数校验固定HTTPS GitHub仓库及服务一致性、生成对应YAML字段预填URL；缺配置不猜作者仓库，服务不能改送上游。`app.js`四入口先经原严格制作或完整导入链生成一次ZIP，以其实际bytes／SHA-256预填，再打开表单及提供手动链接；不自动上传附件、发送Issue或插入公共作品。GitHub侧提交与维护者收录由仓库持有，本站无密码；大包按仓库PR指南，原件不缩减。`tests/publication-client.test.mjs`保护四流程字段、真实摘要及仓库边界，需求DOM测试保护先保存草稿和弹窗后备。

`dist/catalog.js` 是公开作品、动作和提醒模板的唯一内容所有者。新公共`pets`目录为固定提交`0d0f06bb1721aef4ddbc7f893276f235ed8458ec`的117件明确素材再分发条款作品，覆盖11类、V1 64件和V2 53件；官网全部316件／948原文件归档在工作区`work/gallery-reference/full-20261009/`，其余199条款只归档。每项保作者、完整单项许可、固定提交、图集／透明缩略图／新版本ZIP。可见卡片及桌宠详情只展示作者，来源和许可链在包内保留。原始投稿没有作品日期，`date`留空，`importedAt`记录本次加入日期。

`upstream-assets.mjs`是投稿者许可分类与归属说明唯一所有者：标准CC／MIT和明确非商业站外再分发进入公共集合，个人／仅原仓库／未知／未明确再分发不自动公开；素材声明不代替角色IP授权。`upstream-pets/{id}`保原pet.json、submission.json、spritesheet.webp及原ASSETS／仓库许可，`build-packages.mjs`按原字节打包、附加署名／许可直达／真实变更说明，不能重生成上游pet.json。`gallery-files.json` schemaVersion2只登记400项assets，精确path／mime／bytes／sha256；JS／CSS／HTML由固定名单另行持有。旧30原素材和ZIP在dist及独立历史快照保留，未在新清单登记，托管不得递归公开历史目录。`test-packages.mjs`用真实完整本地包读取器核117桌宠、24插件及400资产；全量Electron隔离安装证据在工作区`outputs/validation/gallery-full-20261009/import-02/result.json`，117／117且禁外网。

`toolPlugins` 记录文件助手与电脑守护两个可选宿主工具。`dist/plugin-catalog.js` 是 `build-packages.mjs` 从 14 个官方、5 个其他社区源码插件生成的公开目录，包含明确权限、版本、下载地址、SHA-256、维护者、原作者、来源与配置条件。`app.js` 将上述内容与三个提醒模板合为 24 件插件广场；源码和工具详情 `#plugins/{id}` 单独说明功能、批准权限、安装与依赖，不进入声明式提醒编辑器。网页不调用本机工具或操作接口；浏览与共创在网站进行，已有实例仍在本机启停和配置。

`catalog.js` 的 `projectAuthor` 是本项目五件插件的唯一作者署名，也用于源码插件的维护者署名；源码原作者及法定许可保留在分享包中。上游桌宠的 `petCredit` 不受它影响，`petDisplayAuthor` 仅为 Hoodie Cat 提供中性可见署名，不覆盖原始来源记录。安装指南只展示安装及「宠物大脑」配置，不再包含学习来源面板，分享包与 README 继续保留各自出处，详情不自动展示来源链接。网页制作保留图集，并支持独立动作媒体、自定义名称、种类与状态绑定；完整桌宠导入只补充作品信息。

`package-core.js` 校验文字、媒体动作与安全相对路径，读取 store / deflate ZIP、检查完整包清单和 SDK 声明附件是否齐全，并原样导出目录和附属文件。`inspectPackage` 保留严格附件检查；`inspectImportPackage` 在其上输出 inspection:static 的 native／partial／external／invalid 报告和能力，不执行代码，缺附件及多作品目录不误报原生兼容，仍允许保留原包归档。`coverImageType` 限定 10 MB PNG／JPEG／WebP；`addWorkInformation` 保留原清单、原许可和历史作品信息，新增封面路径与图片，编号最新 WORK-INFO 用于回读。200 MB／1000 文件上限与桌面导入一致，运行插件另限 32 MB。`app.js` 拥有四个 create 子路由、各自内存与 IndexedDB 草稿、旧键只读恢复、真实卡片封面解码预览、状态绑定素材预览和 blob 生命周期。未知宿主的动作／AI 绑定／配置保持灰色并解释使用原宿主，网页不改写原逻辑。`tests/creator-workflow.test.mjs` 保护封面 ZIP 回读、元数据历史保留、静态能力边界及真实外部样本分类；`tests/package-import.test.mjs` 保护视频合同、缺文件反馈、压缩包完整性与穿越限制，并使用实际 Codex Firefly / Raycast brew 样本回归。`build-packages.mjs` 复用内容生成各作品和模板的固定下载文件及构建清单 `dist/gallery-files.json`。`source-plugin-packages.mjs` 复用桌面 `readLocalPluginSourceManifest`，只打包清单、入口、明确声明的素材／面板／翻译，以及原许可和分享说明；额外配置、存档和用户档案不进入包。`test-packages.mjs` 用桌面实际解析器、安装器和目录加载器逐包验证运行清单、声明文件、下载 SHA-256、许可与维护署名，校验仓库源码目录全覆盖，并以含私有额外文件的夹具保护打包边界。同时完整解码 V1/V2 图集、验证透明缩略图与署名保留；不以源代码匹配代替行为。

两个工具 ZIP 来自 `plugins/community/lingyin-file-assistant` 与 `lingyin-computer-care` 的实际 SDK V3 清单和 JavaScript 入口，包含 `SHARE.md` 使用说明。测试实际运行桌面 ZIP 安装器、目录加载器及 SDK 测试宿主；入口只设置状态，本机能力由桌面宿主按安装、启用和批准权限提供。它们不捆绑或默认安装，公开服务器按 24 件插件的固定 ID 逐条登记 ZIP，不开放源码目录或任意本机文件。

`dist/assets/brand-logo.png`是用户选定D透明Logo，原字节保留，用于顶栏和favicon；24插件封面保持原`plugin-covers.js`映射。新公共图集、缩略图及ZIP统一在`dist/assets/pets/upstream-20261009/`，运行时不回源GitHub。旧`hoodie.webp`和c617dd5素材只保历史，不是当前用户默认档案，也不因代码MIT获得素材许可。托管由根代理独立持有；本轮素材原件、名单和本机验收不冒认公网发布。

桌面 `community-website.ts` 只拥有未托管时的本机公开网站预览生命周期，三个客户端社区模块和公开资产均按精确名单登记，打包资源复制至 `resources/community-web`。新的浏览器 hash 路由不扩展原桌面 `pets/plugins/create` 入口契约。网页没有文件系统操作、模型调用或用户档案服务；本机预览仍只读。`publication-client.js` 拥有同源身份、作品／需求投稿、公开列表与共享赞和下载接口适配，`community-pages.js` 接入公共需求并保留独立浏览器草稿；`app.js` 在公共服务确认后才更新作品和统计。D1／R2／Sites 身份服务实现在 Site checkout，不把本机静态构建视为公网已发布。公共需求支持和关注仍为浏览器偏好，没有增加社区审核模块。
