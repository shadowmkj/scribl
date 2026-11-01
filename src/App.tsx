import React, { useEffect, useRef } from 'react';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { ConfigErrorToast } from './components/ui/ConfigErrorToast';
import { FloatingDock } from './components/ui/FloatingDock';
import { StyleInspector } from './components/ui/StyleInspector';
import { TopHeader } from './components/ui/TopHeader';
import { ZoomHUD } from './components/ui/ZoomHUD';
import { registerDefaultCommands } from './core/commands/CommandRegistry';
import {
  handleGlobalBlur,
  handleGlobalKeyDown,
  handleGlobalKeyUp,
  keybindingEngine,
} from './core/input/keyboardShortcuts';
import { restoreAutoSave, setupAutoSave } from './core/persistence/autoSave';
import {
  exportToPng,
  parseScriblJSON,
  serializeScriblDoc,
  triggerDownload,
} from './core/persistence/fileIO';
import { useCameraStore } from './stores/useCameraStore';
import { ScriblConfig, useConfigStore } from './stores/useConfigStore';
import { useDocumentStore } from './stores/useDocumentStore';
import { useToolStore } from './stores/useToolStore';
import './App.css';

export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    restoreAutoSave();
    setupAutoSave();
  }, []);

  // Initialize and sync Lua configuration
  useEffect(() => {
    const configStore = useConfigStore.getState();
    configStore.loadConfig().then(() => {
      const current = useConfigStore.getState().config;
      keybindingEngine.registerKeymaps(current.keymaps);
      if (current.options.default_tool) {
        useToolStore.getState().setTool(current.options.default_tool as any);
      }
      if (current.options.zoom_mode) {
        useToolStore.getState().setZoomMode(current.options.zoom_mode as any);
      }
    });

    let unlistenReload: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<ScriblConfig>('scribl:config-reloaded', (event) => {
        const config = event.payload;
        useConfigStore.getState().setConfig(config);
        keybindingEngine.registerKeymaps(config.keymaps);
        if (config.options.zoom_mode) {
          useToolStore.getState().setZoomMode(config.options.zoom_mode as any);
        }
      }).then((unsub) => {
        unlistenReload = unsub;
      }).catch(() => {});

      listen<string>('scribl:config-error', (event) => {
        useConfigStore.getState().setError(event.payload);
      }).then((unsub) => {
        unlistenError = unsub;
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      unlistenReload?.();
      unlistenError?.();
    };
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

  // Wire command handlers
  useEffect(() => {
    registerDefaultCommands({
      onSave: handleSave,
      onOpen: handleOpenClick,
      onExportPng: handleExportPNG,
      onClear: () => useDocumentStore.getState().clearDocument(),
    });
  }, []);

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
      <ConfigErrorToast />
      <StyleInspector />
      <CanvasViewport />
      <FloatingDock />
      <ZoomHUD />
    </div>
  );
}

export default App;
