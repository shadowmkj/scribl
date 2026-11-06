export interface TextBounds {
  width: number;
  height: number;
  lines: string[];
}

let cachedContext: CanvasRenderingContext2D | null = null;

function getMeasurementContext(): CanvasRenderingContext2D | null {
  if (cachedContext) return cachedContext;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    cachedContext = canvas.getContext('2d');
  }
  return cachedContext;
}

export function measureTextBounds(
  text: string,
  fontSize: number,
  fontFamily: string = 'system-ui, -apple-system, sans-serif',
  lineHeight: number = 1.25,
): TextBounds {
  const lines = text.split('\n');
  const ctx = getMeasurementContext();
  const font = `${fontSize}px ${fontFamily}`;

  let maxLineWidth = 0;

  if (ctx) {
    ctx.font = font;
  }

  for (const line of lines) {
    let lineWidth = 0;
    if (ctx && typeof ctx.measureText === 'function') {
      const metrics = ctx.measureText(line);
      lineWidth = metrics.width;
    }

    // Fallback heuristic for environments (e.g. standard JSDOM) where measureText returns 0
    if (lineWidth === 0 && line.length > 0) {
      lineWidth = line.length * fontSize * 0.58;
    }

    if (lineWidth > maxLineWidth) {
      maxLineWidth = lineWidth;
    }
  }

  // Horizontal padding to comfortably frame caret and glyph borders
  const horizontalPadding = 4;
  const width = Math.max(maxLineWidth + horizontalPadding, 10);
  const height = Math.max(lines.length * (fontSize * lineHeight), fontSize * lineHeight);

  return {
    width: Math.ceil(width),
    height: Math.ceil(height),
    lines,
  };
}
