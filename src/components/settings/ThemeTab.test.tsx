import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { ThemeTab } from './ThemeTab';

describe('ThemeTab', () => {
  beforeEach(() => {
    useConfigStore.setState({ config: DEFAULT_CONFIG });
  });

  it('renders all 4 theme presets', () => {
    render(<ThemeTab />);
    expect(screen.getByText('Default Dark')).toBeTruthy();
    expect(screen.getByText('Light')).toBeTruthy();
    expect(screen.getByText('Tokyo Night')).toBeTruthy();
    expect(screen.getByText('Catppuccin')).toBeTruthy();
  });

  it('selects preset on click', () => {
    render(<ThemeTab />);
    fireEvent.click(screen.getByText('Tokyo Night'));
    const currentConfig = useConfigStore.getState().config;
    expect(currentConfig.theme.name).toBe('tokyo-night');
  });

  it('shows color override inputs and can edit an override', () => {
    render(<ThemeTab />);
    const canvasBgInput = screen.getByLabelText(/Canvas Background/i);
    expect(canvasBgInput).toBeTruthy();

    fireEvent.change(canvasBgInput, { target: { value: '#123456' } });
    const currentConfig = useConfigStore.getState().config;
    expect(currentConfig.theme.overrides['canvas_bg']).toBe('#123456');
  });

  it('resets overrides when clicking Reset to Defaults', () => {
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        theme: {
          name: 'default-dark',
          overrides: { canvas_bg: '#123456' },
        },
      },
    });

    render(<ThemeTab />);
    const resetBtn = screen.getByRole('button', { name: /Reset Overrides/i });
    fireEvent.click(resetBtn);

    const currentConfig = useConfigStore.getState().config;
    expect(Object.keys(currentConfig.theme.overrides).length).toBe(0);
  });
});
