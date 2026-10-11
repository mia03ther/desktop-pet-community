# Cloudflare 共创平台

`worker/catalog-management.mjs` 持有 D1 的作品下架／分类覆盖、签名管理员会话及登录限流，服务由 `ADMIN_KEY` 秘密和既有 D1 绑定启用。`/api/admin/*` 只接受已验证管理会话，写请求校验本站 Origin；`/api/catalog-management` 公开最小覆盖数据。数据库使用绑定参数与版本条件更新，记录跨部署保存。`/admin.html` 为管理入口，用户凭据不进入公开构建。

`worker/index.mjs` 组合既有公开目录接口、匿名互动和静态素材；访客投稿与账号权限不由匿名互动授予。`scripts/build.mjs` 复制经过精确公开清单登记的独立托管构建，再生成 Pages Worker、路由与部署摘要，不公开本机工作目录或用户设置。

发布使用官方 Wrangler CLI，构建按 Pages 免费方案检查最多 20000 文件、每文件 25 MiB；不再套用浏览器拖拽上传的 1000 文件限制。大于 25 MiB 的完整 ZIP 放在固定的 GitHub Release 下载地址，本站仍保留各动作预览与原许可。限制依据见 [Cloudflare 官方说明](https://developers.cloudflare.com/pages/platform/limits/)。

`worker/media-assets.mjs` 只处理 `gallery-files.json` 登记的视频路径，路由生成器复用同一名单。Pages 原静态服务的 Range 返回整片，因此这些视频的 HEAD 补完整大小、GET 单区间返回 206 和真实 Content-Range，越界返回 416。请求不能指定外部资源；多区间或格式无效的 Range 忽略，返回完整资源；If-Range 不匹配当前 SHA-256 ETag 时也返回完整资源。素材字节不改动，分段通过标准流管道截取、到达末端取消上游，在 Workers 使用 FixedLengthStream 确保长度，不缓存完整视频。其他资源仍走 ASSETS，API 的来源与身份规则保留。

`tests/media-assets.test.mjs` 保护真实登记媒体的 HEAD、首段、中段、尾段、越界、取消、未登记路径和平台固定长度响应；公网验收另外实测 Pages 的 HEAD／206／416，测试通过不代替部署结果。

为使下架同时覆盖下载和编码素材链接，路由统一为 `/*`；Worker 内媒体仍逐文件检查原登记名单，其他静态内容仍从 ASSETS 读取。受管理的素材在数据库不可用时关闭读取，公开目录前端不退回未过滤状态。管理员可看已下架素材，普通访客得到410。构建与真实发布包测试检查路由合计不超过100条、每条不超过100字符。规则依据见[Cloudflare路由说明](https://developers.cloudflare.com/pages/functions/routing/)。
