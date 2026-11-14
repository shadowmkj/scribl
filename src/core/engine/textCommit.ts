import { useConfigStore } from '../../stores/useConfigStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { TextElement } from '../../types/canvas';
import {
  AddElementCommand,
  DeleteElementsCommand,
  UpdateTextElementCommand,
} from '../history/commands';
import { getFontFamilyString } from './fontConstants';
import { measureTextBounds } from './textMeasurement';

export function commitEditingText(overrideText?: string): boolean {
  const toolStore = useToolStore.getState();
  const editingText = toolStore.editingText;
  if (!editingText) return false;

  let rawText = overrideText !== undefined ? overrideText : editingText.text;
  if (overrideText === undefined && typeof document !== 'undefined') {
    const activeTextarea = (
      document.querySelector('textarea[data-testid="text-editor-input"]')
      || document.querySelector('textarea')
    ) as HTMLTextAreaElement | null;
    if (activeTextarea && typeof activeTextarea.value === 'string') {
      rawText = activeTextarea.value;
    }
  }
  const trimmed = rawText.trim();
  const doc = useDocumentStore.getState();

  if (trimmed.length === 0) {
    // Discard empty text draft or delete element if it existed
    if (editingText.elementId) {
      doc.executeCommand(new DeleteElementsCommand([editingText.elementId], doc));
    }
    if (toolStore.currentTool === 'text') {
      toolStore.setTool('select');
    }
    toolStore.stopEditingText();
    return true;
  }

  const bounds = measureTextBounds(
    rawText,
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
        text: rawText,
        width: bounds.width,
        height: bounds.height,
        fontSize: editingText.fontSize,
        fontFamily: editingText.fontFamily || existing.fontFamily || 'handwritten',
        color: editingText.color,
      };
      doc.executeCommand(new UpdateTextElementCommand(existing.id, prev, next));
      doc.setSelected([existing.id]);
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
      text: rawText,
      fontSize: editingText.fontSize,
      fontFamily: editingText.fontFamily || 'handwritten',
      color: editingText.color,
      lineHeight: 1.25,
    };

    doc.executeCommand(new AddElementCommand(newEl));
    const selectAfterCreate = useConfigStore.getState().config.options.select_after_create ?? true;
    if (selectAfterCreate) {
      doc.setSelected([newId]);
    } else {
      doc.setSelected([]);
    }
  }

  if (toolStore.currentTool === 'text') {
    toolStore.setTool('select');
  }

  toolStore.stopEditingText();
  return true;
}
