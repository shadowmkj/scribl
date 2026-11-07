import { SupportedImportFormat } from './types';

export function detectDrawingFormat(data: unknown): SupportedImportFormat {
  if (!data || typeof data !== 'object') {
    throw new Error(
      'Unrecognized drawing format. Please select a valid .scribl, .excalidraw, or .tldr file.',
    );
  }

  const obj = data as Record<string, unknown>;

  // Scribl detection
  if (
    obj.app === 'scribl'
    && Array.isArray(obj.elementIds)
    && typeof obj.elements === 'object'
  ) {
    return 'scribl';
  }

  // Excalidraw detection
  if (
    obj.type === 'excalidraw'
    || (Array.isArray(obj.elements) && !('tldrawFileFormatVersion' in obj))
  ) {
    return 'excalidraw';
  }

  // tldraw detection (v2 stores)
  if (
    'tldrawFileFormatVersion' in obj
    || (obj.schema && typeof obj.schema === 'object')
    || (obj.records && (Array.isArray(obj.records) || typeof obj.records === 'object'))
  ) {
    return 'tldraw';
  }

  throw new Error(
    'Unrecognized drawing format. Please select a valid .scribl, .excalidraw, or .tldr file.',
  );
}
