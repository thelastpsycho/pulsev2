import { useState, useEffect } from 'react'
// ============================================================================
// Dashboard page
// ============================================================================

// Helper functions to safely access window.Pulse objects
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, Avatar: () => null, Pill: () => null, PriorityPill: () => null,
           Button: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null, EmptyState: () => null,
           TOKENS: {} };
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

      <div style={{ padding: "0 28px 60px", maxWidth: 1400 }}>
        {/* KPI tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          <KPI loading={loading} label="Open issues"     value={stats?.summary.open_issues}     icon="inbox"    accent={TD.accent}  delta="−12% vs last week" positive/>
          <KPI loading={loading} label="Urgent"          value={stats?.summary.urgent_issues}   icon="alert"    accent={TD.danger}  delta={stats?.summary.urgent_issues ? "Action needed" : "All clear"} positive={!stats?.summary.urgent_issues}/>
          <KPI loading={loading} label="Closed total"    value={stats?.summary.closed_issues}   icon="check-circle" accent={TD.success} delta="+18 this week" positive/>
          <KPI loading={loading} label="Avg. resolution" value={stats ? formatHours(stats.summary.avg_resolution_hours) : "—"} icon="clock" delta="−2.1h MoM" positive/>
        </div>

        {/* Trend + by-department */}
        <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 12, marginBottom: 14 }}>
          <CardD>
            <CardHeaderD title="Issue intake — last 14 days" subtitle="Created vs closed" right={
              <PillD color={TD.success}>↓ 12% vs prior period</PillD>
            }/>
            <div style={{ padding: "18px 22px 22px" }}>
              {trends ? <TrendChart created={trends.created_trend} closed={trends.closed_trend}/> : <SkeletonD height={180}/>}
            </div>
          </CardD>

          <CardD>
            <CardHeaderD title="By department" subtitle={byDept ? `${byDept.summary.total_open_issues} open` : "—"}/>
            <div style={{ padding: "16px 22px 18px" }}>
              {byDept?.departments.filter(d => d.total_issues > 0).slice(0, 6).map(d => (
                <DeptBar key={d.id} d={d} max={Math.max(...byDept.departments.map(x => x.total_issues))}/>
              ))}
            </div>
          </CardD>
        </div>

        {/* Needs attention + activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <CardD>
            <CardHeaderD title="Needs your attention" subtitle="Urgent & high priority, still open" action={
              <LinkD to="/issues?priority=urgent" style={{ fontSize: 13, color: TD.accent, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 2 }}>View all <IconD name="chevron-right" size={13}/></LinkD>
            }/>
            {loading ? <div style={{ padding: 20 }}><SkeletonD height={56}/></div> : <CriticalList stats={stats}/>}
          </CardD>
          <CardD>
            <CardHeaderD title="Recent activity"/>
            {loading ? <div style={{ padding: 20 }}><SkeletonD height={56}/></div> : <ActivityList/>}
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
      <div style={{ padding: "16px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: TD.muted, fontSize: 12.5, fontWeight: 500 }}>
          <IconD name={icon} size={14} color={accent || TD.mutedLight}/>
          {label}
        </div>
        <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6, color: accent || TD.text, fontVariantNumeric: "tabular-nums", minHeight: 38 }}>
          {loading ? <SkeletonD width={64} height={30}/> : value}
        </div>
        <div style={{ fontSize: 12, marginTop: 2, color: positive ? TD.success : TD.warning, display: "flex", alignItems: "center", gap: 3 }}>
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
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5, alignItems: "center" }}>
        <span style={{ color: TD.text, fontWeight: 500 }}>{d.name}</span>
        <span style={{ color: TD.mutedLight, fontVariantNumeric: "tabular-nums" }}>{d.open_issues} open · {d.total_issues} total</span>
      </div>
      <div style={{ height: 6, background: "rgba(0,0,0,0.05)", borderRadius: 6, overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${openPct}%`, height: "100%", background: TD.accent, transition: "width 400ms ease" }}/>
        <div style={{ width: `${closedPct}%`, height: "100%", background: TD.success, opacity: 0.4, transition: "width 400ms ease" }}/>
      </div>
    </div>
  );
}

function CriticalList({ stats }) {
  const issues = window.PULSE_MOCK.ISSUES
    .filter(i => i.status === "open" && (i.priority === "urgent" || i.priority === "high"))
    .sort((a, b) => (a.priority === "urgent" ? -1 : 1))
    .slice(0, 4);
  if (issues.length === 0) return <EmptyD icon="check-circle" title="Nothing urgent" description="All high-priority issues are handled." />;
  return (
    <div>
      {issues.map(i => (
        <LinkD key={i.id} to={`/issues/${i.id}`}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 22px",
            borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", transition: "background 100ms",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <AvatarD name={i.name} size={32}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.title}</div>
              <div style={{ fontSize: 12, color: TD.mutedLight, marginTop: 1 }}>{i.location} · #{i.id}</div>
            </div>
            <PriPillD value={i.priority}/>
          </div>
        </LinkD>
      ))}
    </div>
  );
}

function ActivityList() {
  const log = window.PULSE_MOCK.ACTIVITY_LOG.slice(0, 5);
  const meta = {
    issue: { icon: "edit", color: TD.muted },
  };
  return (
    <div>
      {log.map(a => (
        <LinkD key={a.id} to={`/issues/${a.subject_id}`}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 22px",
            borderTop: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", transition: "background 100ms",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.02)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <AvatarD name={a.actor.name} size={26}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: TD.text, lineHeight: 1.45 }}>{a.description}</div>
              <div style={{ fontSize: 11, color: TD.mutedLight, marginTop: 2 }}>{timeAgoShort(a.created_at)}</div>
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
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: TD.muted, marginBottom: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: TD.accent, borderRadius: 2 }}/>Created</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, background: TD.success, borderRadius: 2 }}/>Closed</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
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
