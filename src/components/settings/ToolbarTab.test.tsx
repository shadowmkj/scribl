import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { ToolbarTab } from './ToolbarTab';

describe('ToolbarTab', () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        toolbar: {
          position: 'bottom',
          groups: {
            shapes: {
              label: 'Shapes',
              default: 'rectangle',
              items: ['rectangle', 'circle', 'diamond', 'line', 'arrow'],
            },
          },
          items: ['select', 'pen', 'shapes', 'text', 'zoom'],
        },
      },
    });
  });

  it('renders Text Tool option in toolbar items', () => {
    render(<ToolbarTab />);
    expect(screen.getByText('Text Tool')).toBeTruthy();
  });

  it('toggles Text Tool on and off in toolbar items', () => {
    render(<ToolbarTab />);
    const textToggle = screen.getByText('Text Tool');

    // Currently included in config
    expect(useConfigStore.getState().config.toolbar.items).toContain('text');

    // Toggle off
    fireEvent.click(textToggle);
    expect(useConfigStore.getState().config.toolbar.items).not.toContain('text');

    // Toggle back on
    fireEvent.click(textToggle);
    expect(useConfigStore.getState().config.toolbar.items).toContain('text');
  });

  it('renders all tool categories and descriptions', () => {
    render(<ToolbarTab />);

    expect(screen.getByText('Primary Tools')).toBeTruthy();
    expect(screen.getByText('Tool Groups & Flyouts')).toBeTruthy();
    expect(screen.getByText('Standalone Shapes')).toBeTruthy();
    expect(screen.getByText('Quick Actions')).toBeTruthy();

    expect(screen.getByText('Shapes Flyout')).toBeTruthy();
  });

  it('toggles item inclusion in toolbar.items', () => {
    render(<ToolbarTab />);

    const undoCheckbox = screen.getByLabelText(/Undo Action/);
    expect((undoCheckbox as HTMLInputElement).checked).toBe(false);

    fireEvent.click(undoCheckbox);

    expect(useConfigStore.getState().config.toolbar.items).toContain('undo');
  });

  it('changes dock position', () => {
    render(<ToolbarTab />);

    const topButton = screen.getByText('Top');
    fireEvent.click(topButton);

    expect(useConfigStore.getState().config.toolbar.position).toBe('top');
  });
});
