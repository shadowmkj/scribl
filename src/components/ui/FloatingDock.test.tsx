import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, useConfigStore } from '../../stores/useConfigStore';
import { useToolStore } from '../../stores/useToolStore';
import { FloatingDock } from './FloatingDock';

describe('FloatingDock', () => {
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
          items: [
            'select',
            'pen',
            'eraser',
            'shapes',
            'text',
            'zoom',
            '|',
            'undo',
            'redo',
            '|',
            'clear',
          ],
        },
      },
    });

    useToolStore.setState({
      currentTool: 'pen',
      activeShapeTool: 'rectangle',
      isShapesFlyoutOpen: false,
    });
  });

  it('renders Text tool button in the floating dock', () => {
    render(<FloatingDock />);
    expect(screen.getByTitle(/Text/)).toBeTruthy();
  });

  it('activates text tool on click', () => {
    render(<FloatingDock />);
    const textBtn = screen.getByTitle(/Text/);
    fireEvent.click(textBtn);
    expect(useToolStore.getState().currentTool).toBe('text');
  });

  it('renders primary tools, actions, and the shapes group button', () => {
    render(<FloatingDock />);

    expect(screen.getByTitle(/Select/)).toBeTruthy();
    expect(screen.getByTitle(/Pen/)).toBeTruthy();
    expect(screen.getByTitle(/Eraser/)).toBeTruthy();
    expect(screen.getByTitle(/Text/)).toBeTruthy();
    expect(screen.getByTitle(/Zoom/)).toBeTruthy();
    expect(screen.getByTitle(/Rectangle \(Shapes\)/)).toBeTruthy();
    expect(screen.getByTitle('Browse Shapes')).toBeTruthy();
    expect(screen.getByTitle(/Undo/)).toBeTruthy();
    expect(screen.getByTitle(/Redo/)).toBeTruthy();
    expect(screen.getByTitle(/Clear/)).toBeTruthy();
  });

  it('clicking shapes button activates active shape tool', () => {
    render(<FloatingDock />);

    const shapesBtn = screen.getByTitle(/Rectangle \(Shapes\)/);
    fireEvent.click(shapesBtn);

    expect(useToolStore.getState().currentTool).toBe('rectangle');
  });

  it('clicking shapes button twice toggles the shapes flyout', () => {
    render(<FloatingDock />);

    const shapesBtn = screen.getByTitle(/Rectangle \(Shapes\)/);
    // 1st click: selects rectangle
    fireEvent.click(shapesBtn);
    expect(useToolStore.getState().currentTool).toBe('rectangle');
    expect(useToolStore.getState().isShapesFlyoutOpen).toBe(false);

    // 2nd click (already on rectangle): opens shapes flyout
    fireEvent.click(shapesBtn);
    expect(useToolStore.getState().isShapesFlyoutOpen).toBe(true);
    expect(screen.getByTitle(/Circle/)).toBeTruthy();

    // 3rd click: closes shapes flyout
    fireEvent.click(shapesBtn);
    expect(useToolStore.getState().isShapesFlyoutOpen).toBe(false);
  });

  it('clicking chevron button opens flyout drawer with all shapes', () => {
    render(<FloatingDock />);

    const browseBtn = screen.getByTitle('Browse Shapes');
    fireEvent.click(browseBtn);

    expect(screen.getByTitle(/Circle/)).toBeTruthy();
    expect(screen.getByTitle(/Diamond/)).toBeTruthy();
    expect(screen.getByTitle(/Line/)).toBeTruthy();
    expect(screen.getByTitle(/Arrow/)).toBeTruthy();
  });

  it('selecting a shape in the flyout updates tool and last-used shape memory', () => {
    render(<FloatingDock />);

    // Open flyout
    fireEvent.click(screen.getByTitle('Browse Shapes'));

    // Select circle
    const circleBtn = screen.getByTitle('Circle');
    fireEvent.click(circleBtn);

    expect(useToolStore.getState().currentTool).toBe('circle');
    expect(useToolStore.getState().activeShapeTool).toBe('circle');

    // Flyout should close after selection
    expect(screen.queryByTitle('Diamond')).toBeNull();

    // Group button should now show Circle (Shapes)
    expect(screen.getByTitle(/Circle \(Shapes\)/)).toBeTruthy();
  });

  it('renders standalone shape if directly pinned in items', () => {
    useConfigStore.setState({
      config: {
        ...DEFAULT_CONFIG,
        toolbar: {
          position: 'bottom',
          items: ['select', 'pen', 'rectangle', 'clear'],
        },
      },
    });

    render(<FloatingDock />);
    expect(screen.getByTitle(/Rectangle/)).toBeTruthy();
  });
});
