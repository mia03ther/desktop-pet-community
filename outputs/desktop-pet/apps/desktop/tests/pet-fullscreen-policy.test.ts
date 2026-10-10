import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isForegroundFullscreenOnDisplay } from "../src/pet-fullscreen-policy.js";

const primary = { x: 0, y: 0, width: 1920, height: 1080 };
const ownPid = 10;
const external = (contentBounds: typeof primary | null) => ({ ownerPid: 20, contentBounds });

describe("Windows 全屏让位策略", () => {
  it("全屏及两像素舍入误差会让位", () => {
    assert.equal(isForegroundFullscreenOnDisplay(external(primary), ownPid, primary), true);
    assert.equal(isForegroundFullscreenOnDisplay(external({ x: 1, y: 1, width: 1918, height: 1078 }), ownPid, primary), true);
  });
  it("普通最大化的客户区、较小窗口及未知窗口不触发", () => {
    assert.equal(isForegroundFullscreenOnDisplay(external({ x: 0, y: 30, width: 1920, height: 1010 }), ownPid, primary), false);
    assert.equal(isForegroundFullscreenOnDisplay(external({ x: 10, y: 10, width: 900, height: 700 }), ownPid, primary), false);
    assert.equal(isForegroundFullscreenOnDisplay(null, ownPid, primary), false);
    assert.equal(isForegroundFullscreenOnDisplay(external(null), ownPid, primary), false);
  });
  it("只对被覆盖的显示器让位，支持负坐标副屏和跨屏客户区", () => {
    const secondary = { x: -1280, y: -200, width: 1280, height: 720 };
    assert.equal(isForegroundFullscreenOnDisplay(external(secondary), ownPid, secondary), true);
    assert.equal(isForegroundFullscreenOnDisplay(external(secondary), ownPid, primary), false);
    assert.equal(isForegroundFullscreenOnDisplay(external({ x: -1280, y: -200, width: 3200, height: 1280 }), ownPid, primary), true);
  });
  it("本进程界面和无效几何不会让桌宠丢失置顶", () => {
    assert.equal(isForegroundFullscreenOnDisplay({ ownerPid: ownPid, contentBounds: primary }, ownPid, primary), false);
    assert.equal(isForegroundFullscreenOnDisplay(external({ ...primary, width: Number.NaN }), ownPid, primary), false);
    assert.equal(isForegroundFullscreenOnDisplay(external({ ...primary, height: 0 }), ownPid, primary), false);
  });
});
