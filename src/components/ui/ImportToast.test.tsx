import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImportNotification, ImportToast } from './ImportToast';

describe('ImportToast', () => {
  it('renders nothing when notification is null', () => {
    const { container } = render(<ImportToast notification={null} onDismiss={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders warning notification with message and details', () => {
    const notif: ImportNotification = {
      id: '1',
      type: 'warning',
      message: 'Imported 42 elements from board.tldr',
      details: '3 unsupported items (note, image) were discarded.',
    };

    render(<ImportToast notification={notif} onDismiss={vi.fn()} />);
    expect(screen.getByText('Imported 42 elements from board.tldr')).toBeTruthy();
    expect(screen.getByText('3 unsupported items (note, image) were discarded.')).toBeTruthy();
  });

  it('calls onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    const notif: ImportNotification = {
      id: '2',
      type: 'success',
      message: 'Imported successfully',
    };

    render(<ImportToast notification={notif} onDismiss={onDismiss} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalled();
  });
});
