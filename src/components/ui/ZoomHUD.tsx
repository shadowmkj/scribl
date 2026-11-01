import React from 'react';
import { useCameraStore } from '../../stores/useCameraStore';

export const ZoomHUD: React.FC = () => {
  const camera = useCameraStore((s) => s.camera);
  const zoomAt = useCameraStore((s) => s.zoomAt);
  const resetZoom = useCameraStore((s) => s.resetZoom);
  const width = useCameraStore((s) => s.viewportWidth);
  const height = useCameraStore((s) => s.viewportHeight);

  const zoomPercent = Math.round(camera.zoom * 100);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(71, 85, 105, 0.5)',
        borderRadius: 10,
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 20,
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <button
        onClick={() => zoomAt(width / 2, height / 2, camera.zoom * 0.85)}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 6px' }}
      >
        -
      </button>
      <span
        onClick={resetZoom}
        style={{ cursor: 'pointer', padding: '2px 4px' }}
        title="Click to reset zoom (100%)"
      >
        {zoomPercent}%
      </span>
      <button
        onClick={() => zoomAt(width / 2, height / 2, camera.zoom * 1.15)}
        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 6px' }}
      >
        +
      </button>
    </div>
  );
};
