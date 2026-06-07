// ============================================================================
// Application Initialization
// ============================================================================

import { initShortcuts } from './shortcuts';
import { initNetworkStatus } from '../components/ui/NetworkStatus';

/**
 * Initialize all GuestPulse systems
 */
export function initializeGuestPulse() {
  console.log('[GuestPulse] Initializing systems...');

  // Initialize keyboard shortcuts
  initShortcuts();

  // Initialize network status monitoring
  initNetworkStatus();

  console.log('[GuestPulse] All systems initialized');

  // Show ready toast
  if (typeof window !== 'undefined' && window.toast) {
    window.toast.success('GuestPulse ready! Press ? for shortcuts, ⌘K to search.');
  }
}

/**
 * Cleanup on application unmount
 */
export function cleanupGuestPulse() {
  console.log('[GuestPulse] Cleaning up...');

  // Cleanup keyboard shortcuts
  if (typeof window !== 'undefined' && (window as any).cleanupShortcuts) {
    (window as any).cleanupShortcuts();
  }

  // Cleanup network manager
  if (typeof window !== 'undefined' && (window as any).networkManager) {
    (window as any).networkManager.destroy();
  }

  console.log('[GuestPulse] Cleanup complete');
}

// Auto-initialize if this is the browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGuestPulse);
  } else {
    initializeGuestPulse();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanupGuestPulse);
}
