import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';

export function handleGlobalKeyDown(e: KeyboardEvent): void {
  // Ignore if typing in text inputs or textareas
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  const isMac = typeof navigator !== 'undefined'
    && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? e.metaKey : e.ctrlKey;

  // Spacebar panning
  if (e.code === 'Space') {
    e.preventDefault();
    useCameraStore.getState().setIsSpacePressed(true);
    return;
  }

  // Reset Zoom (100%): Shift+0 or Cmd/Ctrl+0
  // Note: On standard US QWERTY, Shift+0 generates key ')' and code 'Digit0'.
  // On other keyboard layouts (e.g. AZERTY), Shift+0 generates key '0'.
  const isResetZoom = (e.shiftKey
    && (e.code === 'Digit0' || e.code === 'Numpad0' || e.key === ')' || e.key === '0'))
    || (cmdKey && (e.code === 'Digit0' || e.code === 'Numpad0' || e.key === '0'));

  if (isResetZoom) {
    e.preventDefault();
    useCameraStore.getState().resetZoom();
    return;
  }

  // Zoom In: '=' or '+' (with or without Cmd/Ctrl)
  const isZoomIn = (cmdKey && (e.key === '=' || e.key === '+' || e.code === 'Equal'))
    || (!cmdKey && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === '=' || e.key === '+'));

  if (isZoomIn) {
    e.preventDefault();
    const { viewportWidth, viewportHeight, camera, zoomAt } = useCameraStore.getState();
    zoomAt(viewportWidth / 2, viewportHeight / 2, camera.zoom * 1.15);
    return;
  }

  // Zoom Out: '-' or '_' (with or without Cmd/Ctrl)
  const isZoomOut = (cmdKey && (e.key === '-' || e.key === '_' || e.code === 'Minus'))
    || (!cmdKey && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === '-' || e.key === '_'));

  if (isZoomOut) {
    e.preventDefault();
    const { viewportWidth, viewportHeight, camera, zoomAt } = useCameraStore.getState();
    zoomAt(viewportWidth / 2, viewportHeight / 2, camera.zoom / 1.15);
    return;
  }

  // Undo / Redo
  if (cmdKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      useDocumentStore.getState().redo();
    } else {
      useDocumentStore.getState().undo();
    }
    return;
  }

  if (cmdKey && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    useDocumentStore.getState().redo();
    return;
  }

  // Tool Switching
  if (e.key.toLowerCase() === 'v' || e.key === '1') {
    useToolStore.getState().setTool('select');
    return;
  }

  if (e.key.toLowerCase() === 'p' || e.key === '2') {
    useToolStore.getState().setTool('pen');
    return;
  }

  if (e.key.toLowerCase() === 'e' || e.key === '3') {
    useToolStore.getState().setTool('eraser');
    return;
  }

  // Delete Selection
  if (e.key === 'Backspace' || e.key === 'Delete') {
    useDocumentStore.getState().deleteSelected();
    return;
  }
}

export function handleGlobalKeyUp(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    useCameraStore.getState().setIsSpacePressed(false);
  }
}

export function handleGlobalBlur(): void {
  useCameraStore.getState().setIsSpacePressed(false);
  useCameraStore.getState().setIsPanning(false);
}
