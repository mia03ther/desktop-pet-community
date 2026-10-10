// 诊断与监测由桌宠工作室宿主按安装、启用与权限状态提供；入口不执行电脑操作。
export function register(OpenPetsPlugin) {
  OpenPetsPlugin.register({
    async start(ctx) {
      await ctx.status.set({ text: '电脑守护已启用；在插件配置中检查资源与安装包，监测选项由你开启。', tone: 'info' });
    },
  });
}
