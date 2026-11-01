import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { parseScriblJSON, serializeScriblDoc } from './fileIO';

const AUTOSAVE_KEY = 'scribl_active_doc';

export function setupAutoSave() {
  let timer: ReturnType<typeof setTimeout> | null = null;

  useDocumentStore.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const camera = useCameraStore.getState().camera;
      const json = serializeScriblDoc(state.elements, state.elementIds, camera);
      localStorage.setItem(AUTOSAVE_KEY, json);
    }, 400);
  });
}

export function restoreAutoSave(): boolean {
  try {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (!saved) return false;
    const data = parseScriblJSON(saved);
    useDocumentStore.getState().loadDocument({
      elements: data.elements,
      elementIds: data.elementIds,
    });
    if (data.camera) {
      useCameraStore.getState().setPan(data.camera.x, data.camera.y);
      useCameraStore.getState().zoomAt(0, 0, data.camera.zoom);
    }
    return true;
  } catch (err) {
    console.error('Failed to restore autosaved document:', err);
    return false;
  }
}
