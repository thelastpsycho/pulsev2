import { useState, useEffect, useMemo } from 'react'
// ============================================================================
// Reports, Statistics, Graphs, Logbook pages
// ============================================================================

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, Avatar: () => null, Pill: () => null, Button: () => null, IconButton: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null, EmptyState: () => null, TOKENS: {} },
  Form: typeof window !== 'undefined' && window.PulseForm || { Select: () => null, Segmented: () => null, Input: () => null },
  Layout: typeof window !== 'undefined' && window.PulseLayout || { PageHeader: () => null, Tabs: () => null, Link: () => null, navigate: () => {} }
});

const w = safeWindow();
const IR = w.UI.Icon; const AvR = w.UI.Avatar; const PR = w.UI.Pill; const BR = w.UI.Button; const IBR = w.UI.IconButton; const CR = w.UI.Card; const CHR = w.UI.CardHeader; const SR = w.UI.Skeleton; const ER = w.UI.EmptyState; const TR = w.UI.TOKENS;
const SeR = w.Form.Select; const SgR = w.Form.Segmented; const InR = w.Form.Input;
const PHR = w.Layout.PageHeader; const TBR = w.Layout.Tabs; const LinkR = w.Layout.Link; const navR = w.Layout.navigate;

// =====================================================================
// REPORTS — index, monthly, yearly, logbook
// =====================================================================
function ReportsPage({ tab = "index" }) {
  const tabs = [
    { value: "index",   label: "Overview",  to: "/reports" },
    { value: "monthly", label: "Monthly",   to: "/reports/monthly" },
    { value: "yearly",  label: "Yearly",    to: "/reports/yearly" },
    { value: "logbook", label: "Logbook",   to: "/reports/logbook" },
  ];
  return (
    <div>
      <PHR title="Reports" subtitle="Export and review issue activity"
        actions={<BR variant="outline" icon="download">Export</BR>}
        tabs={
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            {tabs.map(t => (
              <LinkR key={t.value} to={t.to}>
                <div style={{
                  padding: "8px 12px", color: tab === t.value ? TR.text : TR.muted,
                  fontSize: 13.5, fontWeight: tab === t.value ? 600 : 500,
                  borderBottom: `2px solid ${tab === t.value ? TR.accent : "transparent"}`,
                  marginBottom: -1, cursor: "pointer", letterSpacing: "-0.005em",
                }}>{t.label}</div>
              </LinkR>
            ))}
          </div>
        }/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 1280 }}>
        {tab === "index"   && <ReportsIndex/>}
        {tab === "monthly" && <ReportsMonthly/>}
        {tab === "yearly"  && <ReportsYearly/>}
        {tab === "logbook" && <ReportsLogbook/>}
      </div>
    </div>
  );
}

function ReportsIndex() {
  const tiles = [
    { to: "/reports/monthly", icon: "calendar", label: "Monthly report", desc: "Issues created and closed per day for any month", color: TR.accent },
    { to: "/reports/yearly",  icon: "chart-line", label: "Yearly report", desc: "Year-over-year trends and seasonal patterns", color: TR.purple },
    { to: "/reports/logbook", icon: "book", label: "DM Logbook", desc: "Daily shift logbook for management review", color: TR.warning },
    { to: "/statistics",      icon: "chart-pie", label: "Statistics", desc: "Aggregated metrics by department and user", color: TR.success },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
      {tiles.map(t => (
        <LinkR key={t.to} to={t.to}>
          <CR hover>
            <div style={{ padding: 20, display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: `${t.color}15`, color: t.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <IR name={t.icon} size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{t.label}</div>
                <div style={{ fontSize: 13, color: TR.muted, marginTop: 4, lineHeight: 1.5 }}>{t.desc}</div>
              </div>
              <IR name="chevron-right" size={16} color={TR.mutedLight}/>
            </div>
          </CR>
        </LinkR>
      ))}
    </div>
  );
}

function ReportsMonthly() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [data, setData] = useState(null);
  useEffect(() => { window.PulseAPI.Reports.month({ year, month }).then(r => setData(r.data)); }, [year, month]);

  const monthName = new Date(year, month - 1, 1).toLocaleString([], { month: "long", year: "numeric" });
  const totalCreated = data?.reduce((s, d) => s + d.created, 0) || 0;
  const totalClosed = data?.reduce((s, d) => s + d.closed, 0) || 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <SeR value={month} onChange={v => setMonth(Number(v))} options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString([], { month: "long" }) }))} style={{ width: 160 }} placeholder=""/>
        <SeR value={year} onChange={v => setYear(Number(v))} options={[2024, 2025, 2026].map(y => ({ value: y, label: y }))} style={{ width: 100 }} placeholder=""/>
        <div style={{ flex: 1 }}/>
        <BR variant="outline" icon="download" size="sm">Export PDF</BR>
        <BR variant="outline" icon="file" size="sm">Export Excel</BR>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
        <MiniStat label="Total created" value={totalCreated} icon="plus" color={TR.accent}/>
        <MiniStat label="Total closed" value={totalClosed} icon="check" color={TR.success}/>
        <MiniStat label="Net change" value={totalCreated - totalClosed} icon={totalCreated > totalClosed ? "arrow-up" : "arrow-down"} color={totalCreated > totalClosed ? TR.warning : TR.success}/>
      </div>

      <CR>
        <CHR title={monthName} subtitle="Created vs closed per day"/>
        <div style={{ padding: "18px 22px 24px" }}>
          {data ? <DailyBarChart data={data}/> : <SR height={220}/>}
        </div>
      </CR>
    </div>
  );
}

