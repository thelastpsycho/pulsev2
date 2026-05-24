# GuestPulse Frontend Demo - Project Context

## Project Overview

**GuestPulse** is a hotel operations issue tracking system with two components:
- **Backend API**: Laravel app in `/Users/andikrisnatha/project/pulse/`
- **Frontend Demo**: This React app in `/Users/andikrisnatha/project/pulse1/`

This is a **frontend demo/mock** of the GuestPulse system. For the full Laravel backend, see the `pulse/` directory.

## Tech Stack

- **React 19** with Vite 8
- **TailwindCSS** for styling (via PulseUI components)
- **Hash-based routing** (no React Router dependency)
- **Mock API** in `src/mock.js` and `src/api.js`

## Key File Locations

### Frontend Components (New Organized Structure)
- **Main App**: `src/app.jsx` - Routing, permission checks, auth logic
- **Entry Point**: `src/main.jsx` - App initialization
- **Library Files**: `src/lib/` - Core functionality
  - `api.js` - Mock API implementation
  - `mock.js` - Test users, permissions, issues data
- **Components**: `src/components/` - Organized by purpose
  - `layout/` - Layout components (Layout, Sidebar, Topbar)
  - `pages/` - Page components (LoginPage, DashboardPage, etc.)
  - `ui/` - UI component library (UIPrimitives, UIForm, UIOverlay)

## User Login System

### Current Test Users (from mock.js)
```javascript
// Email: ak@ak.ak, Password: 123456789 (SuperAdmin - 39 permissions)
{
  id: 12,
  name: "AK SuperAdmin",
  email: "ak@ak.ak",
  role: "SuperAdmin",
  permissions: [/* all 39 permissions */]
}

// Other test users available:
- sofia.reyes@anvayabali.com (Duty Manager - 14 permissions)
- mei.lin@anvayabali.com (SuperAdmin - 39 permissions)
- jordan.hayes@anvayabali.com (Staff - 13 permissions)
```

### Authentication Flow
1. Login via `src/page-login.jsx` → calls `window.PulseAPI.Auth.login()`
2. Token stored in `localStorage` as "gp_token"
3. User data loaded via `window.PulseAPI.Auth.me()`
4. Permission checks via `can(user, permission)` function in `src/app.jsx`

### Permission System
- **Format**: Dot notation (e.g., "admin.users.view", "issues.create")
- **Wildcard support**: "admin.users.*" matches "admin.users.view"
- **Route protection**: Admin routes check permissions before rendering
- **Dynamic sidebar**: Menu items shown based on user permissions

## Development Servers

### Frontend (This Project)
```bash
cd /Users/andikrisnatha/project/pulse1
npm run dev
# Runs on http://localhost:5174
```

### Backend API (Laravel)
```bash
cd /Users/andikrisnatha/project/pulse
php artisan serve
# Runs on http://localhost:8000
```

## API Integration

### Current Setup
- **Mock API**: Uses `src/api.js` with in-memory data
- **Real API**: Laravel backend at `http://localhost:8000/api/`
- **Switching**: Replace mock functions in `src/api.js` with fetch() calls

### API Endpoints (Laravel)
- **Auth**: `/api/login`, `/api/logout`, `/api/me`
- **Issues**: `/api/issues` (CRUD operations)
- **Users**: `/api/users` (Admin only)
- **Roles**: `/api/roles` (Admin only)
- **Departments**: `/api/departments` (Admin only)

## Permission Architecture

### Role Hierarchy
- **SuperAdmin**: 39 permissions (full access)
- **Duty Manager**: 14 permissions (operations)
- **Department Head**: 11 permissions (department-scoped)
- **Staff**: 13 permissions (basic operations)

### Permission Categories
- **Issues**: view, create, update, delete, close, reopen, export
- **Admin**: users, roles, departments, issue-types management
- **Reports**: view, monthly, yearly, logbook, export
- **Statistics & Graphs**: view access

## Component Patterns

### Permission Checking
```javascript
// In components:
import { can } from window.PulseLayout;

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

## UI Component Library

### Available Components
- **PulseUI**: Button, Input, Card, Modal, etc.
- **PulseForm**: Form components (Field, Select, MultiSelect)
- **PulseOverlay**: Modal, Drawer, Dropdown, Toast
- **PulseLayout**: AppLayout, Sidebar, navigation

### Usage
```javascript
const { Button, Card, Input } = window.PulseUI;
```

## Testing & Debugging

### Test Login Credentials
- **Email**: ak@ak.ak
- **Password**: 123456789
- **Role**: SuperAdmin (full access)

### Permission Testing
Run: `node test_permissions.js` (if available) for comprehensive permission tests.

### Console Debugging
```javascript
// Check current user permissions:
console.log('User permissions:', user?.permissions);

// Test specific permission:
console.log('Can view users:', can(user, 'admin.users.view'));
```

## Project Differences

### This Project (pulse1/)
- React frontend demo
- Mock API with sample data
- Hash-based routing
- Self-contained testing environment

### Main Project (pulse/)
- Laravel backend + Livewire frontend
- Real database with persistent data
- Full authentication system
- Production application

## Common Tasks

### Add New Permission
1. Add to `PERMISSIONS` array in `src/mock.js`
2. Assign to role in `ROLES` array
3. Check with `can(user, "new.permission")` in components

### Add New Admin Route
1. Create route in `src/app.jsx`
2. Add permission check with `can(user, "permission")`
3. Add sidebar item in `src/layout.jsx`

### Switch to Real API
1. Update API base URL in `src/api.js`
2. Replace mock functions with fetch() calls
3. Keep response formats consistent with mock data

## Important Notes

- This is a **demo/frontend prototype** - data resets on reload
- For real data, use the Laravel backend in `/Users/andikrisnatha/project/pulse/`
- User `ak@ak.ak` password was updated to `123456789` for testing
- Permission system is production-ready and matches Laravel implementation
- All admin features require specific permissions - no hardcoded access