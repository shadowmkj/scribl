import { describe, expect, it, vi } from 'vitest';
import { ShapeElement, StrokeElement, TextElement } from '../../types/canvas';
import { exportToPng, parseScriblJSON, serializeScriblDoc } from './fileIO';

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

describe('fileIO', () => {
  const dummyStroke: StrokeElement = {
    id: 's1',
    type: 'stroke',
    x: 10,
    y: 10,
    width: 20,
    height: 20,
    zIndex: 1,
    color: '#0284c7',
    size: 4,
    thinning: 0.6,
    smoothing: 0.5,
    points: [{ x: 10, y: 10, pressure: 0.5 }],
  };

  const dummyText: TextElement = {
    id: 't1',
    type: 'text',
    x: 50,
    y: 60,
    width: 120,
    height: 48,
    zIndex: 2,
    color: '#e11d48',
    text: 'Hello World\nLine 2',
    fontSize: 24,
    fontFamily: 'sans-serif',
    lineHeight: 1.25,
  };

  it('serializes and parses valid .scribl JSON with strokes and text', () => {
    const json = serializeScriblDoc(
      { s1: dummyStroke, t1: dummyText },
      ['s1', 't1'],
      { x: 0, y: 0, zoom: 1 },
      'My Notes',
    );
    const parsed = parseScriblJSON(json);

    expect(parsed.app).toBe('scribl');
    expect(parsed.version).toBe(1);
    expect(parsed.name).toBe('My Notes');
    expect(parsed.elementIds).toEqual(['s1', 't1']);
    expect((parsed.elements['s1'] as StrokeElement).color).toBe('#0284c7');

    const textEl = parsed.elements['t1'] as TextElement;
    expect(textEl.type).toBe('text');
    expect(textEl.text).toBe('Hello World\nLine 2');
    expect(textEl.fontSize).toBe(24);
    expect(textEl.fontFamily).toBe('sans-serif');
    expect(textEl.color).toBe('#e11d48');
    expect(textEl.width).toBe(120);
    expect(textEl.height).toBe(48);
  });

  it('serializes and deserializes documents containing shape elements', () => {
    const shape: ShapeElement = {
      id: 'shape-1',
      type: 'shape',
      shapeType: 'circle',
      x: 20,
      y: 30,
      width: 80,
      height: 80,
      zIndex: 1,
      strokeColor: '#0284c7',
      fillColor: '#e11d48',
      strokeWidth: 4,
      strokeStyle: 'dashed',
    };

    const json = serializeScriblDoc({ 'shape-1': shape }, ['shape-1'], { x: 0, y: 0, zoom: 1 });
    const parsed = parseScriblJSON(json);

    expect(parsed.elements['shape-1']).toBeDefined();
    const loadedShape = parsed.elements['shape-1'] as ShapeElement;
    expect(loadedShape.type).toBe('shape');
    expect(loadedShape.shapeType).toBe('circle');
    expect(loadedShape.fillColor).toBe('#e11d48');
    expect(loadedShape.strokeStyle).toBe('dashed');
    expect(loadedShape.strokeWidth).toBe(4);
  });

  it('exports documents containing shapes to PNG data URL', async () => {
    const mockCtx = {
      scale: vi.fn(),
      translate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mock',
    );

    const rect: ShapeElement = {
      id: 'rect-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 10,
      width: 100,
      height: 50,
      zIndex: 1,
      strokeColor: '#000000',
      fillColor: '#0284c7',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };

    const dataUrl = await exportToPng({ 'rect-1': rect }, ['rect-1']);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(mockCtx.stroke).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
  });

  it('throws error on invalid JSON', () => {
    expect(() => parseScriblJSON('invalid json')).toThrow();
  });

  it('exports text elements to canvas context when exportToPng is called', async () => {
    const fillTextSpy = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      fillText: fillTextSpy,
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mock',
    );

    const result = await exportToPng({ t1: dummyText }, ['t1']);
    expect(result).toBe('data:image/png;base64,mock');
    expect(fillTextSpy).toHaveBeenCalledWith('Hello World', 50, 60);
    expect(fillTextSpy).toHaveBeenCalledWith('Line 2', 50, 60 + 24 * 1.25);
  });

  it('adapts black strokes to white in dark mode and white to black in light mode when exporting to PNG', async () => {
    const mockCtx = {
      scale: vi.fn(),
      translate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      setLineDash: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,mock',
    );

    const blackStroke: StrokeElement = {
      ...dummyStroke,
      id: 's-black',
      color: '#000000',
    };

    // Dark mode export of black stroke -> fillStyle resolves to white (#ffffff)
    await exportToPng({ 's-black': blackStroke }, ['s-black'], 'dark');
    expect(mockCtx.fillStyle).toBe('#ffffff');

    // Light mode export of white stroke -> fillStyle resolves to black (#000000)
    const whiteStroke: StrokeElement = {
      ...dummyStroke,
      id: 's-white',
      color: '#ffffff',
    };
    await exportToPng({ 's-white': whiteStroke }, ['s-white'], 'light');
    expect(mockCtx.fillStyle).toBe('#000000');
  });
});
