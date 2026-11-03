import React, { useState } from 'react';
import { useConfigStore } from '../../stores/useConfigStore';

export const LuaTab: React.FC = () => {
  const configPath = useConfigStore((s) => s.configPath);
  const configError = useConfigStore((s) => s.configError);
  const loadConfig = useConfigStore((s) => s.loadConfig);

  const [feedback, setFeedback] = useState<string | null>(null);

  const isMac = typeof navigator !== 'undefined'
    && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  const handleOpenEditor = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_config_file');
      setFeedback('Opened in default editor');
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback('Failed to open file: ' + String(e));
    }
  };

  const handleReveal = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('reveal_config_file');
      setFeedback(isMac ? 'Revealed in Finder' : 'Opened File Explorer');
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback('Failed to reveal folder: ' + String(e));
    }
  };

  const handleReload = async () => {
    try {
      await loadConfig();
      setFeedback('Configuration reloaded from disk');
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback('Failed to reload: ' + String(e));
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
          Lua Configuration Script
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary, #94a3b8)' }}>
          Scribl is configured through an open Neovim-style Lua script on your system.
        </p>
      </div>

      {configError && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 8,
            color: 'var(--color-danger, #ef4444)',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          {configError}
        </div>
      )}

      {feedback && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 8,
            color: 'var(--color-accent-light, #0284c7)',
            fontSize: 12,
          }}
        >
          {feedback}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <span
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary, #e2e8f0)' }}
          >
            Configuration File
          </span>
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(0, 0, 0, 0.06)',
              borderRadius: 6,
              border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
              fontFamily: 'monospace',
              fontSize: 12,
              color: 'var(--color-accent-light, #0284c7)',
              wordBreak: 'break-all',
            }}
          >
            {configPath || '~/.config/scribl/init.lua'}
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-secondary, #64748b)' }}>
            Any manual changes made to this file in Neovim or VS Code are watched and hot-reloaded
            live.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type='button'
            onClick={handleOpenEditor}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: 'var(--color-accent, #0284c7)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            Open in Editor
          </button>

          <button
            type='button'
            onClick={handleReveal}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: 'rgba(125, 125, 125, 0.08)',
              color: 'var(--color-text-primary, #f8fafc)',
              border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            {isMac ? 'Reveal in Finder' : 'Show in File Explorer'}
          </button>

          <button
            type='button'
            onClick={handleReload}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: 'rgba(125, 125, 125, 0.08)',
              color: 'var(--color-text-primary, #f8fafc)',
              border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1))',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
};
