import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToolStore } from '../../stores/useToolStore';
import { StyleInspector } from './StyleInspector';

describe('StyleInspector - Text Tool Styling', () => {
  beforeEach(() => {
    useToolStore.setState({
      currentTool: 'text',
      color: '#0284c7',
      fontSize: 24,
    });
  });

  it('renders color swatches and font size buttons when text tool is active', () => {
    render(<StyleInspector />);

    expect(screen.getByText('Color')).toBeTruthy();
    expect(screen.getByText('Font Size')).toBeTruthy();
    expect(screen.getByText('S')).toBeTruthy();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.getByText('L')).toBeTruthy();
    expect(screen.getByText('XL')).toBeTruthy();
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
});
