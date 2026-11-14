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
  locked?: boolean;
}

export interface StrokeElement extends BaseElement {
  type: 'stroke';
  points: StrokePoint[];
  color: string;
  size: number;
  thinning: number;
  smoothing: number;
  isResized?: boolean;
  cachedPath2D?: Path2D;
}

export type ShapeType = 'line' | 'arrow' | 'rectangle' | 'circle' | 'diamond';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export const PRESET_STROKE_SIZES: readonly number[] = [2, 4, 8, 16];

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

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  lineHeight: number;
}

export type CanvasElement = StrokeElement | ShapeElement | TextElement;

export type ToolType =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'zoom'
  | 'text'
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
