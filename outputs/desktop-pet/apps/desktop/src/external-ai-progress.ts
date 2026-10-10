import type { ExternalAiProgress } from "./external-ai-activity.js";

/** 无运行时依赖的显示投影，供桌宠浮层和控制中心共同使用。 */
export function externalAiProgressMessage(progress: ExternalAiProgress): string {
  if (progress.phase === "permission") return "等待你的确认";
  if (progress.activeToolCount > 0 || progress.phase === "tool-start") {
    const tool = progress.toolName ?? "工具";
    const label = /(^|[._])(?:exec|js|node_repl)$/.test(tool) || /__js$/.test(tool) ? "JS" : tool;
    return `正在调用 ${label}${progress.activeToolCount > 1 ? ` · ${progress.activeToolCount} 个工具进行中` : ""}`;
  }
  if (progress.phase === "tool-failed") return "工具未完成";
  if (progress.phase === "turn-end") return "本轮已完成";
  if (progress.phase === "interrupt") return "已中断";
  if (progress.phase === "session-end") return "会话已结束";
  return "正在思考";
}
