// ============================================================================
// Router (hash-based, dependency-free)
// Layout: Sidebar + Topbar + Main content area
// All styling via Tailwind classes.
// ============================================================================

import React from 'react';

const { useState, useEffect, Fragment } = React;

// Helper to safely access window.PulseUI and window.PulseOverlay
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, Avatar: () => null, TOKENS: {}, IconButton: () => null, cx: (...xs) => xs.filter(Boolean).join(" ") };
};

const getPulseOverlay = () => {
  if (typeof window !== 'undefined' && window.PulseOverlay) {
    return window.PulseOverlay;
  }
  return { Dropdown: () => null, DropdownItem: () => null, DropdownDivider: () => null };
};

const IconL = getPulseUI().Icon;
const AvatarL = getPulseUI().Avatar;
const TL = getPulseUI().TOKENS;
const IconBtnL = getPulseUI().IconButton;
const cxL = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));
const DropdownL = getPulseOverlay().Dropdown;
const DropdownItemL = getPulseOverlay().DropdownItem;
const DropdownDividerL = getPulseOverlay().DropdownDivider;

// Import new components
const GlobalSearchL = typeof window !== 'undefined' && window.SimpleGlobalSearch ? window.SimpleGlobalSearch : () => null;
const NetworkStatusL = typeof window !== 'undefined' && window.SimpleNetworkStatus ? window.SimpleNetworkStatus : () => null;
const KeyboardShortcutsHelpL = typeof window !== 'undefined' && window.KeyboardShortcutsHelp ? window.KeyboardShortcutsHelp : () => null;

// ---- Permission Helper ----------------------------------------------------
function can(user, permission) {
  if (!user?.permissions) return false;
  return user.permissions.some(p => {
    if (p === permission) return true;
    if (p.endsWith('*')) {
      const prefix = p.slice(0, -2);
      return permission.startsWith(prefix + '.');
    }
    return false;
  });
}

// ---- Hash router -----------------------------------------------------------
function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash.slice(1) || "/";
}

function navigate(to) { window.location.hash = "#" + to; }

function Link({ to, children, className, onClick }) {
  return (
    <a
      href={"#" + to}
      onClick={(e) => { e.preventDefault(); navigate(to); onClick?.(e); }}
      className={cxL("text-inherit no-underline", className)}
    >
      {children}
    </a>
  );
}

// Match patterns like "/issues/:id" against current path. Returns params object or null.
function matchPath(pattern, path) {
  const pp = pattern.split("/").filter(Boolean);
  const ap = path.split("/").filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = ap[i];
    else if (pp[i] !== ap[i]) return null;
  }
  return params;
}

