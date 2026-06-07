// ============================================================================
// Simple Global Search Component (JSX version for compatibility)
// ============================================================================

import { useState, useEffect, useRef } from 'react';

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") },
  Overlay: typeof window !== 'undefined' && window.PulseOverlay || {}
});

const w = safeWindow();
const Icon = w.UI.Icon;
const TOKENS = w.UI.TOKENS;

function SimpleGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allIssues, setAllIssues] = useState(null);
  const [allUsers, setAllUsers] = useState(null);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Load data when search opens
  useEffect(() => {
    if (isOpen) {
      // Load issues and users
      Promise.all([
        window.PulseAPI.Issues.list({ per_page: 100 }),
        window.PulseAPI.Users.list()
      ]).then(([issuesRes, usersRes]) => {
        setAllIssues(issuesRes.data || []);
        setAllUsers(usersRes.data || []);
      });
      inputRef.current?.focus();
    } else {
      Promise.resolve().then(() => {
        setQuery('');
        setResults([]);
        setSelectedIndex(0);
      });
    }
  }, [isOpen]);

  // Listen for open command
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('gp:search:open', handleOpen);
    window.addEventListener('gp:close', handleClose);

    return () => {
      window.removeEventListener('gp:search:open', handleOpen);
      window.removeEventListener('gp:close', handleClose);
    };
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!query || !allIssues || !allUsers) {
      Promise.resolve().then(() => setResults([]));
      return;
    }

    const searchLower = query.toLowerCase();
    const found = [];

    // Search issues
    allIssues.forEach(issue => {
      const titleMatch = issue.title?.toLowerCase().includes(searchLower);
      const guestMatch = issue.name?.toLowerCase().includes(searchLower);
      const roomMatch = issue.room_number?.toLowerCase().includes(searchLower);
      const idMatch = String(issue.id).includes(searchLower);

      if (titleMatch || guestMatch || roomMatch || idMatch) {
        found.push({
          id: `issue-${issue.id}`,
          type: 'issue',
          title: issue.title,
          subtitle: `${issue.name || 'Unknown'} · ${issue.room_number || 'No room'}`,
          route: `/issues/${issue.id}`,
          icon: 'inbox'
        });
      }
    });

    // Search users
    allUsers.forEach(user => {
      const nameMatch = user.name?.toLowerCase().includes(searchLower);
      const emailMatch = user.email?.toLowerCase().includes(searchLower);

      if (nameMatch || emailMatch) {
        found.push({
          id: `user-${user.id}`,
          type: 'user',
          title: user.name,
          subtitle: user.email,
          route: `/admin/users`,
          icon: 'user'
        });
      }
    });

    Promise.resolve().then(() => {
      setResults(found.slice(0, 10));
      setSelectedIndex(0);
    });
  }, [query, allIssues, allUsers]);

  // Result selection handler
  const selectResult = (result) => {
    if (result.route) {
      window.PulseLayout.navigate(result.route);
      setIsOpen(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            selectResult(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {});

  return (
    <>
      {isOpen && (
        <div
          ref={searchRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/8">
              <Icon name="search" size={20} color={TOKENS.mutedLight} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issues, users, or type 'help'..."
                className="flex-1 border-none outline-none text-base text-text placeholder:text-muted-light bg-transparent"
              />
              <div className="flex items-center gap-2 text-xs text-muted-light">
                <span className="px-2 py-1 bg-black/4 rounded font-mono">ESC</span>
                <span>to close</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {!query && (
                <div className="px-5 py-8 text-center text-muted-light">
                  <Icon name="search" size={32} color={TOKENS.mutedLight} />
                  <div className="mt-3 text-sm">Type to search across everything</div>
                </div>
              )}

              {query && results.length === 0 && (
                <div className="px-5 py-8 text-center text-muted-light">
                  <Icon name="inbox" size={32} color={TOKENS.mutedLight} />
                  <div className="mt-3 text-sm">No results found for "{query}"</div>
                </div>
              )}

              {query && results.length > 0 && (
                <div className="py-2">
                  {Object.entries(groupedResults).map(([type, typeResults]) => (
                    <div key={type} className="mb-4">
                      <div className="px-5 py-1.5 text-xs font-semibold text-muted-light uppercase tracking-wider">
                        {type === 'issue' ? 'Issues' : 'Team Members'}
                      </div>
                      {typeResults.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = selectedIndex === globalIndex;
                        return (
                          <button
                            key={result.id}
                            onClick={() => selectResult(result)}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left border-none cursor-pointer transition-colors duration-100 ${
                              isSelected ? 'bg-accent/10' : 'hover:bg-black/3'
                            }`}
                          >
                            <Icon
                              name={result.icon || 'file'}
                              size={16}
                              color={isSelected ? TOKENS.accent : TOKENS.mutedLight}
                            />
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isSelected ? 'text-accent' : 'text-text'
                              }`}>
                                {result.title}
                              </div>
                              {result.subtitle && (
                                <div className="text-xs text-muted-light truncate">
                                  {result.subtitle}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2 border-t border-black/8 flex items-center justify-between text-xs text-muted-light">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-black/4 rounded font-mono">↑↓</span>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-black/4 rounded font-mono">↵</span>
                  select
                </span>
              </div>
              <div>{results.length} results</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

window.SimpleGlobalSearch = SimpleGlobalSearch;