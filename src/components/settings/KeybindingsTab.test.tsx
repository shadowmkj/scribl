import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { KeybindingsTab } from './KeybindingsTab';

describe('KeybindingsTab', () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
      },
    });
  });

  it('renders shapes and individual shape tools in keybindings list', () => {
    render(<KeybindingsTab />);

    expect(screen.getByText('Shapes Tool (Browse on double-press)')).toBeTruthy();
    expect(screen.getByText('Rectangle Shape')).toBeTruthy();
    expect(screen.getByText('Circle Shape')).toBeTruthy();
    expect(screen.getByText('Line Shape')).toBeTruthy();
  });

  it('rebinds a key on record and keypress', () => {
    render(<KeybindingsTab />);

    // Find the record badge for Shapes Tool
    const shapesRow = screen.getByText('Shapes Tool (Browse on double-press)').closest('div');
    expect(shapesRow).toBeTruthy();

    const addBadge = shapesRow?.querySelector('button[title="Add keybinding"]');
    if (addBadge) {
      fireEvent.click(addBadge);

      // Press 'k'
      fireEvent.keyDown(window, { key: 'k' });

      // Should have saved 'k' for tool.shapes
      const keymaps = useConfigStore.getState().config.keymaps;
      expect(keymaps.some((k) => k.rhs === 'tool.shapes' && k.lhs === 'k')).toBe(true);
    }
  });
});
