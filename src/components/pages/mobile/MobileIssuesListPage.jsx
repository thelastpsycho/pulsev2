// ============================================================================
// Mobile Issues List Page
// Full-width issue cards with filters and search
// ============================================================================

import React from 'react';

const { useState, useEffect, useRef } = React;

// Helper to safely access window.PulseUI and window.PulseForm
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
    Pill: () => null,
    PriorityPill: () => null,
    StatusPill: () => null,
    Skeleton: () => null,
    EmptyState: () => null,
    TOKENS: {},
    cx: (...xs) => xs.filter(Boolean).join(" ")
  };
};

const getPulseForm = () => {
  if (typeof window !== 'undefined' && window.PulseForm) {
    return window.PulseForm;
  }
  return {
    Input: () => null,
    Select: () => null,
    Segmented: () => null,
  };
};

const Icon = getPulseUI().Icon;
const Button = getPulseUI().Button;
const IconButton = getPulseUI().IconButton;
const Card = getPulseUI().Card;
const Avatar = getPulseUI().Avatar;
const Pill = getPulseUI().Pill;
const PriorityPill = getPulseUI().PriorityPill;
const StatusPill = getPulseUI().StatusPill;
const Skeleton = getPulseUI().Skeleton;
const EmptyState = getPulseUI().EmptyState;
const TOKENS = getPulseUI().TOKENS || {};
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

const Input = getPulseForm().Input;
const Select = getPulseForm().Select;
const Segmented = getPulseForm().Segmented;

function MobileIssuesListPage() {
  const [issues, setIssues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "open",
    issue_type_id: "",
    department_id: "",
    search: "",
    sort_by: "created_at",
  });
  const [issueTypes, setIssueTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    fetchIssues();
    fetchIssueTypes();
    fetchDepartments();
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await window.PulseAPI.Issues.list({
        ...filters,
        per_page: 50,
        department_id: filters.department_id ? Number(filters.department_id) : undefined,
        issue_type_id: filters.issue_type_id ? Number(filters.issue_type_id) : undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      setIssues(response.data);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueTypes = async () => {
    try {
      const response = await window.PulseAPI.IssueTypes.list();
      setIssueTypes(response.data.filter(t => t.is_active));
    } catch (error) {
      console.error('Failed to fetch issue types:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await window.PulseAPI.Departments.list();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const setFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "open",
      issue_type_id: "",
      department_id: "",
      search: "",
      sort_by: "created_at",
    });
  };

  const navigate = (to) => {
    window.location.hash = '#' + to;
  };

  const tabs = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "", label: "All" },
  ];

  const filterLabel = {
    open: "Open issues",
    closed: "Closed issues",
    "": "All issues",
  }[filters.status] || "Issues";

  const hasActiveFilters = filters.issue_type_id || filters.department_id || filters.search;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-black/[.06] z-10">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold tracking-tight m-0">{filterLabel}</h1>
            <div className="flex items-center gap-1">
              <div ref={filterRef} className="relative">
                <IconButton icon="filter" onClick={() => setFilterOpen(o => !o)} size={36} title="Filter" />
                {filterOpen && (
                  <div className="absolute right-0 top-10 z-50 min-w-[180px] bg-white/98 backdrop-blur-xl rounded-xl p-1 shadow-popover border border-black/[.06]">
                    <div className="px-2.5 py-1. text-[11.5px] text-muted-light font-medium uppercase tracking-wider">Sort by</div>
                    <FilterOption
                      label="Newest first"
                      icon="clock"
                      active={filters.sort_by === "created_at"}
                      onClick={() => { setFilter("sort_by", "created_at"); setFilterOpen(false); }}
                    />
                    <FilterOption
                      label="Recently updated"
                      icon="refresh"
                      active={filters.sort_by === "updated_at"}
                      onClick={() => { setFilter("sort_by", "updated_at"); setFilterOpen(false); }}
                    />
                  </div>
                )}
              </div>
              <IconButton icon="plus" onClick={() => navigate('/mobile/issues/new')} size={36} title="New issue" />
            </div>
          </div>

          {/* Search */}
          <Input
            value={filters.search}
            onChange={v => setFilter("search", v)}
            placeholder="Search issues..."
            icon="search"
            className="mb-3"
          />

          {/* Status tabs */}
          <Segmented value={filters.status} onChange={v => setFilter("status", v)} options={tabs} className="w-full mb-3" />

          {/* Filter dropdowns */}
          <div className="flex gap-2">
            <Select
              value={filters.issue_type_id}
              onChange={v => setFilter("issue_type_id", v)}
              placeholder="Any type"
              options={[
                { value: "", label: "Any type" },
                ...issueTypes.map(t => ({ value: t.id, label: t.name }))
              ]}
              className="flex-1"
            />
            <Select
              value={filters.department_id}
              onChange={v => setFilter("department_id", v)}
              placeholder="Any dept"
              options={[
                { value: "", label: "Any dept" },
                ...departments.map(d => ({ value: d.id, label: d.name }))
              ]}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Issue count and clear */}
      {(hasActiveFilters || loading) && (
        <div className="px-4 py-2 flex items-center justify-between text-[12.5px] text-muted-light">
          <span>{loading ? "Loading..." : `${issues?.length || 0} issues`}</span>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-accent font-medium">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Issue list */}
      <div className="px-4 py-2 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} padding="lg" className="p-4">
              <div className="flex gap-3">
                <Skeleton width={44} height={44} radius={44} />
                <div className="flex-1 space-y-2">
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={12} />
                  <Skeleton width="90%" height={14} />
                </div>
              </div>
            </Card>
          ))
        ) : issues?.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No issues found"
            description="Try adjusting your filters or search terms"
            action={
              hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          issues.map(issue => <MobileIssueCard key={issue.id} issue={issue} />)
        )}
      </div>
    </div>
  );
}

