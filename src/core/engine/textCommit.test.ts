import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { commitEditingText } from './textCommit';

describe('commitEditingText', () => {
  beforeEach(() => {
    useDocumentStore.setState({
      elements: {},
      elementIds: [],
      selectedIds: [],
    });

    useToolStore.setState({
      currentTool: 'text',
      color: '#0284c7',
      fontSize: 24,
      fontFamily: 'handwritten',
      editingText: null,
    });

    useConfigStore.setState({ config: DEFAULT_CONFIG });
  });

  it('selects new text element and switches to select tool by default', () => {
    useToolStore.setState({
      currentTool: 'text',
      editingText: {
        x: 100,
        y: 100,
        text: 'Hello World',
        fontSize: 24,
        fontFamily: 'handwritten',
        color: '#0284c7',
      },
    });

    const result = commitEditingText();
    expect(result).toBe(true);

    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const newId = doc.elementIds[0];
    expect(doc.selectedIds).toEqual([newId]);
    expect(useToolStore.getState().currentTool).toBe('select');
  });

  it('switches tool to select but does not select text when select_after_create is false', () => {
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        options: {
          ...DEFAULT_CONFIG.options,
          select_after_create: false,
        },
      },
    });

    useToolStore.setState({
      currentTool: 'text',
      editingText: {
        x: 100,
        y: 100,
        text: 'Hello Unselected',
        fontSize: 24,
        fontFamily: 'handwritten',
        color: '#0284c7',
      },
    });

    const result = commitEditingText();
    expect(result).toBe(true);

    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    expect(doc.selectedIds).toEqual([]);
    expect(useToolStore.getState().currentTool).toBe('select');
  });
});
