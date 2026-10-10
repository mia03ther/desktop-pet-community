import assert from "node:assert/strict";
import { test } from "node:test";

import { defaultPetChatAppearance, normalizePetChatAppearance } from "../src/pet-chat-appearance.js";
import { validatePreferencePatch } from "../src/preference-patch.js";

test("旧档案和损坏字段保留原样式并只修复损坏部分", () => {
  assert.deepEqual(normalizePetChatAppearance(undefined), defaultPetChatAppearance);
  const recovered = normalizePetChatAppearance({
    enabled: true,
    fontFamily: "微软雅黑",
    fontSize: Number.NaN,
    input: { background: "#FEEDAB", radius: 100 },
  });
  assert.equal(recovered.enabled, true);
  assert.equal(recovered.fontFamily, "微软雅黑");
  assert.equal(recovered.fontSize, defaultPetChatAppearance.fontSize);
  assert.equal(recovered.input.background, "#feedab");
  assert.equal(recovered.input.radius, defaultPetChatAppearance.input.radius);
});

test("配置边界接受本机字体与合法样式并规范化颜色", () => {
  const value = {
    ...defaultPetChatAppearance,
    enabled: true,
    fontFamily: "  Microsoft YaHei  ",
    fontSize: 20,
    fontWeight: 700,
    accentColor: "#AABBCC",
    input: { ...defaultPetChatAppearance.input, background: "#FEEDAB", borderWidth: 3, opacity: 40 },
  };
  const patch = validatePreferencePatch({ petChatAppearance: value, unrecognized: true });
  assert.equal(patch.petChatAppearance?.fontFamily, "Microsoft YaHei");
  assert.equal(patch.petChatAppearance?.input.background, "#feedab");
  assert.deepEqual(Object.keys(patch), ["petChatAppearance"]);
  assert.deepEqual(normalizePetChatAppearance(JSON.parse(JSON.stringify(patch.petChatAppearance))), patch.petChatAppearance);
});

test("配置边界拒绝 CSS 注入、非法范围和不完整样式", () => {
  for (const fontFamily of ['Arial"; color:red', "url(https://example.com/font)", "</style><script>", "", "a".repeat(81)]) {
    assert.throws(() => validatePreferencePatch({ petChatAppearance: { ...defaultPetChatAppearance, fontFamily } }));
  }
  for (const fontSize of [9, 21, 12.5, Number.NaN, Number.POSITIVE_INFINITY, "12"]) {
    assert.throws(() => validatePreferencePatch({ petChatAppearance: { ...defaultPetChatAppearance, fontSize } }));
  }
  for (const input of [undefined, {}, { ...defaultPetChatAppearance.input, opacity: 39 }, { ...defaultPetChatAppearance.input, borderWidth: 4 }, { ...defaultPetChatAppearance.input, background: "red;display:none" }]) {
    assert.throws(() => validatePreferencePatch({ petChatAppearance: { ...defaultPetChatAppearance, input } }));
  }
});
