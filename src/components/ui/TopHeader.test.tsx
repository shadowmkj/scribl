import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isDevVersion, useConfigStore } from '../../stores/useConfigStore';
import { TopHeader } from './TopHeader';

describe('TopHeader', () => {
  beforeEach(() => {
    useConfigStore.setState({
      appVersion: null,
    });
  });

  it('renders Scribl brand text', () => {
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);
    expect(screen.getByText('Scribl')).toBeTruthy();
  });

  it('renders badge next to logo when version is a development version with git hash', () => {
    useConfigStore.setState({ appVersion: '0.1.0+9a7a796' });
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);

    const badge = screen.getByTestId('dev-version-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('v0.1.0+9a7a796');
  });

  it('does NOT render badge next to logo when version is a release version', () => {
    useConfigStore.setState({ appVersion: '0.1.0' });
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);

    expect(screen.queryByTestId('dev-version-badge')).toBeNull();
  });

  it('does NOT render badge next to logo when appVersion is null', () => {
    useConfigStore.setState({ appVersion: null });
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);

    expect(screen.queryByTestId('dev-version-badge')).toBeNull();
  });

  it('renders Copy PNG button when onCopyPNG is provided and handles click', () => {
    const onCopyPNG = vi.fn();
    render(
      <TopHeader
        onSave={vi.fn()}
        onOpen={vi.fn()}
        onExportPNG={vi.fn()}
        onCopyPNG={onCopyPNG}
      />,
    );

    const copyBtn = screen.getByText('Copy PNG');
    expect(copyBtn).toBeTruthy();
    copyBtn.click();
    expect(onCopyPNG).toHaveBeenCalledTimes(1);
  });
});

describe('isDevVersion', () => {
  it('correctly detects dev versions with git hash', () => {
    expect(isDevVersion('0.1.0+9a7a796')).toBe(true);
    expect(isDevVersion('1.0.0+abc1234')).toBe(true);
  });

  it('correctly detects release versions without hash', () => {
    expect(isDevVersion('0.1.0')).toBe(false);
    expect(isDevVersion('1.0.0')).toBe(false);
    expect(isDevVersion(null)).toBe(false);
    expect(isDevVersion(undefined)).toBe(false);
    expect(isDevVersion('')).toBe(false);
  });
});
