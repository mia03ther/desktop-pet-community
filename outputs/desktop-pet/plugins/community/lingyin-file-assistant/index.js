// 文件能力由桌宠工作室宿主按安装、启用与权限状态提供；入口只公布配置位置。
export function register(OpenPetsPlugin) {
  OpenPetsPlugin.register({
    async start(ctx) {
      await ctx.status.set({ text: '文件助手已启用；在插件配置中定位文件、管理虚拟分类库或审核整理计划。', tone: 'info' });
    },
  });
}
