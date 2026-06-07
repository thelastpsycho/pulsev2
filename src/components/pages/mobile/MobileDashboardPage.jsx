// ============================================================================
// Mobile Dashboard Page
// Simple stats view and quick actions for mobile
// ============================================================================

import React from 'react';

const { useState, useEffect } = React;

// Helper to safely access window.PulseUI
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return {
    Icon: () => null,
    Button: () => null,
    Card: () => null,
    Skeleton: () => null,
    EmptyState: () => null,
    TOKENS: {},
    cx: (...xs) => xs.filter(Boolean).join(" ")
  };
};

const Icon = getPulseUI().Icon;
const Button = getPulseUI().Button;
const Card = getPulseUI().Card;
const Skeleton = getPulseUI().Skeleton;
const EmptyState = getPulseUI().EmptyState;
const TOKENS = getPulseUI().TOKENS || {};
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

function MobileDashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await window.PulseAPI.Stats.dashboard();
        setStats(response);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const navigate = (to) => {
    window.location.hash = '#' + to;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={80} />
        <Skeleton width="100%" height={80} />
      </div>
    );
  }

  const summary = stats?.summary || {};

  return (
    <div className="p-4 space-y-4">
      {/* Welcome message */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tighter4 m-0 leading-tight">
          {user?.name ? `Hello, ${user.name.split(' ')[0]}` : 'Dashboard'}
        </h1>
        <p className="text-[13.5px] text-muted mt-1">Here's what's happening today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Open Issues"
          value={summary.open_issues || 0}
          color={TOKENS.accent}
          icon="inbox"
        />
        <StatCard
          label="Closed Today"
          value={summary.closed_today || 0}
          color={TOKENS.success}
          icon="check"
        />
        <StatCard
          label="My Issues"
          value={summary.my_issues || 0}
          color={TOKENS.purple}
          icon="user"
        />
        <StatCard
          label="Urgent"
          value={summary.urgent || 0}
          color={TOKENS.danger}
          icon="alert"
        />
      </div>

      {/* Quick Actions */}
      <Card padding="lg">
        <div className="pt-4 pb-3.5 px-[22px] border-b border-black/5">
          <div className="text-[14.5px] font-semibold tracking-tightish">Quick Actions</div>
        </div>
        <div className="p-4 space-y-2">
          <Button
            variant="primary"
            fullWidth
            icon="plus"
            onClick={() => navigate('/mobile/issues/new')}
          >
            New Issue
          </Button>
          <Button
            variant="outline"
            fullWidth
            icon="inbox"
            onClick={() => window.dispatchEvent(new CustomEvent('mobile:navigate', { detail: 'issues' }))}
          >
            View All Issues
          </Button>
        </div>
      </Card>

      {/* Recent Activity - simple list */}
      {stats?.recent_activity && stats.recent_activity.length > 0 && (
        <Card padding="lg">
          <div className="pt-4 pb-3.5 px-[22px] border-b border-black/5">
            <div className="text-[14.5px] font-semibold tracking-tightish">Recent Activity</div>
          </div>
          <div className="divide-y divide-black/[.06]">
            {stats.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-bg grid place-items-center shrink-0">
                  <Icon name="clock" size={14} color={TOKENS.mutedLight} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-text font-medium">{activity.description || 'Activity'}</div>
                  <div className="text-[11.5px] text-muted-light mt-0.5">{activity.time || 'Recently'}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: color + '15' }}>
          <Icon name={icon} size={20} color={color} />
        </div>
        <div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums" style={{ color }}>{value}</div>
          <div className="text-[11.5px] text-muted-light">{label}</div>
        </div>
      </div>
    </Card>
  );
}

window.MobileDashboardPage = MobileDashboardPage;
