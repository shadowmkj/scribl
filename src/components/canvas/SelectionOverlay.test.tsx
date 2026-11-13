import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StrokeElement } from '../../types/canvas';
import { SelectionOverlay } from './SelectionOverlay';

describe('SelectionOverlay', () => {
  const elements: Record<string, StrokeElement> = {
    s1: {
      id: 's1',
      type: 'stroke',
      x: 10,
      y: 20,
      width: 40,
      height: 30,
      zIndex: 1,
      color: '#000',
      size: 2,
      thinning: 0.6,
      smoothing: 0.5,
      points: [],
    },
    s2: {
      id: 's2',
      type: 'stroke',
      x: 60,
      y: 80,
      width: 20,
      height: 20,
      zIndex: 2,
      color: '#000',
      size: 2,
      thinning: 0.6,
      smoothing: 0.5,
      points: [],
    },
  };

  it('renders exactly one unified bounding rectangle for multiple selected items', () => {
    const { container } = render(
      <SelectionOverlay
        elements={elements}
        selectedIds={['s1', 's2']}
        camera={{ x: 0, y: 0, zoom: 1 }}
        width={1000}
        height={800}
        marqueeBox={null}
      />,
    );

    const selectionBox = container.querySelector('[data-testid="unified-selection-box"]');
    expect(selectionBox).not.toBeNull();

    // 4 corner handles
    const handles = container.querySelectorAll('[data-testid^="handle-"]');
    expect(handles.length).toBe(4);
  });

  it('does not render selection box when selectedIds is empty', () => {
    const { container } = render(
      <SelectionOverlay
        elements={elements}
        selectedIds={[]}
        camera={{ x: 0, y: 0, zoom: 1 }}
        width={1000}
        height={800}
        marqueeBox={null}
      />,
    );

    const selectionBox = container.querySelector('[data-testid="unified-selection-box"]');
    expect(selectionBox).toBeNull();
  });

  it('does not render selection box when editingTextElementId matches the selected element', () => {
    const { container } = render(
      <SelectionOverlay
        elements={elements}
        selectedIds={['s1']}
        camera={{ x: 0, y: 0, zoom: 1 }}
        width={1000}
        height={800}
        marqueeBox={null}
        editingTextElementId='s1'
      />,
    );

    const selectionBox = container.querySelector('[data-testid="unified-selection-box"]');
    expect(selectionBox).toBeNull();
  });

  it('hides resize handles and renders lock badge when selected elements are locked', () => {
    const lockedElements: Record<string, StrokeElement> = {
      l1: {
        ...elements.s1,
        id: 'l1',
        locked: true,
      },
    };

    const { container } = render(
      <SelectionOverlay
        elements={lockedElements}
        selectedIds={['l1']}
        camera={{ x: 0, y: 0, zoom: 1 }}
        width={1000}
        height={800}
        marqueeBox={null}
      />,
    );

    const selectionBox = container.querySelector('[data-testid="unified-selection-box"]');
    expect(selectionBox).not.toBeNull();

    // Corner handles must NOT be rendered
    const handles = container.querySelectorAll('[data-testid^="handle-"]');
    expect(handles.length).toBe(0);

    // Lock badge must be rendered
    const lockBadge = container.querySelector('[data-testid="selection-lock-badge"]');
    expect(lockBadge).not.toBeNull();
  });

  it('does not render lock badge when selected elements are unlocked', () => {
    const { container } = render(
      <SelectionOverlay
        elements={elements}
        selectedIds={['s1']}
        camera={{ x: 0, y: 0, zoom: 1 }}
        width={1000}
        height={800}
        marqueeBox={null}
      />,
    );

    const handles = container.querySelectorAll('[data-testid^="handle-"]');
    expect(handles.length).toBe(4);

    const lockBadge = container.querySelector('[data-testid="selection-lock-badge"]');
    expect(lockBadge).toBeNull();
  });
});
