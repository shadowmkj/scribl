import { describe, expect, it } from 'vitest';
import { importExcalidraw } from './excalidrawImporter';

describe('importExcalidraw', () => {
  it('imports freedraw strokes with pressures and world coordinates', () => {
    const excalidrawDoc = {
      type: 'excalidraw',
      version: 2,
      elements: [
        {
          id: 'stroke-1',
          type: 'freedraw',
          x: 100,
          y: 50,
          width: 20,
          height: 30,
          strokeColor: '#e03131',
          strokeWidth: 2,
          points: [
            [0, 0],
            [10, 15],
            [20, 30],
          ],
          pressures: [0.3, 0.7, 0.9],
        },
      ],
    };

    const result = importExcalidraw(excalidrawDoc, 'test.excalidraw');
    expect(result.format).toBe('excalidraw');
    expect(result.elements.length).toBe(1);
    expect(result.discardedCount).toBe(0);

    const stroke = result.elements[0];
    expect(stroke.type).toBe('stroke');
    if (stroke.type === 'stroke') {
      expect(stroke.color).toBe('#e03131');
      expect(stroke.points[0]).toEqual({ x: 100, y: 50, pressure: 0.3 });
      expect(stroke.points[1]).toEqual({ x: 110, y: 65, pressure: 0.7 });
      expect(stroke.points[2]).toEqual({ x: 120, y: 80, pressure: 0.9 });
    }
  });

  it('imports geometric shapes (rectangle, ellipse, diamond, line, arrow)', () => {
    const excalidrawDoc = {
      elements: [
        {
          id: 'rect-1',
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 80,
          height: 60,
          strokeColor: '#000000',
          backgroundColor: '#ffffff',
          strokeWidth: 1,
          strokeStyle: 'dashed',
          roundness: { type: 3 },
        },
        {
          id: 'ellipse-1',
          type: 'ellipse',
          x: 300,
          y: 200,
          width: 50,
          height: 50,
          strokeColor: '#2f9e44',
          backgroundColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
        {
          id: 'diamond-1',
          type: 'diamond',
          x: 400,
          y: 200,
          width: 60,
          height: 60,
          strokeColor: '#1971c2',
        },
        {
          id: 'arrow-1',
          type: 'arrow',
          x: 100,
          y: 100,
          points: [
            [0, 0],
            [50, 50],
          ],
          strokeColor: '#000000',
          strokeWidth: 2,
        },
      ],
    };

    const result = importExcalidraw(excalidrawDoc);
    expect(result.elements.length).toBe(4);

    const rect = result.elements[0];
    expect(rect.type).toBe('shape');
    if (rect.type === 'shape') {
      expect(rect.shapeType).toBe('rectangle');
      expect(rect.strokeStyle).toBe('dashed');
      expect(rect.borderRadius).toBe(8);
      expect(rect.fillColor).toBe('#ffffff');
    }

    const circle = result.elements[1];
    expect(circle.type).toBe('shape');
    if (circle.type === 'shape') {
      expect(circle.shapeType).toBe('circle');
    }

    const diamond = result.elements[2];
    expect(diamond.type).toBe('shape');
    if (diamond.type === 'shape') {
      expect(diamond.shapeType).toBe('diamond');
    }

    const arrow = result.elements[3];
    expect(arrow.type).toBe('shape');
    if (arrow.type === 'shape') {
      expect(arrow.shapeType).toBe('arrow');
      expect(arrow.startPoint).toEqual({ x: 100, y: 100 });
      expect(arrow.endPoint).toEqual({ x: 150, y: 150 });
    }
  });

  it('imports text element', () => {
    const excalidrawDoc = {
      elements: [
        {
          id: 'text-1',
          type: 'text',
          x: 50,
          y: 50,
          text: 'Hello Excalidraw',
          fontSize: 20,
          strokeColor: '#333333',
        },
      ],
    };

    const result = importExcalidraw(excalidrawDoc);
    expect(result.elements.length).toBe(1);
    const textEl = result.elements[0];
    expect(textEl.type).toBe('text');
    if (textEl.type === 'text') {
      expect(textEl.text).toBe('Hello Excalidraw');
      expect(textEl.fontSize).toBe(20);
      expect(textEl.color).toBe('#333333');
    }
  });

  it('discards unsupported elements and counts them in discardedCount/types', () => {
    const excalidrawDoc = {
      elements: [
        { id: '1', type: 'rectangle', x: 0, y: 0, width: 10, height: 10 },
        { id: '2', type: 'image', fileId: 'img1', x: 20, y: 20 },
        { id: '3', type: 'frame', name: 'Frame 1', x: 40, y: 40 },
        { id: '4', type: 'embeddable', x: 60, y: 60 },
      ],
    };

    const result = importExcalidraw(excalidrawDoc);
    expect(result.elements.length).toBe(1);
    expect(result.discardedCount).toBe(3);
    expect(result.discardedTypes).toEqual(expect.arrayContaining(['image', 'frame', 'embeddable']));
  });
});
