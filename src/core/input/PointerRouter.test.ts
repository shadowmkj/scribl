import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCameraStore } from '../../stores/useCameraStore';
import { useToolStore } from '../../stores/useToolStore';
import { ScratchRenderer } from '../engine/ScratchRenderer';
import { PointerRouter } from './PointerRouter';

describe('PointerRouter - Zoom Tool', () => {
  let router: PointerRouter;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.setPointerCapture = vi.fn();
    container.releasePointerCapture = vi.fn();

    const scratch = new ScratchRenderer();
    router = new PointerRouter(scratch);

    useCameraStore.setState({
      camera: { x: 0, y: 0, zoom: 1.0 },
      viewportWidth: 1000,
      viewportHeight: 800,
      isSpacePressed: false,
      isPanning: false,
    });

    useToolStore.setState({
      currentTool: 'zoom',
      zoomMode: 'scrubby',
    });
  });

  it('performs scrubby zoom on pointer drag', () => {
    // Pointer down at center (500, 400)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Drag right by 120px to (620, 400)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 620,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    // Dragging right by 120px should double the zoom (~2.0)
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(2.0, 1);

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 620,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    // Zoom should remain after pointer up
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(2.0, 1);
  });

  it('performs single click zoom in when clicking without dragging in scrubby mode', () => {
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    // Pointer up with minimal/no movement
    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 501,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    // Single click should zoom in by 1.25x
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(1.25, 2);
  });

  it('performs single click zoom out when Alt key is held in scrubby mode', () => {
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
        altKey: true,
      }),
      container,
    );

    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 500,
        clientY: 400,
        pointerId: 1,
        pointerType: 'mouse',
        altKey: true,
      }),
      container,
    );

    // Single click with Alt should zoom out (1 / 1.25 = 0.8)
    expect(useCameraStore.getState().camera.zoom).toBeCloseTo(0.8, 2);
  });

  it('performs selection zoom framing when dragging a marquee box in selection mode', () => {
    useToolStore.setState({ zoomMode: 'selection' });

    let updatedMarquee: any = null;
    router.onMarqueeUpdate = (box) => {
      updatedMarquee = box;
    };

    // Center screen is (500, 400) which corresponds to world (0, 0)
    router.handlePointerDown(
      new PointerEvent('pointerdown', {
        clientX: 400,
        clientY: 300,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
      container,
    );

    expect(updatedMarquee).not.toBeNull();
    expect(updatedMarquee?.type).toBe('zoom');

    // Drag marquee to (600, 500)
    router.handlePointerMove(
      new PointerEvent('pointermove', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
        buttons: 1,
      }),
    );

    expect(updatedMarquee?.currentX).toBeDefined();

    // Release pointer to frame box
    router.handlePointerUp(
      new PointerEvent('pointerup', {
        clientX: 600,
        clientY: 500,
        pointerId: 1,
        pointerType: 'mouse',
      }),
      container,
    );

    // Marquee should be cleared
    expect(router.marqueeBox).toBeNull();
    // Camera should have zoomed in to frame the selection
    expect(useCameraStore.getState().camera.zoom).toBeGreaterThan(1.0);
  });
});
