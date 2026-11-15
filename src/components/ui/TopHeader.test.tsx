import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getPreReleaseTag,
  isDevVersion,
  isPreReleaseVersion,
  useConfigStore,
} from '../../stores/useConfigStore';
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

  it('renders badge with BETA tag when version is a beta pre-release', () => {
    useConfigStore.setState({ appVersion: '0.1.2-beta.1' });
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);

    const badge = screen.getByTestId('dev-version-badge');
    expect(badge).toBeTruthy();
    expect(screen.getByTestId('prerelease-tag-badge').textContent).toBe('BETA');
    expect(badge.textContent).toContain('v0.1.2-beta.1');
  });

  it('renders badge with ALPHA tag when version is an alpha pre-release', () => {
    useConfigStore.setState({ appVersion: '0.1.2-alpha.2' });
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);

    const badge = screen.getByTestId('dev-version-badge');
    expect(badge).toBeTruthy();
    expect(screen.getByTestId('prerelease-tag-badge').textContent).toBe('ALPHA');
    expect(badge.textContent).toContain('v0.1.2-alpha.2');
  });

  it('renders badge with RC tag when version is a release candidate', () => {
    useConfigStore.setState({ appVersion: '0.1.2-rc.1' });
    render(<TopHeader onSave={vi.fn()} onOpen={vi.fn()} onExportPNG={vi.fn()} />);

    const badge = screen.getByTestId('dev-version-badge');
    expect(badge).toBeTruthy();
    expect(screen.getByTestId('prerelease-tag-badge').textContent).toBe('RC');
    expect(badge.textContent).toContain('v0.1.2-rc.1');
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

describe('isPreReleaseVersion and getPreReleaseTag', () => {
  it('correctly detects pre-release versions with hyphens or plus', () => {
    expect(isPreReleaseVersion('0.1.2-beta.1')).toBe(true);
    expect(isPreReleaseVersion('0.1.2-alpha.1')).toBe(true);
    expect(isPreReleaseVersion('0.1.2-rc.2')).toBe(true);
    expect(isPreReleaseVersion('0.1.2-preview')).toBe(true);
    expect(isPreReleaseVersion('0.1.0+9a7a796')).toBe(true);
  });

  it('correctly identifies stable release versions as non-pre-release', () => {
    expect(isPreReleaseVersion('0.1.0')).toBe(false);
    expect(isPreReleaseVersion('0.1.2')).toBe(false);
    expect(isPreReleaseVersion('1.0.0')).toBe(false);
    expect(isPreReleaseVersion(null)).toBe(false);
    expect(isPreReleaseVersion(undefined)).toBe(false);
    expect(isPreReleaseVersion('')).toBe(false);
  });

  it('extracts correct pre-release tags', () => {
    expect(getPreReleaseTag('0.1.2-beta.1')).toBe('BETA');
    expect(getPreReleaseTag('0.1.2-alpha.3')).toBe('ALPHA');
    expect(getPreReleaseTag('0.1.2-rc.1')).toBe('RC');
    expect(getPreReleaseTag('0.1.2-preview.1')).toBe('PREVIEW');
    expect(getPreReleaseTag('0.1.0+9a7a796')).toBe('DEV');
    expect(getPreReleaseTag('0.1.2')).toBeNull();
    expect(getPreReleaseTag('1.0.0')).toBeNull();
    expect(getPreReleaseTag(null)).toBeNull();
  });
});
