export interface KeyStroke {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface KeymapEntry {
  mode: string;
  lhs: string;
  rhs: string;
  desc?: string;
}

export function parseVimKeyNotation(notation: string): KeyStroke {
  const trimmed = notation.trim();

  // Bracketed notation, e.g. "<D-z>", "<D-S-z>", "<Space>", "<BS>", "<Del>", "<S-0>"
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    const content = trimmed.slice(1, -1);
    const parts = content.split('-');
    const baseKey = parts[parts.length - 1];

    let ctrl = false;
    let meta = false;
    let alt = false;
    let shift = false;

    for (let i = 0; i < parts.length - 1; i++) {
      const mod = parts[i].toUpperCase();
      if (mod === 'C') ctrl = true;
      if (mod === 'D') meta = true;
      if (mod === 'M' || mod === 'A') alt = true;
      if (mod === 'S') shift = true;
    }

    let key = baseKey;
    if (baseKey.toLowerCase() === 'space') key = ' ';
    else if (baseKey.toLowerCase() === 'bs' || baseKey.toLowerCase() === 'backspace') {
      key = 'Backspace';
    } else if (baseKey.toLowerCase() === 'del' || baseKey.toLowerCase() === 'delete') {
      key = 'Delete';
    } else if (baseKey.toLowerCase() === 'cr' || baseKey.toLowerCase() === 'enter') {
      key = 'Enter';
    } else if (baseKey.toLowerCase() === 'esc' || baseKey.toLowerCase() === 'escape') {
      key = 'Escape';
    }

    return {
      key: key.length === 1 ? key.toLowerCase() : key,
      ctrl: ctrl || undefined,
      meta: meta || undefined,
      alt: alt || undefined,
      shift: shift || undefined,
    };
  }

  // Single character / plain key (e.g. 'p', 'c', '1', '+', '-')
  return {
    key: trimmed.toLowerCase(),
  };
}

export function formatKeybindForDisplay(lhs: string): string {
  if (!lhs) return '';

  const isMac = typeof navigator !== 'undefined'
    && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  // Single character: uppercase it (e.g. 'p' -> 'P', 'c' -> 'C', '1' -> '1')
  if (lhs.length === 1) {
    return lhs.toUpperCase();
  }

  // Bracketed notation like <D-z>, <D-S-z>, <C-z>, <S-0>, <Space>, <BS>, <Del>
  if (lhs.startsWith('<') && lhs.endsWith('>')) {
    const inner = lhs.slice(1, -1);
    const parts = inner.split('-');
    const baseKey = parts[parts.length - 1];

    let hasCtrl = false;
    let hasMeta = false;
    let hasAlt = false;
    let hasShift = false;

    for (let i = 0; i < parts.length - 1; i++) {
      const mod = parts[i].toUpperCase();
      if (mod === 'C') hasCtrl = true;
      if (mod === 'D') hasMeta = true;
      if (mod === 'M' || mod === 'A') hasAlt = true;
      if (mod === 'S') hasShift = true;
    }

    let keyLabel = baseKey.toUpperCase();
    if (baseKey.toLowerCase() === 'space') keyLabel = 'Space';
    else if (baseKey.toLowerCase() === 'bs' || baseKey.toLowerCase() === 'backspace') {
      keyLabel = isMac ? '⌫' : 'Backspace';
    } else if (baseKey.toLowerCase() === 'del' || baseKey.toLowerCase() === 'delete') {
      keyLabel = isMac ? '⌦' : 'Del';
    } else if (baseKey.toLowerCase() === 'cr' || baseKey.toLowerCase() === 'enter') {
      keyLabel = isMac ? '↵' : 'Enter';
    } else if (baseKey.toLowerCase() === 'esc' || baseKey.toLowerCase() === 'escape') {
      keyLabel = 'Esc';
    }

    if (isMac) {
      let str = '';
      if (hasCtrl) str += '⌃';
      if (hasAlt) str += '⌥';
      if (hasShift) str += '⇧';
      if (hasMeta) str += '⌘';
      return str + keyLabel;
    } else {
      const tokens: string[] = [];
      if (hasCtrl || hasMeta) tokens.push('Ctrl');
      if (hasAlt) tokens.push('Alt');
      if (hasShift) tokens.push('Shift');
      tokens.push(keyLabel);
      return tokens.join('+');
    }
  }

  return lhs.toUpperCase();
}

function matchesStroke(e: KeyboardEvent, s: KeyStroke): boolean {
  const isMac = typeof navigator !== 'undefined'
    && navigator.platform?.toUpperCase().indexOf('MAC') >= 0;

  // On Mac, <D-x> matches metaKey; on Windows/Linux <D-x> maps to ctrlKey as standard fallback
  const cmdPressed = isMac ? e.metaKey : e.ctrlKey;
  const ctrlPressed = isMac ? e.ctrlKey : (s.ctrl ? e.ctrlKey : false);

  if (s.meta && !cmdPressed) return false;
  if (!s.meta && cmdPressed) return false;

  if (s.ctrl && !ctrlPressed) return false;
  if (!s.ctrl && ctrlPressed && !s.meta) return false;

  if (s.alt && !e.altKey) return false;
  if (!s.alt && e.altKey) return false;

  // Shift matching
  if (s.shift) {
    if (!e.shiftKey) return false;
    // On US QWERTY: Shift+0 generates key ')' and code 'Digit0'
    if (
      s.key === '0'
      && (e.key === ')' || e.code === 'Digit0' || e.code === 'Numpad0' || e.key === '0')
    ) {
      return true;
    }
  } else {
    // If stroke does not require shift, but shiftKey is pressed:
    // Only allow if key naturally produces the symbol without modifier requirement
    if (e.shiftKey && s.key !== '+' && s.key !== '=' && s.key !== '?') {
      return false;
    }
  }

  // Key identity match
  if (s.key === ' ') {
    return e.code === 'Space' || e.key === ' ';
  }
  if (s.key === 'Backspace') {
    return e.key === 'Backspace';
  }
  if (s.key === 'Delete') {
    return e.key === 'Delete';
  }

  // Number row check
  if (s.key >= '0' && s.key <= '9') {
    return e.key === s.key || e.code === `Digit${s.key}` || e.code === `Numpad${s.key}`;
  }

  return e.key.toLowerCase() === s.key.toLowerCase();
}

interface CompiledKeymap {
  stroke: KeyStroke;
  commandId: string;
  desc?: string;
}

export class KeybindingEngine {
  private keymaps: CompiledKeymap[] = [];
  private executeCommand: (id: string) => boolean;

  constructor(options: { executeCommand: (id: string) => boolean; }) {
    this.executeCommand = options.executeCommand;
  }

  registerKeymaps(entries: KeymapEntry[]) {
    this.keymaps = entries.map((entry) => ({
      stroke: parseVimKeyNotation(entry.lhs),
      commandId: entry.rhs,
      desc: entry.desc,
    }));
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return false;
    }

    for (const km of this.keymaps) {
      if (matchesStroke(e, km.stroke)) {
        e.preventDefault();
        this.executeCommand(km.commandId);
        return true;
      }
    }

    return false;
  }
}
