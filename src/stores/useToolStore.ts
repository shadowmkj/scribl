import { create } from 'zustand';
import { ToolType } from '../types/canvas';

interface ToolState {
  currentTool: ToolType;
  color: string;
  strokeSize: number;
  setTool: (tool: ToolType) => void;
  setColor: (color: string) => void;
  setStrokeSize: (size: number) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  currentTool: 'pen',
  color: '#0284c7', // Sky Blue
  strokeSize: 4,

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ color }),
  setStrokeSize: (strokeSize) => set({ strokeSize }),
}));