function ReportsYearly() {
  const [year, setYear] = useState(2026);
  const [data, setData] = useState(null);
  useEffect(() => { window.PulseAPI.Reports.year({ year }).then(r => setData(r.data)); }, [year]);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <SeR value={year} onChange={v => setYear(Number(v))} options={[2024, 2025, 2026].map(y => ({ value: y, label: y }))} style={{ width: 100 }} placeholder=""/>
        <div style={{ flex: 1 }}/>
        <BR variant="outline" icon="download" size="sm">Export</BR>
      </div>
      <CR>
        <CHR title={`${year} overview`} subtitle="Issues created and closed per month"/>
        <div style={{ padding: "18px 22px 24px" }}>
          {data ? <DailyBarChart data={data.map(d => ({ day: d.month, created: d.created, closed: d.closed }))}/> : <SR height={260}/>}
        </div>
      </CR>
    </div>
  );
}

function ReportsLogbook() {
  const [date, setDate] = useState("2026-05-20");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <InR value={date} onChange={setDate} type="date" style={{ width: 170 }}/>
        <SgR value="day" onChange={() => {}} options={[{ value: "day", label: "Day" }, { value: "week", label: "Week" }]}/>
        <div style={{ flex: 1 }}/>
        <BR variant="outline" icon="download" size="sm">Export PDF</BR>
      </div>
      <CR>
        <div style={{ padding: 22 }}>
          <div style={{ borderBottom: "2px solid rgba(0,0,0,0.1)", paddingBottom: 12, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 11.5, color: TR.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Duty Manager Logbook</div>
              <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 }}>Wednesday, 20 May 2026</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: TR.muted }}>
              <div>Anvaya Beach Resort &amp; Spa Bali</div>
              <div style={{ marginTop: 2 }}>Shift: Sofia Reyes · 14:00 – 22:00</div>
            </div>
          </div>

          {window.PULSE_MOCK.ISSUES.slice(0, 6).map((i, idx) => (
            <div key={i.id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: idx < 5 ? "1px solid rgba(0,0,0,0.06)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>#{i.id} — {i.title}</div>
                <div style={{ fontSize: 11.5, color: TR.muted, fontVariantNumeric: "tabular-nums" }}>{new Date(i.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div style={{ fontSize: 12.5, color: TR.muted, marginBottom: 4 }}>{i.location} · {i.name || "—"} · Priority: {i.priority}</div>
              <div style={{ fontSize: 13, color: TR.text, lineHeight: 1.5 }}>{i.description}</div>
              {i.recovery && <div style={{ marginTop: 6, fontSize: 12.5, color: TR.success, fontStyle: "italic" }}>Recovery: {i.recovery}</div>}
            </div>
          ))}
        </div>
      </CR>
    </div>
  );
}

// =====================================================================
// STATISTICS PAGE
// =====================================================================
function StatisticsPage() {
  const [data, setData] = useState(null);
  const [byDept, setByDept] = useState(null);
  const [byUser, setByUser] = useState(null);
  useEffect(() => {
    Promise.all([
      window.PulseAPI.Stats.dashboard(),
      window.PulseAPI.Stats.byDepartment(),
      window.PulseAPI.Stats.byUser({ limit: 8 }),
    ]).then(([d, dept, usr]) => { setData(d); setByDept(dept); setByUser(usr); });
  }, []);
  return (
    <div>
      <PHR title="Statistics" subtitle="Aggregated metrics across departments, users, and priorities"
        actions={<><BR variant="outline" icon="refresh" size="md">Refresh</BR><BR variant="outline" icon="download" size="md">Export</BR></>}/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 1400 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 14 }}>
          <MiniStat label="Total" value={data?.summary.total_issues ?? "—"} icon="inbox" color={TR.text}/>
          <MiniStat label="Open" value={data?.summary.open_issues ?? "—"} icon="alert" color={TR.accent}/>
          <MiniStat label="Closed" value={data?.summary.closed_issues ?? "—"} icon="check-circle" color={TR.success}/>
          <MiniStat label="Urgent" value={data?.summary.urgent_issues ?? "—"} icon="alert" color={TR.danger}/>
          <MiniStat label="Avg. resolution" value={data ? (data.summary.avg_resolution_hours < 1 ? `${Math.round(data.summary.avg_resolution_hours * 60)}m` : `${data.summary.avg_resolution_hours.toFixed(1)}h`) : "—"} icon="clock" color={TR.purple}/>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <CR>
            <CHR title="By priority" subtitle="Open issues only"/>
            <div style={{ padding: "16px 22px 18px" }}>
              <PriorityDonut data={data?.by_priority || {}}/>
            </div>
          </CR>
          <CR>
            <CHR title="By status"/>
            <div style={{ padding: "16px 22px 18px" }}>
              <StatusSplit data={data?.by_status || {}}/>
            </div>
          </CR>
        </div>

        <CR style={{ marginBottom: 14 }}>
          <CHR title="By department" subtitle="Open / closed / closure rate"/>
          {!byDept ? <div style={{ padding: 20 }}><SR height={120}/></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <th style={thR}>Department</th>
                  <th style={{ ...thR, textAlign: "right" }}>Open</th>
                  <th style={{ ...thR, textAlign: "right" }}>Closed</th>
                  <th style={{ ...thR, textAlign: "right" }}>Total</th>
                  <th style={{ ...thR, textAlign: "right", paddingRight: 22 }}>Closure rate</th>
                </tr>
              </thead>
              <tbody>
                {byDept.departments.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td style={{ ...tdR, paddingLeft: 22, fontWeight: 500 }}>{d.name}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.open_issues}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.closed_issues}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{d.total_issues}</td>
                    <td style={{ ...tdR, textAlign: "right", paddingRight: 22 }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: "rgba(0,0,0,0.06)", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ width: `${d.closure_rate}%`, height: "100%", background: TR.success, borderRadius: 6 }}/>
                        </div>
                        <span style={{ fontSize: 12.5, color: TR.text, fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right", fontWeight: 500 }}>{d.closure_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CR>

        <CR>
          <CHR title="Top staff by completion" subtitle="Active users with assigned issues"/>
          {!byUser ? <div style={{ padding: 20 }}><SR height={120}/></div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <th style={thR}>Staff member</th>
                  <th style={{ ...thR, textAlign: "right" }}>Open</th>
                  <th style={{ ...thR, textAlign: "right" }}>Closed</th>
                  <th style={{ ...thR, textAlign: "right" }}>Created</th>
                  <th style={{ ...thR, textAlign: "right", paddingRight: 22 }}>Completion</th>
                </tr>
              </thead>
              <tbody>
                {byUser.users.filter(u => u.total_assigned > 0).map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td style={{ ...tdR, paddingLeft: 22 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AvR name={u.name} size={26}/>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11.5, color: TR.mutedLight }}>{u.roles.join(", ")}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.assigned_open}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{u.assigned_closed}</td>
                    <td style={{ ...tdR, textAlign: "right", fontVariantNumeric: "tabular-nums", color: TR.muted }}>{u.created_count}</td>
                    <td style={{ ...tdR, textAlign: "right", paddingRight: 22 }}>
                      <span style={{ fontVariantNumeric: "tabular-nums", color: u.completion_rate > 80 ? TR.success : u.completion_rate > 50 ? TR.warning : TR.muted, fontWeight: 600 }}>{u.completion_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CR>
      </div>
    </div>
  );
}

// =====================================================================
// GRAPHS PAGE
// =====================================================================
function GraphsPage() {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  useEffect(() => { window.PulseAPI.Stats.trends({ period, limit: period === "monthly" ? 12 : period === "weekly" ? 12 : 30 }).then(setData); }, [period]);

  return (
    <div>
      <PHR title="Graphs" subtitle="Visual trends across time and categories"
        actions={<SgR value={period} onChange={setPeriod} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]}/>}/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 1400 }}>
        <CR style={{ marginBottom: 14 }}>
          <CHR title="Issues created vs closed" subtitle={data ? `${data.summary.total_created} created, ${data.summary.total_closed} closed in last ${data.summary.days_analyzed} days` : "—"}/>
          <div style={{ padding: "18px 22px 22px" }}>
            {data ? <BigTrendChart created={data.created_trend} closed={data.closed_trend}/> : <SR height={260}/>}
          </div>
        </CR>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <CR>
            <CHR title="Priority distribution" subtitle="All issues"/>
            <div style={{ padding: "16px 22px 22px" }}>
              {data ? <PriorityBars data={data.priority_distribution}/> : <SR height={180}/>}
            </div>
          </CR>
          <CR>
            <CHR title="Department ranking" subtitle="Issues per department"/>
            <div style={{ padding: "16px 22px 22px" }}>
              {data ? <DepartmentBars data={data.department_ranking}/> : <SR height={180}/>}
            </div>
          </CR>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Chart components
