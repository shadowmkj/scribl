import React from 'react';
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
  const color = useToolStore((s) => s.color);
  const strokeSize = useToolStore((s) => s.strokeSize);
  const setColor = useToolStore((s) => s.setColor);
  const setStrokeSize = useToolStore((s) => s.setStrokeSize);

  if (currentTool !== 'pen') return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: 20,
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(71, 85, 105, 0.5)',
        borderRadius: 12,
        padding: '12px',
        zIndex: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
          Color
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 24px)', gap: 6 }}>
          {COLOR_SWATCHES.map((swatch) => (
            <button
              key={swatch.hex}
              title={swatch.name}
              onClick={() => setColor(swatch.hex)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: swatch.hex,
                border: color === swatch.hex ? '2px solid #38bdf8' : '1px solid #475569',
                cursor: 'pointer',
                outline: 'none',
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: '#334155' }} />

      <div>
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
          Thickness
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {STROKE_SIZES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStrokeSize(s.value)}
              style={{
                background: strokeSize === s.value ? '#0284c7' : '#0f172a',
                color: strokeSize === s.value ? '#fff' : '#94a3b8',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '4px 8px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
