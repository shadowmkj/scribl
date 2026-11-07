import { create } from 'zustand';
import { FontFamilyId } from '../core/engine/fontConstants';
import { ShapeType, StrokeStyle, ToolType, ZoomMode } from '../types/canvas';

const SHAPE_TOOLS: readonly string[] = ['rectangle', 'circle', 'diamond', 'line', 'arrow'];

export interface EditingTextState {
  elementId?: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily?: FontFamilyId | string;
}

interface ToolState {
  currentTool: ToolType;
  zoomMode: ZoomMode;
  color: string;
  fillColor: string;
  strokeSize: number;
  fontSize: number;
  fontFamily: FontFamilyId;
  editingText: EditingTextState | null;
  strokeStyle: StrokeStyle;
  activeShapeTool: ShapeType;
  isShapesFlyoutOpen: boolean;
  setTool: (tool: ToolType) => void;
  setActiveShapeTool: (shape: ShapeType) => void;
  setShapesFlyoutOpen: (open: boolean) => void;
  toggleShapesFlyout: () => void;
  setZoomMode: (mode: ZoomMode) => void;
  setColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
  setStrokeStyle: (style: StrokeStyle) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (fontFamily: FontFamilyId) => void;
  startEditingText: (editingText: EditingTextState) => void;
  updateEditingTextDraft: (text: string) => void;
  stopEditingText: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'pen',
  zoomMode: 'scrubby',
  color: '#0284c7', // Sky Blue
  fillColor: 'transparent',
  strokeSize: 4,
  fontSize: 24,
  fontFamily: 'handwritten',
  editingText: null,
  strokeStyle: 'solid',
  activeShapeTool: 'rectangle',
  isShapesFlyoutOpen: false,

  setTool: (tool) => {
    if (SHAPE_TOOLS.includes(tool)) {
      set({ currentTool: tool, activeShapeTool: tool as ShapeType });
    } else {
      set({ currentTool: tool });
    }
  },
  setActiveShapeTool: (activeShapeTool) => set({ activeShapeTool }),
  setShapesFlyoutOpen: (isShapesFlyoutOpen) => set({ isShapesFlyoutOpen }),
  toggleShapesFlyout: () => set((state) => ({ isShapesFlyoutOpen: !state.isShapesFlyoutOpen })),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setColor: (color) =>
    set((state) => ({
      color,
      editingText: state.editingText ? { ...state.editingText, color } : null,
    })),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
  setStrokeStyle: (strokeStyle) => set({ strokeStyle }),
  setFontSize: (fontSize) =>
    set((state) => ({
      fontSize,
      editingText: state.editingText ? { ...state.editingText, fontSize } : null,
    })),
  setFontFamily: (fontFamily) =>
    set((state) => ({
      fontFamily,
      editingText: state.editingText ? { ...state.editingText, fontFamily } : null,
    })),
  startEditingText: (editingText) => set({ editingText }),
  updateEditingTextDraft: (text) =>
    set((state) => ({
      editingText: state.editingText ? { ...state.editingText, text } : null,
    })),
  stopEditingText: () => set({ editingText: null }),
}));
