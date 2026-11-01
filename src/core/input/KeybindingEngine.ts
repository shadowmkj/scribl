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

export function parseVimKeyNotation(notation: string, leaderKey = ' '): KeyStroke[] {
  let expanded = notation;
  if (expanded.includes('<leader>')) {
    const leaderToken = leaderKey === ' ' ? '<Space>' : leaderKey;
    expanded = expanded.replace(/<leader>/g, leaderToken);
  }

  const strokes: KeyStroke[] = [];
  const regex = /<([^>]+)>|([a-zA-Z0-9+\-=_/[\]\\;',.`~])/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(expanded)) !== null) {
    if (match[1]) {
      // Bracketed token, e.g. "C-z", "D-S-z", "Space", "BS", "Del", "S-0"
      const content = match[1];
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
      } else if (baseKey.toLowerCase() === 'cr' || baseKey.toLowerCase() === 'enter') key = 'Enter';
      else if (baseKey.toLowerCase() === 'esc' || baseKey.toLowerCase() === 'escape') {
        key = 'Escape';
      }

      strokes.push({
        key: key.length === 1 ? key.toLowerCase() : key,
        ctrl: ctrl || undefined,
        meta: meta || undefined,
        alt: alt || undefined,
        shift: shift || undefined,
      });
    } else if (match[2]) {
      // Single character
      const char = match[2];
      strokes.push({ key: char.toLowerCase() });
    }
  }

  return strokes;
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
  sequence: KeyStroke[];
  commandId: string;
  desc?: string;
}

export class KeybindingEngine {
  private keymaps: CompiledKeymap[] = [];
  private leaderKey: string = ' ';
  private pendingSequence: KeyStroke[] = [];
  private chordTimer: number | null = null;
  private executeCommand: (id: string) => boolean;

  constructor(options: { executeCommand: (id: string) => boolean; }) {
    this.executeCommand = options.executeCommand;
  }

  setLeaderKey(leader: string) {
    this.leaderKey = leader;
  }

  registerKeymaps(entries: KeymapEntry[]) {
    this.keymaps = entries.map((entry) => ({
      sequence: parseVimKeyNotation(entry.lhs, this.leaderKey),
      commandId: entry.rhs,
      desc: entry.desc,
    }));
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return false;
    }

    const currentStroke: KeyStroke = {
      key: e.key,
      ctrl: e.ctrlKey || undefined,
      meta: e.metaKey || undefined,
      alt: e.altKey || undefined,
      shift: e.shiftKey || undefined,
    };

    // If pending chord timer active
    const candidateSequence = [...this.pendingSequence, currentStroke];

    // Check exact match
    for (const km of this.keymaps) {
      if (km.sequence.length === candidateSequence.length) {
        let match = true;
        for (let i = 0; i < km.sequence.length; i++) {
          // Compare each stroke
          const strokeDef = km.sequence[i];
          const isCurrent = i === km.sequence.length - 1;
          if (isCurrent) {
            if (!matchesStroke(e, strokeDef)) {
              match = false;
              break;
            }
          }
        }
        if (match) {
          this.clearChord();
          e.preventDefault();
          this.executeCommand(km.commandId);
          return true;
        }
      }
    }

    // Check prefix match (multi-key chord continuation)
    const hasPrefixMatch = this.keymaps.some((km) => {
      if (km.sequence.length > candidateSequence.length) {
        const strokeDef = km.sequence[candidateSequence.length - 1];
        return matchesStroke(e, strokeDef);
      }
      return false;
    });

    if (hasPrefixMatch) {
      this.pendingSequence.push(currentStroke);
      e.preventDefault();
      if (this.chordTimer) clearTimeout(this.chordTimer);
      this.chordTimer = window.setTimeout(() => this.clearChord(), 1000);
      return true;
    }

    // If candidate didn't match and we had a pending sequence, clear and re-try current key alone
    if (this.pendingSequence.length > 0) {
      this.clearChord();
      return this.handleKeyDown(e);
    }

    return false;
  }

  private clearChord() {
    this.pendingSequence = [];
    if (this.chordTimer) {
      clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
  }
}
