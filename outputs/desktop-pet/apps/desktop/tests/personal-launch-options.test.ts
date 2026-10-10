import assert from "node:assert/strict";
import { resolve } from "node:path";
import { test } from "node:test";
import { readPersonalLaunchOptions } from "../src/personal-launch-options.js";

test("直接启动保留含空格和中文的原档案，并区分显示桌宠与打开工作室", () => {
  const profile = resolve("测试目录", "我的 桌宠", "userdata");
  assert.deepEqual(readPersonalLaunchOptions(["openpets.exe", `--desktop-pet-profile-dir=${profile}`, "--show-pet"]), {
    profileDir: profile,
    intent: "pet",
  });
  assert.equal(readPersonalLaunchOptions(["--open-studio"]).intent, "studio");
  assert.equal(readPersonalLaunchOptions([]).intent, undefined);
  assert.equal(readPersonalLaunchOptions([], profile).profileDir, profile);
});

test("无效快捷方式数据目录必须报错，不能静默启动另一份档案", () => {
  assert.throws(() => readPersonalLaunchOptions(["--desktop-pet-profile-dir="]));
  assert.throws(() => readPersonalLaunchOptions(["--desktop-pet-profile-dir=userdata"]));
  const profile = resolve("原档案");
  assert.equal(readPersonalLaunchOptions([`--desktop-pet-profile-dir=${profile}`], resolve("另一档案")).profileDir, profile);
});
