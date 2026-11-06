import React from 'react';
import { commandRegistry } from '../../core/commands/CommandRegistry';
import { formatKeybindForDisplay } from '../../core/input/KeybindingEngine';
import { useConfigStore } from '../../stores/useConfigStore';
import { useToolStore } from '../../stores/useToolStore';
import { ToolType } from '../../types/canvas';

interface ItemDef {
  label: string;
  icon: React.ReactNode;
  actionId?: string;
  toolId?: ToolType;
}

const KNOWN_ITEMS: Record<string, ItemDef> = {
  select: {
    label: 'Select',
    toolId: 'select',
    actionId: 'tool.select',
    icon: (
      <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z' />
        <path d='m13 13 6 6' />
      </svg>
    ),
  },
  pen: {
    label: 'Pen',
    toolId: 'pen',
    actionId: 'tool.pen',
    icon: (
      <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' />
      </svg>
    ),
  },
  eraser: {
    label: 'Eraser',
    toolId: 'eraser',
    actionId: 'tool.eraser',
    icon: (
      <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21' />
        <path d='M22 21H7' />
        <path d='m5 11 9 9' />
      </svg>
    ),
  },
  text: {
    label: 'Text',
    toolId: 'text',
    actionId: 'tool.text',
    icon: (
      <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <polyline points='4 7 4 4 20 4 20 7' />
        <line x1='9' y1='20' x2='15' y2='20' />
        <line x1='12' y1='4' x2='12' y2='20' />
      </svg>
    ),
  },
  zoom: {
    label: 'Zoom',
    toolId: 'zoom',
    actionId: 'tool.zoom',
    icon: (
      <svg
        width='15'
        height='15'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <circle cx='11' cy='11' r='8' />
        <path d='m21 21-4.35-4.35' />
        <line x1='11' y1='8' x2='11' y2='14' />
        <line x1='8' y1='11' x2='14' y2='11' />
      </svg>
    ),
  },
  undo: {
    label: 'Undo',
    actionId: 'history.undo',
    icon: (
      <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M3 7v6h6' />
        <path d='M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13' />
      </svg>
    ),
  },
  redo: {
    label: 'Redo',
    actionId: 'history.redo',
    icon: (
      <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M21 7v6h-6' />
        <path d='M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7' />
      </svg>
    ),
  },
  clear: {
    label: 'Clear',
    actionId: 'canvas.clear',
    icon: (
      <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M3 6h18' />
        <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
        <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
      </svg>
    ),
  },
};

export const FloatingDock: React.FC = () => {
  const currentTool = useToolStore((s) => s.currentTool);
  const setTool = useToolStore((s) => s.setTool);
  const toolbar = useConfigStore((s) => s.config.toolbar);
  const keymaps = useConfigStore((s) => s.config.keymaps);

  const isVertical = toolbar.position === 'left' || toolbar.position === 'right';

  const getPositionStyle = (): React.CSSProperties => {
    switch (toolbar.position) {
      case 'top':
        return {
          top: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          flexDirection: 'row',
        };
      case 'left':
        return {
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          flexDirection: 'column',
        };
      case 'right':
        return {
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          flexDirection: 'column',
        };
      case 'bottom':
      default:
        return {
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          flexDirection: 'row',
        };
    }
  };

  const getShortcut = (actionId?: string): string | undefined => {
    if (!actionId) return undefined;
    const matching = keymaps.filter((k) => k.rhs === actionId);
    if (matching.length === 0) return undefined;
    return formatKeybindForDisplay(matching[0].lhs);
  };

  return (
    <nav
      style={{
        position: 'absolute',
        ...getPositionStyle(),
        background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.78))',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.08))',
        borderRadius: 14,
        padding: '5px',
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        zIndex: 25,
        boxShadow:
          'var(--color-panel-shadow, 0 12px 36px rgba(0, 0, 0, 0.45)), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      }}
    >
      {toolbar.items.map((item, index) => {
        if (item === '|') {
          return (
            <div
              key={`sep-${index}`}
              style={{
                width: isVertical ? '20px' : '1px',
                height: isVertical ? '1px' : '20px',
                background: 'var(--color-panel-border, rgba(255, 255, 255, 0.1))',
                margin: isVertical ? '2px 0' : '0 2px',
              }}
            />
          );
        }

        const def = KNOWN_ITEMS[item];
        if (!def) return null;

        const isTool = !!def.toolId;
        const isActive = isTool && currentTool === def.toolId;
        const shortcut = getShortcut(def.actionId);

        const handleClick = () => {
          if (def.toolId) {
            setTool(def.toolId);
          } else if (def.actionId) {
            commandRegistry.execute(def.actionId);
          }
        };

        return (
          <button
            key={item}
            onClick={handleClick}
            title={`${def.label}${shortcut ? ` (${shortcut})` : ''}`}
            style={{
              background: isActive
                ? 'linear-gradient(180deg, var(--color-accent, #0284c7) 0%, var(--color-accent-hover, color-mix(in srgb, var(--color-accent, #0284c7) 80%, black)) 100%)'
                : 'transparent',
              color: isActive ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
              border: isActive
                ? '1px solid var(--color-accent-light, color-mix(in srgb, var(--color-accent, #0284c7) 50%, white))'
                : '1px solid transparent',
              borderRadius: 10,
              padding: isVertical ? '8px' : '6px 14px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              transition: 'all 0.15s ease',
              boxShadow: isActive
                ? '0 2px 10px color-mix(in srgb, var(--color-accent, #0284c7) 40%, transparent)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
                e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
              }
            }}
          >
            <span>{def.icon}</span>
            {!isVertical && <span>{def.label}</span>}
            {shortcut && !isVertical && (
              <span
                style={{
                  fontSize: 10,
                  opacity: isActive ? 0.9 : 0.7,
                  background: isActive
                    ? 'rgba(0,0,0,0.2)'
                    : 'var(--color-panel-border, rgba(255,255,255,0.06))',
                  color: isActive ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                  padding: '1px 5px',
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                {shortcut}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
