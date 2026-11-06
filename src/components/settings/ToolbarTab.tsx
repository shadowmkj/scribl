import React from 'react';
import { useConfigStore } from '../../stores/useConfigStore';

const ALL_TOOLBAR_ITEMS = [
  { id: 'select', label: 'Select Tool' },
  { id: 'pen', label: 'Pen Tool' },
  { id: 'eraser', label: 'Eraser Tool' },
  { id: 'rectangle', label: 'Rectangle Shape' },
  { id: 'circle', label: 'Circle Shape' },
  { id: 'diamond', label: 'Diamond Shape' },
  { id: 'line', label: 'Line Shape' },
  { id: 'arrow', label: 'Arrow Shape' },
  { id: 'zoom', label: 'Zoom Tool' },
  { id: '|', label: 'Divider' },
  { id: 'undo', label: 'Undo Action' },
  { id: 'redo', label: 'Redo Action' },
  { id: 'clear', label: 'Clear Action' },
];

export const ToolbarTab: React.FC = () => {
  const config = useConfigStore((s) => s.config);
  const saveConfigToDisk = useConfigStore((s) => s.saveConfigToDisk);

  const setPosition = (pos: 'bottom' | 'top' | 'left' | 'right') => {
    saveConfigToDisk({
      ...config,
      toolbar: {
        ...config.toolbar,
        position: pos,
      },
    });
  };

  const toggleItem = (itemId: string) => {
    let items = [...config.toolbar.items];
    if (items.includes(itemId)) {
      if (items.filter((i) => i !== '|').length <= 2) {
        return; // Keep at least 2 tools
      }
      items = items.filter((i) => i !== itemId);
    } else {
      items.push(itemId);
    }

    saveConfigToDisk({
      ...config,
      toolbar: {
        ...config.toolbar,
        items,
      },
    });
  };

  const positions: Array<{ id: 'bottom' | 'top' | 'left' | 'right'; label: string; }> = [
    { id: 'bottom', label: 'Bottom (Default)' },
    { id: 'top', label: 'Top' },
    { id: 'left', label: 'Left Side' },
    { id: 'right', label: 'Right Side' },
  ];

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
          Floating Dock & Toolbar
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary, #94a3b8)' }}>
          Adjust dock positioning on screen and choose which tools appear.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Dock Position Picker */}
        <div
          style={{
            padding: '14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
          >
            Dock Position
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {positions.map((p) => {
              const active = config.toolbar.position === p.id;
              return (
                <button
                  key={p.id}
                  type='button'
                  onClick={() => setPosition(p.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                    background: active
                      ? 'var(--color-accent, #0284c7)'
                      : 'rgba(125, 125, 125, 0.08)',
                    border: active
                      ? '1px solid var(--color-accent-light, #38bdf8)'
                      : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dock Items Customization */}
        <div
          style={{
            padding: '14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <span
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
          >
            Active Tools
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ALL_TOOLBAR_ITEMS.filter((i) => i.id !== '|').map((item) => {
              const enabled = config.toolbar.items.includes(item.id);
              return (
                <label
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: enabled ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                    border: enabled
                      ? '1px solid var(--color-accent-light, rgba(56, 189, 248, 0.3))'
                      : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.04))',
                    cursor: 'pointer',
                    fontSize: 12,
                    color: enabled
                      ? 'var(--color-text-primary, #f8fafc)'
                      : 'var(--color-text-disabled, #64748b)',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={enabled}
                    onChange={() => toggleItem(item.id)}
                    style={{ accentColor: 'var(--color-accent, #0284c7)' }}
                  />
                  {item.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
