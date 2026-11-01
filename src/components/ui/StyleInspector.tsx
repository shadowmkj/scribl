import React from 'react';
import { calculateBoxFitCamera } from '../../core/camera/cameraMath';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';

const COLOR_SWATCHES = [
  { name: 'Obsidian', hex: '#1e293b' },
  { name: 'Charcoal', hex: '#64748b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Coral Red', hex: '#e11d48' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Violet', hex: '#7c3aed' },
];

const STROKE_SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Regular', value: 4 },
  { label: 'Medium', value: 8 },
  { label: 'Thick', value: 16 },
];

export const StyleInspector: React.FC = () => {
  const currentTool = useToolStore((s) => s.currentTool);
  const zoomMode = useToolStore((s) => s.zoomMode);
  const setZoomMode = useToolStore((s) => s.setZoomMode);
  const color = useToolStore((s) => s.color);
  const strokeSize = useToolStore((s) => s.strokeSize);
  const setColor = useToolStore((s) => s.setColor);
  const setStrokeSize = useToolStore((s) => s.setStrokeSize);

  const resetZoom = useCameraStore((s) => s.resetZoom);
  const viewportWidth = useCameraStore((s) => s.viewportWidth);
  const viewportHeight = useCameraStore((s) => s.viewportHeight);

  if (currentTool !== 'pen' && currentTool !== 'zoom') return null;

  if (currentTool === 'zoom') {
    const handleFitAll = () => {
      const doc = useDocumentStore.getState();
      const ids = doc.elementIds;
      if (ids.length === 0) {
        resetZoom();
        useCameraStore.getState().setPan(0, 0);
        return;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const id of ids) {
        const el = doc.elements[id];
        if (el) {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        }
      }

      if (minX !== Infinity) {
        const fit = calculateBoxFitCamera(
          { minX, minY, maxX, maxY },
          viewportWidth,
          viewportHeight,
          0.85,
        );
        useCameraStore.setState({ camera: fit });
      }
    };

    return (
      <aside
        style={{
          position: 'absolute',
          top: 70,
          left: 16,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          padding: '12px',
          zIndex: 25,
          boxShadow: '0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minWidth: 160,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Zoom Mode
          </div>
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: 3,
              borderRadius: 8,
              gap: 3,
            }}
          >
            <button
              onClick={() => setZoomMode('scrubby')}
              style={{
                flex: 1,
                background: zoomMode === 'scrubby'
                  ? 'rgba(56, 189, 248, 0.18)'
                  : 'transparent',
                color: zoomMode === 'scrubby' ? '#38bdf8' : '#94a3b8',
                border: zoomMode === 'scrubby'
                  ? '1px solid rgba(56, 189, 248, 0.35)'
                  : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: zoomMode === 'scrubby' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='m7 16-4-4 4-4' />
                <path d='m17 8 4 4-4 4' />
                <path d='M3 12h18' />
              </svg>
              Scrubby
            </button>
            <button
              onClick={() => setZoomMode('selection')}
              style={{
                flex: 1,
                background: zoomMode === 'selection'
                  ? 'rgba(56, 189, 248, 0.18)'
                  : 'transparent',
                color: zoomMode === 'selection' ? '#38bdf8' : '#94a3b8',
                border: zoomMode === 'selection'
                  ? '1px solid rgba(56, 189, 248, 0.35)'
                  : '1px solid transparent',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: zoomMode === 'selection' ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <svg
                width='12'
                height='12'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <rect x='3' y='3' width='18' height='18' rx='2' strokeDasharray='4 3' />
              </svg>
              Selection
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

        <div>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: '#64748b',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Quick View
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={resetZoom}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              100%
            </button>
            <button
              onClick={handleFitAll}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#f1f5f9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              Fit Drawing
            </button>
          </div>
        </div>

        <div
          style={{
            fontSize: 10,
            color: '#64748b',
            lineHeight: 1.4,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: 8,
          }}
        >
          {zoomMode === 'scrubby'
            ? 'Drag left/right to scrub. Click to zoom in, Alt+Click to zoom out.'
            : 'Drag a box around an area to zoom into it. Click to zoom in.'}
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 70,
        left: 16,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '12px',
        zIndex: 25,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            color: '#64748b',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          Color
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 26px)', gap: 6 }}>
          {COLOR_SWATCHES.map((swatch) => {
            const isSelected = color === swatch.hex;
            return (
              <button
                key={swatch.hex}
                title={swatch.name}
                onClick={() => setColor(swatch.hex)}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: swatch.hex,
                  border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: isSelected ? '0 0 8px rgba(56, 189, 248, 0.5)' : 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

      <div>
        <div
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            color: '#64748b',
            fontWeight: 700,
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          Thickness
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {STROKE_SIZES.map((s) => {
            const isSelected = strokeSize === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setStrokeSize(s.value)}
                style={{
                  background: isSelected ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  border: isSelected
                    ? '1px solid rgba(56, 189, 248, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 6,
                  padding: '4px 7px',
                  fontSize: 11,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#f1f5f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
