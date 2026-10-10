import assert from "node:assert/strict";
import { createPetDragGesture, type PetDragPoint } from "../src/pet-drag-gesture.js";

type DragEvent = { readonly kind: "start" | "move"; readonly point: PetDragPoint } | { readonly kind: "end" };

function setup() {
  const events: DragEvent[] = [];
  const gesture = createPetDragGesture({
    start: (point) => events.push({ kind: "start", point }),
    move: (point) => events.push({ kind: "move", point }),
    end: () => events.push({ kind: "end" }),
  });
  return { gesture, events };
}

// 原地点击、小范围抖动和恰好四像素的位移都不发送拖拽事件。
for (const point of [{ screenX: 100, screenY: 200 }, { screenX: 102, screenY: 201 }, { screenX: 104, screenY: 200 }]) {
  const { gesture, events } = setup();
  gesture.begin({ screenX: 100, screenY: 200 });
  gesture.move(point);
  assert.equal(gesture.end(), false, "点击不应抑制后续单击事件");
  assert.deepEqual(events, [], "未超过阈值时不应发出拖拽开始或结束");
}

// 首次跨阈值发送原始起点和当前移动；继续拖动只追加 move。
{
  const { gesture, events } = setup();
  const origin = { screenX: 100, screenY: 200 };
  gesture.begin(origin);
  gesture.move({ screenX: 102, screenY: 201 });
  gesture.move({ screenX: 103, screenY: 203 });
  gesture.move({ screenX: 120, screenY: 210 });
  assert.equal(gesture.end(), true, "真实拖拽应抑制后续单击事件");
  assert.deepEqual(events, [
    { kind: "start", point: origin },
    { kind: "move", point: { screenX: 103, screenY: 203 } },
    { kind: "move", point: { screenX: 120, screenY: 210 } },
    { kind: "end" },
  ]);
  gesture.move({ screenX: 140, screenY: 210 });
  assert.equal(gesture.end(), false, "松手后再次结束不重复发送事件");
  assert.equal(events.length, 4, "松手后移动不再属于拖拽");
}

// 拖出后移回起点仍然是拖拽，不能变成抚摸点击。
{
  const { gesture, events } = setup();
  const origin = { screenX: 100, screenY: 200 };
  gesture.begin(origin);
  gesture.move({ screenX: 90, screenY: 200 });
  gesture.move(origin);
  assert.equal(gesture.end(), true);
  assert.equal(events.filter((event) => event.kind === "start").length, 1);
  assert.equal(events.filter((event) => event.kind === "end").length, 1);
  gesture.begin(origin);
  assert.equal(gesture.end(), false, "下一次普通点击不继承上一轮拖拽状态");
}

// 失焦、隐藏或取消共享结束路径；待定按下取消后不遗留手势。
{
  const { gesture, events } = setup();
  gesture.begin({ screenX: 100, screenY: 200 });
  assert.equal(gesture.end(), false);
  gesture.move({ screenX: 140, screenY: 200 });
  assert.equal(events.length, 0, "取消待定按下后，移动不应启动旧拖拽");
  gesture.begin({ screenX: 100, screenY: 200 });
  gesture.move({ screenX: 140, screenY: 200 });
  assert.equal(gesture.end(), true);
  assert.equal(gesture.end(), false, "取消和松手不会重复结束");
  gesture.move({ screenX: 160, screenY: 200 });
  assert.deepEqual(events.map((event) => event.kind), ["start", "move", "end"]);
}

console.log("桌宠点击与拖拽手势测试通过。");
