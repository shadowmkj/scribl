import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToolStore } from '../../stores/useToolStore';
import {
  Command,
  CommandRegistry,
  commandRegistry,
  registerDefaultCommands,
} from './CommandRegistry';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('registers and retrieves a command by ID', () => {
    const execFn = vi.fn();
    const cmd: Command = {
      id: 'tool.pen',
      label: 'Pen Tool',
      category: 'tool',
      execute: execFn,
    };

    registry.register(cmd);
    expect(registry.get('tool.pen')).toBe(cmd);
    expect(registry.execute('tool.pen')).toBe(true);
    expect(execFn).toHaveBeenCalledOnce();
  });

  it('returns false when executing an unknown command ID', () => {
    expect(registry.execute('nonexistent.cmd')).toBe(false);
  });

  it('filters commands by category', () => {
    registry.register({ id: 'tool.pen', label: 'Pen', category: 'tool', execute: () => {} });
    registry.register({ id: 'tool.eraser', label: 'Eraser', category: 'tool', execute: () => {} });
    registry.register({
      id: 'history.undo',
      label: 'Undo',
      category: 'history',
      execute: () => {},
    });

    const tools = registry.getByCategory('tool');
    expect(tools.length).toBe(2);
    expect(tools.map((t) => t.id)).toEqual(['tool.pen', 'tool.eraser']);
  });

  it('registers default shape commands and executes them', () => {
    const shapeTools = ['rectangle', 'circle', 'diamond', 'line', 'arrow'] as const;
    for (const tool of shapeTools) {
      const cmdId = `tool.shape.${tool}`;
      const cmd = commandRegistry.get(cmdId);
      expect(cmd).toBeDefined();
      expect(cmd?.category).toBe('tool');

      commandRegistry.execute(cmdId);
      expect(useToolStore.getState().currentTool).toBe(tool);
      expect(cmd?.isActive?.()).toBe(true);
    }
  });

  it('executes tool.shapes: selects last used shape, then pressing twice toggles flyout', () => {
    useToolStore.setState({
      currentTool: 'pen',
      activeShapeTool: 'circle',
      isShapesFlyoutOpen: false,
    });

    // 1st press: switches to last-used shape (circle), flyout remains closed
    commandRegistry.execute('tool.shapes');
    expect(useToolStore.getState().currentTool).toBe('circle');
    expect(useToolStore.getState().isShapesFlyoutOpen).toBe(false);

    // 2nd press (already on active shape): opens shapes flyout
    commandRegistry.execute('tool.shapes');
    expect(useToolStore.getState().isShapesFlyoutOpen).toBe(true);

    // 3rd press: toggles shapes flyout closed
    commandRegistry.execute('tool.shapes');
    expect(useToolStore.getState().isShapesFlyoutOpen).toBe(false);
  });

  it('supports shape command aliases (tool.rectangle, tool.shape, etc.)', () => {
    useToolStore.setState({ currentTool: 'pen' });
    commandRegistry.execute('tool.rectangle');
    expect(useToolStore.getState().currentTool).toBe('rectangle');

    commandRegistry.execute('tool.arrow');
    expect(useToolStore.getState().currentTool).toBe('arrow');

    commandRegistry.execute('tool.shape');
    expect(useToolStore.getState().currentTool).toBe('arrow');
  });

  it('dispatches onCopyPng handler via edit.copy_png and file.copy_png', () => {
    const onCopyPng = vi.fn();
    registerDefaultCommands({ onCopyPng });

    expect(commandRegistry.execute('edit.copy_png')).toBe(true);
    expect(onCopyPng).toHaveBeenCalledTimes(1);

    expect(commandRegistry.execute('file.copy_png')).toBe(true);
    expect(onCopyPng).toHaveBeenCalledTimes(2);
  });
});
