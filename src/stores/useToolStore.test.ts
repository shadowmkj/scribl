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
    });
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
