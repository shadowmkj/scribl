import { beforeEach, describe, expect, it } from 'vitest';
import { StrokeElement } from '../types/canvas';
import { useDocumentStore } from './useDocumentStore';

describe('useDocumentStore - movement and atomic undo/redo', () => {
  const dummyStroke: StrokeElement = {
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

  beforeEach(() => {
    useDocumentStore.getState().clearDocument();
    useDocumentStore.getState().addElement(dummyStroke);
    useDocumentStore.getState().setSelected(['s1']);
  });

  it('translates selected elements live without creating undo steps', () => {
    const store = useDocumentStore.getState();
    const initialUndoDepth = store.history.canUndo();

    // Simulate 5 micro-deltas during drag
    store.translateSelected(2, 3);
    store.translateSelected(2, 3);
    store.translateSelected(2, 3);
    store.translateSelected(2, 3);
    store.translateSelected(2, 3);

    const current = useDocumentStore.getState();
    expect(current.elements['s1'].x).toBe(20);
    expect(current.elements['s1'].y).toBe(35);

    // Should NOT have created additional undo steps for intermediate deltas
    // (Only the initial addElement is in undo stack)
    expect(current.history.canUndo()).toBe(initialUndoDepth);
  });

  it('commits a complete movement gesture as one single undo step', () => {
    const store = useDocumentStore.getState();

    // Move by total +50, +30 over several frames
    store.translateSelected(25, 15);
    store.translateSelected(25, 15);

    // Pointer up commits the gesture
    store.commitMoveSelected(50, 30);

    const afterMove = useDocumentStore.getState();
    expect(afterMove.elements['s1'].x).toBe(60); // 10 + 50
    expect(afterMove.elements['s1'].y).toBe(50); // 20 + 30

    // Exactly ONE undo restores the element all the way back to place A (10, 20)
    afterMove.undo();
    const afterUndo = useDocumentStore.getState();
    expect(afterUndo.elements['s1'].x).toBe(10);
    expect(afterUndo.elements['s1'].y).toBe(20);
    expect((afterUndo.elements['s1'] as StrokeElement).points[0].x).toBe(10);
    expect((afterUndo.elements['s1'] as StrokeElement).points[0].y).toBe(20);

    // Exactly ONE redo moves it forward to place B (60, 50)
    afterUndo.redo();
    const afterRedo = useDocumentStore.getState();
    expect(afterRedo.elements['s1'].x).toBe(60);
    expect(afterRedo.elements['s1'].y).toBe(50);
  });

  it('does not commit if total delta is zero', () => {
    const store = useDocumentStore.getState();
    // Simulate user clicking on item without moving it
    store.commitMoveSelected(0, 0);

    // Undo should undo the addElement, not a blank move
    store.undo();
    expect(useDocumentStore.getState().elementIds.length).toBe(0);
  });

  it('transforms elements live and commits a single undo step', () => {
    const store = useDocumentStore.getState();
    const initialElements = { s1: store.elements['s1'] };
    const scaledElement = {
      ...store.elements['s1'],
      x: 10,
      y: 20,
      width: 60,
      height: 80,
      size: 4,
    };

    // Live update during drag
    store.transformSelectedLive({ s1: scaledElement });
    expect(useDocumentStore.getState().elements['s1'].width).toBe(60);

    // Commit on pointer up
    store.commitTransformSelected(initialElements, { s1: scaledElement });

    // One undo restores original dimensions
    store.undo();
    expect(useDocumentStore.getState().elements['s1'].width).toBe(30);
    expect((useDocumentStore.getState().elements['s1'] as StrokeElement).size).toBe(2);

    // One redo restores transformed dimensions
    store.redo();
    expect(useDocumentStore.getState().elements['s1'].width).toBe(60);
    expect((useDocumentStore.getState().elements['s1'] as StrokeElement).size).toBe(4);
  });

  it('adds multiple elements at once and selects them with atomic undo', () => {
    const store = useDocumentStore.getState();
    const s2: StrokeElement = { ...dummyStroke, id: 's2' };
    const s3: StrokeElement = { ...dummyStroke, id: 's3' };

    store.addElements([s2, s3]);

    const stateAfterAdd = useDocumentStore.getState();
    expect(stateAfterAdd.elementIds).toEqual(['s1', 's2', 's3']);
    expect(stateAfterAdd.selectedIds).toEqual(['s2', 's3']);

    // Undo removes both s2 and s3 in 1 step
    store.undo();
    const stateAfterUndo = useDocumentStore.getState();
    expect(stateAfterUndo.elementIds).toEqual(['s1']);
    expect(stateAfterUndo.elements['s2']).toBeUndefined();
    expect(stateAfterUndo.elements['s3']).toBeUndefined();

    // Redo restores both and selects them
    store.redo();
    const stateAfterRedo = useDocumentStore.getState();
    expect(stateAfterRedo.elementIds).toEqual(['s1', 's2', 's3']);
    expect(stateAfterRedo.selectedIds).toEqual(['s2', 's3']);
  });
});
