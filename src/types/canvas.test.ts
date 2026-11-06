import { describe, expect, it } from 'vitest';
import {
  CanvasElement,
  ShapeElement,
  ShapeType,
  StrokeElement,
  StrokeStyle,
  ToolType,
} from './canvas';

describe('canvas types', () => {
  it('instantiates a valid ShapeElement', () => {
    const shape: ShapeElement = {
      id: 'shape-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 20,
      width: 100,
      height: 60,
      zIndex: 1,
      strokeColor: '#0284c7',
      fillColor: 'transparent',
      strokeWidth: 4,
      strokeStyle: 'solid',
    };

    const element: CanvasElement = shape;
    expect(element.type).toBe('shape');
    if (element.type === 'shape') {
      expect(element.shapeType).toBe('rectangle');
      expect(element.strokeWidth).toBe(4);
    }
  });

  it('supports line and arrow shapes with start and end points', () => {
    const arrow: ShapeElement = {
      id: 'arrow-1',
      type: 'shape',
      shapeType: 'arrow',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      zIndex: 2,
      strokeColor: '#e11d48',
      strokeWidth: 2,
      strokeStyle: 'dashed',
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 50, y: 50 },
    };

    expect(arrow.startPoint).toEqual({ x: 0, y: 0 });
    expect(arrow.endPoint).toEqual({ x: 50, y: 50 });
  });

  it('allows all supported ShapeType and StrokeStyle variants', () => {
    const validShapeTypes: ShapeType[] = ['line', 'arrow', 'rectangle', 'circle', 'diamond'];
    const validStrokeStyles: StrokeStyle[] = ['solid', 'dashed', 'dotted'];

    expect(validShapeTypes).toHaveLength(5);
    expect(validStrokeStyles).toHaveLength(3);
  });

  it('extends ToolType to include all shape tools alongside core tools', () => {
    const tools: ToolType[] = [
      'select',
      'pen',
      'eraser',
      'zoom',
      'rectangle',
      'circle',
      'diamond',
      'line',
      'arrow',
    ];

    expect(tools).toContain('rectangle');
    expect(tools).toContain('circle');
    expect(tools).toContain('diamond');
    expect(tools).toContain('line');
    expect(tools).toContain('arrow');
  });

  it('allows CanvasElement union to discriminate between StrokeElement and ShapeElement', () => {
    const stroke: StrokeElement = {
      id: 'stroke-1',
      type: 'stroke',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      zIndex: 1,
      points: [{ x: 0, y: 0, pressure: 0.5 }],
      color: '#000000',
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
    };

    const shape: ShapeElement = {
      id: 'shape-2',
      type: 'shape',
      shapeType: 'circle',
      x: 5,
      y: 5,
      width: 20,
      height: 20,
      zIndex: 2,
      strokeColor: '#ff0000',
      strokeWidth: 2,
      strokeStyle: 'dotted',
      borderRadius: 10,
    };

    const elements: CanvasElement[] = [stroke, shape];
    const types = elements.map((el) => {
      if (el.type === 'stroke') {
        return `stroke:${el.points.length}`;
      } else {
        return `shape:${el.shapeType}`;
      }
    });

    expect(types).toEqual(['stroke:1', 'shape:circle']);
  });
});
