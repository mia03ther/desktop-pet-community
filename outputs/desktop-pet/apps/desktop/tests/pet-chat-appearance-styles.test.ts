import assert from "node:assert/strict";
import test from "node:test";
import postcss from "postcss";

import { defaultPetChatAppearance, normalizePetChatAppearance } from "../src/pet-chat-appearance.js";
import { createPetChatAppearanceCss } from "../src/pet-chat-appearance-styles.js";

test("关闭自定义样式时桌宠输入、回答和提醒采用同一默认样式", () => {
  const expected = createPetChatAppearanceCss(defaultPetChatAppearance);
  assert.equal(createPetChatAppearanceCss(undefined), expected);
  assert.equal(createPetChatAppearanceCss({ ...defaultPetChatAppearance, fontFamily: "微软雅黑", fontSize: 20 }), expected, "未启用的自定义值不能影响实际样式");
  const styles = new Map<string, Map<string, string>>();
  postcss.parse(expected).walkRules(rule => {
    for (const selector of rule.selectors) {
      const declarations = styles.get(selector) ?? new Map<string, string>();
      rule.walkDecls(declaration => { declarations.set(declaration.prop, declaration.value); });
      styles.set(selector, declarations);
    }
  });
  const response = styles.get(".chat-msg.is-assistant .chat-msg-bubble")!;
  const reminder = styles.get(".bubble:not(.is-pinned):not(.has-hud)")!;
  assert.deepEqual(reminder, response, "普通提醒与对话回答表面须一致");
  assert.equal(styles.get(".openpets-compact-composer .compact-composer-textarea")?.get("font-size"), `${defaultPetChatAppearance.fontSize}px`);
  assert.equal(styles.get(".chat-msg-bubble")?.get("font-weight"), `${defaultPetChatAppearance.fontWeight}`);
});

test("字体与表面设置不会向生成样式注入额外 CSS 或资源", () => {
  const value = normalizePetChatAppearance({
    enabled: true,
    fontFamily: '微软雅黑"; } body { background: url(https://bad.example/font); }',
    accentColor: "#fff; @import 'https://bad.example/theme'",
    input: { background: "url(https://bad.example/image)", radius: Infinity, opacity: 0 },
    answer: { textColor: "#fff; display: none", borderWidth: -1 },
  });
  const css = createPetChatAppearanceCss(value);
  const parsed = postcss.parse(css);
  assert.doesNotMatch(css, /bad\.example|@import|url\(/i);
  assert.doesNotMatch(css, /Infinity|NaN|undefined/);
  assert.ok(parsed.nodes.length > 0);
  parsed.walkAtRules(() => assert.fail("自定义样式不能包含外部资源规则"));
  parsed.walkDecls("opacity", () => assert.fail("透明度只能作用于背景颜色，不能作用于文字"));
});

test("最大字号与粗边框保持输入边界，样式不接管固定 HUD 或告警图标", () => {
  const value = normalizePetChatAppearance({
    ...defaultPetChatAppearance,
    enabled: true,
    fontFamily: "霞鹜文楷",
    fontSize: 20,
    fontWeight: 700,
    input: { ...defaultPetChatAppearance.input, background: "#112233", borderWidth: 3, opacity: 40, radius: 0, shadow: false },
    answer: { ...defaultPetChatAppearance.answer, background: "#aabbcc", textColor: "#ddeeff", radius: 24 },
  });
  const css = createPetChatAppearanceCss(value);
  const parsed = postcss.parse(css);
  const declarations = new Map<string, string>();
  const expandedDeclarations = new Map<string, string>();
  parsed.walkRules((rule) => {
    if (rule.selectors.includes(".openpets-compact-composer .compact-composer-textarea")) {
      rule.walkDecls((decl) => { declarations.set(decl.prop, decl.value); });
    }
    if (rule.selectors.includes(".openpets-chat-panel .chat-textarea")) {
      rule.walkDecls((decl) => { expandedDeclarations.set(decl.prop, decl.value); });
    }
  });
  assert.equal(declarations.get("font-size"), "20px");
  assert.equal(declarations.get("font-weight"), "700");
  assert.equal(declarations.get("line-height"), "28px", "紧凑输入行高须优先于 preload 的单类默认样式");
  assert.equal(declarations.get("min-height"), "44px");
  assert.equal(declarations.get("max-height"), "64px");
  assert.equal(declarations.get("overflow-y"), "auto");
  assert.equal(declarations.get("background"), "transparent", "紧凑输入框由外框承担背景，避免透明度叠加");
  assert.equal(expandedDeclarations.get("line-height"), "28px", "展开输入行高须优先于 preload 的单类默认样式");
  assert.equal(expandedDeclarations.get("min-height"), "50px");
  assert.match(css, /font-family: "霞鹜文楷",/);
  assert.match(css, /rgba\(17, 34, 51, 0\.4\)/);
  assert.match(css, /color: #ddeeff/);
  parsed.walkRules((rule) => {
    assert.doesNotMatch(rule.selector, /\.bubble-status-icon|\.bubble-hud|\.chat-error-banner|\.compact-composer-error/);
    for (const selector of rule.selectors) {
      if (selector.includes(".bubble")) assert.ok(selector.includes(":not(.is-pinned)"), "固定插件 HUD 必须保持既有样式");
      if (selector.includes("-send-btn")) assert.ok(selector.includes(":not(:disabled)"), "发送按钮强调色不能覆盖禁用状态");
    }
  });
});