// =====================================================================
function MiniStat({ label, value, icon, color = TR.text }) {
  return (
    <CR>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: TR.muted, fontSize: 12, fontWeight: 500 }}>
          <IR name={icon} size={13} color={color}/>
          {label}
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 4, color, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
    </CR>
  );
}

function DailyBarChart({ data }) {
  const w = 880, h = 240, padL = 30, padR = 14, padT = 14, padB = 30;
  const maxV = Math.max(1, ...data.map(d => Math.max(d.created, d.closed)));
  const barGroupWidth = (w - padL - padR) / data.length;
  const barW = Math.max(2, barGroupWidth * 0.36);
  const toY = (v) => padT + (1 - v / maxV) * (h - padT - padB);
  return (
    <div>
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: TR.muted, marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.accent, borderRadius: 2 }}/>Created</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.success, borderRadius: 2 }}/>Closed</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + p * (h - padT - padB);
          return (<g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="rgba(0,0,0,0.05)"/>
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10.5" fill={TR.mutedLight}>{Math.round(maxV * (1 - p))}</text>
          </g>);
        })}
        {data.map((d, i) => {
          const xc = padL + i * barGroupWidth + barGroupWidth / 2;
          return (
            <g key={i}>
              <rect x={xc - barW - 1} y={toY(d.created)} width={barW} height={h - padB - toY(d.created)} fill={TR.accent} rx="2"/>
              <rect x={xc + 1} y={toY(d.closed)} width={barW} height={h - padB - toY(d.closed)} fill={TR.success} rx="2" opacity="0.85"/>
              {(i % Math.max(1, Math.floor(data.length / 12)) === 0) && (
                <text x={xc} y={h - 10} textAnchor="middle" fontSize="10.5" fill={TR.mutedLight}>{d.day}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function BigTrendChart({ created, closed }) {
  const w = 1000, h = 260, padL = 36, padR = 14, padT = 14, padB = 30;
  const days = created.map(d => d.period);
  const maxV = Math.max(1, ...created.map(d => d.count), ...closed.map(d => d.count));
  const stepX = (w - padL - padR) / Math.max(1, days.length - 1);
  const toY = (v) => padT + (1 - v / maxV) * (h - padT - padB);
  const path = (arr) => arr.reduce((acc, d, i) => acc + (i === 0 ? `M${padL + i*stepX},${toY(d.count)}` : ` L${padL + i*stepX},${toY(d.count)}`), "");
  const area = (arr) => `${path(arr)} L${padL + (arr.length-1)*stepX},${h - padB} L${padL},${h - padB} Z`;
  return (
    <div>
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: TR.muted, marginBottom: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.accent, borderRadius: 2 }}/>Created</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: TR.success, borderRadius: 2 }}/>Closed</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", display: "block" }}>
        <defs>
          <linearGradient id="gp-bg-c" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TR.accent} stopOpacity="0.18"/><stop offset="100%" stopColor={TR.accent} stopOpacity="0"/></linearGradient>
          <linearGradient id="gp-bg-x" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={TR.success} stopOpacity="0.14"/><stop offset="100%" stopColor={TR.success} stopOpacity="0"/></linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = padT + p * (h - padT - padB);
          return (<g key={i}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="rgba(0,0,0,0.05)"/>
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill={TR.mutedLight}>{Math.round(maxV * (1 - p))}</text>
          </g>);
        })}
        <path d={area(created)} fill="url(#gp-bg-c)"/>
        <path d={path(created)} fill="none" stroke={TR.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={area(closed)} fill="url(#gp-bg-x)"/>
        <path d={path(closed)} fill="none" stroke={TR.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {days.map((d, i) => i % Math.max(1, Math.floor(days.length / 10)) === 0 && (
          <text key={i} x={padL + i * stepX} y={h - 10} textAnchor="middle" fontSize="10.5" fill={TR.mutedLight}>{d.length > 7 ? new Date(d).getDate() : d}</text>
        ))}
      </svg>
    </div>
  );
}

