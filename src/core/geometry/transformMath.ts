import { CanvasElement, ShapeElement, StrokePoint } from '../../types/canvas';
import { getFontFamilyString } from '../engine/fontConstants';
import { measureTextBounds } from '../engine/textMeasurement';

export type HandleType = 'nw' | 'ne' | 'se' | 'sw';

export interface SelectionBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export function computeSelectionBounds(
  elements: Record<string, CanvasElement>,
  selectedIds: string[],
): SelectionBounds | null {
  if (selectedIds.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasValid = false;

  for (const id of selectedIds) {
    const el = elements[id];
    if (!el) continue;
    hasValid = true;
    if (el.x < minX) minX = el.x;
    if (el.y < minY) minY = el.y;
    if (el.x + el.width > maxX) maxX = el.x + el.width;
    if (el.y + el.height > maxY) maxY = el.y + el.height;
  }

  if (!hasValid) return null;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}

export function getHandlePositions(
  bounds: SelectionBounds,
): Record<HandleType, { x: number; y: number; }> {
  return {
    nw: { x: bounds.minX, y: bounds.minY },
    ne: { x: bounds.maxX, y: bounds.minY },
    se: { x: bounds.maxX, y: bounds.maxY },
    sw: { x: bounds.minX, y: bounds.maxY },
  };
}

export function hitTestHandles(
  screenPoint: { x: number; y: number; },
  screenHandles: Record<HandleType, { x: number; y: number; }>,
  threshold: number = 8,
): HandleType | null {
  const handles: HandleType[] = ['nw', 'ne', 'se', 'sw'];
  for (const handle of handles) {
    const h = screenHandles[handle];
    const dist = Math.hypot(screenPoint.x - h.x, screenPoint.y - h.y);
    if (dist <= threshold) {
      return handle;
    }
  }
  return null;
}

export function scaleShape(
  element: ShapeElement,
  anchor: { x: number; y: number; },
  sx: number,
  sy: number,
): ShapeElement {
  const scaleMagnitude = Math.sqrt(Math.abs(sx * sy));
  const newStrokeWidth = Math.max(0.5, Math.min(256, element.strokeWidth * scaleMagnitude));

  if (element.startPoint && element.endPoint) {
    const newStart = {
      x: anchor.x + (element.startPoint.x - anchor.x) * sx,
      y: anchor.y + (element.startPoint.y - anchor.y) * sy,
    };
    const newEnd = {
      x: anchor.x + (element.endPoint.x - anchor.x) * sx,
      y: anchor.y + (element.endPoint.y - anchor.y) * sy,
    };
    const minX = Math.min(newStart.x, newEnd.x);
    const minY = Math.min(newStart.y, newEnd.y);
    const maxX = Math.max(newStart.x, newEnd.x);
    const maxY = Math.max(newStart.y, newEnd.y);

    return {
      ...element,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      strokeWidth: newStrokeWidth,
      startPoint: newStart,
      endPoint: newEnd,
      cachedPath2D: undefined,
    };
  }

  const p1x = anchor.x + (element.x - anchor.x) * sx;
  const p1y = anchor.y + (element.y - anchor.y) * sy;
  const p2x = anchor.x + (element.x + element.width - anchor.x) * sx;
  const p2y = anchor.y + (element.y + element.height - anchor.y) * sy;

  const minX = Math.min(p1x, p2x);
  const minY = Math.min(p1y, p2y);
  const maxX = Math.max(p1x, p2x);
  const maxY = Math.max(p1y, p2y);

  return {
    ...element,
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    strokeWidth: newStrokeWidth,
    cachedPath2D: undefined,
  };
}

export function rotateShape(
  element: ShapeElement,
  center: { x: number; y: number; },
  rad: number,
): ShapeElement {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const rotatePt = (pt: { x: number; y: number; }) => {
    const dx = pt.x - center.x;
    const dy = pt.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  };

  if (element.startPoint && element.endPoint) {
    const newStart = rotatePt(element.startPoint);
    const newEnd = rotatePt(element.endPoint);
    const minX = Math.min(newStart.x, newEnd.x);
    const minY = Math.min(newStart.y, newEnd.y);
    const maxX = Math.max(newStart.x, newEnd.x);
    const maxY = Math.max(newStart.y, newEnd.y);

    return {
      ...element,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      startPoint: newStart,
      endPoint: newEnd,
      cachedPath2D: undefined,
    };
  }

  const corners = [
    { x: element.x, y: element.y },
    { x: element.x + element.width, y: element.y },
    { x: element.x + element.width, y: element.y + element.height },
    { x: element.x, y: element.y + element.height },
  ];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const c of corners) {
    const rc = rotatePt(c);
    if (rc.x < minX) minX = rc.x;
    if (rc.y < minY) minY = rc.y;
    if (rc.x > maxX) maxX = rc.x;
    if (rc.y > maxY) maxY = rc.y;
  }

  return {
    ...element,
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
    cachedPath2D: undefined,
  };
}