// ---- Sidebar ---------------------------------------------------------------
function Sidebar({ user, counts, collapsed }) {
  const path = useHashRoute();

  // Build admin items based on user's permissions
  const adminItems = [
    { to: "/admin/users", label: "Users", icon: "users", permission: "admin.users.view" },
    { to: "/admin/roles", label: "Roles", icon: "shield", permission: "admin.roles.view" },
    { to: "/admin/departments", label: "Departments", icon: "building", permission: "admin.departments.view" },
    { to: "/admin/issue-types", label: "Issue Types", icon: "tags", permission: "admin.issue-types.view" },
  ].filter(item => can(user, item.permission));

  const chatItems = [
    { to: "/chat", label: "AI Assistant", icon: "message", permission: "ai.chat.view" },
  ].filter(item => can(user, item.permission));

  const NAV = [
    { section: "main", items: [
      { to: "/", label: "Dashboard", icon: "dashboard", match: ["/"] },
      { to: "/issues", label: "Issues", icon: "inbox", match: ["/issues", "/issues/"], count: counts?.openIssues },
      ...chatItems,
    ]},
    { section: "reports", title: "Reports", items: [
      { to: "/reports", label: "Reports", icon: "report" },
      { to: "/reports/custom", label: "Custom", icon: "filter" },
      { to: "/reports/builder", label: "Report Builder", icon: "chart-bar" },
      { to: "/reports/logbook", label: "Logbook", icon: "book" },
      { to: "/statistics", label: "Statistics", icon: "chart-pie" },
      { to: "/graphs", label: "Graphs", icon: "chart-line" },
    ]},
    ...(adminItems.length > 0 ? [{ section: "admin", title: "Administration", items: adminItems }] : []),
  ];

  const isActive = (item) => {
    if (item.match) return item.match.some(m => path === m || path.startsWith(m + "/"));
    return path === item.to || path.startsWith(item.to + "/");
  };

  return (
    <aside className={cxL(
      "shrink-0 flex flex-col bg-bg text-text border-r border-black/[.06]",
      "transition-[width] duration-200 ease-[cubic-bezier(.2,.7,.2,1)]",
      collapsed ? "w-16" : "w-[232px]",
    )}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 pt-3.5 pb-3 px-3.5 h-14">
        <div className="w-7 h-7 rounded-lg shrink-0 grid place-items-center bg-gradient-to-b from-[#1d1d1f] to-[#2c2c2e] shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
          <IconL name="pulse" size={16} color="#fff" strokeWidth={2.2}/>
        </div>
        {!collapsed && (
          <div>
            <div className="text-[15px] font-semibold tracking-tighter2 leading-[1.1]">GuestPulse</div>
            <div className="text-[10.5px] text-muted-light tracking-wider uppercase mt-0.5">Anvaya Bali</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto pt-1 pb-3 px-2.5">
        {NAV.map((section, si) => (
          <div key={section.section} className="mb-2.5">
            {section.title && !collapsed && (
              <div className="text-[10.5px] text-muted-light font-semibold uppercase tracking-upper-wider pt-2.5 pb-1.5 px-3">{section.title}</div>
            )}
            {section.title && collapsed && si > 0 && <div className="h-px bg-black/[.06] my-2 mx-2"/>}
            <div className="flex flex-col gap-px">
              {section.items.map(item => (
                <SidebarItem key={item.to} item={item} active={isActive(item)} collapsed={collapsed}/>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-2.5 border-t border-black/[.06]">
        {/* Mobile view link */}
        <Link to="/mobile">
          <div className="flex items-center gap-[9px] p-1.5 rounded-lg cursor-pointer hover:bg-black/[.04] mb-1">
            <IconL name="smartphone" size={18} color={TL.mutedLight}/>
            <div className="text-[12.5px] text-muted-light font-medium">Mobile View</div>
          </div>
        </Link>
        <Link to="/profile">
          <div className="flex items-center gap-[9px] p-1.5 rounded-lg cursor-pointer hover:bg-black/[.04]">
            <AvatarL name={user?.name} size={28}/>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-text whitespace-nowrap overflow-hidden text-ellipsis">{user?.name}</div>
                <div className="text-[11px] text-muted-light whitespace-nowrap overflow-hidden text-ellipsis">{user?.roles?.[0]?.name || "User"}</div>
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}

function SidebarItem({ item, active, collapsed }) {
  return (
    <Link to={item.to}>
      <div
        title={collapsed ? item.label : undefined}
        className={cxL(
          "flex items-center gap-[9px] rounded-[7px] text-text text-[13.5px] tracking-body transition-colors duration-100",
          collapsed ? "py-2 px-[9px] justify-center" : "py-[7px] px-2.5 justify-start",
          active ? "bg-black/[.06] font-semibold" : "bg-transparent hover:bg-black/[.035] font-medium",
        )}
      >
        <IconL name={item.icon} size={15} color={active ? TL.text : TL.textSecondary}/>
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && item.count != null && item.count > 0 && (
          <span className="text-[11.5px] text-muted-light tabular-nums font-medium">{item.count}</span>
        )}
      </div>
    </Link>
  );
}

// ---- Topbar ----------------------------------------------------------------
function Topbar({ user, title, breadcrumb, actions, onToggleSidebar, onSignOut, className }) {
  const handleSearchClick = () => {
    // Dispatch custom event for GlobalSearch
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gp:search:open'));
    }
  };

  return (
    <header className={cxL(
      "h-14 shrink-0 border-b border-black/[.06] bg-white/[.86] backdrop-saturate-[1.8] backdrop-blur-2xl flex items-center justify-between px-[22px] gap-3",
      className,
    )}>
      <div className="flex items-center gap-3 min-w-0">
        <IconBtnL icon="menu" onClick={onToggleSidebar} title="Toggle sidebar" size={32}/>
        <div className="flex items-center gap-2 min-w-0 text-sm font-semibold tracking-tightish">
          {breadcrumb?.map((b, i) => (
            <Fragment key={i}>
              {i > 0 && <IconL name="chevron-right" size={12} color={TL.mutedLight}/>}
              {b.to
                ? <Link to={b.to} className="text-muted font-medium">{b.label}</Link>
                : <span className="text-text whitespace-nowrap overflow-hidden text-ellipsis max-w-[480px]">{b.label}</span>}
            </Fragment>
          ))}
          {!breadcrumb && title && <span className="text-text">{title}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {actions}
        <IconBtnL icon="search" onClick={handleSearchClick} title="Search (⌘ K)" size={32}/>
        <IconBtnL icon="bell" title="Notifications" size={32}/>
        {/* Network Status Indicator */}
        <NetworkStatusL />
        <DropdownL trigger={
          <button className="bg-transparent border-none p-1 cursor-pointer rounded-3xl">
            <AvatarL name={user?.name} size={28}/>
          </button>
        } align="right" width={200}>
          <div className="pt-2 pb-1.5 px-2.5">
            <div className="text-[13px] font-semibold">{user?.name}</div>
            <div className="text-[11.5px] text-muted-light">{user?.email}</div>
          </div>
          <DropdownDividerL/>
          <DropdownItemL icon="user" label="Profile" onClick={() => navigate("/profile")}/>
          <DropdownItemL icon="settings" label="Preferences" onClick={() => navigate("/profile")}/>
          <DropdownDividerL/>
          <DropdownItemL icon="logout" label="Sign out" danger onClick={onSignOut}/>
        </DropdownL>
      </div>
    </header>
  );
}

// ---- Page header (inside content) -----------------------------------------
function PageHeader({ title, subtitle, actions, tabs, sticky = true, className }) {
  return (
    <div className={cxL(
      "pt-6 px-7",
      sticky && "sticky top-0 bg-white z-[5]",
      className,
    )}>
      <div className={cxL(
        "flex items-end justify-between gap-4",
        tabs ? "mb-4" : "mb-6",
      )}>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tighter4 m-0 leading-tight">{title}</h1>
          {subtitle && <div className="text-[13.5px] text-muted mt-1.5">{subtitle}</div>}
        </div>
        {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
      </div>
      {tabs}
    </div>
  );
}

// ---- Tabs ------------------------------------------------------------------
function Tabs({ value, onChange, items, className }) {
  return (
    <div className={cxL("flex gap-1 border-b border-black/[.06] -mb-px", className)}>
      {items.map(t => {
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange(t.value)} className={cxL(
            "py-2 px-3 border-none bg-transparent text-[13.5px] font-[inherit] cursor-pointer -mb-px tracking-body",
            "inline-flex items-center gap-1.5 transition-colors duration-100",
            "border-b-2",
            active ? "text-text font-semibold border-accent" : "text-muted font-medium border-transparent",
          )}>
            {t.label}
            {t.count != null && (
              <span className={cxL(
                "text-[11.5px] tabular-nums py-px px-1.5 rounded-md font-semibold",
                active ? "text-accent bg-accent/10" : "text-muted-light bg-black/[.05]",
              )}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- AppLayout -------------------------------------------------------------
function AppLayout({ user, children, onSignOut, breadcrumb, title, actions, className }) {
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({ openIssues: 0 });

  // Fetch issue counts from API
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await window.PulseAPI.Stats.dashboard();
        setCounts({ openIssues: response.summary.open_issues || 0 });
      } catch (error) {
        console.error('Failed to fetch issue counts:', error);
        setCounts({ openIssues: 0 });
      }
    };
    fetchCounts();
  }, []);

  return (
    <div className={cxL("flex h-screen overflow-hidden bg-white", className)}>
      {/* Global Search - always available */}
      <GlobalSearchL />

      {/* Keyboard Shortcuts Help - always available */}
      <KeyboardShortcutsHelpL />

      <Sidebar user={user} counts={counts} collapsed={collapsed}/>
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar user={user} breadcrumb={breadcrumb} title={title} actions={actions}
          onToggleSidebar={() => setCollapsed(c => !c)} onSignOut={onSignOut}/>
        <main className="flex-1 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

window.PulseLayout = { useHashRoute, navigate, Link, matchPath, AppLayout, Sidebar, Topbar, PageHeader, Tabs, can };
