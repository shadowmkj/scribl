import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToolStore } from '../../stores/useToolStore';
import { Command, CommandRegistry, commandRegistry } from './CommandRegistry';

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
});
