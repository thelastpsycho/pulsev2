import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
// ============================================================================
// Issues — Inbox layout (list column + detail pane), like the original
// Guest Pulse Apple-mail-style design.
// ============================================================================

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, Avatar: () => null, Pill: () => null, PriorityPill: () => null, StatusPill: () => null, Button: () => null, IconButton: () => null, Card: () => null, CardHeader: () => null, Skeleton: () => null, EmptyState: () => null, TOKENS: {} },
  Form: typeof window !== 'undefined' && window.PulseForm || { Field: () => null, Input: () => null, Textarea: () => null, Select: () => null, MultiSelect: () => null, Checkbox: () => null, Segmented: () => null },
  Overlay: typeof window !== 'undefined' && window.PulseOverlay || { Modal: () => null, Drawer: () => null, Dropdown: () => null, DropdownItem: () => null, DropdownDivider: () => null, ConfirmDialog: () => null },
  Layout: typeof window !== 'undefined' && window.PulseLayout || { navigate: () => {}, Link: () => null, PageHeader: () => null }
});

const w = safeWindow();
const IIB = w.UI.Icon; const AvIB = w.UI.Avatar; const PIB = w.UI.Pill; const StIB = w.UI.StatusPill; const BIB = w.UI.Button; const IBIB = w.UI.IconButton; const CIB = w.UI.Card; const CHIB = w.UI.CardHeader; const SIB = w.UI.Skeleton; const EIB = w.UI.EmptyState; const TIB = w.UI.TOKENS;
const FIB = w.Form.Field; const InIB = w.Form.Input; const TaIB = w.Form.Textarea; const SeIB = w.Form.Select; const MsIB = w.Form.MultiSelect; const CbIB = w.Form.Checkbox; const SgIB = w.Form.Segmented;
const MdIB = w.Overlay.Modal; const DrIB = w.Overlay.Drawer; const DdIB = w.Overlay.Dropdown; const DiIB = w.Overlay.DropdownItem; const DdvIB = w.Overlay.DropdownDivider; const CnIB = w.Overlay.ConfirmDialog;
const navIB = w.Layout.navigate; const LkIB = w.Layout.Link; const PhIB = w.Layout.PageHeader;

// =====================================================================
// MAIN — Issues inbox (list + detail two-column)
// =====================================================================
function IssuesInboxPage({ selectedId }) {
  const [allIssues, setAllIssues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issueTypes, setIssueTypes] = useState([]);
  const [filters, setFilters] = useState({
    status: "open", issue_type_id: "", department_id: "", search: "",
    sort_by: "created_at", sort_order: "desc",
  });

  const reload = useCallback(() => {
    setLoading(true);
    window.PulseAPI.Issues.list({
      ...filters, per_page: 200,
      department_id: filters.department_id ? Number(filters.department_id) : undefined,
      issue_type_id: filters.issue_type_id ? Number(filters.issue_type_id) : undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
    }).then(r => { setAllIssues(r.data); setLoading(false); });
  }, [filters]);

  useEffect(() => { Promise.resolve().then(reload); }, [reload]);

  // Load issue types
  useEffect(() => {
    window.PulseAPI.IssueTypes.list().then(r => {
      setIssueTypes(r.data.filter(t => t.is_active));
    }).catch(err => {
      console.error('Failed to load issue types:', err);
      setIssueTypes([]);
    });
  }, []);

  // Auto-select first issue if none selected and list loaded
  useEffect(() => {
    if (!selectedId && allIssues && allIssues.length > 0) {
      navIB(`/issues/${allIssues[0].id}`);
    }
  }, [allIssues, selectedId]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: "flex", flex: 1, minHeight: 0, height: "100%" }}>
      <IssuesListColumn
        issues={allIssues} loading={loading}
        selectedId={selectedId} filters={filters} setF={setF} setFilters={setFilters}
        issueTypes={issueTypes}
      />
      <IssueDetailPaneInbox id={selectedId} onChange={reload}/>
    </div>
  );
}

