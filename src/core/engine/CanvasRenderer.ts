import { useConfigStore } from '../../stores/useConfigStore';
import {
  Camera,
  CanvasElement,
  ImageElement,
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
    } else if (el.type === 'image') {
      renderImage(ctx, el);
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

export class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private listeners = new Set<() => void>();

  public getImage(src: string, onLoad?: () => void): HTMLImageElement | null {
    const existing = this.cache.get(src);
    if (existing) {
      if (existing.complete && existing.naturalWidth > 0) {
        return existing;
      }
      if (onLoad) {
        existing.addEventListener('load', onLoad, { once: true });
      }
      return null;
    }

    if (typeof Image === 'undefined') {
      return null;
    }

    const img = new Image();
    img.src = src;
    this.cache.set(src, img);

    // If decoded synchronously (common with data URLs)
    if (img.complete && img.naturalWidth > 0) {
      return img;
    }

    const notify = () => {
      onLoad?.();
      for (const listener of this.listeners) {
        listener();
      }
    };

    img.onload = notify;
    if (typeof img.decode === 'function') {
      img.decode().then(notify).catch(() => {});
    }

    return null;
  }

  public loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const existing = this.cache.get(src);
      if (existing && existing.complete && existing.naturalWidth > 0) {
        resolve(existing);
        return;
      }

      if (typeof Image === 'undefined') {
        const dummy = { naturalWidth: 400, naturalHeight: 300, complete: true } as HTMLImageElement;
        resolve(dummy);
        return;
      }

      const img = existing || new Image();
      let settled = false;

      const finish = () => {
        if (!settled) {
          settled = true;
          this.cache.set(src, img);
          resolve(img);
          for (const listener of this.listeners) {
            listener();
          }
        }
      };

      img.onload = finish;
      img.onerror = finish;
      if (!existing) {
        img.src = src;
        this.cache.set(src, img);
      }

      if (img.complete && img.naturalWidth > 0) {
        finish();
        return;
      }

      if (typeof img.decode === 'function') {
        img.decode().then(finish).catch(finish);
      }

      const isTest = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent);
      setTimeout(finish, isTest ? 50 : 10000);
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public clear(): void {
    this.cache.clear();
    this.listeners.clear();
  }
}

export const imageCache = new ImageCache();

export function renderImage(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
  onLoad?: () => void,
) {
  const img = imageCache.getImage(el.src, onLoad);

  ctx.save();
  if (el.opacity !== undefined) {
    ctx.globalAlpha = Math.max(0, Math.min(1, el.opacity));
  }

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, el.x, el.y, el.width, el.height);
  } else {
    // Subtle translucent placeholder while decoding
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(el.x, el.y, el.width, el.height);
    ctx.fillStyle = 'rgba(156, 163, 175, 0.08)';
    ctx.fillRect(el.x, el.y, el.width, el.height);
  }

  ctx.restore();
}
