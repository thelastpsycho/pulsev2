// ============================================================================
// Keyboard Shortcuts Help Component (JSX version)
// ============================================================================

import { useState, useEffect } from 'react';

function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    window.addEventListener('gp:shortcuts:show', handleShow);
    return () => window.removeEventListener('gp:shortcuts:show', handleShow);
  }, []);

  const handleClose = () => setIsOpen(false);

  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Global',
      items: [
        { key: '⌘K', description: 'Open global search' },
        { key: '/', description: 'Show keyboard shortcuts' },
        { key: 'ESC', description: 'Close modal/drawer/search' },
      ]
    },
    {
      category: 'Navigation',
      items: [
        { key: '⌘+Shift+D', description: 'Go to dashboard' },
        { key: '⌘+Shift+I', description: 'Create new issue' },
      ]
    },
    {
      category: 'Issue List',
      items: [
        { key: 'J', description: 'Next issue' },
        { key: 'K', description: 'Previous issue' },
        { key: 'Enter', description: 'Open selected issue' },
        { key: 'Space', description: 'Toggle selection' },
        { key: '⌘+A', description: 'Select all issues' },
      ]
    },
    // Issue Actions disabled - no longer using keyboard shortcuts for these
    // {
    //   category: 'Issue Actions',
    //   items: [
    //     { key: 'C', description: 'Close current issue' },
    //     { key: 'R', description: 'Reopen issue' },
    //     { key: 'E', description: 'Edit current issue' },
    //     { key: 'A', description: 'Assign issue' },
    //     { key: 'N', description: 'Add comment' },
    //   ]
    // },
  ];

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-200 grid place-items-center p-5 bg-black/32 backdrop-blur-sm animate-gp-fade"
      style={{ animationDuration: "160ms" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl flex flex-col overflow-hidden max-h-[90vh] w-full"
        style={{
          width: 640,
          maxWidth: "100%",
          boxShadow: "0 30px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
          animation: "gp-scale 200ms cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <div className="flex items-center justify-between px-[22px] py-4 border-b border-black/6">
          <div className="text-base font-semibold tracking-tighter">Keyboard Shortcuts</div>
          <button
            onClick={handleClose}
            className="bg-transparent border-none p-1 cursor-pointer rounded-lg hover:bg-black/4"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-[22px] py-[18px]">
          <div className="space-y-6">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h3 className="text-sm font-semibold text-muted-light uppercase tracking-wider mb-3">
                  {section.category}
                </h3>
                <div className="space-y-2">
                  {section.items.map((shortcut) => (
                    <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-black/6">
                      <span className="text-sm text-text">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-text bg-black/8 rounded min-w-[60px] text-center">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-black/6">
              <p className="text-xs text-muted-light text-center">
                Tip: Press <kbd className="px-1 py-0.5 text-xs bg-black/8 rounded">/</kbd> anytime to see this help
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.KeyboardShortcutsHelp = KeyboardShortcutsHelp;
