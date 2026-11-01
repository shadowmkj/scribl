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
        right: 20,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: '3px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        zIndex: 25,
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 600,
        boxShadow: '0 8px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <button
        onClick={() => zoomAt(width / 2, height / 2, camera.zoom * 0.85)}
        title='Zoom Out (-)'
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px 7px',
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        -
      </button>

      <span
        onClick={resetZoom}
        style={{
          cursor: 'pointer',
          padding: '4px 6px',
          borderRadius: 6,
          fontSize: 12,
          color: '#cbd5e1',
          transition: 'all 0.15s ease',
        }}
        title='Click to reset zoom (100% / Shift+0)'
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#38bdf8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#cbd5e1';
        }}
      >
        {zoomPercent}%
      </span>

      <button
        onClick={() => zoomAt(width / 2, height / 2, camera.zoom * 1.15)}
        title='Zoom In (+)'
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px 7px',
          borderRadius: 6,
          fontSize: 14,
          lineHeight: 1,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#f1f5f9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = '#94a3b8';
        }}
      >
        +
      </button>
    </div>
  );
};
