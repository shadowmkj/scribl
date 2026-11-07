import { describe, expect, it } from 'vitest';
import { importTldraw } from './tldrawImporter';

describe('importTldraw', () => {
  it('imports tldraw v2 draw strokes with segment pressures', () => {
    const tldrawDoc = {
      tldrawFileFormatVersion: 1,
      records: [
        {
          id: 'shape:draw1',
          typeName: 'shape',
          type: 'draw',
          x: 50,
          y: 50,
          props: {
            color: 'blue',
            size: 'm',
            segments: [
              {
                type: 'free',
                points: [
                  { x: 0, y: 0, z: 0.2 },
                  { x: 10, y: 15, z: 0.6 },
                  { x: 20, y: 30, z: 0.8 },
                ],
              },
            ],
          },
        },
      ],
    };

    const result = importTldraw(tldrawDoc);
    expect(result.format).toBe('tldraw');
    expect(result.elements.length).toBe(1);
    const stroke = result.elements[0];
    expect(stroke.type).toBe('stroke');
    if (stroke.type === 'stroke') {
      expect(stroke.color).toBe('#0284c7'); // Mapped blue
      expect(stroke.size).toBe(4); // Mapped medium size
      expect(stroke.points[0]).toEqual({ x: 50, y: 50, pressure: 0.2 });
      expect(stroke.points[1]).toEqual({ x: 60, y: 65, pressure: 0.6 });
      expect(stroke.points[2]).toEqual({ x: 70, y: 80, pressure: 0.8 });
    }
  });

  it('imports tldraw geo shapes (rectangle, ellipse, diamond, arrow)', () => {
    const tldrawDoc = {
      records: [
        {
          id: 'shape:rect',
          typeName: 'shape',
          type: 'geo',
          x: 100,
          y: 100,
          props: {
            geo: 'rectangle',
            w: 120,
            h: 80,
            color: 'red',
            fill: 'none',
          },
        },
        {
          id: 'shape:ellipse',
          typeName: 'shape',
          type: 'geo',
          x: 250,
          y: 100,
          props: {
            geo: 'ellipse',
            w: 60,
            h: 60,
            color: 'green',
          },
        },
        {
          id: 'shape:diamond',
          typeName: 'shape',
          type: 'geo',
          x: 350,
          y: 100,
          props: {
            geo: 'diamond',
            w: 80,
            h: 80,
            color: 'violet',
          },
        },
        {
          id: 'shape:arrow',
          typeName: 'shape',
          type: 'arrow',
          x: 100,
          y: 300,
          props: {
            start: { x: 0, y: 0 },
            end: { x: 100, y: 50 },
            color: 'black',
          },
        },
      ],
    };

    const result = importTldraw(tldrawDoc);
    expect(result.elements.length).toBe(4);
    expect(result.elements[0].type).toBe('shape');
    expect((result.elements[0] as any).shapeType).toBe('rectangle');
    expect((result.elements[1] as any).shapeType).toBe('circle');
    expect((result.elements[2] as any).shapeType).toBe('diamond');
    expect((result.elements[3] as any).shapeType).toBe('arrow');
  });

  it('imports tldraw text shape', () => {
    const tldrawDoc = {
      records: [
        {
          id: 'shape:text1',
          typeName: 'shape',
          type: 'text',
          x: 40,
          y: 40,
          props: {
            text: 'Hello tldraw',
            size: 'l',
            color: 'black',
          },
        },
      ],
    };

    const result = importTldraw(tldrawDoc);
    expect(result.elements.length).toBe(1);
    const textEl = result.elements[0];
    expect(textEl.type).toBe('text');
    if (textEl.type === 'text') {
      expect(textEl.text).toBe('Hello tldraw');
      expect(textEl.fontSize).toBe(32);
    }
  });

  it('discards unsupported tldraw shapes (note, image, bookmark, video, unsupported geo)', () => {
    const tldrawDoc = {
      records: [
        { id: '1', typeName: 'shape', type: 'geo', x: 0, y: 0, props: { geo: 'rectangle' } },
        { id: '2', typeName: 'shape', type: 'note', x: 50, y: 50, props: { text: 'Sticky Note' } },
        { id: '3', typeName: 'shape', type: 'image', x: 100, y: 100 },
        { id: '4', typeName: 'shape', type: 'bookmark', x: 150, y: 150 },
        { id: '5', typeName: 'shape', type: 'geo', x: 200, y: 200, props: { geo: 'cloud' } },
      ],
    };

    const result = importTldraw(tldrawDoc);
    expect(result.elements.length).toBe(1);
    expect(result.discardedCount).toBe(4);
    expect(result.discardedTypes).toEqual(
      expect.arrayContaining(['note', 'image', 'bookmark', 'geo:cloud']),
    );
  });
});
