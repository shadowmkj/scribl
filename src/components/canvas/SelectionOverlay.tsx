import React from 'react';
import { worldToScreen } from '../../core/camera/cameraMath';
import { MarqueeBox } from '../../core/input/ToolFSM';
import { Camera, CanvasElement } from '../../types/canvas';

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
              fill='none'
              stroke='#0284c7'
              strokeWidth={1.5}
              strokeDasharray='4 4'
            />
          </g>
        );
      })}

      {/* Marquee rubber-band box */}
      {marqueeBox
        && (() => {
          const minX = Math.min(marqueeBox.startX, marqueeBox.currentX);
          const minY = Math.min(marqueeBox.startY, marqueeBox.currentY);
          const maxX = Math.max(marqueeBox.startX, marqueeBox.currentX);
          const maxY = Math.max(marqueeBox.startY, marqueeBox.currentY);

          const screenTopLeft = worldToScreen(minX, minY, camera, width, height);
          const boxW = (maxX - minX) * camera.zoom;
          const boxH = (maxY - minY) * camera.zoom;
          const isZoom = marqueeBox.type === 'zoom';

          return (
            <g>
              <rect
                x={screenTopLeft.x}
                y={screenTopLeft.y}
                width={boxW}
                height={boxH}
                fill={isZoom ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.15)'}
                stroke={isZoom ? '#38bdf8' : '#0284c7'}
                strokeWidth={isZoom ? 1.5 : 1}
                strokeDasharray={isZoom ? '5 3' : undefined}
              />
              {isZoom && boxW > 30 && boxH > 30 && (
                <g transform={`translate(${screenTopLeft.x + 6}, ${screenTopLeft.y + 6})`}>
                  <circle cx='6' cy='6' r='4.5' fill='none' stroke='#38bdf8' strokeWidth='1.3' />
                  <line
                    x1='9.5'
                    y1='9.5'
                    x2='13'
                    y2='13'
                    stroke='#38bdf8'
                    strokeWidth='1.3'
                    strokeLinecap='round'
                  />
                </g>
              )}
            </g>
          );
        })()}
    </svg>
  );
};
