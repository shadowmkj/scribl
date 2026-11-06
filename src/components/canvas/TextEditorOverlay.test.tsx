import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCameraStore } from '../../stores/useCameraStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { TextElement } from '../../types/canvas';
import { TextEditorOverlay } from './TextEditorOverlay';

describe('TextEditorOverlay', () => {
  beforeEach(() => {
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

  it('renders nothing when editingText is null', () => {
    const { container } = render(<TextEditorOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('renders textarea with screen coordinates and auto-focuses when editingText is set', () => {
    useToolStore.setState({
      editingText: {
        x: 100,
        y: 100,
        text: 'Initial',
        fontSize: 24,
        color: '#0284c7',
      },
    });

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe('Initial');
  });

  it('stops keyboard propagation on typing', () => {
    useToolStore.setState({
      editingText: {
        x: 0,
        y: 0,
        text: '',
        fontSize: 24,
        color: '#ffffff',
      },
    });

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole('textbox');

    const keyEvent = new KeyboardEvent('keydown', { key: 'p', bubbles: true });
    const stopPropagationSpy = vi.spyOn(keyEvent, 'stopPropagation');
    textarea.dispatchEvent(keyEvent);

    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('commits non-empty new text on Escape, adds TextElement and switches to select tool', () => {
    useToolStore.setState({
      editingText: {
        x: 50,
        y: 60,
        text: '',
        fontSize: 24,
        color: '#0284c7',
      },
    });

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: 'Hello Scribl' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });

    // Should have closed overlay
    expect(useToolStore.getState().editingText).toBeNull();

    // Should have created element
    const doc = useDocumentStore.getState();
    expect(doc.elementIds.length).toBe(1);
    const el = doc.elements[doc.elementIds[0]] as TextElement;
    expect(el.type).toBe('text');
    expect(el.text).toBe('Hello Scribl');
    expect(el.x).toBe(50);
    expect(el.y).toBe(60);

    // Should have switched tool to select and selected new element
    expect(useToolStore.getState().currentTool).toBe('select');
    expect(doc.selectedIds).toEqual([el.id]);
  });

  it('discards empty text on Escape without creating an element', () => {
    useToolStore.setState({
      editingText: {
        x: 50,
        y: 60,
        text: '',
        fontSize: 24,
        color: '#0284c7',
      },
    });

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole('textbox');

    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });

    expect(useToolStore.getState().editingText).toBeNull();
    expect(useDocumentStore.getState().elementIds.length).toBe(0);
  });

  it('inserts 2 spaces on Tab keydown instead of default browser focus navigation', () => {
    useToolStore.setState({
      editingText: {
        x: 50,
        y: 60,
        text: 'hello',
        fontSize: 24,
        color: '#0284c7',
      },
    });

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    // Place cursor between 'he' and 'llo'
    textarea.setSelectionRange(2, 2);

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(tabEvent, 'preventDefault');

    act(() => {
      textarea.dispatchEvent(tabEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(textarea.value).toBe('he  llo');
    expect(useToolStore.getState().editingText?.text).toBe('he  llo');
  });

  it('indents multiple lines on Tab and unindents on Shift+Tab', () => {
    useToolStore.setState({
      editingText: {
        x: 50,
        y: 60,
        text: 'line 1\nline 2',
        fontSize: 24,
        color: '#0284c7',
      },
    });

    render(<TextEditorOverlay />);
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

    // Select across both lines
    textarea.setSelectionRange(0, 13);

    // Tab -> Indent both lines
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      textarea.dispatchEvent(tabEvent);
    });

    expect(textarea.value).toBe('  line 1\n  line 2');

    // Shift+Tab -> Unindent both lines
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      textarea.dispatchEvent(shiftTabEvent);
    });

    expect(textarea.value).toBe('line 1\nline 2');
  });
});
