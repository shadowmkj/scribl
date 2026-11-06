import React, { useCallback, useEffect, useRef, useState } from 'react';
import { worldToScreen } from '../../core/camera/cameraMath';
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

  const camera = useCameraStore((s) => s.camera);
  const width = useCameraStore((s) => s.viewportWidth);
  const height = useCameraStore((s) => s.viewportHeight);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState('');
  const isCommittingRef = useRef(false);

  // Sync draft when editing starts
  useEffect(() => {
    if (editingText) {
      setDraft(editingText.text);
      isCommittingRef.current = false;

      // Focus and position cursor at end
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
          adjustTextareaSize(textareaRef.current);
        }
      });
    }
  }, [editingText]);

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
      'system-ui, -apple-system, sans-serif',
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
          color: existing.color,
        };
        const next = {
          text: draft,
          width: bounds.width,
          height: bounds.height,
          fontSize: editingText.fontSize,
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: editingText.color,
        lineHeight: 1.25,
      };

      doc.executeCommand(new AddElementCommand(newEl));
      doc.setSelected([newId]);
      setTool('select');
    }

    stopEditingText();
  }, [draft, editingText, setTool, stopEditingText]);

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
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCommit();
          }
        }}
        onBlur={handleCommit}
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
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: `${screenLineHeight}px`,
          minWidth: `${Math.max(screenFontSize * 3, 40)}px`,
          minHeight: `${screenLineHeight}px`,
          boxSizing: 'border-box',
          caretColor: editingText.color,
        }}
      />
    </div>
  );
};
