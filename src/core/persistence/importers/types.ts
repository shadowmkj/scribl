import { BoundingBox, CanvasElement } from '../../../types/canvas';

export type SupportedImportFormat = 'scribl' | 'excalidraw' | 'tldraw';

export interface ImportResult {
  format: SupportedImportFormat;
  name: string;
  elements: CanvasElement[];
  elementIds: string[];
  bounds: BoundingBox;
  discardedCount: number;
  discardedTypes: string[];
}
