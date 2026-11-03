import React, { useEffect, useState } from 'react';
import { formatKeybindForDisplay } from '../../core/input/KeybindingEngine';
import { DEFAULT_CONFIG, KeymapEntry, useConfigStore } from '../../stores/useConfigStore';

interface ActionDefinition {
  id: string;
  targetId?: string;
  label: string;
  category:
    | 'Tools'
    | 'Zoom & Navigation'
    | 'History'
    | 'Canvas & File'
    | 'Visual Mode (Selection)';
  defaultLhs: string;
  mode?: string;
}

const ALL_ACTIONS: ActionDefinition[] = [
  // Tools
  { id: 'tool.pen', label: 'Pen Tool', category: 'Tools', defaultLhs: 'p', mode: 'n' },
  { id: 'tool.eraser', label: 'Eraser Tool', category: 'Tools', defaultLhs: 'e', mode: 'n' },
  { id: 'tool.select', label: 'Select Tool', category: 'Tools', defaultLhs: 'v', mode: 'n' },
  { id: 'tool.zoom', label: 'Zoom Tool', category: 'Tools', defaultLhs: 'z', mode: 'n' },

  // Zoom & Navigation
  {
    id: 'zoom.reset',
    label: 'Reset Zoom (100%)',
    category: 'Zoom & Navigation',
    defaultLhs: '<S-0>',
    mode: 'n',
  },
  { id: 'zoom.in', label: 'Zoom In', category: 'Zoom & Navigation', defaultLhs: '=', mode: 'n' },
  { id: 'zoom.out', label: 'Zoom Out', category: 'Zoom & Navigation', defaultLhs: '-', mode: 'n' },
  {
    id: 'canvas.pan',
    label: 'Pan Canvas',
    category: 'Zoom & Navigation',
    defaultLhs: '<Space>',
    mode: 'n',
  },
  {
    id: 'zoom.fit_all',
    label: 'Fit All Strokes in View',
    category: 'Zoom & Navigation',
    defaultLhs: 'f',
    mode: 'n',
  },

  // History
  { id: 'history.undo', label: 'Undo', category: 'History', defaultLhs: '<D-z>', mode: 'n' },
  { id: 'history.redo', label: 'Redo', category: 'History', defaultLhs: '<D-S-z>', mode: 'n' },

  // Canvas & File
  {
    id: 'file.save',
    label: 'Save Drawing (.scribl)',
    category: 'Canvas & File',
    defaultLhs: '<D-s>',
    mode: 'n',
  },
  {
    id: 'file.open',
    label: 'Open Drawing',
    category: 'Canvas & File',
    defaultLhs: '<D-o>',
    mode: 'n',
  },
  {
    id: 'canvas.clear',
    label: 'Clear Entire Canvas',
    category: 'Canvas & File',
    defaultLhs: 'c',
    mode: 'n',
  },
  {
    id: 'selection.delete',
    label: 'Delete Selected Strokes',
    category: 'Canvas & File',
    defaultLhs: '<BS>',
    mode: 'n',
  },
  {
    id: 'app.settings',
    label: 'Open Preferences',
    category: 'Canvas & File',
    defaultLhs: '<D-,>',
    mode: 'n',
  },

  // Visual Mode (Selection)
  {
    id: 'selection.rotate',
    label: 'Rotate Selection (Hold key to rotate)',
    category: 'Visual Mode (Selection)',
    defaultLhs: 'r',
    mode: 'v',
  },
  {
    id: 'selection.deselect',
    label: 'Deselect Elements',
    category: 'Visual Mode (Selection)',
    defaultLhs: '<Esc>',
    mode: 'v',
  },
  {
    id: 'selection.delete_visual',
    targetId: 'selection.delete',
    label: 'Delete Selected (Visual Mode)',
    category: 'Visual Mode (Selection)',
    defaultLhs: 'd',
    mode: 'v',
  },
];

