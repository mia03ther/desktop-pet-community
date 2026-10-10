import assert from "node:assert/strict";
import { test } from "node:test";
import { projectPetOrigin } from "../src/companion-pet-origin.js";

test("内置与图库外观显示上游来源，不把代码许可当作已核实素材许可", () => {
  const builtIn = projectPetOrigin({ id: "builtin", builtIn: true });
  assert.match(builtIn.source, /Hoodie Cat/);
  assert.match(builtIn.sourceUrl ?? "", /github\.com\/OpenPetsHQ\/openpets\/blob\//);
  assert.equal(builtIn.author, "待核实");
  assert.equal(builtIn.license, "待核实");
  const catalog = projectPetOrigin({ id: "toasty-tote", source: { kind: "catalog" } });
  assert.equal(catalog.label, "OpenPets 图库素材");
  assert.equal(catalog.author, "待核实");
  assert.equal(catalog.license, "待核实");
});

test("本机和兼容来源不能推断原创；未知来源不冒称来自目录", () => {
  const imported = projectPetOrigin({ id: "user-cat" });
  assert.equal(imported.label, "用户导入素材");
  assert.equal(imported.sourceUrl, undefined);
  assert.equal(imported.license, "待核实");
  const compatible = projectPetOrigin({ id: "aiko", source: { kind: "codex" } });
  assert.equal(compatible.label, "本机兼容格式素材");
  assert.equal(compatible.author, "待核实");
});

test("显式署名声明可以展示但保留未核实状态与真实迁入来源", () => {
  const declared = projectPetOrigin({
    id: "toasty-tote",
    source: { kind: "catalog" },
    claims: { author: " 用户填写 ", source: " 自行保留的记录 ", license: " 待作者确认 " },
  });
  assert.equal(declared.author, "用户填写");
  assert.equal(declared.license, "待作者确认");
  assert.equal(declared.declaredSource, "自行保留的记录");
  assert.equal(declared.label, "OpenPets 图库素材");
  assert.equal(declared.hasUserClaims, true);
  assert.match(declared.notice, /用户声明，尚未核实/);
});
