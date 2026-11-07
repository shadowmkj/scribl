import { describe, expect, it } from 'vitest';
import { ShapeElement } from '../../types/canvas';
import { generateShapePath } from './shapeGeometry';

interface RecordedPath2D extends Path2D {
  ops: [string, ...unknown[]][];
}

// Polyfill Path2D for jsdom test environment if needed
if (typeof Path2D === 'undefined') {
  // @ts-expect-error jsdom environment polyfill
  globalThis.Path2D = class Path2D {
    ops: [string, ...unknown[]][] = [];
    rect(...args: unknown[]) {
      this.ops.push(['rect', ...args]);
    }
    roundRect(...args: unknown[]) {
      this.ops.push(['roundRect', ...args]);
    }
    ellipse(...args: unknown[]) {
      this.ops.push(['ellipse', ...args]);
    }
    moveTo(...args: unknown[]) {
      this.ops.push(['moveTo', ...args]);
    }
    lineTo(...args: unknown[]) {
      this.ops.push(['lineTo', ...args]);
    }
    closePath() {
      this.ops.push(['closePath']);
    }
  };
}

describe('shapeGeometry', () => {
  it('generates a Path2D for a rectangle', () => {
    const rect: ShapeElement = {
      id: 'rect-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const path = generateShapePath(rect) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops).toEqual([['rect', 10, 20, 100, 50]]);
  });

  it('generates a Path2D for a rectangle with border radius', () => {
    const rect: ShapeElement = {
      id: 'rect-round',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      borderRadius: 8,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const path = generateShapePath(rect) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops).toEqual([['roundRect', 10, 20, 100, 50, 8]]);
  });

  it('generates a Path2D for a circle/ellipse', () => {
    const circle: ShapeElement = {
      id: 'circle-1',
      type: 'shape',
      shapeType: 'circle',
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const path = generateShapePath(circle) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops).toEqual([['ellipse', 90, 90, 40, 40, 0, 0, Math.PI * 2]]);
  });

  it('generates a Path2D for a diamond', () => {
    const diamond: ShapeElement = {
      id: 'diamond-1',
      type: 'shape',
      shapeType: 'diamond',
      x: 0,
      y: 0,
      width: 60,
      height: 60,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const path = generateShapePath(diamond) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops).toEqual([
      ['moveTo', 30, 0],
      ['lineTo', 60, 30],
      ['lineTo', 30, 60],
      ['lineTo', 0, 30],
      ['closePath'],
    ]);
  });

  it('generates a Path2D for a line with explicit start and end points', () => {
    const line: ShapeElement = {
      id: 'line-1',
      type: 'shape',
      shapeType: 'line',
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      startPoint: { x: 10, y: 10 },
      endPoint: { x: 60, y: 60 },
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const path = generateShapePath(line) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops).toEqual([
      ['moveTo', 10, 10],
      ['lineTo', 60, 60],
    ]);
  });

  it('generates a Path2D for a line falling back to bounds if startPoint/endPoint omitted', () => {
    const line: ShapeElement = {
      id: 'line-2',
      type: 'shape',
      shapeType: 'line',
      x: 5,
      y: 15,
      width: 100,
      height: 200,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const path = generateShapePath(line) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops).toEqual([
      ['moveTo', 5, 15],
      ['lineTo', 105, 215],
    ]);
  });

  it('generates a Path2D for an arrow with arrowhead', () => {
    const arrow: ShapeElement = {
      id: 'arrow-1',
      type: 'shape',
      shapeType: 'arrow',
      x: 0,
      y: 0,
      width: 100,
      height: 0,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 100, y: 0 },
    };
    const path = generateShapePath(arrow) as RecordedPath2D;
    expect(path).toBeInstanceOf(Path2D);
    expect(path.ops[0]).toEqual(['moveTo', 0, 0]);
    expect(path.ops[1]).toEqual(['lineTo', 100, 0]);
    // Arrow length is clamp(strokeWidth * 4 = 8, min: 10, max: 24) = 10
    // Angle = 0. arrowAngle = PI/6 = 30 deg.
    // a1X = 100 - 10 * cos(-pi/6) = 100 - 10 * sqrt(3)/2 = 100 - 8.660254 = 91.3397
    // a1Y = 0 - 10 * sin(-pi/6) = 5
    // a2X = 91.3397
    // a2Y = -5
    expect(path.ops[2]).toEqual(['moveTo', 100, 0]);
    expect(path.ops[3][0]).toBe('lineTo');
    expect(path.ops[3][1] as number).toBeCloseTo(91.34, 1);
    expect(path.ops[3][2] as number).toBeCloseTo(5, 1);
    expect(path.ops[4]).toEqual(['moveTo', 100, 0]);
    expect(path.ops[5][0]).toBe('lineTo');
    expect(path.ops[5][1] as number).toBeCloseTo(91.34, 1);
    expect(path.ops[5][2] as number).toBeCloseTo(-5, 1);
  });
});
