# GuestPulse Frontend - Project Context

## Project Overview

**GuestPulse** is a hotel operations issue tracking system with two components:
- **Backend API**: Laravel app in `/Users/andikrisnatha/project/pulse/`
- **Frontend**: This React app in `/Users/andikrisnatha/project/pulse1/`

This is the **production frontend** for GuestPulse, connecting to the real API at `https://pulse.anvayabali.com/api` (or locally at `http://localhost:8000/api`).

## Tech Stack

- **React 19** with Vite 8
- **TypeScript** for type-safe development (api.ts, types, new components)
- **TailwindCSS 4.x** for styling (via PulseUI components)
- **Hash-based routing** (custom implementation, no React Router dependency despite being installed)
- **ESLint** for code quality
- **Export Libraries**: jsPDF, jsPDF-AutoTable, XLSX for report generation

## Key File Locations

### Entry Points
- **`src/main.jsx`** - App initialization, loads all components globally
- **`src/app.jsx`** - Routing, permission checks, auth logic
- **`index.html`** - HTML entry point

### Library Files (`src/lib/`)
- **`api.ts`** - Real API client (TypeScript) connecting to Pulse API
- **`shortcuts.ts`** - TypeScript keyboard shortcuts system
- **`shortcuts-init.js`** - JavaScript keyboard shortcuts initialization
- **`cache.ts`** - Client-side caching utilities
- **`init.ts`** - App initialization utilities

### Type Definitions (`src/types/`)
- **`index.ts`** - Complete TypeScript type definitions for all entities, API responses, UI components

### Components (`src/components/`)
- **`layout/`** - Layout components (Layout, Sidebar, Topbar)
- **`pages/`** - Page components (LoginPage, DashboardPage, IssuesPage, etc.)
- **`ui/`** - UI component library (UIPrimitives, UIForm, UIOverlay, GlobalSearch, etc.)
- **`reports/`** - Report generation components (ReportBuilder, SimpleReportBuilder)

## Development

