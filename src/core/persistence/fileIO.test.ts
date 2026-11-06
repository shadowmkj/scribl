import { describe, expect, it, vi } from 'vitest';
import { StrokeElement, TextElement } from '../../types/canvas';
import { exportToPng, parseScriblJSON, serializeScriblDoc } from './fileIO';

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
    expect(parsed.elements['s1'].color).toBe('#0284c7');

    const textEl = parsed.elements['t1'] as TextElement;
    expect(textEl.type).toBe('text');
    expect(textEl.text).toBe('Hello World\nLine 2');
    expect(textEl.fontSize).toBe(24);
    expect(textEl.fontFamily).toBe('sans-serif');
    expect(textEl.color).toBe('#e11d48');
    expect(textEl.width).toBe(120);
    expect(textEl.height).toBe(48);
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
});
