import React, { useEffect, useRef } from 'react';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { FloatingDock } from './components/ui/FloatingDock';
import { StyleInspector } from './components/ui/StyleInspector';
import { TopHeader } from './components/ui/TopHeader';
import { ZoomHUD } from './components/ui/ZoomHUD';
import {
  handleGlobalBlur,
  handleGlobalKeyDown,
  handleGlobalKeyUp,
} from './core/input/keyboardShortcuts';
import { restoreAutoSave, setupAutoSave } from './core/persistence/autoSave';
import {
  exportToPng,
  parseScriblJSON,
  serializeScriblDoc,
  triggerDownload,
} from './core/persistence/fileIO';
import { useCameraStore } from './stores/useCameraStore';
import { useDocumentStore } from './stores/useDocumentStore';
import './App.css';

export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    restoreAutoSave();
    setupAutoSave();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);
    window.addEventListener('blur', handleGlobalBlur);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
      window.removeEventListener('blur', handleGlobalBlur);
    };
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
    <div className='scribl-app'>
      <input
        ref={fileInputRef}
        type='file'
        accept='.scribl,application/json'
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
