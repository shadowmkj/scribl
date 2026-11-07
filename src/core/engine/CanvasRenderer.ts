import { useConfigStore } from '../../stores/useConfigStore';
import {
  Camera,
  CanvasElement,
  ShapeElement,
  StrokeElement,
  TextElement,
} from '../../types/canvas';
import { resolveThemeColor } from '../theme/palette';
import { ThemeMode } from '../theme/themeManager';
import { getFontFamilyString } from './fontConstants';
import { getStrokeOutline, getSvgPathFromStroke } from './InkingEngine';
import { generateShapePath } from './shapeGeometry';

export function getActiveThemeMode(): ThemeMode {
  try {
    const storeMode = useConfigStore.getState().config.theme.active?.mode;
    if (storeMode) return storeMode;
  } catch {
    // fallback if store not accessible
  }
  if (typeof document !== 'undefined') {
    const domMode = document.documentElement.getAttribute('data-theme-mode');
    if (domMode === 'light' || domMode === 'dark') return domMode;
  }
  return 'dark';
}

export function resolveCanvasColor(color: string, mode?: ThemeMode): string {
  const targetMode = mode || getActiveThemeMode();
  return resolveThemeColor(color, targetMode);
}

export function renderCommittedCanvas(
  ctx: CanvasRenderingContext2D,
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  camera: Camera,
  width: number,
  height: number,
  dpr: number = window.devicePixelRatio || 1,
  editingTextElementId?: string | null,
  themeMode?: ThemeMode,
) {
  const mode = themeMode || getActiveThemeMode();

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
      renderStroke(ctx, el, mode);
    } else if (el.type === 'shape') {
      renderShape(ctx, el, mode);
    } else if (el.type === 'text') {
      if (editingTextElementId && editingTextElementId === el.id) {
        continue;
      }
      renderText(ctx, el, mode);
    }
  }

  ctx.restore();
}

export function renderText(
  ctx: CanvasRenderingContext2D,
  textEl: TextElement,
  mode?: ThemeMode,
) {
  ctx.save();
  ctx.font = `${textEl.fontSize}px ${getFontFamilyString(textEl.fontFamily)}`;
  ctx.fillStyle = resolveCanvasColor(textEl.color, mode);
  ctx.textBaseline = 'top';

  const lines = (textEl.text ?? '').split('\n');
  const lineHeightPx = textEl.fontSize * (textEl.lineHeight || 1.25);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\t/g, '  ');
    ctx.fillText(line, textEl.x, textEl.y + i * lineHeightPx);
  }
  ctx.restore();
}

export function renderShape(
  ctx: CanvasRenderingContext2D,
  el: ShapeElement,
  mode?: ThemeMode,
) {
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
    ctx.fillStyle = resolveCanvasColor(el.fillColor, mode);
    ctx.fill(el.cachedPath2D);
  }

  // Stroke
  ctx.strokeStyle = resolveCanvasColor(el.strokeColor, mode);
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(el.cachedPath2D);

  ctx.restore();
}

export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeElement,
  mode?: ThemeMode,
) {
  ctx.fillStyle = resolveCanvasColor(stroke.color, mode);

  if (!stroke.cachedPath2D) {
    const outline = getStrokeOutline(
      stroke.points,
      stroke.size,
      stroke.thinning,
      stroke.smoothing,
    );
    const pathString = getSvgPathFromStroke(outline);
    if (typeof Path2D !== 'undefined' && pathString) {
      stroke.cachedPath2D = new Path2D(pathString);
    }
  }

  if (stroke.cachedPath2D) {
    ctx.fill(stroke.cachedPath2D);
  }
}
