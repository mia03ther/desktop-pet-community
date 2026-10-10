import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { it } from "node:test";

// 原所有者包含 Electron 窗口入口，此回归在隔离 Electron 档案内调用真实 getState。
it("Windows 隐藏启动读取默认句柄不建窗口或改启动选择，未知句柄仍失败", { skip: process.platform !== "win32", timeout: 30_000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "openpets-hidden-pet-test-"));
  const driver = join(directory, "driver.mjs");
  const stateModule = new URL("../src/app-state.js", import.meta.url).href;
  const registryModule = new URL("../src/plugin-pet-registry.js", import.meta.url).href;
  const controllerModule = new URL("../src/default-pet-controller.js", import.meta.url).href;
  const script = [
    'import { app } from "electron";',
    'import assert from "node:assert/strict";',
    `app.setPath("userData", ${JSON.stringify(directory)});`,
    'async function run() {',
    'await app.whenReady();',
    'try {',
    `  const state = await import(${JSON.stringify(stateModule)});`,
    `  const registry = await import(${JSON.stringify(registryModule)});`,
    `  const controller = await import(${JSON.stringify(controllerModule)});`,
    '  state.initializeAppState();',
    '  state.updatePreferences({ openDefaultPetOnLaunch: false });',
    '  state.recordDefaultPetPosition({ x: 30, y: 50 }, "fixture-display");',
    '  const hidden = registry.getPluginPetState("default");',
    '  assert.equal(hidden.visible, false);',
    '  assert.equal(hidden.dragging, false);',
    '  assert.deepEqual(hidden.position, { x: 30, y: 50 });',
    '  assert.equal(hidden.bounds.width, 0);',
    '  assert.equal(controller.getDefaultPetWindowForPlugins(), null);',
    '  assert.equal(state.getAppStateSnapshot().preferences.openDefaultPetOnLaunch, false);',
    '  assert.throws(() => registry.getPluginPetState("missing-fixture-handle"));',
    '  state.releaseStartupInstallLock();',
    '  app.exit(0);',
    '} catch (error) { console.error(error); app.exit(1); }',
    '}',
    'run().catch((error) => { console.error(error); app.exit(1); });',
  ].join("\n");
  await writeFile(driver, script, "utf8");
  const electronPath: unknown = createRequire(import.meta.url)("electron");
  assert.equal(typeof electronPath, "string");
  try {
    await new Promise<void>((resolve, reject) => {
      const childEnv = { ...process.env };
      delete childEnv.ELECTRON_RUN_AS_NODE;
      const child = spawn(electronPath as string, [driver], { stdio: ["ignore", "pipe", "pipe"], windowsHide: true, env: childEnv });
      let output = "";
      child.stdout.on("data", (data: Buffer) => { output += data.toString(); });
      child.stderr.on("data", (data: Buffer) => { output += data.toString(); });
      const timer = setTimeout(() => { child.kill(); reject(new Error("隔离 Electron 状态回归超时。")); }, 25_000);
      child.once("error", (error) => { clearTimeout(timer); reject(error); });
      child.once("exit", (code) => {
        clearTimeout(timer);
        if (code === 0) resolve();
        else reject(new Error(`隔离 Electron 状态回归失败：${output.slice(-4000)}`));
      });
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
