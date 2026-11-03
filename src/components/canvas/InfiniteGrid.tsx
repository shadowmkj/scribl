import React from 'react';
import { Camera } from '../../types/canvas';

interface InfiniteGridProps {
  camera: Camera;
  width: number;
  height: number;
}

export const InfiniteGrid: React.FC<InfiniteGridProps> = ({ camera, width, height }) => {
  const baseGridSize = 20;
  const scaledGridSize = baseGridSize * camera.zoom;
  const offsetX = (width / 2 - camera.x * camera.zoom) % scaledGridSize;
  const offsetY = (height / 2 - camera.y * camera.zoom) % scaledGridSize;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `radial-gradient(var(--color-grid-dot, #334155) 1.5px, transparent 1.5px)`,
        backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        opacity: Math.min(1, Math.max(0.2, camera.zoom * 0.6)),
      }}
    />
  );
};