function MobileIssueCard({ issue }) {
  const navigate = (to) => {
    window.location.hash = '#' + to;
  };

  const timeAgo = (iso) => {
    if (!iso) return "—";
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return `${Math.round(s)}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
  };

  return (
    <Card
      padding="lg"
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/mobile/issues/${issue.id}`)}
    >
      <div className="flex gap-3">
        <Avatar name={issue.name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="text-[15px] font-semibold text-text tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {issue.name || "Unknown guest"}
            </div>
            <div className="text-[11.5px] text-muted-light shrink-0 tabular-nums">
              {timeAgo(issue.created_at)}
            </div>
          </div>
          <div className="text-[12px] text-muted mb-1.5">
            {issue.room_number || issue.location || "—"}
            {issue.departments?.[0] && ` · ${issue.departments[0].name}`}
          </div>
          <div className="text-[14px] text-text leading-snug mb-2 line-clamp-2">
            {issue.title}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityPill value={issue.priority} />
            <StatusPill value={issue.status} />
            {issue.issueTypes && issue.issueTypes.length > 0 && (
              issue.issueTypes.slice(0, 2).map(t => (
                <Pill key={t.id} color={TOKENS.purple} className="text-xs">{t.name}</Pill>
              ))
            )}
            {issue.assignedTo && (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-muted ml-0.5">
                <Icon name="user" size={10} />
                {issue.assignedTo.name.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function FilterOption({ label, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-2 px-2.5 rounded-lg text-[13.5px] cursor-pointer text-left font-inherit border-none bg-transparent hover:bg-black/[.03] transition-colors"
    >
      <Icon name={icon} size={15} color={active ? TOKENS.accent : TOKENS.mutedLight} />
      <span className={active ? "text-accent font-medium" : "text-text"}>
        {label}
      </span>
    </button>
  );
}

window.MobileIssuesListPage = MobileIssuesListPage;
