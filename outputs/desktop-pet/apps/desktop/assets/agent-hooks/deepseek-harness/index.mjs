import { readFileSync } from "node:fs";
import { readDiscoveryFile, sendRequest } from "./runtime.mjs";
import { registerDesktopPetDshListeners } from "./progress.mjs";

export const name = "desktop-pet-dsh";

export function apply(ctx, config = {}) {
  if (config.enabled === false) return;
  const settings = JSON.parse(readFileSync(new URL("./settings.json", import.meta.url), "utf8"));
  if (typeof settings.discoveryPath !== "string" || !settings.discoveryPath) {
    throw new Error("desktop pet 本机发现路径缺失，请重新安装联动。");
  }
  registerDesktopPetDshListeners(ctx, {
    emit: (externalAi) => sendRequest(readDiscoveryFile(settings.discoveryPath), "pet.react", {
      reaction: externalAi.event === "permission" ? "waiting"
        : externalAi.event === "tool-failed" ? "error"
        : externalAi.event === "turn-end" ? "success"
        : externalAi.event === "session-end" ? "idle" : "thinking",
      externalAi,
    }, { connectTimeoutMs: 500, responseTimeoutMs: 500 }),
  });
}
