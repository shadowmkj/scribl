import React from 'react';
import { worldToScreen } from '../../core/camera/cameraMath';
import { computeSelectionBounds } from '../../core/geometry/transformMath';
import { MarqueeBox } from '../../core/input/ToolFSM';
import { Camera, CanvasElement } from '../../types/canvas';

interface SelectionOverlayProps {
  elements: Record<string, CanvasElement>;
  selectedIds: string[];
  camera: Camera;
  width: number;
  height: number;
  marqueeBox: MarqueeBox | null;
  rotationAngle?: number | null;
  editingTextElementId?: string | null;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  elements,
  selectedIds,
  camera,
  width,
  height,
  marqueeBox,
  rotationAngle,
  editingTextElementId,
}) => {
  const activeSelectedIds = editingTextElementId
    ? selectedIds.filter((id) => id !== editingTextElementId)
    : selectedIds;
  const bounds = computeSelectionBounds(elements, activeSelectedIds);

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
      {/* Unified selected elements bounding box and handles */}
      {bounds && (() => {
        const screenTL = worldToScreen(bounds.minX, bounds.minY, camera, width, height);
        const screenBR = worldToScreen(bounds.maxX, bounds.maxY, camera, width, height);
        const boxW = Math.max(1, screenBR.x - screenTL.x);
        const boxH = Math.max(1, screenBR.y - screenTL.y);
        const screenCenter = worldToScreen(bounds.centerX, bounds.centerY, camera, width, height);

        return (
          <g key='unified-selection'>
            {/* Unified bounding box rectangle */}
            <rect
              data-testid='unified-selection-box'
              x={screenTL.x}
              y={screenTL.y}
              width={boxW}
              height={boxH}
              fill='var(--color-selection-fill, rgba(2, 132, 199, 0.04))'
              stroke='var(--color-selection-stroke, #0284c7)'
              strokeWidth={1.5}
            />

            {/* 4 Corner Resize Handles */}
            <rect
              data-testid='handle-nw'
              x={screenTL.x - 4.5}
              y={screenTL.y - 4.5}
              width={9}
              height={9}
              fill='#ffffff'
              stroke='var(--color-selection-stroke, #0284c7)'
              strokeWidth={1.5}
              rx={1.5}
            />
            <rect
              data-testid='handle-ne'
              x={screenBR.x - 4.5}
              y={screenTL.y - 4.5}
              width={9}
              height={9}
              fill='#ffffff'
              stroke='var(--color-selection-stroke, #0284c7)'
              strokeWidth={1.5}
              rx={1.5}
            />
            <rect
              data-testid='handle-se'
              x={screenBR.x - 4.5}
              y={screenBR.y - 4.5}
              width={9}
              height={9}
              fill='#ffffff'
              stroke='var(--color-selection-stroke, #0284c7)'
              strokeWidth={1.5}
              rx={1.5}
            />
            <rect
              data-testid='handle-sw'
              x={screenTL.x - 4.5}
              y={screenBR.y - 4.5}
              width={9}
              height={9}
              fill='#ffffff'
              stroke='var(--color-selection-stroke, #0284c7)'
              strokeWidth={1.5}
              rx={1.5}
            />

            {/* Rotation Center Pivot and HUD Badge */}
            {rotationAngle !== undefined && rotationAngle !== null && (
              <g>
                <circle
                  cx={screenCenter.x}
                  cy={screenCenter.y}
                  r={4}
                  fill='#38bdf8'
                  stroke='#ffffff'
                  strokeWidth={1.5}
                />
                <g transform={`translate(${screenCenter.x + 12}, ${screenCenter.y - 12})`}>
                  <rect
                    x={-4}
                    y={-14}
                    width={56}
                    height={20}
                    rx={10}
                    fill='#0f172a'
                    stroke='#38bdf8'
                    strokeWidth={1}
                  />
                  <text
                    x={24}
                    y={0}
                    textAnchor='middle'
                    fill='#f8fafc'
                    fontSize={11}
                    fontWeight={600}
                    fontFamily='monospace'
                  >
                    {`${((rotationAngle * 180) / Math.PI).toFixed(1)}°`}
                  </text>
                </g>
              </g>
            )}
          </g>
        );
      })()}

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
                fill={isZoom
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'var(--color-selection-fill, rgba(2, 132, 199, 0.15))'}
                stroke={isZoom ? '#38bdf8' : 'var(--color-selection-stroke, #0284c7)'}
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
