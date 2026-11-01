import { describe, expect, it } from 'vitest';
import { StrokePoint } from '../../types/canvas';
import {
  computeBoundingBox,
  createStrokeElement,
  getStrokeOutline,
  getSvgPathFromStroke,
} from './InkingEngine';

describe('InkingEngine', () => {
  const samplePoints: StrokePoint[] = [
    { x: 10, y: 10, pressure: 0.5 },
    { x: 50, y: 50, pressure: 0.8 },
    { x: 100, y: 100, pressure: 0.3 },
  ];

  it('computes outline polygon points using perfect-freehand', () => {
    const outline = getStrokeOutline(samplePoints, 4, 0.6, 0.5);
    expect(outline.length).toBeGreaterThan(0);
    expect(outline[0]).toHaveLength(2);
  });

  it('generates a valid closed SVG path string from outline', () => {
    const outline = getStrokeOutline(samplePoints, 4, 0.6, 0.5);
    const pathString = getSvgPathFromStroke(outline);
    expect(pathString.startsWith('M')).toBe(true);
    expect(pathString.endsWith('Z')).toBe(true);
  });

  it('computes accurate bounding box accounting for stroke width padding', () => {
    const bbox = computeBoundingBox(samplePoints, 8);
    expect(bbox.minX).toBeLessThanOrEqual(10);
    expect(bbox.minY).toBeLessThanOrEqual(10);
    expect(bbox.maxX).toBeGreaterThanOrEqual(100);
    expect(bbox.maxY).toBeGreaterThanOrEqual(100);
  });

  it('constructs complete StrokeElement with bounding box and properties', () => {
    const element = createStrokeElement(samplePoints, '#0284c7', 4, 1);
    expect(element.type).toBe('stroke');
    expect(element.color).toBe('#0284c7');
    expect(element.size).toBe(4);
    expect(element.points.length).toBe(3);
    expect(element.width).toBeGreaterThan(0);
    expect(element.height).toBeGreaterThan(0);
  });
});
