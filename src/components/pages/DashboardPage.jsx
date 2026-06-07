// ============================================================================
// Dashboard page
// All styling via Tailwind classes.
// ============================================================================

import React from 'react';

const { useState, useEffect } = React;

// Helper functions to safely access window.Pulse objects
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, Avatar: () => null, Pill: () => null, PriorityPill: () => null,
           Button: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null, EmptyState: () => null,
           TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") };
};

const getPulseLayout = () => {
  if (typeof window !== 'undefined' && window.PulseLayout) {
    return window.PulseLayout;
  }
  return { PageHeader: () => null, navigate: () => {}, Link: () => null };
};

const IconD = getPulseUI().Icon;
const AvatarD = getPulseUI().Avatar;
const PillD = getPulseUI().Pill;
const PriPillD = getPulseUI().PriorityPill;
const ButtonD = getPulseUI().Button;
const CardD = getPulseUI().Card;
const CardHeaderD = getPulseUI().CardHeader;
const SkeletonD = getPulseUI().Skeleton;
const EmptyD = getPulseUI().EmptyState;
const TD = getPulseUI().TOKENS;
const PageHeaderD = getPulseLayout().PageHeader;
const navD = getPulseLayout().navigate;
const LinkD = getPulseLayout().Link;

function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [byDept, setByDept] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [s, t, d] = await Promise.all([
        window.PulseAPI.Stats.dashboard(),
        window.PulseAPI.Stats.trends({ period: "daily", limit: 14 }),
        window.PulseAPI.Stats.byDepartment(),
      ]);
      setStats(s); setTrends(t); setByDept(d); setLoading(false);
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (user?.name || "").split(" ")[0];

  return (
    <div>
      <PageHeaderD
        title={`${greeting}, ${firstName}`}
        subtitle={loading ? "Loading…" : `${stats.summary.open_issues} open issues · ${stats.summary.urgent_issues} urgent need attention.`}
        actions={<ButtonD icon="plus" onClick={() => navD("/issues/new")}>New issue</ButtonD>}
        sticky={false}
      />

      <div className="px-7 pb-15 max-w-[1400px]">
        {/* KPI tiles */}
        <div className="grid grid-cols-4 gap-3 mb-3.5">
          <KPI loading={loading} label="Open issues"     value={stats?.summary.open_issues}     icon="inbox"    accent={TD.accent}  delta="−12% vs last week" positive/>
          <KPI loading={loading} label="Urgent"          value={stats?.summary.urgent_issues}   icon="alert"    accent={TD.danger}  delta={stats?.summary.urgent_issues ? "Action needed" : "All clear"} positive={!stats?.summary.urgent_issues}/>
          <KPI loading={loading} label="Closed total"    value={stats?.summary.closed_issues}   icon="check-circle" accent={TD.success} delta="+18 this week" positive/>
          <KPI loading={loading} label="Avg. resolution" value={stats ? formatHours(stats.summary.avg_resolution_hours) : "—"} icon="clock" delta="−2.1h MoM" positive/>
        </div>

        {/* Trend + by-department */}
        <div className="grid gap-3 mb-3.5 grid-cols-[1.55fr_1fr]">
          <CardD>
            <CardHeaderD title="Issue intake — last 14 days" subtitle="Created vs closed" action={
              <PillD color={TD.success}>↓ 12% vs prior period</PillD>
            }/>
            <div className="px-[22px] pt-[18px] pb-[22px]">
              {trends ? <TrendChart created={trends.created_trend} closed={trends.closed_trend}/> : <SkeletonD height={180}/>}
            </div>
          </CardD>

          <CardD>
            <CardHeaderD title="By department" subtitle={byDept ? `${byDept.summary.total_open_issues} open` : "—"}/>
            <div className="px-[22px] pt-[18px] pb-[18px]">
              {byDept?.departments.filter(d => d.total_issues > 0).slice(0, 6).map(d => (
                <DeptBar key={d.id} d={d} max={Math.max(...byDept.departments.map(x => x.total_issues))}/>
              ))}
            </div>
          </CardD>
        </div>

        {/* Needs attention + activity */}
        <div className="grid grid-cols-2 gap-3">
          <CardD>
            <CardHeaderD title="Needs your attention" subtitle="Urgent & high priority, still open" action={
              <LinkD to="/issues?priority=urgent" className="text-[13px] text-accent font-medium inline-flex items-center gap-0.5">View all <IconD name="chevron-right" size={13}/></LinkD>
            }/>
            {loading ? <div className="p-5"><SkeletonD height={56}/></div> : <CriticalList stats={stats}/>}
          </CardD>
          <CardD>
            <CardHeaderD title="Recent activity"/>
            {loading ? <div className="p-5"><SkeletonD height={56}/></div> : <ActivityList/>}
          </CardD>
        </div>
      </div>
    </div>
  );
}

