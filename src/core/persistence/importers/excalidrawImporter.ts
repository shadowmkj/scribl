import {
  BoundingBox,
  CanvasElement,
  ShapeElement,
  StrokeElement,
  StrokePoint,
  TextElement,
} from '../../../types/canvas';
import { ImportResult } from './types';

interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  roundness?: { type: number; value?: number; } | null;
  points?: [number, number][];
  pressures?: number[];
  text?: string;
  fontSize?: number;
  lineHeight?: number;
  isDeleted?: boolean;
}

interface ExcalidrawDocument {
  type?: string;
  version?: number;
  elements?: ExcalidrawElement[];
  appState?: { name?: string; };
}

export function importExcalidraw(
  json: unknown,
  filename: string = 'Untitled Excalidraw',
): ImportResult {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid Excalidraw data: expected object');
  }

  const doc = json as ExcalidrawDocument;
  const rawElements = Array.isArray(doc.elements) ? doc.elements : [];

  const elements: CanvasElement[] = [];
  const elementIds: string[] = [];
  let discardedCount = 0;
  const discardedTypesSet = new Set<string>();

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const updateBounds = (x: number, y: number, w: number, h: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  };

  rawElements.forEach((el, index) => {
    if (el.isDeleted) return;

    const zIndex = index + 1;
    const elId = el.id || `excalidraw-${index}-${Date.now()}`;

    switch (el.type) {
      case 'freedraw': {
        const rawPoints = Array.isArray(el.points) ? el.points : [];
        const rawPressures = Array.isArray(el.pressures) ? el.pressures : [];

        if (rawPoints.length === 0) break;

        const points: StrokePoint[] = rawPoints.map(([dx, dy], ptIdx) => ({
          x: el.x + dx,
          y: el.y + dy,
          pressure: rawPressures[ptIdx] !== undefined ? rawPressures[ptIdx] : 0.5,
        }));

        const width = el.width || Math.max(...rawPoints.map(([dx]) => Math.abs(dx))) || 10;
        const height = el.height || Math.max(...rawPoints.map(([, dy]) => Math.abs(dy))) || 10;

        const strokeEl: StrokeElement = {
          id: elId,
          type: 'stroke',
          x: el.x,
          y: el.y,
          width,
          height,
          zIndex,
          points,
          color: el.strokeColor || '#000000',
          size: el.strokeWidth || 2,
          thinning: 0.6,
          smoothing: 0.5,
        };

        elements.push(strokeEl);
        elementIds.push(elId);
        updateBounds(el.x, el.y, width, height);
        break;
      }

      case 'rectangle':
      case 'ellipse':
      case 'diamond': {
        const shapeType = el.type === 'ellipse' ? 'circle' : el.type;
        const width = el.width || 40;
        const height = el.height || 40;

        const shapeEl: ShapeElement = {
          id: elId,
          type: 'shape',
          shapeType,
          x: el.x,
          y: el.y,
          width,
          height,
          zIndex,
          strokeColor: el.strokeColor || '#000000',
          fillColor: !el.backgroundColor || el.backgroundColor === 'transparent'
            ? 'transparent'
            : el.backgroundColor,
          strokeWidth: el.strokeWidth || 2,
          strokeStyle: el.strokeStyle === 'dashed' || el.strokeStyle === 'dotted'
            ? el.strokeStyle
            : 'solid',
          borderRadius: el.roundness ? 8 : 0,
        };

        elements.push(shapeEl);
        elementIds.push(elId);
        updateBounds(el.x, el.y, width, height);
        break;
      }

      case 'line':
      case 'arrow': {
        const rawPoints = Array.isArray(el.points) ? el.points : [];
        if (rawPoints.length < 2) break;

        const startPt = rawPoints[0];
        const endPt = rawPoints[rawPoints.length - 1];

        if (el.type === 'line' && rawPoints.length > 2) {
          // Polyline with > 2 points maps to contiguous stroke
          const points: StrokePoint[] = rawPoints.map(([dx, dy]) => ({
            x: el.x + dx,
            y: el.y + dy,
            pressure: 0.5,
          }));

          const width = el.width || Math.abs(endPt[0] - startPt[0]) || 20;
          const height = el.height || Math.abs(endPt[1] - startPt[1]) || 20;

          const polylineEl: StrokeElement = {
            id: elId,
            type: 'stroke',
            x: el.x,
            y: el.y,
            width,
            height,
            zIndex,
            points,
            color: el.strokeColor || '#000000',
            size: el.strokeWidth || 2,
            thinning: 0,
            smoothing: 0,
          };

          elements.push(polylineEl);
          elementIds.push(elId);
          updateBounds(el.x, el.y, width, height);
        } else {
          const width = el.width || Math.abs(endPt[0] - startPt[0]) || 20;
          const height = el.height || Math.abs(endPt[1] - startPt[1]) || 20;

          const lineEl: ShapeElement = {
            id: elId,
            type: 'shape',
            shapeType: el.type,
            x: el.x,
            y: el.y,
            width,
            height,
            zIndex,
            strokeColor: el.strokeColor || '#000000',
            strokeWidth: el.strokeWidth || 2,
            strokeStyle: el.strokeStyle === 'dashed' || el.strokeStyle === 'dotted'
              ? el.strokeStyle
              : 'solid',
            startPoint: { x: el.x + startPt[0], y: el.y + startPt[1] },
            endPoint: { x: el.x + endPt[0], y: el.y + endPt[1] },
          };

          elements.push(lineEl);
          elementIds.push(elId);
          updateBounds(el.x, el.y, width, height);
        }
        break;
      }

      case 'text': {
        const textStr = el.text || '';
        const fontSize = el.fontSize || 20;
        const width = el.width || Math.max(40, textStr.length * (fontSize * 0.6));
        const height = el.height || fontSize * (el.lineHeight || 1.2);

        const textEl: TextElement = {
          id: elId,
          type: 'text',
          x: el.x,
          y: el.y,
          width,
          height,
          zIndex,
          text: textStr,
          fontSize,
          fontFamily: 'Inter, sans-serif',
          color: el.strokeColor || '#000000',
          lineHeight: el.lineHeight || 1.2,
        };

        elements.push(textEl);
        elementIds.push(elId);
        updateBounds(el.x, el.y, width, height);
        break;
      }

      default: {
        discardedCount++;
        if (el.type) {
          discardedTypesSet.add(el.type);
        }
        break;
      }
    }
  });

  const bounds: BoundingBox = elements.length > 0
    ? { minX, minY, maxX, maxY }
    : { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const baseName = doc.appState?.name || filename.replace(/\.(excalidraw|json)$/i, '');

  return {
    format: 'excalidraw',
    name: baseName,
    elements,
    elementIds,
    bounds,
    discardedCount,
    discardedTypes: Array.from(discardedTypesSet),
  };
}
