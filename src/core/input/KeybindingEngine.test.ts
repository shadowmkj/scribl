import { beforeEach, describe, expect, it } from 'vitest';
import { formatKeybindForDisplay, KeybindingEngine, parseVimKeyNotation } from './KeybindingEngine';

describe('KeybindingEngine', () => {
  let engine: KeybindingEngine;
  let executedCommands: string[];

  beforeEach(() => {
    executedCommands = [];
    engine = new KeybindingEngine({
      executeCommand: (id) => {
        executedCommands.push(id);
        return true;
      },
    });
  });

  describe('parseVimKeyNotation', () => {
    it('parses simple characters and numbers', () => {
      expect(parseVimKeyNotation('p')).toEqual([{ key: 'p' }]);
      expect(parseVimKeyNotation('2')).toEqual([{ key: '2' }]);
    });

    it('parses special keys like <Space>, <BS>, <Del>', () => {
      expect(parseVimKeyNotation('<Space>')).toEqual([{ key: ' ' }]);
      expect(parseVimKeyNotation('<BS>')).toEqual([{ key: 'Backspace' }]);
      expect(parseVimKeyNotation('<Del>')).toEqual([{ key: 'Delete' }]);
    });

    it('parses modifier keys like <C-z>, <D-z>, <S-0>, <D-S-z>', () => {
      expect(parseVimKeyNotation('<C-z>')).toEqual([{ key: 'z', ctrl: true }]);
      expect(parseVimKeyNotation('<D-z>')).toEqual([{ key: 'z', meta: true }]);
      expect(parseVimKeyNotation('<S-0>')).toEqual([{ key: '0', shift: true }]);
      expect(parseVimKeyNotation('<D-S-z>')).toEqual([{ key: 'z', meta: true, shift: true }]);
    });

    it('parses leader sequences like <leader>c', () => {
      const parsed = parseVimKeyNotation('<leader>c', ' ');
      expect(parsed).toEqual([{ key: ' ' }, { key: 'c' }]);
    });
  });

  describe('formatKeybindForDisplay', () => {
    it('formats single characters in uppercase', () => {
      expect(formatKeybindForDisplay('p')).toBe('P');
      expect(formatKeybindForDisplay('v')).toBe('V');
      expect(formatKeybindForDisplay('e')).toBe('E');
      expect(formatKeybindForDisplay('z')).toBe('Z');
      expect(formatKeybindForDisplay('1')).toBe('1');
    });

    it('formats leader shortcuts', () => {
      expect(formatKeybindForDisplay('<leader>c')).toBe('Space C');
      expect(formatKeybindForDisplay('<leader>f')).toBe('Space F');
    });

    it('formats modifier brackets into platform symbols', () => {
      const formattedUndo = formatKeybindForDisplay('<D-z>');
      expect(formattedUndo === '⌘Z' || formattedUndo === 'Ctrl+Z').toBe(true);

      const formattedRedo = formatKeybindForDisplay('<D-S-z>');
      expect(formattedRedo === '⇧⌘Z' || formattedRedo === 'Ctrl+Shift+Z').toBe(true);

      const formattedShiftZero = formatKeybindForDisplay('<S-0>');
      expect(formattedShiftZero === '⇧0' || formattedShiftZero === 'Shift+0').toBe(true);
    });
  });

  describe('key event matching', () => {
    it('dispatches simple single key bindings', () => {
      engine.registerKeymaps([
        { mode: 'n', lhs: 'p', rhs: 'tool.pen' },
        { mode: 'n', lhs: 'e', rhs: 'tool.eraser' },
      ]);

      const event = new KeyboardEvent('keydown', { key: 'p', cancelable: true });
      const handled = engine.handleKeyDown(event);

      expect(handled).toBe(true);
      expect(executedCommands).toEqual(['tool.pen']);
      expect(event.defaultPrevented).toBe(true);
    });

    it('dispatches Shift+0 to zoom.reset', () => {
      engine.registerKeymaps([
        { mode: 'n', lhs: '<S-0>', rhs: 'zoom.reset' },
      ]);

      // US keyboard Shift+0 produces key ')' and code 'Digit0'
      const event = new KeyboardEvent('keydown', {
        key: ')',
        code: 'Digit0',
        shiftKey: true,
        cancelable: true,
      });

      const handled = engine.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(executedCommands).toEqual(['zoom.reset']);
    });

    it('dispatches Command/Ctrl shortcuts', () => {
      engine.registerKeymaps([
        { mode: 'n', lhs: '<D-z>', rhs: 'history.undo' },
      ]);

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        code: 'KeyZ',
        metaKey: isMac,
        ctrlKey: !isMac,
        cancelable: true,
      });

      const handled = engine.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(executedCommands).toEqual(['history.undo']);
    });

    it('dispatches two-key leader chord sequence: <leader> then c', () => {
      engine.setLeaderKey(' ');
      engine.registerKeymaps([
        { mode: 'n', lhs: '<leader>c', rhs: 'canvas.clear' },
      ]);

      // Step 1: Press Space (<leader>)
      const spaceEvent = new KeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        cancelable: true,
      });
      const spaceHandled = engine.handleKeyDown(spaceEvent);
      expect(spaceHandled).toBe(true);
      expect(executedCommands).toEqual([]); // not executed yet, waiting for second key

      // Step 2: Press c
      const cEvent = new KeyboardEvent('keydown', {
        key: 'c',
        cancelable: true,
      });
      const cHandled = engine.handleKeyDown(cEvent);
      expect(cHandled).toBe(true);
      expect(executedCommands).toEqual(['canvas.clear']);
    });

    it('ignores input elements', () => {
      engine.registerKeymaps([
        { mode: 'n', lhs: 'p', rhs: 'tool.pen' },
      ]);

      const input = document.createElement('input');
      const event = new KeyboardEvent('keydown', { key: 'p', cancelable: true });
      Object.defineProperty(event, 'target', { value: input, writable: false });

      const handled = engine.handleKeyDown(event);
      expect(handled).toBe(false);
      expect(executedCommands).toEqual([]);
    });

    it('dispatches remapped pen shortcut "d" and secondary shortcut "2", but not "p"', () => {
      engine.registerKeymaps([
        { mode: 'n', lhs: 'd', rhs: 'tool.pen' },
        { mode: 'n', lhs: '2', rhs: 'tool.pen' },
      ]);

      const eventD = new KeyboardEvent('keydown', { key: 'd', cancelable: true });
      expect(engine.handleKeyDown(eventD)).toBe(true);
      expect(executedCommands).toEqual(['tool.pen']);

      const event2 = new KeyboardEvent('keydown', { key: '2', cancelable: true });
      expect(engine.handleKeyDown(event2)).toBe(true);
      expect(executedCommands).toEqual(['tool.pen', 'tool.pen']);

      const eventP = new KeyboardEvent('keydown', { key: 'p', cancelable: true });
      expect(engine.handleKeyDown(eventP)).toBe(false);
      expect(executedCommands).toEqual(['tool.pen', 'tool.pen']);
    });
  });
});
