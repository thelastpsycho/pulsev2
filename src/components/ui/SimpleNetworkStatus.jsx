// ============================================================================
// Simple Network Status Component (JSX version for compatibility)
// ============================================================================

import { useState, useEffect } from 'react';

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") }
});

const w = safeWindow();
const Icon = w.UI.Icon;
const TOKENS = w.UI.TOKENS;

function SimpleNetworkStatus() {
  const [status, setStatus] = useState('online');

  useEffect(() => {
    // Set initial status
    Promise.resolve().then(() => setStatus(navigator.onLine ? 'online' : 'offline'));

    const handleOnline = () => {
      console.log('[Network] Connection restored');
      setStatus('online');
      if (window.toast) {
        window.toast.success('Connection restored.');
      }
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      setStatus('offline');
      if (window.toast) {
        window.toast.error('You are offline. Some features may be limited.');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
      default:
        return {
          icon: 'check-circle',
          color: TOKENS.success,
          label: 'Online',
          bgColor: 'bg-success/10',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      {/* Status Indicator */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${config.bgColor}`}
        title={`Network status: ${config.label}`}
      >
        <Icon name={config.icon} size={12} color={config.color} />
        <span style={{ color: config.color }}>{config.label}</span>
      </div>
    </div>
  );
}

window.SimpleNetworkStatus = SimpleNetworkStatus;
