import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { CanvasElement, ImageElement } from '../../types/canvas';
import { imageCache } from '../engine/CanvasRenderer';
import { applyElementDelta } from '../history/commands';
import { dataUrlToBlob, exportToBlob } from '../persistence/fileIO';
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
    if (typeof navigator !== 'undefined') {
      const payload: ScriblClipboardPayload = {
        type: 'scribl/elements',
        version: 1,
        elements: toCopy,
      };

      if (
        toCopy.length === 1
        && toCopy[0].type === 'image'
        && navigator.clipboard?.write
        && typeof ClipboardItem !== 'undefined'
      ) {
        try {
          const imgEl = toCopy[0] as ImageElement;
          const blob = dataUrlToBlob(imgEl.src);
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type || 'image/png']: blob,
              'text/plain': new Blob([JSON.stringify(payload)], { type: 'text/plain' }),
            }),
          ]);
        } catch {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(JSON.stringify(payload));
          }
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(payload));
      }
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

export function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function getImageDimensions(src: string): Promise<{ width: number; height: number; }> {
  return imageCache.loadImage(src).then((img) => ({
    width: img.naturalWidth || 400,
    height: img.naturalHeight || 300,
  }));
}

/**
 * Optimize an image blob for canvas performance:
 * - Uses URL.createObjectURL for near-instant native decode (bypassing slow base64 FileReader)
 * - Constrains ultra-high-res images (e.g. 48MP smartphone photos) to max 2560px
 * - Pre-populates imageCache so first render draws immediately with 0ms delay
 */
export async function optimizeImageBlob(blob: Blob): Promise<{
  dataUrl: string;
  width: number;
  height: number;
}> {
  const isSvg = blob.type === 'image/svg+xml'
    || (blob as File).name?.toLowerCase().endsWith('.svg');

  let objectUrl = '';
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      objectUrl = URL.createObjectURL(blob);
    } catch {
      objectUrl = '';
    }
  }

  try {
    const srcToLoad = objectUrl || (await readBlobAsDataUrl(blob));
    const img = await imageCache.loadImage(srcToLoad);

    const naturalWidth = img.naturalWidth || 400;
    const naturalHeight = img.naturalHeight || 300;

    const MAX_DIMENSION = 2560;
    const needsDownscale = !isSvg
      && (naturalWidth > MAX_DIMENSION || naturalHeight > MAX_DIMENSION);

    let dataUrl: string;

    if (needsDownscale && typeof document !== 'undefined') {
      const scale = Math.min(MAX_DIMENSION / naturalWidth, MAX_DIMENSION / naturalHeight);
      const targetW = Math.round(naturalWidth * scale);
      const targetH = Math.round(naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const isJpeg = blob.type === 'image/jpeg' || (blob as File).name?.match(/\.jpe?g$/i);
        const format = isJpeg ? 'image/jpeg' : 'image/png';
        const quality = isJpeg ? 0.90 : undefined;
        dataUrl = canvas.toDataURL(format, quality);
      } else {
        dataUrl = await readBlobAsDataUrl(blob);
      }
    } else {
      dataUrl = await readBlobAsDataUrl(blob);
    }

    // Pre-populate imageCache with dataUrl pointing to the loaded HTMLImageElement
    imageCache.set(dataUrl, img);

    return {
      dataUrl,
      width: naturalWidth,
      height: naturalHeight,
    };
  } finally {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // Ignore
      }
    }
  }
}

export async function createImageElementFromBlob(
  blob: Blob,
  worldPos?: { x: number; y: number; },
  fileName?: string,
): Promise<boolean> {
  const { dataUrl, width: naturalWidth, height: naturalHeight } = await optimizeImageBlob(blob);

  const cameraState = useCameraStore.getState();
  const camera = cameraState.camera;
  const viewportWidth = cameraState.viewportWidth || 1000;
  const viewportHeight = cameraState.viewportHeight || 800;

  // Maximum initial size: 50% of viewport in world units
  const maxWorldW = (viewportWidth / camera.zoom) * 0.5;
  const maxWorldH = (viewportHeight / camera.zoom) * 0.5;

  let width = naturalWidth;
  let height = naturalHeight;
  const aspectRatio = naturalWidth && naturalHeight ? naturalWidth / naturalHeight : 1;

  if (width > maxWorldW || height > maxWorldH) {
    const scale = Math.min(maxWorldW / width, maxWorldH / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const targetX = worldPos !== undefined ? worldPos.x : camera.x;
  const targetY = worldPos !== undefined ? worldPos.y : camera.y;

  const x = Math.round(targetX - width / 2);
  const y = Math.round(targetY - height / 2);

  const doc = useDocumentStore.getState();
  const nextZIndex = doc.elementIds.length + 1;
  const imageId = `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const newImage: ImageElement = {
    id: imageId,
    type: 'image',
    x,
    y,
    width: Math.max(1, width),
    height: Math.max(1, height),
    naturalWidth,
    naturalHeight,
    aspectRatio,
    src: dataUrl,
    opacity: 1,
    zIndex: nextZIndex,
    fileName: fileName || (blob as File).name,
    mimeType: blob.type || 'image/png',
  };

  doc.addElements([newImage]);
  doc.setSelected([imageId]);
  useToolStore.getState().setTool('select');
  return true;
}

export async function paste(clipboardData?: DataTransfer | null): Promise<boolean> {
  // 1. Try reading image from passed ClipboardEvent.clipboardData
  if (clipboardData) {
    if (clipboardData.items) {
      for (const item of Array.from(clipboardData.items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            return await createImageElementFromBlob(file);
          }
        }
      }
    }
    if (clipboardData.files) {
      for (const file of Array.from(clipboardData.files)) {
        if (file.type.startsWith('image/')) {
          return await createImageElementFromBlob(file);
        }
      }
    }
  }

  // 2. Try reading image from navigator.clipboard.read() if no image found in clipboardData
  if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          if (blob) {
            return await createImageElementFromBlob(blob);
          }
        }
      }
    } catch {
      // Permission denied or format not supported, continue to text/json
    }
  }

  let sourceElements: CanvasElement[] = [];

  // 3. Try reading from system clipboard text (Scribl JSON payload)
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
