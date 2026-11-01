import React from 'react';
import { useToolStore } from '../../stores/useToolStore';
import { ToolType } from '../../types/canvas';

export const FloatingDock: React.FC = () => {
  const currentTool = useToolStore((s) => s.currentTool);
  const setTool = useToolStore((s) => s.setTool);

  const tools: { id: ToolType; label: string; icon: string; shortcut: string }[] = [
    { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
    { id: 'pen', label: 'Pen', icon: '✏', shortcut: 'P' },
    { id: 'eraser', label: 'Eraser', icon: '⌫', shortcut: 'E' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(71, 85, 105, 0.5)',
        borderRadius: 14,
        padding: '6px 10px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        zIndex: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {tools.map((t) => {
        const isActive = currentTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            style={{
              background: isActive ? '#0284c7' : 'transparent',
              color: isActive ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 2 }}>{t.shortcut}</span>
          </button>
        );
      })}
    </div>
  );
};
