import { useState, useEffect, useRef, useCallback } from 'react'
// ============================================================================
// Issues — list (data table) + detail + form
// ============================================================================

// Helper functions to safely access window.Pulse objects
const safePulse = () => {
  if (typeof window !== 'undefined' && window.PulseUI && window.PulseForm && window.PulseOverlay && window.PulseLayout) {
    return {
      UI: window.PulseUI, Form: window.PulseForm, Overlay: window.PulseOverlay, Layout: window.PulseLayout
    };
  }
  return {
    UI: { Icon: () => null, Avatar: () => null, Pill: () => null, PriorityPill: () => null, StatusPill: () => null,
           Button: () => null, IconButton: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null,
           EmptyState: () => null, TOKENS: {} },
    Form: { Field: () => null, Input: () => null, Textarea: () => null, Select: () => null, MultiSelect: () => null,
            SearchableSelect: () => null, Checkbox: () => null, Segmented: () => null },
    Overlay: { Modal: () => null, Drawer: () => null, Dropdown: () => null, DropdownItem: () => null,
               DropdownDivider: () => null, ConfirmDialog: () => null },
    Layout: { navigate: () => {}, Link: () => null, PageHeader: () => null, Tabs: () => null }
  };
};

const pulse = safePulse();
const II = pulse.UI.Icon; const AvI = pulse.UI.Avatar; const PI = pulse.UI.Pill; const PrI = pulse.UI.PriorityPill;
const StI = pulse.UI.StatusPill; const BI = pulse.UI.Button; const IBI = pulse.UI.IconButton;
const CI = pulse.UI.Card; const CHI = pulse.UI.CardHeader; const SI = pulse.UI.Skeleton; const EI = pulse.UI.EmptyState;
const TI = pulse.UI.TOKENS;
const FI = pulse.Form.Field; const InI = pulse.Form.Input; const TaI = pulse.Form.Textarea; const SeI = pulse.Form.Select;
const MsI = pulse.Form.MultiSelect; const SsI = pulse.Form.SearchableSelect; const CbI = pulse.Form.Checkbox; const SgI = pulse.Form.Segmented;
const MdI = pulse.Overlay.Modal; const DrI = pulse.Overlay.Drawer; const DdI = pulse.Overlay.Dropdown;
const DiI = pulse.Overlay.DropdownItem; const DdvI = pulse.Overlay.DropdownDivider; const CnI = pulse.Overlay.ConfirmDialog;
const navI = pulse.Layout.navigate; const LkI = pulse.Layout.Link; const PhI = pulse.Layout.PageHeader; const TbI = pulse.Layout.Tabs;

