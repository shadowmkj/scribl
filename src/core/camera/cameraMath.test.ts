import { describe, it, expect } from 'vitest';
import { screenToWorld, worldToScreen, calculateZoomAtCursor } from './cameraMath';
import { Camera } from '../../types/canvas';

describe('cameraMath', () => {
  const camera: Camera = { x: 0, y: 0, zoom: 1 };
  const width = 1000;
  const height = 800;

  it('converts center screen coords to camera origin in world space at 1x zoom', () => {
    const world = screenToWorld(500, 400, camera, width, height);
    expect(world.x).toBe(0);
    expect(world.y).toBe(0);
  });

  it('converts world origin to center screen coords at 1x zoom', () => {
    const screen = worldToScreen(0, 0, camera, width, height);
    expect(screen.x).toBe(500);
    expect(screen.y).toBe(400);
  });

  it('correctly maps zoom scaling', () => {
    const zoomedCamera: Camera = { x: 100, y: 100, zoom: 2 };
    const screen = worldToScreen(150, 150, zoomedCamera, width, height);
    expect(screen.x).toBe(500 + 50 * 2);
    expect(screen.y).toBe(400 + 50 * 2);

    const world = screenToWorld(screen.x, screen.y, zoomedCamera, width, height);
    expect(world.x).toBeCloseTo(150);
    expect(world.y).toBeCloseTo(150);
  });

  it('zooms anchored around the cursor position without shifting the cursor target point', () => {
    const cursorScreenX = 700;
    const cursorScreenY = 600;
    const initialWorld = screenToWorld(cursorScreenX, cursorScreenY, camera, width, height);

    const updatedCamera = calculateZoomAtCursor(cursorScreenX, cursorScreenY, camera, 2.0, width, height);
    expect(updatedCamera.zoom).toBe(2.0);

    const postZoomWorld = screenToWorld(cursorScreenX, cursorScreenY, updatedCamera, width, height);
    expect(postZoomWorld.x).toBeCloseTo(initialWorld.x);
    expect(postZoomWorld.y).toBeCloseTo(initialWorld.y);
  });
});
