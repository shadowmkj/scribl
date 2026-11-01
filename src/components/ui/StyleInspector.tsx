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
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>
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
                  border: isSelected
                    ? '2px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.12)',
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
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 8 }}>
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
                  background: isSelected
                    ? 'rgba(2, 132, 199, 0.25)'
                    : 'rgba(255, 255, 255, 0.04)',
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