// =====================================================================
// ISSUES LIST PAGE
// =====================================================================
function IssuesListPage() {
  const [issues, setIssues] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "open", priority: "", department_id: "", search: "",
    page: 1, per_page: 25, sort_by: "created_at", sort_order: "desc",
  });
  const [view, setView] = useState("table"); // table | kanban
  const [selected, setSelected] = useState(new Set());

  const departments = window.PULSE_MOCK.DEPARTMENTS;
  const issueTypes = window.PULSE_MOCK.ISSUE_TYPES;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    window.PulseAPI.Issues.list({
      ...filters,
      department_id: filters.department_id ? Number(filters.department_id) : undefined,
      priority: filters.priority || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
    }).then(r => {
      if (cancelled) return;
      setIssues(r.data); setMeta(r.meta); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(filters)]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  const tabs = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "", label: "All" },
  ];

  const toggleAll = () => {
    if (selected.size === issues?.length) setSelected(new Set());
    else setSelected(new Set(issues.map(i => i.id)));
  };
  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  return (
    <div>
      <PhI
        title="Issues"
        subtitle={loading ? "Loading…" : `${meta?.total ?? 0} ${meta?.total === 1 ? "issue" : "issues"}`}
        actions={
          <>
            <SgI value={view} onChange={setView} options={[
              { value: "table", label: "Table" }, { value: "kanban", label: "Kanban" },
            ]}/>
            <BI variant="outline" icon="download" size="md">Export</BI>
            <BI icon="plus" onClick={() => navI("/issues/new")}>New issue</BI>
          </>
        }
        tabs={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <TbI value={filters.status} onChange={v => setF("status", v)} items={tabs}/>
          </div>
        }
      />

      {/* Filter row */}
      <div style={{ padding: "16px 28px 12px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ flex: "1 1 280px", maxWidth: 360 }}>
          <InI value={filters.search} onChange={v => setF("search", v)} icon="search" placeholder="Search by title, guest, room, ID…"/>
        </div>
        <SeI value={filters.priority} onChange={v => setF("priority", v)} placeholder="Any priority" options={[
          { value: "", label: "Any priority" },
          { value: "urgent", label: "Urgent" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" },
        ]} style={{ width: 150 }}/>
        <SeI value={filters.department_id} onChange={v => setF("department_id", v)} placeholder="Any department" options={[
          { value: "", label: "Any department" },
          ...departments.filter(d => d.is_active).map(d => ({ value: d.id, label: d.name })),
        ]} style={{ width: 200 }}/>
        {(filters.priority || filters.department_id || filters.search) && (
          <BI variant="ghost" size="sm" icon="x" onClick={() => setFilters({ ...filters, search: "", priority: "", department_id: "", page: 1 })}>Clear</BI>
        )}
        <div style={{ flex: 1 }}/>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12.5, color: TI.muted }}>
          Sort:
          <SeI value={filters.sort_by} onChange={v => setF("sort_by", v)} options={[
            { value: "created_at", label: "Newest" },
            { value: "updated_at", label: "Recently updated" },
            { value: "priority", label: "Priority" },
            { value: "title", label: "Title" },
          ]} style={{ width: 170 }} placeholder=""/>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div style={{
          padding: "10px 28px", background: "rgba(0,122,255,0.06)",
          borderBottom: "1px solid rgba(0,122,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 13, color: TI.accent, fontWeight: 500,
        }}>
          <span>{selected.size} selected</span>
          <div style={{ display: "flex", gap: 6 }}>
            <BI size="sm" variant="ghost" icon="check">Close</BI>
            <BI size="sm" variant="ghost" icon="user">Assign</BI>
            <BI size="sm" variant="ghost" icon="download">Export</BI>
            <BI size="sm" variant="danger" icon="trash">Delete</BI>
          </div>
        </div>
      )}

      {view === "table" ? (
        <IssuesTable issues={issues} loading={loading} selected={selected} toggleAll={toggleAll} toggleOne={toggleOne}/>
      ) : (
        <IssuesKanban issues={issues} loading={loading}/>
      )}

      {meta && meta.last_page > 1 && (
        <Pagination meta={meta} onPage={p => setFilters(f => ({ ...f, page: p }))}/>
      )}
    </div>
  );
}

