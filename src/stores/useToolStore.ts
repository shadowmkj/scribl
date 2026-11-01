import { create } from 'zustand';
import { ToolType, ZoomMode } from '../types/canvas';

interface ToolState {
  currentTool: ToolType;
  zoomMode: ZoomMode;
  color: string;
  strokeSize: number;
  setTool: (tool: ToolType) => void;
  setZoomMode: (mode: ZoomMode) => void;
  setColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'pen',
  zoomMode: 'scrubby',
  color: '#0284c7', // Sky Blue
  strokeSize: 4,

  setTool: (tool) => set({ currentTool: tool }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setColor: (color) => set({ color }),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
}));
