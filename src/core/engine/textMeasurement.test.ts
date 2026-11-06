import { describe, expect, it } from 'vitest';
import { measureTextBounds } from './textMeasurement';

describe('textMeasurement', () => {
  it('measures a single line of text with positive width and height', () => {
    const result = measureTextBounds('Hello World', 24);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.lines).toEqual(['Hello World']);
  });

  it('measures multiline text and returns correct lines and height proportional to line count', () => {
    const single = measureTextBounds('Hello', 20);
    const multi = measureTextBounds('Hello\nWorld\nFrom Scribl', 20);

    expect(multi.lines).toEqual(['Hello', 'World', 'From Scribl']);
    expect(multi.height).toBeGreaterThanOrEqual(single.height * 2.5);
  });

  it('handles empty text gracefully with non-zero minimum dimensions', () => {
    const result = measureTextBounds('', 24);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.lines).toEqual(['']);
  });

  it('scales dimensions proportionally with font size', () => {
    const small = measureTextBounds('Scale Test', 16);
    const large = measureTextBounds('Scale Test', 32);

    expect(large.height).toBeGreaterThan(small.height);
    expect(large.width).toBeGreaterThan(small.width);
  });
});
