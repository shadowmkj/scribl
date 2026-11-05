import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConfigStore } from '../../stores/useConfigStore';
import { SettingsModal } from './SettingsModal';

describe('SettingsModal', () => {
  beforeEach(() => {
    useConfigStore.setState({
      isSettingsOpen: false,
      activeSettingsTab: 'general',
      config: {
        options: {
          dot_grid: true,
          default_tool: 'pen',
          zoom_mode: 'scrubby',
          stroke_smoothing: 0.5,
          stroke_thinning: 0.6,
          auto_save: true,
          default_pen_color: '#0284c7',
        },
        keymaps: [
          { mode: 'n', lhs: 'p', rhs: 'tool.pen', desc: 'Pen Tool' },
          { mode: 'n', lhs: '<D-,>', rhs: 'app.settings', desc: 'Open Settings' },
        ],
        toolbar: {
          position: 'bottom',
          items: ['select', 'pen'],
        },
        theme: {
          name: 'default-dark',
          overrides: {},
        },
      },
    });
  });

  it('does not render when isSettingsOpen is false', () => {
    render(<SettingsModal />);
    expect(screen.queryByText('Preferences')).toBeNull();
  });

  it('renders modal when openSettings() is called', () => {
    useConfigStore.getState().openSettings();
    render(<SettingsModal />);

    expect(screen.getByText('Preferences')).toBeTruthy();
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('Inking')).toBeTruthy();
    expect(screen.getByText('Theme')).toBeTruthy();
    expect(screen.getByText('Keybindings')).toBeTruthy();
    expect(screen.getByText('Toolbar')).toBeTruthy();
    expect(screen.getByText('Lua Config')).toBeTruthy();
  });

  it('switches tabs on tab button click', () => {
    useConfigStore.getState().openSettings();
    render(<SettingsModal />);

    // Click Keybindings tab
    fireEvent.click(screen.getByText('Keybindings'));
    expect(useConfigStore.getState().activeSettingsTab).toBe('keybindings');
    expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();

    // Click Inking tab
    fireEvent.click(screen.getByText('Inking'));
    expect(useConfigStore.getState().activeSettingsTab).toBe('inking');
    expect(screen.getByText('Inking & Stroke Dynamics')).toBeTruthy();
  });

  it('closes on Escape key press', () => {
    useConfigStore.getState().openSettings();
    render(<SettingsModal />);

    expect(useConfigStore.getState().isSettingsOpen).toBe(true);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useConfigStore.getState().isSettingsOpen).toBe(false);
  });

  it('toggles dot grid setting', () => {
    useConfigStore.getState().openSettings('general');
    render(<SettingsModal />);

    const switchBtn = screen.getByRole('switch', { name: 'Toggle dot grid' });
    expect(useConfigStore.getState().config.options.dot_grid).toBe(true);

    fireEvent.click(switchBtn);
    expect(useConfigStore.getState().config.options.dot_grid).toBe(false);
  });

  it('displays release version in sidebar footer', () => {
    useConfigStore.setState({ appVersion: '0.1.0' });
    useConfigStore.getState().openSettings();
    render(<SettingsModal />);

    const footer = screen.getByTestId('settings-version-footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('v0.1.0');
  });

  it('displays development version with git hash in sidebar footer', () => {
    useConfigStore.setState({ appVersion: '0.1.0+9a7a796' });
    useConfigStore.getState().openSettings();
    render(<SettingsModal />);

    const footer = screen.getByTestId('settings-version-footer');
    expect(footer).toBeTruthy();
    expect(footer.textContent).toContain('v0.1.0+9a7a796');
  });

  it('does not render sidebar footer when appVersion is null', () => {
    useConfigStore.setState({ appVersion: null });
    useConfigStore.getState().openSettings();
    render(<SettingsModal />);

    expect(screen.queryByTestId('settings-version-footer')).toBeNull();
  });
});
