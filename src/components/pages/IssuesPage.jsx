import { useState, useEffect, useCallback } from 'react'
// ============================================================================
// Issues — list (data table) + detail + form
// All styling via Tailwind classes.
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
           EmptyState: () => null, TOKENS: {}, cx: (...xs) => xs.filter(Boolean).join(" ") },
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
const CI = pulse.UI.Card; const SI = pulse.UI.Skeleton; const EI = pulse.UI.EmptyState;
const TI = pulse.UI.TOKENS; const cxI = pulse.UI.cx || ((...xs) => xs.filter(Boolean).join(" "));
const FI = pulse.Form.Field; const InI = pulse.Form.Input; const TaI = pulse.Form.Textarea; const SeI = pulse.Form.Select;
const MsI = pulse.Form.MultiSelect; const SsI = pulse.Form.SearchableSelect; const CbI = pulse.Form.Checkbox; const SgI = pulse.Form.Segmented;
const MdI = pulse.Overlay.Modal; const DdI = pulse.Overlay.Dropdown;
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
    status: "open", issue_type_id: "", department_id: "", search: "",
    page: 1, per_page: 25, sort_by: "created_at", sort_order: "desc",
  });
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState(new Set());
  const [departments, setDepartments] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    // Defer setLoading to avoid synchronous setState in effect
    Promise.resolve().then(() => setLoading(true));
    window.PulseAPI.Issues.list({
      ...filters,
      department_id: filters.department_id ? Number(filters.department_id) : undefined,
      issue_type_id: filters.issue_type_id ? Number(filters.issue_type_id) : undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
    }).then(r => {
      if (cancelled) return;
      setIssues(r.data); setMeta(r.meta); setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptResponse, typesResponse] = await Promise.all([
          window.PulseAPI.Departments.list(),
          window.PulseAPI.IssueTypes.list()
        ]);
        setDepartments(deptResponse.data || []);
        setIssueTypes(typesResponse.data || []);
      } catch (error) {
        console.error('Failed to fetch departments/issue types:', error);
        setDepartments([]);
        setIssueTypes([]);
      }
    };
    fetchOptions();
  }, []);

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
          <div className="flex items-center justify-between gap-3">
            <TbI value={filters.status} onChange={v => setF("status", v)} items={tabs}/>
          </div>
        }
      />

      {/* Filter row */}
      <div className="px-7 pt-4 pb-3 flex gap-2 items-center flex-wrap border-b border-black/6">
        <div className="flex-[1_1_280px] max-w-[360px]">
          <InI value={filters.search} onChange={v => setF("search", v)} icon="search" placeholder="Search by title, guest, room, ID…"/>
        </div>
        <SeI value={filters.issue_type_id} onChange={v => setF("issue_type_id", v)} placeholder="Any issue type" options={[
          { value: "", label: "Any issue type" },
          ...issueTypes.filter(t => t.is_active).map(t => ({ value: t.id, label: t.name })),
        ]} className="w-45"/>
        <SeI value={filters.department_id} onChange={v => setF("department_id", v)} placeholder="Any department" options={[
          { value: "", label: "Any department" },
          ...departments.filter(d => d.is_active).map(d => ({ value: d.id, label: d.name })),
        ]} className="w-50"/>
        {(filters.issue_type_id || filters.department_id || filters.search) && (
          <BI variant="ghost" size="sm" icon="x" onClick={() => setFilters({ ...filters, search: "", issue_type_id: "", department_id: "", page: 1 })}>Clear</BI>
        )}
        <div className="flex-1"/>
        <div className="flex gap-1.5 items-center text-[12.5px] text-muted">
          Sort:
          <SeI value={filters.sort_by} onChange={v => setF("sort_by", v)} options={[
            { value: "created_at", label: "Newest" },
            { value: "updated_at", label: "Recently updated" },
            { value: "title", label: "Title" },
          ]} className="w-42" placeholder=""/>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="px-7 py-2.5 bg-accent/6 border-b border-accent/15 flex items-center justify-between text-sm text-accent font-medium">
          <span>{selected.size} selected</span>
          <div className="flex gap-1.5">
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
        <IssuesKanban issues={issues} loading={loading} issueTypes={issueTypes}/>
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
      <div className="px-7 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-3 border-b border-black/4">
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
    <div className="px-7 pt-2 pb-6">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr className="border-b border-black/8">
            <Th width="32"><CbI checked={selected.size === issues.length && issues.length > 0} onChange={toggleAll}/></Th>
            <Th width="70">ID</Th>
            <Th>Title</Th>
            <Th width="170">Guest · Room</Th>
            <Th width="120">Department</Th>
            <Th width="120">Issue Types</Th>
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
  return <th className="px-2 py-2.5 text-left text-[11.5px] font-semibold text-muted-light uppercase tracking-wider" style={{ width }}>{children}</th>;
}