function formatHours(h) {
  if (h == null) return "—";
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function KPI({ label, value, icon, accent, delta, positive, loading }) {
  return (
    <CardD>
      <div className="px-[18px] py-4">
        <div className="flex items-center gap-1.5 text-muted text-[12.5px] font-medium">
          <IconD name={icon} size={14} color={accent || TD.mutedLight}/>
          {label}
        </div>
        <div className="text-3xl font-semibold tracking-tight mt-1.5 tabular-nums min-h-9" style={{ color: accent || TD.text }}>
          {loading ? <SkeletonD width={64} height={30}/> : value}
        </div>
        <div className="text-xs mt-0.5 flex items-center gap-0.5" style={{ color: positive ? TD.success : TD.warning }}>
          {!loading && (
            <>
              <IconD name={positive ? "arrow-down" : "arrow-up"} size={11} strokeWidth={2.2}/>
              {delta}
            </>
          )}
        </div>
      </div>
    </CardD>
  );
}

function DeptBar({ d, max }) {
  const total = Math.max(1, max);
  const openPct = (d.open_issues / total) * 100;
  const closedPct = (d.closed_issues / total) * 100;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between items-center text-[12.5px] mb-1">
        <span className="text-text font-medium">{d.name}</span>
        <span className="text-muted-light tabular-nums">{d.open_issues} open · {d.total_issues} total</span>
      </div>
      <div className="h-1.5 bg-black/5 rounded-md overflow-hidden flex">
        <div
          className="h-full bg-accent transition-all duration-400 ease-out"
          style={{ width: `${openPct}%` }}
        />
        <div
          className="h-full bg-success opacity-40 transition-all duration-400 ease-out"
          style={{ width: `${closedPct}%` }}
        />
      </div>
    </div>
  );
}

function CriticalList() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const fetchCriticalIssues = async () => {
      try {
        const response = await window.PulseAPI.Issues.list({
          status: 'open',
          priority: 'urgent',
          per_page: 4
        });

        const highPriorityResponse = await window.PulseAPI.Issues.list({
          status: 'open',
          priority: 'high',
          per_page: 4
        });

        const combinedIssues = [...response.data, ...highPriorityResponse.data]
          .sort((a, b) => {
            // Sort by priority (urgent first), then by id (newest first)
            if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
            if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
            return b.id - a.id;
          })
          .slice(0, 4);

        setIssues(combinedIssues);
      } catch (error) {
        console.error('Failed to fetch critical issues:', error);
        setIssues([]);
      }
    };

    fetchCriticalIssues();
  }, []);
  if (issues.length === 0) return <EmptyD icon="check-circle" title="Nothing urgent" description="All high-priority issues are handled." />;
  return (
    <div>
      {issues.map(i => (
        <LinkD key={i.id} to={`/issues/${i.id}`}>
          <div className="flex items-center gap-3 px-[22px] py-3 border-t border-black/4 cursor-pointer transition-colors duration-100 hover:bg-black/2">
            <AvatarD name={i.name} size={32}/>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold truncate">{i.title}</div>
              <div className="text-[12px] text-muted-light mt-0.5">
                {i.location} · #{i.id}
                {i.issueTypes && i.issueTypes.length > 0 && (
                  <span className="ml-1.5">
                    · <span className="text-purple">{i.issueTypes[0].name}</span>
                    {i.issueTypes.length > 1 && <span className="text-muted"> +{i.issueTypes.length - 1}</span>}
                  </span>
                )}
              </div>
            </div>
            <PriPillD value={i.priority}/>
          </div>
        </LinkD>
      ))}
    </div>
  );
}

