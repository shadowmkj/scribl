import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Camera,
  CanvasElement,
  ShapeElement,
  StrokeElement,
  TextElement,
} from '../../types/canvas';
import { renderCommittedCanvas, renderShape, renderText } from './CanvasRenderer';

// Polyfill Path2D for jsdom test environment if needed
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

function createMockContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    fillText: vi.fn(),
    setLineDash: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    textBaseline: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
  } as unknown as CanvasRenderingContext2D & {
    save: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
    setTransform: ReturnType<typeof vi.fn>;
    clearRect: ReturnType<typeof vi.fn>;
    scale: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>;
    fillText: ReturnType<typeof vi.fn>;
    setLineDash: ReturnType<typeof vi.fn>;
    fill: ReturnType<typeof vi.fn>;
    stroke: ReturnType<typeof vi.fn>;
  };
}

describe('CanvasRenderer with TextElement', () => {
  let mockCtx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    mockCtx = createMockContext();
  });

  const dummyText: TextElement = {
    id: 't1',
    type: 'text',
    x: 100,
    y: 150,
    width: 200,
    height: 60,
    zIndex: 1,
    text: 'First Line\nSecond Line',
    fontSize: 24,
    fontFamily: 'system-ui, sans-serif',
    color: '#0284c7',
    lineHeight: 1.25,
  };

  const camera: Camera = { x: 0, y: 0, zoom: 1 };

  it('renders multiline text with correct font, color, and baseline using renderText', () => {
    renderText(mockCtx, dummyText);

    expect(mockCtx.font).toBe('24px system-ui, sans-serif');
    expect(mockCtx.fillStyle).toBe('#0284c7');
    expect(mockCtx.textBaseline).toBe('top');

    // Should call fillText for each line
    expect(mockCtx.fillText).toHaveBeenCalledTimes(2);
    expect(mockCtx.fillText).toHaveBeenNthCalledWith(1, 'First Line', 100, 150);
    expect(mockCtx.fillText).toHaveBeenNthCalledWith(2, 'Second Line', 100, 150 + 24 * 1.25);
  });

  it('resolves handwritten and code font family IDs to appropriate CSS font strings', () => {
    const handwrittenEl: TextElement = {
      ...dummyText,
      id: 't_hand',
      fontFamily: 'handwritten',
    };
    renderText(mockCtx, handwrittenEl);
    expect(mockCtx.font).toContain('Excalifont');

    const codeEl: TextElement = {
      ...dummyText,
      id: 't_code',
      fontFamily: 'code',
    };
    renderText(mockCtx, codeEl);
    expect(mockCtx.font).toContain('monospace');
  });

  it('expands tab characters to 2 spaces in renderText', () => {
    const tabEl: TextElement = {
      ...dummyText,
      id: 't_tab',
      text: '\tIndent\nNo indent\tEnd',
    };
    renderText(mockCtx, tabEl);
    expect(mockCtx.fillText).toHaveBeenCalledWith('  Indent', 100, 150);
    expect(mockCtx.fillText).toHaveBeenCalledWith('No indent  End', 100, 150 + 24 * 1.25);
  });

  it('renders text in renderCommittedCanvas alongside strokes', () => {
    const stroke: StrokeElement = {
      id: 's1',
      type: 'stroke',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      zIndex: 0,
      color: '#000000',
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      points: [{ x: 0, y: 0, pressure: 0.5 }],
    };

    const elements = { s1: stroke, t1: dummyText };
    const elementIds = ['s1', 't1'];

    renderCommittedCanvas(mockCtx, elements, elementIds, camera, 800, 600, 1);

    expect(mockCtx.fillText).toHaveBeenCalledTimes(2);
  });

  it('skips rendering text element when its ID matches editingTextElementId (prevents ghosting)', () => {
    const elements = { t1: dummyText };
    const elementIds = ['t1'];

    renderCommittedCanvas(mockCtx, elements, elementIds, camera, 800, 600, 1, 't1');

    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });
});

