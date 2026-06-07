// ============================================================================
// Network Status Indicator Component
// ============================================================================

import { useState, useEffect } from 'react';
import type { NetworkStatus, QueuedRequest } from '@/types';

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
 * Network Status Manager
 */
class NetworkManager {
  private status: NetworkStatus = 'online';
  private queuedRequests: QueuedRequest[] = [];
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private retryTimeout: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Initialize status
      this.status = navigator.onLine ? 'online' : 'offline';

      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Listen for visibility change to retry when tab becomes visible
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleOnline = () => {
    console.log('[Network] Connection restored');
    this.setStatus('online');
    this.processQueuedRequests();
  };

  private handleOffline = () => {
    console.log('[Network] Connection lost');
    this.setStatus('offline');
  };

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.status === 'offline' && navigator.onLine) {
      console.log('[Network] Tab visible, retrying connection...');
      this.setStatus('connecting');
      this.processQueuedRequests();
    }
  };

  private setStatus(status: NetworkStatus) {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(listener => listener(status));

      // Show toast notification
      if (typeof window !== 'undefined' && window.toast) {
        if (status === 'offline') {
          window.toast.error('You are offline. Some features may be limited.');
        } else if (status === 'online') {
          window.toast.success('Connection restored.');
        }
      }
    }
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return this.status;
  }

  /**
   * Queue a request for when connection is restored
   */
  queueRequest(url: string, options: RequestInit): void {
    const request: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      url,
      options,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queuedRequests.push(request);
    console.log(`[Network] Queued request: ${url}`);

    // Persist to localStorage
    this.saveQueuedRequests();
  }

  /**
   * Process queued requests
   */
  private async processQueuedRequests() {
    if (this.queuedRequests.length === 0) return;

    console.log(`[Network] Processing ${this.queuedRequests.length} queued requests`);

    const requests = [...this.queuedRequests];
    this.queuedRequests = [];

    for (const request of requests) {
      try {
        console.log(`[Network] Retrying request: ${request.url}`);

        const response = await fetch(request.url, request.options);

        if (response.ok) {
          console.log(`[Network] Request succeeded: ${request.url}`);
        } else {
          throw new Error(`Request failed: ${response.status}`);
        }
      } catch (error) {
        console.error(`[Network] Request failed: ${request.url}`, error);

        // Re-queue with retry limit
        if (request.retries < 3) {
          request.retries++;
          this.queuedRequests.push(request);
        } else {
          console.error(`[Network] Giving up on request after 3 retries: ${request.url}`);
        }
      }
    }

    // Update persistence
    this.saveQueuedRequests();

    // If still have queued requests, retry later
    if (this.queuedRequests.length > 0) {
      this.retryTimeout = window.setTimeout(() => {
        this.processQueuedRequests();
      }, 5000);
    }
  }

  /**
   * Save queued requests to localStorage
   */
  private saveQueuedRequests() {
    try {
      localStorage.setItem('gp_queued_requests', JSON.stringify(this.queuedRequests));
    } catch (e) {
      console.error('[Network] Failed to save queued requests:', e);
    }
  }


  /**
   * Add status change listener
   */
  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get queued requests count
   */
  getQueuedCount(): number {
    return this.queuedRequests.length;
  }

  /**
   * Clear queued requests
   */
  clearQueued(): void {
    this.queuedRequests = [];
    localStorage.removeItem('gp_queued_requests');
  }

  /**
   * Cleanup
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);

      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
      }
    }
  }
}

// ============================================================================
// Global Network Manager Instance
// ============================================================================

export const networkManager = new NetworkManager();

/**
 * Network Status Indicator Component
 */
export function NetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(networkManager.getStatus());
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    // Listen for status changes
    const unsubscribe = networkManager.addListener((newStatus) => {
      setStatus(newStatus);
    });

    // Update queued count periodically
    const interval = setInterval(() => {
      setQueuedCount(networkManager.getQueuedCount());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: 'check-circle',
          color: TOKENS.success,
          label: 'Online',
          bgColor: 'bg-success/10',
        };
      case 'offline':
        return {
          icon: 'alert',
          color: TOKENS.danger,
          label: 'Offline',
          bgColor: 'bg-danger/10',
        };
      case 'connecting':
        return {
          icon: 'clock',
          color: TOKENS.warning,
          label: 'Connecting...',
          bgColor: 'bg-warning/10',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      {/* Status Indicator */}
      <div
        className={cx(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          config.bgColor
        )}
        title={`Network status: ${config.label}${queuedCount > 0 ? `\n${queuedCount} requests queued` : ''}`}
      >
        <Icon name={config.icon as any} size={12} color={config.color} />
        <span style={{ color: config.color }}>{config.label}</span>
      </div>

      {/* Queued Requests Badge */}
      {queuedCount > 0 && (
        <div
          className="px-1.5 py-0.5 bg-accent text-white rounded text-xs font-medium"
          title={`${queuedCount} requests waiting for connection`}
        >
          {queuedCount}
        </div>
      )}
    </div>
  );
}

/**
 * Enhanced fetch wrapper that handles offline mode
 */
export async function networkFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const status = networkManager.getStatus();

  if (status === 'offline') {
    // Queue the request for when we're back online
    networkManager.queueRequest(url, options);

    // Return a fake error response
    throw new Error('You are offline. Request has been queued.');
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok && !navigator.onLine) {
      // Connection might have dropped during request
      networkManager.queueRequest(url, options);
      throw new Error('Connection lost during request. Will retry when online.');
    }

    return response;
  } catch (error) {
    if (!navigator.onLine) {
      networkManager.queueRequest(url, options);
    }
    throw error;
  }
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize network status monitoring
 */
export function initNetworkStatus() {
  console.log('[Network] Status monitoring initialized');

  // Load any queued requests from previous session
  if (networkManager.getStatus() === 'online') {
    // Process any queued requests from previous session
    (networkManager as any).processQueuedRequests?.();
  }
}

// Export for window global
if (typeof window !== 'undefined') {
  (window as any).NetworkStatus = NetworkStatus;
  (window as any).networkManager = networkManager;
  (window as any).networkFetch = networkFetch;
}