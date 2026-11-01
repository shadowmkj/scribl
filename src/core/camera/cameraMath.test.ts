import { describe, expect, it } from 'vitest';
import { Camera } from '../../types/canvas';
import {
  calculateBoxFitCamera,
  calculateScrubbyZoom,
  calculateZoomAtCursor,
  screenToWorld,
  worldToScreen,
} from './cameraMath';

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

    const updatedCamera = calculateZoomAtCursor(
      cursorScreenX,
      cursorScreenY,
      camera,
      2.0,
      width,
      height,
    );
    expect(updatedCamera.zoom).toBe(2.0);

    const postZoomWorld = screenToWorld(cursorScreenX, cursorScreenY, updatedCamera, width, height);
    expect(postZoomWorld.x).toBeCloseTo(initialWorld.x);
    expect(postZoomWorld.y).toBeCloseTo(initialWorld.y);
  });

  it('calculates scrubby zoom: dragging right increases zoom, left decreases zoom', () => {
    const startX = 400;
    const startY = 300;
    const initialCam: Camera = { x: 50, y: 50, zoom: 1.0 };

    // Drag right by 120px -> 2.0x zoom
    const zoomIn = calculateScrubbyZoom(startX, startY, startX + 120, initialCam, width, height);
    expect(zoomIn.zoom).toBeCloseTo(2.0, 1);

    // Anchor point in world space must be preserved
    const worldBefore = screenToWorld(startX, startY, initialCam, width, height);
    const worldAfter = screenToWorld(startX, startY, zoomIn, width, height);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y);

    // Drag left by 120px -> 0.5x zoom
    const zoomOut = calculateScrubbyZoom(startX, startY, startX - 120, initialCam, width, height);
    expect(zoomOut.zoom).toBeCloseTo(0.5, 1);
  });

  it('calculates box fit camera: frames bounding box in viewport with padding', () => {
    const box = { minX: 100, minY: 200, maxX: 500, maxY: 400 };
    // box width = 400, box height = 200, center = (300, 300)
    const fit = calculateBoxFitCamera(box, width, height, 1.0);

    expect(fit.x).toBe(300);
    expect(fit.y).toBe(300);
    // width=1000/400=2.5, height=800/200=4.0 -> min is 2.5
    expect(fit.zoom).toBeCloseTo(2.5, 1);
  });
});
