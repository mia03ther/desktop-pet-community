import {
  parseCompanionPluginAuthoringInput,
  type CompanionPluginAuthoringInput,
  type CompanionPluginPackageResult,
} from "./companion-plugin-authoring-types.js";

export type ControlCenterPluginAuthoringIpcEvent = { readonly sender: { readonly id: number } };
export type ControlCenterPluginAuthoringIpcHandler = (
  event: ControlCenterPluginAuthoringIpcEvent,
  input: unknown,
) => Promise<CompanionPluginPackageResult | null>;

export interface ControlCenterPluginAuthoringIpcDependencies {
  readonly registerHandle: (channel: "openpets:companion-create-plugin-package", handler: ControlCenterPluginAuthoringIpcHandler) => void;
  readonly authorizeSender: (event: ControlCenterPluginAuthoringIpcEvent) => void;
  readonly isCurrentControlCenterSender: (event: ControlCenterPluginAuthoringIpcEvent) => boolean;
  readonly getOwnerForSender: (event: ControlCenterPluginAuthoringIpcEvent) => unknown;
  readonly showOpenDialog: (owner: unknown, options: {
    title: string;
    buttonLabel: string;
    properties: ["openDirectory"];
  }) => Promise<{ readonly canceled: boolean; readonly filePaths: readonly string[] }>;
  readonly createPackage: (input: CompanionPluginAuthoringInput, parentDir: string, signal?: AbortSignal) => Promise<CompanionPluginPackageResult>;
}

export function installControlCenterPluginAuthoringIpcHandlers(
  dependencies: ControlCenterPluginAuthoringIpcDependencies,
): { cancelForSender(senderId: number): void; dispose(): void } {
  const operations = new Map<number, AbortController>();
  let disposed = false;
  dependencies.registerHandle("openpets:companion-create-plugin-package", async (event, input) => {
    dependencies.authorizeSender(event);
    const draft = parseCompanionPluginAuthoringInput(input);
    if (disposed || !dependencies.isCurrentControlCenterSender(event)) return null;
    if (operations.has(event.sender.id)) throw new Error("插件正在制作，请等待当前操作结束。");
    const controller = new AbortController();
    operations.set(event.sender.id, controller);
    try {
      const selected = await dependencies.showOpenDialog(dependencies.getOwnerForSender(event), {
        title: "选择共创插件保存位置",
        buttonLabel: "保存到此处",
        properties: ["openDirectory"],
      });
      if (selected.canceled || selected.filePaths.length === 0 || controller.signal.aborted
        || !dependencies.isCurrentControlCenterSender(event)) return null;
      const result = await dependencies.createPackage(draft, selected.filePaths[0]!, controller.signal);
      return controller.signal.aborted || !dependencies.isCurrentControlCenterSender(event) ? null : result;
    } catch (error) {
      if (controller.signal.aborted) return null;
      throw error;
    } finally {
      if (operations.get(event.sender.id) === controller) operations.delete(event.sender.id);
    }
  });
  return {
    cancelForSender(senderId) {
      operations.get(senderId)?.abort();
    },
    dispose() {
      disposed = true;
      for (const controller of operations.values()) controller.abort();
    },
  };
}
