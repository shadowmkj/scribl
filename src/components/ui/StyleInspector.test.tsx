import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { ShapeElement } from '../../types/canvas';
import { StyleInspector } from './StyleInspector';

describe('StyleInspector', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearDocument();
    useToolStore.setState({
      currentTool: 'pen',
      color: '#0284c7',
      fillColor: 'transparent',
      strokeSize: 4,
      strokeStyle: 'solid',
    });
  });

  it('renders stroke and fill color controls when a shape tool is active', () => {
    useToolStore.getState().setTool('rectangle');
    render(<StyleInspector />);

    expect(screen.getByText('Stroke Color')).toBeTruthy();
    expect(screen.getByText('Fill Color')).toBeTruthy();
    expect(screen.getByTitle('Transparent / None')).toBeTruthy();
    expect(screen.getByText('Solid')).toBeTruthy();
    expect(screen.getByText('Dashed')).toBeTruthy();
    expect(screen.getByText('Dotted')).toBeTruthy();
  });

  it('updates fill color of selected shape when clicking a fill swatch', () => {
    const shape: ShapeElement = {
      id: 's1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      strokeColor: '#000',
      fillColor: 'transparent',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };

    useDocumentStore.setState({
      elementIds: ['s1'],
      selectedIds: ['s1'],
      elements: { s1: shape },
    });
    useToolStore.getState().setTool('select');

    render(<StyleInspector />);
    const skyBlueFill = screen.getByTestId('fill-swatch-#0284c7');
    fireEvent.click(skyBlueFill);

    const updated = useDocumentStore.getState().elements.s1 as ShapeElement;
    expect(updated.fillColor).toBe('#0284c7');
  });

  it('updates stroke style of selected shape when clicking stroke style button', () => {
    const shape: ShapeElement = {
      id: 's1',
      type: 'shape',
      shapeType: 'rectangle',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      zIndex: 1,
      strokeColor: '#000',
      fillColor: 'transparent',
      strokeWidth: 2,
      strokeStyle: 'solid',
    };

    useDocumentStore.setState({
      elementIds: ['s1'],
      selectedIds: ['s1'],
      elements: { s1: shape },
    });
    useToolStore.getState().setTool('select');

    render(<StyleInspector />);
    const dashedBtn = screen.getByText('Dashed');
    fireEvent.click(dashedBtn);

    const updated = useDocumentStore.getState().elements.s1 as ShapeElement;
    expect(updated.strokeStyle).toBe('dashed');
  });
});