### Environment Setup
```bash
# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
# Runs on http://localhost:5173

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Environment Variables (`.env`)
```bash
VITE_API_BASE_URL=http://localhost:8000/api  # API endpoint
VITE_APP_NAME="GuestPulse"                    # App name
VITE_APP_ENV=development                      # Environment
```

### TypeScript Configuration
- Path aliases configured in `tsconfig.json`:
  - `@/*` → `./src/*`
  - `@/components/*` → `./src/components/*`
  - `@/lib/*` → `./src/lib/*`
  - `@/types` → `./src/types`
- Strict mode enabled for type safety

## API Integration

### API Client (`src/lib/api.ts`)
Real API client with TypeScript types connecting to Pulse API:

```typescript
// Available API namespaces:
window.PulseAPI.Auth        // login, logout, me
window.PulseAPI.Issues      // list, get, create, update, delete, close, reopen
window.PulseAPI.Comments    // listForIssue, create, delete
window.PulseAPI.Departments // list, create, update, delete
window.PulseAPI.IssueTypes  // list, create, update, delete
window.PulseAPI.Categories  // list
window.PulseAPI.Users       // list, get, create, update, activate, deactivate, delete
window.PulseAPI.Roles       // list, create, update, delete
window.PulseAPI.Permissions // list
window.PulseAPI.Stats       // dashboard, byDepartment, byUser, trends
window.PulseAPI.Reports     // month, year
window.PulseAPI.Activity    // list
```

### Authentication Flow
1. Login via `window.PulseAPI.Auth.login({ email, password })`
2. Token stored in `localStorage` as "gp_token"
3. User data loaded via `window.PulseAPI.Auth.me()`
4. Authorization header included in all API requests
5. Permission checks via `can(user, permission)` function

### Test Login Credentials
- **Email**: sofia.reyes@anvayabali.com
- **Password**: (Contact system admin)
- **Role**: Duty Manager (14 permissions)

Other test users available via API.

## Features

### Global Search (⌘K / Ctrl+K)
- **`src/components/ui/GlobalSearch.tsx`** - TypeScript search component
- Fuzzy search across issues, users, routes, issue types
- Recent searches tracking
- Keyboard navigation

### Keyboard Shortcuts
- **`src/lib/shortcuts-init.js`** - Keyboard shortcuts system
- Default shortcuts:
  - `⌘K` / `Ctrl+K` - Open global search
  - `/` - Show keyboard shortcuts help
  - `⌘Shift+D` / `CtrlShift+D` - Go to dashboard
  - `⌘Shift+I` / `CtrlShift+I` - Create new issue
  - `Escape` - Close modal/drawer/search
  - `J` / `K` - Navigate issue list
  - `Enter` - Open selected issue

### Report Builder
- **`src/components/reports/SimpleReportBuilder.jsx`**
- **`src/components/reports/ReportBuilder.tsx`**
- PDF and Excel export with jsPDF and XLSX
- Custom report configuration
- Date range filtering
- Chart generation

### Interactive Charts
- **`src/components/ui/InteractiveChart.tsx`**
- Line, bar, and pie charts
- Period comparison
- Trend visualization

### Date Range Picker
- **`src/components/ui/DateRangePicker.jsx`**
- **`src/components/ui/RangeDatePicker.jsx`**
- Preset ranges (Today, Yesterday, Last 7 days, etc.)
- Custom date selection

### Network Status
- **`src/components/ui/NetworkStatus.tsx`**
- **`src/components/ui/SimpleNetworkStatus.jsx`**
- Offline detection
- Request queue for offline mode
- Auto-retry on reconnect

## Permission System

### Permission Format
- Dot notation: `"admin.users.view"`, `"issues.create"`, `"reports.view"`
- Wildcard support: `"admin.users.*"` matches `"admin.users.view"`, `"admin.users.edit"`

### Permission Checking
```javascript
// In components:
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

// Usage:
if (can(user, "admin.users.view")) {
  // Show admin users section
}
```

### Route Protection
```javascript
// In src/app.jsx:
{path === "/admin/users" && (
  can(user, "admin.users.view")
    ? <window.PageAdminUsers/>
    : <NotFound/>
)}
```

### Role Hierarchy
- **SuperAdmin**: Full system access
- **Duty Manager**: Operations permissions
- **Department Head**: Department-scoped access
- **Staff**: Basic operation permissions

## UI Component Library

### Available Components
```javascript
// PulseUI - Basic components
const { Button, IconButton, Card, CardHeader, Icon, Avatar, Pill,
        PriorityPill, StatusPill, Skeleton, EmptyState, Kbd, cx } = window.PulseUI;

// PulseForm - Form components
const { Field, Input, Textarea, Select, MultiSelect, SearchableSelect,
        Checkbox, Toggle, Segmented } = window.PulseForm;

// PulseOverlay - Overlay components
const { Modal, Drawer, Dropdown, DropdownItem, DropdownDivider,
        ConfirmDialog, ToastHost } = window.PulseOverlay;

// PulseLayout - Layout components
const { useHashRoute, navigate, Link, matchPath, AppLayout, Sidebar,
        Topbar, PageHeader, Tabs } = window.PulseLayout;
```

### Design Tokens
```javascript
window.PulseUI.TOKENS = {
  accent: "#007aff",
  text: "#1d1d1f",
  textSecondary: "#3a3a3c",
  muted: "#6e6e73",
  mutedLight: "#86868b",
  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.12)",
  surface: "#ffffff",
  bg: "#f5f5f7",
  bgSoft: "#fafafa",
  success: "#34c759",
  warning: "#ff9500",
  danger: "#ff3b30",
  // Priority colors
  urgent: "#ff3b30",
  high: "#ff9500",
  medium: "#ffb800",
  low: "#34c759",
  // ...
};
```

## Routing

Hash-based routing with custom implementation:

```javascript
const path = useHashRoute(); // Get current path without hash
navigate('/issues');         // Navigate to route
matchPath('/issues/:id', path); // Pattern matching with params
```

### Available Routes
| Route | Component | Permission |
|-------|-----------|------------|
| `/`, `/dashboard` | PageDashboard | - |
| `/issues` | PageIssuesInbox | - |
| `/issues/new` | PageIssueForm | `issues.create` |
| `/issues/:id/edit` | PageIssueForm | `issues.update` |
| `/reports` | PageReports | `reports.view` |
| `/reports/builder` | SimpleReportBuilder | `reports.view` |
| `/admin/users` | PageAdminUsers | `admin.users.view` |
| `/admin/roles` | PageAdminRoles | `admin.roles.view` |
| `/admin/departments` | PageAdminDepartments | `admin.departments.view` |
| `/admin/issue-types` | PageAdminIssueTypes | `admin.issue-types.view` |
| `/profile` | PageProfile | - |

## Type Definitions

TypeScript types are defined in `src/types/index.ts`:
- **User, Role, Permission, Department, IssueType, IssueCategory**
- **Issue, Comment, ActivityLog**
- **ApiResponse, PaginationMeta, ErrorResponse**
- **DashboardStats, TrendsStats, DepartmentStats, UserStats**
- **MonthReport, YearReport**
- **IssueFormData, UserFormData, DepartmentFormData**
- **IssueFilters, SearchResult, KeyboardShortcut**
- **IconName, ButtonProps, CardProps** - UI component types

## Common Tasks

### Add New Permission
1. Add permission in backend API (Laravel)
2. Permission will be available via `/api/permissions` endpoint
3. Assign to role via `/api/roles/{id}` endpoint
4. Check with `can(user, "new.permission")` in components

### Add New Route
1. Create page component in `src/components/pages/`
2. Import in `src/main.jsx`
3. Add route in `src/app.jsx` with permission check
4. Add sidebar item in Layout component

### Add New API Endpoint
1. Add type definition in `src/types/index.ts`
2. Add API method in `src/lib/api.ts`
3. Export via `window.PulseAPI` object
4. Use in components with proper error handling

### Create New UI Component
1. Create component in `src/components/ui/`
2. Import in `src/main.jsx` for global access
3. Export via window object (e.g., `window.PulseUI.MyComponent`)
4. Add type definition in `src/types/index.ts` if using TypeScript

## Debugging

### Console Debugging
```javascript
// Check current user permissions:
console.log('User permissions:', user?.permissions);

// Test specific permission:
console.log('Can view users:', can(user, 'admin.users.view'));

// Check API client:
console.log('PulseAPI:', window.PulseAPI);

// Check available components:
console.log('PulseUI:', window.PulseUI);
console.log('PulseForm:', window.PulseForm);
console.log('PulseLayout:', window.PulseLayout);
```

### Network Debugging
- Check NetworkStatus component for online/offline state
- API requests include Authorization header with Bearer token
- 404 errors logged for unimplemented endpoints
- Check `.env` for correct API_BASE_URL

## Deployment

### Production Build
```bash
npm run build
# Output in dist/ directory
```

### Environment Files
- `.env` - Local development
- `.env.production` - Production configuration
- `vercel.json` - Vercel deployment configuration

## Backend API Reference

For the full Laravel backend implementation, see `/Users/andikrisnatha/project/pulse/`.

### API Endpoints
- **Auth**: `/api/login`, `/api/logout`, `/api/me`
- **Issues**: `/api/issues` (CRUD, close, reopen)
- **Comments**: `/api/issue-comments`
- **Users**: `/api/users` (activate, deactivate)
- **Roles**: `/api/roles`
- **Departments**: `/api/departments`
- **Issue Types**: `/api/issue-types`, `/api/issue-categories`
- **Permissions**: `/api/permissions`
- **Statistics**: `/api/statistics/*`
- **Reports**: `/api/reports/*`
- **Activity**: `/api/activity`

## Important Notes

- This is the **production frontend** with real API integration
- TypeScript is used for new components and the API client
- Legacy components remain in JSX for gradual migration
- All admin features require specific permissions
- Offline mode supported with request queue
- Keyboard shortcuts work throughout the app
