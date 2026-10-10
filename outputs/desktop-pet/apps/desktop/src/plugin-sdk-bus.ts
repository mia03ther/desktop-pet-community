import type { PluginPermission } from "./plugin-manifest.js";
import type { PluginRuntimeState } from "./plugin-sdk-state.js";

export type PluginBusTopicEntry = { pluginId: string; handler: (payload: unknown) => void };

export function createPluginBusApi(options: {
  readonly pluginId: string;
  readonly state: PluginRuntimeState;
  readonly topics: Map<string, Set<PluginBusTopicEntry>>;
  readonly requireActive: () => void;
  readonly requirePermission: (permission: PluginPermission) => void;
  readonly guardCallback: <A extends unknown[]>(fn: (...args: A) => unknown) => ((...args: A) => void);
  readonly normalizeJson: (value: unknown, maxBytes: number, label: string) => unknown;
  readonly busPerMinute: number;
  readonly busPayloadBytes: number;
  readonly busSubscriptionsQuota: number;
  readonly onPublish?: (pluginId: string, topic: string, payload: unknown) => void;
}) {
  const { pluginId, state, topics, requireActive, requirePermission, guardCallback, normalizeJson, busPerMinute, busPayloadBytes, busSubscriptionsQuota } = options;
  return {
    publish: async (topic: unknown, payload: unknown) => {
      requirePermission("bus");
      state.busWindow.tick(busPerMinute, "bus");
      const topicName = String(topic);
      check(busTopicPattern.test(topicName), "Invalid bus topic.");
      const normalized = normalizeJson(payload, busPayloadBytes, "bus payload");
      // 宿主只观察通过权限、配额和 JSON 校验的消息，不暴露新的插件 API。
      try { options.onPublish?.(pluginId, topicName, normalized); } catch { /* 宿主观察失败不阻断已有订阅者 */ }
      for (const subscriber of topics.get(topicName) ?? []) {
        if (subscriber.pluginId === pluginId) continue;
        try { subscriber.handler(normalized); } catch { /* subscriber errors are isolated */ }
      }
    },
    subscribe: (topic: unknown, handler: (payload: unknown) => void) => {
      requirePermission("bus");
      const topicName = String(topic);
      check(busTopicPattern.test(topicName), "Invalid bus topic.");
      check(state.busSubscriptions.size < busSubscriptionsQuota, "Plugin bus subscription quota exceeded.");
      const entry = { pluginId, handler: guardCallback(handler) };
      let subscribers = topics.get(topicName);
      if (!subscribers) { subscribers = new Set(); topics.set(topicName, subscribers); }
      subscribers.add(entry);
      const subId = opaqueId("bus");
      state.busSubscriptions.set(subId, { topic: topicName, handler: entry.handler });
      state.eventSubscriptions.set(subId, () => { subscribers.delete(entry); state.busSubscriptions.delete(subId); });
      return { subscriptionId: subId };
    },
    unsubscribe: (subscriptionId: unknown) => { requireActive(); state.eventSubscriptions.get(String(subscriptionId))?.(); state.eventSubscriptions.delete(String(subscriptionId)); },
  };
}

const busTopicPattern = /^[A-Za-z0-9._:/-]{1,128}$/;
function opaqueId(prefix: string): string { return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`; }
function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
