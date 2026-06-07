/**
 * usePageTitle hook
 * Dynamically updates document.title based on current route/page
 */

import { useEffect, useRef } from 'react';

// Base app title
const BASE_TITLE = 'GuestPulse — Anvaya Bali';

// Route title mapping for static pages
const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/issues': 'Issues',
  '/issues/new': 'New Issue',
  '/reports': 'Reports',
  '/reports/custom': 'Custom Reports',
  '/reports/builder': 'Report Builder',
  '/reports/logbook': 'Logbook',
  '/statistics': 'Statistics',
  '/graphs': 'Graphs',
  '/admin/users': 'Admin — Users',
  '/admin/roles': 'Admin — Roles',
  '/admin/departments': 'Admin — Departments',
  '/admin/issue-types': 'Admin — Issue Types',
  '/profile': 'Profile',
};

// Pattern-based titles for dynamic routes
const PATTERN_TITLES: Array<{ pattern: RegExp; format: (matches: RegExpExecArray) => string }> = [
  {
    pattern: /^\/issues\/(\d+)(?:\/edit)?$/,
    format: (matches) => {
      const id = matches[1];
      const isEdit = matches.input?.includes('/edit');
      return isEdit ? `Edit Issue #${id}` : `Issue #${id}`;
    },
  },
];

/**
 * Custom hook to update page title
 * @param title - Page title (without base suffix), or null to use route-based title
 * @param deps - Optional dependencies array to re-run effect
 */
export function usePageTitle(title: string | null = null, deps: React.DependencyList = []) {
  const lastTitle = useRef<string | null>(null);

  useEffect(() => {
    let newTitle = title;

    // If no title provided, try to infer from current route
    if (newTitle === null) {
      const path = getPathFromHash();
      newTitle = getTitleFromPath(path);
    }

    // Only update if title changed
    if (newTitle && newTitle !== lastTitle.current) {
      document.title = `${newTitle} · ${BASE_TITLE}`;
      lastTitle.current = newTitle;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, ...deps]);
}

/**
 * Get page title from path
 */
function getTitleFromPath(path: string): string {
  // Check exact matches first
  if (ROUTE_TITLES[path]) {
    return ROUTE_TITLES[path];
  }

  // Check pattern matches
  for (const { pattern, format } of PATTERN_TITLES) {
    const matches = pattern.exec(path);
    if (matches) {
      return format(matches);
    }
  }

  // Default fallback
  return 'GuestPulse';
}

/**
 * Get current path from hash (for hash-based routing)
 */
function getPathFromHash(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash.slice(1); // Remove #
  return hash || '/';
}

/**
 * Set page title imperatively (for use outside React components)
 */
export function setPageTitle(title: string) {
  document.title = `${title} · ${BASE_TITLE}`;
}
