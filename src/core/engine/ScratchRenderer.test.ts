import { describe, expect, it } from 'vitest';
import { ScratchRenderer } from './ScratchRenderer';

describe('ScratchRenderer', () => {
  it('manages eraser trail points without crashing', () => {
    const renderer = new ScratchRenderer();
    renderer.startEraserTrail({ x: 10, y: 10 });
    renderer.addEraserTrailPoint({ x: 20, y: 20 });
    renderer.addEraserTrailPoint({ x: 30, y: 30 });
    renderer.stopEraserTrail();
    expect(true).toBe(true);
  });
});
