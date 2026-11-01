import { create } from 'zustand';
import { Camera } from '../types/canvas';
import { calculateZoomAtCursor } from '../core/camera/cameraMath';

interface CameraState {
  camera: Camera;
  viewportWidth: number;
  viewportHeight: number;
  setDimensions: (width: number, height: number) => void;
  setPan: (x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (screenX: number, screenY: number, newZoom: number) => void;
  resetZoom: () => void;
}

export const useCameraStore = create<CameraState>((set, get) => ({
  camera: { x: 0, y: 0, zoom: 1.0 },
  viewportWidth: window.innerWidth || 800,
  viewportHeight: window.innerHeight || 600,

  setDimensions: (width, height) => set({ viewportWidth: width, viewportHeight: height }),

  setPan: (x, y) => set((s) => ({ camera: { ...s.camera, x, y } })),

  panBy: (dx, dy) => set((s) => ({
    camera: {
      ...s.camera,
      x: s.camera.x + dx / s.camera.zoom,
      y: s.camera.y + dy / s.camera.zoom,
    },
  })),

  zoomAt: (screenX, screenY, newZoom) => {
    const { camera, viewportWidth, viewportHeight } = get();
    const updated = calculateZoomAtCursor(screenX, screenY, camera, newZoom, viewportWidth, viewportHeight);
    set({ camera: updated });
  },

  resetZoom: () => set((s) => ({ camera: { ...s.camera, zoom: 1.0 } })),
}));
