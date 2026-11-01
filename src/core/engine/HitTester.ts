import { BoundingBox, CanvasElement } from '../../types/canvas';

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

    // Fast rejection: outside bounding box + threshold
    if (
      point.x < el.x - threshold
      || point.x > el.x + el.width + threshold
      || point.y < el.y - threshold
      || point.y > el.y + el.height + threshold
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
    }
  }

  return null;
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

    const elMinX = el.x;
    const elMaxX = el.x + el.width;
    const elMinY = el.y;
    const elMaxY = el.y + el.height;

    // Check intersection
    const overlaps = !(elMaxX < minX || elMinX > maxX || elMaxY < minY || elMinY > maxY);

    if (overlaps) {
      result.push(id);
    }
  }

  return result;
}

function distanceToSegment(
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
