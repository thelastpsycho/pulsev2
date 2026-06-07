// ============================================================================
// Keyboard Shortcuts Initialization (JavaScript version)
// ============================================================================

/**
 * Initialize keyboard shortcuts system
 */
function initKeyboardShortcuts() {
  console.log('[Shortcuts] Initializing...');

  // Shortcut registry
  const shortcuts = {};

  /**
   * Register a keyboard shortcut
   */
  function register(shortcut) {
    shortcuts[shortcut.key.toLowerCase()] = shortcut;
    console.log(`[Shortcuts] Registered: ${shortcut.key}`);
  }

  /**
   * Handle keyboard event
   */
  function handle(event) {
    // Ignore if user is typing in an input
    const target = event.target;
    if (target && (target.tagName === 'INPUT' ||
                  target.tagName === 'TEXTAREA' ||
                  target.tagName === 'SELECT' ||
                  target.isContentEditable)) {
      return;
    }

    // Build key string
    const parts = [];
    if (event.metaKey) parts.push('cmd');
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    const key = event.key.toLowerCase();
    const keyMap = {
      ' ': 'space',
      'escape': 'escape',
      'arrowup': 'up',
      'arrowdown': 'down',
      'arrowleft': 'left',
      'arrowright': 'right',
      'enter': 'enter',
    };

    parts.push(keyMap[key] || key);
    const keyString = parts.join('+');

    const shortcut = shortcuts[keyString];
    if (shortcut) {
      // Check condition if provided
      if (shortcut.condition && !shortcut.condition()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      console.log(`[Shortcuts] Executing: ${keyString}`);
      shortcut.action();
    }
  }

  // Register default shortcuts
  const navigate = window.PulseLayout?.navigate || ((to) => {
    window.location.hash = '#' + to;
  });

  // Global shortcuts
  register({
    key: 'cmd+k',
    description: 'Open global search',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:search:open'));
    },
    category: 'global',
  });

  register({
    key: 'ctrl+k',
    description: 'Open global search',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:search:open'));
    },
    category: 'global',
  });

  register({
    key: '/',
    description: 'Show keyboard shortcuts',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:shortcuts:show'));
    },
    category: 'global',
  });

  // Navigation shortcuts
  register({
    key: 'cmd+shift+d',
    description: 'Go to dashboard',
    action: () => navigate('/'),
    category: 'navigation',
  });

  register({
    key: 'ctrl+shift+d',
    description: 'Go to dashboard',
    action: () => navigate('/'),
    category: 'navigation',
  });

  register({
    key: 'cmd+shift+i',
    description: 'Create new issue',
    action: () => navigate('/issues/new'),
    category: 'navigation',
  });

  register({
    key: 'ctrl+shift+i',
    description: 'Create new issue',
    action: () => navigate('/issues/new'),
    category: 'navigation',
  });

  register({
    key: 'escape',
    description: 'Close modal/drawer/search',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:close'));
    },
    category: 'global',
  });

  // Issue list navigation
  register({
    key: 'j',
    description: 'Next issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:next'));
    },
    category: 'navigation',
    condition: () => window.location.hash.startsWith('#/issues'),
  });

  register({
    key: 'k',
    description: 'Previous issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:previous'));
    },
    category: 'navigation',
    condition: () => window.location.hash.startsWith('#/issues'),
  });

  register({
    key: 'enter',
    description: 'Open selected issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issues:open'));
    },
    category: 'navigation',
    condition: () => window.location.hash === '#/issues' || window.location.hash === '#/issues/',
  });

  // Issue detail actions
  register({
    key: 'c',
    description: 'Close current issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:close'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+$/.test(window.location.hash),
  });

  register({
    key: 'r',
    description: 'Reopen issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:reopen'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+$/.test(window.location.hash),
  });

  register({
    key: 'e',
    description: 'Edit current issue',
    action: () => {
      window.dispatchEvent(new CustomEvent('gp:issue:edit'));
    },
    category: 'actions',
    condition: () => /^#\/issues\/\d+$/.test(window.location.hash),
  });

  console.log('[Shortcuts] System initialized');

  // Add event listener
  document.addEventListener('keydown', handle);
}

// Auto-initialize
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);
  } else {
    initKeyboardShortcuts();
  }
}
