import { Camera, CanvasElement, StrokeElement, TextElement } from '../../types/canvas';
import { getFontFamilyString } from './fontConstants';
import { getStrokeOutline, getSvgPathFromStroke } from './InkingEngine';

export function renderCommittedCanvas(
  ctx: CanvasRenderingContext2D,
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  camera: Camera,
  width: number,
  height: number,
  dpr: number = window.devicePixelRatio || 1,
  editingTextElementId?: string | null,
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
    } else if (el.type === 'text') {
      if (editingTextElementId && editingTextElementId === el.id) {
        continue;
      }
      renderText(ctx, el);
    }
  }

  ctx.restore();
}

export function renderText(ctx: CanvasRenderingContext2D, textEl: TextElement) {
  ctx.save();
  ctx.font = `${textEl.fontSize}px ${getFontFamilyString(textEl.fontFamily)}`;
  ctx.fillStyle = textEl.color;
  ctx.textBaseline = 'top';

  const lines = textEl.text.split('\n');
  const lineHeightPx = textEl.fontSize * (textEl.lineHeight || 1.25);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], textEl.x, textEl.y + i * lineHeightPx);
  }
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
