# 收到投稿后如何处理

当前流程：**Issue／PR → 审核 → 独立测试 → 加入目录 → 构建 → 部署 → 公网验收 → 回复并关闭申请**。网站不会读取 Issue 自动上架，当前 Cloudflare 服务也未开放作品直接上传。

## 1. 查看申请

打开[仓库 Issues](https://github.com/xunguangzlj-cloud/desktop-pet-community/issues)，查看作品信息、真实作者、完整包、许可、运行环境、依赖与插件权限。缺信息就在原 Issue 请求补充；作者提供的哈希应与实际下载完整包一致。

保留原始包、作者署名、许可证和相关清单。检查包中是否包含个人配置、凭据或其他不适合公开的文件。接受投稿不等于可以省略作品本身的许可条件。

## 2. 在独立档案中测试

先检查文件结构和依赖，再使用临时桌宠档案验证导入、预览、实际动作与插件功能。插件代码先审阅，确认权限与行为后再启用。不要在日常个人档案里直接运行未知作品。

兼容作品验证本系统操作；需要原宿主的作品核对其原运行方式和禁用操作，不能仅以静态结构检查或启动成功宣称全部功能兼容。记录结果及尚缺条件，便于投稿者补充。

## 3. 建立收录 PR

在自己的分支添加作品文件和目录条目，PR 关联原投稿 Issue。现有公开目录不是扫描文件夹自动生成：

| 内容 | 现有登记位置 |
| --- | --- |
| 桌宠原件 | `outputs/desktop-pet/apps/community-web/upstream-pets/<作品 ID>/` |
| 桌宠条目 | `outputs/desktop-pet/apps/community-web/dist/catalog.js` 的 `pets` |
| 源码插件 | `outputs/desktop-pet/plugins/community/<插件 ID>/` |
| 源码插件收录名单 | `outputs/desktop-pet/apps/community-web/build-packages.mjs` 的 `sourcePluginInfo` |
| 生成下载包与公开文件清单 | `build-packages.mjs` 的输出及 `gallery-files.json` |

按现有清单结构填写真实作者、作品 ID、格式、预览和包路径，避免重复 ID。插件打包器现有维护者显示逻辑面向已迁入插件；新增投稿必须改成对应作品的真实作者，不能直接沿用 Lykinzlj。同步贡献者头像和署名；主页不确定时链接本站作者页。

**现有边界：**公开目录现支持 V1／V2 WebP 图集、原生独立图片／视频动作包和完整原应用下载。原生包需验证真实媒体清单、动作与状态绑定；原应用保留其安装和运行逻辑，不把下载入口可用当作本系统全部功能兼容。网页与本机完整包导入最多 **1 GiB**、单文件 **512 MiB**、**10000 文件**，低内存设备建议分批导入不同作品。GitHub Issue 的 ZIP 附件最多 **25 MB**；更大作品提供完整下载链接，GitHub Release 每个文件必须小于 **2 GiB**，不要把超过普通 Git 文件上限的素材强推到仓库。GitHub 附件及 Cloudflare Pages 的限制独立于应用导入限额；Pages 单文件不能超过 **25 MiB**。大型动作 ZIP 可作为自有仓库 Release 附件发布，目录登记完整地址、实际大小与 SHA-256，本站保留动作预览、清单和许可声明。上传后重新下载核对，不能用缩小或删素材的包冒充完整包；目前不自动传入 R2。

## 4. 构建和验证

先安装仓库所需的 Node.js、pnpm 与依赖。在 `outputs/desktop-pet` 目录运行：

```powershell
pnpm build
node apps/community-web/build-native-contract.mjs
node apps/community-web/build-packages.mjs
node apps/community-web/test-packages.mjs
node --test apps/community-web/tests/*.test.mjs
```

回到仓库根目录：

```powershell
npm ci --prefix outputs/community-site
node outputs/community-host/scripts/build.mjs
node outputs/community-cloudflare/scripts/build.mjs
node --test outputs/community-cloudflare/tests/*.test.mjs
```

检查作品详情、封面、预览、作者和完整 ZIP；导入生成的下载包再测试一次。测试失败就修复或请投稿者补充，先不标记收录。

## 5. 发布与关闭申请

合并验收通过的 PR，再按本站现有 Cloudflare Pages 流程部署 `outputs/community-cloudflare/dist`。以上构建命令没有执行公网部署。保持现有数据库与环境绑定，部署凭据不提交到仓库。

在[公网网站](https://desktoppet-e9e.pages.dev)确认作品出现在对应广场、详情可打开、完整 ZIP 可下载并导入，作者与许可正确后，回复投稿 Issue，附作品链接和收录 PR，然后关闭申请。



不接受或暂不能兼容时说明具体原因；关闭申请不代表已经上线。需求提案另按实际制作进展处理，不把需求申请直接当成完成作品。
