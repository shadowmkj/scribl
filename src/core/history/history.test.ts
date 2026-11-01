import { describe, expect, it } from 'vitest';
import { StrokeElement } from '../../types/canvas';
import { DocumentData } from '../../types/commands';
import {
  AddElementCommand,
  DeleteElementsCommand,
  MoveElementsCommand,
  TransformElementsCommand,
} from './commands';
import { HistoryStack } from './HistoryStack';

describe('HistoryStack and Commands', () => {
  const dummyStroke: StrokeElement = {
    id: 's1',
    type: 'stroke',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    zIndex: 1,
    color: '#000',
    size: 2,
    thinning: 0.6,
    smoothing: 0.5,
    points: [{ x: 0, y: 0, pressure: 0.5 }],
  };

  it('executes AddElementCommand and allows undo/redo', () => {
    const history = new HistoryStack();
    let data: DocumentData = { elements: {}, elementIds: [], selectedIds: [] };

    data = history.execute(new AddElementCommand(dummyStroke), data);
    expect(data.elementIds).toContain('s1');
    expect(history.canUndo()).toBe(true);

    data = history.undo(data);
    expect(data.elementIds).not.toContain('s1');
    expect(history.canRedo()).toBe(true);

    data = history.redo(data);
    expect(data.elementIds).toContain('s1');
  });

  it('handles DeleteElementsCommand and restores original order on undo', () => {
    const history = new HistoryStack();
    let data: DocumentData = {
      elements: { s1: dummyStroke },
      elementIds: ['s1'],
      selectedIds: ['s1'],
    };

    data = history.execute(new DeleteElementsCommand(['s1'], data), data);
    expect(data.elementIds.length).toBe(0);

    data = history.undo(data);
    expect(data.elementIds).toEqual(['s1']);
    expect(data.elements['s1']).toBeDefined();
  });

  it('moves elements with MoveElementsCommand and reverses on undo', () => {
    const history = new HistoryStack();
    let data: DocumentData = {
      elements: { s1: dummyStroke },
      elementIds: ['s1'],
      selectedIds: ['s1'],
    };

    data = history.execute(new MoveElementsCommand(['s1'], 20, 30), data);
    expect(data.elements['s1'].x).toBe(20);
    expect(data.elements['s1'].points[0].x).toBe(20);

    data = history.undo(data);
    expect(data.elements['s1'].x).toBe(0);
    expect(data.elements['s1'].points[0].x).toBe(0);
  });

  it('records already-executed commands with pushExecuted without re-executing', () => {
    const history = new HistoryStack();
    let data: DocumentData = {
      elements: { s1: { ...dummyStroke, x: 50, y: 50 } },
      elementIds: ['s1'],
      selectedIds: ['s1'],
    };

    // Element was already moved by (+50, +50) live during pointer drag
    history.pushExecuted(new MoveElementsCommand(['s1'], 50, 50));
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    // One undo snaps back to original place (0, 0)
    data = history.undo(data);
    expect(data.elements['s1'].x).toBe(0);
    expect(history.canRedo()).toBe(true);

    // One redo snaps back to dragged place (50, 50)
    data = history.redo(data);
    expect(data.elements['s1'].x).toBe(50);
  });

  it('executes TransformElementsCommand and restores original state on undo', () => {
    const history = new HistoryStack();
    const initial = { s1: { ...dummyStroke, x: 0, y: 0, size: 2 } };
    const final = { s1: { ...dummyStroke, x: 100, y: 100, size: 6 } };

    let data: DocumentData = {
      elements: final,
      elementIds: ['s1'],
      selectedIds: ['s1'],
    };

    history.pushExecuted(new TransformElementsCommand(['s1'], initial, final));
    expect(history.canUndo()).toBe(true);

    // Undo returns to initial
    data = history.undo(data);
    expect(data.elements['s1'].x).toBe(0);
    expect(data.elements['s1'].size).toBe(2);

    // Redo returns to final
    data = history.redo(data);
    expect(data.elements['s1'].x).toBe(100);
    expect(data.elements['s1'].size).toBe(6);
  });
});
