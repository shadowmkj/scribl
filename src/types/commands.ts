import { CanvasElement } from './canvas';

export interface DocumentData {
  elements: Record<string, CanvasElement>;
  elementIds: string[];
  selectedIds: string[];
}

export interface Command {
  id: string;
  name: string;
  execute: (data: DocumentData) => DocumentData;
  undo: (data: DocumentData) => DocumentData;
}
