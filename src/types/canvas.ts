export interface Camera {
  x: number;
  y: number;
  zoom: number; // 0.1 to 8.0
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export interface BaseElement {
  id: string;
  type: 'stroke' | 'rectangle' | 'ellipse' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface StrokeElement extends BaseElement {
  type: 'stroke';
  points: StrokePoint[];
  color: string;
  size: number;
  thinning: number;
  smoothing: number;
  cachedPath2D?: Path2D;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  lineHeight: number;
}

export type CanvasElement = StrokeElement | TextElement;

export type ToolType = 'select' | 'pen' | 'eraser' | 'zoom' | 'text';

export type ZoomMode = 'scrubby' | 'selection';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
