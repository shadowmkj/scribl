import { describe, expect, it } from 'vitest';
import { StrokeElement, TextElement } from '../../types/canvas';
import {
  computeSelectionBounds,
  getHandlePositions,
  hitTestHandles,
  rotateElement,
  scaleElement,
} from './transformMath';

describe('transformMath', () => {
  const stroke1: StrokeElement = {
    id: 's1',
    type: 'stroke',
    x: 10,
    y: 20,
    width: 40,
    height: 30,
    zIndex: 1,
    color: '#000',
    size: 4,
    thinning: 0.6,
    smoothing: 0.5,
    points: [
      { x: 10, y: 20, pressure: 0.5 },
      { x: 50, y: 50, pressure: 0.5 },
    ],
  };

  const stroke2: StrokeElement = {
    id: 's2',
    type: 'stroke',
    x: 60,
    y: 80,
    width: 20,
    height: 20,
    zIndex: 2,
    color: '#000',
    size: 2,
    thinning: 0.6,
    smoothing: 0.5,
    points: [
      { x: 60, y: 80, pressure: 0.5 },
      { x: 80, y: 100, pressure: 0.5 },
    ],
  };

  it('computes unified bounding box for single and multiple elements', () => {
    const single = computeSelectionBounds({ s1: stroke1 }, ['s1']);
    expect(single).toEqual({
      minX: 10,
      minY: 20,
      maxX: 50,
      maxY: 50,
      width: 40,
      height: 30,
      centerX: 30,
      centerY: 35,
    });

    const multi = computeSelectionBounds({ s1: stroke1, s2: stroke2 }, ['s1', 's2']);
    expect(multi).toEqual({
      minX: 10,
      minY: 20,
      maxX: 80,
      maxY: 100,
      width: 70,
      height: 80,
      centerX: 45,
      centerY: 60,
    });

    expect(computeSelectionBounds({}, [])).toBeNull();
  });

  it('calculates 4 corner handle positions', () => {
    const bounds = computeSelectionBounds({ s1: stroke1 }, ['s1'])!;
    const handles = getHandlePositions(bounds);
    expect(handles.nw).toEqual({ x: 10, y: 20 });
    expect(handles.ne).toEqual({ x: 50, y: 20 });
    expect(handles.se).toEqual({ x: 50, y: 50 });
    expect(handles.sw).toEqual({ x: 10, y: 50 });
  });

  it('hit tests handles with threshold', () => {
    const handles = {
      nw: { x: 10, y: 20 },
      ne: { x: 50, y: 20 },
      se: { x: 50, y: 50 },
      sw: { x: 10, y: 50 },
    };

    expect(hitTestHandles({ x: 12, y: 22 }, handles, 8)).toBe('nw');
    expect(hitTestHandles({ x: 49, y: 51 }, handles, 8)).toBe('se');
    expect(hitTestHandles({ x: 30, y: 35 }, handles, 8)).toBeNull();
  });

  it('scales element points and stroke size proportionally', () => {
    const anchor = { x: 10, y: 20 };
    const scaled = scaleElement(stroke1, anchor, 2, 2) as StrokeElement;

    expect(scaled.x).toBe(10);
    expect(scaled.y).toBe(20);
    expect(scaled.width).toBe(80);
    expect(scaled.height).toBe(60);
    expect(scaled.size).toBe(8); // 4 * 2
    expect(scaled.points[1]).toEqual({ x: 90, y: 80, pressure: 0.5 });
  });

  it('rotates element points around center', () => {
    const center = { x: 30, y: 35 };
    const rotated = rotateElement(stroke1, center, Math.PI / 2) as StrokeElement; // 90 deg clockwise

    expect(rotated.size).toBe(4); // invariant
    // (x', y') for (10, 20) around (30, 35):
    // dx = -20, dy = -15 -> x' = 30 - (-15) = 45, y' = 35 + (-20) = 15
    expect(rotated.points[0].x).toBeCloseTo(45, 1);
    expect(rotated.points[0].y).toBeCloseTo(15, 1);
  });

  it('scales text element and correspondingly updates font size and dimensions', () => {
    const textEl: TextElement = {
      id: 't1',
      type: 'text',
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      zIndex: 1,
      text: 'Scalable text',
      fontSize: 20,
      fontFamily: 'normal',
      color: '#0284c7',
      lineHeight: 1.25,
    };

    const anchor = { x: 100, y: 100 };
    const scaled = scaleElement(textEl, anchor, 2, 2) as TextElement;

    expect(scaled.type).toBe('text');
    expect(scaled.fontSize).toBe(40); // 20 * 2
    expect(scaled.x).toBe(100);
    expect(scaled.y).toBe(100);
    expect(scaled.width).toBeGreaterThan(textEl.width);
    expect(scaled.height).toBeGreaterThan(textEl.height);
  });

  it('rotates text element center around rotation center', () => {
    const textEl: TextElement = {
      id: 't1',
      type: 'text',
      x: 100,
      y: 100,
      width: 100,
      height: 40,
      zIndex: 1,
      text: 'Rotate text',
      fontSize: 20,
      fontFamily: 'normal',
      color: '#0284c7',
      lineHeight: 1.25,
    };

    const center = { x: 150, y: 120 }; // Exact center of textEl
    const rotated = rotateElement(textEl, center, Math.PI / 2) as TextElement;

    expect(rotated.fontSize).toBe(20);
    // Center was already at rotation center, so x and y should remain centered
    expect(rotated.x + rotated.width / 2).toBeCloseTo(150, 0);
    expect(rotated.y + rotated.height / 2).toBeCloseTo(120, 0);
  });
});
