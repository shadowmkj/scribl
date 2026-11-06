import { create } from 'zustand';
import {
  AddElementCommand,
  AddElementsCommand,
  applyElementDelta,
  DeleteElementsCommand,
  MoveElementsCommand,
  TransformElementsCommand,
} from '../core/history/commands';
import { HistoryStack } from '../core/history/HistoryStack';
import { CanvasElement } from '../types/canvas';
import { Command, DocumentData } from '../types/commands';

interface DocumentState extends DocumentData {
  history: HistoryStack;
  canUndo: boolean;
  canRedo: boolean;
  addElement: (element: CanvasElement) => void;
  addElements: (elements: CanvasElement[]) => void;
  deleteSelected: () => void;
  moveSelected: (dx: number, dy: number) => void;
  translateSelected: (dx: number, dy: number) => void;
  commitMoveSelected: (totalDx: number, totalDy: number) => void;
  transformSelectedLive: (updated: Record<string, CanvasElement>) => void;
  commitTransformSelected: (
    initial: Record<string, CanvasElement>,
    final: Record<string, CanvasElement>,
  ) => void;
  setSelected: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  loadDocument: (data: { elements: Record<string, CanvasElement>; elementIds: string[]; }) => void;
  clearDocument: () => void;
  executeCommand: (command: Command) => void;
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

  addElements: (newElements: CanvasElement[]) => {
    if (newElements.length === 0) return;
    const { elements, elementIds, selectedIds, history } = get();
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(new AddElementsCommand(newElements), currentData);
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

  translateSelected: (dx: number, dy: number) => {
    const { elements, selectedIds } = get();
    if (selectedIds.length === 0 || (dx === 0 && dy === 0)) return;
    const nextElements = { ...elements };
    for (const id of selectedIds) {
      const el = nextElements[id];
      if (el) {
        nextElements[id] = applyElementDelta(el, dx, dy);
      }
    }
    set({ elements: nextElements });
  },

  commitMoveSelected: (totalDx: number, totalDy: number) => {
    const { selectedIds, history } = get();
    if (selectedIds.length === 0 || (totalDx === 0 && totalDy === 0)) return;
    history.pushExecuted(new MoveElementsCommand([...selectedIds], totalDx, totalDy));
    set({
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  transformSelectedLive: (updated: Record<string, CanvasElement>) => {
    set((state) => ({
      elements: { ...state.elements, ...updated },
    }));
  },

  commitTransformSelected: (
    initial: Record<string, CanvasElement>,
    final: Record<string, CanvasElement>,
  ) => {
    const { selectedIds, history } = get();
    if (selectedIds.length === 0) return;
    history.pushExecuted(new TransformElementsCommand([...selectedIds], initial, final));
    set({
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

  executeCommand: (command) => {
    const { elements, elementIds, selectedIds, history } = get();
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(command, currentData);
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },
}));
