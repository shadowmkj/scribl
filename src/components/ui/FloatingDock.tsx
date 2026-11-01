import React from 'react';
import { useToolStore } from '../../stores/useToolStore';
import { ToolType } from '../../types/canvas';

export const FloatingDock: React.FC = () => {
  const currentTool = useToolStore((s) => s.currentTool);
  const setTool = useToolStore((s) => s.setTool);

  const tools: {
    id: ToolType;
    label: string;
    shortcut: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'select',
      label: 'Select',
      shortcut: 'V',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          <path d="m13 13 6 6" />
        </svg>
      ),
    },
    {
      id: 'pen',
      label: 'Pen',
      shortcut: 'P',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      ),
    },
    {
      id: 'eraser',
      label: 'Eraser',
      shortcut: 'E',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
          <path d="M22 21H7" />
          <path d="m5 11 9 9" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 14,
        padding: '5px',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        zIndex: 25,
        boxShadow: '0 12px 36px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      {tools.map((t) => {
        const isActive = currentTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={`${t.label} Tool (${t.shortcut})`}
            style={{
              background: isActive
                ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)'
                : 'transparent',
              color: isActive ? '#ffffff' : '#94a3b8',
              border: isActive
                ? '1px solid rgba(56, 189, 248, 0.4)'
                : '1px solid transparent',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#f1f5f9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span
              style={{
                fontSize: 10,
                opacity: isActive ? 0.8 : 0.4,
                background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {t.shortcut}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
