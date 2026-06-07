// ============================================================================
// Mobile Issue Detail Page
// Full CRUD functionality for viewing and managing issues
// ============================================================================

import React from 'react';

const { useState, useEffect, useRef } = React;

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
    CardHeader: () => null,
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
  return { Textarea: () => null };
};

const getPulseOverlay = () => {
  if (typeof window !== 'undefined' && window.PulseOverlay) {
    return window.PulseOverlay;
  }
  return {
    Dropdown: () => null,
    DropdownItem: () => null,
    DropdownDivider: () => null,
    ConfirmDialog: () => null,
  };
};

const Icon = getPulseUI().Icon;
const Button = getPulseUI().Button;
const IconButton = getPulseUI().IconButton;
const Card = getPulseUI().Card;
const CardHeader = getPulseUI().CardHeader;
const Avatar = getPulseUI().Avatar;
const Pill = getPulseUI().Pill;
const PriorityPill = getPulseUI().PriorityPill;
const StatusPill = getPulseUI().StatusPill;
const Skeleton = getPulseUI().Skeleton;
const EmptyState = getPulseUI().EmptyState;
const TOKENS = getPulseUI().TOKENS || {};
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

const Textarea = getPulseForm().Textarea;
const Dropdown = getPulseOverlay().Dropdown;
const DropdownItem = getPulseOverlay().DropdownItem;
const DropdownDivider = getPulseOverlay().DropdownDivider;
const ConfirmDialog = getPulseOverlay().ConfirmDialog;

