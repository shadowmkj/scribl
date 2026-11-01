import React, { useState, useEffect } from 'react';
import { useDocumentStore } from '../../stores/useDocumentStore';

interface TopHeaderProps {
  onSave: () => void;
  onOpen: () => void;
  onExportPNG: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSave, onOpen, onExportPNG }) => {
  const [docName, setDocName] = useState('Untitled Drawing');
  const [confirmClear, setConfirmClear] = useState(false);

  const canUndo = useDocumentStore((s) => s.canUndo);
  const canRedo = useDocumentStore((s) => s.canRedo);
  const undo = useDocumentStore((s) => s.undo);
  const redo = useDocumentStore((s) => s.redo);
  const clearDocument = useDocumentStore((s) => s.clearDocument);

  // Auto-reset clear confirmation after 3 seconds
  useEffect(() => {
    if (!confirmClear) return;
    const timeout = setTimeout(() => setConfirmClear(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirmClear]);

  const handleClearClick = () => {
    if (confirmClear) {
      clearDocument();
      try {
        localStorage.removeItem('scribl_active_doc');
      } catch (e) {
        // Ignore localStorage error
      }
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 20,
        right: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {/* Brand & Document Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#f8fafc',
            fontWeight: 700,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <img
            src="/logo.png"
            alt="Scribl Logo"
            style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain' }}
          />
          Scribl
        </div>
        <input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: 6,
            padding: '6px 10px',
            color: '#cbd5e1',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>

      {/* Actions: Undo / Redo / Files */}
      <div style={{ display: 'flex', gap: 8, pointerEvents: 'auto' }}>
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: 8,
            padding: '4px',
            display: 'flex',
            gap: 4,
          }}
        >
          <button
            disabled={!canUndo}
            onClick={undo}
            title="Undo (Cmd+Z)"
            style={{
              background: 'none',
              border: 'none',
              color: canUndo ? '#f8fafc' : '#475569',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: canUndo ? 'pointer' : 'default',
            }}
          >
            ⤺
          </button>
          <button
            disabled={!canRedo}
            onClick={redo}
            title="Redo (Cmd+Shift+Z)"
            style={{
              background: 'none',
              border: 'none',
              color: canRedo ? '#f8fafc' : '#475569',
              padding: '4px 8px',
              borderRadius: 4,
              cursor: canRedo ? 'pointer' : 'default',
            }}
          >
            ⤻
          </button>
        </div>

        <div
          style={{
            background: 'rgba(30, 41, 59, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: 8,
            padding: '4px 8px',
            display: 'flex',
            gap: 6,
          }}
        >
          <button
            onClick={onOpen}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 12 }}
          >
            Open
          </button>
          <button
            onClick={onSave}
            style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 12 }}
          >
            Save
          </button>
          <button
            onClick={onExportPNG}
            style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: 12 }}
          >
            Export PNG
          </button>
          <button
            onClick={handleClearClick}
            title={confirmClear ? 'Click again to confirm clearing canvas' : 'Clear all strokes'}
            style={{
              background: confirmClear ? 'rgba(239, 68, 68, 0.2)' : 'none',
              border: confirmClear ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
              borderRadius: 4,
              padding: '4px 8px',
              color: confirmClear ? '#f87171' : '#f43f5e',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: confirmClear ? 600 : 400,
              transition: 'all 0.15s ease',
            }}
          >
            {confirmClear ? 'Confirm Clear?' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  );
};
