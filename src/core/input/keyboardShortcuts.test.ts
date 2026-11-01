import { beforeEach, describe, expect, it } from 'vitest';
import { useCameraStore } from '../../stores/useCameraStore';
import { useToolStore } from '../../stores/useToolStore';
import { handleGlobalBlur, handleGlobalKeyDown, handleGlobalKeyUp } from './keyboardShortcuts';

describe('keyboardShortcuts', () => {
  beforeEach(() => {
    useCameraStore.setState({
      camera: { x: 0, y: 0, zoom: 2.5 },
      viewportWidth: 1000,
      viewportHeight: 800,
      isSpacePressed: false,
      isPanning: false,
    });
    useToolStore.setState({ currentTool: 'pen' });
  });

  it('resets zoom to 1.0 when Shift+0 is pressed', () => {
    expect(useCameraStore.getState().camera.zoom).toBe(2.5);

    // Standard US QWERTY: Shift + 0 generates key ')' and code 'Digit0'
    const event = new KeyboardEvent('keydown', {
      key: ')',
      code: 'Digit0',
      shiftKey: true,
      cancelable: true,
    });

    handleGlobalKeyDown(event);

    expect(useCameraStore.getState().camera.zoom).toBe(1.0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('resets zoom to 1.0 when Shift+0 is pressed on layouts where key is "0"', () => {
    expect(useCameraStore.getState().camera.zoom).toBe(2.5);

    const event = new KeyboardEvent('keydown', {
      key: '0',
      code: 'Digit0',
      shiftKey: true,
      cancelable: true,
    });

    handleGlobalKeyDown(event);

    expect(useCameraStore.getState().camera.zoom).toBe(1.0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('resets zoom to 1.0 when Cmd+0 is pressed', () => {
    expect(useCameraStore.getState().camera.zoom).toBe(2.5);

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const event = new KeyboardEvent('keydown', {
      key: '0',
      code: 'Digit0',
      metaKey: isMac,
      ctrlKey: !isMac,
      cancelable: true,
    });

    handleGlobalKeyDown(event);

    expect(useCameraStore.getState().camera.zoom).toBe(1.0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('zooms in with "+" or "=" key', () => {
    useCameraStore.setState({ camera: { x: 0, y: 0, zoom: 1.0 } });

    const event = new KeyboardEvent('keydown', {
      key: '=',
      code: 'Equal',
      cancelable: true,
    });

    handleGlobalKeyDown(event);

    expect(useCameraStore.getState().camera.zoom).toBeGreaterThan(1.0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('zooms out with "-" key', () => {
    useCameraStore.setState({ camera: { x: 0, y: 0, zoom: 1.0 } });

    const event = new KeyboardEvent('keydown', {
      key: '-',
      code: 'Minus',
      cancelable: true,
    });

    handleGlobalKeyDown(event);

    expect(useCameraStore.getState().camera.zoom).toBeLessThan(1.0);
    expect(event.defaultPrevented).toBe(true);
  });

  it('does not trigger shortcuts when typing inside an input element', () => {
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: ')',
      code: 'Digit0',
      shiftKey: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    handleGlobalKeyDown(event);

    // Zoom should remain unchanged
    expect(useCameraStore.getState().camera.zoom).toBe(2.5);
    expect(event.defaultPrevented).toBe(false);
  });

  it('handles spacebar press, release, and blur for panning', () => {
    const spaceDown = new KeyboardEvent('keydown', {
      code: 'Space',
      cancelable: true,
    });
    handleGlobalKeyDown(spaceDown);
    expect(useCameraStore.getState().isSpacePressed).toBe(true);
    expect(spaceDown.defaultPrevented).toBe(true);

    const spaceUp = new KeyboardEvent('keyup', {
      code: 'Space',
    });
    handleGlobalKeyUp(spaceUp);
    expect(useCameraStore.getState().isSpacePressed).toBe(false);

    // Test blur resets panning state
    useCameraStore.setState({ isSpacePressed: true, isPanning: true });
    handleGlobalBlur();
    expect(useCameraStore.getState().isSpacePressed).toBe(false);
    expect(useCameraStore.getState().isPanning).toBe(false);
  });

  it('switches tools with hotkeys', () => {
    handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'e' }));
    expect(useToolStore.getState().currentTool).toBe('eraser');

    handleGlobalKeyDown(new KeyboardEvent('keydown', { key: '1' }));
    expect(useToolStore.getState().currentTool).toBe('select');

    handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'p' }));
    expect(useToolStore.getState().currentTool).toBe('pen');

    handleGlobalKeyDown(new KeyboardEvent('keydown', { key: 'z' }));
    expect(useToolStore.getState().currentTool).toBe('zoom');

    handleGlobalKeyDown(new KeyboardEvent('keydown', { key: '1' }));
    expect(useToolStore.getState().currentTool).toBe('select');

    handleGlobalKeyDown(new KeyboardEvent('keydown', { key: '4' }));
    expect(useToolStore.getState().currentTool).toBe('zoom');
  });
});
