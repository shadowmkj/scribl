import { describe, expect, it } from 'vitest';
import { StrokeElement, TextElement } from '../../types/canvas';
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

  describe('TextElement hit testing', () => {
    const textEl: TextElement = {
      id: 't1',
      type: 'text',
      x: 100,
      y: 100,
      width: 150,
      height: 40,
      zIndex: 2,
      text: 'Sample Heading',
      fontSize: 24,
      fontFamily: 'system-ui, sans-serif',
      color: '#f8fafc',
      lineHeight: 1.25,
    };

    const textElements = { t1: textEl };
    const textIds = ['t1'];

    it('detects point hit inside text element bounding box', () => {
      // Middle of text box
      const hit = hitTestPoint(textElements, textIds, { x: 150, y: 120 });
      expect(hit).toBe('t1');
    });

    it('detects point hit within threshold edge margin', () => {
      // 5px to the left of x:100 (inside default threshold of 8)
      const hit = hitTestPoint(textElements, textIds, { x: 95, y: 120 });
      expect(hit).toBe('t1');
    });

    it('returns null when point is beyond threshold from text box', () => {
      // 20px above y:100
      const hit = hitTestPoint(textElements, textIds, { x: 150, y: 80 });
      expect(hit).toBeNull();
    });

    it('selects text element in marquee intersection', () => {
      const selected = hitTestMarquee(textElements, textIds, {
        minX: 50,
        minY: 50,
        maxX: 120,
        maxY: 120,
      });
      expect(selected).toEqual(['t1']);
    });
  });
});