function PriorityDonut({ data }) {
  const order = [
    { key: "urgent", label: "Urgent", color: TR.urgent },
    { key: "high", label: "High", color: TR.high },
    { key: "medium", label: "Medium", color: TR.medium },
    { key: "low", label: "Low", color: TR.low },
  ];
  const total = Math.max(1, order.reduce((s, o) => s + (data[o.key] || 0), 0));
  let acc = 0;
  const segs = order.map(o => {
    const val = data[o.key] || 0;
    const start = acc / total;
    acc += val;
    return { ...o, val, start, end: acc / total };
  });
  const r = 70, sw = 24, cx = 100, cy = 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <svg viewBox="0 0 200 200" style={{ width: 180, height: 180 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={sw}/>
        {segs.map((s, i) => {
          if (s.val === 0) return null;
          const a1 = s.start * 2 * Math.PI - Math.PI / 2;
          const a2 = s.end * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
          const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
          const large = (s.end - s.start) > 0.5 ? 1 : 0;
          return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2}`} stroke={s.color} strokeWidth={sw} fill="none" strokeLinecap="butt"/>;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fill={TR.mutedLight} fontWeight="500">Open</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="28" fill={TR.text} fontWeight="600" style={{ fontVariantNumeric: "tabular-nums" }}>{total === 1 && segs.every(s => s.val === 0) ? 0 : total}</text>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {segs.map(s => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }}/>
            <span style={{ color: TR.text, flex: 1 }}>{s.label}</span>
            <span style={{ color: TR.text, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{s.val}</span>
            <span style={{ color: TR.mutedLight, fontSize: 11.5, fontVariantNumeric: "tabular-nums", width: 38, textAlign: "right" }}>{Math.round((s.val / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusSplit({ data }) {
  const total = (data.open || 0) + (data.closed || 0);
  const openPct = total ? (data.open / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
        <span style={{ fontSize: 28, fontWeight: 600, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em" }}>{total}</span>
        <span style={{ fontSize: 13, color: TR.muted }}>total issues all-time</span>
      </div>
      <div style={{ height: 12, borderRadius: 12, background: "rgba(0,0,0,0.06)", overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${openPct}%`, background: TR.accent, transition: "width 400ms ease" }}/>
        <div style={{ flex: 1, background: TR.success, opacity: 0.85 }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 13 }}>
        <div>
          <div style={{ color: TR.muted, fontSize: 12 }}><span style={{ width: 8, height: 8, background: TR.accent, borderRadius: 2, display: "inline-block", marginRight: 5 }}/>Open</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: TR.accent }}>{data.open || 0}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: TR.muted, fontSize: 12 }}>Closed<span style={{ width: 8, height: 8, background: TR.success, borderRadius: 2, display: "inline-block", marginLeft: 5 }}/></div>
          <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: TR.success }}>{data.closed || 0}</div>
        </div>
      </div>
    </div>
  );
}

