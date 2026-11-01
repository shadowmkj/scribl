import { create } from 'zustand';
import {
  AddElementCommand,
  DeleteElementsCommand,
  MoveElementsCommand,
} from '../core/history/commands';
import { HistoryStack } from '../core/history/HistoryStack';
import { CanvasElement } from '../types/canvas';
import { DocumentData } from '../types/commands';

interface DocumentState extends DocumentData {
  history: HistoryStack;
  canUndo: boolean;
  canRedo: boolean;
  addElement: (element: CanvasElement) => void;
  deleteSelected: () => void;
  moveSelected: (dx: number, dy: number) => void;
  setSelected: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  loadDocument: (data: { elements: Record<string, CanvasElement>; elementIds: string[]; }) => void;
  clearDocument: () => void;
}

const historyInstance = new HistoryStack();

export const useDocumentStore = create<DocumentState>((set, get) => ({
  elements: {},
  elementIds: [],
  selectedIds: [],
  history: historyInstance,
  canUndo: false,
  canRedo: false,

  addElement: (element: CanvasElement) => {
    const { elements, elementIds, selectedIds, history } = get();
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(new AddElementCommand(element), currentData);
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  deleteSelected: () => {
    const { elements, elementIds, selectedIds, history } = get();
    if (selectedIds.length === 0) return;
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(
      new DeleteElementsCommand(selectedIds, currentData),
      currentData,
    );
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  moveSelected: (dx: number, dy: number) => {
    const { elements, elementIds, selectedIds, history } = get();
    if (selectedIds.length === 0 || (dx === 0 && dy === 0)) return;
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(new MoveElementsCommand(selectedIds, dx, dy), currentData);
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  setSelected: (ids: string[]) => {
    set({ selectedIds: ids });
  },

  undo: () => {
    const { elements, elementIds, selectedIds, history } = get();
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.undo(currentData);
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  redo: () => {
    const { elements, elementIds, selectedIds, history } = get();
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.redo(currentData);
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  loadDocument: (data) => {
    historyInstance.clear();
    set({
      elements: data.elements,
      elementIds: data.elementIds,
      selectedIds: [],
      canUndo: false,
      canRedo: false,
    });
  },

  clearDocument: () => {
    historyInstance.clear();
    set({
      elements: {},
      elementIds: [],
      selectedIds: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
