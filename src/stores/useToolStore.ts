import { create } from 'zustand';
import { ShapeType, StrokeStyle, ToolType, ZoomMode } from '../types/canvas';

const SHAPE_TOOLS: readonly string[] = ['rectangle', 'circle', 'diamond', 'line', 'arrow'];

interface ToolState {
  currentTool: ToolType;
  zoomMode: ZoomMode;
  color: string;
  fillColor: string;
  strokeSize: number;
  strokeStyle: StrokeStyle;
  activeShapeTool: ShapeType;
  setTool: (tool: ToolType) => void;
  setActiveShapeTool: (shape: ShapeType) => void;
  setZoomMode: (mode: ZoomMode) => void;
  setColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
  setStrokeStyle: (style: StrokeStyle) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'pen',
  zoomMode: 'scrubby',
  color: '#0284c7', // Sky Blue
  fillColor: 'transparent',
  strokeSize: 4,
  strokeStyle: 'solid',
  activeShapeTool: 'rectangle',

  setTool: (tool) => {
    if (SHAPE_TOOLS.includes(tool)) {
      set({ currentTool: tool, activeShapeTool: tool as ShapeType });
    } else {
      set({ currentTool: tool });
    }
  },
  setActiveShapeTool: (activeShapeTool) => set({ activeShapeTool }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setColor: (color) => set({ color }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
  setStrokeStyle: (strokeStyle) => set({ strokeStyle }),
}));