function ActivityList() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const response = await window.PulseAPI.Activity.list({ per_page: 5 });
        setLog(response.data || []);
      } catch (error) {
        if (error.status === 404) {
          setAvailable(false);
        } else {
          setLog([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (!available) return <EmptyD icon="clock" title="Activity log coming soon" description="This feature will be available in the next update." />;
  if (loading) return <div className="p-5 text-center text-muted">Loading activity...</div>;
  return (
    <div>
      {log.map(a => (
        <LinkD key={a.id} to={`/issues/${a.subject_id}`}>
          <div className="flex items-start gap-2.5 px-[22px] py-2.5 border-t border-black/4 cursor-pointer transition-colors duration-100 hover:bg-black/2">
            <AvatarD name={a.actor.name} size={26}/>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] text-text leading-relaxed">{a.description}</div>
              <div className="text-[11px] text-muted-light mt-0.5">{timeAgoShort(a.created_at)}</div>
            </div>
          </div>
        </LinkD>
      ))}
    </div>
  );
}

function timeAgoShort(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s/60)}m ago`;
  if (s < 86400) return `${Math.round(s/3600)}h ago`;
  return `${Math.round(s/86400)}d ago`;
}

function TrendChart({ created, closed }) {
  const w = 640, h = 200, padL = 24, padR = 12, padT = 14, padB = 26;
  const days = created.map(d => d.period);
  const maxV = Math.max(1, ...created.map(d => d.count), ...closed.map(d => d.count));
  const stepX = (w - padL - padR) / Math.max(1, days.length - 1);
  const toY = (v) => padT + (1 - v / maxV) * (h - padT - padB);
  const buildPath = (arr) => arr.reduce((acc, d, i) => acc + (i === 0 ? `M${padL + i*stepX},${toY(d.count)}` : ` L${padL + i*stepX},${toY(d.count)}`), "");
  const buildArea = (arr) => `${buildPath(arr)} L${padL + (arr.length-1)*stepX},${h - padB} L${padL},${h - padB} Z`;
  return (
    <div>
      <div className="flex gap-3.5 text-xs text-muted mb-1.5">
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-accent rounded-sm"/>Created</span>
        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-success rounded-sm"/>Closed</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full block">
        <defs>
          <linearGradient id="gp-d-c" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TD.accent} stopOpacity="0.16"/><stop offset="100%" stopColor={TD.accent} stopOpacity="0"/></linearGradient>
          <linearGradient id="gp-d-x" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TD.success} stopOpacity="0.12"/><stop offset="100%" stopColor={TD.success} stopOpacity="0"/></linearGradient>
        </defs>
        {/* y gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={padL} x2={w - padR} y1={padT + p * (h - padT - padB)} y2={padT + p * (h - padT - padB)} stroke="rgba(0,0,0,0.05)"/>
        ))}
        <path d={buildArea(created)} fill="url(#gp-d-c)"/>
        <path d={buildPath(created)} fill="none" stroke={TD.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={buildArea(closed)} fill="url(#gp-d-x)"/>
        <path d={buildPath(closed)} fill="none" stroke={TD.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* x labels — every 2 days */}
        {days.map((d, i) => i % 2 === 0 && (
          <text key={i} x={padL + i * stepX} y={h - 8} textAnchor="middle" fontSize="10.5" fill={TD.mutedLight} fontWeight="500">{new Date(d).getDate()}</text>
        ))}
      </svg>
    </div>
  );
}

window.PageDashboard = DashboardPage;
