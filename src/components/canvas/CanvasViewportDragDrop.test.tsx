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

  it('imports dropped image file and creates an ImageElement', async () => {
    render(<CanvasViewport />);
    const viewport = screen.getByTestId('canvas-viewport');

    const imageFile = new File(['fake-png-binary-data'], 'test-image.png', {
      type: 'image/png',
    });

    fireEvent.drop(viewport, {
      clientX: 300,
      clientY: 300,
      dataTransfer: {
        files: [imageFile],
      },
    });

    await vi.waitFor(() => {
      const doc = useDocumentStore.getState();
      const imageEl = Object.values(doc.elements).find((el) => el.type === 'image');
      expect(imageEl).toBeDefined();
      expect(imageEl?.type).toBe('image');
      expect((imageEl as any)?.fileName).toBe('test-image.png');
    });
  });

  it('imports image, erases it, then imports another image', async () => {
    render(<CanvasViewport />);
    const viewport = screen.getByTestId('canvas-viewport');

    const file1 = new File(['fake-png-1'], 'image-1.png', { type: 'image/png' });
    fireEvent.drop(viewport, {
      clientX: 300,
      clientY: 300,
      dataTransfer: { files: [file1] },
    });

    let firstImageId = '';
    await vi.waitFor(() => {
      const doc = useDocumentStore.getState();
      const img = Object.values(doc.elements).find((el) => el.type === 'image');
      expect(img).toBeDefined();
      firstImageId = img!.id;
    });

    // Erase the first image
    useDocumentStore.getState().deleteElements([firstImageId]);
    expect(useDocumentStore.getState().elements[firstImageId]).toBeUndefined();

    // Now drop second image
    const file2 = new File(['fake-png-2'], 'image-2.png', { type: 'image/png' });
    fireEvent.drop(viewport, {
      clientX: 400,
      clientY: 400,
      dataTransfer: { files: [file2] },
    });

    await vi.waitFor(() => {
      const doc = useDocumentStore.getState();
      const img = Object.values(doc.elements).find((el) => (el as any).fileName === 'image-2.png');
      expect(img).toBeDefined();
    });
  });
});
