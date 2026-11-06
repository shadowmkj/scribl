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
});
