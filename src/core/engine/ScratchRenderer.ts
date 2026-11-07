import { useCameraStore } from '../../stores/useCameraStore';
import { Camera, ShapeElement, StrokePoint } from '../../types/canvas';
import { renderShape, resolveCanvasColor } from './CanvasRenderer';
import { getStrokeOutline, getSvgPathFromStroke } from './InkingEngine';

export interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class ScratchRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private activePoints: StrokePoint[] = [];
  private color: string = '#0284c7';
  private strokeSize: number = 4;
  private isDrawing: boolean = false;
  private activeShapePreview: ShapeElement | null = null;

  // Eraser trail animation state
  private eraserTrail: TrailPoint[] = [];
  private isErasing: boolean = false;
  private animFrameId: number | null = null;
  private readonly TRAIL_DURATION = 180; // ms

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      desynchronized: true, // Native low-latency 240Hz front-buffer compositor bypass
      alpha: true,
    });
  }

  startStroke(initialPoint: StrokePoint, color: string, strokeSize: number) {
    this.activePoints = [initialPoint];
    this.color = color;
    this.strokeSize = strokeSize;
    this.isDrawing = true;
  }

  addPoint(point: StrokePoint) {
    if (!this.isDrawing) return;
    const last = this.activePoints[this.activePoints.length - 1];
    // Deduplication: skip points closer than 0.75 world units to avoid micro-jitter
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx * dx + dy * dy < 0.5625) return;
    }
    this.activePoints.push(point);
  }

  startEraserTrail(initialPoint: { x: number; y: number; }) {
    this.isErasing = true;
    this.eraserTrail = [{ ...initialPoint, timestamp: performance.now() }];
    this.startAnimLoop();
  }

  addEraserTrailPoint(point: { x: number; y: number; }) {
    if (!this.isErasing) return;
    const last = this.eraserTrail[this.eraserTrail.length - 1];
    if (last) {
      const dx = point.x - last.x;
      const dy = point.y - last.y;
      if (dx * dx + dy * dy < 1.0) return;
    }
    this.eraserTrail.push({ ...point, timestamp: performance.now() });
  }

  stopEraserTrail() {
    this.isErasing = false;
  }

  setShapePreview(shape: ShapeElement | null) {
    this.activeShapePreview = shape;
  }

  getShapePreview(): ShapeElement | null {
    return this.activeShapePreview;
  }

  private startAnimLoop() {
    if (this.animFrameId !== null) return;

    const tick = () => {
      const { camera, viewportWidth, viewportHeight } = useCameraStore.getState();
      this.render(camera, viewportWidth, viewportHeight);

      if (this.isErasing || this.eraserTrail.length > 0) {
        this.animFrameId = requestAnimationFrame(tick);
      } else {
        this.animFrameId = null;
        this.clear(viewportWidth, viewportHeight);
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  render(
    camera: Camera,
    width: number,
    height: number,
    dpr: number = window.devicePixelRatio || 1,
  ) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, width * dpr, height * dpr);
    this.ctx.restore();

    // 1. Render in-progress drawing stroke
    if (this.activePoints.length > 0) {
      this.ctx.save();
      this.ctx.setTransform(
        camera.zoom * dpr,
        0,
        0,
        camera.zoom * dpr,
        (width / 2 - camera.x * camera.zoom) * dpr,
        (height / 2 - camera.y * camera.zoom) * dpr,
      );

      const outline = getStrokeOutline(this.activePoints, this.strokeSize);
      const pathString = getSvgPathFromStroke(outline);
      if (pathString && typeof Path2D !== 'undefined') {
        this.ctx.fillStyle = resolveCanvasColor(this.color);
        this.ctx.fill(new Path2D(pathString));
      }

      this.ctx.restore();
    }

    // 2. Render shape preview
    if (this.activeShapePreview) {
      this.ctx.save();
      this.ctx.setTransform(
        camera.zoom * dpr,
        0,
        0,
        camera.zoom * dpr,
        (width / 2 - camera.x * camera.zoom) * dpr,
        (height / 2 - camera.y * camera.zoom) * dpr,
      );

      renderShape(this.ctx, this.activeShapePreview);

      this.ctx.restore();
    }

    // 3. Render animated eraser trail
    const now = performance.now();
    this.eraserTrail = this.eraserTrail.filter((p) => now - p.timestamp < this.TRAIL_DURATION);

    if (this.eraserTrail.length >= 2) {
      this.ctx.save();
      this.ctx.setTransform(
        camera.zoom * dpr,
        0,
        0,
        camera.zoom * dpr,
        (width / 2 - camera.x * camera.zoom) * dpr,
        (height / 2 - camera.y * camera.zoom) * dpr,
      );

      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      for (let i = 0; i < this.eraserTrail.length - 1; i++) {
        const p1 = this.eraserTrail[i];
        const p2 = this.eraserTrail[i + 1];
        const age = now - p2.timestamp;
        const progress = Math.min(1, Math.max(0, age / this.TRAIL_DURATION));
        const alpha = 1 - progress;

        if (alpha <= 0.02) continue;

        // Clean, simple grayish stroke that gently fades out
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.strokeStyle = `rgba(148, 163, 184, ${(alpha * 0.45).toFixed(3)})`;
        this.ctx.lineWidth = 12 * (0.3 + 0.7 * alpha);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  finishStroke(): StrokePoint[] {
    this.isDrawing = false;
    const points = [...this.activePoints];
    this.activePoints = [];
    return points;
  }

  clear(width: number, height: number, dpr: number = window.devicePixelRatio || 1) {
    this.activeShapePreview = null;
    if (this.ctx && this.canvas) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, width * dpr, height * dpr);
      this.ctx.restore();
    }
  }
}
