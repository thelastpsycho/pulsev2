import { useState, useEffect, useMemo, Fragment } from 'react'
// ============================================================================
// Router (hash-based, dependency-free)
// Layout: Sidebar + Topbar + Main content area
// ============================================================================

// Helper to safely access window.PulseUI and window.PulseOverlay
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return { Icon: () => null, Avatar: () => null, TOKENS: {}, IconButton: () => null };
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
const DropdownL = getPulseOverlay().Dropdown;
const DropdownItemL = getPulseOverlay().DropdownItem;
const DropdownDividerL = getPulseOverlay().DropdownDivider;

// ---- Permission Helper ----------------------------------------------------
// Check if user has a specific permission.
// This works with permission names (e.g., "admin.users.view") from the API.
// Adding a new role with different permissions will work automatically.
function can(user, permission) {
  if (!user?.permissions) {
    console.log('can: No permissions on user', user);
    return false;
  }
  const result = user.permissions.some(p => {
    if (p === permission) return true;
    // Check wildcard: "admin.users.*" should match "admin.users.view"
    if (p.endsWith('*')) {
      const prefix = p.slice(0, -2); // Remove ".*"
      return permission.startsWith(prefix + '.');
    }
    return false;
  });
  console.log(`can(${permission}):`, result, 'User permissions:', user.permissions);
  return result;
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

function Link({ to, children, style, className, onClick }) {
  return (
    <a href={"#" + to}
       onClick={(e) => { e.preventDefault(); navigate(to); onClick?.(e); }}
       style={{ color: "inherit", textDecoration: "none", ...style }}
       className={className}>
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
  // Any new role with admin permissions will automatically show these items
  const adminItems = [
    { to: "/admin/users", label: "Users", icon: "users", permission: "admin.users.view" },
    { to: "/admin/roles", label: "Roles", icon: "shield", permission: "admin.roles.view" },
    { to: "/admin/departments", label: "Departments", icon: "building", permission: "admin.departments.view" },
    { to: "/admin/issue-types", label: "Issue Types", icon: "tags", permission: "admin.issue-types.view" },
  ].filter(item => can(user, item.permission));

  const NAV = [
    { section: "main", items: [
      { to: "/", label: "Dashboard", icon: "dashboard", match: ["/"] },
      { to: "/issues", label: "Issues", icon: "inbox", match: ["/issues", "/issues/"], count: counts?.openIssues },
    ]},
    { section: "reports", title: "Reports", items: [
      { to: "/reports", label: "Reports", icon: "report" },
      { to: "/reports/monthly", label: "Monthly", icon: "calendar" },
      { to: "/reports/yearly", label: "Yearly", icon: "calendar" },
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
    <aside style={{
      width: collapsed ? 64 : 232, flexShrink: 0,
      display: "flex", flexDirection: "column",
      background: "#f5f5f7", color: TL.text,
      borderRight: "1px solid rgba(0,0,0,0.06)",
      transition: "width 200ms cubic-bezier(.2,.7,.2,1)",
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 12px", height: 56 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(180deg, #1d1d1f 0%, #2c2c2e 100%)",
          display: "grid", placeItems: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}>
          <IconL name="pulse" size={16} color="#fff" strokeWidth={2.2}/>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.1 }}>GuestPulse</div>
            <div style={{ fontSize: 10.5, color: TL.mutedLight, letterSpacing: "0.02em", textTransform: "uppercase", marginTop: 2 }}>Anvaya Bali</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "4px 10px 12px" }}>
        {NAV.map((section, si) => (
          <div key={section.section} style={{ marginBottom: 10 }}>
            {section.title && !collapsed && (
              <div style={{ fontSize: 10.5, color: TL.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 12px 6px" }}>{section.title}</div>
            )}
            {section.title && collapsed && si > 0 && <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "8px 8px" }}/>}
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {section.items.map(item => (
                <SidebarItem key={item.to} item={item} active={isActive(item)} collapsed={collapsed}/>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "10px 10px 10px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Link to="/profile">
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "6px 6px", borderRadius: 8, cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            <AvatarL name={user?.name} size={28}/>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: TL.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: TL.mutedLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.roles?.[0]?.name || "User"}</div>
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}

function SidebarItem({ item, active, collapsed }) {
  const [h, setH] = useState(false);
  return (
    <Link to={item.to}>
      <div
        title={collapsed ? item.label : undefined}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: collapsed ? "8px 9px" : "7px 10px",
          borderRadius: 7,
          background: active ? "rgba(0,0,0,0.06)" : (h ? "rgba(0,0,0,0.035)" : "transparent"),
          color: TL.text, fontSize: 13.5, fontWeight: active ? 600 : 500,
          letterSpacing: "-0.005em", transition: "background 100ms",
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
        <IconL name={item.icon} size={15} color={active ? TL.text : TL.textSecondary}/>
        {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
        {!collapsed && item.count != null && item.count > 0 && (
          <span style={{ fontSize: 11.5, color: TL.mutedLight, fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{item.count}</span>
        )}
      </div>
    </Link>
  );
}

// ---- Topbar ----------------------------------------------------------------
function Topbar({ user, title, breadcrumb, actions, onToggleSidebar, onSignOut, onSearchFocus }) {
  return (
    <header style={{
      height: 56, flexShrink: 0,
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      background: "rgba(255,255,255,0.86)", backdropFilter: "saturate(180%) blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 22px", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <IconBtnL icon="menu" onClick={onToggleSidebar} title="Toggle sidebar" size={32}/>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {breadcrumb?.map((b, i) => (
            <Fragment key={i}>
              {i > 0 && <IconL name="chevron-right" size={12} color={TL.mutedLight}/>}
              {b.to
                ? <Link to={b.to} style={{ color: TL.muted, fontWeight: 500 }}>{b.label}</Link>
                : <span style={{ color: TL.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 480 }}>{b.label}</span>}
            </Fragment>
          ))}
          {!breadcrumb && title && <span style={{ color: TL.text }}>{title}</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {actions}
        <IconBtnL icon="search" onClick={onSearchFocus} title="Search (⌘ K)" size={32}/>
        <IconBtnL icon="bell" title="Notifications" size={32}/>
        <DropdownL trigger={
          <button style={{ background: "none", border: "none", padding: 4, cursor: "pointer", borderRadius: 24 }}>
            <AvatarL name={user?.name} size={28}/>
          </button>
        } align="right" width={200}>
          <div style={{ padding: "8px 10px 6px" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11.5, color: TL.mutedLight }}>{user?.email}</div>
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
function PageHeader({ title, subtitle, actions, tabs, sticky = true, style }) {
  return (
    <div style={{
      padding: "24px 28px 0",
      ...(sticky ? { position: "sticky", top: 0, background: "#fff", zIndex: 5 } : {}),
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: tabs ? 16 : 24 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", margin: 0, lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <div style={{ fontSize: 13.5, color: TL.muted, marginTop: 6 }}>{subtitle}</div>}
        </div>
        {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
      </div>
      {tabs}
    </div>
  );
}

// ---- Tabs ------------------------------------------------------------------
function Tabs({ value, onChange, items, style }) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(0,0,0,0.06)", marginBottom: -1, ...style }}>
      {items.map(t => {
        const active = value === t.value;
        return (
          <button key={t.value} onClick={() => onChange(t.value)} style={{
            padding: "8px 12px", border: "none", background: "transparent",
            color: active ? TL.text : TL.muted, fontSize: 13.5, fontWeight: active ? 600 : 500,
            fontFamily: "inherit", cursor: "pointer",
            borderBottom: `2px solid ${active ? TL.accent : "transparent"}`,
            marginBottom: -1, letterSpacing: "-0.005em",
            display: "inline-flex", alignItems: "center", gap: 6,
            transition: "color 100ms",
          }}>
            {t.label}
            {t.count != null && (
              <span style={{ fontSize: 11.5, color: active ? TL.accent : TL.mutedLight, fontVariantNumeric: "tabular-nums", padding: "1px 6px", background: active ? "rgba(0,122,255,0.10)" : "rgba(0,0,0,0.05)", borderRadius: 6, fontWeight: 600 }}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---- AppLayout -------------------------------------------------------------
function AppLayout({ user, children, onSignOut, breadcrumb, title, actions }) {
  const [collapsed, setCollapsed] = useState(false);
  // counts for sidebar — read live from mock issues
  const counts = useMemo(() => {
    const issues = window.PULSE_MOCK.ISSUES;
    return { openIssues: issues.filter(i => i.status === "open").length };
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#fff" }}>
      <Sidebar user={user} counts={counts} collapsed={collapsed}/>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar user={user} breadcrumb={breadcrumb} title={title} actions={actions}
          onToggleSidebar={() => setCollapsed(c => !c)} onSignOut={onSignOut}/>
        <main style={{ flex: 1, overflowY: "auto", background: "#fff" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

window.PulseLayout = { useHashRoute, navigate, Link, matchPath, AppLayout, Sidebar, Topbar, PageHeader, Tabs, can };
