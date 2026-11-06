import React from 'react';
import { commandRegistry } from '../../core/commands/CommandRegistry';
import { formatKeybindForDisplay } from '../../core/input/KeybindingEngine';
import { DEFAULT_GROUPS, useConfigStore } from '../../stores/useConfigStore';
import { useToolStore } from '../../stores/useToolStore';
import { ShapeType, ToolType } from '../../types/canvas';

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
  rectangle: {
    label: 'Rectangle',
    toolId: 'rectangle',
    actionId: 'tool.shape.rectangle',
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
        <rect x='3' y='3' width='18' height='18' rx='2' />
      </svg>
    ),
  },
  circle: {
    label: 'Circle',
    toolId: 'circle',
    actionId: 'tool.shape.circle',
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
        <circle cx='12' cy='12' r='9' />
      </svg>
    ),
  },
  diamond: {
    label: 'Diamond',
    toolId: 'diamond',
    actionId: 'tool.shape.diamond',
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
        <polygon points='12 2, 22 12, 12 22, 2 12' />
      </svg>
    ),
  },
  line: {
    label: 'Line',
    toolId: 'line',
    actionId: 'tool.shape.line',
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
        <line x1='5' y1='19' x2='19' y2='5' />
      </svg>
    ),
  },
  arrow: {
    label: 'Arrow',
    toolId: 'arrow',
    actionId: 'tool.shape.arrow',
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
        <line x1='5' y1='19' x2='19' y2='5' />
        <polyline points='10 5 19 5 19 14' />
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
  const activeShapeTool = useToolStore((s) => s.activeShapeTool);
  const setActiveShapeTool = useToolStore((s) => s.setActiveShapeTool);
  const toolbar = useConfigStore((s) => s.config.toolbar);
  const keymaps = useConfigStore((s) => s.config.keymaps);

  const [openFlyout, setOpenFlyout] = React.useState<string | null>(null);
  const flyoutRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!openFlyout) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setOpenFlyout(null);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [openFlyout]);

  const isVertical = toolbar.position === 'left' || toolbar.position === 'right';
  const groups = toolbar.groups || DEFAULT_GROUPS;

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

  const getFlyoutPositionStyle = (): React.CSSProperties => {
    switch (toolbar.position) {
      case 'top':
        return {
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          left: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          right: 'calc(100% + 8px)',
          top: '50%',
          transform: 'translateY(-50%)',
        };
      case 'bottom':
      default:
        return {
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
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

        const group = groups[item];
        if (group) {
          const displayedTool = item === 'shapes'
            ? (group.items.includes(activeShapeTool)
              ? activeShapeTool
              : (group.default || group.items[0]))
            : (group.default || group.items[0]);
          const def = KNOWN_ITEMS[displayedTool];
          if (!def) return null;

          const isGroupActive = group.items.includes(currentTool);
          const isFlyoutOpen = openFlyout === item;
          const shortcut = getShortcut(def.actionId);

          const borderStyle = isGroupActive
            ? '1px solid var(--color-accent-light, color-mix(in srgb, var(--color-accent, #0284c7) 50%, white))'
            : '1px solid transparent';
          const sepBorder = isGroupActive
            ? '1px solid rgba(255, 255, 255, 0.25)'
            : '1px solid rgba(255, 255, 255, 0.08)';

          return (
            <div
              key={`group-${item}`}
              ref={isFlyoutOpen ? flyoutRef : undefined}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: isVertical ? 'column' : 'row',
                alignItems: 'stretch',
              }}
            >
              <button
                type='button'
                onClick={() => {
                  if (currentTool === displayedTool) {
                    setOpenFlyout(isFlyoutOpen ? null : item);
                  } else {
                    setTool(displayedTool as ToolType);
                  }
                }}
                title={`${def.label} (${group.label})${shortcut ? ` (${shortcut})` : ''}`}
                style={{
                  background: isGroupActive
                    ? 'linear-gradient(180deg, var(--color-accent, #0284c7) 0%, var(--color-accent-hover, color-mix(in srgb, var(--color-accent, #0284c7) 80%, black)) 100%)'
                    : 'transparent',
                  color: isGroupActive ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                  borderTop: borderStyle,
                  borderBottom: isVertical ? 'none' : borderStyle,
                  borderLeft: borderStyle,
                  borderRight: !isVertical ? 'none' : borderStyle,
                  borderRadius: isVertical ? '10px 10px 0 0' : '10px 0 0 10px',
                  padding: isVertical ? '8px 10px 4px' : '6px 8px 6px 12px',
                  fontSize: 13,
                  fontWeight: isGroupActive ? 600 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  transition: 'all 0.15s ease',
                  boxShadow: isGroupActive
                    ? '0 2px 10px color-mix(in srgb, var(--color-accent, #0284c7) 40%, transparent)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isGroupActive) {
                    e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
                    e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGroupActive) {
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
                      opacity: isGroupActive ? 0.9 : 0.7,
                      background: isGroupActive
                        ? 'rgba(0,0,0,0.2)'
                        : 'var(--color-panel-border, rgba(255,255,255,0.06))',
                      color: isGroupActive ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    {shortcut}
                  </span>
                )}
              </button>
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenFlyout(isFlyoutOpen ? null : item);
                }}
                title={`Browse ${group.label}`}
                style={{
                  background: isGroupActive
                    ? 'linear-gradient(180deg, var(--color-accent, #0284c7) 0%, var(--color-accent-hover, color-mix(in srgb, var(--color-accent, #0284c7) 80%, black)) 100%)'
                    : 'transparent',
                  color: isGroupActive ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                  borderTop: isVertical ? sepBorder : borderStyle,
                  borderBottom: borderStyle,
                  borderLeft: !isVertical ? sepBorder : borderStyle,
                  borderRight: borderStyle,
                  borderRadius: isVertical ? '0 0 10px 10px' : '0 10px 10px 0',
                  padding: isVertical ? '2px 8px 4px' : '6px 6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isGroupActive
                    ? '0 2px 10px color-mix(in srgb, var(--color-accent, #0284c7) 40%, transparent)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isGroupActive) {
                    e.currentTarget.style.background = 'rgba(125, 125, 125, 0.12)';
                    e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGroupActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
                  }
                }}
              >
                <svg
                  width='10'
                  height='10'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  style={{
                    transform: isFlyoutOpen
                      ? (isVertical ? 'rotate(-90deg)' : 'rotate(180deg)')
                      : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <polyline points='6 9 12 15 18 9' />
                </svg>
              </button>

              {isFlyoutOpen && (
                <div
                  style={{
                    position: 'absolute',
                    ...getFlyoutPositionStyle(),
                    background: 'var(--color-panel-bg, rgba(15, 23, 42, 0.94))',
                    backdropFilter: 'blur(16px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                    border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1))',
                    borderRadius: 12,
                    padding: '5px',
                    display: 'flex',
                    flexDirection: isVertical ? 'column' : 'row',
                    gap: 5,
                    alignItems: 'center',
                    zIndex: 50,
                    boxShadow:
                      'var(--color-panel-shadow, 0 12px 36px rgba(0, 0, 0, 0.55)), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {group.items.map((subItem) => {
                    const subDef = KNOWN_ITEMS[subItem];
                    if (!subDef) return null;
                    const isSubActive = currentTool === subDef.toolId;
                    const subShortcut = getShortcut(subDef.actionId);

                    return (
                      <button
                        key={subItem}
                        type='button'
                        onClick={() => {
                          if (subDef.toolId) {
                            setTool(subDef.toolId);
                            if (
                              ['rectangle', 'circle', 'diamond', 'line', 'arrow'].includes(
                                subDef.toolId,
                              )
                            ) {
                              setActiveShapeTool(subDef.toolId as ShapeType);
                            }
                          } else if (subDef.actionId) {
                            commandRegistry.execute(subDef.actionId);
                          }
                          setOpenFlyout(null);
                        }}
                        title={`${subDef.label}${subShortcut ? ` (${subShortcut})` : ''}`}
                        style={{
                          background: isSubActive
                            ? 'linear-gradient(180deg, var(--color-accent, #0284c7) 0%, var(--color-accent-hover, color-mix(in srgb, var(--color-accent, #0284c7) 80%, black)) 100%)'
                            : 'transparent',
                          color: isSubActive ? '#ffffff' : 'var(--color-text-secondary, #94a3b8)',
                          border: isSubActive
                            ? '1px solid var(--color-accent-light, color-mix(in srgb, var(--color-accent, #0284c7) 50%, white))'
                            : '1px solid transparent',
                          borderRadius: 8,
                          padding: isVertical ? '7px 12px' : '6px 10px',
                          fontSize: 12,
                          fontWeight: isSubActive ? 600 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'rgba(125, 125, 125, 0.15)';
                            e.currentTarget.style.color = 'var(--color-text-primary, #f1f5f9)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)';
                          }
                        }}
                      >
                        <span>{subDef.icon}</span>
                        <span>{subDef.label}</span>
                        {subShortcut && (
                          <span
                            style={{
                              fontSize: 10,
                              opacity: isSubActive ? 0.9 : 0.7,
                              background: isSubActive
                                ? 'rgba(0,0,0,0.2)'
                                : 'var(--color-panel-border, rgba(255,255,255,0.06))',
                              color: isSubActive
                                ? '#ffffff'
                                : 'var(--color-text-secondary, #94a3b8)',
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontWeight: 600,
                            }}
                          >
                            {subShortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            type='button'
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
