import { describe, expect, it } from 'vitest';
import { importDrawingDocument } from './index';

describe('importDrawingDocument', () => {
  it('dispatches native Scribl file', () => {
    const scriblJSON = JSON.stringify({
      app: 'scribl',
      version: 1,
      elementIds: ['s1'],
      elements: {
        s1: {
          id: 's1',
          type: 'stroke',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          points: [{ x: 0, y: 0, pressure: 0.5 }],
          color: '#000',
          size: 2,
        },
      },
      camera: { x: 0, y: 0, zoom: 1 },
    });

    const result = importDrawingDocument(scriblJSON, 'drawing.scribl');
    expect(result.format).toBe('scribl');
    expect(result.elements.length).toBe(1);
    expect(result.discardedCount).toBe(0);
  });

  it('dispatches Excalidraw file string', () => {
    const excalidrawJSON = JSON.stringify({
      type: 'excalidraw',
      elements: [{ id: 'r1', type: 'rectangle', x: 10, y: 20, width: 50, height: 50 }],
    });

    const result = importDrawingDocument(excalidrawJSON, 'sketch.excalidraw');
    expect(result.format).toBe('excalidraw');
    expect(result.elements.length).toBe(1);
    expect(result.discardedCount).toBe(0);
  });

  it('dispatches tldraw file string', () => {
    const tldrawJSON = JSON.stringify({
      tldrawFileFormatVersion: 1,
      records: [{
        id: 's1',
        typeName: 'shape',
        type: 'geo',
        x: 0,
        y: 0,
        props: { geo: 'rectangle' },
      }],
    });

    const result = importDrawingDocument(tldrawJSON, 'whiteboard.tldr');
    expect(result.format).toBe('tldraw');
    expect(result.elements.length).toBe(1);
    expect(result.discardedCount).toBe(0);
  });

  it('throws for corrupted json string', () => {
    expect(() => importDrawingDocument('not json')).toThrow(/Could not parse drawing JSON/);
  });

  it('throws for unrecognized json structure', () => {
    expect(() => importDrawingDocument(JSON.stringify({ hello: 'world' }))).toThrow(
      /Unrecognized drawing format/,
    );
  });
});
