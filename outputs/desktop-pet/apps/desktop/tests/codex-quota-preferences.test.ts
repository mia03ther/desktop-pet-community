import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { register } from "node:module";
import { join } from "node:path";
import { tmpdir } from "node:os";

const directory = mkdtempSync(join(tmpdir(), "codex-quota-preferences-"));
const statePath = join(directory, "openpets-state.json");
writeFileSync(statePath, JSON.stringify({ version: 1, preferences: { openDefaultPetOnLaunch: false } }));
const electronMock = `data:text/javascript,${encodeURIComponent(`
  export const app = { getPath: () => ${JSON.stringify(directory)}, isReady: () => true };
  export const net = {};
  export const powerMonitor = { on: () => {}, getSystemIdleTime: () => 0 };
  export const screen = { on: () => {}, getAllDisplays: () => [] };
  export const shell = { openPath: async () => "" };
  export default { app, net, powerMonitor, screen, shell };
`)}`;
register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "electron") return { url: ${JSON.stringify(electronMock)}, shortCircuit: true };
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);

try {
  const state = await import("../src/app-state.js");
  try {
    state.initializeAppState();
    assert.equal(state.getAppStateSnapshot().preferences.codexQuotaMonitoringEnabled, undefined);
    assert.equal(state.getAppStateSnapshot().preferences.openDefaultPetOnLaunch, false);
    const persisted = () => JSON.parse(readFileSync(statePath, "utf8")) as { preferences: Record<string, unknown> };
    assert.equal("codexQuotaMonitoringEnabled" in persisted().preferences, false, "旧档案不被新增关闭字段");
    state.updatePreferences({ codexQuotaMonitoringEnabled: true });
    assert.equal(persisted().preferences.codexQuotaMonitoringEnabled, true);
    state.releaseStartupInstallLock();
    state.initializeAppState();
    assert.equal(state.getAppStateSnapshot().preferences.codexQuotaMonitoringEnabled, true);
    state.updatePreferences({ codexQuotaMonitoringEnabled: false });
    assert.equal(persisted().preferences.codexQuotaMonitoringEnabled, false);
    assert.equal(state.getAppStateSnapshot().preferences.openDefaultPetOnLaunch, false);
  } finally { state.releaseStartupInstallLock(); }
} finally { rmSync(directory, { recursive: true, force: true }); }

console.log("Codex 额度偏好保持旧缺失字段，显式启停可独立保存。");
