import React, { useCallback, useEffect, useRef, useState } from 'react';
import { worldToScreen } from '../../core/camera/cameraMath';
import { getFontFamilyString } from '../../core/engine/fontConstants';
import { commitEditingText } from '../../core/engine/textCommit';
import { useCameraStore } from '../../stores/useCameraStore';
import { EditingTextState, useToolStore } from '../../stores/useToolStore';

interface TextEditorInputProps {
  editingText: EditingTextState;
}

const TextEditorInput: React.FC<TextEditorInputProps> = ({ editingText }) => {
  const updateEditingTextDraft = useToolStore((s) => s.updateEditingTextDraft);
  const currentTool = useToolStore((s) => s.currentTool);

  const camera = useCameraStore((s) => s.camera);
  const width = useCameraStore((s) => s.viewportWidth);
  const height = useCameraStore((s) => s.viewportHeight);

  const overlayRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCommittingRef = useRef(false);

  // Initialize draft immediately with the active editingText's text
  const [draft, setDraft] = useState(editingText.text);

  // Sync draft during render if editingText.text changes externally
  const [prevEditingText, setPrevEditingText] = useState(editingText.text);
  if (editingText.text !== prevEditingText) {
    setPrevEditingText(editingText.text);
    setDraft(editingText.text);
  }

  const screenFontSize = Math.max(editingText.fontSize * camera.zoom, 8);
  const screenLineHeight = screenFontSize * 1.25;

  const adjustTextareaSize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const minH = Math.ceil(screenLineHeight);
    el.style.height = `${Math.max(el.scrollHeight, minH)}px`;
    el.scrollTop = 0;
  }, [screenLineHeight]);

  // Focus and position cursor on mount
  useEffect(() => {
    isCommittingRef.current = false;

    const focusTextarea = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
        adjustTextareaSize(textareaRef.current);
      }
    };

    focusTextarea();
    const raf = requestAnimationFrame(focusTextarea);
    const timer = setTimeout(focusTextarea, 20);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [editingText.elementId, adjustTextareaSize]);

  const handleCommit = useCallback(() => {
    if (isCommittingRef.current) return;
    isCommittingRef.current = true;
    commitEditingText(textareaRef.current?.value ?? draft);
  }, [draft]);

  // Click-outside listener to commit text
  useEffect(() => {
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

      e.stopPropagation();
      handleCommit();
    };

    window.addEventListener('pointerdown', handlePointerDownOutside, true);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside, true);
    };
  }, [handleCommit]);

  // Auto-commit if user switches tools away from text and select
  useEffect(() => {
    if (currentTool !== 'text' && currentTool !== 'select') {
      handleCommit();
    }
  }, [currentTool, handleCommit]);

  const screenPos = worldToScreen(
    editingText.x,
    editingText.y,
    camera,
    width,
    height,
  );

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        left: screenPos.x,
        top: screenPos.y,
        zIndex: 40,
        pointerEvents: 'auto',
        cursor: 'text',
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        data-testid='text-editor-input'
        value={draft}
        autoFocus
        rows={1}
        wrap='off'
        onPointerDown={(e) => e.stopPropagation()}
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
            return;
          }

          if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const currentText = textarea.value;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const TAB = '  ';

            if (e.shiftKey) {
              // Unindent
              const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
              const lineEndIdx = currentText.indexOf('\n', end);
              const lineEnd = lineEndIdx === -1 ? currentText.length : lineEndIdx;
              const selectedBlock = currentText.slice(lineStart, lineEnd);
              const lines = selectedBlock.split('\n');

              let removedFirstLine = 0;
              let totalRemoved = 0;

              const unindented = lines.map((line, idx) => {
                let removed = 0;
                let newLine = line;
                if (line.startsWith(TAB)) {
                  newLine = line.slice(TAB.length);
                  removed = TAB.length;
                } else if (line.startsWith('\t')) {
                  newLine = line.slice(1);
                  removed = 1;
                } else if (line.startsWith(' ')) {
                  newLine = line.slice(1);
                  removed = 1;
                }
                if (idx === 0) removedFirstLine = removed;
                totalRemoved += removed;
                return newLine;
              });

              if (totalRemoved > 0) {
                const nextText = currentText.slice(0, lineStart) + unindented.join('\n')
                  + currentText.slice(lineEnd);
                setDraft(nextText);
                updateEditingTextDraft(nextText);
                textarea.value = nextText;
                adjustTextareaSize(textarea);

                const newStart = Math.max(lineStart, start - removedFirstLine);
                const newEnd = Math.max(newStart, end - totalRemoved);
                textarea.setSelectionRange(newStart, newEnd);
                requestAnimationFrame(() => {
                  textareaRef.current?.setSelectionRange(newStart, newEnd);
                });
              }
            } else {
              // Indent
              const hasNewline = currentText.slice(start, end).includes('\n');
              if (hasNewline) {
                // Multiline indent
                const lineStart = currentText.lastIndexOf('\n', start - 1) + 1;
                const lineEndIdx = currentText.indexOf('\n', end);
                const lineEnd = lineEndIdx === -1 ? currentText.length : lineEndIdx;
                const selectedBlock = currentText.slice(lineStart, lineEnd);
                const lines = selectedBlock.split('\n');

                const indented = lines.map((line) => TAB + line).join('\n');
                const nextText = currentText.slice(0, lineStart) + indented
                  + currentText.slice(lineEnd);
                setDraft(nextText);
                updateEditingTextDraft(nextText);
                textarea.value = nextText;
                adjustTextareaSize(textarea);

                const newStart = start + TAB.length;
                const newEnd = end + TAB.length * lines.length;
                textarea.setSelectionRange(newStart, newEnd);
                requestAnimationFrame(() => {
                  textareaRef.current?.setSelectionRange(newStart, newEnd);
                });
              } else {
                // Single line or single cursor: insert 2 spaces
                const nextText = currentText.slice(0, start) + TAB + currentText.slice(end);
                setDraft(nextText);
                updateEditingTextDraft(nextText);
                textarea.value = nextText;
                adjustTextareaSize(textarea);

                const nextPos = start + TAB.length;
                textarea.setSelectionRange(nextPos, nextPos);
                requestAnimationFrame(() => {
                  textareaRef.current?.setSelectionRange(nextPos, nextPos);
                });
              }
            }
          }
        }}
        style={{
          background: 'transparent',
          border: '1px dashed var(--color-accent, #0284c7)',
          borderRadius: 4,
          padding: '0 4px',
          margin: 0,
          outline: 'none',
          resize: 'none',
          overflow: 'hidden',
          whiteSpace: 'pre',
          tabSize: 2,
          color: editingText.color,
          fontSize: `${screenFontSize}px`,
          fontFamily: getFontFamilyString(editingText.fontFamily),
          lineHeight: `${screenLineHeight}px`,
          minWidth: `${Math.max(screenFontSize * 3, 50)}px`,
          minHeight: `${Math.ceil(screenLineHeight)}px`,
          boxSizing: 'border-box',
          caretColor: 'var(--color-accent, #38bdf8)',
          cursor: 'text',
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
      />
    </div>
  );
};

export const TextEditorOverlay: React.FC = () => {
  const editingText = useToolStore((s) => s.editingText);
  if (!editingText) return null;

  return (
    <TextEditorInput
      key={editingText.elementId ?? `${editingText.x}_${editingText.y}`}
      editingText={editingText}
    />
  );
};
