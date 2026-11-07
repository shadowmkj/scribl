import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('calls revealThemesFolder when clicking Open Themes Folder', () => {
    const mockReveal = vi.fn();
    useConfigStore.setState({
      revealThemesFolder: mockReveal,
    });
    render(<ThemeTab />);
    const buttons = screen.getAllByRole('button', { name: /Open Themes Folder/i });
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(mockReveal).toHaveBeenCalled();
  });

  it('renders custom themes and allows selecting one', () => {
    const customNord = {
      mode: 'dark' as const,
      canvas_bg: '#2e3440',
      grid_dot: '#434c5e',
      panel_bg: 'rgba(46, 52, 64, 0.88)',
      panel_border: 'rgba(216, 222, 233, 0.12)',
      panel_shadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
      text_primary: '#eceff4',
      text_secondary: '#d8dee9',
      text_disabled: '#4c566a',
      accent: '#88c0d0',
      accent_hover: '#81a1c1',
      accent_light: '#8fbcbb',
      selection_stroke: '#88c0d0',
      selection_fill: 'rgba(136, 192, 208, 0.15)',
      danger: '#bf616a',
    };

    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        custom_themes: {
          nord: customNord,
        },
      },
    });

    render(<ThemeTab />);
    expect(screen.getByText('Nord')).toBeTruthy();
    expect(screen.getAllByText('Custom').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Nord'));
    const currentConfig = useConfigStore.getState().config;
    expect(currentConfig.theme.name).toBe('nord');
  });
});
