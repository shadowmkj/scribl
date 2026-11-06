import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { TextElement } from '../../types/canvas';

describe('Text Tool Integration', () => {
  beforeEach(() => {
    HTMLDivElement.prototype.setPointerCapture = vi.fn();
    HTMLDivElement.prototype.releasePointerCapture = vi.fn();

    useDocumentStore.setState({
      elements: {},
      elementIds: [],
      selectedIds: [],
    });

    useCameraStore.setState({
      camera: { x: 0, y: 0, zoom: 1.0 },
      viewportWidth: 1000,
      viewportHeight: 800,
    });

    useToolStore.setState({
      currentTool: 'text',
      color: '#0284c7',
      fontSize: 24,
      editingText: null,
    });
  });

  it('keeps textarea open on mouse click so user can type and commit', async () => {
    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-viewport');

    // User left-clicks on canvas at (300, 200)
    fireEvent.pointerDown(canvasContainer, {
      clientX: 300,
      clientY: 200,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 300, clientY: 200, pointerId: 1 });

    // Textarea remains mounted and ready for input
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(useToolStore.getState().editingText).not.toBeNull();

    // User types text
    fireEvent.change(textarea, { target: { value: 'Typing on canvas works!' } });
    expect(textarea.value).toBe('Typing on canvas works!');

    // User presses Escape to commit
    fireEvent.keyDown(textarea, { key: 'Escape' });

    // Editor closes and element is saved to document
    expect(useToolStore.getState().editingText).toBeNull();
    expect(document.querySelector('textarea')).toBeNull();

    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const textEl = doc.elements[doc.elementIds[0]] as TextElement;
    expect(textEl.type).toBe('text');
    expect(textEl.text).toBe('Typing on canvas works!');
    expect(textEl.fontFamily).toBe('handwritten');
  });

  it('allows user to select Code font family before typing and saves it on commit', async () => {
    render(<App />);

    // Click 'Code' button in StyleInspector
    const codeBtn = screen.getByText('Code');
    fireEvent.click(codeBtn);
    expect(useToolStore.getState().fontFamily).toBe('code');

    const canvasContainer = screen.getByTestId('canvas-viewport');

    fireEvent.pointerDown(canvasContainer, {
      clientX: 250,
      clientY: 150,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 250, clientY: 150, pointerId: 1 });

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(textarea.style.fontFamily).toContain('monospace');

    fireEvent.change(textarea, { target: { value: 'const x = 42;' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });

    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const textEl = doc.elements[doc.elementIds[0]] as TextElement;
    expect(textEl.text).toBe('const x = 42;');
    expect(textEl.fontFamily).toBe('code');
  });

  it('allows user to switch font family while editing text draft', async () => {
    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-viewport');

    fireEvent.pointerDown(canvasContainer, {
      clientX: 200,
      clientY: 100,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 200, clientY: 100, pointerId: 1 });

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Draft with normal font' } });

    // Click 'Normal' font button while editing
    const normalBtn = screen.getByText('Normal');
    fireEvent.click(normalBtn);
    expect(useToolStore.getState().fontFamily).toBe('normal');
    expect(textarea.style.fontFamily).toContain('system-ui');

    fireEvent.keyDown(textarea, { key: 'Escape' });

    const doc = useDocumentStore.getState();
    const textEl = doc.elements[doc.elementIds[0]] as TextElement;
    expect(textEl.fontFamily).toBe('normal');
  });

  it('sets tool settings when selecting an existing text element with select tool', async () => {
    const textEl: TextElement = {
      id: 'existing_txt',
      type: 'text',
      x: 300,
      y: 200,
      width: 150,
      height: 40,
      zIndex: 1,
      text: 'Existing Text',
      fontSize: 36,
      fontFamily: 'code',
      color: '#e11d48',
      lineHeight: 1.25,
    };

    useDocumentStore.setState({
      elements: { existing_txt: textEl },
      elementIds: ['existing_txt'],
      selectedIds: [],
    });

    useToolStore.setState({
      currentTool: 'select',
      color: '#000000',
      fontSize: 16,
      fontFamily: 'handwritten',
    });

    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-viewport');

    // Click on the text element at (320, 210)
    fireEvent.pointerDown(canvasContainer, {
      clientX: 320,
      clientY: 210,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 320, clientY: 210, pointerId: 1 });

    expect(useDocumentStore.getState().selectedIds).toEqual(['existing_txt']);
    expect(useToolStore.getState().fontSize).toBe(36);
    expect(useToolStore.getState().fontFamily).toBe('code');
    expect(useToolStore.getState().color).toBe('#e11d48');

    // StyleInspector is visible and displays these settings
    expect(screen.getByText('Font')).toBeTruthy();
    expect(screen.getByText('Code')).toBeTruthy();
  });

  it('commits and saves typed text when clicking outside on canvas, selects it, and sets tool to select', async () => {
    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-viewport');

    // Click on canvas with text tool to start typing at (300, 200)
    fireEvent.pointerDown(canvasContainer, {
      clientX: 300,
      clientY: 200,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 300, clientY: 200, pointerId: 1 });

    const textarea = screen.getByTestId('text-editor-input') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();

    // Type text
    fireEvent.change(textarea, { target: { value: 'Saving on outside click' } });
    expect(textarea.value).toBe('Saving on outside click');

    // Click outside on canvas at (600, 600)
    fireEvent.pointerDown(canvasContainer, {
      clientX: 600,
      clientY: 600,
      pointerId: 2,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 600, clientY: 600, pointerId: 2 });

    // Text editor overlay should be closed
    expect(useToolStore.getState().editingText).toBeNull();
    expect(screen.queryByTestId('text-editor-input')).toBeNull();

    // Tool should switch to select
    expect(useToolStore.getState().currentTool).toBe('select');

    // Document store should have saved the text element
    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const newId = doc.elementIds[0];
    const textEl = doc.elements[newId] as TextElement;
    expect(textEl).toBeDefined();
    expect(textEl.text).toBe('Saving on outside click');

    // Element should be selected
    expect(doc.selectedIds).toEqual([newId]);
  });

  it('commits and updates existing text when clicking outside on canvas', async () => {
    const textEl: TextElement = {
      id: 'editable_txt',
      type: 'text',
      x: 100,
      y: 100,
      width: 120,
      height: 30,
      zIndex: 1,
      text: 'Original Text',
      fontSize: 24,
      fontFamily: 'normal',
      color: '#0284c7',
      lineHeight: 1.25,
    };

    useDocumentStore.setState({
      elements: { editable_txt: textEl },
      elementIds: ['editable_txt'],
      selectedIds: [],
    });

    useToolStore.setState({
      currentTool: 'select',
      color: '#0284c7',
      fontSize: 24,
      fontFamily: 'normal',
    });

    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-viewport');

    // Double-click on text element at (110, 110)
    fireEvent.doubleClick(canvasContainer, { clientX: 110, clientY: 110 });

    const textarea = screen.getByTestId('text-editor-input') as HTMLTextAreaElement;
    expect(textarea).not.toBeNull();
    expect(useToolStore.getState().editingText?.elementId).toBe('editable_txt');

    // Update text
    fireEvent.change(textarea, { target: { value: 'Updated Existing Text' } });

    // Click outside on canvas at (500, 500)
    fireEvent.pointerDown(canvasContainer, {
      clientX: 500,
      clientY: 500,
      pointerId: 1,
      buttons: 1,
    });

    // Editor closed and element updated
    expect(useToolStore.getState().editingText).toBeNull();
    const doc = useDocumentStore.getState();
    const updated = doc.elements['editable_txt'] as TextElement;
    expect(updated.text).toBe('Updated Existing Text');
    expect(doc.selectedIds).toEqual(['editable_txt']);
  });

  it('does not display previous text when opening a new text input after saving previous text', async () => {
    render(<App />);

    const canvasContainer = screen.getByTestId('canvas-viewport');

    // 1. First text input
    fireEvent.pointerDown(canvasContainer, {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 100, clientY: 100, pointerId: 1 });

    const firstTextarea = screen.getByTestId('text-editor-input') as HTMLTextAreaElement;
    expect(firstTextarea.value).toBe('');

    fireEvent.change(firstTextarea, { target: { value: 'First text message' } });
    expect(firstTextarea.value).toBe('First text message');

    // Save by pressing Escape
    fireEvent.keyDown(firstTextarea, { key: 'Escape' });
    expect(useToolStore.getState().editingText).toBeNull();
    expect(screen.queryByTestId('text-editor-input')).toBeNull();

    // 2. Switch back to text tool and create second text input
    useToolStore.getState().setTool('text');

    fireEvent.pointerDown(canvasContainer, {
      clientX: 300,
      clientY: 300,
      pointerId: 2,
      buttons: 1,
    });
    fireEvent.pointerUp(canvasContainer, { clientX: 300, clientY: 300, pointerId: 2 });

    // The newly opened textarea MUST be immediately empty without flickering previous text
    const secondTextarea = screen.getByTestId('text-editor-input') as HTMLTextAreaElement;
    expect(secondTextarea).not.toBeNull();
    expect(secondTextarea.value).toBe('');
    expect(secondTextarea.value).not.toBe('First text message');
  });
});
