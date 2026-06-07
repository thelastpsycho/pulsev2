// ============================================================================
// Global Search Component (⌘K)
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import type { SearchResult, SearchResultType, SearchIndex } from '@/types';

// Safe access to window components
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return {
    Icon: () => null,
    TOKENS: {
      accent: "#007aff",
      text: "#1d1d1f",
      textSecondary: "#3a3a3c",
      muted: "#6e6e73",
      mutedLight: "#86868b",
      border: "rgba(0,0,0,0.08)",
      borderStrong: "rgba(0,0,0,0.12)",
      surface: "#ffffff",
      bg: "#f5f5f7",
      bgSoft: "#fafafa",
      success: "#34c759",
      warning: "#ff9500",
      danger: "#ff3b30",
      urgent: "#ff3b30",
      high: "#ff9500",
      medium: "#ffb800",
      low: "#34c759",
      purple: "#8e5cf2",
      gold: "#b8860b",
    },
    cx: (...xs: any[]) => xs.filter(Boolean).join(' '),
  };
};

const Icon = getPulseUI().Icon;
const TOKENS = getPulseUI().TOKENS;
const cx = getPulseUI().cx;

/**
 * Fuzzy search implementation
 */
function fuzzyMatch(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();

  if (!queryLower) return 1;

  // Exact match
  if (textLower === queryLower) return 1;

  // Starts with query
  if (textLower.startsWith(queryLower)) return 0.9;

  // Contains query
  if (textLower.includes(queryLower)) return 0.7;

  // Fuzzy match - each character must appear in order
  let queryIdx = 0;
  let score = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < textLower.length && queryIdx < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIdx]) {
      queryIdx++;
      score += 0.5 + (consecutiveMatches * 0.1);
      consecutiveMatches++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // Bonus for completing the query
  if (queryIdx === queryLower.length) {
    return Math.min(score / queryLower.length, 0.6);
  }

  return 0;
}

/**
 * Global Search Component
 */