function IssueRow({ issue, selected, onToggle }) {
  const [h, setH] = useState(false);
  return (
    <tr
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      className={cxI(
        "border-b border-black/4 cursor-pointer transition-colors duration-100",
        selected ? "bg-accent/5" : (h ? "bg-black/2" : "bg-transparent")
      )}
      onClick={(e) => { if (e.target.closest("button") || e.target.closest("input")) return; navI(`/issues/${issue.id}`); }}>
      <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}><CbI checked={selected} onChange={onToggle}/></td>
      <td className="px-2 py-2.5 text-muted tabular-nums text-[12.5px] font-medium">#{issue.id}</td>
      <td className="px-2 py-2.5">
        <div className="font-medium text-text tracking-body truncate max-w-95">{issue.title}</div>
        <div className="text-xs text-muted-light mt-0.5">
          {issue.issueTypes && issue.issueTypes.length > 0
            ? issue.issueTypes.slice(0, 2).map((t, i) => (
                <span key={t.id}>
                  {i > 0 && ", "}{t.name}
                </span>
              ))
            : "—"}
          {issue.issueTypes && issue.issueTypes.length > 2 && (
            <span className="text-accent font-medium"> +{issue.issueTypes.length - 2} more</span>
          )}
        </div>
      </td>
      <td className="px-2 py-2.5 text-[12.5px]">
        <div className="text-text">{issue.name || "—"}</div>
        <div className="text-muted-light mt-0.5">{issue.room_number || issue.location}</div>
      </td>
      <td className="px-2 py-2.5">
        {issue.departments?.map(d => <PI key={d.id} color={TI.muted} className="mr-1">{d.code || d.name}</PI>)}
      </td>
      <td className="px-2 py-2.5">
        {issue.issueTypes && issue.issueTypes.length > 0
          ? issue.issueTypes.slice(0, 2).map((t) => (
              <PI key={t.id} color={TI.purple} className="mr-1">{t.name}</PI>
            ))
          : <span className="text-xs text-muted-light italic">—</span>}
        {issue.issueTypes && issue.issueTypes.length > 2 && (
          <span className="text-[11.5px] text-accent font-medium">+{issue.issueTypes.length - 2}</span>
        )}
      </td>
      <td className="px-2 py-2.5"><StI value={issue.status}/></td>
      <td className="px-2 py-2.5">
        {issue.assignedTo ? (
          <div className="flex items-center gap-1.5">
            <AvI name={issue.assignedTo.name} size={22}/>
            <span className="text-[12.5px] text-text-secondary truncate max-w-22">{issue.assignedTo.name.split(" ")[0]}</span>
          </div>
        ) : <span className="text-xs text-muted-light italic">Unassigned</span>}
      </td>
      <td className="px-2 py-2.5 text-xs text-muted-light tabular-nums">{timeAgoI(issue.updated_at || issue.created_at)}</td>
      <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
        <DdI trigger={<button className="bg-none border-none p-1 cursor-pointer rounded-md"><II name="more" size={15} color={TI.mutedLight}/></button>} width={170}>
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

function IssuesKanban({ issues, loading, issueTypes }) {
  if (loading) return <div className="p-7"><SI height={120}/></div>;

  const columns = issueTypes.length > 0
    ? [
        ...issueTypes.filter(t => t.is_active).map(t => ({ id: t.id, label: t.name, color: TI.purple })),
        { id: "none", label: "Uncategorized", color: TI.muted }
      ]
    : [{ id: "all", label: "All Issues", color: TI.purple }];

  return (
    <div className="grid gap-3 p-[16px_28px_24px]" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, 1fr)` }}>
      {columns.map(col => {
        const items = col.id === "none"
          ? issues.filter(i => !i.issueTypes || i.issueTypes.length === 0)
          : col.id === "all"
            ? issues
            : issues.filter(i => i.issueTypes && i.issueTypes.some(t => t.id === col.id));

        return (
          <div key={col.id} className="bg-bg-soft rounded-xl p-2 border border-black/5">
            <div className="flex items-center gap-1.5 p-[6px_8px_10px] text-[12.5px] font-semibold text-text">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }}/>
              {col.label}
              <span className="ml-auto text-[11.5px] text-muted-light font-medium">{items.length}</span>
            </div>
            <div className="flex flex-col gap-1.5 min-h-15">
              {items.map(i => (
                <LkI key={i.id} to={`/issues/${i.id}`}>
                  <div className="bg-white rounded-xl p-2.5 border border-black/5 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow">
                    <div className="text-[11.5px] text-muted-light tabular-nums mb-0.75">#{i.id}</div>
                    <div className="text-sm font-medium text-text leading-snug line-clamp-2">{i.title}</div>
                    <div className="text-[11.5px] text-muted-light mt-1">{i.room_number || i.location}</div>
                    {i.departments && i.departments.length > 0 && (
                      <div className="text-xs text-muted mt-0.75 flex flex-wrap gap-0.75">
                        {i.departments.slice(0, 2).map(d => (
                          <span key={d.id} className="bg-black/5 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-light">{d.code || d.name}</span>
                        ))}
                        {i.departments.length > 2 && (
                          <span className="bg-accent/8 rounded px-1.5 py-0.5 text-[10px] font-medium text-accent">+{i.departments.length - 2}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <StI value={i.status}/>
                      {i.assignedTo ? <AvI name={i.assignedTo.name} size={20}/> : <span className="text-[10.5px] text-muted-light">Unassigned</span>}
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
    <div className="px-7 pb-6 pt-3 flex items-center justify-between">
      <div className="text-[12.5px] text-muted">{from}–{to} of {total}</div>
      <div className="flex gap-1 items-center">
        <BI size="sm" variant="ghost" icon="chevron-left" disabled={current_page === 1} onClick={() => onPage(current_page - 1)}>Prev</BI>
        <span className="text-[12.5px] text-muted px-2 tabular-nums">Page {current_page} of {last_page}</span>
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
function IssueDetailPage({ id }) {
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
      <div className="p-8">
        <SI width={240} height={28}/>
        <SI width={420} height={16} className="mt-2.5"/>
        <SI height={160} className="mt-5"/>
      </div>
    );
  }

  const close = async () => {
    try {
      await window.PulseAPI.Issues.close(id);
      window.toast.success(`Issue #${id} closed`);
      reload();
    } catch (error) {
      console.error('Failed to close issue:', error);
      window.toast.error('Failed to close issue: ' + (error.message || 'Unknown error'));
    }
  };
  const reopen = async () => {
    try {
      await window.PulseAPI.Issues.reopen(id);
      window.toast.success(`Issue #${id} reopened`);
      reload();
    } catch (error) {
      console.error('Failed to reopen issue:', error);
      window.toast.error('Failed to reopen issue: ' + (error.message || 'Unknown error'));
    }
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

      <div className="grid grid-cols-[1fr_320px] gap-0 px-7 pb-[60px] max-w-[1400px]">
        {/* Main column */}
        <div className="pr-7 min-w-0">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[12.5px] text-muted-light tabular-nums font-medium">#{issue.id}</span>
            <span className="text-muted-light">·</span>
            <StI value={issue.status}/>
            <PrI value={issue.priority}/>
            <span className="text-muted-light">·</span>
            <span className="text-[12.5px] text-muted">Created {fmtDateI(issue.created_at)} by {issue.createdBy?.name || "Unknown"}</span>
          </div>

          <h1 className="text-[26px] font-semibold tracking-tight mb-2 leading-snug">
            {issue.title}
          </h1>

          <div className="mt-6 mb-8">
            <SectionTitle>Description</SectionTitle>
            <div className="text-[14.5px] leading-[1.6] text-text whitespace-pre-wrap">{issue.description || <span className="text-muted-light italic">No description provided.</span>}</div>
          </div>

          {issue.recovery && (
            <div className="mb-8">
              <SectionTitle>Recovery / resolution</SectionTitle>
              <div className="bg-success/6 border border-success/20 rounded-[24px] px-4 py-3.5 flex gap-3 items-start">
                <div className="w-[26px] h-[26px] rounded-full bg-success grid place-items-center shrink-0">
                  <II name="gift" size={14} color="#fff" strokeWidth={2}/>
                </div>
                <div className="flex-1 text-[14px] leading-[1.55] text-text">
                  {issue.recovery}
                  {issue.recovery_cost > 0 && (
                    <div className="mt-1 text-[12.5px] text-muted">
                      Cost: IDR {issue.recovery_cost.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <SectionTitle>Comments &amp; activity</SectionTitle>
            <div className="relative pl-3.5">
              <div className="absolute left-3.5 top-1.5 bottom-7 w-px bg-black/8"/>
              {(issue.comments || []).length === 0 && <div className="pl-3.5 text-muted-light text-[13.5px] italic">No comments yet.</div>}
              {(issue.comments || []).map(c => <Comment key={c.id} c={c}/>)}
            </div>
          </div>

          {issue.status === "open" && (
            <CI>
              <div className="px-4 py-3.5">
                <TaI value={comment} onChange={setComment} placeholder="Write an update or internal note…" rows={3} className="border-none p-0 shadow-none"/>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-1">
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
        <aside className="border-l border-black/6 pl-6">
          <SidebarMeta label="Status">
            <StI value={issue.status}/>
          </SidebarMeta>
          <SidebarMeta label="Priority">
            <PrI value={issue.priority}/>
          </SidebarMeta>
          <SidebarMeta label="Assigned to">
            {issue.assignedTo ? (
              <div className="flex items-center gap-2">
                <AvI name={issue.assignedTo.name} size={24}/>
                <span className="text-[13px] text-text font-medium">{issue.assignedTo.name}</span>
              </div>
            ) : (
              <button onClick={() => setAssignOpen(true)} className="bg-none border-none p-0 text-accent text-[13px] cursor-pointer font-medium">+ Assign</button>
            )}
          </SidebarMeta>
          <SidebarMeta label="Departments">
            <div className="flex flex-wrap gap-1">
              {issue.departments?.length ? issue.departments.map(d => <PI key={d.id} color={TI.muted}>{d.name}</PI>) : <span className="text-[12.5px] text-muted-light italic">None</span>}
            </div>
          </SidebarMeta>
          <SidebarMeta label="Issue type">
            {issue.issueTypes?.length ? issue.issueTypes.map(t => <PI key={t.id} color={TI.purple}>{t.name}</PI>) : <span className="text-[12.5px] text-muted-light italic">—</span>}
          </SidebarMeta>

          <div className="h-px bg-black/6 my-3.5"/>

          <SidebarMeta label="Guest">
            <div className="text-[13.5px] text-text font-medium">{issue.name || "—"}</div>
            {issue.nationality && <div className="text-[12px] text-muted mt-0.5">{issue.nationality}</div>}
          </SidebarMeta>
          <SidebarMeta label="Room"><span className="text-[13.5px] text-text">{issue.room_number || issue.location || "—"}</span></SidebarMeta>
          <SidebarMeta label="Stay">
            {issue.checkin_date && issue.checkout_date
              ? <span className="text-[13px] text-text">{fmtDateShort(issue.checkin_date)} → {fmtDateShort(issue.checkout_date)}</span>
              : <span className="text-[12.5px] text-muted-light italic">—</span>}
          </SidebarMeta>
          <SidebarMeta label="Contact">
            {issue.contact ? <span className="text-[13px] text-text break-all">{issue.contact}</span> : <span className="text-[12.5px] text-muted-light italic">—</span>}
          </SidebarMeta>
          <SidebarMeta label="Source"><span className="text-[13px] text-text">{issue.source || "—"}</span></SidebarMeta>

          <div className="h-px bg-black/6 my-3.5"/>

          <SidebarMeta label="Created"><span className="text-[12.5px] text-text">{fmtDateI(issue.created_at)}</span></SidebarMeta>
          <SidebarMeta label="Updated"><span className="text-[12.5px] text-text">{fmtDateI(issue.updated_at)}</span></SidebarMeta>
          {issue.closed_at && (
            <SidebarMeta label="Closed">
              <div className="text-[12.5px] text-text">{fmtDateI(issue.closed_at)}</div>
              {issue.closedBy && <div className="text-[12px] text-muted mt-0.5">by {issue.closedBy.name}</div>}
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
  return <div className="text-[11.5px] text-muted-light font-semibold uppercase tracking-wide mb-3">{children}</div>;
}

function SidebarMeta({ label, children }) {
  return (
    <div className="mb-3.5">
      <div className="text-[11.5px] text-muted-light font-semibold uppercase tracking-upper-wide mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Comment({ c }) {
  return (
    <div className="relative pl-7 pb-4">
      <div className="absolute -left-0.5 top-0.5 w-7 h-7 rounded-full bg-white grid place-items-center">
        <AvI name={c.user.name} size={26}/>
      </div>
      <div className="bg-bg-soft border border-black/5 rounded-2xl px-3.5 py-2.5">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-[13px] font-semibold text-text">{c.user.name}</span>
          <span className="text-[11.5px] text-muted-light">{fmtDateI(c.created_at)}</span>
        </div>
        <div className="text-[13.5px] text-text leading-normal">{c.body}</div>
      </div>
    </div>
  );
}

function AssignModal({ onClose, onAssign, current }) {
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
    <MdI title="Assign issue" onClose={onClose} width={400} padding={false}>
      <div className="p-3">
        <InI value={q} onChange={setQ} icon="search" placeholder="Search users…" autoFocus/>
      </div>
      <div className="max-h-[360px] overflow-y-auto px-1.5 pb-3">
        <UnassignButton onClick={() => onAssign(null)} active={!current}/>
        {filtered.map(u => (
          <button key={u.id} onClick={() => onAssign(u.id)} className={cxI(
            "flex w-full px-2.5 py-2 border-none cursor-pointer items-center gap-2.5 rounded-lg font-inherit text-left",
            u.id === current ? "bg-accent/8" : "bg-transparent hover:bg-black/4"
          )}>
            <AvI name={u.name} size={28}/>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] text-text font-medium">{u.name}</div>
              <div className="text-[12px] text-muted-light">{u.roles?.[0]?.name} {u.department && `· ${u.department}`}</div>
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
    <button onClick={onClick} className={cxI(
      "flex w-full px-2.5 py-2 border-none cursor-pointer items-center gap-2.5 rounded-lg font-inherit text-left",
      active ? "bg-accent/8" : "bg-transparent hover:bg-black/4"
    )}>
      <div className="w-7 h-7 rounded-full bg-[#f2f2f5] grid place-items-center">
        <II name="x" size={13} color={TI.muted}/>
      </div>
      <span className="text-[13.5px] text-muted flex-1">Unassigned</span>
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
    recovery: "", recovery_cost: "",
  });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [users, setUsers] = useState([]);

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
          recovery: i.recovery || "", recovery_cost: i.recovery_cost || "",
        });
        setLoading(false);
      }).catch(err => {
        console.error('Failed to load issue:', err);
        window.toast.error('Failed to load issue');
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  useEffect(() => {
    Promise.all([
      window.PulseAPI.Departments.list(),
      window.PulseAPI.IssueTypes.list(),
      window.PulseAPI.Users.list()
    ]).then(([deptRes, typesRes, usersRes]) => {
      setDepartments(deptRes.data.filter(d => d.is_active));
      setIssueTypes(typesRes.data.filter(t => t.is_active));
      setUsers(usersRes.data.filter(u => u.is_active));
    }).catch(err => {
      console.error('Failed to load form options:', err);
      window.toast.error('Failed to load form options');
      setDepartments([]);
      setIssueTypes([]);
      setUsers([]);
    });
  }, []);

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

  if (loading) return <div className="p-8"><SI height={300}/></div>;

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

      <div className="max-w-[880px] px-7 pb-[60px] grid grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0">
          <SectionLabel>Issue</SectionLabel>
          <FI label="Title" required error={errors.title}>
            <InI value={form.title} onChange={v => set("title", v)} placeholder="e.g. AC not cooling in master bedroom" autoFocus/>
          </FI>
          <FI label="Description" hint="What did the guest report? Times, severity, any context.">
            <TaI value={form.description} onChange={v => set("description", v)} rows={5} placeholder="Detailed description…"/>
          </FI>
          <FI label="Recovery / Resolution" hint="What was done to resolve the issue? Compensation offered?">
            <TaI value={form.recovery} onChange={v => set("recovery", v)} rows={4} placeholder="Actions taken, guest compensation, resolution details…"/>
          </FI>
          <FI label="Recovery Cost (IDR)" hint="Optional. Total compensation cost in Indonesian Rupiah.">
            <InI value={form.recovery_cost} onChange={v => set("recovery_cost", v)} type="number" placeholder="0" min="0"/>
          </FI>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Departments" hint="Choose one or more">
              <MsI value={form.department_ids} onChange={v => set("department_ids", v)} options={departments.map(d => ({ value: d.id, label: d.name }))}/>
            </FI>
            <FI label="Issue types">
              <MsI value={form.issue_type_ids} onChange={v => set("issue_type_ids", v)} options={issueTypes.map(t => ({ value: t.id, label: t.name }))}/>
            </FI>
          </div>

          <SectionLabel className="mt-5">Guest details</SectionLabel>
          <FI label="Guest name"><InI value={form.name} onChange={v => set("name", v)} icon="user" placeholder="Mr. / Ms. …"/></FI>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Room / Villa"><InI value={form.room_number} onChange={v => set("room_number", v)} placeholder="e.g. 805 or OV-12"/></FI>
            <FI label="Source"><InI value={form.source} onChange={v => set("source", v)} placeholder="Booking.com, Agoda, etc."/></FI>
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-3">
            <FI label="Guest Stay" hint="Check-in and check-out dates (optional)">
              <window.RangeDatePicker
                defaultStartDate={form.checkin_date ? new Date(form.checkin_date) : null}
                defaultEndDate={form.checkout_date ? new Date(form.checkout_date) : null}
                onDateChange={(start, end) => {
                  set("checkin_date", start ? start.toISOString().split('T')[0] : "");
                  set("checkout_date", end ? end.toISOString().split('T')[0] : "");
                }}
                placeholder="Select check-in and check-out dates"
              />
            </FI>
            <FI label="Issue date" required><InI value={form.issue_date} onChange={v => set("issue_date", v)} type="date"/></FI>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FI label="Nationality">
              <SsI
                value={form.nationality}
                onChange={v => set("nationality", v)}
                placeholder="Select nationality…"
                options={[
                  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Argentine", "Armenian", "Australian", "Austrian",
                  "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese",
                  "Bolivian", "Bosnian", "Botswanan", "Brazilian", "Bruneian", "Bulgarian", "Burkinabe", "Burundian", "Cambodian", "Cameroonian",
                  "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese", "Colombian", "Comorian", "Congolese", "Costa Rican",
                  "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican", "Dutch", "East Timorese", "Ecuadorean",
                  "Egyptian", "Emirati", "English", "Eritrean", "Estonian", "Ethiopian", "Fijian", "Filipino", "Finnish", "French",
                  "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian", "Guatemalan", "Guinean", "Guyanese",
                  "Haitian", "Honduran", "Hungarian", "Icelander", "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli",
                  "Italian", "Ivorian", "Jamaican", "Japanese", "Jordanian", "Kazakhstani", "Kenyan", "Kuwaiti", "Kyrgyz", "Laotian",
                  "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian",
                  "Malaysian", "Maldivian", "Malian", "Maltese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan",
                  "Mongolian", "Moroccan", "Mosotho", "Motswana", "Myanmar", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan",
                  "Nigerian", "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Panamanian", "Papua New Guinean", "Paraguayan",
                  "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan",
                  "San Marinese", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian", "Slovenian",
                  "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamese", "Swazi", "Swedish",
                  "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian", "Tunisian",
                  "Turkish", "Turkmen", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan", "Vatican", "Venezuelan",
                  "Vietnamese", "Welsh", "Yemeni", "Zambian", "Zimbabwean"
                ].map(n => ({ value: n, label: n }))}
              />
            </FI>
            <FI label="Contact"><InI value={form.contact} onChange={v => set("contact", v)} icon="phone" placeholder="phone or email"/></FI>
          </div>
        </div>

        <aside>
          <SectionLabel>Routing</SectionLabel>
          <FI label="Priority" required error={errors.priority}>
            <div className="flex flex-col gap-1.5">
              {[
                { v: "urgent", desc: "VIP, safety, major failure" },
                { v: "high",   desc: "Significant impact" },
                { v: "medium", desc: "Standard complaint" },
                { v: "low",    desc: "Minor inconvenience" },
              ].map(o => {
                const meta = window.PulseUI.PRIORITY[o.v];
                const sel = form.priority === o.v;
                return (
                  <button key={o.v} type="button" onClick={() => set("priority", o.v)} className={cxI(
                    "flex items-center gap-2.5 text-left px-3 py-2.5 border font-inherit rounded-xl cursor-pointer transition-all duration-100",
                    sel ? "border-accent bg-accent/10" : "border-black/8 bg-white"
                  )} style={{ borderColor: sel ? meta.color : undefined }}>
                    <div className="w-2 h-2 rounded-full bg-(--priority-color) shrink-0" style={{ background: meta.color }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold" style={{ color: sel ? meta.color : TI.text }}>{meta.label}</div>
                      <div className="text-[11.5px] text-muted-light mt-0.5">{o.desc}</div>
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

function SectionLabel({ children, className }) {
  return <div className={cxI("text-[11.5px] text-muted-light font-semibold uppercase tracking-wide mb-2.5", className)}>{children}</div>;
}

window.PageIssuesList = IssuesListPage;
window.PageIssueDetail = IssueDetailPage;
window.PageIssueForm = IssueFormPage;
