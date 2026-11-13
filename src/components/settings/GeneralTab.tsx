import React from 'react';
import { useConfigStore } from '../../stores/useConfigStore';
import { useToolStore } from '../../stores/useToolStore';

const PEN_COLOR_SWATCHES = [
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Obsidian', hex: '#1e293b' },
  { name: 'Charcoal', hex: '#64748b' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Coral Red', hex: '#e11d48' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Amber', hex: '#d97706' },
  { name: 'Violet', hex: '#7c3aed' },
];

export const GeneralTab: React.FC = () => {
  const config = useConfigStore((s) => s.config);
  const saveConfigToDisk = useConfigStore((s) => s.saveConfigToDisk);
  const setZoomMode = useToolStore((s) => s.setZoomMode);

  const updateOption = <K extends keyof typeof config.options>(
    key: K,
    value: typeof config.options[K],
  ) => {
    const updated = {
      ...config,
      options: {
        ...config.options,
        [key]: value,
      },
    };
    saveConfigToDisk(updated);

    if (key === 'zoom_mode') {
      setZoomMode(value as 'scrubby' | 'selection');
    }
    if (key === 'default_pen_color') {
      useToolStore.getState().setColor(value as string);
    }
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
          General Preferences
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary, #94a3b8)' }}>
          Configure startup tools, canvas background grid, and navigation modes.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Dot Grid Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Dot Grid Background
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--color-text-secondary, #64748b)', marginTop: 2 }}
            >
              Display subtle alignment dot grid on canvas
            </div>
          </div>
          <button
            type='button'
            role='switch'
            aria-label='Toggle dot grid'
            aria-checked={config.options.dot_grid}
            onClick={() => updateOption('dot_grid', !config.options.dot_grid)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: config.options.dot_grid
                ? 'var(--color-accent, #0284c7)'
                : 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              padding: 2,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transform: config.options.dot_grid ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>

        {/* Default Tool Selection */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Default Startup Tool
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--color-text-secondary, #64748b)', marginTop: 2 }}
            >
              Active tool when opening or clearing a canvas
            </div>
          </div>
          <select
            value={config.options.default_tool}
            onChange={(e) => updateOption('default_tool', e.target.value)}
            style={{
              background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.8))',
              border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.15))',
              borderRadius: 8,
              padding: '5px 10px',
              color: 'var(--color-text-primary, #f8fafc)',
              fontSize: 12,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value='pen'>Pen Tool</option>
            <option value='select'>Select Tool</option>
            <option value='eraser'>Eraser Tool</option>
            <option value='zoom'>Zoom Tool</option>
          </select>
        </div>

        {/* Default Pen Color */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-text-primary, #e2e8f0)',
                }}
              >
                Default Pen Color
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary, #64748b)',
                  marginTop: 2,
                }}
              >
                Initial inking color on startup or when resetting pen
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Native color picker box */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: config.options.default_pen_color || '#0284c7',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <input
                  type='color'
                  aria-label='Default Pen Color Picker'
                  value={config.options.default_pen_color?.startsWith('#')
                      && config.options.default_pen_color.length === 7
                    ? config.options.default_pen_color
                    : '#0284c7'}
                  onChange={(e) => updateOption('default_pen_color', e.target.value)}
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                />
              </div>

              {/* Text hex input */}
              <input
                aria-label='Default Pen Color'
                type='text'
                value={config.options.default_pen_color || '#0284c7'}
                onChange={(e) => updateOption('default_pen_color', e.target.value)}
                style={{
                  width: 88,
                  background: 'rgba(125, 125, 125, 0.08)',
                  border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1))',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: 'var(--color-text-primary, #f8fafc)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          {/* Quick preset color swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary, #64748b)' }}>
              Presets:
            </span>
            {PEN_COLOR_SWATCHES.map((swatch) => {
              const isSelected = (config.options.default_pen_color || '#0284c7').toLowerCase()
                === swatch.hex.toLowerCase();
              return (
                <button
                  key={swatch.hex}
                  type='button'
                  title={swatch.name}
                  onClick={() => updateOption('default_pen_color', swatch.hex)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: swatch.hex,
                    border: isSelected
                      ? '2px solid var(--color-accent, #38bdf8)'
                      : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.2))',
                    boxShadow: isSelected ? '0 0 6px var(--color-accent, #0284c7)' : 'none',
                    cursor: 'pointer',
                    padding: 0,
                    outline: 'none',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Zoom Mode Radio */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Zoom Interaction Mode
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--color-text-secondary, #64748b)', marginTop: 2 }}
            >
              Choose how the Zoom tool behaves on click and drag
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: config.options.zoom_mode === 'scrubby'
                  ? 'rgba(2, 132, 199, 0.15)'
                  : 'rgba(0, 0, 0, 0.03)',
                border: config.options.zoom_mode === 'scrubby'
                  ? '1px solid var(--color-accent-light, rgba(56, 189, 248, 0.4))'
                  : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
                cursor: 'pointer',
              }}
            >
              <input
                type='radio'
                name='zoom_mode'
                value='scrubby'
                checked={config.options.zoom_mode === 'scrubby'}
                onChange={() => updateOption('zoom_mode', 'scrubby')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-primary, #f1f5f9)',
                  }}
                >
                  Scrubby Zoom
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary, #94a3b8)',
                    marginTop: 2,
                  }}
                >
                  Drag horizontally to zoom smoothly in and out
                </div>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 8,
                background: config.options.zoom_mode === 'selection'
                  ? 'rgba(2, 132, 199, 0.15)'
                  : 'rgba(0, 0, 0, 0.03)',
                border: config.options.zoom_mode === 'selection'
                  ? '1px solid var(--color-accent-light, rgba(56, 189, 248, 0.4))'
                  : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
                cursor: 'pointer',
              }}
            >
              <input
                type='radio'
                name='zoom_mode'
                value='selection'
                checked={config.options.zoom_mode === 'selection'}
                onChange={() => updateOption('zoom_mode', 'selection')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-primary, #f1f5f9)',
                  }}
                >
                  Selection Zoom
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary, #94a3b8)',
                    marginTop: 2,
                  }}
                >
                  Drag a marquee box to zoom into that region
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Auto Save Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Auto-Save Drawings
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--color-text-secondary, #64748b)', marginTop: 2 }}
            >
              Continuously save strokes to local storage in background
            </div>
          </div>
          <button
            type='button'
            role='switch'
            aria-label='Toggle auto save'
            aria-checked={config.options.auto_save}
            onClick={() => updateOption('auto_save', !config.options.auto_save)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              background: config.options.auto_save
                ? 'var(--color-accent, #0284c7)'
                : 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              padding: 2,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transform: config.options.auto_save ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>

        {/* Select After Create Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '12px 14px',
            background: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
          }}
        >
          <div>
            <div
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Auto-Select Created Elements
            </div>
            <div
              style={{ fontSize: 11, color: 'var(--color-text-secondary, #64748b)', marginTop: 2 }}
            >
              Automatically select shapes and text after creating
            </div>
          </div>
          <button
            type='button'
            role='switch'
            aria-label='Toggle select element after creation'
            aria-checked={config.options.select_after_create ?? true}
            onClick={() =>
              updateOption('select_after_create', !(config.options.select_after_create ?? true))}
            style={{
              flexShrink: 0,
              width: 44,
              height: 24,
              borderRadius: 12,
              background: (config.options.select_after_create ?? true)
                ? 'var(--color-accent, #0284c7)'
                : 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s ease',
              padding: 2,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transform: (config.options.select_after_create ?? true)
                  ? 'translateX(20px)'
                  : 'translateX(0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
