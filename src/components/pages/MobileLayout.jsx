// ============================================================================
// Mobile Layout - App shell with bottom navigation
// Dedicated mobile layout separate from desktop
// ============================================================================

import React from 'react';

const { useState, useEffect } = React;

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, Avatar: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") };
};

const Icon = getPulseUI().Icon;
const Avatar = getPulseUI().Avatar;
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

// Get mobile components (will be registered later)
const getMobileComponents = () => {
  if (typeof window !== 'undefined') {
    return {
      BottomNav: window.MobileBottomNav,
      DashboardPage: window.MobileDashboardPage,
      IssuesListPage: window.MobileIssuesListPage,
      IssueDetailPage: window.MobileIssueDetailPage,
      IssueFormPage: window.MobileIssueFormPage,
      ProfilePage: window.MobileProfilePage,
    };
  }
  return {
    BottomNav: () => null,
    DashboardPage: () => null,
    IssuesListPage: () => null,
    IssueDetailPage: () => null,
    IssueFormPage: () => null,
    ProfilePage: () => null,
  };
};

function MobileLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current user
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("gp_token");
        if (token) {
          const r = await window.PulseAPI.Auth.me();
          setUser(r.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  const comps = getMobileComponents();

  const NAV_ITEMS = [
    { id: 'dashboard', icon: 'home', label: 'Home' },
    { id: 'issues', icon: 'inbox', label: 'Issues' },
    { id: 'profile', icon: 'user', label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <comps.DashboardPage user={user} />;
      case 'issues':
        return <comps.IssuesListPage />;
      case 'profile':
        return <comps.ProfilePage user={user} />;
      default:
        return <comps.DashboardPage user={user} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Optional header bar */}
      <header className="shrink-0 h-14 border-b border-black/[.06] bg-white/95 backdrop-blur-xl flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg shrink-0 grid place-items-center bg-gradient-to-b from-[#1d1d1f] to-[#2c2c2e] shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
            <Icon name="pulse" size={16} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tighter2 leading-[1.1]">GuestPulse</div>
          </div>
        </div>
        <button
          onClick={() => {
            window.location.hash = '#/';
          }}
          className="text-[13px] text-muted-light font-medium"
        >
          Desktop
        </button>
      </header>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-16">
        {renderContent()}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <comps.BottomNav items={NAV_ITEMS} active={activeTab} onChange={setActiveTab} />
      </nav>
    </div>
  );
}

window.MobileLayout = MobileLayout;
