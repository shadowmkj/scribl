import React, { useCallback, useEffect, useRef, useState } from 'react';
import { worldToScreen } from '../../core/camera/cameraMath';
import { getFontFamilyString } from '../../core/engine/fontConstants';
import { measureTextBounds } from '../../core/engine/textMeasurement';
import {
  AddElementCommand,
  DeleteElementsCommand,
  UpdateTextElementCommand,
} from '../../core/history/commands';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { TextElement } from '../../types/canvas';

export const TextEditorOverlay: React.FC = () => {
  const editingText = useToolStore((s) => s.editingText);
  const stopEditingText = useToolStore((s) => s.stopEditingText);
  const updateEditingTextDraft = useToolStore((s) => s.updateEditingTextDraft);
  const setTool = useToolStore((s) => s.setTool);
  const currentTool = useToolStore((s) => s.currentTool);

  const camera = useCameraStore((s) => s.camera);
  const width = useCameraStore((s) => s.viewportWidth);
  const height = useCameraStore((s) => s.viewportHeight);

  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const isCommittingRef = useRef(false);

  // Sync draft when a new editing session starts
  useEffect(() => {
    if (editingText) {
      setDraft(editingText.text);
      isCommittingRef.current = false;

      // Focus and position cursor at end
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
          adjustTextareaSize(textareaRef.current);
        }
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [editingText?.elementId, editingText?.x, editingText?.y]);

  const adjustTextareaSize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 24)}px`;
  };

  const handleCommit = useCallback(() => {
    if (!editingText || isCommittingRef.current) return;
    isCommittingRef.current = true;

    const trimmed = draft.trim();
    const doc = useDocumentStore.getState();

    if (trimmed.length === 0) {
      // Discard or delete empty element
      if (editingText.elementId) {
        doc.executeCommand(new DeleteElementsCommand([editingText.elementId], doc));
      }
      stopEditingText();
      return;
    }

    const bounds = measureTextBounds(
      draft,
      editingText.fontSize,
      getFontFamilyString(editingText.fontFamily),
      1.25,
    );

    if (editingText.elementId) {
      const existing = doc.elements[editingText.elementId];
      if (existing && existing.type === 'text') {
        const prev = {
          text: existing.text,
          width: existing.width,
          height: existing.height,
          fontSize: existing.fontSize,
          fontFamily: existing.fontFamily,
          color: existing.color,
        };
        const next = {
          text: draft,
          width: bounds.width,
          height: bounds.height,
          fontSize: editingText.fontSize,
          fontFamily: editingText.fontFamily || existing.fontFamily || 'handwritten',
          color: editingText.color,
        };
        doc.executeCommand(new UpdateTextElementCommand(existing.id, prev, next));
      }
    } else {
      const newId = `text_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newEl: TextElement = {
        id: newId,
        type: 'text',
        x: editingText.x,
        y: editingText.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: doc.elementIds.length + 1,
        text: draft,
        fontSize: editingText.fontSize,
        fontFamily: editingText.fontFamily || 'handwritten',
        color: editingText.color,
        lineHeight: 1.25,
      };

      doc.executeCommand(new AddElementCommand(newEl));
      doc.setSelected([newId]);
      setTool('select');
    }

    stopEditingText();
  }, [draft, editingText, setTool, stopEditingText]);

  // Click-outside listener to commit text
  useEffect(() => {
    if (!editingText) return;

    const handlePointerDownOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Inside editor
      if (overlayRef.current && overlayRef.current.contains(target)) {
        return;
      }

      // Allow clicking StyleInspector, Toolbar, or TopHeader buttons without dismissing editor
      if (
        target.closest('aside') || target.closest('nav') || target.closest('header')
        || target.closest('button')
      ) {
        return;
      }

      handleCommit();
    };

    // Attach after a short delay so the pointerup of the opening click cannot trigger it
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDownOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [editingText, handleCommit]);

  // Auto-commit if user switches tools away from text and select
  useEffect(() => {
    if (editingText && currentTool !== 'text' && currentTool !== 'select') {
      handleCommit();
    }
  }, [currentTool, editingText, handleCommit]);

  if (!editingText) return null;

  const screenPos = worldToScreen(
    editingText.x,
    editingText.y,
    camera,
    width,
    height,
  );
  const screenFontSize = Math.max(editingText.fontSize * camera.zoom, 8);
  const screenLineHeight = screenFontSize * 1.25;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y,
        zIndex: 40,
        pointerEvents: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={draft}
        autoFocus
        rows={1}
        wrap='off'
        onChange={(e) => {
          setDraft(e.target.value);
          updateEditingTextDraft(e.target.value);
          adjustTextareaSize(e.target);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
            e.preventDefault();
            handleCommit();
          }
        }}
        style={{
          background: 'transparent',
          border: '1px dashed var(--color-accent, #0284c7)',
          borderRadius: 4,
          padding: '2px 4px',
          margin: 0,
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
          whiteSpace: 'pre',
          color: editingText.color,
          fontSize: `${screenFontSize}px`,
          fontFamily: getFontFamilyString(editingText.fontFamily),
          lineHeight: `${screenLineHeight}px`,
          minWidth: `${Math.max(screenFontSize * 3, 50)}px`,
          minHeight: `${screenLineHeight}px`,
          boxSizing: 'border-box',
          caretColor: editingText.color,
        }}
      />
    </div>
  );
};
