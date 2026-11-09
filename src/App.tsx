import React, { useEffect, useRef, useState } from 'react';
import { CanvasViewport } from './components/canvas/CanvasViewport';
import { TextEditorOverlay } from './components/canvas/TextEditorOverlay';
import { SettingsModal } from './components/settings/SettingsModal';
import { ConfigErrorToast } from './components/ui/ConfigErrorToast';
import { FloatingDock } from './components/ui/FloatingDock';
import { ImportNotification, ImportToast } from './components/ui/ImportToast';
import { StyleInspector } from './components/ui/StyleInspector';
import { TopHeader } from './components/ui/TopHeader';
import { ZoomHUD } from './components/ui/ZoomHUD';
import { calculateBoxFitCamera } from './core/camera/cameraMath';
import { copySelected, cutSelected, paste } from './core/clipboard/clipboard';
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
  importDrawingDocument,
  serializeScriblDoc,
  triggerDownload,
} from './core/persistence/fileIO';
import { applyThemeToDom, resolveTheme } from './core/theme/themeManager';
import { useCameraStore } from './stores/useCameraStore';
import { ScriblConfig, useConfigStore } from './stores/useConfigStore';
import { useDocumentStore } from './stores/useDocumentStore';
import { useToolStore } from './stores/useToolStore';
import { CanvasElement } from './types/canvas';
import './App.css';

export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<ImportNotification | null>(null);
  const theme = useConfigStore((state) => state.config.theme);

  // Apply theme to DOM
  useEffect(() => {
    if (theme) {
      const active = theme.active || resolveTheme(theme);
      applyThemeToDom(active);
    }
  }, [theme]);

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
      if (current.options.default_pen_color) {
        useToolStore.getState().setColor(current.options.default_pen_color);
      }
      if (current.options.zoom_mode) {
        useToolStore.getState().setZoomMode(current.options.zoom_mode as any);
      }
    });

    let unlistenReload: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;
    let unlistenOpenSettings: (() => void) | undefined;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<ScriblConfig>('scribl:config-reloaded', (event) => {
        const config = event.payload;
        useConfigStore.getState().setConfig(config);
        keybindingEngine.registerKeymaps(config.keymaps);
        if (config.options.default_pen_color) {
          useToolStore.getState().setColor(config.options.default_pen_color);
        }
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

      listen('scribl:open-settings', () => {
        useConfigStore.getState().openSettings();
      }).then((unsub) => {
        unlistenOpenSettings = unsub;
      }).catch(() => {});
    }).catch(() => {});

    return () => {
      unlistenReload?.();
      unlistenError?.();
      unlistenOpenSettings?.();
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

  // Native clipboard event listener (for macOS menu Edit > Copy / Paste / Cut)
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      copySelected();
    };

    const handleCut = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      cutSelected();
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      paste();
    };

    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
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

  const handleClear = () => {
    const doc = useDocumentStore.getState();
    if (doc.elementIds.length === 0) return;
    doc.clearDocument();
    const isMac = typeof navigator !== 'undefined'
      && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
    setImportNotification({
      id: `clear_${Date.now()}`,
      type: 'success',
      message: `Canvas cleared. Press ${isMac ? '⌘Z' : 'Ctrl+Z'} to undo.`,
    });
  };

  // Wire command handlers
  useEffect(() => {
    registerDefaultCommands({
      onSave: handleSave,
      onOpen: handleOpenClick,
      onExportPng: handleExportPNG,
      onClear: handleClear,
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importDrawingDocument(text, file.name);

        const elementsRecord: Record<string, CanvasElement> = {};
        for (const el of result.elements) {
          elementsRecord[el.id] = el;
        }

        useDocumentStore.getState().loadDocument({
          elements: elementsRecord,
          elementIds: result.elementIds,
        });

        // Camera auto-framing
        if (result.format === 'scribl') {
          try {
            const parsedScribl = JSON.parse(text);
            if (parsedScribl.camera) {
              useCameraStore.getState().setPan(parsedScribl.camera.x, parsedScribl.camera.y);
              useCameraStore.getState().zoomAt(0, 0, parsedScribl.camera.zoom);
            } else if (result.elements.length > 0) {
              const { viewportWidth, viewportHeight } = useCameraStore.getState();
              const fit = calculateBoxFitCamera(result.bounds, viewportWidth, viewportHeight, 0.85);
              useCameraStore.setState({ camera: fit });
            }
          } catch {
            if (result.elements.length > 0) {
              const { viewportWidth, viewportHeight } = useCameraStore.getState();
              const fit = calculateBoxFitCamera(result.bounds, viewportWidth, viewportHeight, 0.85);
              useCameraStore.setState({ camera: fit });
            }
          }
        } else if (result.elements.length > 0) {
          const { viewportWidth, viewportHeight } = useCameraStore.getState();
          const fit = calculateBoxFitCamera(result.bounds, viewportWidth, viewportHeight, 0.85);
          useCameraStore.setState({ camera: fit });
        }

        // Warning or success notification
        if (result.discardedCount > 0) {
          setImportNotification({
            id: String(Date.now()),
            type: 'warning',
            message: `Imported ${result.elements.length} elements from ${file.name}`,
            details: `${result.discardedCount} unsupported items (${
              result.discardedTypes.join(', ')
            }) were discarded.`,
          });
        } else if (result.format !== 'scribl') {
          setImportNotification({
            id: String(Date.now()),
            type: 'success',
            message: `Imported ${result.elements.length} elements from ${file.name}`,
          });
        }
      } catch (err) {
        setImportNotification({
          id: String(Date.now()),
          type: 'error',
          message: `Failed to import ${file.name}`,
          details: err instanceof Error ? err.message : String(err),
        });
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
        accept='.scribl,.excalidraw,.tldr,.json,application/json'
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <TopHeader onSave={handleSave} onOpen={handleOpenClick} onExportPNG={handleExportPNG} />
      <ConfigErrorToast />
      <ImportToast
        notification={importNotification}
        onDismiss={() => setImportNotification(null)}
      />
      <StyleInspector />
      <CanvasViewport onImportNotification={setImportNotification} />
      <TextEditorOverlay />
      <FloatingDock />
      <ZoomHUD />
      <SettingsModal />
    </div>
  );
}

export default App;
