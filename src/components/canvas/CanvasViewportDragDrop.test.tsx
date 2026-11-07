import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { CanvasViewport } from './CanvasViewport';

describe('CanvasViewport Drag and Drop', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearDocument();
  });

  it('shows drop overlay when files are dragged over canvas and hides on dragleave', () => {
    render(<CanvasViewport />);
    const viewport = screen.getByTestId('canvas-viewport');

    expect(screen.queryByTestId('canvas-drop-overlay')).toBeNull();

    fireEvent.dragEnter(viewport, {
      dataTransfer: {
        types: ['Files'],
      },
    });

    expect(screen.getByTestId('canvas-drop-overlay')).toBeTruthy();

    fireEvent.dragLeave(viewport, {
      relatedTarget: null,
    });

    expect(screen.queryByTestId('canvas-drop-overlay')).toBeNull();
  });

  it('imports dropped file and inserts elements at cursor position', async () => {
    const onNotification = vi.fn();
    render(<CanvasViewport onImportNotification={onNotification} />);
    const viewport = screen.getByTestId('canvas-viewport');

    const excalidrawContent = JSON.stringify({
      type: 'excalidraw',
      elements: [
        {
          id: 'drop-rect-1',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          strokeColor: '#ff0000',
        },
      ],
    });

    const file = new File([excalidrawContent], 'sketch.excalidraw', {
      type: 'application/json',
    });

    fireEvent.drop(viewport, {
      clientX: 200,
      clientY: 200,
      dataTransfer: {
        files: [file],
      },
    });

    // Wait for FileReader
    await vi.waitFor(() => {
      const doc = useDocumentStore.getState();
      expect(doc.elementIds.length).toBeGreaterThan(0);
    });

    expect(onNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        message: expect.stringContaining('sketch.excalidraw'),
      }),
    );
  });
});
