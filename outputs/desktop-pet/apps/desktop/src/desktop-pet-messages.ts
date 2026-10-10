import { randomUUID } from "node:crypto";
import type { ActiveBubble } from "./plugin-bubble-arbiter.js";

export type DesktopPetMessage = { readonly id: string; readonly text: string; readonly createdAt: number };
const session = randomUUID();
const pending: DesktopPetMessage[] = [];
let nextId = 0;
let sink: ((message: DesktopPetMessage) => void) | undefined;
let latest: { text: string; time: number } | undefined;

/** 提醒沿实际展示入口入库，持续刷新的进度 HUD 不混入聊天。 */
export function recordDesktopPetBubble(content: ActiveBubble | null): void {
  if (!content || content.bubble.hud || content.bubble.dynamic) return;
  const text = content.bubble.text ?? content.bubble.markdownHtml
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(?:strong|em|code)>/gi, "")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"').replaceAll("&#39;", "'").replaceAll("&amp;", "&");
  if (text) recordDesktopPetMessage(text, content.token);
}

/** 启动期间暂存提醒，接入后交给唯一桌宠会话持久化，不发起模型请求。 */
export function recordDesktopPetMessage(text: string, sourceId?: string): void {
  const normalized = text.trim();
  if (!normalized) return;
  const now = Date.now();
  if (latest?.text === normalized && now - latest.time < 1000) return;
  latest = { text: normalized, time: now };
  const message = { id: `${session}:${sourceId ?? ++nextId}`, text: normalized.slice(0, 8000), createdAt: now };
  if (sink) {
    sink(message);
    return;
  }
  if (pending.some((item) => item.id === message.id)) return;
  pending.push(message);
  if (pending.length > 20) pending.shift();
}

export function bindDesktopPetMessageSink(listener: (message: DesktopPetMessage) => void): void {
  sink = listener;
  for (const message of pending.splice(0)) listener(message);
}

export function clearDesktopPetMessageSink(): void {
  sink = undefined;
  pending.length = 0;
  latest = undefined;
}
