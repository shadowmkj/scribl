import { Camera } from '../../types/canvas';

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number; } {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  return {
    x: (screenX - cx) / camera.zoom + camera.x,
    y: (screenY - cy) / camera.zoom + camera.y,
  };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number; } {
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;
  return {
    x: (worldX - camera.x) * camera.zoom + cx,
    y: (worldY - camera.y) * camera.zoom + cy,
  };
}

export function calculateZoomAtCursor(
  cursorScreenX: number,
  cursorScreenY: number,
  currentCamera: Camera,
  newZoom: number,
  viewportWidth: number,
  viewportHeight: number,
): Camera {
  const clampedZoom = Math.min(8.0, Math.max(0.1, newZoom));
  const cx = viewportWidth / 2;
  const cy = viewportHeight / 2;

  // World coordinate currently under cursor
  const worldX = (cursorScreenX - cx) / currentCamera.zoom + currentCamera.x;
  const worldY = (cursorScreenY - cy) / currentCamera.zoom + currentCamera.y;

  // New camera center required to keep world coordinate at the exact same screen location
  const newCameraX = worldX - (cursorScreenX - cx) / clampedZoom;
  const newCameraY = worldY - (cursorScreenY - cy) / clampedZoom;

  return {
    x: newCameraX,
    y: newCameraY,
    zoom: clampedZoom,
  };
}
