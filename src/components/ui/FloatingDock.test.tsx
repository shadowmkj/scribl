import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToolStore } from '../../stores/useToolStore';
import { FloatingDock } from './FloatingDock';

describe('FloatingDock - Text Tool', () => {
  beforeEach(() => {
    useToolStore.setState({
      currentTool: 'pen',
    });
  });

  it('renders Text tool button in the floating dock', () => {
    render(<FloatingDock />);
    expect(screen.getByTitle(/Text/)).toBeTruthy();
  });

  it('activates text tool on click', () => {
    render(<FloatingDock />);
    const textBtn = screen.getByTitle(/Text/);
    fireEvent.click(textBtn);
    expect(useToolStore.getState().currentTool).toBe('text');
  });
});
