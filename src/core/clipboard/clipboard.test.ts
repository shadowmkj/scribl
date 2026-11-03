import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { StrokeElement } from '../../types/canvas';
import {
  copySelected,
  cutSelected,
  duplicateSelected,
  getInternalClipboard,
  paste,
  resetClipboardForTests,
} from './clipboard';

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
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn((text: string) => {
          clipText = text;
          return Promise.resolve();
        }),
        readText: vi.fn(() => Promise.resolve(clipText)),
      },
    });
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
});
