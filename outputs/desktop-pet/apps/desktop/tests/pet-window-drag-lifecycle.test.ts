import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { register } from "node:module";
import type { BrowserWindow } from "electron";

const electronMock = `data:text/javascript,${encodeURIComponent(`
  import { EventEmitter } from "node:events";
  export const ipcMain = new EventEmitter();
  export const screen = { getCursorScreenPoint: () => ({ x: -100, y: -100 }) };
`)}`;
const gazeMock = `data:text/javascript,${encodeURIComponent(`
  export const resetPetGazeWindow = () => {};
  export const setPetGazeDragging = () => {};
  export const setPetGazeRendererReady = () => {};
  export const suspendPetGazeForMovement = () => {};
`)}`;
const loggerMock = `data:text/javascript,${encodeURIComponent("export const debug = () => {};")}`;

register(`data:text/javascript,${encodeURIComponent(`
  export async function resolve(specifier, context, nextResolve) {
    if (specifier === "electron") return { url: ${JSON.stringify(electronMock)}, shortCircuit: true };
    if (specifier === "./pet-window-gaze.js") return { url: ${JSON.stringify(gazeMock)}, shortCircuit: true };
    if (specifier === "./logger.js") return { url: ${JSON.stringify(loggerMock)}, shortCircuit: true };
    return nextResolve(specifier, context);
  }
`)}`, import.meta.url);

const { ipcMain } = await import("electron");
const { installPetWindowInteraction, isPetWindowDragging, recoverPetMouseInterop } = await import("../src/pet-window-interaction.js");

class TestWindow extends EventEmitter {
  readonly id = 1;
  readonly webContents = Object.assign(new EventEmitter(), { isDestroyed: () => false, send: () => {} });
  private bounds = { x: 10, y: 20, width: 160, height: 160 };
  isDestroyed() { return false; }
  getBounds() { return this.bounds; }
  getContentBounds() { return this.bounds; }
  setBounds(bounds: typeof this.bounds) { this.bounds = bounds; }
  setIgnoreMouseEvents() {}
}

// 执行真实控制器：导航先清理、渲染器迟到结束，插件仍只收到一组拖拽事件。
for (const lifecycleEvent of ["did-start-navigation", "did-start-loading", "did-finish-load", "did-fail-load", "recovery"]) {
  const window = new TestWindow();
  const petWindow = window as unknown as BrowserWindow;
  const events: string[] = [];
  installPetWindowInteraction(petWindow, {
    useWaylandNativeDrag: false,
    readWindowPosition: () => ({ x: window.getBounds().x, y: window.getBounds().y }),
  }, { onPetEvent: (name) => events.push(name) });
  const sender = { sender: window.webContents };
  try {
    ipcMain.emit("openpets:pet-drag-start", sender, { screenX: 100, screenY: 200 });
    assert.equal(isPetWindowDragging(petWindow), true);
    if (lifecycleEvent === "recovery") recoverPetMouseInterop(petWindow, "测试恢复");
    else window.webContents.emit(lifecycleEvent);
    assert.equal(isPetWindowDragging(petWindow), false, `${lifecycleEvent} 应清除宿主拖拽状态`);
    assert.deepEqual(events, ["pet:dragStart", "pet:dragEnd"], `${lifecycleEvent} 应通知插件结束拖拽`);
    ipcMain.emit("openpets:pet-drag-end", sender);
    assert.equal(events.length, 2, "迟到的松手不能重复发送结束");
    window.webContents.emit("did-start-loading");
    assert.equal(events.length, 2, "闲置时重新加载不能凭空发送结束");
  } finally {
    window.emit("closed");
  }
}

console.log("桌宠导航与恢复期间的拖拽结束测试通过。");