// =====================================================================
// LIST COLUMN
// =====================================================================
function IssuesListColumn({ issues, loading, selectedId, filters, setF, setFilters, issueTypes }) {
  const [sortOpen, setSortOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const sortRef = useRef();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await window.PulseAPI.Departments.list();
        setDepartments(response.data || []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const h = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Tab labels
  const tabs = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "", label: "All" },
  ];

  const filterLabel = {
    open: "Open issues", closed: "Closed issues", "": "All issues",
  }[filters.status] || "Issues";

  return (
    <div style={{
      width: 380, flexShrink: 0,
      borderRight: "1px solid rgba(0,0,0,0.06)",
      background: "rgba(250,250,252,0.7)",
      backdropFilter: "saturate(180%) blur(20px)",
      display: "flex", flexDirection: "column",
      minHeight: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "18px 20px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>{filterLabel}</h2>
            <div style={{ fontSize: 12.5, color: TIB.mutedLight, marginTop: 2 }}>
              {loading ? "Loading…" : `${issues?.length || 0} ${(issues?.length || 0) === 1 ? "issue" : "issues"}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <div ref={sortRef} style={{ position: "relative" }}>
              <IBIB icon="filter" onClick={() => setSortOpen(s => !s)} size={30} title="Sort"/>
              {sortOpen && (
                <div style={{
                  position: "absolute", right: 0, top: 36, zIndex: 50, minWidth: 180,
                  background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
                  borderRadius: 10, padding: 4,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
                }}>
                  <DiIB icon="clock" label="Newest first" active={filters.sort_by === "created_at"} onClick={() => { setF("sort_by", "created_at"); setSortOpen(false); }}/>
                  <DiIB icon="refresh" label="Recently updated" active={filters.sort_by === "updated_at"} onClick={() => { setF("sort_by", "updated_at"); setSortOpen(false); }}/>
                </div>
              )}
            </div>
            <IBIB icon="plus" onClick={() => navIB("/issues/new")} size={30} title="New issue"/>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(118,118,128,0.12)", borderRadius: 10,
          padding: "7px 10px", fontSize: 13.5, marginBottom: 10,
        }}>
          <IIB name="search" size={15} color={TIB.mutedLight}/>
          <input
            value={filters.search} onChange={e => setF("search", e.target.value)}
            placeholder="Search by guest, room, title, ID"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: 13.5, color: TIB.text }}
          />
          {filters.search && <button onClick={() => setF("search", "")} style={{ background: "none", border: "none", padding: 2, cursor: "pointer", display: "grid", placeItems: "center" }}><IIB name="x" size={12} color={TIB.mutedLight}/></button>}
        </div>

        {/* Status segmented */}
        <SgIB value={filters.status} onChange={v => setF("status", v)} options={tabs} style={{ width: "100%" }}/>

        {/* Filter dropdowns */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <SeIB value={filters.issue_type_id} onChange={v => setF("issue_type_id", v)} placeholder="Any issue type" options={[
            { value: "", label: "Any issue type" },
            ...issueTypes.map(t => ({ value: t.id, label: t.name }))
          ]} style={{ flex: 1 }}/>
          <SeIB value={filters.department_id} onChange={v => setF("department_id", v)} placeholder="Any department" options={[
            { value: "", label: "Any department" },
            ...departments.map(d => ({ value: d.id, label: d.name }))
          ]} style={{ flex: 1 }}/>
        </div>

        {/* Active filter chips */}
        {(filters.issue_type_id || filters.department_id) && (
          <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            {filters.issue_type_id && (
              <button onClick={() => setF("issue_type_id", "")} style={{
                display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 6px 3px 9px",
                background: "rgba(0,122,255,0.10)", color: TIB.accent, fontSize: 11.5, fontWeight: 500,
                border: "none", borderRadius: 6, cursor: "pointer",
              }}>
                Type: {issueTypes.find(t => t.id === Number(filters.issue_type_id))?.name || filters.issue_type_id}
                <IIB name="x" size={10} strokeWidth={2.5}/>
              </button>
            )}
            {filters.department_id && (
              <button onClick={() => setF("department_id", "")} style={{
                display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 6px 3px 9px",
                background: "rgba(0,122,255,0.10)", color: TIB.accent, fontSize: 11.5, fontWeight: 500,
                border: "none", borderRadius: 6, cursor: "pointer",
              }}>
                Dept: {departments.find(d => d.id === Number(filters.department_id))?.name}
                <IIB name="x" size={10} strokeWidth={2.5}/>
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 10px 24px" }}>
        {loading ? (
          <div style={{ padding: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 8px" }}>
                <SIB width={36} height={36} radius={36}/>
                <div style={{ flex: 1 }}>
                  <SIB width="60%" height={12}/>
                  <SIB width="40%" height={10} style={{ marginTop: 6 }}/>
                  <SIB width="90%" height={14} style={{ marginTop: 8 }}/>
                </div>
              </div>
            ))}
          </div>
        ) : (issues?.length || 0) === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: TIB.mutedLight }}>
            <IIB name="inbox" size={28} color="#c7c7cc"/>
            <div style={{ marginTop: 10, fontSize: 13.5 }}>No issues match this view.</div>
            {(filters.search || filters.issue_type_id || filters.department_id) && (
              <BIB variant="ghost" size="sm" onClick={() => setFilters({ status: filters.status, issue_type_id: "", department_id: "", search: "", sort_by: "created_at", sort_order: "desc" })} style={{ marginTop: 12 }}>Clear filters</BIB>
            )}
          </div>
        ) : issues.map(i => (
          <IssueListCard key={i.id} issue={i} selected={String(i.id) === String(selectedId)}/>
        ))}
      </div>
    </div>
  );
}

function IssueListCard({ issue, selected }) {
  return (
    <LkIB to={`/issues/${issue.id}`}>
      <div style={{
        display: "flex", gap: 11, padding: "12px 11px",
        borderRadius: 11, marginBottom: 2, cursor: "pointer",
        background: selected ? "#fff" : "transparent",
        boxShadow: selected ? "0 1px 2px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.06)" : "none",
        transition: "background 120ms, box-shadow 120ms",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = "rgba(0,0,0,0.025)"; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
        <AvIB name={issue.name || "?"} size={36}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "baseline" }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: TIB.text, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.name || "Unknown guest"}</div>
            <div style={{ fontSize: 11.5, color: TIB.mutedLight, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{timeAgoIB(issue.created_at)}</div>
          </div>
          <div style={{ fontSize: 12, color: TIB.muted, marginTop: 1 }}>
            #{issue.id} · {issue.room_number || issue.location || "—"}
            {issue.departments?.[0] && ` · ${issue.departments[0].name}`}
          </div>
          <div style={{
            fontSize: 13, color: TIB.text, marginTop: 6, lineHeight: 1.35,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{issue.title}</div>
          <div style={{ display: "flex", gap: 5, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            {issue.issueTypes && issue.issueTypes.length > 0 ? (
              issue.issueTypes.slice(0, 2).map((t, i) => (
                <PIB key={t.id} color={TIB.purple} style={{ fontSize: 11 }}>{t.name}</PIB>
              ))
            ) : (
              <PIB color={TIB.muted} style={{ fontSize: 11 }}>—</PIB>
            )}
            {issue.issueTypes && issue.issueTypes.length > 2 && (
              <span style={{ fontSize: 10.5, color: TIB.accent, fontWeight: 500 }}>+{issue.issueTypes.length - 2}</span>
            )}
            <StIB value={issue.status}/>
            {issue.assignedTo && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: TIB.muted, marginLeft: 2 }}>
                <IIB name="user" size={10}/> {issue.assignedTo.name.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </LkIB>
  );
}

// =====================================================================
// DETAIL PANE (inside inbox layout — no its own scroll-container/topbar)
// =====================================================================
function IssueDetailPaneInbox({ id, onChange }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actionsRef = useRef();

  const reload = useCallback(() => {
    if (!id) { setIssue(null); setLoading(false); return; }
    setLoading(true);
    window.PulseAPI.Issues.get(id).then(r => { setIssue(r.data); setLoading(false); });
  }, [id]);
  useEffect(() => { Promise.resolve().then(reload); }, [reload]);
  useEffect(() => {
    const h = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!id) {
    return (
      <div style={{ flex: 1, display: "grid", placeItems: "center", color: TIB.mutedLight, fontSize: 14, background: "#fafafa" }}>
        <div style={{ textAlign: "center" }}>
          <IIB name="inbox" size={40} color="#d2d2d7"/>
          <div style={{ marginTop: 12 }}>Select an issue to view details</div>
        </div>
      </div>
    );
  }

  if (loading || !issue) {
    return <div style={{ flex: 1, padding: 32, background: "#fafafa" }}><SIB width={240} height={28}/><SIB width={420} height={16} style={{ marginTop: 10 }}/><SIB height={160} style={{ marginTop: 20 }}/></div>;
  }

  const close = async () => {
    await window.PulseAPI.Issues.close(id);
    window.toast.success(`Issue #${id} closed`);
    reload(); onChange?.();
  };
  const reopen = async () => {
    await window.PulseAPI.Issues.reopen(id);
    window.toast.success(`Issue #${id} reopened`);
    reload(); onChange?.();
  };
  const postComment = async () => {
    if (!comment.trim()) return;
    await window.PulseAPI.Comments.create({ issue_id: id, body: comment.trim() });
    setComment(""); window.toast.success("Comment added"); reload();
  };
  const assign = async (userId) => {
    await window.PulseAPI.Issues.update(id, { assigned_to_user_id: userId });
    window.toast.success("Assignment updated"); setAssignOpen(false); reload(); onChange?.();
  };
  const doDelete = async () => {
    await window.PulseAPI.Issues.destroy(id);
    window.toast.success("Issue deleted"); navIB("/issues"); onChange?.();
  };

  return (
    <div style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "#fafafa", display: "flex", flexDirection: "column" }}>
      {/* Sticky toolbar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 28px", borderBottom: "1px solid rgba(0,0,0,0.06)",
        background: "rgba(250,250,250,0.92)", backdropFilter: "saturate(180%) blur(20px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12.5, color: TIB.mutedLight, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>#{issue.id}</span>
          <span style={{ color: "#d2d2d7" }}>·</span>
          <StIB value={issue.status}/>
          {issue.issueTypes && issue.issueTypes.length > 0 ? (
            issue.issueTypes.slice(0, 2).map((t) => (
              <PIB key={t.id} color={TIB.purple} style={{ fontSize: 11 }}>{t.name}</PIB>
            ))
          ) : (
            <PIB color={TIB.muted} style={{ fontSize: 11 }}>—</PIB>
          )}
          {issue.issueTypes && issue.issueTypes.length > 2 && (
            <span style={{ fontSize: 10.5, color: TIB.accent, fontWeight: 500 }}>+{issue.issueTypes.length - 2}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <BIB variant="ghost" size="sm" icon="user" onClick={() => setAssignOpen(true)}>{issue.assignedTo ? "Reassign" : "Assign"}</BIB>
          {issue.status === "open"
            ? <BIB variant="success" size="sm" icon="check" onClick={close}>Close</BIB>
            : <BIB variant="outline" size="sm" icon="refresh" onClick={reopen}>Reopen</BIB>
          }
          <div ref={actionsRef} style={{ position: "relative" }}>
            <IBIB icon="more" onClick={() => setActionsOpen(o => !o)} size={30}/>
            {actionsOpen && (
              <div style={{
                position: "absolute", right: 0, top: 36, zIndex: 50, minWidth: 180,
                background: "rgba(255,255,255,0.98)", backdropFilter: "blur(20px)",
                borderRadius: 10, padding: 4,
                boxShadow: "0 10px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
              }}>
                <DiIB icon="edit" label="Edit issue" onClick={() => { navIB(`/issues/${id}/edit`); setActionsOpen(false); }}/>
                <DiIB icon="download" label="Export PDF" onClick={() => setActionsOpen(false)}/>
                <DdvIB/>
                <DiIB icon="trash" label="Delete" danger onClick={() => { setConfirmDelete(true); setActionsOpen(false); }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 32px 60px", width: "100%" }}>
        {/* Title + meta */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.25 }}>{issue.title}</h1>
          <div style={{ fontSize: 13, color: TIB.muted, marginTop: 8, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            {issue.issueTypes && issue.issueTypes.length > 0 && (
              <>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <IIB name="tag" size={13} color={TIB.mutedLight}/>
                  {issue.issueTypes.slice(0, 2).map((t, i) => (
                    <span key={t.id}>{i > 0 && ", "}{t.name}</span>
                  ))}
                  {issue.issueTypes.length > 2 && <span>+{issue.issueTypes.length - 2} more</span>}
                </span>
                <span>·</span>
              </>
            )}
            <span>{fmtDateIB(issue.created_at)}</span>
            {issue.source && (<><span>·</span><span>via {issue.source}</span></>)}
          </div>
        </div>

        {/* Guest card */}
        <CIB style={{ marginBottom: 14 }}>
          <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <AvIB name={issue.name || "?"} size={44}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{issue.name || "Guest"}</div>
              <div style={{ fontSize: 12.5, color: TIB.muted, marginTop: 3 }}>
                {issue.room_number || issue.location || "—"}
                {issue.checkin_date && issue.checkout_date && ` · ${fmtDateShortIB(issue.checkin_date)} → ${fmtDateShortIB(issue.checkout_date)}`}
                {issue.nationality && ` · ${issue.nationality}`}
              </div>
            </div>
            {issue.contact && <BIB variant="outline" size="sm" icon={issue.contact.includes("@") ? "mail" : "phone"}>{issue.contact.includes("@") ? "Email" : "Call"}</BIB>}
          </div>
        </CIB>

        {/* Assignment + departments */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          <CIB>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 11, color: TIB.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Assigned to</div>
              {issue.assignedTo ? (
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <AvIB name={issue.assignedTo.name} size={26}/>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.assignedTo.name}</div>
                    {issue.assignedTo.department && <div style={{ fontSize: 11.5, color: TIB.mutedLight, marginTop: 1 }}>{issue.assignedTo.department}</div>}
                  </div>
                </div>
              ) : (
                <button onClick={() => setAssignOpen(true)} style={{ background: "none", border: "none", color: TIB.accent, fontSize: 13, cursor: "pointer", fontWeight: 500, padding: 0 }}>+ Assign user</button>
              )}
            </div>
          </CIB>
          <CIB>
            <div style={{ padding: "14px 18px" }}>
              <div style={{ fontSize: 11, color: TIB.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Departments</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {issue.departments?.length ? issue.departments.map(d => <PIB key={d.id} color={TIB.muted}>{d.name}</PIB>) : <span style={{ fontSize: 12.5, color: TIB.mutedLight, fontStyle: "italic" }}>None set</span>}
              </div>
            </div>
          </CIB>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 28 }}>
          <SectionTitleIB>Description</SectionTitleIB>
          <div style={{ fontSize: 14.5, lineHeight: 1.6, color: TIB.text, whiteSpace: "pre-wrap" }}>
            {issue.description || <span style={{ color: TIB.mutedLight, fontStyle: "italic" }}>No description.</span>}
          </div>
        </div>

        {/* Recovery */}
        {issue.recovery && (
          <div style={{ marginBottom: 28 }}>
            <SectionTitleIB>Recovery / resolution</SectionTitleIB>
            <div style={{
              background: "rgba(52,199,89,0.06)", border: "1px solid rgba(52,199,89,0.2)",
              borderRadius: 12, padding: "14px 16px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 28, background: TIB.success, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <IIB name="gift" size={14} color="#fff" strokeWidth={2}/>
              </div>
              <div style={{ flex: 1, fontSize: 14, lineHeight: 1.55, color: TIB.text }}>
                {issue.recovery}
                {issue.recovery_cost > 0 && (
                  <div style={{ marginTop: 4, fontSize: 12.5, color: TIB.muted }}>Cost: IDR {issue.recovery_cost.toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments timeline */}
        <div style={{ marginBottom: 24 }}>
          <SectionTitleIB>Activity</SectionTitleIB>
          <div style={{ position: "relative", paddingLeft: 14 }}>
            <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 1, background: "rgba(0,0,0,0.08)" }}/>
            <TimelineEntryIB icon="plus" color={TIB.accent} actor={issue.createdBy?.name || "System"} at={issue.created_at} text="Issue opened."/>
            {(issue.comments || []).map(c => (
              <TimelineEntryIB key={c.id} icon="edit" color={TIB.muted} actor={c.user.name} at={c.created_at} text={c.body}/>
            ))}
            {issue.closed_at && (
              <TimelineEntryIB icon="check" color={TIB.success} actor={issue.closedBy?.name || "Someone"} at={issue.closed_at} text="Closed the issue."/>
            )}
          </div>
        </div>

        {/* Add note */}
        {issue.status === "open" && (
          <CIB>
            <div style={{ padding: "14px 16px" }}>
              <textarea
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Add an internal note or update…" rows={2}
                style={{
                  width: "100%", border: "none", outline: "none", resize: "none",
                  fontFamily: "inherit", fontSize: 14, color: TIB.text, letterSpacing: "-0.003em",
                  background: "transparent", lineHeight: 1.5, padding: 0,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  <IBIB icon="paperclip" size={26}/>
                  <IBIB icon="image" size={26}/>
                </div>
                <BIB icon="send" onClick={postComment} disabled={!comment.trim()}>Post</BIB>
              </div>
            </div>
          </CIB>
        )}
      </div>

      {assignOpen && <AssignModalIB onClose={() => setAssignOpen(false)} onAssign={assign} current={issue.assigned_to_user_id}/>}
      <CnIB open={confirmDelete} title="Delete issue?" message={`Issue #${issue.id} will be moved to trash.`}
        confirmLabel="Delete" danger onConfirm={doDelete} onClose={() => setConfirmDelete(false)}/>
    </div>
  );
}

function SectionTitleIB({ children }) {
  return <div style={{ fontSize: 11.5, color: TIB.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 12px 0" }}>{children}</div>;
}

function TimelineEntryIB({ icon, color, actor, at, text }) {
  return (
    <div style={{ position: "relative", paddingLeft: 28, paddingBottom: 18 }}>
      <div style={{
        position: "absolute", left: -8, top: 1, width: 22, height: 22, borderRadius: 22,
        background: color, color: "#fff",
        display: "grid", placeItems: "center",
        boxShadow: "0 0 0 4px #fafafa",
      }}>
        <IIB name={icon} size={11} color="#fff" strokeWidth={2.4}/>
      </div>
      <div>
        <div style={{ fontSize: 13, color: TIB.text, lineHeight: 1.45 }}>
          <span style={{ fontWeight: 600 }}>{actor}</span>
          <span style={{ color: TIB.muted }}> · {timeAgoIB(at)}</span>
        </div>
        <div style={{ fontSize: 14, color: "#3a3a3c", marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{text}</div>
      </div>
    </div>
  );
}

function AssignModalIB({ onClose, onAssign, current }) {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await window.PulseAPI.Users.list();
        setUsers(response.data.filter(u => u.is_active));
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <MdIB title="Assign issue" onClose={onClose} width={400} padding={false}>
      <div style={{ padding: 12 }}>
        <InIB value={q} onChange={setQ} icon="search" placeholder="Search users…" autoFocus/>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto", padding: "0 6px 12px" }}>
        <button onClick={() => onAssign(null)} style={{
          display: "flex", width: "100%", padding: "8px 10px", border: "none",
          background: !current ? "rgba(0,122,255,0.08)" : "transparent",
          cursor: "pointer", alignItems: "center", gap: 10, borderRadius: 8, fontFamily: "inherit", textAlign: "left",
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 28, background: "#f2f2f5", display: "grid", placeItems: "center" }}>
            <IIB name="x" size={13} color={TIB.muted}/>
          </div>
          <span style={{ fontSize: 13.5, color: TIB.muted, flex: 1 }}>Unassigned</span>
          {!current && <IIB name="check" size={14} color={TIB.accent}/>}
        </button>
        {filtered.map(u => (
          <button key={u.id} onClick={() => onAssign(u.id)} style={{
            display: "flex", width: "100%", padding: "8px 10px", border: "none",
            background: u.id === current ? "rgba(0,122,255,0.08)" : "transparent",
            cursor: "pointer", alignItems: "center", gap: 10, borderRadius: 8, fontFamily: "inherit", textAlign: "left",
          }}
          onMouseEnter={(e) => { if (u.id !== current) e.currentTarget.style.background = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={(e) => { if (u.id !== current) e.currentTarget.style.background = "transparent"; }}>
            <AvIB name={u.name} size={28}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: TIB.text, fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: TIB.mutedLight }}>{u.roles?.[0]?.name} {u.department && `· ${u.department}`}</div>
            </div>
            {u.id === current && <IIB name="check" size={14} color={TIB.accent}/>}
          </button>
        ))}
      </div>
    </MdIB>
  );
}

function timeAgoIB(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s/60)}m ago`;
  if (s < 86400) return `${Math.round(s/3600)}h ago`;
  return `${Math.round(s/86400)}d ago`;
}
function fmtDateIB(iso) { if (!iso) return "—"; return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }); }
function fmtDateShortIB(iso) { if (!iso) return "—"; return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }); }

window.PageIssuesInbox = IssuesInboxPage;
