import { beforeEach, describe, expect, it } from 'vitest';
import { useToolStore } from './useToolStore';

describe('useToolStore - Text Tool', () => {
  beforeEach(() => {
    useToolStore.setState({
      currentTool: 'pen',
      color: '#0284c7',
      fontSize: 24,
      editingText: null,
    });
  });

  it('updates font size preset', () => {
    expect(useToolStore.getState().fontSize).toBe(24);
    useToolStore.getState().setFontSize(36);
    expect(useToolStore.getState().fontSize).toBe(36);
  });

  it('manages editingText lifecycle (start, draft update, stop)', () => {
    expect(useToolStore.getState().editingText).toBeNull();

    useToolStore.getState().startEditingText({
      x: 100,
      y: 200,
      text: 'Draft 1',
      fontSize: 24,
      color: '#ffffff',
    });

    expect(useToolStore.getState().editingText).toEqual({
      x: 100,
      y: 200,
      text: 'Draft 1',
      fontSize: 24,
      color: '#ffffff',
    });

    useToolStore.getState().updateEditingTextDraft('Draft 2');
    expect(useToolStore.getState().editingText?.text).toBe('Draft 2');

    useToolStore.getState().stopEditingText();
    expect(useToolStore.getState().editingText).toBeNull();
  });
});
