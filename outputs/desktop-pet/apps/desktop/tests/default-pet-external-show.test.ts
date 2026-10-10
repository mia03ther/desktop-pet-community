import assert from "node:assert/strict";

import { shouldShowDefaultPetForExternalEvent } from "../src/app-state-core.js";

assert.equal(
  shouldShowDefaultPetForExternalEvent(false, false, false),
  false,
  "用户隐藏桌宠后，外部台词和提醒不能将它唤出",
);
assert.equal(
  shouldShowDefaultPetForExternalEvent(false, false, true),
  false,
  "暂停状态应阻止外部事件显示桌宠",
);

assert.equal(
  shouldShowDefaultPetForExternalEvent(true, false, false),
  true,
  "已经可见的桌宠可以继续回应事件",
);
assert.equal(
  shouldShowDefaultPetForExternalEvent(false, true, false),
  true,
  "用户允许显示时，临时遮挡后的外部事件可以恢复桌宠",
);
assert.equal(
  shouldShowDefaultPetForExternalEvent(true, true, true),
  false,
  "已经可见但处于暂停状态的桌宠不能被外部事件重新显示",
);

console.log("桌宠隐藏与外部事件回归测试通过。");
