import { useState, useEffect } from 'react'
import { usePageTitle } from './lib/usePageTitle'
// ============================================================================
// App root + routing
// ============================================================================

const { AppLayout, useHashRoute, matchPath, navigate } = window.PulseLayout;
const { ToastHost } = window.PulseOverlay;

// ---- Permission Helper ----------------------------------------------------
// Check if user has a specific permission.
// This matches the backend's permission system (e.g., "admin.users.view").
// Works with permission names from the API, supports wildcards like "admin.users.*"
function can(user, permission) {
  if (!user?.permissions) return false;
  return user.permissions.some(p => {
    if (p === permission) return true;
    // Support wildcard permissions: "admin.users.*" matches "admin.users.view"
    if (p.endsWith('*')) {
      const prefix = p.slice(0, -2);
      return permission.startsWith(prefix + '.');
    }
    return false;
  });
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const path = useHashRoute();

  // Update page title based on current route (must be before conditional returns)
  usePageTitle(null, [path]);

  // Auto-login as Sofia Reyes on mount for the demo. In production, check localStorage for token.
  useEffect(() => {
    const token = localStorage.getItem("gp_token");
    if (token) {
      window.PulseAPI.Auth.me()
        .then(r => {
          setUser(r.user);
          setAuthLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("gp_token");
          setAuthLoading(false);
        });
    } else {
      // Defer setState to avoid calling it synchronously in effect
      Promise.resolve().then(() => setAuthLoading(false));
    }
  }, []);

  const onLogin = (r) => {
    localStorage.setItem("gp_token", r.token);
    setUser(r.user);
    if (path === "/login" || path === "/") navigate("/");
  };
  const onSignOut = async () => {
    await window.PulseAPI.Auth.logout();
    localStorage.removeItem("gp_token");
    setUser(null);
    navigate("/login");
  };

  if (authLoading) {
    return <div className="grid place-items-center h-screen text-muted-light text-xs">Loading…</div>;
  }

  if (!user) return <><window.PageLogin onLogin={onLogin}/><ToastHost/></>;

  // route matching
  let page;
  let m;
  if (path === "/" || path === "/dashboard") {
    page = <window.PageDashboard user={user}/>;
  } else if (path === "/issues" || path === "/issues/") {
    page = <window.PageIssuesInbox/>;
  } else if (path === "/issues/new") {
    page = <window.PageIssueForm/>;
  } else if ((m = matchPath("/issues/:id/edit", path))) {
    page = <window.PageIssueForm id={Number(m.id)}/>;
  } else if ((m = matchPath("/issues/:id", path))) {
    page = <window.PageIssuesInbox selectedId={Number(m.id)}/>;
  } else if (path === "/reports" || path === "/reports/") {
    page = <window.PageReports tab="index"/>;
  } else if (path === "/reports/custom") {
    page = <window.PageReports tab="custom"/>;
  } else if (path === "/reports/builder") {
    page = can(user, "reports.view") ? (window.SimpleReportBuilder ? <window.SimpleReportBuilder/> : <NotFound/>) : <NotFound/>;
  } else if (path === "/reports/logbook") {
    page = <window.PageReports tab="logbook"/>;
  } else if (path === "/statistics") {
    page = <window.PageStatistics/>;
  } else if (path === "/graphs") {
    page = <window.PageGraphs/>;
  } else if (path === "/admin/users") {
    page = can(user, "admin.users.view") ? <window.PageAdminUsers/> : <NotFound/>;
  } else if (path === "/admin/roles") {
    page = can(user, "admin.roles.view") ? <window.PageAdminRoles/> : <NotFound/>;
  } else if (path === "/admin/departments") {
    page = can(user, "admin.departments.view") ? <window.PageAdminDepartments/> : <NotFound/>;
  } else if (path === "/admin/issue-types") {
    page = can(user, "admin.issue-types.view") ? <window.PageAdminIssueTypes/> : <NotFound/>;
  } else if (path === "/profile") {
    page = <window.PageProfile user={user}/>;
  } else {
    page = <NotFound/>;
  }

  return (
    <>
      <AppLayout user={user} onSignOut={onSignOut}>{page}</AppLayout>
      <ToastHost/>
    </>
  );
}

function NotFound() {
  const { EmptyState, Button } = window.PulseUI;
  return (
    <div className="grid place-items-center" style={{ height: "calc(100vh - 56px)" }}>
      <EmptyState icon="search" title="Page not found" description="The page you're looking for doesn't exist."
        action={<Button onClick={() => navigate("/")}>Back to dashboard</Button>}/>
    </div>
  );
}

export { App };
