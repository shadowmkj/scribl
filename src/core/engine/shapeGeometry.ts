import { ShapeElement } from '../../types/canvas';

export function generateShapePath(shape: ShapeElement): Path2D {
  const path = new Path2D();
  const { shapeType, x, y, width, height, startPoint, endPoint, borderRadius = 0 } = shape;

  switch (shapeType) {
    case 'rectangle': {
      if (borderRadius > 0 && typeof path.roundRect === 'function') {
        path.roundRect(x, y, width, height, borderRadius);
      } else {
        path.rect(x, y, width, height);
      }
      break;
    }
    case 'circle': {
      const rx = Math.max(0.1, width / 2);
      const ry = Math.max(0.1, height / 2);
      const cx = x + rx;
      const cy = y + ry;
      path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      break;
    }
    case 'diamond': {
      const midX = x + width / 2;
      const midY = y + height / 2;
      path.moveTo(midX, y);
      path.lineTo(x + width, midY);
      path.lineTo(midX, y + height);
      path.lineTo(x, midY);
      path.closePath();
      break;
    }
    case 'line': {
      const p1 = startPoint || { x, y };
      const p2 = endPoint || { x: x + width, y: y + height };
      path.moveTo(p1.x, p1.y);
      path.lineTo(p2.x, p2.y);
      break;
    }
    case 'arrow': {
      const p1 = startPoint || { x, y };
      const p2 = endPoint || { x: x + width, y: y + height };
      path.moveTo(p1.x, p1.y);
      path.lineTo(p2.x, p2.y);

      // Arrowhead geometry
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const arrowLength = Math.max(10, Math.min(24, shape.strokeWidth * 4));
      const arrowAngle = Math.PI / 6; // 30 degrees

      const a1X = p2.x - arrowLength * Math.cos(angle - arrowAngle);
      const a1Y = p2.y - arrowLength * Math.sin(angle - arrowAngle);
      const a2X = p2.x - arrowLength * Math.cos(angle + arrowAngle);
      const a2Y = p2.y - arrowLength * Math.sin(angle + arrowAngle);

      path.moveTo(p2.x, p2.y);
      path.lineTo(a1X, a1Y);
      path.moveTo(p2.x, p2.y);
      path.lineTo(a2X, a2Y);
      break;
    }
  }

  return path;
}
