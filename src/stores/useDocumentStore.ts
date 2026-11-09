import { create } from 'zustand';
import { getFontFamilyId, getFontFamilyString } from '../core/engine/fontConstants';
import { measureTextBounds } from '../core/engine/textMeasurement';
import {
  AddElementCommand,
  AddElementsCommand,
  applyElementDelta,
  ClearCanvasCommand,
  DeleteElementsCommand,
  MoveElementsCommand,
  TransformElementsCommand,
} from '../core/history/commands';
import { HistoryStack } from '../core/history/HistoryStack';
import { CanvasElement, PRESET_STROKE_SIZES } from '../types/canvas';
import { Command, DocumentData } from '../types/commands';
import { useToolStore } from './useToolStore';

interface DocumentState extends DocumentData {
  history: HistoryStack;
  canUndo: boolean;
  canRedo: boolean;
  addElement: (element: CanvasElement) => void;
  addElements: (elements: CanvasElement[]) => void;
  insertElements: (elements: CanvasElement[]) => void;
  deleteSelected: () => void;
  deleteElements: (ids: string[]) => void;
  moveSelected: (dx: number, dy: number) => void;
  translateSelected: (dx: number, dy: number) => void;
  commitMoveSelected: (totalDx: number, totalDy: number) => void;
  transformSelectedLive: (updated: Record<string, CanvasElement>) => void;
  commitTransformSelected: (
    initial: Record<string, CanvasElement>,
    final: Record<string, CanvasElement>,
  ) => void;
  updateSelectedStyle: (style: {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    strokeSize?: number;
  }) => void;
  setSelected: (ids: string[]) => void;
  undo: () => void;
  redo: () => void;
  loadDocument: (data: { elements: Record<string, CanvasElement>; elementIds: string[]; }) => void;
  clearDocument: () => void;
  resetDocument: () => void;
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

  insertElements: (elements: CanvasElement[]) => {
    get().addElements(elements);
  },

  deleteElements: (ids: string[]) => {
    if (ids.length === 0) return;
    const { elements, elementIds, selectedIds, history } = get();
    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(
      new DeleteElementsCommand(ids, currentData),
      currentData,
    );
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  deleteSelected: () => {
    get().deleteElements(get().selectedIds);
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

  updateSelectedStyle: (style) => {
    const { selectedIds, elements, history } = get();
    if (selectedIds.length === 0) return;

    const initialElements: Record<string, CanvasElement> = {};
    const finalElements: Record<string, CanvasElement> = {};
    let hasChanges = false;

    for (const id of selectedIds) {
      const el = elements[id];
      if (!el) continue;
      initialElements[id] = el;

      if (el.type === 'text') {
        const nextColor = style.color ?? el.color;
        const nextFontSize = style.fontSize ?? el.fontSize;
        const nextFontFamily = style.fontFamily ?? el.fontFamily;

        if (
          nextColor !== el.color
          || nextFontSize !== el.fontSize
          || nextFontFamily !== el.fontFamily
        ) {
          hasChanges = true;
          const bounds = measureTextBounds(
            el.text,
            nextFontSize,
            getFontFamilyString(nextFontFamily),
            el.lineHeight || 1.25,
          );
          finalElements[id] = {
            ...el,
            color: nextColor,
            fontSize: nextFontSize,
            fontFamily: nextFontFamily,
            width: bounds.width,
            height: bounds.height,
          };
        } else {
          finalElements[id] = el;
        }
      } else if (el.type === 'stroke') {
        const nextColor = style.color ?? el.color;
        const nextSize = style.strokeSize ?? el.size;

        if (nextColor !== el.color || nextSize !== el.size) {
          hasChanges = true;
          finalElements[id] = {
            ...el,
            color: nextColor,
            size: nextSize,
            isResized: style.strokeSize !== undefined ? false : el.isResized,
            cachedPath2D: undefined,
          };
        } else {
          finalElements[id] = el;
        }
      }
    }

    if (hasChanges) {
      history.pushExecuted(
        new TransformElementsCommand([...selectedIds], initialElements, finalElements),
      );
      set({
        elements: { ...elements, ...finalElements },
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
      });
    }
  },

  setSelected: (ids: string[]) => {
    set({ selectedIds: ids });
    if (ids.length > 0) {
      const firstEl = get().elements[ids[0]];
      if (firstEl && firstEl.type === 'text') {
        const toolStore = useToolStore.getState();
        toolStore.setColor(firstEl.color);
        toolStore.setFontSize(firstEl.fontSize);
        toolStore.setFontFamily(getFontFamilyId(firstEl.fontFamily));
      } else if (firstEl && firstEl.type === 'stroke') {
        const toolStore = useToolStore.getState();
        toolStore.setColor(firstEl.color);
        if (!firstEl.isResized && PRESET_STROKE_SIZES.includes(firstEl.size)) {
          toolStore.setStrokeSize(firstEl.size);
        }
      }
    }
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
    if (nextData.selectedIds.length > 0) {
      const firstEl = nextData.elements[nextData.selectedIds[0]];
      if (firstEl && firstEl.type === 'text') {
        const toolStore = useToolStore.getState();
        toolStore.setColor(firstEl.color);
        toolStore.setFontSize(firstEl.fontSize);
        toolStore.setFontFamily(getFontFamilyId(firstEl.fontFamily));
      } else if (firstEl && firstEl.type === 'stroke') {
        const toolStore = useToolStore.getState();
        toolStore.setColor(firstEl.color);
        if (!firstEl.isResized && PRESET_STROKE_SIZES.includes(firstEl.size)) {
          toolStore.setStrokeSize(firstEl.size);
        }
      }
    }
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
    if (nextData.selectedIds.length > 0) {
      const firstEl = nextData.elements[nextData.selectedIds[0]];
      if (firstEl && firstEl.type === 'text') {
        const toolStore = useToolStore.getState();
        toolStore.setColor(firstEl.color);
        toolStore.setFontSize(firstEl.fontSize);
        toolStore.setFontFamily(getFontFamilyId(firstEl.fontFamily));
      } else if (firstEl && firstEl.type === 'stroke') {
        const toolStore = useToolStore.getState();
        toolStore.setColor(firstEl.color);
        if (!firstEl.isResized && PRESET_STROKE_SIZES.includes(firstEl.size)) {
          toolStore.setStrokeSize(firstEl.size);
        }
      }
    }
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
    const { elements, elementIds, selectedIds, history } = get();
    if (elementIds.length === 0) return;

    const currentData: DocumentData = { elements, elementIds, selectedIds };
    const nextData = history.execute(new ClearCanvasCommand(currentData), currentData);
    set({
      ...nextData,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },

  resetDocument: () => {
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
