import { useState, useEffect, useRef, useCallback } from 'react'
import { usePageTitle } from '../../lib/usePageTitle'
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
const IIB = w.UI.Icon; const AvIB = w.UI.Avatar; const PIB = w.UI.Pill; const PrIB = w.UI.PriorityPill; const StIB = w.UI.StatusPill; const BIB = w.UI.Button; const IBIB = w.UI.IconButton; const CIB = w.UI.Card; const SIB = w.UI.Skeleton; const TIB = w.UI.TOKENS;
const InIB = w.Form.Input; const SeIB = w.Form.Select; const SgIB = w.Form.Segmented;
const MdIB = w.Overlay.Modal; const DiIB = w.Overlay.DropdownItem; const DdvIB = w.Overlay.DropdownDivider; const CnIB = w.Overlay.ConfirmDialog;
const navIB = w.Layout.navigate; const LkIB = w.Layout.Link;

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

  // Keyboard navigation for issue list
  useEffect(() => {
    const handleNextIssue = () => {
      if (!allIssues || allIssues.length === 0) return;
      const currentIndex = allIssues.findIndex(i => i.id === selectedId);
      const nextIndex = currentIndex < allIssues.length - 1 ? currentIndex + 1 : 0;
      navIB(`/issues/${allIssues[nextIndex].id}`);
    };

    const handlePrevIssue = () => {
      if (!allIssues || allIssues.length === 0) return;
      const currentIndex = allIssues.findIndex(i => i.id === selectedId);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : allIssues.length - 1;
      navIB(`/issues/${allIssues[prevIndex].id}`);
    };

    const handleOpenSelected = () => {
      if (selectedId) {
        navIB(`/issues/${selectedId}`);
      }
    };

    window.addEventListener('gp:issues:next', handleNextIssue);
    window.addEventListener('gp:issues:previous', handlePrevIssue);
    window.addEventListener('gp:issues:open', handleOpenSelected);

    return () => {
      window.removeEventListener('gp:issues:next', handleNextIssue);
      window.removeEventListener('gp:issues:previous', handlePrevIssue);
      window.removeEventListener('gp:issues:open', handleOpenSelected);
    };
  }, [allIssues, selectedId]);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  return (
    <div className="flex flex-1 min-h-0 h-full">
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
    { value: "verified", label: "Verified" },
    { value: "", label: "All" },
  ];

  const filterLabel = {
    open: "Open issues", closed: "Closed issues", verified: "Verified issues", "": "All issues",
  }[filters.status] || "Issues";

  return (
    <div className="w-[380px] shrink-0 flex flex-col min-h-0 border-r border-black/6 bg-[rgba(250,250,252,0.7)] backdrop-saturate-180 backdrop-blur-[20px]">
      {/* Header */}
      <div className="px-5 pb-2.5 pt-[18px]">
        <div className="flex justify-between items-baseline mb-3">
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.02em] m-0">{filterLabel}</h2>
            <div className="text-[12.5px] text-muted-light mt-0.5">
              {loading ? "Loading…" : `${issues?.length || 0} ${(issues?.length || 0) === 1 ? "issue" : "issues"}`}
            </div>
          </div>
          <div className="flex gap-1">
            <div ref={sortRef} className="relative">
              <IBIB icon="filter" onClick={() => setSortOpen(s => !s)} size={30} title="Sort"/>
              {sortOpen && (
                <div className="absolute right-0 top-9 z-50 min-w-[180px] bg-[rgba(255,255,255,0.98)] backdrop-blur-[20px] rounded-xl p-1 shadow-[0_10px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)]">
                  <DiIB icon="clock" label="Newest first" active={filters.sort_by === "created_at"} onClick={() => { setF("sort_by", "created_at"); setSortOpen(false); }}/>
                  <DiIB icon="refresh" label="Recently updated" active={filters.sort_by === "updated_at"} onClick={() => { setF("sort_by", "updated_at"); setSortOpen(false); }}/>
                </div>
              )}
            </div>
            <IBIB icon="plus" onClick={() => navIB("/issues/new")} size={30} title="New issue"/>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-black/12 rounded-xl px-2.5 py-[7px] text-[13.5px] mb-2.5">
          <IIB name="search" size={15} color={TIB.mutedLight}/>
          <input
            value={filters.search} onChange={e => setF("search", e.target.value)}
            placeholder="Search by guest, room, title, ID"
            className="flex-1 border-none outline-none bg-transparent font-inherit text-[13.5px] text-text"
          />
          {filters.search && <button onClick={() => setF("search", "")} className="bg-none border-none p-0.5 cursor-pointer grid place-items-center"><IIB name="x" size={12} color={TIB.mutedLight}/></button>}
        </div>

        {/* Status segmented */}
        <SgIB value={filters.status} onChange={v => setF("status", v)} options={tabs} className="w-full"/>

        {/* Filter dropdowns */}
        <div className="flex gap-2 mt-2.5">
          <SeIB value={filters.issue_type_id} onChange={v => setF("issue_type_id", v)} placeholder="Any issue type" options={[
            { value: "", label: "Any issue type" },
            ...issueTypes.map(t => ({ value: t.id, label: t.name }))
          ]} className="flex-1"/>
          <SeIB value={filters.department_id} onChange={v => setF("department_id", v)} placeholder="Any department" options={[
            { value: "", label: "Any department" },
            ...departments.map(d => ({ value: d.id, label: d.name }))
          ]} className="flex-1"/>
        </div>

        {/* Active filter chips */}
        {(filters.issue_type_id || filters.department_id) && (
          <div className="flex gap-1 mt-2.5 flex-wrap">
            {filters.issue_type_id && (
              <button onClick={() => setF("issue_type_id", "")} className="inline-flex items-center gap-1 px-[6px] py-[3px] bg-accent/10 text-accent text-[11.5px] font-medium border-none rounded-md cursor-pointer">
                Type: {issueTypes.find(t => t.id === Number(filters.issue_type_id))?.name || filters.issue_type_id}
                <IIB name="x" size={10} strokeWidth={2.5}/>
              </button>
            )}
            {filters.department_id && (
              <button onClick={() => setF("department_id", "")} className="inline-flex items-center gap-1 px-[6px] py-[3px] bg-accent/10 text-accent text-[11.5px] font-medium border-none rounded-md cursor-pointer">
                Dept: {departments.find(d => d.id === Number(filters.department_id))?.name}
                <IIB name="x" size={10} strokeWidth={2.5}/>
              </button>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-6 pt-1">
        {loading ? (
          <div className="p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-2.5 p-[10px_8px]">
                <SIB width={36} height={36} radius={36}/>
                <div className="flex-1">
                  <SIB width="60%" height={12} className="mt-1.5"/>
                  <SIB width="40%" height={10} className="mt-1.5"/>
                  <SIB width="90%" height={14} className="mt-2"/>
                </div>
              </div>
            ))}
          </div>
        ) : (issues?.length || 0) === 0 ? (
          <div className="px-4 py-8 text-center text-muted-light">
            <IIB name="inbox" size={28} color="#c7c7cc"/>
            <div className="mt-2.5 text-[13.5px]">No issues match this view.</div>
            {(filters.search || filters.issue_type_id || filters.department_id) && (
              <BIB variant="ghost" size="sm" onClick={() => setFilters({ status: filters.status, issue_type_id: "", department_id: "", search: "", sort_by: "created_at", sort_order: "desc" })} className="mt-3">Clear filters</BIB>
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
      <div className={`flex gap-[11px] py-3 px-[11px] rounded-[11px] mb-0.5 cursor-pointer transition-[background-color,box-shadow] duration-120 ${
        selected ? 'bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_0_0_1px_rgba(0,0,0,0.06)]' : 'bg-transparent hover:bg-black/2.5'
      }`}>
        <AvIB name={issue.name || "?"} size={36}/>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-1.5 items-baseline">
            <div className="text-[13.5px] font-semibold text-text tracking-[-0.005em] whitespace-nowrap overflow-hidden text-ellipsis">{issue.name || "Unknown guest"}</div>
            <div className="text-[11.5px] text-muted-light shrink-0 tabular-nums">{timeAgoIB(issue.created_at)}</div>
          </div>
          <div className="text-xs text-muted mt-px">
            {issue.room_number || issue.location || "—"}
            {issue.departments?.[0] && ` · ${issue.departments[0].name}`}
          </div>
          <div className="text-[13px] text-text mt-1.5 leading-[1.35] overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
            {issue.title}
          </div>
          <div className="flex gap-1.5 mt-2 items-center flex-wrap">
            <PrIB value={issue.priority}/>
            <StIB value={issue.status}/>
            {issue.issueTypes && issue.issueTypes.length > 0 ? (
              issue.issueTypes.slice(0, 2).map((t) => (
                <PIB key={t.id} color={TIB.purple} className="text-xs">{t.name}</PIB>
              ))
            ) : (
              <PIB color={TIB.muted} className="text-xs">—</PIB>
            )}
            {issue.issueTypes && issue.issueTypes.length > 2 && (
              <span className="text-[10.5px] text-accent font-medium">+{issue.issueTypes.length - 2}</span>
            )}
            {issue.assignedTo && (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-muted ml-0.5">
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
  const [user, setUser] = useState(null);
  const actionsRef = useRef();

  const reload = useCallback(() => {
    if (!id) { setIssue(null); setLoading(false); return; }
    setLoading(true);
    window.PulseAPI.Issues.get(id).then(r => { setIssue(r.data); setLoading(false); });
  }, [id]);

  // Fetch current user for permission checks
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await window.PulseAPI.Auth.me();
        setUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  // Handle keyboard shortcuts for issue actions
  useEffect(() => {
    const handleVerifyShortcut = () => {
      verify();
    };
    window.addEventListener('gp:issue:verify', handleVerifyShortcut);
    return () => window.removeEventListener('gp:issue:verify', handleVerifyShortcut);
  }, [verify]);

  const close = useCallback(async () => {
    if (!id) return;
    await window.PulseAPI.Issues.close(id);
    window.toast.success(`Issue #${id} closed`);
    reload(); onChange?.();
  }, [id, reload, onChange]);

  const reopen = useCallback(async () => {
    if (!id) return;
    await window.PulseAPI.Issues.reopen(id);
    window.toast.success(`Issue #${id} reopened`);
    reload(); onChange?.();
  }, [id, reload, onChange]);

  const verify = useCallback(async () => {
    if (!user || !window.PulseLayout.can(user, "issues.verify")) {
      window.toast.error("You don't have permission to verify issues");
      return;
    }
    if (!id) return;
    await window.PulseAPI.Issues.verify(id);
    window.toast.success(`Issue #${id} verified`);
    reload(); onChange?.();
  }, [id, reload, onChange, user]);

  useEffect(() => { Promise.resolve().then(reload); }, [reload]);
  useEffect(() => {
    const h = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Keyboard shortcuts for issue actions
  useEffect(() => {
    if (!id || !issue) return;

    const handleCloseIssue = () => {
      if (issue.status === 'open') {
        close();
      }
    };

    const handleReopenIssue = () => {
      if (issue.status === 'closed') {
        reopen();
      }
    };

    const handleEditIssue = () => {
      navIB(`/issues/${id}/edit`);
    };

    const handleAssignIssue = () => {
      setAssignOpen(true);
    };

    const handleAddComment = () => {
      // Focus the comment textarea
      const commentInput = document.querySelector('textarea[placeholder*="comment"]');
      if (commentInput) {
        commentInput.focus();
      }
    };

    window.addEventListener('gp:issue:close', handleCloseIssue);
    window.addEventListener('gp:issue:reopen', handleReopenIssue);
    window.addEventListener('gp:issue:edit', handleEditIssue);
    window.addEventListener('gp:issue:assign', handleAssignIssue);
    window.addEventListener('gp:issue:comment', handleAddComment);

    return () => {
      window.removeEventListener('gp:issue:close', handleCloseIssue);
      window.removeEventListener('gp:issue:reopen', handleReopenIssue);
      window.removeEventListener('gp:issue:edit', handleEditIssue);
      window.removeEventListener('gp:issue:assign', handleAssignIssue);
      window.removeEventListener('gp:issue:comment', handleAddComment);
    };
  }, [id, issue, close, reopen]);

  // Update page title when issue loads
  const pageTitle = issue ? `#${issue.id}: ${issue.title}` : null;
  usePageTitle(pageTitle, [issue?.id, issue?.title]);

  if (!id) {
    return (
      <div className="flex-1 grid place-items-center text-muted-light text-sm bg-bg-soft">
        <div className="text-center">
          <IIB name="inbox" size={40} color="#d2d2d7"/>
          <div className="mt-3">Select an issue to view details</div>
        </div>
      </div>
    );
  }

  if (loading || !issue) {
    return <div className="flex-1 p-8 bg-bg-soft"><SIB width={240} height={28}/><SIB width={420} height={16} className="mt-2.5"/><SIB height={160} className="mt-5"/></div>;
  }

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
    <div className="flex-1 min-w-0 overflow-y-auto bg-bg-soft flex flex-col">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-7 py-3 border-b border-black/6 bg-[rgba(250,250,250,0.92)] backdrop-saturate-180 backdrop-blur-[20px]">
        <div className="flex items-center gap-2.5">
          <span className="text-[12.5px] text-muted-light tabular-nums font-medium">#{issue.id}</span>
          <span className="text-[#d2d2d7]">·</span>
          <StIB value={issue.status}/>
          {issue.issueTypes && issue.issueTypes.length > 0 ? (
            issue.issueTypes.slice(0, 2).map((t) => (
              <PIB key={t.id} color={TIB.purple} className="text-xs">{t.name}</PIB>
            ))
          ) : (
            <PIB color={TIB.muted} className="text-xs">—</PIB>
          )}
          {issue.issueTypes && issue.issueTypes.length > 2 && (
            <span className="text-[10.5px] text-accent font-medium">+{issue.issueTypes.length - 2}</span>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          <BIB variant="ghost" size="sm" icon="user" onClick={() => setAssignOpen(true)}>{issue.assignedTo ? "Reassign" : "Assign"}</BIB>
          {issue.status === "open"
            ? <BIB variant="success" size="sm" icon="check" onClick={close}>Close</BIB>
            : issue.status === "closed" && user && window.PulseLayout.can(user, "issues.verify")
              ? <BIB variant="warning" size="sm" icon="verified" onClick={verify}>Verify</BIB>
              : <BIB variant="outline" size="sm" icon="refresh" onClick={reopen}>Reopen</BIB>
          }
          <div ref={actionsRef} className="relative">
            <IBIB icon="more" onClick={() => setActionsOpen(o => !o)} size={30}/>
            {actionsOpen && (
              <div className="absolute right-0 top-9 z-50 min-w-[180px] bg-[rgba(255,255,255,0.98)] backdrop-blur-[20px] rounded-xl p-1 shadow-[0_10px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.06)]">
                <DiIB icon="edit" label="Edit issue" onClick={() => { navIB(`/issues/${id}/edit`); setActionsOpen(false); }}/>
                <DiIB icon="download" label="Export PDF" onClick={() => setActionsOpen(false)}/>
                <DdvIB/>
                <DiIB icon="trash" label="Delete" danger onClick={() => { setConfirmDelete(true); setActionsOpen(false); }}/>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-8 pb-[60px] pt-7 w-full">
        {/* Title + meta */}
        <div className="mb-5.5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] m-0 leading-tight">{issue.title}</h1>
          <div className="text-sm text-muted mt-2 flex flex-wrap gap-2.5 items-center">
            {issue.issueTypes && issue.issueTypes.length > 0 && (
              <>
                <span className="inline-flex items-center gap-1.25">
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
        <CIB className="mb-3.5">
          <div className="px-5 py-4 flex items-center gap-3.5">
            <AvIB name={issue.name || "?"} size={44}/>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold tracking-[-0.01em]">{issue.name || "Guest"}</div>
              <div className="text-[12.5px] text-muted mt-0.75">
                {issue.room_number || issue.location || "—"}
                {issue.checkin_date && issue.checkout_date && ` · ${fmtDateShortIB(issue.checkin_date)} → ${fmtDateShortIB(issue.checkout_date)}`}
                {issue.nationality && ` · ${issue.nationality}`}
              </div>
            </div>
            {issue.contact && <BIB variant="outline" size="sm" icon={issue.contact.includes("@") ? "mail" : "phone"}>{issue.contact.includes("@") ? "Email" : "Call"}</BIB>}
          </div>
        </CIB>

        {/* Assignment + departments */}
        <div className="grid grid-cols-2 gap-3 mb-5.5">
          <CIB>
            <div className="px-[18px] py-[14px]">
              <div className="text-xs text-muted-light font-semibold uppercase tracking-wider mb-2">Assigned to</div>
              {issue.assignedTo ? (
                <div className="flex items-center gap-2.25">
                  <AvIB name={issue.assignedTo.name} size={26}/>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{issue.assignedTo.name}</div>
                    {issue.assignedTo.department && <div className="text-[11.5px] text-muted-light mt-0.25">{issue.assignedTo.department}</div>}
                  </div>
                </div>
              ) : (
                <button onClick={() => setAssignOpen(true)} className="bg-none border-none text-accent text-sm cursor-pointer font-medium p-0">+ Assign user</button>
              )}
            </div>
          </CIB>
          <CIB>
            <div className="px-[18px] py-[14px]">
              <div className="text-xs text-muted-light font-semibold uppercase tracking-wider mb-2">Departments</div>
              <div className="flex flex-wrap gap-1">
                {issue.departments?.length ? issue.departments.map(d => <PIB key={d.id} color={TIB.muted}>{d.name}</PIB>) : <span className="text-[12.5px] text-muted-light italic">None set</span>}
              </div>
            </div>
          </CIB>
        </div>

        {/* Description */}
        <div className="mb-7">
          <SectionTitleIB>Description</SectionTitleIB>
          <div className="text-[14.5px] leading-1.6 text-text whitespace-pre-wrap">
            {issue.description || <span className="text-muted-light italic">No description.</span>}
          </div>
        </div>

        {/* Recovery */}
        {issue.recovery && (
          <div className="mb-7">
            <SectionTitleIB>Recovery / resolution</SectionTitleIB>
            <div className="bg-success/6 border border-success/20 rounded-xl px-4 py-[14px] flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-success grid place-items-center shrink-0">
                <IIB name="gift" size={14} color="#fff" strokeWidth={2}/>
              </div>
              <div className="flex-1 text-sm leading-[1.55] text-text">
                {issue.recovery}
                {issue.recovery_cost > 0 && (
                  <div className="mt-1 text-[12.5px] text-muted">Cost: IDR {issue.recovery_cost.toLocaleString()}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments timeline */}
        <div className="mb-6">
          <SectionTitleIB>Activity</SectionTitleIB>
          <div className="relative pl-3.5">
            <div className="absolute left-3.5 top-1.5 bottom-1.5 w-px bg-black/8"/>
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
            <div className="px-4 py-[14px]">
              <textarea
                value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="Add an internal note or update…" rows={2}
                className="w-full border-none outline-none resize-none font-inherit text-sm text-text tracking-[-0.003em] bg-transparent leading-1.5 p-0"
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-1">
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
  return <div className="text-[11.5px] text-muted-light font-semibold uppercase tracking-[0.06em] my-0 mx-0 mb-3">{children}</div>;
}

function TimelineEntryIB({ icon, color, actor, at, text }) {
  return (
    <div className="relative pl-7 pb-4.5">
      <div className="absolute left-[-8px] top-0.25 w-[22px] h-[22px] rounded-[22px] grid place-items-center shadow-[0_0_0_4px_#fafafa]" style={{ background: color }}>
        <IIB name={icon} size={11} color="#fff" strokeWidth={2.4}/>
      </div>
      <div>
        <div className="text-sm text-text leading-1.45">
          <span className="font-semibold">{actor}</span>
          <span className="text-muted"> · {timeAgoIB(at)}</span>
        </div>
        <div className="text-sm text-text-secondary mt-0.75 leading-1.5 whitespace-pre-wrap">{text}</div>
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
      <div className="p-3">
        <InIB value={q} onChange={setQ} icon="search" placeholder="Search users…" autoFocus/>
      </div>
      <div className="max-h-[360px] overflow-y-auto px-1.5 pb-3">
        <button onClick={() => onAssign(null)} className={`flex w-full px-2.5 py-2 border-none cursor-pointer items-center gap-2.5 rounded-lg font-inherit text-left ${!current ? 'bg-accent/8' : 'bg-transparent hover:bg-black/4'}`}>
          <div className="w-7 h-7 rounded-full bg-[#f2f2f5] grid place-items-center">
            <IIB name="x" size={13} color={TIB.muted}/>
          </div>
          <span className="text-[13.5px] text-muted flex-1">Unassigned</span>
          {!current && <IIB name="check" size={14} color={TIB.accent}/>}
        </button>
        {filtered.map(u => (
          <button key={u.id} onClick={() => onAssign(u.id)} className={`flex w-full px-2.5 py-2 border-none cursor-pointer items-center gap-2.5 rounded-lg font-inherit text-left ${u.id === current ? 'bg-accent/8' : 'bg-transparent hover:bg-black/4'}`}>
            <AvIB name={u.name} size={28}/>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] text-text font-medium">{u.name}</div>
              <div className="text-xs text-muted-light">{u.roles?.[0]?.name} {u.department && `· ${u.department}`}</div>
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
