import { describe, expect, it } from 'vitest';
import { StrokeElement } from '../../types/canvas';
import { parseScriblJSON, serializeScriblDoc } from './fileIO';

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

  it('serializes and parses valid .scribl JSON', () => {
    const json = serializeScriblDoc({ s1: dummyStroke }, ['s1'], { x: 0, y: 0, zoom: 1 });
    const parsed = parseScriblJSON(json);

    expect(parsed.app).toBe('scribl');
    expect(parsed.version).toBe(1);
    expect(parsed.elementIds).toEqual(['s1']);
    expect(parsed.elements['s1'].color).toBe('#0284c7');
  });

  it('throws error on invalid JSON', () => {
    expect(() => parseScriblJSON('invalid json')).toThrow();
  });
});
