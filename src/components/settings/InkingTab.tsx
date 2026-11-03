import React from 'react';
import { useConfigStore } from '../../stores/useConfigStore';

export const InkingTab: React.FC = () => {
  const config = useConfigStore((s) => s.config);
  const saveConfigToDisk = useConfigStore((s) => s.saveConfigToDisk);

  const updateSmoothing = (val: number) => {
    saveConfigToDisk({
      ...config,
      options: {
        ...config.options,
        stroke_smoothing: val,
      },
    });
  };

  const updateThinning = (val: number) => {
    saveConfigToDisk({
      ...config,
      options: {
        ...config.options,
        stroke_thinning: val,
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h3
          style={{
            margin: '0 0 4px',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--color-text-primary, #f8fafc)',
          }}
        >
          Inking & Stroke Dynamics
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary, #94a3b8)' }}>
          Fine-tune the perfect-freehand brush physics and pressure response.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Stroke Smoothing */}
        <div
          style={{
            padding: '14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Stroke Smoothing
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-accent-light, #38bdf8)',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {config.options.stroke_smoothing.toFixed(2)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary, #64748b)' }}>
            Controls outline curvature smoothing. Higher values produce smoother, rounder curves.
          </p>
          <input
            type='range'
            min='0.0'
            max='1.0'
            step='0.05'
            value={config.options.stroke_smoothing}
            onChange={(e) => updateSmoothing(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--color-accent, #0284c7)',
              cursor: 'pointer',
              marginTop: 4,
            }}
          />
        </div>

        {/* Stroke Thinning */}
        <div
          style={{
            padding: '14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Pressure Thinning
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-accent-light, #38bdf8)',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              {config.options.stroke_thinning.toFixed(2)}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary, #64748b)' }}>
            How much pressure and velocity thin out strokes. Higher values create sharp calligraphy
            tapers.
          </p>
          <input
            type='range'
            min='0.0'
            max='1.0'
            step='0.05'
            value={config.options.stroke_thinning}
            onChange={(e) => updateThinning(parseFloat(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--color-accent, #0284c7)',
              cursor: 'pointer',
              marginTop: 4,
            }}
          />
        </div>

        {/* Visual Preview */}
        <div
          style={{
            padding: '14px',
            background: 'var(--color-canvas-bg, rgba(2, 6, 23, 0.6))',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
          }}
        >
          <svg width='300' height='60' viewBox='0 0 300 60' fill='none'>
            <path
              d='M 20 30 C 60 10, 100 50, 150 30 C 200 10, 240 50, 280 30'
              stroke='var(--color-accent, #0284c7)'
              strokeWidth={Math.max(2, 8 * (1 - config.options.stroke_thinning * 0.5))}
              strokeLinecap='round'
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
