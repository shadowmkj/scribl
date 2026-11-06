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
  type: string;
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

export type ShapeType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'diamond';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: ShapeType;
  strokeColor: string;
  fillColor?: string; // hex, rgba, or 'transparent'
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  borderRadius?: number;
  startPoint?: { x: number; y: number; };
  endPoint?: { x: number; y: number; };
  cachedPath2D?: Path2D;
}

export type CanvasElement = StrokeElement | ShapeElement;

export type ToolType =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'zoom'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'line'
  | 'arrow';

export type ZoomMode = 'scrubby' | 'selection';

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
