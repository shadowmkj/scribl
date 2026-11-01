import React, { useEffect, useState } from 'react';
import { useConfigStore } from '../../stores/useConfigStore';
import { useDocumentStore } from '../../stores/useDocumentStore';

interface TopHeaderProps {
  onSave: () => void;
  onOpen: () => void;
  onExportPNG: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onSave, onOpen, onExportPNG }) => {
  const [docName, setDocName] = useState('Untitled Drawing');
  const [confirmClear, setConfirmClear] = useState(false);
  const configPath = useConfigStore((s) => s.configPath);

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
    <header
      style={{
        position: 'absolute',
        top: 14,
        left: 16,
        right: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 30,
        pointerEvents: 'none',
        gap: 12,
      }}
    >
      {/* Left: Brand Identity & Document Title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '4px 10px',
          pointerEvents: 'auto',
          height: 42,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src='/logo.png'
            alt='Scribl'
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              objectFit: 'contain',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#f8fafc',
              textTransform: 'uppercase',
            }}
          >
            Scribl
          </span>
        </div>

        <div
          style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px' }}
        />

        <input
          value={docName}
          onChange={(e) => setDocName(e.target.value)}
          placeholder='Untitled Drawing'
          title='Click to rename drawing'
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 6,
            padding: '3px 8px',
            color: '#cbd5e1',
            fontSize: 13,
            fontWeight: 500,
            outline: 'none',
            minWidth: 140,
            maxWidth: 240,
            transition: 'all 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = 'rgba(2, 6, 23, 0.6)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          onMouseEnter={(e) => {
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }
          }}
          onMouseLeave={(e) => {
            if (document.activeElement !== e.currentTarget) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        />

        <div
          title={`Lua Config: ${configPath || '~/.config/scribl/init.lua'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 7px',
            borderRadius: 6,
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            fontSize: 10,
            color: '#38bdf8',
            fontWeight: 600,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          <svg
            width='10'
            height='10'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='3' />
            <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
          </svg>
          lua
        </div>
      </div>

      {/* Right: Actions, Undo/Redo & Export */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(15, 23, 42, 0.78)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '4px',
          pointerEvents: 'auto',
          height: 42,
        }}
      >
        {/* Undo */}
        <button
          disabled={!canUndo}
          onClick={undo}
          title='Undo (⌘Z / Ctrl+Z)'
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: canUndo ? '#f1f5f9' : '#475569',
            cursor: canUndo ? 'pointer' : 'default',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (canUndo) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
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
            <path d='M3 7v6h6' />
            <path d='M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13' />
          </svg>
        </button>

        {/* Redo */}
        <button
          disabled={!canRedo}
          onClick={redo}
          title='Redo (⇧⌘Z / Ctrl+Y)'
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: canRedo ? '#f1f5f9' : '#475569',
            cursor: canRedo ? 'pointer' : 'default',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (canRedo) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
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
            <path d='M21 7v6h-6' />
            <path d='M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7' />
          </svg>
        </button>

        <div
          style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }}
        />

        {/* Open */}
        <button
          onClick={onOpen}
          title='Open .scribl drawing'
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '0 10px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
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
            <path d='M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z' />
            <path d='M2 10h20' />
          </svg>
          Open
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          title='Save drawing as .scribl'
          style={{
            background: 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '0 10px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#f8fafc';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
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
            <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
            <polyline points='17 21 17 13 7 13 7 21' />
            <polyline points='7 3 7 8 15 8' />
          </svg>
          Save
        </button>

        {/* Export PNG */}
        <button
          onClick={onExportPNG}
          title='Export as PNG image'
          style={{
            background: 'rgba(2, 132, 199, 0.16)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            borderRadius: 8,
            padding: '0 12px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#38bdf8',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(2, 132, 199, 0.3)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(2, 132, 199, 0.16)';
            e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.28)';
          }}
        >
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
            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
            <polyline points='7 10 12 15 17 10' />
            <line x1='12' y1='15' x2='12' y2='3' />
          </svg>
          Export
        </button>

        <div
          style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }}
        />

        {/* Clear Canvas */}
        <button
          onClick={handleClearClick}
          title={confirmClear ? 'Click again to confirm clearing canvas' : 'Clear all strokes'}
          style={{
            background: confirmClear ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            border: confirmClear ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
            borderRadius: 8,
            padding: '0 10px',
            height: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: confirmClear ? '#f87171' : '#94a3b8',
            fontSize: 12,
            fontWeight: confirmClear ? 600 : 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!confirmClear) {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = '#f87171';
            }
          }}
          onMouseLeave={(e) => {
            if (!confirmClear) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
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
            <polyline points='3 6 5 6 21 6' />
            <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
          </svg>
          {confirmClear ? 'Confirm Clear?' : 'Clear'}
        </button>
      </div>
    </header>
  );
};
