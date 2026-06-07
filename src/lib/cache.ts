// ============================================================================
// API Response Caching Layer
// ============================================================================

import type { CacheEntry, CacheConfig } from '@/types';

/**
 * Simple in-memory cache with localStorage persistence
 */
class APICache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly storagePrefix = 'gp_cache_';

  /**
   * Generate cache key from URL and options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Get cached value
   */
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.generateKey(url, options);

    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && this.isValid(memEntry)) {
      console.log(`[Cache HIT] ${key}`);
      return memEntry.data as T;
    }

    // Check localStorage for persisted entries
    const storageKey = this.storagePrefix + key;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.memoryCache.set(key, entry);
          console.log(`[Cache HIT] ${key} (restored from storage)`);
          return entry.data;
        } else {
          // Remove expired entry
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.error('[Cache] Failed to parse stored entry:', e);
        localStorage.removeItem(storageKey);
      }
    }

    console.log(`[Cache MISS] ${key}`);
    return null;
  }

  /**
   * Set cached value
   */
  set<T>(url: string, data: T, options?: RequestInit, config?: Partial<CacheConfig>): void {
    const key = this.generateKey(url, options);
    const ttl = config?.ttl || 5 * 60 * 1000; // Default 5 minutes
    const persist = config?.persist || false;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Persist to localStorage if configured
    if (persist) {
      try {
        const storageKey = this.storagePrefix + key;
        localStorage.setItem(storageKey, JSON.stringify(entry));
      } catch (e) {
        console.error('[Cache] Failed to persist entry:', e);
      }
    }

    console.log(`[Cache SET] ${key} (TTL: ${ttl}ms, persist: ${persist})`);
  }

  /**
   * Invalidate cache entry
   */
  invalidate(url: string, options?: RequestInit): void {
    const key = this.generateKey(url, options);
    this.memoryCache.delete(key);
    const storageKey = this.storagePrefix + key;
    localStorage.removeItem(storageKey);
    console.log(`[Cache INVALIDATE] ${key}`);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (pattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }

    // Invalidate localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const cacheKey = key.slice(this.storagePrefix.length);
        if (pattern.test(cacheKey)) {
          localStorage.removeItem(key);
        }
      }
    }

    console.log(`[Cache INVALIDATE PATTERN] ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear();

    // Clear all cache entries from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('[Cache CLEAR]');
  }

  /**
   * Get cache statistics
   */
  getStats(): { memorySize: number; storageSize: number; keys: string[] } {
    const keys = Array.from(this.memoryCache.keys());
    let storageSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        storageSize++;
      }
    }

    return {
      memorySize: this.memoryCache.size,
      storageSize,
      keys,
    };
  }
}

// ============================================================================
// Cache Configurations
// ============================================================================

export const CACHE_CONFIGS = {
  // Static data - cache for 1 hour with persistence
  departments: {
    ttl: 60 * 60 * 1000, // 1 hour
    persist: true,
    key: 'departments',
  },
  issue_types: {
    ttl: 60 * 60 * 1000, // 1 hour
    persist: true,
    key: 'issue-types',
  },
  roles: {
    ttl: 60 * 60 * 1000, // 1 hour
    persist: true,
    key: 'roles',
  },
  permissions: {
    ttl: 60 * 60 * 1000, // 1 hour
    persist: true,
    key: 'permissions',
  },

  // User data - cache for 30 minutes with persistence
  user_profile: {
    ttl: 30 * 60 * 1000, // 30 minutes
    persist: true,
    key: 'user-profile',
  },
  users_list: {
    ttl: 30 * 60 * 1000, // 30 minutes
    persist: true,
    key: 'users',
  },

  // Dashboard stats - cache for 5 minutes
  dashboard_stats: {
    ttl: 5 * 60 * 1000, // 5 minutes
    persist: false,
    key: 'dashboard',
  },

  // Issues - shorter cache as they change frequently
  issues_list: {
    ttl: 2 * 60 * 1000, // 2 minutes
    persist: false,
    key: 'issues',
  },
  issue_detail: {
    ttl: 1 * 60 * 1000, // 1 minute
    persist: false,
    key: 'issue',
  },
} as const;

// ============================================================================
// Cached API Wrapper
// ============================================================================

/**
 * Wrap API function with caching
 */
export function withCache<T>(
  apiFunc: () => Promise<T>,
  cacheKey: string,
  config?: Partial<CacheConfig>
): () => Promise<T> {
  return async (): Promise<T> => {
    // Try to get from cache first
    const cached = cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Call API and cache result
    const result = await apiFunc();
    cache.set(cacheKey, result, undefined, config);
    return result;
  };
}

/**
 * Invalidate cache on mutations
 */
export function invalidateOnMutation(
  _mutationType: 'create' | 'update' | 'delete' | 'close' | 'reopen',
  resourceType: string
): void {
  const patterns: Record<string, RegExp> = {
    issues: /^GET:\/issues/,
    departments: /^GET:\/departments/,
    issue_types: /^GET:\/issue-types/,
    users: /^GET:\/users/,
    dashboard: /^GET:\/statistics/,
  };

  const pattern = patterns[resourceType];
  if (pattern) {
    cache.invalidatePattern(pattern);
  }
}

// ============================================================================
// Global Cache Instance
// ============================================================================

export const cache = new APICache();

// Export for window global (for debugging)
if (typeof window !== 'undefined') {
  (window as any).APICache = cache;
  (window as any).CACHE_CONFIGS = CACHE_CONFIGS;
}