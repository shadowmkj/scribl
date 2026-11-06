import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { TextElement } from '../../types/canvas';
import { StyleInspector } from './StyleInspector';

describe('StyleInspector - Text Tool Styling', () => {
  beforeEach(() => {
    useToolStore.setState({
      currentTool: 'text',
      color: '#0284c7',
      fontSize: 24,
      fontFamily: 'handwritten',
    });
  });

  it('renders color swatches, font family, and font size buttons when text tool is active', () => {
    render(<StyleInspector />);

    expect(screen.getByText('Color')).toBeTruthy();
    expect(screen.getByText('Font')).toBeTruthy();
    expect(screen.getByText('Hand-Written')).toBeTruthy();
    expect(screen.getByText('Normal')).toBeTruthy();
    expect(screen.getByText('Code')).toBeTruthy();

    expect(screen.getByText('Font Size')).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByText('L')).toBeTruthy();
    expect(screen.getByText('XL')).toBeTruthy();
  });

  it('changes font family when clicking font family buttons', () => {
    render(<StyleInspector />);

    const codeBtn = screen.getByText('Code');
    fireEvent.click(codeBtn);
    expect(useToolStore.getState().fontFamily).toBe('code');

    const normalBtn = screen.getByText('Normal');
    fireEvent.click(normalBtn);
    expect(useToolStore.getState().fontFamily).toBe('normal');

    const handBtn = screen.getByText('Hand-Written');
    fireEvent.click(handBtn);
    expect(useToolStore.getState().fontFamily).toBe('handwritten');
  });

  it('changes font size when clicking font size buttons', () => {
    render(<StyleInspector />);

    const largeBtn = screen.getByText('L');
    fireEvent.click(largeBtn);

    expect(useToolStore.getState().fontSize).toBe(36);

    const smallBtn = screen.getByText('S');
    fireEvent.click(smallBtn);

    expect(useToolStore.getState().fontSize).toBe(16);
  });

  it('changes text color when clicking color swatch', () => {
    render(<StyleInspector />);

    const redSwatch = screen.getByTitle('Coral Red');
    fireEvent.click(redSwatch);

    expect(useToolStore.getState().color).toBe('#e11d48');
  });

  it('does not render when an unsupported tool like eraser is active', () => {
    useToolStore.setState({ currentTool: 'eraser' });
    const { container } = render(<StyleInspector />);
    expect(container.firstChild).toBeNull();
  });

  it('renders and updates selected text element styles when in select mode', () => {
    const textEl: TextElement = {
      id: 't_sel',
      type: 'text',
      x: 100,
      y: 100,
      width: 100,
      height: 30,
      zIndex: 1,
      text: 'Selected text element',
      fontSize: 24,
      fontFamily: 'normal',
      color: '#0284c7',
      lineHeight: 1.25,
    };

    useDocumentStore.setState({
      elements: { t_sel: textEl },
      elementIds: ['t_sel'],
      selectedIds: ['t_sel'],
    });

    useToolStore.setState({
      currentTool: 'select',
      color: '#0284c7',
      fontSize: 24,
      fontFamily: 'normal',
    });

    render(<StyleInspector />);

    // Inspector should be visible for selected text element
    expect(screen.getByText('Color')).toBeTruthy();
    expect(screen.getByText('Font')).toBeTruthy();
    expect(screen.getByText('Font Size')).toBeTruthy();

    // Changing font family updates the element in useDocumentStore
    const codeBtn = screen.getByText('Code');
    fireEvent.click(codeBtn);
    const updatedFontEl = useDocumentStore.getState().elements['t_sel'] as TextElement;
    expect(updatedFontEl.fontFamily).toBe('code');
    expect(useToolStore.getState().fontFamily).toBe('code');

    // Changing font size updates the element in useDocumentStore
    const xlBtn = screen.getByText('XL');
    fireEvent.click(xlBtn);
    const updatedSizeEl = useDocumentStore.getState().elements['t_sel'] as TextElement;
    expect(updatedSizeEl.fontSize).toBe(48);
    expect(useToolStore.getState().fontSize).toBe(48);

    // Changing color updates the element in useDocumentStore
    const redSwatch = screen.getByTitle('Coral Red');
    fireEvent.click(redSwatch);
    const updatedColorEl = useDocumentStore.getState().elements['t_sel'] as TextElement;
    expect(updatedColorEl.color).toBe('#e11d48');
    expect(useToolStore.getState().color).toBe('#e11d48');
  });

  it('does not render in select mode when nothing is selected', () => {
    useDocumentStore.setState({
      elements: {},
      elementIds: [],
      selectedIds: [],
    });
    useToolStore.setState({ currentTool: 'select' });
    const { container } = render(<StyleInspector />);
    expect(container.firstChild).toBeNull();
  });
});
