import { beforeEach, describe, expect, it } from 'vitest';
import { useToolStore } from './useToolStore';

describe('useToolStore', () => {
  beforeEach(() => {
    useToolStore.setState({
      currentTool: 'pen',
      zoomMode: 'scrubby',
      color: '#0284c7',
      fillColor: 'transparent',
      strokeSize: 4,
      strokeStyle: 'solid',
      fontSize: 24,
      editingText: null,
      activeShapeTool: 'rectangle',
      isShapesFlyoutOpen: false,
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

  it('initializes with default shape styling state', () => {
    const store = useToolStore.getState();
    expect(store.fillColor).toBe('transparent');
    expect(store.strokeStyle).toBe('solid');
  });

  it('manages shape styling state (fillColor and strokeStyle)', () => {
    const store = useToolStore.getState();
    store.setFillColor('#0284c7');
    store.setStrokeStyle('dashed');

    expect(useToolStore.getState().fillColor).toBe('#0284c7');
    expect(useToolStore.getState().strokeStyle).toBe('dashed');
  });

  it('updates tool type including shape tools and tracks activeShapeTool', () => {
    const store = useToolStore.getState();
    expect(store.activeShapeTool).toBe('rectangle');

    store.setTool('circle');
    expect(useToolStore.getState().currentTool).toBe('circle');
    expect(useToolStore.getState().activeShapeTool).toBe('circle');

    store.setTool('pen');
    expect(useToolStore.getState().currentTool).toBe('pen');
    // activeShapeTool remains circle (last-used shape memory)
    expect(useToolStore.getState().activeShapeTool).toBe('circle');

    store.setActiveShapeTool('diamond');
    expect(useToolStore.getState().activeShapeTool).toBe('diamond');
  });
});
