import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { ToolbarTab } from './ToolbarTab';

describe('ToolbarTab', () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    });
  });

  it('renders Text Tool option in toolbar items', () => {
    render(<ToolbarTab />);
    expect(screen.getByText('Text Tool')).toBeTruthy();
  });

  it('toggles Text Tool on and off in toolbar items', () => {
    render(<ToolbarTab />);
    const textToggle = screen.getByText('Text Tool');

    // Currently included in DEFAULT_CONFIG
    expect(useConfigStore.getState().config.toolbar.items).toContain('text');

    // Toggle off
    fireEvent.click(textToggle);
    expect(useConfigStore.getState().config.toolbar.items).not.toContain('text');

    // Toggle back on
    fireEvent.click(textToggle);
    expect(useConfigStore.getState().config.toolbar.items).toContain('text');
  });
});
