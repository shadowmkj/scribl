import { useCameraStore } from '../../stores/useCameraStore';
import { DEFAULT_CONFIG } from '../../stores/useConfigStore';
import { commandRegistry } from '../commands/CommandRegistry';
import { KeybindingEngine } from './KeybindingEngine';

export const keybindingEngine = new KeybindingEngine({
  executeCommand: (id: string) => commandRegistry.execute(id),
});

// Initialize with default keymaps
keybindingEngine.setLeaderKey(DEFAULT_CONFIG.mapleader);
keybindingEngine.registerKeymaps(DEFAULT_CONFIG.keymaps);

export function handleGlobalKeyDown(e: KeyboardEvent): void {
  // Ignore if typing in text inputs or textareas
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  // Handle Spacebar hold for camera drag-pan
  if (e.code === 'Space') {
    useCameraStore.getState().setIsSpacePressed(true);
  }

  // Dispatch through dynamic keybinding engine
  const handled = keybindingEngine.handleKeyDown(e);
  if (handled) {
    return;
  }

  // Fallback for spacebar default prevention if unmapped
  if (e.code === 'Space') {
    e.preventDefault();
  }
}

export function handleGlobalKeyUp(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    useCameraStore.getState().setIsSpacePressed(false);
  }
}

export function handleGlobalBlur(): void {
  useCameraStore.getState().setIsSpacePressed(false);
  useCameraStore.getState().setIsPanning(false);
}
