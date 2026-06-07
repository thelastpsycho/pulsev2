// ============================================================================
// Mobile Profile Page
// User information and logout
// ============================================================================

import React from 'react';

const { useState, useEffect } = React;

// Helper to safely access window components
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return {
    Icon: () => null,
    Button: () => null,
    IconButton: () => null,
    Card: () => null,
    Avatar: () => null,
    Skeleton: () => null,
    TOKENS: {},
    cx: (...xs) => xs.filter(Boolean).join(" ")
  };
};

const Icon = getPulseUI().Icon;
const Button = getPulseUI().Button;
const IconButton = getPulseUI().IconButton;
const Card = getPulseUI().Card;
const Avatar = getPulseUI().Avatar;
const Skeleton = getPulseUI().Skeleton;
const TOKENS = getPulseUI().TOKENS || {};
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

function MobileProfilePage({ user: userProp }) {
  const [user, setUser] = useState(userProp);
  const [loading, setLoading] = useState(!userProp);

  useEffect(() => {
    if (!userProp) {
      // Fetch user from API if not provided
      const fetchUser = async () => {
        try {
          const token = localStorage.getItem("gp_token");
          if (token) {
            const r = await window.PulseAPI.Auth.me();
            setUser(r.user);
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userProp]);

  const handleSignOut = async () => {
    try {
      await window.PulseAPI.Auth.logout();
      localStorage.removeItem("gp_token");
      window.location.hash = '#/login';
    } catch (error) {
      console.error('Failed to sign out:', error);
      localStorage.removeItem("gp_token");
      window.location.hash = '#/login';
    }
  };

  const navigate = (to) => {
    window.location.hash = '#' + to;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton width={120} height={120} radius={120} className="mx-auto" />
        <Skeleton width="60%" height={24} className="mx-auto" />
        <Skeleton width="40%" height={16} className="mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <Button onClick={() => navigate('/login')} variant="primary" fullWidth>
          Sign In
        </Button>
      </div>
    );
  }

  const userPermissions = user.permissions || [];
  const permissionCount = userPermissions.length;

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <Card>
        <div className="p-6 flex flex-col items-center text-center">
          <Avatar name={user.name} size={80} className="mb-4" />
          <h1 className="text-xl font-semibold tracking-tight m-0 mb-1">{user.name}</h1>
          <p className="text-[13px] text-muted mb-1">{user.email}</p>
          <div className="text-[12px] text-muted-light">
            {user.roles?.[0]?.name || 'User'}
            {user.department && ` · ${user.department}`}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold tabular-nums" style={{ color: TOKENS.accent }}>
            {permissionCount}
          </div>
          <div className="text-[11.5px] text-muted-light mt-1">Permissions</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-semibold tabular-nums" style={{ color: TOKENS.success }}>
            {user.roles?.length || 1}
          </div>
          <div className="text-[11.5px] text-muted-light mt-1">Roles</div>
        </Card>
      </div>

      {/* Account Actions */}
      <Card>
        <div className="divide-y divide-black/[.06]">
          <AccountAction
            icon="user"
            label="My Profile"
            onClick={() => navigate('/profile')}
          />
          <AccountAction
            icon="settings"
            label="Preferences"
            onClick={() => navigate('/profile')}
          />
          <AccountAction
            icon="smartphone"
            label="Switch to Desktop"
            onClick={() => navigate('/')}
          />
        </div>
      </Card>

      {/* Sign Out */}
      <Button
        variant="danger"
        size="lg"
        fullWidth
        icon="logout"
        onClick={handleSignOut}
      >
        Sign Out
      </Button>

      {/* App Info */}
      <div className="text-center py-4">
        <div className="text-[11px] text-muted-light">GuestPulse v1.0</div>
        <div className="text-[10px] text-muted-light mt-0.5">Anvaya Bali</div>
      </div>
    </div>
  );
}

function AccountAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 text-left bg-transparent border-none cursor-pointer hover:bg-black/[.02] transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-bg grid place-items-center shrink-0">
        <Icon name={icon} size={16} color={TOKENS.mutedLight} />
      </div>
      <span className="text-[14px] text-text font-medium flex-1">{label}</span>
      <Icon name="chevron-right" size={16} color={TOKENS.mutedLight} />
    </button>
  );
}

window.MobileProfilePage = MobileProfilePage;
