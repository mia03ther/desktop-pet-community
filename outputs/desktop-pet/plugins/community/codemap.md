# plugins/community

可选社区插件源。既有迁入插件保留原来源；`lingyin-file-assistant` 和 `lingyin-computer-care` 是本项目的 SDK V3 宿主工具扩展，以 `openpets.plugin.json` 声明 ID、权限与 `index.js` 入口。它们不加入桌面捆绑或默认安装列表。

两个入口只用 `ctx.status.set` 公布配置位置，不执行文件或电脑操作。匹配版本的桌宠工作室宿主按真实安装、启用及批准权限提供本机工具与配置；文件助手要求 `files`，电脑守护要求 `files` 与 `system:metrics`。网站公开下载包由 `apps/community-web/build-packages.mjs` 从这两个源文件夹生成，`test-packages.mjs` 使用桌面实际 ZIP 安装器、目录加载器与 SDK 测试宿主验证。

详细用途与安装边界见每个插件的 README；目录不存放用户配置、秘密或私人文件。
