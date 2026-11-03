import React from 'react';
import { resolveTheme, THEME_PRESETS, ThemeColors } from '../../core/theme/themeManager';
import { useConfigStore } from '../../stores/useConfigStore';

interface PresetItem {
  id: string;
  name: string;
  desc: string;
  colors: ThemeColors;
}

const PRESETS: PresetItem[] = [
  {
    id: 'default-dark',
    name: 'Default Dark',
    desc: 'Deep navy backdrop with crisp sky blue accents',
    colors: THEME_PRESETS['default-dark'],
  },
  {
    id: 'light',
    name: 'Light',
    desc: 'Clean paper aesthetic with slate contrasts',
    colors: THEME_PRESETS['light'],
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    desc: 'Modern midnight violet with neon highlights',
    colors: THEME_PRESETS['tokyo-night'],
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    desc: 'Soothing warm mocha with soft lavender accents',
    colors: THEME_PRESETS['catppuccin'],
  },
];

interface TokenField {
  key: keyof ThemeColors;
  label: string;
  desc: string;
}

const TOKEN_GROUPS: { title: string; tokens: TokenField[]; }[] = [
  {
    title: 'Canvas & Grid',
    tokens: [
      { key: 'canvas_bg', label: 'Canvas Background', desc: 'Main drawing surface' },
      { key: 'grid_dot', label: 'Grid Dot Color', desc: 'Dot-grid pattern contrast' },
    ],
  },
  {
    title: 'Panels & Chrome',
    tokens: [
      { key: 'panel_bg', label: 'Panel Background', desc: 'Toolbars, HUDs, and dialogs' },
      { key: 'panel_border', label: 'Panel Border', desc: 'Panel outline edges' },
    ],
  },
  {
    title: 'Typography',
    tokens: [
      { key: 'text_primary', label: 'Primary Text', desc: 'Headings and high-contrast labels' },
      {
        key: 'text_secondary',
        label: 'Secondary Text',
        desc: 'Subtitles, hotkey hints, and icons',
      },
    ],
  },
  {
    title: 'Accents & Selection',
    tokens: [
      { key: 'accent', label: 'Accent Color', desc: 'Active tool buttons and brand color' },
      { key: 'accent_light', label: 'Accent Highlight', desc: 'Focus rings and active indicators' },
      {
        key: 'selection_stroke',
        label: 'Selection Stroke',
        desc: 'Bounding box and marquee outlines',
      },
      { key: 'danger', label: 'Danger Color', desc: 'Clear canvas and delete warnings' },
    ],
  },
];

export const ThemeTab: React.FC = () => {
  const config = useConfigStore((s) => s.config);
  const saveConfigToDisk = useConfigStore((s) => s.saveConfigToDisk);

  const themeConfig = config.theme || {
    name: 'default-dark',
    overrides: {},
    active: THEME_PRESETS['default-dark'],
  };

  const activePreset = themeConfig.name || 'default-dark';
  const overrides = themeConfig.overrides || {};
  const resolved = resolveTheme(themeConfig);

  const handleSelectPreset = (presetId: string) => {
    const updatedTheme = {
      ...themeConfig,
      name: presetId,
      active: resolveTheme({ ...themeConfig, name: presetId }),
    };
    saveConfigToDisk({
      ...config,
      theme: updatedTheme,
    });
  };

  const handleUpdateOverride = (token: string, value: string) => {
    const updatedOverrides = {
      ...overrides,
      [token]: value,
    };
    const updatedTheme = {
      ...themeConfig,
      overrides: updatedOverrides,
      active: resolveTheme({ ...themeConfig, overrides: updatedOverrides }),
    };
    saveConfigToDisk({
      ...config,
      theme: updatedTheme,
    });
  };

  const handleResetOverrides = () => {
    const updatedTheme = {
      name: activePreset,
      overrides: {},
      active: resolveTheme({ name: activePreset, overrides: {} }),
    };
    saveConfigToDisk({
      ...config,
      theme: updatedTheme,
    });
  };

  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Presets Grid */}
      <div>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary, #f8fafc)',
            marginBottom: 4,
          }}
        >
          Theme Presets
        </h3>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-secondary, #94a3b8)',
            marginBottom: 14,
          }}
        >
          Select an aesthetic preset for the canvas and application UI.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          {PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                style={{
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(125, 125, 125, 0.04)',
                  border: isSelected
                    ? '2px solid var(--color-accent-light, #38bdf8)'
                    : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                  borderRadius: 10,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isSelected
                        ? 'var(--color-accent-light, #38bdf8)'
                        : 'var(--color-text-primary, #f8fafc)',
                    }}
                  >
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: 'var(--color-accent, #0284c7)',
                        color: '#ffffff',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      Active
                    </span>
                  )}
                </div>

                {/* Palette Color Swatches */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    borderRadius: 8,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: 8,
                  }}
                >
                  {[
                    { name: 'Canvas', color: preset.colors.canvas_bg },
                    { name: 'Panel', color: preset.colors.panel_bg },
                    { name: 'Accent', color: preset.colors.accent },
                    { name: 'Highlight', color: preset.colors.accent_light },
                    { name: 'Text', color: preset.colors.text_primary },
                  ].map((swatch) => (
                    <div
                      key={swatch.name}
                      title={`${swatch.name}: ${swatch.color}`}
                      style={{
                        flex: 1,
                        height: 20,
                        borderRadius: 4,
                        background: swatch.color,
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                      }}
                    />
                  ))}
                </div>

                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-secondary, #94a3b8)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {preset.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Token Overrides Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-primary, #f8fafc)',
                margin: 0,
              }}
            >
              Custom Color Overrides
            </h3>
            <p
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary, #94a3b8)',
                margin: '2px 0 0 0',
              }}
            >
              Fine-tune individual colors. Overrides take precedence over the active preset.
            </p>
          </div>

          {hasOverrides && (
            <button
              onClick={handleResetOverrides}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Reset Overrides
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TOKEN_GROUPS.map((group) => (
            <div
              key={group.title}
              style={{
                background: 'rgba(0, 0, 0, 0.03)',
                border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.06))',
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-secondary, #94a3b8)',
                  marginBottom: 10,
                }}
              >
                {group.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.tokens.map((token) => {
                  const currentValue = overrides[token.key] || resolved[token.key] || '#000000';
                  const isOverridden = token.key in overrides;

                  return (
                    <div
                      key={token.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <label
                          htmlFor={`theme-token-${token.key}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--color-text-primary, #f8fafc)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {token.label}
                          {isOverridden && (
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: 'var(--color-accent-light, #38bdf8)',
                                background: 'rgba(56, 189, 248, 0.15)',
                                padding: '1px 4px',
                                borderRadius: 3,
                              }}
                            >
                              Custom
                            </span>
                          )}
                        </label>
                        <div
                          style={{ fontSize: 10, color: 'var(--color-text-secondary, #64748b)' }}
                        >
                          {token.desc}
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
                            background: currentValue,
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
                            value={currentValue.startsWith('#') && currentValue.length === 7
                              ? currentValue
                              : '#0284c7'}
                            onChange={(e) => handleUpdateOverride(token.key, e.target.value)}
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

                        {/* Text hex/color input */}
                        <input
                          id={`theme-token-${token.key}`}
                          aria-label={token.label}
                          type='text'
                          value={currentValue}
                          onChange={(e) => handleUpdateOverride(token.key, e.target.value)}
                          style={{
                            width: 140,
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
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
