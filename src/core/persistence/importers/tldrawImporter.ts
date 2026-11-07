import {
  BoundingBox,
  CanvasElement,
  ShapeElement,
  StrokeElement,
  StrokePoint,
  TextElement,
} from '../../../types/canvas';
import { ImportResult } from './types';

export const TLDRAW_COLOR_MAP: Record<string, string> = {
  black: '#1e1e1e',
  grey: '#757575',
  'light-violet': '#cba6f7',
  violet: '#8b5cf6',
  blue: '#0284c7',
  'light-blue': '#38bdf8',
  yellow: '#eab308',
  orange: '#f97316',
  green: '#22c55e',
  'light-green': '#86efac',
  'light-red': '#fca5a5',
  red: '#ef4444',
  white: '#ffffff',
};

export function mapTldrawColor(colorName?: string, defaultColor = '#000000'): string {
  if (!colorName) return defaultColor;
  if (colorName.startsWith('#') || colorName.startsWith('rgb')) return colorName;
  return TLDRAW_COLOR_MAP[colorName] || defaultColor;
}

export function mapTldrawSize(sizeToken?: string): number {
  switch (sizeToken) {
    case 's':
      return 2;
    case 'm':
      return 4;
    case 'l':
      return 8;
    case 'xl':
      return 14;
    default:
      return 4;
  }
}

export function mapTldrawFontSize(sizeToken?: string): number {
  switch (sizeToken) {
    case 's':
      return 16;
    case 'm':
      return 24;
    case 'l':
      return 32;
    case 'xl':
      return 48;
    default:
      return 24;
  }
}

interface TldrawRecord {
  id: string;
  typeName: string;
  type?: string;
  x?: number;
  y?: number;
  props?: Record<string, any>;
  isLocked?: boolean;
}

interface TldrawDocument {
  tldrawFileFormatVersion?: number;
  schema?: any;
  records?: TldrawRecord[] | Record<string, TldrawRecord>;
  name?: string;
}

