import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { useToolStore } from '../../stores/useToolStore';
import { GeneralTab } from './GeneralTab';

describe('GeneralTab', () => {
  beforeEach(() => {
    useConfigStore.setState({ config: DEFAULT_CONFIG });
    useToolStore.setState({ color: '#0284c7' });
  });

  it('renders default tool and default pen color controls', () => {
    render(<GeneralTab />);
    expect(screen.getByText('Default Startup Tool')).toBeTruthy();
    expect(screen.getByText('Default Pen Color')).toBeTruthy();
  });

  it('updates default pen color when text input changes and syncs toolStore', () => {
    render(<GeneralTab />);
    const colorInput = screen.getByLabelText('Default Pen Color');
    fireEvent.change(colorInput, { target: { value: '#e11d48' } });

    expect(useConfigStore.getState().config.options.default_pen_color).toBe('#e11d48');
    expect(useToolStore.getState().color).toBe('#e11d48');
  });

  it('updates default pen color when clicking a preset swatch', () => {
    render(<GeneralTab />);
    const coralSwatch = screen.getByTitle('Coral Red');
    fireEvent.click(coralSwatch);

    expect(useConfigStore.getState().config.options.default_pen_color).toBe('#e11d48');
    expect(useToolStore.getState().color).toBe('#e11d48');
  });

  it('toggles select after create option', () => {
    render(<GeneralTab />);
    const toggle = screen.getByRole('switch', { name: /select element after creation/i });
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);
    expect(useConfigStore.getState().config.options.select_after_create).toBe(false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    fireEvent.click(toggle);
    expect(useConfigStore.getState().config.options.select_after_create).toBe(true);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});
