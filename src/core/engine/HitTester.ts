import { BoundingBox, CanvasElement, ShapeElement } from '../../types/canvas';

export function hitTestPoint(
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  point: { x: number; y: number; },
  threshold: number = 8,
): string | null {
  // Check from top z-index down
  for (let i = elementIds.length - 1; i >= 0; i--) {
    const id = elementIds[i];
    const el = elements[id];
    if (!el) continue;

    let minX = Math.min(el.x, el.x + el.width);
    let maxX = Math.max(el.x, el.x + el.width);
    let minY = Math.min(el.y, el.y + el.height);
    let maxY = Math.max(el.y, el.y + el.height);

    if (el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')) {
      if (el.startPoint) {
        minX = Math.min(minX, el.startPoint.x);
        maxX = Math.max(maxX, el.startPoint.x);
        minY = Math.min(minY, el.startPoint.y);
        maxY = Math.max(maxY, el.startPoint.y);
      }
      if (el.endPoint) {
        minX = Math.min(minX, el.endPoint.x);
        maxX = Math.max(maxX, el.endPoint.x);
        minY = Math.min(minY, el.endPoint.y);
        maxY = Math.max(maxY, el.endPoint.y);
      }
    }

    const extraMargin = el.type === 'shape' && el.shapeType === 'arrow' ? 24 : 0;
    const margin =
      (el.type === 'stroke' ? el.size / 2 : el.type === 'shape' ? el.strokeWidth / 2 : 0)
      + threshold
      + extraMargin;

    // Fast rejection: outside bounding box + margin
    if (
      point.x < minX - margin
      || point.x > maxX + margin
      || point.y < minY - margin
      || point.y > maxY + margin
    ) {
      continue;
    }

    if (el.type === 'stroke') {
      for (let j = 0; j < el.points.length - 1; j++) {
        const p1 = el.points[j];
        const p2 = el.points[j + 1];
        const dist = distanceToSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
        if (dist <= el.size / 2 + threshold) {
          return el.id;
        }
      }
    } else if (el.type === 'shape') {
      if (hitTestShape(el, point, threshold)) {
        return el.id;
      }
    } else if (el.type === 'text') {
      if (
        point.x >= el.x - threshold
        && point.x <= el.x + el.width + threshold
        && point.y >= el.y - threshold
        && point.y <= el.y + el.height + threshold
      ) {
        return el.id;
      }
    }
  }

  return null;
}