export function importTldraw(json: unknown, filename: string = 'Untitled tldraw'): ImportResult {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid tldraw data: expected object');
  }

  const doc = json as TldrawDocument;

  let rawRecords: TldrawRecord[] = [];
  if (Array.isArray(doc.records)) {
    rawRecords = doc.records;
  } else if (doc.records && typeof doc.records === 'object') {
    rawRecords = Object.values(doc.records);
  }

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

  // Filter only shape records
  const shapes = rawRecords.filter((r) => r && r.typeName === 'shape');

  shapes.forEach((shape, index) => {
    const zIndex = index + 1;
    const elId = shape.id || `tldraw-${index}-${Date.now()}`;
    const posX = shape.x || 0;
    const posY = shape.y || 0;
    const props = shape.props || {};

    switch (shape.type) {
      case 'draw': {
        const segments = Array.isArray(props.segments) ? props.segments : [];
        const strokeColor = mapTldrawColor(props.color, '#0284c7');
        const strokeSize = mapTldrawSize(props.size);

        segments.forEach((seg: any, segIdx: number) => {
          const rawPts = Array.isArray(seg.points) ? seg.points : [];
          if (rawPts.length === 0) return;

          const points: StrokePoint[] = rawPts.map((pt: any) => ({
            x: posX + (pt.x || 0),
            y: posY + (pt.y || 0),
            pressure: pt.z !== undefined ? pt.z : 0.5,
          }));

          let strokeMinX = Infinity;
          let strokeMinY = Infinity;
          let strokeMaxX = -Infinity;
          let strokeMaxY = -Infinity;

          for (const pt of points) {
            if (pt.x < strokeMinX) strokeMinX = pt.x;
            if (pt.y < strokeMinY) strokeMinY = pt.y;
            if (pt.x > strokeMaxX) strokeMaxX = pt.x;
            if (pt.y > strokeMaxY) strokeMaxY = pt.y;
          }

          const width = Math.max(10, strokeMaxX - strokeMinX);
          const height = Math.max(10, strokeMaxY - strokeMinY);
          const segId = segIdx === 0 ? elId : `${elId}-seg-${segIdx}`;

          const strokeEl: StrokeElement = {
            id: segId,
            type: 'stroke',
            x: strokeMinX,
            y: strokeMinY,
            width,
            height,
            zIndex,
            points,
            color: strokeColor,
            size: strokeSize,
            thinning: 0.6,
            smoothing: 0.5,
          };

          elements.push(strokeEl);
          elementIds.push(segId);
          updateBounds(strokeMinX, strokeMinY, width, height);
        });
        break;
      }

      case 'geo': {
        const geoType = props.geo || 'rectangle';
        if (geoType !== 'rectangle' && geoType !== 'ellipse' && geoType !== 'diamond') {
          discardedCount++;
          discardedTypesSet.add(`geo:${geoType}`);
          break;
        }

        const shapeType = geoType === 'ellipse' ? 'circle' : geoType;
        const width = props.w || 80;
        const height = props.h || 80;
        const strokeColor = mapTldrawColor(props.color, '#000000');
        const fillColor = props.fill && props.fill !== 'none'
          ? mapTldrawColor(props.color, '#000000')
          : 'transparent';

        const shapeEl: ShapeElement = {
          id: elId,
          type: 'shape',
          shapeType,
          x: posX,
          y: posY,
          width,
          height,
          zIndex,
          strokeColor,
          fillColor,
          strokeWidth: mapTldrawSize(props.size),
          strokeStyle: props.dash === 'dashed'
            ? 'dashed'
            : props.dash === 'dotted'
            ? 'dotted'
            : 'solid',
        };

        elements.push(shapeEl);
        elementIds.push(elId);
        updateBounds(posX, posY, width, height);
        break;
      }

      case 'line': {
        const rawPts = props.points ? Object.values(props.points) : [];
        if (rawPts.length < 2) break;

        const startPt = rawPts[0] as { x?: number; y?: number; };
        const endPt = rawPts[rawPts.length - 1] as { x?: number; y?: number; };

        const startX = posX + (startPt.x || 0);
        const startY = posY + (startPt.y || 0);
        const endX = posX + (endPt.x || 0);
        const endY = posY + (endPt.y || 0);

        const width = Math.max(10, Math.abs(endX - startX));
        const height = Math.max(10, Math.abs(endY - startY));

        const lineEl: ShapeElement = {
          id: elId,
          type: 'shape',
          shapeType: 'line',
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          width,
          height,
          zIndex,
          strokeColor: mapTldrawColor(props.color, '#000000'),
          strokeWidth: mapTldrawSize(props.size),
          strokeStyle: props.dash === 'dashed' ? 'dashed' : 'solid',
          startPoint: { x: startX, y: startY },
          endPoint: { x: endX, y: endY },
        };

        elements.push(lineEl);
        elementIds.push(elId);
        updateBounds(Math.min(startX, endX), Math.min(startY, endY), width, height);
        break;
      }

      case 'arrow': {
        const startPt = props.start || { x: 0, y: 0 };
        const endPt = props.end || { x: 50, y: 50 };

        const startX = posX + (startPt.x || 0);
        const startY = posY + (startPt.y || 0);
        const endX = posX + (endPt.x || 0);
        const endY = posY + (endPt.y || 0);

        const width = Math.max(10, Math.abs(endX - startX));
        const height = Math.max(10, Math.abs(endY - startY));

        const arrowEl: ShapeElement = {
          id: elId,
          type: 'shape',
          shapeType: 'arrow',
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          width,
          height,
          zIndex,
          strokeColor: mapTldrawColor(props.color, '#000000'),
          strokeWidth: mapTldrawSize(props.size),
          strokeStyle: props.dash === 'dashed' ? 'dashed' : 'solid',
          startPoint: { x: startX, y: startY },
          endPoint: { x: endX, y: endY },
        };

        elements.push(arrowEl);
        elementIds.push(elId);
        updateBounds(Math.min(startX, endX), Math.min(startY, endY), width, height);
        break;
      }

      case 'text': {
        const textStr = props.text || '';
        const fontSize = mapTldrawFontSize(props.size);
        const width = Math.max(40, textStr.length * (fontSize * 0.6));
        const height = fontSize * 1.3;

        const textEl: TextElement = {
          id: elId,
          type: 'text',
          x: posX,
          y: posY,
          width,
          height,
          zIndex,
          text: textStr,
          fontSize,
          fontFamily: 'Inter, sans-serif',
          color: mapTldrawColor(props.color, '#000000'),
          lineHeight: 1.3,
        };

        elements.push(textEl);
        elementIds.push(elId);
        updateBounds(posX, posY, width, height);
        break;
      }

      default: {
        discardedCount++;
        if (shape.type) {
          discardedTypesSet.add(shape.type);
        }
        break;
      }
    }
  });

  const bounds: BoundingBox = elements.length > 0
    ? { minX, minY, maxX, maxY }
    : { minX: 0, minY: 0, maxX: 0, maxY: 0 };

  const baseName = doc.name || filename.replace(/\.(tldr|json)$/i, '');

  return {
    format: 'tldraw',
    name: baseName,
    elements,
    elementIds,
    bounds,
    discardedCount,
    discardedTypes: Array.from(discardedTypesSet),
  };
}