function PriorityBars({ data }) {
  const max = Math.max(1, ...data.map(d => d.count));
  const colors = { urgent: TR.urgent, high: TR.high, medium: TR.medium, low: TR.low };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map(d => (
        <div key={d.priority}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ textTransform: "capitalize", color: TR.text, fontWeight: 500 }}>{d.priority}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: TR.muted }}>{d.count}</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.05)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${(d.count / max) * 100}%`, height: "100%", background: colors[d.priority], borderRadius: 8 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function DepartmentBars({ data }) {
  const max = Math.max(1, ...data.map(d => d.issue_count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.slice(0, 7).map((d, i) => (
        <div key={d.department}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: TR.text, fontWeight: 500 }}>{d.department}</span>
            <span style={{ fontVariantNumeric: "tabular-nums", color: TR.muted }}>{d.issue_count}</span>
          </div>
          <div style={{ height: 8, background: "rgba(0,0,0,0.05)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${(d.issue_count / max) * 100}%`, height: "100%", background: TR.text, borderRadius: 8 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

const thR = { padding: "10px 8px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: TR.mutedLight, textTransform: "uppercase", letterSpacing: "0.04em", paddingLeft: 22 };
const tdR = { padding: "12px 8px", color: TR.text };

window.PageReports = ReportsPage;
window.PageStatistics = StatisticsPage;
window.PageGraphs = GraphsPage;
