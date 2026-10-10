import assert from "node:assert/strict";

import { normalizeControlCenterRouteTarget, resolveDevControlCenterRoute } from "../src/control-center-route.js";

assert.deepEqual(resolveDevControlCenterRoute(undefined, false), null);
assert.deepEqual(resolveDevControlCenterRoute("teams", false), {
  kind: "invalid",
  rawValue: "teams",
});
assert.deepEqual(normalizeControlCenterRouteTarget({ route: "teams" }), { route: "dashboard" });
assert.deepEqual(resolveDevControlCenterRoute("gallery", false), { kind: "route", route: "gallery" });
assert.deepEqual(resolveDevControlCenterRoute("persona", false), { kind: "route", route: "persona" });
assert.deepEqual(resolveDevControlCenterRoute("providers", false), {
  kind: "target",
  target: { route: "assistant", assistantTab: "providers" },
});
assert.deepEqual(resolveDevControlCenterRoute("workbench", false), {
  kind: "target",
  target: { route: "assistant", assistantTab: "workbench" },
});
assert.deepEqual(normalizeControlCenterRouteTarget({ route: "assistant", assistantTab: "workbench" }), { route: "assistant", assistantTab: "workbench" });
assert.deepEqual(normalizeControlCenterRouteTarget({ route: "pets", assistantTab: "workbench" }), { route: "pets" });
assert.deepEqual(normalizeControlCenterRouteTarget({ route: "assistant", assistantTab: "invalid" }), { route: "assistant" });
assert.deepEqual(resolveDevControlCenterRoute("", false), {
  kind: "invalid",
  rawValue: "",
});
assert.deepEqual(resolveDevControlCenterRoute("not-a-route", false), {
  kind: "invalid",
  rawValue: "not-a-route",
});
const unsafeValue = `bad\n${"x".repeat(100)}`;
const unsafeResult = resolveDevControlCenterRoute(unsafeValue, false);
assert.equal(unsafeResult?.kind, "invalid");
if (unsafeResult?.kind === "invalid") {
  assert.equal(unsafeResult.rawValue.length, 80);
  assert.equal(unsafeResult.rawValue.includes("\n"), false);
}
assert.deepEqual(resolveDevControlCenterRoute("teams", true), null);
assert.deepEqual(resolveDevControlCenterRoute("providers", true), null);
assert.deepEqual(resolveDevControlCenterRoute("workbench", true), null);
assert.deepEqual(resolveDevControlCenterRoute("not-a-route", true), null);

console.error("Control Center development route validation passed.");
