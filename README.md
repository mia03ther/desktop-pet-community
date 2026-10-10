# desktop pet

本地桌面伙伴与共创平台。网站作者显示名为 Lykinzlj，源码和投稿仓库为 [xunguangzlj-cloud/desktop-pet-community](https://github.com/xunguangzlj-cloud/desktop-pet-community)。

桌面程序提供安静模式、点击与拖拽反应、可自定义动作、宠物对话、人物 Skill 与全局 Markdown、多个 AI 来源配置。文件助手、电脑守护和健康提醒作为可选插件管理。兼容的桌宠和插件可在本系统运行；其他原项目保留原件，本系统无法支持的操作禁用，并可选择其原程序或满足运行环境的 EXE／JAR 独立运行。打开原应用不代表该作品已经自动加载，依赖环境也不会自动安装。

网站包括桌宠广场、需求广场、插件广场、榜单、作者页和共创入口。桌宠支持素材制作与直接导入，自定义动作名和视频动作；插件支持自行制作后上传完整文件。网站投稿先打包，再打开本仓库 GitHub 表单，由投稿者附加 ZIP 提交审核。匿名浏览、下载、点赞和关注不等于取得匿名发包权限。

## 目录

| 目录 | 用途 |
| --- | --- |
| outputs/desktop-pet | Electron、共享包、插件、文档与网页维护源码 |
| outputs/desktop-pet/apps/community-web/dist | 当前唯一维护网页源码、全部登记公开素材及原 ZIP |
| outputs/desktop-pet/apps/community-web/upstream-pets | 117 件迁入作品的原始清单、图集与许可资料 |
| outputs/community-site | 共用公开 API 源码和数据库迁移，不包含旧 Sites 私有元数据 |
| outputs/community-host | 为 Cloudflare 生成公开网页与 API 的中间构建入口 |
| outputs/community-cloudflare | 无密码互动 Worker、部署迁移、占位配置和完整静态产物 |

相对目录保留现有系统布局，不依赖作者电脑的绝对路径。node_modules、个人 userdata、密钥、浏览器／OAuth 状态、聊天、日志、截图、即梦原片和历史测试产物不随源码发布。

## 桌面构建

建议 Node.js 24 与 pnpm 11.0.8。标准依赖需要从公开包仓库安装，运行资源已经保留，不需要下载作者的个人档案。

```sh
cd outputs/desktop-pet
pnpm install
pnpm build
pnpm --filter @open-pets/desktop dev
```

生成桌面安装包可运行 pnpm --filter @open-pets/desktop package。源码中保留部分上游包名称与协议字段以保障兼容；产品控制中心和社区功能使用 desktop pet 的当前实现。首次运行自行创建本机档案，不携带发布者的 AI 账号或设置。

完成上述依赖安装和桌面编译后，可从 outputs/desktop-pet 执行 node --test apps/community-web/tests/*.test.mjs。制作导出测试使用真实桌面加载器和 sharp，需要该标准编译步骤；它的 V2 图集取自随包已许可原件，不要求取得历史未公开素材。

## 网站构建与部署

预构建静态站点位于 outputs/community-cloudflare/dist，保留完整登记的公开图集、下载包与封面，不依赖运行时 GitHub 素材回源。需要从源码重建时，在仓库根目录执行：

```sh
npm ci --prefix outputs/community-site
node outputs/community-host/scripts/build.mjs
node outputs/community-cloudflare/scripts/build.mjs
```

Cloudflare 配置仅提供 wrangler.toml.example。复制为 wrangler.toml 后填写自己的账号／D1 数据库标识，使用正常的 Cloudflare 授权流程部署。互动需要绑定 DB，并按 deployment-migrations 中 0000、0001、0011 的顺序初始化数据库；HASH_SALT 通过平台秘密绑定配置，不写入源码。密码账号方案已取消，不要求为密码计算升级 Workers。没有绑定数据库或匿名互动秘密时，页面准确显示互动不可用。

网站三步重建完成后，可执行 npm test --prefix outputs/community-cloudflare；测试使用随包迁移和本机 SQLite 临时数据库，不读取生产数据库或私人档案。本次公开预构建采用干净重建的 app.js、_worker.js 和对应公开 API 编译产物，仅去掉取消密码后残留的旧账号监听与内嵌页面；400 件登记素材与原 ZIP 字节保持。GitHub 版本与此前公网版本的这两份代码文件不宣称逐字节相同。

当前共创平台已部署至[正式网站](https://desktoppet-e9e.pages.dev)，417 个发布文件完成上传，固定 HTTPS 连接的 9 项公网检查通过。国内各运营商和地区的可达情况尚未全面覆盖。更换域名需同步 Worker 的 origin 与公开 publication-config.js。当前投稿入口是自有 GitHub 仓库，不指向上游。

## 验证边界

项目已经进行功能行为验证与使用模拟，桌面已有 556 项行为测试通过，保留网页与 Worker 行为测试，测试环境使用隔离档案。Windows 环境没有执行 Linux RPM 子流程，不能据此宣称 Linux 安装包验收通过。现有用例覆盖 ZIP 路径及附件边界、插件权限和网络访问、提供方连接测试的生命周期、匿名来源限制及互动去重。代码中的测试占位路径和假身份不是发布者的真实设置。AI 的配置登记、程序发现、链路测试和真实工作事件分别报告：用户需要配置自己的 API 或工具环境，不能把配置入口存在当成全部 AI 已真实接入。

本次还对已存在的开发依赖采用窄 esbuild override，移除旧版传递依赖，新的 npm 依赖审计返回 0 条漏洞；没有把该结果当作源代码审查。本次发布准备进行了文件范围、原件 SHA、ZIP 内文件及隐私门检，未携带私密档案。已复核的上游桌面 Google OAuth 公共客户端配置按原件保留，不含发布者的授权令牌。该门检不等于完整漏洞审计；正式 Codex Security 标准源代码漏洞审查因历史构建目录的深层源码映射路径未能启动，没有扫描编号或安全报告，不能写作全部安全通过。现有公网检查与本机构建验证均有明确范围，不代替所有平台和所有用户环境的端到端验收。

## 许可与投稿

本仓库自己的说明和模板见根 LICENSE。迁入的 OpenPets 代码保留 outputs/desktop-pet/LICENSE 原始版权与 MIT 许可；插件、字体与作品保留各自文件内的许可和署名，详见 THIRD-PARTY-NOTICES.md。素材许可与代码许可分别适用，MIT 代码许可不能当作角色 IP、商标或肖像的授权。

- [桌宠投稿](https://github.com/xunguangzlj-cloud/desktop-pet-community/issues/new?template=pet-submission.yml)
- [插件投稿](https://github.com/xunguangzlj-cloud/desktop-pet-community/issues/new?template=plugin-submission.yml)

投稿请填写真实作者、动作或权限、环境要求及许可，并附完整 ZIP；审查通过前不表示作品已在网站公开。
