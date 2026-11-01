import { Camera, StrokePoint } from '../../types/canvas';
import { getStrokeOutline, getSvgPathFromStroke } from './InkingEngine';

export class ScratchRenderer {
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private activePoints: StrokePoint[] = [];
  private color: string = '#0284c7';
  private strokeSize: number = 4;
  private isDrawing: boolean = false;

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

  render(camera: Camera, width: number, height: number, dpr: number = window.devicePixelRatio || 1) {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, width * dpr, height * dpr);
    this.ctx.restore();

    if (this.activePoints.length === 0) return;

    this.ctx.save();
    this.ctx.setTransform(
      camera.zoom * dpr,
      0,
      0,
      camera.zoom * dpr,
      (width / 2 - camera.x * camera.zoom) * dpr,
      (height / 2 - camera.y * camera.zoom) * dpr
    );

    const outline = getStrokeOutline(this.activePoints, this.strokeSize);
    const pathString = getSvgPathFromStroke(outline);
    if (pathString && typeof Path2D !== 'undefined') {
      this.ctx.fillStyle = this.color;
      this.ctx.fill(new Path2D(pathString));
    }

    this.ctx.restore();
  }

  finishStroke(): StrokePoint[] {
    this.isDrawing = false;
    const points = [...this.activePoints];
    this.activePoints = [];
    return points;
  }

  clear(width: number, height: number, dpr: number = window.devicePixelRatio || 1) {
    if (this.ctx && this.canvas) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, width * dpr, height * dpr);
      this.ctx.restore();
    }
  }
}
