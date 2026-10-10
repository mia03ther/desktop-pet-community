import { readFileSync } from "node:fs";
import { createOpenPetsClient, registerDshListeners } from "./runtime.mjs";

export const name = "desktop-pet-dsh";
const statusMessages = {
  thinking: "我在思考中。",
  success: "我现在空闲啦。",
  error: "工作遇到问题，请查看 AI 工具。",
  waiting: "需要你确认一下。",
};

export function apply(ctx, config = {}) {
  if (config.enabled === false) return;
  const settings = JSON.parse(readFileSync(new URL("./settings.json", import.meta.url), "utf8"));
  if (typeof settings.discoveryPath !== "string" || !settings.discoveryPath) {
    throw new Error("desktop pet 本机发现路径缺失，请重新安装联动。");
  }
  // 复用已有 Cordis 监听器，仅发送类别，不转发模型正文或工具参数。
  registerDshListeners(ctx, {
    enabled: true,
    enableStatusLineStream: false,
    enableToolEvents: false,
    enableApprovalEvents: true,
    clientFactory: () => {
      const client = createOpenPetsClient({
        discoveryPath: settings.discoveryPath,
        remote: false,
        connectTimeoutMs: 500,
        responseTimeoutMs: 500,
      });
      return {
        ...client,
        say: (_text, options) => client.say(statusMessages[options.reaction] ?? "正在工作。", options),
      };
    },
  });
}
