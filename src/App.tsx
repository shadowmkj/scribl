import React, { useEffect, useRef } from 'react';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { FloatingDock } from './components/ui/FloatingDock';
import { StyleInspector } from './components/ui/StyleInspector';
import { ZoomHUD } from './components/ui/ZoomHUD';
import { TopHeader } from './components/ui/TopHeader';
import { useDocumentStore } from './stores/useDocumentStore';
import { useToolStore } from './stores/useToolStore';
import { useCameraStore } from './stores/useCameraStore';
import { setupAutoSave, restoreAutoSave } from './core/persistence/autoSave';
import { serializeScriblDoc, triggerDownload, exportToPng, parseScriblJSON } from './core/persistence/fileIO';
import './App.css';

export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    restoreAutoSave();
    setupAutoSave();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useDocumentStore.getState().redo();
        } else {
          useDocumentStore.getState().undo();
        }
      } else if (cmdKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useDocumentStore.getState().redo();
      } else if (e.key.toLowerCase() === 'v' || e.key === '1') {
        useToolStore.getState().setTool('select');
      } else if (e.key.toLowerCase() === 'p' || e.key === '2') {
        useToolStore.getState().setTool('pen');
      } else if (e.key.toLowerCase() === 'e' || e.key === '3') {
        useToolStore.getState().setTool('eraser');
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        useDocumentStore.getState().deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = () => {
    const doc = useDocumentStore.getState();
    const camera = useCameraStore.getState().camera;
    const json = serializeScriblDoc(doc.elements, doc.elementIds, camera);
    triggerDownload(json, 'drawing.scribl', 'application/json');
  };

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = parseScriblJSON(text);
        useDocumentStore.getState().loadDocument({
          elements: data.elements,
          elementIds: data.elementIds,
        });
        if (data.camera) {
          useCameraStore.getState().setPan(data.camera.x, data.camera.y);
          useCameraStore.getState().zoomAt(0, 0, data.camera.zoom);
        }
      } catch (err) {
        alert('Failed to load file: ' + err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPNG = async () => {
    try {
      const doc = useDocumentStore.getState();
      const dataUrl = await exportToPng(doc.elements, doc.elementIds);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'drawing.png';
      a.click();
    } catch (err) {
      alert('Cannot export: ' + (err as Error).message);
    }
  };

  return (
    <div className="scribl-app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".scribl,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <TopHeader onSave={handleSave} onOpen={handleOpenClick} onExportPNG={handleExportPNG} />
      <StyleInspector />
      <CanvasViewport />
      <FloatingDock />
      <ZoomHUD />
    </div>
  );
}

export default App;