export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<SearchResult>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchIndex, setSearchIndex] = useState<SearchIndex | null>(null);
  const [loading, setLoading] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search index when component opens
  useEffect(() => {
    if (isOpen) {
      loadSearchIndex();
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Listen for open command
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('gp:search:open', handleOpen as EventListener);
    window.addEventListener('gp:close', handleClose as EventListener);

    return () => {
      window.removeEventListener('gp:search:open', handleOpen as EventListener);
      window.removeEventListener('gp:close', handleClose as EventListener);
    };
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!searchIndex || !query) {
      setResults([]);
      return;
    }

    const searchResults = performSearch(query, searchIndex);
    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, searchIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Load search index from API and localStorage
   */
  const loadSearchIndex = async () => {
    setLoading(true);
    try {
      const [issuesRes, usersRes, typesRes] = await Promise.all([
        window.PulseAPI.Issues.list({ per_page: 100 }),
        window.PulseAPI.Users.list(),
        window.PulseAPI.IssueTypes.list(),
      ]);

      // Get recent items from localStorage
      const recentJson = localStorage.getItem('gp_recent_items');
      const recent = recentJson ? JSON.parse(recentJson) : [];

      // Define routes
      const routes: Array<{ path: string; label: string; icon: any }> = [
        { path: '/', label: 'Dashboard', icon: 'dashboard' },
        { path: '/issues', label: 'Issues', icon: 'inbox' },
        { path: '/reports', label: 'Reports', icon: 'report' },
        { path: '/statistics', label: 'Statistics', icon: 'chart-pie' },
        { path: '/graphs', label: 'Graphs', icon: 'chart-line' },
      ];

      // Add admin routes if user has permissions
      const userResponse = await window.PulseAPI.Auth.me();
      const user = userResponse.data.user;
      if (window.PulseLayout.can(user, 'admin.users.view')) {
        routes.push({ path: '/admin/users', label: 'Admin Users', icon: 'users' as const });
      }

      setSearchIndex({
        issues: issuesRes.data || [],
        users: usersRes.data || [],
        routes,
        recent,
        issueTypes: typesRes.data || [],
        categories: [], // Will be loaded when categories API is available
      });
    } catch (error) {
      console.error('Failed to load search index:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Perform fuzzy search across all data
   */
  const performSearch = (query: string, index: SearchIndex): SearchResult[] => {
    const results: SearchResult[] = [];

    // Search issues
    index.issues.forEach(issue => {
      const titleScore = fuzzyMatch(issue.title, query);
      const guestScore = fuzzyMatch(issue.name || '', query);
      const roomScore = fuzzyMatch(issue.room_number || '', query);
      const idScore = fuzzyMatch(String(issue.id), query);

      const maxScore = Math.max(titleScore, guestScore, roomScore, idScore);
      if (maxScore > 0) {
        results.push({
          id: `issue-${issue.id}`,
          type: 'issue',
          title: issue.title,
          subtitle: `${issue.name || 'Unknown guest'} · ${issue.room_number || 'No room'}`,
          route: `/issues/${issue.id}`,
          icon: 'inbox',
          meta: { issue, score: maxScore },
        });
      }
    });

    // Search users
    index.users.forEach(user => {
      const nameScore = fuzzyMatch(user.name, query);
      const emailScore = fuzzyMatch(user.email, query);

      const maxScore = Math.max(nameScore, emailScore);
      if (maxScore > 0) {
        results.push({
          id: `user-${user.id}`,
          type: 'user',
          title: user.name,
          subtitle: user.email,
          route: `/admin/users`, // Would ideally go to user detail
          icon: 'user',
          meta: { user, score: maxScore },
        });
      }
    });

    // Search routes
    index.routes.forEach(route => {
      const score = fuzzyMatch(route.label, query);
      if (score > 0) {
        results.push({
          id: `route-${route.path}`,
          type: 'route',
          title: route.label,
          subtitle: 'Go to page',
          route: route.path,
          icon: route.icon,
          meta: { score },
        });
      }
    });

    // Search recent items
    index.recent.forEach((item: any) => {
      const score = fuzzyMatch(item.title, query);
      if (score > 0) {
        results.push({
          id: `recent-${item.id}`,
          type: 'recent',
          title: item.title,
          subtitle: 'Recently viewed',
          route: item.route,
          icon: 'clock',
          meta: { score },
        });
      }
    });

    // Search issue types
    index.issueTypes.forEach(type => {
      const score = fuzzyMatch(type.name, query);
      if (score > 0) {
        results.push({
          id: `type-${type.id}`,
          type: 'type',
          title: type.name,
          subtitle: 'Issue type',
          icon: 'tag',
          meta: { type, score },
        });
      }
    });

    // Sort by score and limit results
    return results
      .sort((a, b) => (b.meta?.score || 0) - (a.meta?.score || 0))
      .slice(0, 10);
  };

  /**
   * Select and navigate to result
   */
  const selectResult = (result: SearchResult) => {
    if (result.route) {
      // Add to recent items
      addToRecent(result);

      // Navigate
      window.PulseLayout.navigate(result.route);
      setIsOpen(false);
    }
  };

  /**
   * Add item to recent items
   */
  const addToRecent = (result: SearchResult) => {
    const recent = JSON.parse(localStorage.getItem('gp_recent_items') || '[]');
    const newItem = {
      id: result.id,
      type: result.type,
      title: result.title,
      timestamp: Date.now(),
      route: result.route,
    };

    // Remove if already exists
    const filtered = recent.filter((item: any) => item.id !== result.id);

    // Add to front
    filtered.unshift(newItem);

    // Keep only 20 most recent
    const trimmed = filtered.slice(0, 20);

    localStorage.setItem('gp_recent_items', JSON.stringify(trimmed));
  };

  /**
   * Group results by type
   */
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [] as Array<SearchResult>;
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResultType, Array<SearchResult>>);

  const typeOrder: Array<SearchResultType> = ['recent', 'route', 'issue', 'user', 'type', 'category'];
  const typeLabels: Record<SearchResultType, string> = {
    recent: 'Recent',
    route: 'Pages',
    issue: 'Issues',
    user: 'Team',
    type: 'Issue Types',
    category: 'Categories',
  };

  return (
    <>
      {/* Trigger button in topbar - this would be added by the Topbar component */}
      {/* <button onClick={() => setIsOpen(true)}>⌘K</button> */}

      {/* Search Modal */}
      {isOpen && (
        <div
          ref={searchRef}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/[.08]">
              <Icon name="search" size={20} color={TOKENS.mutedLight} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issues, users, pages, or type 'help' for shortcuts..."
                className="flex-1 border-none outline-none text-base text-text placeholder:text-muted-light bg-transparent"
              />
              <div className="flex items-center gap-2 text-xs text-muted-light">
                <kbd className="px-2 py-1 bg-black/[.04] rounded font-mono">ESC</kbd>
                <span>to close</span>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading && (
                <div className="px-5 py-8 text-center text-muted-light">
                  Loading search index...
                </div>
              )}

              {!loading && !query && (
                <div className="px-5 py-8 text-center text-muted-light">
                  <Icon name="search" size={32} color={TOKENS.mutedLight} />
                  <div className="mt-3 text-sm">Type to search across everything</div>
                  <div className="mt-4 text-xs">
                    Press <kbd className="px-1.5 py-0.5 bg-black/[.04] rounded font-mono">?</kbd> for keyboard shortcuts
                  </div>
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="px-5 py-8 text-center text-muted-light">
                  <Icon name="inbox" size={32} color={TOKENS.mutedLight} />
                  <div className="mt-3 text-sm">No results found for "{query}"</div>
                </div>
              )}

              {!loading && query && results.length > 0 && (
                <div className="py-2">
                  {typeOrder.map(type => {
                    const typeResults = groupedResults[type];
                    if (!typeResults || typeResults.length === 0) return null;

                    return (
                      <div key={type} className="mb-4">
                        <div className="px-5 py-1.5 text-xs font-semibold text-muted-light uppercase tracking-wider">
                          {typeLabels[type]}
                        </div>
                        {typeResults.map((result, _idx) => {
                          const isSelected = selectedIndex === results.indexOf(result);
                          return (
                            <button
                              key={result.id}
                              onClick={() => selectResult(result)}
                              className={cx(
                                'w-full flex items-center gap-3 px-5 py-2.5 text-left border-none cursor-pointer',
                                'transition-colors duration-100',
                                isSelected ? 'bg-accent/10' : 'hover:bg-black/[.03]'
                              )}
                            >
                              <Icon
                                name={result.icon || 'file'}
                                size={16}
                                color={isSelected ? TOKENS.accent : TOKENS.mutedLight}
                              />
                              <div className="flex-1 min-w-0">
                                <div className={cx(
                                  'text-sm font-medium truncate',
                                  isSelected ? 'text-accent' : 'text-text'
                                )}>
                                  {result.title}
                                </div>
                                {result.subtitle && (
                                  <div className="text-xs text-muted-light truncate">
                                    {result.subtitle}
                                  </div>
                                )}
                              </div>
                              {result.meta?.score && (
                                <div className="text-xs text-muted-light">
                                  {Math.round(result.meta.score * 100)}%
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-2 border-t border-black/[.08] flex items-center justify-between text-xs text-muted-light">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-black/[.04] rounded font-mono">↑↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-black/[.04] rounded font-mono">↵</kbd>
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

// Export for window global
if (typeof window !== 'undefined') {
  (window as any).GlobalSearch = GlobalSearch;
}