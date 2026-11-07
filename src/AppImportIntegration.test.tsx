import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { useCameraStore } from './stores/useCameraStore';
import { useDocumentStore } from './stores/useDocumentStore';

describe('App Import Integration', () => {
  beforeEach(() => {
    useDocumentStore.getState().clearDocument();
    useCameraStore.getState().setDimensions(800, 600);
  });

  it('imports Excalidraw file via file input, replaces document, and auto-frames camera', async () => {
    const { container } = render(<App />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toContain('.excalidraw');
    expect(fileInput.accept).toContain('.tldr');

    const excalidrawDoc = JSON.stringify({
      type: 'excalidraw',
      elements: [
        {
          id: 'excal-rect-1',
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          strokeColor: '#000000',
        },
      ],
    });

    const file = new File([excalidrawDoc], 'architecture.excalidraw', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await vi.waitFor(() => {
      const doc = useDocumentStore.getState();
      expect(doc.elements['excal-rect-1']).toBeDefined();
    });

    // Verify camera auto-framed to element bounds
    const camera = useCameraStore.getState().camera;
    expect(camera.x).toBe(200); // Center of x:100..300
    expect(camera.y).toBe(175); // Center of y:100..250
  });

  it('shows warning toast when importing file with discarded unsupported elements', async () => {
    const { container } = render(<App />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const tldrawDocWithNote = JSON.stringify({
      tldrawFileFormatVersion: 1,
      records: [
        {
          id: 'shape:rect1',
          typeName: 'shape',
          type: 'geo',
          x: 0,
          y: 0,
          props: { geo: 'rectangle' },
        },
        {
          id: 'shape:note1',
          typeName: 'shape',
          type: 'note',
          x: 100,
          y: 100,
          props: { text: 'sticky' },
        },
      ],
    });

    const file = new File([tldrawDocWithNote], 'notes.tldr', {
      type: 'application/json',
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await vi.waitFor(() => {
      expect(screen.getByText(/1 unsupported items \(note\) were discarded/i)).toBeTruthy();
    });
  });
});