export function scaleElement(
  element: CanvasElement,
  anchor: { x: number; y: number; },
  sx: number,
  sy: number,
): CanvasElement {
  if (element.type === 'stroke') {
    const scaleMagnitude = Math.sqrt(Math.abs(sx * sy));
    const newSize = Math.max(0.5, Math.min(256, element.size * scaleMagnitude));

    const newPoints: StrokePoint[] = element.points.map((pt) => ({
      x: anchor.x + (pt.x - anchor.x) * sx,
      y: anchor.y + (pt.y - anchor.y) * sy,
      pressure: pt.pressure,
    }));

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of newPoints) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      ...element,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      size: newSize,
      points: newPoints,
      cachedPath2D: undefined,
    };
  } else if (element.type === 'text') {
    const scaleMagnitude = Math.sqrt(Math.abs(sx * sy));
    const newFontSize = Math.max(4, Math.min(500, Math.round(element.fontSize * scaleMagnitude)));
    const fontStr = getFontFamilyString(element.fontFamily);
    const bounds = measureTextBounds(
      element.text,
      newFontSize,
      fontStr,
      element.lineHeight || 1.25,
    );

    const originX = element.x - anchor.x;
    const originRight = element.x + element.width - anchor.x;
    const scaledLeft = anchor.x + originX * sx;
    const scaledRight = anchor.x + originRight * sx;

    let newX: number;
    if (sx < 0) {
      newX = scaledLeft - bounds.width;
    } else if (Math.abs(originRight) < Math.abs(originX)) {
      newX = scaledRight - bounds.width;
    } else {
      newX = scaledLeft;
    }

    const originY = element.y - anchor.y;
    const originBottom = element.y + element.height - anchor.y;
    const scaledTop = anchor.y + originY * sy;
    const scaledBottom = anchor.y + originBottom * sy;

    let newY: number;
    if (sy < 0) {
      newY = scaledTop - bounds.height;
    } else if (Math.abs(originBottom) < Math.abs(originY)) {
      newY = scaledBottom - bounds.height;
    } else {
      newY = scaledTop;
    }

    return {
      ...element,
      x: Math.round(newX),
      y: Math.round(newY),
      width: bounds.width,
      height: bounds.height,
      fontSize: newFontSize,
    };
  }

  if (element.type === 'shape') {
    return scaleShape(element, anchor, sx, sy);
  }

  return element;
}

export function rotateElement(
  element: CanvasElement,
  center: { x: number; y: number; },
  rad: number,
): CanvasElement {
  if (element.type === 'stroke') {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const newPoints: StrokePoint[] = element.points.map((pt) => {
      const dx = pt.x - center.x;
      const dy = pt.y - center.y;
      return {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
        pressure: pt.pressure,
      };
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of newPoints) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    return {
      ...element,
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      points: newPoints,
      cachedPath2D: undefined,
    };
  } else if (element.type === 'text') {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const elCenterX = element.x + element.width / 2;
    const elCenterY = element.y + element.height / 2;
    const dx = elCenterX - center.x;
    const dy = elCenterY - center.y;
    const rotatedCenterX = center.x + dx * cos - dy * sin;
    const rotatedCenterY = center.y + dx * sin + dy * cos;
    return {
      ...element,
      x: Math.round(rotatedCenterX - element.width / 2),
      y: Math.round(rotatedCenterY - element.height / 2),
    };
  }

  if (element.type === 'shape') {
    return rotateShape(element, center, rad);
  }

  return element;
}
