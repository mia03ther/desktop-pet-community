# Cloudflare 共创平台

`worker/index.mjs` 组合既有公开目录接口、匿名互动和静态素材；访客投稿与账号权限不由匿名互动授予。`scripts/build.mjs` 复制经过精确公开清单登记的独立托管构建，再生成 Pages Worker、路由与部署摘要，不公开本机工作目录或用户设置。

`worker/media-assets.mjs` 只处理 `gallery-files.json` 登记的视频路径，路由生成器复用同一名单。Pages 原静态服务的 Range 返回整片，因此这些视频的 HEAD 补完整大小、GET 单区间返回 206 和真实 Content-Range，越界返回 416。请求不能指定外部资源；多区间或格式无效的 Range 忽略，返回完整资源；If-Range 不匹配当前 SHA-256 ETag 时也返回完整资源。素材字节不改动，分段通过标准流管道截取、到达末端取消上游，在 Workers 使用 FixedLengthStream 确保长度，不缓存完整视频。其他资源仍走 ASSETS，API 的来源与身份规则保留。

`tests/media-assets.test.mjs` 保护真实登记媒体的 HEAD、首段、中段、尾段、越界、取消、未登记路径和平台固定长度响应；公网验收另外实测 Pages 的 HEAD／206／416，测试通过不代替部署结果。