export function hitTestShape(
  shape: ShapeElement,
  point: { x: number; y: number; },
  threshold: number = 8,
): boolean {
  const strokeTolerance = Math.max(0, shape.strokeWidth || 0) / 2 + threshold;

  switch (shape.shapeType) {
    case 'rectangle': {
      const { x, y, width, height, borderRadius = 0 } = shape;
      const minX = Math.min(x, x + width);
      const maxX = Math.max(x, x + width);
      const minY = Math.min(y, y + height);
      const maxY = Math.max(y, y + height);
      const w = maxX - minX;
      const h = maxY - minY;

      if (isShapeFilled(shape)) {
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
          if (borderRadius > 0) {
            const r = Math.min(borderRadius, w / 2, h / 2);
            const inCornerExclusion = (point.x < minX + r
              && point.y < minY + r
              && Math.hypot(point.x - (minX + r), point.y - (minY + r)) > r)
              || (point.x > maxX - r
                && point.y < minY + r
                && Math.hypot(point.x - (maxX - r), point.y - (minY + r)) > r)
              || (point.x < minX + r
                && point.y > maxY - r
                && Math.hypot(point.x - (minX + r), point.y - (maxY - r)) > r)
              || (point.x > maxX - r
                && point.y > maxY - r
                && Math.hypot(point.x - (maxX - r), point.y - (maxY - r)) > r);
            if (!inCornerExclusion) return true;
          } else {
            return true;
          }
        }
      }

      const r = borderRadius > 0 ? Math.min(borderRadius, w / 2, h / 2) : 0;
      if (r === 0) {
        const d1 = distanceToSegment(point.x, point.y, minX, minY, maxX, minY);
        const d2 = distanceToSegment(point.x, point.y, maxX, minY, maxX, maxY);
        const d3 = distanceToSegment(point.x, point.y, maxX, maxY, minX, maxY);
        const d4 = distanceToSegment(point.x, point.y, minX, maxY, minX, minY);
        return Math.min(d1, d2, d3, d4) <= strokeTolerance;
      } else {
        const d1 = distanceToSegment(point.x, point.y, minX + r, minY, maxX - r, minY);
        const d2 = distanceToSegment(point.x, point.y, maxX, minY + r, maxX, maxY - r);
        const d3 = distanceToSegment(point.x, point.y, maxX - r, maxY, minX + r, maxY);
        const d4 = distanceToSegment(point.x, point.y, minX, maxY - r, minX, minY + r);
        const c1 = point.x <= minX + r && point.y <= minY + r
          ? Math.abs(Math.hypot(point.x - (minX + r), point.y - (minY + r)) - r)
          : Infinity;
        const c2 = point.x >= maxX - r && point.y <= minY + r
          ? Math.abs(Math.hypot(point.x - (maxX - r), point.y - (minY + r)) - r)
          : Infinity;
        const c3 = point.x >= maxX - r && point.y >= maxY - r
          ? Math.abs(Math.hypot(point.x - (maxX - r), point.y - (maxY - r)) - r)
          : Infinity;
        const c4 = point.x <= minX + r && point.y >= maxY - r
          ? Math.abs(Math.hypot(point.x - (minX + r), point.y - (maxY - r)) - r)
          : Infinity;
        return Math.min(d1, d2, d3, d4, c1, c2, c3, c4) <= strokeTolerance;
      }
    }

    case 'circle': {
      const rx = Math.max(0.1, Math.abs(shape.width) / 2);
      const ry = Math.max(0.1, Math.abs(shape.height) / 2);
      const cx = shape.x + Math.abs(shape.width) / 2;
      const cy = shape.y + Math.abs(shape.height) / 2;

      const dx = point.x - cx;
      const dy = point.y - cy;
      const normalizedDistSq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

      if (isShapeFilled(shape) && normalizedDistSq <= 1) {
        return true;
      }

      let distToPerimeter: number;
      if (dx === 0 && dy === 0) {
        distToPerimeter = Math.min(rx, ry);
      } else {
        const angle = Math.atan2(dy, dx);
        const px = cx + rx * Math.cos(angle);
        const py = cy + ry * Math.sin(angle);
        distToPerimeter = Math.hypot(point.x - px, point.y - py);
      }

      return distToPerimeter <= strokeTolerance;
    }

    case 'diamond': {
      const midX = shape.x + shape.width / 2;
      const midY = shape.y + shape.height / 2;
      const hw = Math.abs(shape.width) / 2;
      const hh = Math.abs(shape.height) / 2;

      if (hw === 0 && hh === 0) {
        return Math.hypot(point.x - midX, point.y - midY) <= strokeTolerance;
      }

      const isInside = hw > 0 && hh > 0
        ? Math.abs(point.x - midX) / hw + Math.abs(point.y - midY) / hh <= 1
        : false;

      if (isShapeFilled(shape) && isInside) {
        return true;
      }

      const d1 = distanceToSegment(point.x, point.y, midX, shape.y, shape.x + shape.width, midY);
      const d2 = distanceToSegment(
        point.x,
        point.y,
        shape.x + shape.width,
        midY,
        midX,
        shape.y + shape.height,
      );
      const d3 = distanceToSegment(
        point.x,
        point.y,
        midX,
        shape.y + shape.height,
        shape.x,
        midY,
      );
      const d4 = distanceToSegment(point.x, point.y, shape.x, midY, midX, shape.y);

      return Math.min(d1, d2, d3, d4) <= strokeTolerance;
    }

    case 'line': {
      const p1 = shape.startPoint ?? { x: shape.x, y: shape.y };
      const p2 = shape.endPoint ?? { x: shape.x + shape.width, y: shape.y + shape.height };
      const dist = distanceToSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
      return dist <= strokeTolerance;
    }

    case 'arrow': {
      const p1 = shape.startPoint ?? { x: shape.x, y: shape.y };
      const p2 = shape.endPoint ?? { x: shape.x + shape.width, y: shape.y + shape.height };
      const distMain = distanceToSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y);

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const arrowLength = Math.max(10, Math.min(24, shape.strokeWidth * 4));
      const arrowAngle = Math.PI / 6;

      const a1X = p2.x - arrowLength * Math.cos(angle - arrowAngle);
      const a1Y = p2.y - arrowLength * Math.sin(angle - arrowAngle);
      const a2X = p2.x - arrowLength * Math.cos(angle + arrowAngle);
      const a2Y = p2.y - arrowLength * Math.sin(angle + arrowAngle);

      const distBarb1 = distanceToSegment(point.x, point.y, p2.x, p2.y, a1X, a1Y);
      const distBarb2 = distanceToSegment(point.x, point.y, p2.x, p2.y, a2X, a2Y);

      return Math.min(distMain, distBarb1, distBarb2) <= strokeTolerance;
    }

    default:
      return false;
  }
}

function isShapeFilled(shape: ShapeElement): boolean {
  if (!shape.fillColor) return false;
  const fill = shape.fillColor.trim().toLowerCase();
  return (
    fill !== 'transparent'
    && fill !== 'none'
    && fill !== 'rgba(0, 0, 0, 0)'
    && fill !== 'rgba(0,0,0,0)'
  );
}

export function hitTestMarquee(
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  bounds: BoundingBox,
): string[] {
  const result: string[] = [];
  const minX = Math.min(bounds.minX, bounds.maxX);
  const maxX = Math.max(bounds.minX, bounds.maxX);
  const minY = Math.min(bounds.minY, bounds.maxY);
  const maxY = Math.max(bounds.minY, bounds.maxY);

  for (const id of elementIds) {
    const el = elements[id];
    if (!el) continue;

    let elMinX = Math.min(el.x, el.x + el.width);
    let elMaxX = Math.max(el.x, el.x + el.width);
    let elMinY = Math.min(el.y, el.y + el.height);
    let elMaxY = Math.max(el.y, el.y + el.height);

    if (el.type === 'shape' && (el.shapeType === 'line' || el.shapeType === 'arrow')) {
      if (el.startPoint) {
        elMinX = Math.min(elMinX, el.startPoint.x);
        elMaxX = Math.max(elMaxX, el.startPoint.x);
        elMinY = Math.min(elMinY, el.startPoint.y);
        elMaxY = Math.max(elMaxY, el.startPoint.y);
      }
      if (el.endPoint) {
        elMinX = Math.min(elMinX, el.endPoint.x);
        elMaxX = Math.max(elMaxX, el.endPoint.x);
        elMinY = Math.min(elMinY, el.endPoint.y);
        elMaxY = Math.max(elMaxY, el.endPoint.y);
      }
    }

    // Check intersection
    const overlaps = !(elMaxX < minX || elMinX > maxX || elMaxY < minY || elMinY > maxY);

    if (overlaps) {
      result.push(id);
    }
  }

  return result;
}

export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}