function MobileIssueDetailPage({ issueId }) {
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const actionsRef = useRef(null);

  // Get issue ID from URL
  const id = issueId || (() => {
    const match = window.location.hash.match(/^#\/mobile\/issues\/(\d+)$/);
    return match ? Number(match[1]) : null;
  })();

  useEffect(() => {
    if (!id) return;
    fetchIssue();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const response = await window.PulseAPI.Issues.get(id);
      setIssue(response.data);
    } catch (error) {
      console.error('Failed to fetch issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeIssue = async () => {
    try {
      await window.PulseAPI.Issues.close(id);
      window.toast.success(`Issue #${id} closed`);
      fetchIssue();
    } catch (error) {
      console.error('Failed to close issue:', error);
      window.toast.error('Failed to close issue');
    }
  };

  const reopenIssue = async () => {
    try {
      await window.PulseAPI.Issues.reopen(id);
      window.toast.success(`Issue #${id} reopened`);
      fetchIssue();
    } catch (error) {
      console.error('Failed to reopen issue:', error);
      window.toast.error('Failed to reopen issue');
    }
  };

  const deleteIssue = async () => {
    try {
      await window.PulseAPI.Issues.destroy(id);
      window.toast.success('Issue deleted');
      navigate('/mobile');
    } catch (error) {
      console.error('Failed to delete issue:', error);
      window.toast.error('Failed to delete issue');
    }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    try {
      await window.PulseAPI.Comments.create({
        issue_id: id,
        body: comment.trim()
      });
      setComment("");
      window.toast.success("Comment added");
      fetchIssue();
    } catch (error) {
      console.error('Failed to post comment:', error);
      window.toast.error('Failed to post comment');
    }
  };

  const assignUser = async (userId) => {
    try {
      await window.PulseAPI.Issues.update(id, {
        assigned_to_user_id: userId
      });
      window.toast.success("Assignment updated");
      setAssignOpen(false);
      fetchIssue();
    } catch (error) {
      console.error('Failed to assign user:', error);
      window.toast.error('Failed to assign user');
    }
  };

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

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  if (!id) {
    return (
      <div className="p-4">
        <EmptyState
          icon="inbox"
          title="No issue selected"
          description="Select an issue to view details"
          action={<Button onClick={() => navigate('/mobile')}>Back to Home</Button>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton width="40%" height={20} />
        <Skeleton width="100%" height={120} />
        <Skeleton width="100%" height={80} />
        <Skeleton width="100%" height={80} />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-4">
        <EmptyState
          icon="alert"
          title="Issue not found"
          description="The issue you're looking for doesn't exist or has been deleted"
          action={<Button onClick={() => navigate('/mobile')}>Back to Home</Button>}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header with back button */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-black/[.06] z-10 px-4 py-3 flex items-center gap-3">
        <IconButton icon="arrow-left" onClick={() => navigate('/mobile')} size={36} title="Back" />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] text-muted-light tabular-nums font-medium">#{issue.id}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill value={issue.status} />
            {issue.issueTypes && issue.issueTypes.length > 0 && (
              issue.issueTypes.slice(0, 2).map(t => (
                <Pill key={t.id} color={TOKENS.purple} className="text-xs">{t.name}</Pill>
              ))
            )}
          </div>
        </div>
        <div ref={actionsRef} className="relative">
          <IconButton icon="more" onClick={() => setActionsOpen(o => !o)} size={36} />
          {actionsOpen && (
            <Dropdown trigger={<div />} align="right" width={180}>
              <DropdownItem icon="edit" label="Edit issue" onClick={() => { navigate(`/mobile/issues/${id}/edit`); setActionsOpen(false); }} />
              <DropdownDivider />
              <DropdownItem icon="trash" label="Delete" danger onClick={() => { setConfirmDelete(true); setActionsOpen(false); }} />
            </Dropdown>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight m-0 leading-tight">{issue.title}</h1>
          <div className="text-[13px] text-muted mt-2 flex flex-wrap gap-2">
            {issue.issueTypes && issue.issueTypes.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="tag" size={13} color={TOKENS.mutedLight} />
                {issue.issueTypes.map(t => t.name).join(', ')}
              </span>
            )}
            <span>·</span>
            <span>{formatDate(issue.created_at)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant={issue.status === "open" ? "success" : "outline"}
            size="sm"
            icon={issue.status === "open" ? "check" : "refresh"}
            onClick={issue.status === "open" ? closeIssue : reopenIssue}
            className="flex-1"
          >
            {issue.status === "open" ? "Close Issue" : "Reopen"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon="user"
            onClick={() => setAssignOpen(true)}
            className="flex-1"
          >
            {issue.assignedTo ? "Reassign" : "Assign"}
          </Button>
        </div>

        {/* Guest card */}
        <Card>
          <div className="p-4 flex items-center gap-3">
            <Avatar name={issue.name} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold tracking-tight">{issue.name || "Guest"}</div>
              <div className="text-[12.5px] text-muted mt-0.5">
                {issue.room_number || issue.location || "—"}
                {issue.checkin_date && issue.checkout_date && ` · ${new Date(issue.checkin_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} → ${new Date(issue.checkout_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}`}
              </div>
              {issue.nationality && <div className="text-[11.5px] text-muted-light mt-0.5">{issue.nationality}</div>}
            </div>
          </div>
        </Card>

        {/* Assignment & Departments */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="p-3">
              <div className="text-[11px] text-muted-light font-semibold uppercase tracking-wider mb-2">Assigned to</div>
              {issue.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar name={issue.assignedTo.name} size={28} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate">{issue.assignedTo.name}</div>
                    {issue.assignedTo.department && <div className="text-[11px] text-muted-light truncate">{issue.assignedTo.department}</div>}
                  </div>
                </div>
              ) : (
                <button onClick={() => setAssignOpen(true)} className="text-accent text-sm font-medium bg-none border-none cursor-pointer p-0">
                  + Assign user
                </button>
              )}
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <div className="text-[11px] text-muted-light font-semibold uppercase tracking-wider mb-2">Departments</div>
              <div className="flex flex-wrap gap-1">
                {issue.departments?.length ? issue.departments.map(d => (
                  <Pill key={d.id} color={TOKENS.muted}>{d.name}</Pill>
                )) : <span className="text-[12px] text-muted-light italic">None</span>}
              </div>
            </div>
          </Card>
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="p-3">
              <div className="text-[11px] text-muted-light font-semibold uppercase tracking-wider mb-2">Priority</div>
              <PriorityPill value={issue.priority} />
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <div className="text-[11px] text-muted-light font-semibold uppercase tracking-wider mb-2">Status</div>
              <StatusPill value={issue.status} />
            </div>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader title="Description" />
          <div className="px-4 pb-4">
            <div className="text-[14px] leading-relaxed text-text whitespace-pre-wrap">
              {issue.description || <span className="text-muted-light italic">No description provided.</span>}
            </div>
          </div>
        </Card>

        {/* Recovery */}
        {issue.recovery && (
          <Card>
            <CardHeader title="Recovery / Resolution" />
            <div className="px-4 pb-4">
              <div className="bg-success/6 border border-success/20 rounded-xl p-3 flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-success grid place-items-center shrink-0">
                  <Icon name="gift" size={14} color="#fff" strokeWidth={2} />
                </div>
                <div className="flex-1 text-sm leading-relaxed text-text">
                  {issue.recovery}
                  {issue.recovery_cost > 0 && (
                    <div className="mt-1 text-[12px] text-muted">Cost: IDR {issue.recovery_cost.toLocaleString()}</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Activity / Comments */}
        <Card>
          <CardHeader title="Activity" />
          <div className="px-4 pb-4">
            <div className="relative pl-3">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-black/8" />
              <TimelineEntry
                icon="plus"
                color={TOKENS.accent}
                actor={issue.createdBy?.name || "System"}
                at={issue.created_at}
                text="Issue opened."
                timeAgo={timeAgo}
              />
              {(issue.comments || []).map(c => (
                <TimelineEntry
                  key={c.id}
                  icon="edit"
                  color={TOKENS.muted}
                  actor={c.user?.name || "Someone"}
                  at={c.created_at}
                  text={c.body}
                  timeAgo={timeAgo}
                />
              ))}
              {issue.closed_at && (
                <TimelineEntry
                  icon="check"
                  color={TOKENS.success}
                  actor={issue.closedBy?.name || "Someone"}
                  at={issue.closed_at}
                  text="Closed the issue."
                  timeAgo={timeAgo}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Add comment */}
        {issue.status === "open" && (
          <Card>
            <div className="p-3">
              <Textarea
                value={comment}
                onChange={setComment}
                placeholder="Add an internal note or update…"
                rows={3}
                className="mb-2"
              />
              <div className="flex justify-end">
                <Button icon="send" size="sm" onClick={postComment} disabled={!comment.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      {assignOpen && (
        <AssignModal
          onClose={() => setAssignOpen(false)}
          onAssign={assignUser}
          current={issue.assigned_to_user_id}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete issue?"
        message={`Issue #${id} will be moved to trash.`}
        confirmLabel="Delete"
        danger
        onConfirm={deleteIssue}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function TimelineEntry({ icon, color, actor, at, text, timeAgo }) {
  return (
    <div className="relative pl-7 pb-4 last:pb-0">
      <div className="absolute left-[-8px] top-0.5 w-[22px] h-[22px] rounded-[22px] grid place-items-center shadow-[0_0_0_4px_#fff]" style={{ background: color }}>
        <Icon name={icon} size={11} color="#fff" strokeWidth={2.4} />
      </div>
      <div>
        <div className="text-sm text-text leading-snug">
          <span className="font-semibold">{actor}</span>
          <span className="text-muted"> · {timeAgo(at)}</span>
        </div>
        {text && <div className="text-sm text-text-secondary mt-0.75 leading-relaxed whitespace-pre-wrap">{text}</div>}
      </div>
    </div>
  );
}

function AssignModal({ onClose, onAssign, current }) {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await window.PulseAPI.Users.list();
        setUsers(response.data.filter(u => u.is_active));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white w-full sm:max-w-[400px] sm:rounded-t-xl sm:rounded-b-xl max-h-[70vh] flex flex-col">
        <div className="p-4 border-b border-black/[.06] flex items-center justify-between">
          <h2 className="text-[16px] font-semibold m-0">Assign issue</h2>
          <IconButton icon="x" onClick={onClose} size={32} />
        </div>
        <div className="p-3 border-b border-black/[.06]">
          <Input value={q} onChange={setQ} icon="search" placeholder="Search users…" autoFocus />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-muted-light text-sm">Loading users…</div>
          ) : (
            <>
              <button
                onClick={() => onAssign(null)}
                className={`flex w-full p-3 rounded-lg cursor-pointer items-center gap-3 font-inherit text-left border-none ${
                  !current ? 'bg-accent/10' : 'bg-transparent hover:bg-black/[.03]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#f2f2f5] grid place-items-center">
                  <Icon name="x" size={14} color={TOKENS.muted} />
                </div>
                <span className="text-[14px] text-muted flex-1">Unassigned</span>
                {!current && <Icon name="check" size={16} color={TOKENS.accent} />}
              </button>
              {filtered.map(u => (
                <button
                  key={u.id}
                  onClick={() => onAssign(u.id)}
                  className={`flex w-full p-3 rounded-lg cursor-pointer items-center gap-3 font-inherit text-left border-none ${
                    u.id === current ? 'bg-accent/10' : 'bg-transparent hover:bg-black/[.03]'
                  }`}
                >
                  <Avatar name={u.name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-text font-medium truncate">{u.name}</div>
                    <div className="text-xs text-muted-light truncate">{u.roles?.[0]?.name} {u.department && `· ${u.department}`}</div>
                  </div>
                  {u.id === current && <Icon name="check" size={16} color={TOKENS.accent} />}
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.MobileIssueDetailPage = MobileIssueDetailPage;
