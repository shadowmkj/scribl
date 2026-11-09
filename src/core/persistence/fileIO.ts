import { Camera, CanvasElement } from '../../types/canvas';
import { renderShape, renderStroke, renderText } from '../engine/CanvasRenderer';
import { ThemeMode } from '../theme/themeManager';

export * from './importers';

export interface ScriblFileData {
  app: 'scribl';
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  camera: Camera;
  elements: Record<string, CanvasElement>;
  elementIds: string[];
}

export function serializeScriblDoc(
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  camera: Camera,
  name: string = 'Untitled Drawing',
): string {
  // Strip non-serializable cached Path2D
  const cleanElements: Record<string, CanvasElement> = {};
  for (const id of elementIds) {
    const el = elements[id];
    if (el) {
      if (el.type === 'stroke' || el.type === 'shape') {
        const { cachedPath2D: _cached, ...rest } = el;
        cleanElements[id] = rest;
      } else {
        cleanElements[id] = { ...el };
      }
    }
  }

  const fileData: ScriblFileData = {
    app: 'scribl',
    version: 1,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    camera,
    elements: cleanElements,
    elementIds,
  };

  return JSON.stringify(fileData, null, 2);
}

export function parseScriblJSON(jsonString: string): ScriblFileData {
  const data = JSON.parse(jsonString);
  if (!data || data.app !== 'scribl' || !data.elements || !Array.isArray(data.elementIds)) {
    throw new Error('Invalid Scribl document format');
  }
  return data;
}

export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string = 'application/json',
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToPng(
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  themeMode?: ThemeMode,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (elementIds.length === 0) {
      reject(new Error('Canvas is empty'));
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const id of elementIds) {
      const el = elements[id];
      if (!el) continue;
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width > maxX) maxX = el.x + el.width;
      if (el.y + el.height > maxY) maxY = el.y + el.height;
    }

    const padding = 32;
    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);

    const canvas = document.createElement('canvas');
    const dpr = 2; // High-res export
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.scale(dpr, dpr);
    ctx.translate(-minX + padding, -minY + padding);

    for (const id of elementIds) {
      const el = elements[id];
      if (!el) continue;
      if (el.type === 'stroke') {
        renderStroke(ctx, el, themeMode);
      } else if (el.type === 'shape') {
        renderShape(ctx, el, themeMode);
      } else if (el.type === 'text') {
        renderText(ctx, el, themeMode);
      }
    }

    resolve(canvas.toDataURL('image/png'));
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const byteString = atob(parts[1]);
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mime });
}

export async function exportToBlob(
  elements: Record<string, CanvasElement>,
  elementIds: string[],
  themeMode?: ThemeMode,
): Promise<Blob> {
  const dataUrl = await exportToPng(elements, elementIds, themeMode);
  return dataUrlToBlob(dataUrl);
}
