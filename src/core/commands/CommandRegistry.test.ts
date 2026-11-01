import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Command, CommandRegistry } from './CommandRegistry';

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
});
