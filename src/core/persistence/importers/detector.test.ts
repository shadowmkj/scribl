import { describe, expect, it } from 'vitest';
import { detectDrawingFormat } from './detector';

describe('detectDrawingFormat', () => {
  it('detects Scribl document format', () => {
    const data = { app: 'scribl', version: 1, elementIds: [], elements: {} };
    expect(detectDrawingFormat(data)).toBe('scribl');
  });

  it('detects Excalidraw format with type excalidraw', () => {
    const data = { type: 'excalidraw', version: 2, elements: [] };
    expect(detectDrawingFormat(data)).toBe('excalidraw');
  });

  it('detects Excalidraw format with elements array fallback', () => {
    const data = { elements: [{ type: 'freedraw', id: '1' }] };
    expect(detectDrawingFormat(data)).toBe('excalidraw');
  });

  it('detects tldraw format with tldrawFileFormatVersion', () => {
    const data = { tldrawFileFormatVersion: 1, records: [] };
    expect(detectDrawingFormat(data)).toBe('tldraw');
  });

  it('detects tldraw format with schemaVersion and records', () => {
    const data = { schema: { schemaVersion: 2 }, records: [] };
    expect(detectDrawingFormat(data)).toBe('tldraw');
  });

  it('detects tldraw format with records object map', () => {
    const data = { records: { 'shape:123': { typeName: 'shape', type: 'draw' } } };
    expect(detectDrawingFormat(data)).toBe('tldraw');
  });

  it('throws error for unrecognized format', () => {
    expect(() => detectDrawingFormat({ foo: 'bar' })).toThrow(/Unrecognized drawing format/);
    expect(() => detectDrawingFormat(null)).toThrow(/Unrecognized drawing format/);
    expect(() => detectDrawingFormat('string')).toThrow(/Unrecognized drawing format/);
  });
});
