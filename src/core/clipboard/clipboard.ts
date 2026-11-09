import { useDocumentStore } from '../../stores/useDocumentStore';
import { CanvasElement } from '../../types/canvas';
import { applyElementDelta } from '../history/commands';
import { exportToBlob } from '../persistence/fileIO';
import { ThemeMode } from '../theme/themeManager';

export interface ScriblClipboardPayload {
  type: 'scribl/elements';
  version: 1;
  elements: CanvasElement[];
}

let internalClipboard: CanvasElement[] = [];
let pasteCount = 0;

export function getInternalClipboard(): CanvasElement[] {
  return [...internalClipboard];
}

export function resetClipboardForTests(): void {
  internalClipboard = [];
  pasteCount = 0;
}

function cloneElement(el: CanvasElement, dx: number, dy: number, zIndex: number): CanvasElement {
  const newId = `${el.type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const shifted = applyElementDelta(el, dx, dy);
  return {
    ...shifted,
    id: newId,
    zIndex,
  };
}

export async function copySelected(): Promise<boolean> {
  const { elements, selectedIds } = useDocumentStore.getState();
  if (selectedIds.length === 0) return false;

  const toCopy: CanvasElement[] = [];
  for (const id of selectedIds) {
    const el = elements[id];
    if (el) {
      toCopy.push(JSON.parse(JSON.stringify(el)));
    }
  }

  if (toCopy.length === 0) return false;

  internalClipboard = toCopy;
  pasteCount = 0;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      const payload: ScriblClipboardPayload = {
        type: 'scribl/elements',
        version: 1,
        elements: toCopy,
      };
      await navigator.clipboard.writeText(JSON.stringify(payload));
    }
  } catch {
    // Non-blocking in environments without clipboard access
  }

  return true;
}

export interface CopyAsPngResult {
  success: boolean;
  isSelection: boolean;
  error?: string;
}

export async function copyCanvasAsPng(themeMode?: ThemeMode): Promise<CopyAsPngResult> {
  const { elements, elementIds, selectedIds } = useDocumentStore.getState();

  const isSelection = selectedIds.length > 0;
  const targetIds = isSelection ? selectedIds : elementIds;

  if (targetIds.length === 0) {
    return {
      success: false,
      isSelection: false,
      error: 'Canvas is empty',
    };
  }

  try {
    const blob = await exportToBlob(elements, targetIds, themeMode);
    if (
      typeof navigator !== 'undefined'
      && navigator.clipboard?.write
      && typeof ClipboardItem !== 'undefined'
    ) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
    }
    return {
      success: true,
      isSelection,
    };
  } catch (err) {
    return {
      success: false,
      isSelection,
      error: (err as Error).message,
    };
  }
}

export async function cutSelected(): Promise<boolean> {
  const copied = await copySelected();
  if (!copied) return false;
  useDocumentStore.getState().deleteSelected();
  return true;
}

export async function paste(): Promise<boolean> {
  let sourceElements: CanvasElement[] = [];

  // Try reading from system clipboard first
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText();
      if (text) {
        const parsed = JSON.parse(text) as ScriblClipboardPayload;
        if (parsed && parsed.type === 'scribl/elements' && Array.isArray(parsed.elements)) {
          sourceElements = parsed.elements;
        }
      }
    }
  } catch {
    // Fallback to internal clipboard
  }

  if (sourceElements.length === 0) {
    sourceElements = internalClipboard;
  }

  if (sourceElements.length === 0) return false;

  pasteCount++;
  const offset = 24 * pasteCount;

  const currentCount = useDocumentStore.getState().elementIds.length;
  const newElements: CanvasElement[] = sourceElements.map((el, i) =>
    cloneElement(el, offset, offset, currentCount + i + 1)
  );

  useDocumentStore.getState().addElements(newElements);
  return true;
}

export async function duplicateSelected(): Promise<boolean> {
  const { elements, selectedIds, elementIds } = useDocumentStore.getState();
  if (selectedIds.length === 0) return false;

  const offset = 24;
  const currentCount = elementIds.length;

  const newElements: CanvasElement[] = [];
  selectedIds.forEach((id, i) => {
    const el = elements[id];
    if (el) {
      newElements.push(cloneElement(el, offset, offset, currentCount + i + 1));
    }
  });

  if (newElements.length === 0) return false;

  useDocumentStore.getState().addElements(newElements);
  return true;
}
