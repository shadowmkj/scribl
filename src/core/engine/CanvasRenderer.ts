import { Camera, CanvasElement, ShapeElement, StrokeElement } from '../../types/canvas';
import { getStrokeOutline, getSvgPathFromStroke } from './InkingEngine';
import { generateShapePath } from './shapeGeometry';

export function renderCommittedCanvas(
  ctx: CanvasRenderingContext2D,
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  camera: Camera,
  width: number,
  height: number,
  dpr: number = window.devicePixelRatio || 1,
) {
  // Clear full canvas
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width * dpr, height * dpr);
  ctx.restore();

  // Apply Camera transform with DPR
  ctx.save();
  ctx.setTransform(
    camera.zoom * dpr,
    0,
    0,
    camera.zoom * dpr,
    (width / 2 - camera.x * camera.zoom) * dpr,
    (height / 2 - camera.y * camera.zoom) * dpr,
  );

  // Compute Viewport Frustum in World Coordinates
  const halfW = width / (2 * camera.zoom);
  const halfH = height / (2 * camera.zoom);
  const viewMinX = camera.x - halfW;
  const viewMaxX = camera.x + halfW;
  const viewMinY = camera.y - halfH;
  const viewMaxY = camera.y + halfH;

  // Render elements in strict z-index order
  for (const id of elementIds) {
    const el = elements[id];
    if (!el) continue;

    // Viewport Culling check (AABB overlap)
    if (
      el.x + el.width < viewMinX
      || el.x > viewMaxX
      || el.y + el.height < viewMinY
      || el.y > viewMaxY
    ) {
      continue; // Culled out of screen
    }

    if (el.type === 'stroke') {
      renderStroke(ctx, el);
    } else if (el.type === 'shape') {
      renderShape(ctx, el);
    }
  }

  ctx.restore();
}

export function renderShape(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  if (!el.cachedPath2D) {
    el.cachedPath2D = generateShapePath(el);
  }

  ctx.save();

  // Apply Line Style
  if (el.strokeStyle === 'dashed') {
    ctx.setLineDash([el.strokeWidth * 2, el.strokeWidth * 2]);
  } else if (el.strokeStyle === 'dotted') {
    ctx.setLineDash([el.strokeWidth, el.strokeWidth]);
  } else {
    ctx.setLineDash([]);
  }

  // Fill
  if (el.fillColor && el.fillColor !== 'transparent') {
    ctx.fillStyle = el.fillColor;
    ctx.fill(el.cachedPath2D);
  }

  // Stroke
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(el.cachedPath2D);

  ctx.restore();
}

function renderStroke(ctx: CanvasRenderingContext2D, stroke: StrokeElement) {
  ctx.fillStyle = stroke.color;

  if (!stroke.cachedPath2D) {
    const outline = getStrokeOutline(stroke.points, stroke.size, stroke.thinning, stroke.smoothing);
    const pathString = getSvgPathFromStroke(outline);
    if (typeof Path2D !== 'undefined' && pathString) {
      stroke.cachedPath2D = new Path2D(pathString);
    }
  }

  if (stroke.cachedPath2D) {
    ctx.fill(stroke.cachedPath2D);
  }
}
