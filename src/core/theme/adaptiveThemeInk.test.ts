import { describe, expect, it, vi } from 'vitest';
import { ShapeElement, StrokeElement, TextElement } from '../../types/canvas';
import {
  renderShape,
  renderStroke,
  renderText,
  resolveCanvasColor,
} from '../engine/CanvasRenderer';
import { resolveTheme } from './themeManager';

// Polyfill Path2D for jsdom test environment
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
  } as unknown as CanvasRenderingContext2D;
}

describe('Adaptive Theme Ink across Light and Dark Themes (Issues #4 & #5)', () => {
  it('identifies theme mode explicitly from presets', () => {
    const darkTheme = resolveTheme({ name: 'default-dark', overrides: {} });
    expect(darkTheme.mode).toBe('dark');

    const lightTheme = resolveTheme({ name: 'light', overrides: {} });
    expect(lightTheme.mode).toBe('light');

    const tokyoTheme = resolveTheme({ name: 'tokyo-night', overrides: {} });
    expect(tokyoTheme.mode).toBe('dark');

    const catppuccinTheme = resolveTheme({ name: 'catppuccin', overrides: {} });
    expect(catppuccinTheme.mode).toBe('dark');
  });

  it('switches black stroke on light theme to white on dark theme', () => {
    const ctx = createMockContext();

    const stroke: StrokeElement = {
      id: 'stroke-1',
      type: 'stroke',
      points: [{ x: 0, y: 0, pressure: 0.5 }, { x: 10, y: 10, pressure: 0.5 }],
      color: '#1e293b', // Obsidian / Black
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      zIndex: 1,
    };

    // Under light theme: renders black
    const lightMode = resolveTheme({ name: 'light', overrides: {} }).mode;
    renderStroke(ctx, stroke, lightMode);
    expect(ctx.fillStyle).toBe('#000000');

    // Switch to dark theme: stroke automatically renders white
    const darkMode = resolveTheme({ name: 'default-dark', overrides: {} }).mode;
    renderStroke(ctx, stroke, darkMode);
    expect(ctx.fillStyle).toBe('#ffffff');
  });

  it('switches white stroke on dark theme to black on light theme', () => {
    const ctx = createMockContext();

    const stroke: StrokeElement = {
      id: 'stroke-2',
      type: 'stroke',
      points: [{ x: 0, y: 0, pressure: 0.5 }, { x: 10, y: 10, pressure: 0.5 }],
      color: '#ffffff', // Pure White
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      zIndex: 1,
    };

    // Under dark theme: renders white
    const darkMode = resolveTheme({ name: 'tokyo-night', overrides: {} }).mode;
    renderStroke(ctx, stroke, darkMode);
    expect(ctx.fillStyle).toBe('#ffffff');

    // Switch to light theme: stroke automatically renders black
    const lightMode = resolveTheme({ name: 'light', overrides: {} }).mode;
    renderStroke(ctx, stroke, lightMode);
    expect(ctx.fillStyle).toBe('#000000');
  });

  it('preserves accent colors across dark and light theme switches', () => {
    const ctx = createMockContext();

    const coralStroke: StrokeElement = {
      id: 'stroke-3',
      type: 'stroke',
      points: [{ x: 0, y: 0, pressure: 0.5 }],
      color: '#e11d48', // Coral Red
      size: 4,
      thinning: 0.5,
      smoothing: 0.5,
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      zIndex: 1,
    };

    renderStroke(ctx, coralStroke, 'light');
    expect(ctx.fillStyle).toBe('#e11d48');

    renderStroke(ctx, coralStroke, 'dark');
    expect(ctx.fillStyle).toBe('#e11d48');
  });

  it('adapts shapes and text elements when toggling theme mode', () => {
    const ctx = createMockContext();

    const shape: ShapeElement = {
      id: 'shape-1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 50,
      height: 50,
      zIndex: 1,
      strokeColor: '#000000',
      fillColor: '#ffffff',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };

    const text: TextElement = {
      id: 'text-1',
      type: 'text',
      x: 0,
      y: 0,
      width: 60,
      height: 20,
      zIndex: 2,
      text: 'Adaptive Text',
      fontSize: 16,
      fontFamily: 'normal',
      color: '#000000',
      lineHeight: 1.25,
    };

    // Light mode
    renderShape(ctx, shape, 'light');
    expect(ctx.strokeStyle).toBe('#000000');
    expect(ctx.fillStyle).toBe('#000000');

    renderText(ctx, text, 'light');
    expect(ctx.fillStyle).toBe('#000000');

    // Dark mode
    renderShape(ctx, shape, 'dark');
    expect(ctx.strokeStyle).toBe('#ffffff');
    expect(ctx.fillStyle).toBe('#ffffff');

    renderText(ctx, text, 'dark');
    expect(ctx.fillStyle).toBe('#ffffff');
  });

  it('derives mode from canvas_bg luminance if mode is not explicitly specified', () => {
    // Custom theme with white canvas_bg
    const customLight = resolveTheme({
      name: 'default-dark',
      overrides: { canvas_bg: '#f0f4f8' },
    });
    expect(customLight.mode).toBe('light');
    expect(resolveCanvasColor('#ffffff', customLight.mode)).toBe('#000000');

    // Custom theme with dark canvas_bg
    const customDark = resolveTheme({
      name: 'light',
      overrides: { canvas_bg: '#181825' },
    });
    expect(customDark.mode).toBe('dark');
    expect(resolveCanvasColor('#000000', customDark.mode)).toBe('#ffffff');
  });
});
