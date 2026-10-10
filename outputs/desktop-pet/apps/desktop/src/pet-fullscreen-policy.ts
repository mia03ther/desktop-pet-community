/** 只比较同一坐标系中的客户区与显示器，避免把普通最大化误认为全屏。 */
interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function isForegroundFullscreenOnDisplay(
  foreground: { readonly ownerPid: number; readonly contentBounds: Bounds | null } | null,
  ownProcessId: number,
  displayBounds: Bounds,
): boolean {
  const content = foreground?.contentBounds;
  if (!content || foreground.ownerPid === ownProcessId) return false;
  if (![content.x, content.y, content.width, content.height, displayBounds.x, displayBounds.y, displayBounds.width, displayBounds.height].every(Number.isFinite)) return false;
  if (content.width <= 0 || content.height <= 0 || displayBounds.width <= 0 || displayBounds.height <= 0) return false;
  // 允许原生坐标转 DIP 时的舍入误差，不能把任务栏高度当作容差。
  const tolerance = 2;
  return content.x <= displayBounds.x + tolerance
    && content.y <= displayBounds.y + tolerance
    && content.x + content.width >= displayBounds.x + displayBounds.width - tolerance
    && content.y + content.height >= displayBounds.y + displayBounds.height - tolerance;
}
