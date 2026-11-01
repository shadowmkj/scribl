import React from 'react';
import { Camera, CanvasElement } from '../../types/canvas';
import { worldToScreen } from '../../core/camera/cameraMath';
import { MarqueeBox } from '../../core/input/ToolFSM';

interface SelectionOverlayProps {
  elements: Record<string, CanvasElement>;
  selectedIds: string[];
  camera: Camera;
  width: number;
  height: number;
  marqueeBox: MarqueeBox | null;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  elements,
  selectedIds,
  camera,
  width,
  height,
  marqueeBox,
}) => {
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
        zIndex: 10,
      }}
    >
      {/* Selected elements bounding boxes */}
      {selectedIds.map((id) => {
        const el = elements[id];
        if (!el) return null;
        const topLeft = worldToScreen(el.x, el.y, camera, width, height);
        const w = el.width * camera.zoom;
        const h = el.height * camera.zoom;

        return (
          <g key={id}>
            <rect
              x={topLeft.x}
              y={topLeft.y}
              width={w}
              height={h}
              fill="none"
              stroke="#0284c7"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          </g>
        );
      })}

      {/* Marquee rubber-band box */}
      {marqueeBox && (() => {
        const minX = Math.min(marqueeBox.startX, marqueeBox.currentX);
        const minY = Math.min(marqueeBox.startY, marqueeBox.currentY);
        const maxX = Math.max(marqueeBox.startX, marqueeBox.currentX);
        const maxY = Math.max(marqueeBox.startY, marqueeBox.currentY);

        const screenTopLeft = worldToScreen(minX, minY, camera, width, height);
        const boxW = (maxX - minX) * camera.zoom;
        const boxH = (maxY - minY) * camera.zoom;

        return (
          <rect
            x={screenTopLeft.x}
            y={screenTopLeft.y}
            width={boxW}
            height={boxH}
            fill="rgba(2, 132, 199, 0.15)"
            stroke="#0284c7"
            strokeWidth={1}
          />
        );
      })()}
    </svg>
  );
};
