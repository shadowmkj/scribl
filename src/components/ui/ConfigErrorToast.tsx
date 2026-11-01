import React from 'react';
import { useConfigStore } from '../../stores/useConfigStore';

export const ConfigErrorToast: React.FC = () => {
  const configError = useConfigStore((s) => s.configError);
  const setError = useConfigStore((s) => s.setError);

  if (!configError) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 70,
        right: 16,
        maxWidth: 420,
        background: 'rgba(23, 15, 15, 0.88)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 12,
        padding: '12px 14px',
        zIndex: 50,
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(244, 63, 94, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg
            width='15'
            height='15'
            viewBox='0 0 24 24'
            fill='none'
            stroke='#fb7185'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fb7185' }}>
            Lua Configuration Error
          </span>
        </div>
        <button
          onClick={() => setError(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: 14,
            lineHeight: 1,
            borderRadius: 4,
          }}
          title='Dismiss'
        >
          ✕
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: '6px 8px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 6,
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#fda4af',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight: 120,
          overflowY: 'auto',
        }}
      >
        {configError}
      </pre>

      <div style={{ fontSize: 10, color: '#94a3b8' }}>
        Fix syntax in <code style={{ color: '#cbd5e1' }}>~/.config/scribl/init.lua</code>{' '}
        and save to hot-reload.
      </div>
    </div>
  );
};
