import { describe, expect, it } from 'vitest';
import { StrokeElement, TextElement } from '../../types/canvas';
import { DocumentData } from '../../types/commands';
import {
  AddElementCommand,
  AddElementsCommand,
  DeleteElementsCommand,
  MoveElementsCommand,
  TransformElementsCommand,
  UpdateTextElementCommand,
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
    expect((data.elements['s1'] as StrokeElement).points[0].x).toBe(20);

    data = history.undo(data);
    expect(data.elements['s1'].x).toBe(0);
    expect((data.elements['s1'] as StrokeElement).points[0].x).toBe(0);
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
    expect((data.elements['s1'] as StrokeElement).size).toBe(2);

    // Redo returns to final
    data = history.redo(data);
    expect(data.elements['s1'].x).toBe(100);
    expect((data.elements['s1'] as StrokeElement).size).toBe(6);
  });

  it('executes AddElementsCommand and allows 1-step undo/redo for multiple elements', () => {
    const history = new HistoryStack();
    const s2: StrokeElement = { ...dummyStroke, id: 's2' };
    const s3: StrokeElement = { ...dummyStroke, id: 's3' };
    let data: DocumentData = { elements: { s1: dummyStroke }, elementIds: ['s1'], selectedIds: [] };

    data = history.execute(new AddElementsCommand([s2, s3]), data);
    expect(data.elementIds).toEqual(['s1', 's2', 's3']);
    expect(data.selectedIds).toEqual(['s2', 's3']);
    expect(history.canUndo()).toBe(true);

    data = history.undo(data);
    expect(data.elementIds).toEqual(['s1']);
    expect(data.elements['s2']).toBeUndefined();
    expect(data.elements['s3']).toBeUndefined();
    expect(data.selectedIds).toEqual([]);
    expect(history.canRedo()).toBe(true);

    data = history.redo(data);
    expect(data.elementIds).toEqual(['s1', 's2', 's3']);
    expect(data.selectedIds).toEqual(['s2', 's3']);
  });

  it('handles TextElement creation, movement, and content updates with undo/redo', () => {
    const history = new HistoryStack();
    const dummyText: TextElement = {
      id: 't1',
      type: 'text',
      x: 50,
      y: 60,
      width: 120,
      height: 30,
      zIndex: 2,
      text: 'Original Text',
      fontSize: 24,
      fontFamily: 'system-ui, sans-serif',
      color: '#ffffff',
      lineHeight: 1.25,
    };

    let data: DocumentData = { elements: {}, elementIds: [], selectedIds: [] };

    // 1. Add Text Element
    data = history.execute(new AddElementCommand(dummyText), data);
    expect(data.elementIds).toContain('t1');
    expect((data.elements['t1'] as TextElement).text).toBe('Original Text');

    // 2. Move Text Element
    data = history.execute(new MoveElementsCommand(['t1'], 15, -10), data);
    expect(data.elements['t1'].x).toBe(65);
    expect(data.elements['t1'].y).toBe(50);

    data = history.undo(data);
    expect(data.elements['t1'].x).toBe(50);
    expect(data.elements['t1'].y).toBe(60);

    data = history.redo(data);
    expect(data.elements['t1'].x).toBe(65);
    expect(data.elements['t1'].y).toBe(50);

    // 3. Update Text Content
    const prevMetrics = {
      text: 'Original Text',
      width: 120,
      height: 30,
      fontSize: 24,
      color: '#ffffff',
    };
    const nextMetrics = {
      text: 'Updated Text\nSecond Line',
      width: 180,
      height: 60,
      fontSize: 24,
      color: '#0284c7',
    };

    data = history.execute(new UpdateTextElementCommand('t1', prevMetrics, nextMetrics), data);
    const updatedEl = data.elements['t1'] as TextElement;
    expect(updatedEl.text).toBe('Updated Text\nSecond Line');
    expect(updatedEl.width).toBe(180);
    expect(updatedEl.height).toBe(60);
    expect(updatedEl.color).toBe('#0284c7');

    // Undo restores previous text
    data = history.undo(data);
    const undoneEl = data.elements['t1'] as TextElement;
    expect(undoneEl.text).toBe('Original Text');
    expect(undoneEl.width).toBe(120);
    expect(undoneEl.height).toBe(30);
    expect(undoneEl.color).toBe('#ffffff');

    // Redo restores updated text
    data = history.redo(data);
    const redoneEl = data.elements['t1'] as TextElement;
    expect(redoneEl.text).toBe('Updated Text\nSecond Line');
    expect(redoneEl.width).toBe(180);
  });
});
