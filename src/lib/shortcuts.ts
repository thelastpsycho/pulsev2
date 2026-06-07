// ============================================================================
// Keyboard Shortcuts System
// ============================================================================

import type { KeyboardShortcut, ShortcutMap } from '@/types';

/**
 * Keyboard shortcuts manager
 */
class KeyboardShortcuts {
  private shortcuts: ShortcutMap = {};
  private isEnabled: boolean = true;
  private listeners: Set<(shortcut: KeyboardShortcut) => void> = new Set();

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    this.shortcuts[shortcut.key.toLowerCase()] = shortcut;
    console.log(`[Shortcuts] Registered: ${shortcut.key}`);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string): void {
    delete this.shortcuts[key.toLowerCase()];
    console.log(`[Shortcuts] Unregistered: ${key}`);
  }

  /**
   * Handle keyboard event
   */
  handle = (event: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    // Ignore if user is typing in an input
    if (this.isInputTarget(event.target as HTMLElement)) return;

    const key = this.getKeyString(event);
    const shortcut = this.shortcuts[key];

    if (shortcut) {
      // Check condition if provided
      if (shortcut.condition && !shortcut.condition()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      console.log(`[Shortcuts] Executing: ${key}`);
      shortcut.action();

      // Notify listeners
      this.listeners.forEach(listener => listener(shortcut));
    }
  };

  /**
   * Check if target is an input element
   */
  private isInputTarget(target: HTMLElement | null): boolean {
    if (!target) return false;
    const tagName = target.tagName.toLowerCase();
    const isInput = tagName === 'input' ||
                    tagName === 'textarea' ||
                    tagName === 'select' ||
                    target.isContentEditable;
    return isInput;
  }

  /**
   * Get normalized key string from event
   */
  private getKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.metaKey) parts.push('cmd');
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    const key = event.key.toLowerCase();

    // Map special keys
    const keyMap: Record<string, string> = {
      ' ': 'space',
      'escape': 'escape',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'enter': 'enter',
    };

    parts.push(keyMap[key] || key);

    return parts.join('+');
  }

  /**
   * Enable shortcuts
   */
  enable(): void {
    this.isEnabled = true;
    console.log('[Shortcuts] Enabled');
  }

  /**
   * Disable shortcuts
   */
  disable(): void {
    this.isEnabled = false;
    console.log('[Shortcuts] Disabled');
  }

  /**
   * Add listener for shortcut executions
   */
  addListener(listener: (shortcut: KeyboardShortcut) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get all registered shortcuts
   */
  getAll(): KeyboardShortcut[] {
    return Object.values(this.shortcuts);
  }

  /**
   * Get shortcuts by category
   */
  getByCategory(category: string): KeyboardShortcut[] {
    return Object.values(this.shortcuts).filter(s => s.category === category);
  }

  /**
   * Clear all shortcuts
   */
  clear(): void {
    this.shortcuts = {};
    console.log('[Shortcuts] Cleared');
  }
}

// ============================================================================
// Global Shortcuts Instance
// ============================================================================

export const shortcuts = new KeyboardShortcuts();

// ============================================================================
// Default Shortcuts Registration
// ============================================================================

/**
 * Register default application shortcuts
 */
export function registerDefaultShortcuts(): void {
  const { navigate } = window.PulseLayout;

  // Global shortcuts
  shortcuts.register({
    key: 'cmd+k',
    description: 'Open global search',
    action: () => {
      // Will be implemented when search component is ready
      console.log('Opening global search...');
      // Dispatch custom event for search component to listen to
      window.dispatchEvent(new CustomEvent('gp:search:open'));
    },
    category: 'global',
  });

  shortcuts.register({
    key: 'ctrl+k',
    description: 'Open global search',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:search:open'));
    },
    category: 'global',
  });

  shortcuts.register({
    key: '?',
    description: 'Show keyboard shortcuts',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:shortcuts:show'));
    },
    category: 'global',
  });

  // Navigation shortcuts
  shortcuts.register({
    key: 'cmd+shift+d',
    description: 'Go to dashboard',
    action: () => navigate('/'),
    category: 'navigation',
  });

  shortcuts.register({
    key: 'ctrl+shift+d',
    description: 'Go to dashboard',
    action: () => navigate('/'),
    category: 'navigation',
  });

  shortcuts.register({
    key: 'cmd+shift+i',
    description: 'Create new issue',
    action: () => navigate('/issues/new'),
    category: 'navigation',
  });

  shortcuts.register({
    key: 'ctrl+shift+i',
    description: 'Create new issue',
    action: () => navigate('/issues/new'),
    category: 'navigation',
  });

  shortcuts.register({
    key: 'escape',
    description: 'Close modal/drawer/search',
    action: () => {
      // Dispatch close event
      window.dispatchEvent(new CustomEvent('gp:close'));
    },
    category: 'global',
  });

  // Issue list navigation
  shortcuts.register({
    key: 'j',
    description: 'Next issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:next'));
    },
    category: 'navigation',
    condition: () => window.location.hash.startsWith('#/issues'),
  });

  shortcuts.register({
    key: 'k',
    description: 'Previous issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:previous'));
    },
    category: 'navigation',
    condition: () => window.location.hash.startsWith('#/issues'),
  });

  shortcuts.register({
    key: 'enter',
    description: 'Open selected issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:open'));
    },
    category: 'navigation',
    condition: () => window.location.hash === '#/issues' || window.location.hash === '#/issues/',
  });

  // Issue detail actions
  shortcuts.register({
    key: 'c',
    description: 'Close current issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:close'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+$/.test(window.location.hash),
  });

  shortcuts.register({
    key: 'r',
    description: 'Reopen issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:reopen'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+$/.test(window.location.hash),
  });

  shortcuts.register({
    key: 'e',
    description: 'Edit current issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:edit'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+$/.test(window.location.hash),
  });

  shortcuts.register({
    key: 'a',
    description: 'Assign issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:assign'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+/.test(window.location.hash),
  });

  shortcuts.register({
    key: 'n',
    description: 'Add comment',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:comment'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+/.test(window.location.hash),
  });

  // Bulk actions
  shortcuts.register({
    key: 'cmd+a',
    description: 'Select all issues',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:select-all'));
    },
    category: 'bulk',
    condition: () => window.location.hash === '#/issues' || window.location.hash === '#/issues/',
  });

  shortcuts.register({
    key: 'ctrl+a',
    description: 'Select all issues',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:select-all'));
    },
    category: 'bulk',
    condition: () => window.location.hash === '#/issues' || window.location.hash === '#/issues/',
  });

  shortcuts.register({
    key: 'space',
    description: 'Toggle selection',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:toggle-select'));
    },
    category: 'bulk',
    condition: () => window.location.hash === '#/issues' || window.location.hash === '#/issues/',
  });

  console.log('[Shortcuts] Default shortcuts registered');
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize keyboard shortcuts system
 */
export function initShortcuts(): void {
  // Add event listener
  document.addEventListener('keydown', shortcuts.handle);

  // Register default shortcuts
  registerDefaultShortcuts();

  console.log('[Shortcuts] System initialized');
}

/**
 * Cleanup keyboard shortcuts system
 */
export function cleanupShortcuts(): void {
  document.removeEventListener('keydown', shortcuts.handle);
  shortcuts.clear();
  console.log('[Shortcuts] System cleaned up');
}

// Export for window global
if (typeof window !== 'undefined') {
  (window as any).KeyboardShortcuts = shortcuts;
}