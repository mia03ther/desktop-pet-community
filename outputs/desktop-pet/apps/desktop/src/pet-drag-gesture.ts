export type PetDragPoint = { readonly screenX: number; readonly screenY: number };

type PetDragCallbacks = {
  readonly start: (origin: PetDragPoint) => void;
  readonly move: (point: PetDragPoint) => void;
  readonly end: () => void;
};

/** 手动拖拽先等待位移阈值，避免普通点击触发拖拽反应。 */
export function createPetDragGesture(callbacks: PetDragCallbacks) {
  let origin: PetDragPoint | null = null;
  let dragging = false;

  return {
    begin(point: PetDragPoint): void {
      origin = { screenX: point.screenX, screenY: point.screenY };
      dragging = false;
    },
    move(point: PetDragPoint): void {
      if (!origin) return;
      if (!dragging) {
        if (Math.hypot(point.screenX - origin.screenX, point.screenY - origin.screenY) <= 4) return;
        dragging = true;
        // 保留原始按下坐标，宿主据此计算偏移，开始拖动时不会跳位。
        callbacks.start(origin);
      }
      callbacks.move(point);
    },
    end(): boolean {
      const wasDragging = dragging;
      origin = null;
      dragging = false;
      if (wasDragging) callbacks.end();
      return wasDragging;
    },
  };
}
