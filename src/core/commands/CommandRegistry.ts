import { useCameraStore } from '../../stores/useCameraStore';
import { useConfigStore } from '../../stores/useConfigStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useToolStore } from '../../stores/useToolStore';
import { calculateBoxFitCamera } from '../camera/cameraMath';
import { copySelected, cutSelected, duplicateSelected, paste } from '../clipboard/clipboard';

export interface Command {
  id: string;
  label: string;
  category: 'tool' | 'zoom' | 'history' | 'selection' | 'file' | 'canvas' | 'app';
  description?: string;
  icon?: string;
  shortcut?: string;
  execute: () => void | Promise<void>;
  isActive?: () => boolean;
}

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }

  getAll(): Command[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: Command['category']): Command[] {
    return this.getAll().filter((c) => c.category === category);
  }

  execute(id: string): boolean {
    const cmd = this.commands.get(id);
    if (!cmd) return false;
    cmd.execute();
    return true;
  }
}

export const commandRegistry = new CommandRegistry();

export function registerDefaultCommands(handlers?: {
  onSave?: () => void;
  onOpen?: () => void;
  onExportPng?: () => void;
  onClear?: () => void;
}): void {
  // Tools
  commandRegistry.register({
    id: 'tool.select',
    label: 'Select',
    category: 'tool',
    description: 'Select, move, and transform canvas elements',
    execute: () => useToolStore.getState().setTool('select'),
    isActive: () => useToolStore.getState().currentTool === 'select',
  });

  commandRegistry.register({
    id: 'tool.pen',
    label: 'Pen',
    category: 'tool',
    description: 'Freehand vector inking tool',
    execute: () => {
      useToolStore.getState().setTool('pen');
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'pen',
  });

  commandRegistry.register({
    id: 'tool.eraser',
    label: 'Eraser',
    category: 'tool',
    description: 'Stroke eraser tool',
    execute: () => {
      useToolStore.getState().setTool('eraser');
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'eraser',
  });

  commandRegistry.register({
    id: 'tool.text',
    label: 'Text',
    category: 'tool',
    description: 'Add and edit multiline text elements on the canvas',
    execute: () => useToolStore.getState().setTool('text'),
    isActive: () => useToolStore.getState().currentTool === 'text',
  });

  commandRegistry.register({
    id: 'tool.zoom',
    label: 'Zoom',
    category: 'tool',
    description: 'Scrubby or marquee selection zoom tool',
    execute: () => useToolStore.getState().setTool('zoom'),
    isActive: () => useToolStore.getState().currentTool === 'zoom',
  });

  commandRegistry.register({
    id: 'tool.shapes',
    label: 'Shapes Tool',
    category: 'tool',
    description: 'Activate last-used shape tool (press twice to browse shapes)',
    execute: () => {
      const toolStore = useToolStore.getState();
      const currentTool = toolStore.currentTool;
      const activeShape = toolStore.activeShapeTool || 'rectangle';
      const isFlyoutOpen = toolStore.isShapesFlyoutOpen;

      if (currentTool !== activeShape) {
        toolStore.setTool(activeShape);
        toolStore.setShapesFlyoutOpen(false);
      } else {
        toolStore.setShapesFlyoutOpen(!isFlyoutOpen);
      }

      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => {
      const tool = useToolStore.getState().currentTool;
      return ['rectangle', 'circle', 'diamond', 'line', 'arrow'].includes(tool);
    },
  });

  commandRegistry.register({
    id: 'tool.shape',
    label: 'Shapes Tool',
    category: 'tool',
    description: 'Activate last-used shape tool (alias for tool.shapes)',
    execute: () => {
      commandRegistry.execute('tool.shapes');
    },
    isActive: () => commandRegistry.get('tool.shapes')?.isActive?.() ?? false,
  });

  commandRegistry.register({
    id: 'tool.shape.rectangle',
    label: 'Rectangle',
    category: 'tool',
    description: 'Draw rectangles or squares',
    execute: () => {
      const toolStore = useToolStore.getState();
      toolStore.setTool('rectangle');
      toolStore.setActiveShapeTool('rectangle');
      toolStore.setShapesFlyoutOpen(false);
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'rectangle',
  });

  commandRegistry.register({
    id: 'tool.rectangle',
    label: 'Rectangle',
    category: 'tool',
    description: 'Draw rectangles or squares (alias)',
    execute: () => {
      commandRegistry.execute('tool.shape.rectangle');
    },
    isActive: () => useToolStore.getState().currentTool === 'rectangle',
  });

  commandRegistry.register({
    id: 'tool.shape.circle',
    label: 'Circle',
    category: 'tool',
    description: 'Draw circles or ellipses',
    execute: () => {
      const toolStore = useToolStore.getState();
      toolStore.setTool('circle');
      toolStore.setActiveShapeTool('circle');
      toolStore.setShapesFlyoutOpen(false);
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'circle',
  });

  commandRegistry.register({
    id: 'tool.circle',
    label: 'Circle',
    category: 'tool',
    description: 'Draw circles or ellipses (alias)',
    execute: () => {
      commandRegistry.execute('tool.shape.circle');
    },
    isActive: () => useToolStore.getState().currentTool === 'circle',
  });

  commandRegistry.register({
    id: 'tool.shape.diamond',
    label: 'Diamond',
    category: 'tool',
    description: 'Draw diamonds / rhombuses',
    execute: () => {
      const toolStore = useToolStore.getState();
      toolStore.setTool('diamond');
      toolStore.setActiveShapeTool('diamond');
      toolStore.setShapesFlyoutOpen(false);
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'diamond',
  });

  commandRegistry.register({
    id: 'tool.diamond',
    label: 'Diamond',
    category: 'tool',
    description: 'Draw diamonds / rhombuses (alias)',
    execute: () => {
      commandRegistry.execute('tool.shape.diamond');
    },
    isActive: () => useToolStore.getState().currentTool === 'diamond',
  });

  commandRegistry.register({
    id: 'tool.shape.line',
    label: 'Line',
    category: 'tool',
    description: 'Draw straight lines',
    execute: () => {
      const toolStore = useToolStore.getState();
      toolStore.setTool('line');
      toolStore.setActiveShapeTool('line');
      toolStore.setShapesFlyoutOpen(false);
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'line',
  });

  commandRegistry.register({
    id: 'tool.line',
    label: 'Line',
    category: 'tool',
    description: 'Draw straight lines (alias)',
    execute: () => {
      commandRegistry.execute('tool.shape.line');
    },
    isActive: () => useToolStore.getState().currentTool === 'line',
  });

  commandRegistry.register({
    id: 'tool.shape.arrow',
    label: 'Arrow',
    category: 'tool',
    description: 'Draw directional arrows',
    execute: () => {
      const toolStore = useToolStore.getState();
      toolStore.setTool('arrow');
      toolStore.setActiveShapeTool('arrow');
      toolStore.setShapesFlyoutOpen(false);
      if (useDocumentStore.getState().selectedIds.length > 0) {
        useDocumentStore.getState().setSelected([]);
      }
    },
    isActive: () => useToolStore.getState().currentTool === 'arrow',
  });

  commandRegistry.register({
    id: 'tool.arrow',
    label: 'Arrow',
    category: 'tool',
    description: 'Draw directional arrows (alias)',
    execute: () => {
      commandRegistry.execute('tool.shape.arrow');
    },
    isActive: () => useToolStore.getState().currentTool === 'arrow',
  });

  // Zoom actions
  commandRegistry.register({
    id: 'zoom.in',
    label: 'Zoom In',
    category: 'zoom',
    execute: () => {
      const { viewportWidth, viewportHeight, camera, zoomAt } = useCameraStore.getState();
      zoomAt(viewportWidth / 2, viewportHeight / 2, camera.zoom * 1.15);
    },
  });

  commandRegistry.register({
    id: 'zoom.out',
    label: 'Zoom Out',
    category: 'zoom',
    execute: () => {
      const { viewportWidth, viewportHeight, camera, zoomAt } = useCameraStore.getState();
      zoomAt(viewportWidth / 2, viewportHeight / 2, camera.zoom / 1.15);
    },
  });

  commandRegistry.register({
    id: 'zoom.reset',
    label: 'Reset Zoom',
    category: 'zoom',
    execute: () => useCameraStore.getState().resetZoom(),
  });

  commandRegistry.register({
    id: 'zoom.fit_all',
    label: 'Fit Drawing',
    category: 'zoom',
    execute: () => {
      const doc = useDocumentStore.getState();
      const ids = doc.elementIds;
      const { viewportWidth, viewportHeight } = useCameraStore.getState();
      if (ids.length === 0) {
        useCameraStore.getState().resetZoom();
        useCameraStore.getState().setPan(0, 0);
        return;
      }

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const id of ids) {
        const el = doc.elements[id];
        if (el) {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        }
      }

      if (minX !== Infinity) {
        const fit = calculateBoxFitCamera(
          { minX, minY, maxX, maxY },
          viewportWidth,
          viewportHeight,
          0.85,
        );
        useCameraStore.setState({ camera: fit });
      }
    },
  });

  commandRegistry.register({
    id: 'zoom.toggle_mode',
    label: 'Toggle Zoom Mode',
    category: 'zoom',
    execute: () => {
      const mode = useToolStore.getState().zoomMode;
      useToolStore.getState().setZoomMode(mode === 'scrubby' ? 'selection' : 'scrubby');
    },
  });

  // History
  commandRegistry.register({
    id: 'history.undo',
    label: 'Undo',
    category: 'history',
    execute: () => useDocumentStore.getState().undo(),
  });

  commandRegistry.register({
    id: 'history.redo',
    label: 'Redo',
    category: 'history',
    execute: () => useDocumentStore.getState().redo(),
  });

  // Selection
  commandRegistry.register({
    id: 'selection.delete',
    label: 'Delete Selected',
    category: 'selection',
    execute: () => useDocumentStore.getState().deleteSelected(),
  });

  commandRegistry.register({
    id: 'selection.select_all',
    label: 'Select All',
    category: 'selection',
    execute: () => {
      const doc = useDocumentStore.getState();
      doc.setSelected([...doc.elementIds]);
    },
  });

  commandRegistry.register({
    id: 'selection.deselect',
    label: 'Deselect',
    category: 'selection',
    description: 'Clear the active selection',
    execute: () => {
      useDocumentStore.getState().setSelected([]);
    },
  });

  commandRegistry.register({
    id: 'selection.rotate',
    label: 'Rotate Selection',
    category: 'selection',
    description: 'Trigger selection rotation mode',
    execute: () => {},
  });

  // Clipboard & Duplicate
  commandRegistry.register({
    id: 'edit.copy',
    label: 'Copy',
    category: 'selection',
    description: 'Copy selected elements to clipboard',
    execute: () => {
      void copySelected();
    },
  });
  commandRegistry.register({
    id: 'selection.copy',
    label: 'Copy',
    category: 'selection',
    execute: () => {
      void copySelected();
    },
  });

  commandRegistry.register({
    id: 'edit.paste',
    label: 'Paste',
    category: 'selection',
    description: 'Paste elements from clipboard',
    execute: () => {
      void paste();
    },
  });
  commandRegistry.register({
    id: 'selection.paste',
    label: 'Paste',
    category: 'selection',
    execute: () => {
      void paste();
    },
  });

  commandRegistry.register({
    id: 'edit.cut',
    label: 'Cut',
    category: 'selection',
    description: 'Cut selected elements to clipboard',
    execute: () => {
      void cutSelected();
    },
  });
  commandRegistry.register({
    id: 'selection.cut',
    label: 'Cut',
    category: 'selection',
    execute: () => {
      void cutSelected();
    },
  });

  commandRegistry.register({
    id: 'edit.duplicate',
    label: 'Duplicate',
    category: 'selection',
    description: 'Duplicate selected elements in-place',
    execute: () => {
      void duplicateSelected();
    },
  });
  commandRegistry.register({
    id: 'selection.duplicate',
    label: 'Duplicate',
    category: 'selection',
    execute: () => {
      void duplicateSelected();
    },
  });

  // File & Canvas
  commandRegistry.register({
    id: 'file.save',
    label: 'Save File',
    category: 'file',
    execute: () => handlers?.onSave?.(),
  });

  commandRegistry.register({
    id: 'file.open',
    label: 'Open File',
    category: 'file',
    execute: () => handlers?.onOpen?.(),
  });

  commandRegistry.register({
    id: 'file.export_png',
    label: 'Export PNG',
    category: 'file',
    execute: () => handlers?.onExportPng?.(),
  });

  commandRegistry.register({
    id: 'canvas.clear',
    label: 'Clear Canvas',
    category: 'canvas',
    execute: () => {
      if (handlers?.onClear) {
        handlers.onClear();
      } else {
        useDocumentStore.getState().clearDocument();
      }
    },
  });

  // App Settings
  commandRegistry.register({
    id: 'app.settings',
    label: 'Open Settings',
    category: 'app',
    description: 'Open application settings preferences modal',
    execute: () => {
      useConfigStore.getState().openSettings();
    },
  });
}

// Auto-register built-in default commands
registerDefaultCommands();
