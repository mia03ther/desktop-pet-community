# Cloudflare 共创平台

`worker/index.mjs` 组合既有公开目录接口、匿名互动和静态素材；访客投稿与账号权限不由匿名互动授予。`scripts/build.mjs` 复制经过精确公开清单登记的独立托管构建，再生成 Pages Worker、路由与部署摘要，不公开本机工作目录或用户设置。

发布使用官方 Wrangler CLI，构建按 Pages 免费方案检查最多 20000 文件、每文件 25 MiB；不再套用浏览器拖拽上传的 1000 文件限制。大于 25 MiB 的完整 ZIP 放在固定的 GitHub Release 下载地址，本站仍保留各动作预览与原许可。限制依据见 [Cloudflare 官方说明](https://developers.cloudflare.com/pages/platform/limits/)。

`worker/media-assets.mjs` 只处理 `gallery-files.json` 登记的视频路径，路由生成器复用同一名单。Pages 原静态服务的 Range 返回整片，因此这些视频的 HEAD 补完整大小、GET 单区间返回 206 和真实 Content-Range，越界返回 416。请求不能指定外部资源；多区间或格式无效的 Range 忽略，返回完整资源；If-Range 不匹配当前 SHA-256 ETag 时也返回完整资源。素材字节不改动，分段通过标准流管道截取、到达末端取消上游，在 Workers 使用 FixedLengthStream 确保长度，不缓存完整视频。其他资源仍走 ASSETS，API 的来源与身份规则保留。

`tests/media-assets.test.mjs` 保护真实登记媒体的 HEAD、首段、中段、尾段、越界、取消、未登记路径和平台固定长度响应；公网验收另外实测 Pages 的 HEAD／206／416，测试通过不代替部署结果。

视频路由按同一媒体父目录合并，Worker 内仍逐文件检查登记名单。本轮190个视频合并为4个目录规则，加API共5条，避免逐视频生成规则超出Pages限制。构建与真实发布包测试同时检查包含和排除规则合计不超过100条、每条不超过100字符；图集、ZIP和其他目录保留静态服务。规则依据见[Cloudflare路由说明](https://developers.cloudflare.com/pages/functions/routing/)。