function IssuesTable({ issues, loading, selected, toggleAll, toggleOne }) {
  if (loading) {
    return (
      <div style={{ padding: "16px 28px" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
            <SI width={16} height={16}/><SI width={60} height={14}/><SI width="32%" height={14}/><SI width={120} height={14}/><SI width={60} height={20}/>
          </div>
        ))}
      </div>
    );
  }
  if (issues.length === 0) {
    return <EI icon="inbox" title="No issues match" description="Adjust your filters or create a new issue."
      action={<BI icon="plus" onClick={() => navI("/issues/new")}>New issue</BI>}/>;
  }
  return (
    <div style={{ padding: "8px 28px 24px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <Th width="32"><CbI checked={selected.size === issues.length && issues.length > 0} onChange={toggleAll}/></Th>
            <Th width="70">ID</Th>
            <Th>Title</Th>
            <Th width="170">Guest · Room</Th>
            <Th width="120">Department</Th>
            <Th width="90">Priority</Th>
            <Th width="80">Status</Th>
            <Th width="120">Assigned</Th>
            <Th width="100">Updated</Th>
            <Th width="40"></Th>
          </tr>
        </thead>
        <tbody>
          {issues.map(i => (
            <IssueRow key={i.id} issue={i} selected={selected.has(i.id)} onToggle={() => toggleOne(i.id)}/>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, width }) {
  return <th style={{ padding: "10px 8px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: TI.mutedLight, textTransform: "uppercase", letterSpacing: "0.04em", width }}>{children}</th>;
}

function IssueRow({ issue, selected, onToggle }) {
  const [h, setH] = useState(false);
  return (
    <tr
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        background: selected ? "rgba(0,122,255,0.05)" : (h ? "rgba(0,0,0,0.02)" : "transparent"),
        cursor: "pointer", transition: "background 100ms",
      }}
      onClick={(e) => { if (e.target.closest("button") || e.target.closest("input")) return; navI(`/issues/${issue.id}`); }}>
      <td style={{ padding: "10px 8px" }} onClick={e => e.stopPropagation()}><CbI checked={selected} onChange={onToggle}/></td>
      <td style={{ padding: "10px 8px", color: TI.muted, fontVariantNumeric: "tabular-nums", fontSize: 12.5, fontWeight: 500 }}>#{issue.id}</td>
      <td style={{ padding: "10px 8px" }}>
        <div style={{ fontWeight: 500, color: TI.text, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 380 }}>{issue.title}</div>
        <div style={{ fontSize: 12, color: TI.mutedLight, marginTop: 1 }}>{issue.issueTypes?.[0]?.name || "—"}</div>
      </td>
      <td style={{ padding: "10px 8px", fontSize: 12.5 }}>
        <div style={{ color: TI.text }}>{issue.name || "—"}</div>
        <div style={{ color: TI.mutedLight, marginTop: 1 }}>{issue.room_number || issue.location}</div>
      </td>
      <td style={{ padding: "10px 8px" }}>
        {issue.departments?.map(d => <PI key={d.id} color={TI.muted} style={{ marginRight: 4 }}>{d.code || d.name}</PI>)}
      </td>
      <td style={{ padding: "10px 8px" }}><PrI value={issue.priority}/></td>
      <td style={{ padding: "10px 8px" }}><StI value={issue.status}/></td>
      <td style={{ padding: "10px 8px" }}>
        {issue.assignedTo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <AvI name={issue.assignedTo.name} size={22}/>
            <span style={{ fontSize: 12.5, color: TI.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 90 }}>{issue.assignedTo.name.split(" ")[0]}</span>
          </div>
        ) : <span style={{ fontSize: 12, color: TI.mutedLight, fontStyle: "italic" }}>Unassigned</span>}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 12, color: TI.mutedLight, fontVariantNumeric: "tabular-nums" }}>{timeAgoI(issue.updated_at || issue.created_at)}</td>
      <td style={{ padding: "10px 8px" }} onClick={e => e.stopPropagation()}>
        <DdI trigger={<button style={{ background: "none", border: "none", padding: 4, cursor: "pointer", borderRadius: 6 }}><II name="more" size={15} color={TI.mutedLight}/></button>} width={170}>
          <DiI icon="eye" label="View" onClick={() => navI(`/issues/${issue.id}`)}/>
          <DiI icon="edit" label="Edit" onClick={() => navI(`/issues/${issue.id}/edit`)}/>
          <DiI icon="user" label="Assign"/>
          <DdvI/>
          {issue.status === "open"
            ? <DiI icon="check" label="Close"/>
            : <DiI icon="refresh" label="Reopen"/>}
          <DiI icon="trash" label="Delete" danger/>
        </DdI>
      </td>
    </tr>
  );
}

function IssuesKanban({ issues, loading }) {
  const columns = [
    { id: "urgent", label: "Urgent", color: TI.urgent },
    { id: "high", label: "High", color: TI.high },
    { id: "medium", label: "Medium", color: TI.medium },
    { id: "low", label: "Low", color: TI.low },
  ];
  if (loading) return <div style={{ padding: 28 }}><SI height={120}/></div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "16px 28px 24px" }}>
      {columns.map(col => {
        const items = issues.filter(i => i.priority === col.id);
        return (
          <div key={col.id} style={{ background: "#fafafa", borderRadius: 12, padding: 8, border: "1px solid rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px 10px", fontSize: 12.5, fontWeight: 600, color: TI.text }}>
              <div style={{ width: 8, height: 8, borderRadius: 8, background: col.color }}/>
              {col.label}
              <span style={{ marginLeft: "auto", fontSize: 11.5, color: TI.mutedLight, fontWeight: 500 }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 60 }}>
              {items.map(i => (
                <LkI key={i.id} to={`/issues/${i.id}`}>
                  <div style={{
                    background: "#fff", borderRadius: 10, padding: 10,
                    border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div style={{ fontSize: 11.5, color: TI.mutedLight, fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>#{i.id}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: TI.text, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", letterSpacing: "-0.005em" }}>{i.title}</div>
                    <div style={{ fontSize: 11.5, color: TI.mutedLight, marginTop: 4 }}>{i.room_number || i.location}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                      <StI value={i.status}/>
                      {i.assignedTo ? <AvI name={i.assignedTo.name} size={20}/> : <span style={{ fontSize: 10.5, color: TI.mutedLight }}>Unassigned</span>}
                    </div>
                  </div>
                </LkI>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pagination({ meta, onPage }) {
  const { current_page, last_page, total, per_page } = meta;
  const from = (current_page - 1) * per_page + 1;
  const to = Math.min(current_page * per_page, total);
  return (
    <div style={{ padding: "12px 28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ fontSize: 12.5, color: TI.muted }}>{from}–{to} of {total}</div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <BI size="sm" variant="ghost" icon="chevron-left" disabled={current_page === 1} onClick={() => onPage(current_page - 1)}>Prev</BI>
        <span style={{ fontSize: 12.5, color: TI.muted, padding: "0 8px", fontVariantNumeric: "tabular-nums" }}>Page {current_page} of {last_page}</span>
        <BI size="sm" variant="ghost" iconRight="chevron-right" disabled={current_page === last_page} onClick={() => onPage(current_page + 1)}>Next</BI>
      </div>
    </div>
  );
}

function timeAgoI(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s/60)}m`;
  if (s < 86400) return `${Math.round(s/3600)}h`;
  return `${Math.round(s/86400)}d`;
}

// =====================================================================
// ISSUE DETAIL PAGE
// =====================================================================
function IssueDetailPage({ id, user }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reload = useCallback(async () => {
    const r = await window.PulseAPI.Issues.get(id);
    setIssue(r.data); setLoading(false);
  }, [id]);

  useEffect(() => { Promise.resolve().then(reload); }, [reload]);

  if (loading || !issue) {
    return (
      <div style={{ padding: 32 }}>
        <SI width={240} height={28}/>
        <SI width={420} height={16} style={{ marginTop: 10 }}/>
        <SI height={160} style={{ marginTop: 20 }}/>
      </div>
    );
  }

  const close = async () => {
    await window.PulseAPI.Issues.close(id);
    window.toast.success(`Issue #${id} closed`);
    reload();
  };
  const reopen = async () => {
    await window.PulseAPI.Issues.reopen(id);
    window.toast.success(`Issue #${id} reopened`);
    reload();
  };
  const postComment = async () => {
    if (!comment.trim()) return;
    await window.PulseAPI.Comments.create({ issue_id: id, body: comment.trim() });
    setComment(""); window.toast.success("Comment added"); reload();
  };
  const assign = async (userId) => {
    await window.PulseAPI.Issues.update(id, { assigned_to_user_id: userId });
    window.toast.success("Assignment updated"); setAssignOpen(false); reload();
  };
  const doDelete = async () => {
    await window.PulseAPI.Issues.destroy(id);
    window.toast.success("Issue deleted"); navI("/issues");
  };

  return (
    <div>
      <PhI
        breadcrumb={[
          { label: "Issues", to: "/issues" },
          { label: `#${issue.id} · ${issue.title}` },
        ]}
        sticky={false}
        actions={
          <>
            <DdI trigger={<BI variant="outline" icon="more" size="md">Actions</BI>} width={200}>
              <DiI icon="edit" label="Edit" onClick={() => navI(`/issues/${id}/edit`)}/>
              <DiI icon="user" label="Reassign" onClick={() => setAssignOpen(true)}/>
              <DiI icon="download" label="Export PDF"/>
              <DdvI/>
              <DiI icon="trash" label="Delete" danger onClick={() => setConfirmDelete(true)}/>
            </DdI>
            {issue.status === "open"
              ? <BI variant="success" icon="check" onClick={close}>Close issue</BI>
              : <BI variant="outline" icon="refresh" onClick={reopen}>Reopen</BI>}
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 0, padding: "0 28px 60px", maxWidth: 1400 }}>
        {/* Main column */}
        <div style={{ paddingRight: 28, minWidth: 0 }}>
          {/* meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5, color: TI.mutedLight, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>#{issue.id}</span>
            <span style={{ color: TI.mutedLight }}>·</span>
            <StI value={issue.status}/>
            <PrI value={issue.priority}/>
            <span style={{ color: TI.mutedLight }}>·</span>
            <span style={{ fontSize: 12.5, color: TI.muted }}>Created {fmtDateI(issue.created_at)} by {issue.createdBy?.name || "Unknown"}</span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", margin: "0 0 8px", lineHeight: 1.25 }}>
            {issue.title}
          </h1>

          <div style={{ marginTop: 24, marginBottom: 32 }}>
            <SectionTitle>Description</SectionTitle>
            <div style={{ fontSize: 14.5, lineHeight: 1.6, color: TI.text, whiteSpace: "pre-wrap" }}>{issue.description || <span style={{ color: TI.mutedLight, fontStyle: "italic" }}>No description provided.</span>}</div>
          </div>

          {issue.recovery && (
            <div style={{ marginBottom: 32 }}>
              <SectionTitle>Recovery / resolution</SectionTitle>
              <div style={{
                background: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.2)",
                borderRadius: 12, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 26, background: TI.success, display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <II name="gift" size={14} color="#fff" strokeWidth={2}/>
                </div>
                <div style={{ flex: 1, fontSize: 14, lineHeight: 1.55, color: TI.text }}>
                  {issue.recovery}
                  {issue.recovery_cost > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12.5, color: TI.muted }}>
                      Cost: IDR {issue.recovery_cost.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments */}
          <div style={{ marginBottom: 32 }}>
            <SectionTitle>Comments &amp; activity</SectionTitle>
            <div style={{ position: "relative", paddingLeft: 14 }}>
              <div style={{ position: "absolute", left: 14, top: 6, bottom: 28, width: 1, background: "rgba(0,0,0,0.08)" }}/>
              {(issue.comments || []).length === 0 && <div style={{ paddingLeft: 14, color: TI.mutedLight, fontSize: 13.5, fontStyle: "italic" }}>No comments yet.</div>}
              {(issue.comments || []).map(c => <Comment key={c.id} c={c}/>)}
            </div>
          </div>

          {/* Add comment */}
          {issue.status === "open" && (
            <CI>
              <div style={{ padding: "14px 16px" }}>
                <TaI value={comment} onChange={setComment} placeholder="Write an update or internal note…" rows={3} style={{ border: "none", padding: 0, boxShadow: "none" }}/>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    <IBI icon="paperclip" size={26}/>
                    <IBI icon="image" size={26}/>
                  </div>
                  <BI icon="send" onClick={postComment} disabled={!comment.trim()}>Post comment</BI>
                </div>
              </div>
            </CI>
          )}
        </div>

        {/* Right sidebar */}
        <aside style={{ borderLeft: "1px solid rgba(0,0,0,0.06)", paddingLeft: 24 }}>
          <SidebarMeta label="Status">
            <StI value={issue.status}/>
          </SidebarMeta>
          <SidebarMeta label="Priority">
            <PrI value={issue.priority}/>
          </SidebarMeta>
          <SidebarMeta label="Assigned to">
            {issue.assignedTo ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AvI name={issue.assignedTo.name} size={24}/>
                <span style={{ fontSize: 13, color: TI.text, fontWeight: 500 }}>{issue.assignedTo.name}</span>
              </div>
            ) : (
              <button onClick={() => setAssignOpen(true)} style={{ background: "none", border: "none", padding: 0, color: TI.accent, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>+ Assign</button>
            )}
          </SidebarMeta>
          <SidebarMeta label="Departments">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {issue.departments?.length ? issue.departments.map(d => <PI key={d.id} color={TI.muted}>{d.name}</PI>) : <span style={{ fontSize: 12.5, color: TI.mutedLight, fontStyle: "italic" }}>None</span>}
            </div>
          </SidebarMeta>
          <SidebarMeta label="Issue type">
            {issue.issueTypes?.length ? issue.issueTypes.map(t => <PI key={t.id} color={TI.purple}>{t.name}</PI>) : <span style={{ fontSize: 12.5, color: TI.mutedLight, fontStyle: "italic" }}>—</span>}
          </SidebarMeta>

          <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0 14px" }}/>

          <SidebarMeta label="Guest">
            <div style={{ fontSize: 13.5, color: TI.text, fontWeight: 500 }}>{issue.name || "—"}</div>
            {issue.nationality && <div style={{ fontSize: 12, color: TI.muted, marginTop: 1 }}>{issue.nationality}</div>}
          </SidebarMeta>
          <SidebarMeta label="Room"><span style={{ fontSize: 13.5, color: TI.text }}>{issue.room_number || issue.location || "—"}</span></SidebarMeta>
          <SidebarMeta label="Stay">
            {issue.checkin_date && issue.checkout_date
              ? <span style={{ fontSize: 13, color: TI.text }}>{fmtDateShort(issue.checkin_date)} → {fmtDateShort(issue.checkout_date)}</span>
              : <span style={{ fontSize: 12.5, color: TI.mutedLight, fontStyle: "italic" }}>—</span>}
          </SidebarMeta>
          <SidebarMeta label="Contact">
            {issue.contact ? <span style={{ fontSize: 13, color: TI.text, wordBreak: "break-all" }}>{issue.contact}</span> : <span style={{ fontSize: 12.5, color: TI.mutedLight, fontStyle: "italic" }}>—</span>}
          </SidebarMeta>
          <SidebarMeta label="Source"><span style={{ fontSize: 13, color: TI.text }}>{issue.source || "—"}</span></SidebarMeta>

          <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "14px 0 14px" }}/>

          <SidebarMeta label="Created"><span style={{ fontSize: 12.5, color: TI.text }}>{fmtDateI(issue.created_at)}</span></SidebarMeta>
          <SidebarMeta label="Updated"><span style={{ fontSize: 12.5, color: TI.text }}>{fmtDateI(issue.updated_at)}</span></SidebarMeta>
          {issue.closed_at && (
            <SidebarMeta label="Closed">
              <div style={{ fontSize: 12.5, color: TI.text }}>{fmtDateI(issue.closed_at)}</div>
              {issue.closedBy && <div style={{ fontSize: 12, color: TI.muted, marginTop: 1 }}>by {issue.closedBy.name}</div>}
            </SidebarMeta>
          )}
        </aside>
      </div>

      {assignOpen && <AssignModal onClose={() => setAssignOpen(false)} onAssign={assign} current={issue.assigned_to_user_id}/>}
      <CnI open={confirmDelete} title="Delete issue?" message={`Issue #${issue.id} will be moved to trash. This action can be reversed by an administrator.`}
        confirmLabel="Delete" danger onConfirm={doDelete} onClose={() => setConfirmDelete(false)}/>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11.5, color: TI.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px 0" }}>{children}</div>;
}

function SidebarMeta({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11.5, color: TI.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function Comment({ c }) {
  return (
    <div style={{ position: "relative", paddingLeft: 28, paddingBottom: 16 }}>
      <div style={{ position: "absolute", left: -3, top: 1, width: 28, height: 28, borderRadius: 28, background: "#fff", display: "grid", placeItems: "center" }}>
        <AvI name={c.user.name} size={26}/>
      </div>
      <div style={{ background: "#fafafa", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: TI.text }}>{c.user.name}</span>
          <span style={{ fontSize: 11.5, color: TI.mutedLight }}>{fmtDateI(c.created_at)}</span>
        </div>
        <div style={{ fontSize: 13.5, color: TI.text, lineHeight: 1.5 }}>{c.body}</div>
      </div>
    </div>
  );
}

function AssignModal({ onClose, onAssign, current }) {
  const users = window.PULSE_MOCK.USERS.filter(u => u.is_active);
  const [q, setQ] = useState("");
  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <MdI title="Assign issue" onClose={onClose} width={400} padding={false}>
      <div style={{ padding: 12 }}>
        <InI value={q} onChange={setQ} icon="search" placeholder="Search users…" autoFocus/>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto", padding: "0 6px 12px" }}>
        <UnassignButton onClick={() => onAssign(null)} active={!current}/>
        {filtered.map(u => (
          <button key={u.id} onClick={() => onAssign(u.id)} style={{
            display: "flex", width: "100%", padding: "8px 10px", border: "none",
            background: u.id === current ? "rgba(0,122,255,0.08)" : "transparent",
            cursor: "pointer", alignItems: "center", gap: 10, borderRadius: 8, fontFamily: "inherit", textAlign: "left",
          }}
          onMouseEnter={(e) => { if (u.id !== current) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={(e) => { if (u.id !== current) e.currentTarget.style.background = "transparent"; }}>
            <AvI name={u.name} size={28}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: TI.text, fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: TI.mutedLight }}>{u.roles?.[0]?.name} {u.department && `· ${u.department}`}</div>
            </div>
            {u.id === current && <II name="check" size={14} color={TI.accent}/>}
          </button>
        ))}
      </div>
    </MdI>
  );
}

function UnassignButton({ onClick, active }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", width: "100%", padding: "8px 10px", border: "none",
      background: active ? "rgba(0,122,255,0.08)" : "transparent",
      cursor: "pointer", alignItems: "center", gap: 10, borderRadius: 8, fontFamily: "inherit", textAlign: "left",
    }}>
      <div style={{ width: 28, height: 28, borderRadius: 28, background: "#f2f2f5", display: "grid", placeItems: "center" }}>
        <II name="x" size={13} color={TI.muted}/>
      </div>
      <span style={{ fontSize: 13.5, color: TI.muted, flex: 1 }}>Unassigned</span>
    </button>
  );
}

function fmtDateI(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function fmtDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

// =====================================================================
// ISSUE FORM PAGE (create + edit)
// =====================================================================
function IssueFormPage({ id }) {
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", location: "", name: "", room_number: "",
    checkin_date: "", checkout_date: "", issue_date: new Date().toISOString().slice(0,10),
    source: "", nationality: "", contact: "",
    priority: "medium", department_ids: [], issue_type_ids: [],
    assigned_to_user_id: null,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      window.PulseAPI.Issues.get(id).then(r => {
        const i = r.data;
        setForm({
          title: i.title || "", description: i.description || "", location: i.location || "",
          name: i.name || "", room_number: i.room_number || "",
          checkin_date: i.checkin_date || "", checkout_date: i.checkout_date || "",
          issue_date: i.issue_date || "", source: i.source || "In-person",
          nationality: i.nationality || "", contact: i.contact || "",
          priority: i.priority || "medium",
          department_ids: i.departments?.map(d => d.id) || [],
          issue_type_ids: i.issueTypes?.map(t => t.id) || [],
          assigned_to_user_id: i.assigned_to_user_id,
        });
        setLoading(false);
      });
    }
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.priority) errs.priority = "Priority is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSaving(true);
    try {
      if (isEdit) {
        await window.PulseAPI.Issues.update(id, form);
        window.toast.success("Issue updated");
        navI(`/issues/${id}`);
      } else {
        const r = await window.PulseAPI.Issues.create(form);
        window.toast.success("Issue created");
        navI(`/issues/${r.data.id}`);
      }
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: 32 }}><SI height={300}/></div>;

  const [departments, setDepartments] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Load real data from API instead of mock data
    Promise.all([
      window.PulseAPI.Departments.list(),
      window.PulseAPI.IssueTypes.list(),
      window.PulseAPI.Users.list()
    ]).then(([deptRes, typesRes, usersRes]) => {
      setDepartments(deptRes.data.filter(d => d.is_active));
      setIssueTypes(typesRes.data.filter(t => t.is_active));
      setUsers(usersRes.data.filter(u => u.is_active));
    }).catch(err => {
      // Fallback to mock data if API fails
      setDepartments(window.PULSE_MOCK.DEPARTMENTS.filter(d => d.is_active));
      setIssueTypes(window.PULSE_MOCK.ISSUE_TYPES.filter(t => t.is_active));
      setUsers(window.PULSE_MOCK.USERS.filter(u => u.is_active));
    });
  }, []);

  return (
    <div>
      <PhI
        breadcrumb={[
          { label: "Issues", to: "/issues" },
          { label: isEdit ? `Edit #${id}` : "New issue" },
        ]}
        sticky={false}
        actions={
          <>
            <BI variant="ghost" onClick={() => isEdit ? navI(`/issues/${id}`) : navI("/issues")}>Cancel</BI>
            <BI icon={isEdit ? "check" : "plus"} loading={saving} onClick={submit}>{isEdit ? "Save changes" : "Create issue"}</BI>
          </>
        }
      />

      <div style={{ maxWidth: 880, padding: "0 28px 60px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 32 }}>
        <div style={{ minWidth: 0 }}>
          <SectionLabel>Issue</SectionLabel>
          <FI label="Title" required error={errors.title}>
            <InI value={form.title} onChange={v => set("title", v)} placeholder="e.g. AC not cooling in master bedroom" autoFocus/>
          </FI>
          <FI label="Description" hint="What did the guest report? Times, severity, any context.">
            <TaI value={form.description} onChange={v => set("description", v)} rows={5} placeholder="Detailed description…"/>
          </FI>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FI label="Departments" hint="Choose one or more">
              <MsI value={form.department_ids} onChange={v => set("department_ids", v)} options={departments.map(d => ({ value: d.id, label: d.name }))}/>
            </FI>
            <FI label="Issue types">
              <MsI value={form.issue_type_ids} onChange={v => set("issue_type_ids", v)} options={issueTypes.map(t => ({ value: t.id, label: t.name }))}/>
            </FI>
          </div>

          <SectionLabel style={{ marginTop: 20 }}>Guest details</SectionLabel>
            <FI label="Guest name"><InI value={form.name} onChange={v => set("name", v)} icon="user" placeholder="Mr. / Ms. …"/></FI>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FI label="Room / Villa"><InI value={form.room_number} onChange={v => set("room_number", v)} placeholder="e.g. 805 or OV-12"/></FI>
            <FI label="Source"><InI value={form.source} onChange={v => set("source", v)} placeholder="Booking.com, Agoda, etc."/></FI>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
            <FI label="Check-in / Check-out">
              <window.DateRangePicker
                checkinDate={form.checkin_date}
                checkoutDate={form.checkout_date}
                onChange={({ checkin_date, checkout_date }) => {
                  set("checkin_date", checkin_date);
                  set("checkout_date", checkout_date);
                }}
              />
            </FI>
            <FI label="Issue date" required><InI value={form.issue_date} onChange={v => set("issue_date", v)} type="date"/></FI>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FI label="Nationality">
              <SsI
                value={form.nationality}
                onChange={v => set("nationality", v)}
                placeholder="Select nationality…"
                options={window.PULSE_MOCK.NATIONALITIES.map(n => ({ value: n.name, label: n.name }))}
              />
            </FI>
            <FI label="Contact"><InI value={form.contact} onChange={v => set("contact", v)} icon="phone" placeholder="phone or email"/></FI>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            
          </div>
        </div>

        <aside>
          <SectionLabel>Routing</SectionLabel>
          <FI label="Priority" required error={errors.priority}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { v: "urgent", desc: "VIP, safety, major failure" },
                { v: "high",   desc: "Significant impact" },
                { v: "medium", desc: "Standard complaint" },
                { v: "low",    desc: "Minor inconvenience" },
              ].map(o => {
                const meta = window.PulseUI.PRIORITY[o.v];
                const sel = form.priority === o.v;
                return (
                  <button key={o.v} type="button" onClick={() => set("priority", o.v)} style={{
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    padding: "9px 12px", border: "1px solid", fontFamily: "inherit",
                    borderColor: sel ? meta.color : "rgba(0,0,0,0.08)",
                    background: sel ? `${meta.color}10` : "#fff",
                    borderRadius: 10, cursor: "pointer", transition: "all 100ms",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: 8, background: meta.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: sel ? meta.color : TI.text }}>{meta.label}</div>
                      <div style={{ fontSize: 11.5, color: TI.mutedLight, marginTop: 1 }}>{o.desc}</div>
                    </div>
                    {sel && <II name="check" size={13} color={meta.color}/>}
                  </button>
                );
              })}
            </div>
          </FI>
          <FI label="Assign to" hint="Optional. Can be set later.">
            <SeI value={form.assigned_to_user_id || ""} onChange={v => set("assigned_to_user_id", v ? Number(v) : null)}
              placeholder="Unassigned"
              options={[{ value: "", label: "Unassigned" }, ...users.map(u => ({ value: u.id, label: u.name }))]}/>
          </FI>
        </aside>
      </div>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return <div style={{ fontSize: 11.5, color: TI.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, ...style }}>{children}</div>;
}

window.PageIssuesList = IssuesListPage;
window.PageIssueDetail = IssueDetailPage;
window.PageIssueForm = IssueFormPage;
