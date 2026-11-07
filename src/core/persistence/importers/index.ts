import { BoundingBox, CanvasElement } from '../../../types/canvas';
import { parseScriblJSON } from '../fileIO';
import { detectDrawingFormat } from './detector';
import { importExcalidraw } from './excalidrawImporter';
import { importTldraw } from './tldrawImporter';
import { ImportResult, SupportedImportFormat } from './types';

export * from './detector';
export * from './excalidrawImporter';
export * from './tldrawImporter';
export * from './types';

export function importDrawingDocument(
  fileContent: string,
  filename: string = 'Untitled Drawing',
): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fileContent);
  } catch (e) {
    throw new Error(`Could not parse drawing JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  const format: SupportedImportFormat = detectDrawingFormat(parsed);

  switch (format) {
    case 'scribl': {
      const scriblDoc = parseScriblJSON(fileContent);
      const elements: CanvasElement[] = [];
      const elementIds: string[] = scriblDoc.elementIds || [];

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const id of elementIds) {
        const el = scriblDoc.elements[id];
        if (el) {
          elements.push(el);
          if (el.x < minX) minX = el.x;
          if (el.y < minY) minY = el.y;
          if (el.x + el.width > maxX) maxX = el.x + el.width;
          if (el.y + el.height > maxY) maxY = el.y + el.height;
        }
      }

      const bounds: BoundingBox = elements.length > 0
        ? { minX, minY, maxX, maxY }
        : { minX: 0, minY: 0, maxX: 0, maxY: 0 };

      return {
        format: 'scribl',
        name: scriblDoc.name || filename.replace(/\.scribl$/i, ''),
        elements,
        elementIds,
        bounds,
        discardedCount: 0,
        discardedTypes: [],
      };
    }

    case 'excalidraw':
      return importExcalidraw(parsed, filename);

    case 'tldraw':
      return importTldraw(parsed, filename);
  }
}
