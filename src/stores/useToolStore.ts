import { create } from 'zustand';
import { StrokeStyle, ToolType, ZoomMode } from '../types/canvas';

interface ToolState {
  currentTool: ToolType;
  zoomMode: ZoomMode;
  color: string;
  fillColor: string;
  strokeSize: number;
  strokeStyle: StrokeStyle;
  setTool: (tool: ToolType) => void;
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

  setTool: (tool) => set({ currentTool: tool }),
  setZoomMode: (zoomMode) => set({ zoomMode }),
  setColor: (color) => set({ color }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
  setStrokeStyle: (strokeStyle) => set({ strokeStyle }),
}));
