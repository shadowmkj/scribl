import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Camera, StrokeElement, TextElement } from '../../types/canvas';
import { renderCommittedCanvas, renderText } from './CanvasRenderer';

describe('CanvasRenderer with TextElement', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      fillText: vi.fn(),
      fill: vi.fn(),
      font: '',
      fillStyle: '',
      textBaseline: '',
    };
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