describe('CanvasRenderer - renderShape', () => {
  it('generates and caches Path2D on shape element', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      zIndex: 1,
      strokeColor: '#ff0000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };

    expect(shape.cachedPath2D).toBeUndefined();
    renderShape(ctx, shape);
    expect(shape.cachedPath2D).toBeDefined();
    expect(shape.cachedPath2D).toBeInstanceOf(Path2D);

    const firstCached = shape.cachedPath2D;
    renderShape(ctx, shape);
    expect(shape.cachedPath2D).toBe(firstCached); // Reused cache
  });

  it('renders solid shape without dash and strokes path', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-2',
      type: 'shape',
      shapeType: 'circle',
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      zIndex: 1,
      strokeColor: '#123456',
      strokeWidth: 3,
      strokeStyle: 'solid',
    };

    renderShape(ctx, shape);

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.setLineDash).toHaveBeenCalledWith([]);
    expect(ctx.strokeStyle).toBe('#123456');
    expect(ctx.lineWidth).toBe(3);
    expect(ctx.lineCap).toBe('round');
    expect(ctx.lineJoin).toBe('round');
    expect(ctx.stroke).toHaveBeenCalledWith(shape.cachedPath2D);
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('renders dashed shape with appropriate dash pattern', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-3',
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 4,
      strokeStyle: 'dashed',
    };

    renderShape(ctx, shape);
    expect(ctx.setLineDash).toHaveBeenCalledWith([8, 8]);
  });

  it('renders dotted shape with appropriate dash pattern', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-4',
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 4,
      strokeStyle: 'dotted',
    };

    renderShape(ctx, shape);
    expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
  });

  it('fills shape if fillColor is provided and not transparent', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-5',
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
      fillColor: '#00ff00',
    };

    renderShape(ctx, shape);
    expect(ctx.fillStyle).toBe('#00ff00');
    expect(ctx.fill).toHaveBeenCalledWith(shape.cachedPath2D);
    expect(ctx.stroke).toHaveBeenCalledWith(shape.cachedPath2D);
  });

  it('does not fill shape if fillColor is transparent', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-6',
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 60,
      height: 60,
      zIndex: 1,
      strokeColor: '#000000',
      strokeWidth: 2,
      strokeStyle: 'solid',
      fillColor: 'transparent',
    };

    renderShape(ctx, shape);
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalledWith(shape.cachedPath2D);
  });
});

describe('CanvasRenderer - renderCommittedCanvas with shapes', () => {
  const camera: Camera = { x: 0, y: 0, zoom: 1 };

  it('renders both strokes and shapes in order', () => {
    const ctx = createMockContext();
    const shape: ShapeElement = {
      id: 'shape-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: -20,
      y: -20,
      width: 40,
      height: 40,
      zIndex: 1,
      strokeColor: '#111111',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };
    const stroke: StrokeElement = {
      id: 'stroke-1',
      type: 'stroke',
      points: [{ x: -10, y: -10, pressure: 0.5 }, { x: 10, y: 10, pressure: 0.5 }],
      color: '#222222',
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      x: -10,
      y: -10,
      width: 20,
      height: 20,
      zIndex: 2,
    };

    const elements: Record<string, CanvasElement> = {
      'shape-1': shape,
      'stroke-1': stroke,
    };

    renderCommittedCanvas(ctx, elements, ['shape-1', 'stroke-1'], camera, 800, 600, 1);

    expect(ctx.stroke).toHaveBeenCalledWith(shape.cachedPath2D);
    expect(ctx.fill).toHaveBeenCalled(); // stroke fill
  });

  it('culls shapes outside viewport frustum', () => {
    const ctx = createMockContext();
    const outsideShape: ShapeElement = {
      id: 'shape-outside',
      type: 'shape',
      shapeType: 'rectangle',
      x: 2000,
      y: 2000,
      width: 50,
      height: 50,
      zIndex: 1,
      strokeColor: '#ff0000',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };

    const elements: Record<string, CanvasElement> = {
      'shape-outside': outsideShape,
    };

    renderCommittedCanvas(ctx, elements, ['shape-outside'], camera, 800, 600, 1);
    expect(outsideShape.cachedPath2D).toBeUndefined();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });
});