export const KeybindingsTab: React.FC = () => {
  const config = useConfigStore((s) => s.config);
  const saveConfigToDisk = useConfigStore((s) => s.saveConfigToDisk);

  const [search, setSearch] = useState('');
  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Key recording listener
  useEffect(() => {
    if (!recordingActionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape cancels recording
      if (e.key === 'Escape') {
        setRecordingActionId(null);
        setConflictWarning(null);
        return;
      }

      // Ignore bare modifiers
      if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        return;
      }

      const isMac = typeof navigator !== 'undefined'
        && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

      // Construct notation
      let notation = '';
      const parts: string[] = [];
      if (e.ctrlKey && isMac) parts.push('C');
      if (e.metaKey || (e.ctrlKey && !isMac)) parts.push('D');
      if (e.altKey) parts.push('M');
      if (e.shiftKey) parts.push('S');

      let baseKey = e.key;
      if (e.code === 'Space' || e.key === ' ') baseKey = 'Space';
      else if (e.key === 'Backspace') baseKey = 'BS';
      else if (e.key === 'Delete') baseKey = 'Del';
      else if (e.key === 'Enter') baseKey = 'CR';
      else if (e.code.startsWith('Digit')) baseKey = e.code.replace('Digit', '');

      if (parts.length > 0 || ['Space', 'BS', 'Del', 'CR'].includes(baseKey)) {
        notation = `<${[...parts, baseKey].join('-')}>`;
      } else {
        notation = baseKey.toLowerCase();
      }

      const actionDef = ALL_ACTIONS.find((a) => a.id === recordingActionId);
      const targetRhs = actionDef?.targetId || recordingActionId;
      const targetMode = actionDef?.mode || 'n';

      // Conflict check: is this key already used by another action in the same mode?
      const existing = config.keymaps.find((k) =>
        (k.mode || 'n') === targetMode && k.lhs === notation && k.rhs !== targetRhs
      );
      if (existing) {
        const conflictingAction = ALL_ACTIONS.find((a) =>
          (a.targetId || a.id) === existing.rhs
          && (a.mode || 'n') === (existing.mode || 'n')
        )?.label || existing.rhs;
        setConflictWarning(
          `"${notation}" is already assigned to ${conflictingAction}. Click again to overwrite.`,
        );
      }

      // Update keymap list
      let updatedKeymaps = config.keymaps.filter(
        (k) =>
          !(
            (k.mode || 'n') === targetMode
            && k.rhs === targetRhs
            && k.lhs === notation
          )
          && !((k.mode || 'n') === targetMode && k.lhs === notation),
      );

      // Add new keymap at the top for this action so it becomes primary
      const newEntry: KeymapEntry = {
        mode: targetMode,
        lhs: notation,
        rhs: targetRhs,
        desc: actionDef?.label,
      };

      // Filter out any other keymap for this action to cleanly replace it, or put new key first
      const otherKeymapsForAction = updatedKeymaps.filter(
        (k) => (k.mode || 'n') === targetMode && k.rhs === targetRhs,
      );
      const remainingKeymaps = updatedKeymaps.filter(
        (k) => !((k.mode || 'n') === targetMode && k.rhs === targetRhs),
      );

      updatedKeymaps = [newEntry, ...otherKeymapsForAction, ...remainingKeymaps];

      saveConfigToDisk({
        ...config,
        keymaps: updatedKeymaps,
      });

      setRecordingActionId(null);
      setConflictWarning(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingActionId, config, saveConfigToDisk]);

  const handleResetDefaults = () => {
    saveConfigToDisk({
      ...config,
      keymaps: DEFAULT_CONFIG.keymaps,
    });
    setRecordingActionId(null);
    setConflictWarning(null);
  };

  const handleRemoveKeybind = (
    action: ActionDefinition,
    lhs: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const targetRhs = action.targetId || action.id;
    const targetMode = action.mode || 'n';
    const updatedKeymaps = config.keymaps.filter(
      (k) =>
        !(
          (k.mode || 'n') === targetMode
          && k.rhs === targetRhs
          && k.lhs === lhs
        ),
    );
    saveConfigToDisk({
      ...config,
      keymaps: updatedKeymaps,
    });
  };

  // Group actions by category
  const categories: Array<
    | 'Tools'
    | 'Zoom & Navigation'
    | 'History'
    | 'Canvas & File'
    | 'Visual Mode (Selection)'
  > = [
    'Tools',
    'Zoom & Navigation',
    'History',
    'Canvas & File',
    'Visual Mode (Selection)',
  ];

  const filteredActions = ALL_ACTIONS.filter((action) => {
    const q = search.toLowerCase();
    const matchesName = action.label.toLowerCase().includes(q)
      || action.id.toLowerCase().includes(q);
    const assignedKeymaps = config.keymaps.filter(
      (k) =>
        k.rhs === (action.targetId || action.id)
        && (k.mode || 'n') === (action.mode || 'n'),
    );
    const matchesKey = assignedKeymaps.some((k) => k.lhs.toLowerCase().includes(q));
    return matchesName || matchesKey;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3
            style={{
              margin: '0 0 4px',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--color-text-primary, #f8fafc)',
            }}
          >
            Keyboard Shortcuts
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary, #94a3b8)' }}>
            Click any badge to rebind. Press Esc to cancel recording.
          </p>
        </div>
        <button
          type='button'
          onClick={handleResetDefaults}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.1))',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: 'var(--color-text-secondary, #94a3b8)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary, #f8fafc)')}
          onMouseLeave={(
            e,
          ) => (e.currentTarget.style.color = 'var(--color-text-secondary, #94a3b8)')}
        >
          Reset to Defaults
        </button>
      </div>

      {conflictWarning && (
        <div
          style={{
            padding: '8px 12px',
            background: 'rgba(234, 179, 8, 0.15)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: 8,
            fontSize: 12,
            color: '#d97706',
          }}
        >
          ⚠️ {conflictWarning}
        </div>
      )}

      {/* Search Filter */}
      <input
        type='text'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Search commands or keys (e.g. "pen", "zoom", "⌘Z")...'
        style={{
          background: 'rgba(0, 0, 0, 0.08)',
          border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.12))',
          borderRadius: 8,
          padding: '8px 12px',
          color: 'var(--color-text-primary, #f8fafc)',
          fontSize: 12,
          outline: 'none',
        }}
      />

      {/* Actions List Grouped by Category */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          maxHeight: 330,
          overflowY: 'auto',
        }}
      >
        {categories.map((cat) => {
          const items = filteredActions.filter((a) => a.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-secondary, #64748b)',
                  paddingLeft: 4,
                }}
              >
                {cat}
              </div>

              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.05))',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                {items.map((action, idx) => {
                  const assignedKeymaps = config.keymaps.filter(
                    (k) =>
                      k.rhs === (action.targetId || action.id)
                      && (k.mode || 'n') === (action.mode || 'n'),
                  );
                  const isRecording = recordingActionId === action.id;

                  return (
                    <div
                      key={action.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderBottom: idx === items.length - 1
                          ? 'none'
                          : '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.04))',
                        background: isRecording ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--color-text-primary, #e2e8f0)',
                          fontWeight: 500,
                        }}
                      >
                        {action.label}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isRecording
                          ? (
                            <div
                              style={{
                                padding: '3px 10px',
                                borderRadius: 6,
                                background: '#0284c7',
                                color: '#ffffff',
                                fontSize: 11,
                                fontWeight: 600,
                                animation: 'pulse 1.5s infinite',
                                boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
                              }}
                            >
                              Press any key...
                            </div>
                          )
                          : assignedKeymaps.length > 0
                          ? (
                            assignedKeymaps.map((km) => (
                              <div
                                key={km.lhs}
                                onClick={() => {
                                  setRecordingActionId(action.id);
                                  setConflictWarning(null);
                                }}
                                title='Click to rebind'
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background:
                                    'var(--color-panel-border, rgba(255, 255, 255, 0.08))',
                                  border:
                                    '1px solid var(--color-panel-border, rgba(255, 255, 255, 0.12))',
                                  borderRadius: 6,
                                  padding: '2px 8px',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: 'var(--color-text-primary, #f8fafc)',
                                  cursor: 'pointer',
                                }}
                              >
                                <span>{formatKeybindForDisplay(km.lhs)}</span>
                                <span
                                  onClick={(e) => handleRemoveKeybind(action, km.lhs, e)}
                                  title='Remove shortcut'
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--color-text-secondary, #94a3b8)',
                                    marginLeft: 2,
                                    cursor: 'pointer',
                                  }}
                                >
                                  ✕
                                </span>
                              </div>
                            ))
                          )
                          : (
                            <button
                              type='button'
                              onClick={() => {
                                setRecordingActionId(action.id);
                                setConflictWarning(null);
                              }}
                              style={{
                                background: 'transparent',
                                border:
                                  '1px dashed var(--color-panel-border, rgba(255, 255, 255, 0.2))',
                                borderRadius: 6,
                                padding: '2px 8px',
                                fontSize: 11,
                                color: 'var(--color-text-secondary, #64748b)',
                                cursor: 'pointer',
                              }}
                            >
                              + Record
                            </button>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
