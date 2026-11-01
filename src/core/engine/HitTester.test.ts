import { describe, expect, it } from 'vitest';
import { StrokeElement } from '../../types/canvas';
import { hitTestMarquee, hitTestPoint } from './HitTester';

describe('HitTester', () => {
  const stroke: StrokeElement = {
    id: 's1',
    type: 'stroke',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
    zIndex: 1,
    color: '#000',
    size: 4,
    thinning: 0.6,
    smoothing: 0.5,
    points: [
      { x: 10, y: 10, pressure: 0.5 },
      { x: 50, y: 50, pressure: 0.5 },
      { x: 90, y: 90, pressure: 0.5 },
    ],
  };

  const elements = { s1: stroke };
  const elementIds = ['s1'];

  it('detects point hit near stroke line', () => {
    const hit = hitTestPoint(elements, elementIds, { x: 50, y: 50 });
    expect(hit).toBe('s1');
  });

  it('returns null when point is far away from stroke', () => {
    const hit = hitTestPoint(elements, elementIds, { x: 500, y: 500 });
    expect(hit).toBeNull();
  });

  it('selects stroke when marquee encompasses or touches bounding box', () => {
    const selected = hitTestMarquee(elements, elementIds, {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
    });
    expect(selected).toEqual(['s1']);
  });
});
