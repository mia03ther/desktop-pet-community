import type { UpdateStatus } from "./update-types.js";
export interface AppUpdateActions {
  readonly getUpdateStatus: () => UpdateStatus;
  readonly checkForGitHubReleaseUpdate: () => Promise<UpdateStatus>;
  readonly downloadAppUpdate: () => Promise<UpdateStatus>;
  readonly installAppUpdate: () => Promise<UpdateStatus>;
  readonly openUpdateReleasePage: () => Promise<void>;
}
export function installControlCenterUpdateIpcHandlers(dependencies: {
  readonly registerHandle: (channel: string, handler: (event: { readonly sender: { readonly id: number } }) => Promise<unknown>) => void;
  readonly authorizeSender: (event: { readonly sender: { readonly id: number } }) => void;
  readonly actions: AppUpdateActions;
}): void {
  const actions = {
    "openpets:app-update-status": dependencies.actions.getUpdateStatus,
    "openpets:app-update-check": dependencies.actions.checkForGitHubReleaseUpdate,
    "openpets:app-update-download": dependencies.actions.downloadAppUpdate,
    "openpets:app-update-install": dependencies.actions.installAppUpdate,
    "openpets:app-update-release": dependencies.actions.openUpdateReleasePage,
  };
  for (const [channel, action] of Object.entries(actions)) dependencies.registerHandle(channel, async event => {
    dependencies.authorizeSender(event);
    return action();
  });
}