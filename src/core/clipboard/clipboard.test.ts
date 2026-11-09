import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { StrokeElement } from '../../types/canvas';
import {
  copyCanvasAsPng,
  copySelected,
  cutSelected,
  duplicateSelected,
  getInternalClipboard,
  paste,
  resetClipboardForTests,
} from './clipboard';

if (typeof Path2D === 'undefined') {
  // @ts-expect-error jsdom environment polyfill
  globalThis.Path2D = class Path2D {
    rect() {}
    roundRect() {}
    ellipse() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
  };
}

describe('Clipboard Module', () => {
  const stroke1: StrokeElement = {
    id: 's1',
    type: 'stroke',
    x: 10,
    y: 20,
    width: 30,
    height: 40,
    zIndex: 1,
    color: '#000',
    size: 2,
    thinning: 0.6,
    smoothing: 0.5,
    points: [
      { x: 10, y: 20, pressure: 0.5 },
      { x: 40, y: 60, pressure: 0.5 },
    ],
  };

  const stroke2: StrokeElement = {
    id: 's2',
    type: 'stroke',
    x: 100,
    y: 100,
    width: 50,
    height: 50,
    zIndex: 2,
    color: '#ff0000',
    size: 4,
    thinning: 0.6,
    smoothing: 0.5,
    points: [
      { x: 100, y: 100, pressure: 0.5 },
      { x: 150, y: 150, pressure: 0.5 },
    ],
  };

  beforeEach(() => {
    resetClipboardForTests();
    useDocumentStore.getState().clearDocument();
    useDocumentStore.getState().addElements([stroke1, stroke2]);
    useDocumentStore.getState().setSelected(['s1']);

    // Mock navigator.clipboard
    let clipText = '';
    const mockWrite = vi.fn(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn((text: string) => {
          clipText = text;
          return Promise.resolve();
        }),
        readText: vi.fn(() => Promise.resolve(clipText)),
        write: mockWrite,
      },
    });

    // @ts-expect-error test mock
    globalThis.ClipboardItem = class MockClipboardItem {
      types: string[];
      items: Record<string, Blob>;
      constructor(items: Record<string, Blob>) {
        this.items = items;
        this.types = Object.keys(items);
      }
    };

    const mockCtx = {
      scale: vi.fn(),
      translate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      measureText: vi.fn(() => ({ width: 100 })),
      fillText: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mockpngdata',
    );
  });

  it('copies selected elements to internal clipboard and system clipboard', async () => {
    const success = await copySelected();
    expect(success).toBe(true);

    const clipboard = getInternalClipboard();
    expect(clipboard).toHaveLength(1);
    expect(clipboard[0].id).toBe('s1');
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('does nothing on copy if no elements are selected', async () => {
    useDocumentStore.getState().setSelected([]);
    const success = await copySelected();
    expect(success).toBe(false);
    expect(getInternalClipboard()).toHaveLength(0);
  });

  it('cuts selected elements by copying and deleting them', async () => {
    const success = await cutSelected();
    expect(success).toBe(true);

    const state = useDocumentStore.getState();
    expect(state.elements['s1']).toBeUndefined();
    expect(state.elementIds).toEqual(['s2']);

    const clipboard = getInternalClipboard();
    expect(clipboard).toHaveLength(1);
    expect(clipboard[0].id).toBe('s1');
  });

  it('pastes elements with unique IDs, offset, and selects newly pasted items', async () => {
    await copySelected();
    const success = await paste();
    expect(success).toBe(true);

    const state = useDocumentStore.getState();
    expect(state.elementIds).toHaveLength(3);

    const pastedId = state.selectedIds[0];
    expect(pastedId).not.toBe('s1');
    const pasted = state.elements[pastedId] as StrokeElement;

    // Default +24px offset
    expect(pasted.x).toBe(34);
    expect(pasted.y).toBe(44);
    expect(pasted.points[0].x).toBe(34);
    expect(pasted.points[0].y).toBe(44);

    // 1-step undo removes the pasted item
    useDocumentStore.getState().undo();
    const afterUndo = useDocumentStore.getState();
    expect(afterUndo.elementIds).toEqual(['s1', 's2']);
    expect(afterUndo.elements[pastedId]).toBeUndefined();
  });

  it('increments offset on consecutive pastes', async () => {
    await copySelected();
    await paste(); // offset +24
    await paste(); // offset +48

    const state = useDocumentStore.getState();
    expect(state.elementIds).toHaveLength(4);

    const lastPastedId = state.selectedIds[0];
    const lastPasted = state.elements[lastPastedId];
    expect(lastPasted.x).toBe(10 + 48);
    expect(lastPasted.y).toBe(20 + 48);
  });

  it('pastes from system clipboard when external scribl JSON is present', async () => {
    const externalStroke: StrokeElement = {
      ...stroke1,
      id: 'ext1',
      x: 200,
      y: 200,
    };
    const payload = JSON.stringify({
      type: 'scribl/elements',
      version: 1,
      elements: [externalStroke],
    });
    vi.mocked(navigator.clipboard.readText).mockResolvedValueOnce(payload);

    const success = await paste();
    expect(success).toBe(true);

    const state = useDocumentStore.getState();
    const pastedId = state.selectedIds[0];
    const pasted = state.elements[pastedId];
    expect(pasted.x).toBe(224); // 200 + 24
  });

  it('duplicates selected elements in-place with offset and selects them', async () => {
    useDocumentStore.getState().setSelected(['s1', 's2']);
    const success = await duplicateSelected();
    expect(success).toBe(true);

    const state = useDocumentStore.getState();
    expect(state.elementIds).toHaveLength(4);
    expect(state.selectedIds).toHaveLength(2);

    const [dup1Id, dup2Id] = state.selectedIds;
    expect(dup1Id).not.toBe('s1');
    expect(dup2Id).not.toBe('s2');

    expect(state.elements[dup1Id].x).toBe(34); // 10 + 24
    expect(state.elements[dup2Id].x).toBe(124); // 100 + 24

    // 1-step undo reverts both duplicated items
    useDocumentStore.getState().undo();
    const afterUndo = useDocumentStore.getState();
    expect(afterUndo.elementIds).toEqual(['s1', 's2']);
  });

  describe('copyCanvasAsPng', () => {
    it('copies selected elements to clipboard as high-res PNG when elements are selected', async () => {
      useDocumentStore.getState().setSelected(['s1']);
      const res = await copyCanvasAsPng();

      expect(res.success).toBe(true);
      expect(res.isSelection).toBe(true);
      expect(navigator.clipboard.write).toHaveBeenCalled();
      const callArgs = vi.mocked(navigator.clipboard.write).mock.calls[0][0];
      expect(callArgs).toHaveLength(1);
      expect(callArgs[0].types).toContain('image/png');
    });

    it('copies full canvas when nothing is selected', async () => {
      useDocumentStore.getState().setSelected([]);
      const res = await copyCanvasAsPng();

      expect(res.success).toBe(true);
      expect(res.isSelection).toBe(false);
      expect(navigator.clipboard.write).toHaveBeenCalled();
    });

    it('returns error when canvas is empty', async () => {
      useDocumentStore.getState().clearDocument();
      const res = await copyCanvasAsPng();

      expect(res.success).toBe(false);
      expect(res.error).toBe('Canvas is empty');
      expect(navigator.clipboard.write).not.toHaveBeenCalled();
    });
  });
});
