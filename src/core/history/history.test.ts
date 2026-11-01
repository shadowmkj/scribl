import { describe, it, expect } from 'vitest';
import { HistoryStack } from './HistoryStack';
import { AddElementCommand, DeleteElementsCommand, MoveElementsCommand } from './commands';
import { DocumentData } from '../../types/commands';
import { StrokeElement } from '../../types/canvas';

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
});
