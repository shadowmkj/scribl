import React, { useEffect } from 'react';
import { SettingsTab, useConfigStore } from '../../stores/useConfigStore';
import { GeneralTab } from './GeneralTab';
import { InkingTab } from './InkingTab';
import { KeybindingsTab } from './KeybindingsTab';
import { LuaTab } from './LuaTab';
import { ThemeTab } from './ThemeTab';
import { ToolbarTab } from './ToolbarTab';

interface NavItem {
  id: SettingsTab;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'inking', label: 'Inking', icon: '✏️' },
  { id: 'theme', label: 'Theme', icon: '🎨' },
  { id: 'keybindings', label: 'Keybindings', icon: '⌨️' },
  { id: 'toolbar', label: 'Toolbar', icon: '🎛️' },
  { id: 'lua', label: 'Lua Config', icon: '📜' },
];

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useConfigStore((s) => s.isSettingsOpen);
  const activeSettingsTab = useConfigStore((s) => s.activeSettingsTab);
  const openSettings = useConfigStore((s) => s.openSettings);
  const closeSettings = useConfigStore((s) => s.closeSettings);

  const isMac = typeof navigator !== 'undefined'
    && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  // Escape to close
  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <div
      onClick={closeSettings}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 700,
          maxWidth: '92vw',
          height: 520,
          maxHeight: '88vh',
          background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.94))',
          backdropFilter: 'blur(30px) saturate(190%)',
          WebkitBackdropFilter: 'blur(30px) saturate(190%)',
          border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1))',
          borderRadius: 16,
          boxShadow:
            'var(--color-panel-shadow, 0 25px 60px -15px rgba(0, 0, 0, 0.7)), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--color-text-primary, #f8fafc)',
          fontFamily: isMac
            ? '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
            : '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            borderBottom: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
            background: 'rgba(125, 125, 125, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'var(--color-text-primary, #f8fafc)',
              }}
            >
              Preferences
            </span>
            <span
              style={{
                fontSize: 10,
                color: 'var(--color-text-secondary, #64748b)',
                background: 'var(--color-panel-border, rgba(255, 255, 255, 0.06))',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600,
              }}
            >
              {isMac ? '⌘,' : 'Ctrl+,'}
            </span>
          </div>

          <button
            type='button'
            onClick={closeSettings}
            title='Close (Esc)'
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary, #94a3b8)',
              cursor: 'pointer',
              fontSize: 14,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
              e.currentTarget.style.color = 'var(--color-text-primary, #f8fafc)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Body (Sidebar + Content Panel) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div
            style={{
              width: 175,
              borderRight: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
              background: 'rgba(0, 0, 0, 0.06)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const active = activeSettingsTab === item.id;
              return (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => openSettings(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                    background: active
                      ? 'var(--color-accent, rgba(2, 132, 199, 0.85))'
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(125, 125, 125, 0.1)';
                      e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
                    }
                  }}
                >
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content Pane */}
          <div
            style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              minHeight: 0,
            }}
          >
            {activeSettingsTab === 'general' && <GeneralTab />}
            {activeSettingsTab === 'inking' && <InkingTab />}
            {activeSettingsTab === 'theme' && <ThemeTab />}
            {activeSettingsTab === 'keybindings' && <KeybindingsTab />}
            {activeSettingsTab === 'toolbar' && <ToolbarTab />}
            {activeSettingsTab === 'lua' && <LuaTab />}
          </div>
        </div>
      </div>
    </div>
  );
};
