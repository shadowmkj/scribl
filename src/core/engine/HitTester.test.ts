import { describe, expect, it } from 'vitest';
import { CanvasElement, ShapeElement, ShapeType, StrokeElement } from '../../types/canvas';
import { hitTestMarquee, hitTestPoint, hitTestShape } from './HitTester';

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

  describe('Shape Hit Testing', () => {
    it('hit-tests interior of a filled rectangle', () => {
      const shapeElements: Record<string, CanvasElement> = {
        'rect-1': {
          id: 'rect-1',
          type: 'shape',
          shapeType: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          zIndex: 1,
          strokeColor: '#000000',
          fillColor: '#0284c7',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
      };
      expect(hitTestPoint(shapeElements, ['rect-1'], { x: 150, y: 150 })).toBe('rect-1');
    });

    it('hit-tests perimeter of an unfilled rectangle, ignoring the interior', () => {
      const shapeElements: Record<string, CanvasElement> = {
        'rect-hollow': {
          id: 'rect-hollow',
          type: 'shape',
          shapeType: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          zIndex: 1,
          strokeColor: '#000000',
          fillColor: 'transparent',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
      };
      // Center of hollow rectangle -> null
      expect(hitTestPoint(shapeElements, ['rect-hollow'], { x: 200, y: 150 })).toBeNull();
      // Near top border -> hit
      expect(hitTestPoint(shapeElements, ['rect-hollow'], { x: 150, y: 102 })).toBe('rect-hollow');
      // Near left border outside by 2px -> hit
      expect(hitTestPoint(shapeElements, ['rect-hollow'], { x: 98, y: 150 })).toBe('rect-hollow');
      // Far outside -> null
      expect(hitTestPoint(shapeElements, ['rect-hollow'], { x: 50, y: 50 })).toBeNull();
    });

    it('hit-tests a line and arrow within threshold', () => {
      const lineElements: Record<string, CanvasElement> = {
        'line-1': {
          id: 'line-1',
          type: 'shape',
          shapeType: 'line',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
          strokeColor: '#000000',
          strokeWidth: 4,
          strokeStyle: 'solid',
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 100 },
        },
      };
      expect(hitTestPoint(lineElements, ['line-1'], { x: 50, y: 52 })).toBe('line-1');
      expect(hitTestPoint(lineElements, ['line-1'], { x: 50, y: 80 })).toBeNull();
    });

    it('hit-tests an arrow along the shaft and arrowhead barbs', () => {
      const arrowElements: Record<string, CanvasElement> = {
        'arrow-1': {
          id: 'arrow-1',
          type: 'shape',
          shapeType: 'arrow',
          x: 0,
          y: 50,
          width: 100,
          height: 0,
          zIndex: 1,
          strokeColor: '#000000',
          strokeWidth: 4,
          strokeStyle: 'solid',
          startPoint: { x: 0, y: 50 },
          endPoint: { x: 100, y: 50 },
        },
      };
      // Shaft
      expect(hitTestPoint(arrowElements, ['arrow-1'], { x: 50, y: 52 })).toBe('arrow-1');
      // Near arrowhead endpoint
      expect(hitTestPoint(arrowElements, ['arrow-1'], { x: 98, y: 50 })).toBe('arrow-1');
      // Far away
      expect(hitTestPoint(arrowElements, ['arrow-1'], { x: 50, y: 10 })).toBeNull();
    });

    it('hit-tests filled and hollow circles', () => {
      const circleElements: Record<string, CanvasElement> = {
        'circle-filled': {
          id: 'circle-filled',
          type: 'shape',
          shapeType: 'circle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 1,
          strokeColor: '#000000',
          fillColor: '#ff0000',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
        'circle-hollow': {
          id: 'circle-hollow',
          type: 'shape',
          shapeType: 'circle',
          x: 300,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 2,
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
      };

      // Filled circle: center (150, 150) -> hit
      expect(hitTestPoint(circleElements, ['circle-filled'], { x: 150, y: 150 })).toBe(
        'circle-filled',
      );
      // Hollow circle: center (350, 150) -> null
      expect(hitTestPoint(circleElements, ['circle-hollow'], { x: 350, y: 150 })).toBeNull();
      // Hollow circle: top edge (350, 102) -> hit
      expect(hitTestPoint(circleElements, ['circle-hollow'], { x: 350, y: 102 })).toBe(
        'circle-hollow',
      );
      // Outside corner of bounding box (305, 105) -> null for circle
      expect(hitTestPoint(circleElements, ['circle-hollow'], { x: 305, y: 105 })).toBeNull();
    });

    it('hit-tests filled and hollow diamonds', () => {
      const diamondElements: Record<string, CanvasElement> = {
        'diamond-filled': {
          id: 'diamond-filled',
          type: 'shape',
          shapeType: 'diamond',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 1,
          strokeColor: '#000000',
          fillColor: '#00ff00',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
        'diamond-hollow': {
          id: 'diamond-hollow',
          type: 'shape',
          shapeType: 'diamond',
          x: 300,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 2,
          strokeColor: '#000000',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
      };

      // Filled diamond center (150, 150) -> hit
      expect(hitTestPoint(diamondElements, ['diamond-filled'], { x: 150, y: 150 })).toBe(
        'diamond-filled',
      );
      // Hollow diamond center (350, 150) -> null
      expect(hitTestPoint(diamondElements, ['diamond-hollow'], { x: 350, y: 150 })).toBeNull();
      // Hollow diamond edge: mid of top-right edge is around (375, 125) -> hit
      expect(hitTestPoint(diamondElements, ['diamond-hollow'], { x: 375, y: 125 })).toBe(
        'diamond-hollow',
      );
      // Corner of bounding box (310, 110) -> null (inside bbox but outside diamond)
      expect(hitTestPoint(diamondElements, ['diamond-hollow'], { x: 310, y: 110 })).toBeNull();
    });

    it('respects z-index order when shapes and strokes overlap', () => {
      const mixedElements: Record<string, CanvasElement> = {
        'rect-bottom': {
          id: 'rect-bottom',
          type: 'shape',
          shapeType: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 1,
          strokeColor: '#000',
          fillColor: '#ff0000',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
        'rect-top': {
          id: 'rect-top',
          type: 'shape',
          shapeType: 'rectangle',
          x: 100,
          y: 100,
          width: 100,
          height: 100,
          zIndex: 2,
          strokeColor: '#000',
          fillColor: '#0000ff',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
      };

      // elementIds sorted by zIndex ascending: ['rect-bottom', 'rect-top']
      expect(hitTestPoint(mixedElements, ['rect-bottom', 'rect-top'], { x: 150, y: 150 })).toBe(
        'rect-top',
      );
      // If order reversed:
      expect(hitTestPoint(mixedElements, ['rect-top', 'rect-bottom'], { x: 150, y: 150 })).toBe(
        'rect-bottom',
      );
    });

    it('selects shapes via hitTestMarquee', () => {
      const shapes: Record<string, CanvasElement> = {
        r1: {
          id: 'r1',
          type: 'shape',
          shapeType: 'rectangle',
          x: 50,
          y: 50,
          width: 50,
          height: 50,
          zIndex: 1,
          strokeColor: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
        r2: {
          id: 'r2',
          type: 'shape',
          shapeType: 'circle',
          x: 200,
          y: 200,
          width: 50,
          height: 50,
          zIndex: 2,
          strokeColor: '#000',
          strokeWidth: 2,
          strokeStyle: 'solid',
        },
      };

      const selected = hitTestMarquee(shapes, ['r1', 'r2'], {
        minX: 40,
        minY: 40,
        maxX: 120,
        maxY: 120,
      });
      expect(selected).toEqual(['r1']);

      const selectedBoth = hitTestMarquee(shapes, ['r1', 'r2'], {
        minX: 0,
        minY: 0,
        maxX: 300,
        maxY: 300,
      });
      expect(selectedBoth).toEqual(['r1', 'r2']);

      const selectedNone = hitTestMarquee(shapes, ['r1', 'r2'], {
        minX: 500,
        minY: 500,
        maxX: 600,
        maxY: 600,
      });
      expect(selectedNone).toEqual([]);
    });

    it('hit-tests rounded rectangles taking borderRadius into account', () => {
      const roundedRect: ShapeElement = {
        id: 'round-1',
        type: 'shape',
        shapeType: 'rectangle',
        x: 100,
        y: 100,
        width: 100,
        height: 100,
        borderRadius: 20,
        zIndex: 1,
        strokeColor: '#000',
        fillColor: '#abcdef',
        strokeWidth: 2,
        strokeStyle: 'solid',
      };

      // Interior center is hit
      expect(hitTestShape(roundedRect, { x: 150, y: 150 })).toBe(true);
      // Extreme corner at (102, 102) is outside the rounded corner circle (radius 20)
      // Center of corner is (120, 120). dist((102, 102), (120, 120)) = sqrt(18^2 + 18^2) = 25.45 > 20
      // Stroke tolerance is 1 + 8 = 9. 25.45 - 20 = 5.45 <= 9, so at (101, 101) dist is sqrt(19^2+19^2) = 26.87 -> 6.87 <= 9
      // At (100, 100), distance to corner center (120, 120) is sqrt(20^2 + 20^2) = 28.28. Distance to arc is 8.28 <= 9.
      // Outside bounding box corner at (90, 90) -> false
      expect(hitTestShape(roundedRect, { x: 80, y: 80 })).toBe(false);
    });

    it('hit-tests lines and arrows falling back to x, y, width, height', () => {
      const lineNoPoints: ShapeElement = {
        id: 'line-bounds',
        type: 'shape',
        shapeType: 'line',
        x: 10,
        y: 20,
        width: 100,
        height: 0,
        zIndex: 1,
        strokeColor: '#000',
        strokeWidth: 2,
        strokeStyle: 'solid',
      };

      expect(hitTestShape(lineNoPoints, { x: 50, y: 20 })).toBe(true);
      expect(hitTestShape(lineNoPoints, { x: 50, y: 50 })).toBe(false);
    });

    it('hit-tests ellipse with different width and height', () => {
      const ellipse: ShapeElement = {
        id: 'ellipse-1',
        type: 'shape',
        shapeType: 'circle',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        zIndex: 1,
        strokeColor: '#000',
        fillColor: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
      };

      // Center of hollow ellipse is null
      expect(hitTestShape(ellipse, { x: 200, y: 150 })).toBe(false);
      // Right edge (x: 300, y: 150) -> hit
      expect(hitTestShape(ellipse, { x: 300, y: 150 })).toBe(true);
      // Top edge (x: 200, y: 100) -> hit
      expect(hitTestShape(ellipse, { x: 200, y: 100 })).toBe(true);
      // Far corner of bounding box (105, 105) -> false
      expect(hitTestShape(ellipse, { x: 105, y: 105 })).toBe(false);
    });

    it('does not falsely hit interior of a hollow rounded rectangle near corner arc circle', () => {
      const hollowRound: ShapeElement = {
        id: 'round-hollow',
        type: 'shape',
        shapeType: 'rectangle',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        borderRadius: 40,
        zIndex: 1,
        strokeColor: '#000',
        fillColor: 'transparent',
        strokeWidth: 2,
        strokeStyle: 'solid',
      };

      // Corner center is (140, 140). A point at (180, 140) is in the interior at distance 40 from (140, 140),
      // which would be on the full 360 circle if not quadrant clamped.
      expect(hitTestShape(hollowRound, { x: 180, y: 140 })).toBe(false);
      // Center of rectangle
      expect(hitTestShape(hollowRound, { x: 200, y: 200 })).toBe(false);
      // Actual top-left rounded corner arc at around (112, 112)
      // dist((112, 112), (140, 140)) = sqrt(28^2 + 28^2) = 39.6 -> diff to 40 is 0.4 <= tolerance
      expect(hitTestShape(hollowRound, { x: 112, y: 112 })).toBe(true);
    });

    it('returns false for unknown shape type', () => {
      const unknown = {
        id: 'u1',
        type: 'shape' as const,
        shapeType: 'polygon' as unknown as ShapeType,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        zIndex: 1,
        strokeColor: '#000',
        strokeWidth: 1,
        strokeStyle: 'solid' as const,
      };
      expect(hitTestShape(unknown, { x: 5, y: 5 })).toBe(false);
    });
  });
});
