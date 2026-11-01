import { getStroke } from 'perfect-freehand';
import { BoundingBox, StrokeElement, StrokePoint } from '../../types/canvas';

export function getStrokeOutline(
  points: StrokePoint[],
  size: number,
  thinning: number = 0.6,
  smoothing: number = 0.5,
): number[][] {
  if (points.length === 0) return [];
  return getStroke(points, {
    size,
    thinning,
    smoothing,
    streamline: smoothing,
    simulatePressure: false,
    last: true,
  });
}

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (stroke.length === 0) return '';
  const d: (string | number)[] = [];
  const [first, ...rest] = stroke;
  d.push('M', first[0].toFixed(2), first[1].toFixed(2), 'Q');

  for (let i = 0; i < rest.length; i++) {
    const [p0x, p0y] = rest[i];
    const [p1x, p1y] = rest[(i + 1) % rest.length];
    const midX = ((p0x + p1x) / 2).toFixed(2);
    const midY = ((p0y + p1y) / 2).toFixed(2);
    d.push(p0x.toFixed(2), p0y.toFixed(2), midX, midY);
  }

  d.push('Z');
  return d.join(' ');
}

export function computeBoundingBox(points: StrokePoint[], strokeSize: number): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pt of points) {
    if (pt.x < minX) minX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y > maxY) maxY = pt.y;
  }

  const padding = strokeSize * 1.5;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
}

export function createStrokeElement(
  points: StrokePoint[],
  color: string,
  size: number,
  zIndex: number,
): StrokeElement {
  const bbox = computeBoundingBox(points, size);
  const outline = getStrokeOutline(points, size);
  const pathString = getSvgPathFromStroke(outline);
  const path2D = typeof Path2D !== 'undefined' && pathString ? new Path2D(pathString) : undefined;

  return {
    id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type: 'stroke',
    x: bbox.minX,
    y: bbox.minY,
    width: Math.max(1, bbox.maxX - bbox.minX),
    height: Math.max(1, bbox.maxY - bbox.minY),
    zIndex,
    points,
    color,
    size,
    thinning: 0.6,
    smoothing: 0.5,
    cachedPath2D: path2D,
  };
}
