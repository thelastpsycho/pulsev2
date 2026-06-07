# GuestPulse Frontend

Hotel operations issue tracking system - Frontend application for GuestPulse.

![GuestPulse](https://img.shields.io/badge/GuestPulse-v1.0-blue)
![React](https://img.shields.io/badge/React-19.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)
![Vite](https://img.shields.io/badge/Vite-8.0-purple)

## Overview

GuestPulse is a comprehensive hotel operations management system that helps track, manage, and resolve guest issues efficiently. This frontend application connects to the GuestPulse API backend to provide a real-time, responsive interface for hotel staff.

## Features

### Core Functionality
- **Issue Management** - Create, track, update, and close guest issues
- **Real-time Dashboard** - Overview of open issues, priorities, and department statistics
- **Multi-department Support** - Assign issues to specific departments and users
- **Permission System** - Role-based access control with granular permissions
- **Activity Tracking** - Complete audit log of all system activities

### User Experience
- **Global Search** (⌘K) - Quick search across issues, users, and routes
- **Keyboard Shortcuts** - Navigate and act without leaving the keyboard
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Offline Support** - Queue requests when offline, auto-retry on reconnect
- **Dark/Light Mode** - Automatic theme switching

### Reports & Analytics
- **Custom Report Builder** - Build custom reports with filters and grouping
- **Export Options** - PDF and Excel export with branding
- **Interactive Charts** - Visual trends and statistics
- **Date Range Filtering** - Flexible date range selection with presets

### Admin Tools
- **User Management** - Create, edit, activate, and deactivate users
- **Role Management** - Define roles with custom permissions
- **Department Management** - Manage hotel departments
- **Issue Type Management** - Configure issue categories and types

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19.2 |
| **Build Tool** | Vite 8.0 |
| **Language** | JavaScript + TypeScript |
| **Styling** | TailwindCSS 4.x |
| **Routing** | Custom hash-based routing |
| **Code Quality** | ESLint |
| **Export** | jsPDF, jsPDF-AutoTable, XLSX |
| **Type Safety** | TypeScript 6.0 (strict mode) |

## Installation

### Prerequisites
- Node.js 18+ and npm

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd pulse1

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your API endpoint in .env
# VITE_API_BASE_URL=http://localhost:8000/api

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Environment Configuration

Create a `.env` file in the root directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Application Configuration
VITE_APP_NAME="GuestPulse"
VITE_APP_ENV=development
```

### Production Environment

For production, use `.env.production`:

```bash
VITE_API_BASE_URL=https://pulse.anvayabali.com/api
VITE_APP_NAME="GuestPulse"
VITE_APP_ENV=production
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint

# Deployment
vercel deploy        # Deploy to Vercel (requires vercel-cli)
```

## Project Structure

```
pulse1/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── layout/      # Layout components (Sidebar, Topbar)
│   │   ├── pages/       # Page components (Dashboard, Issues, etc.)
│   │   ├── reports/     # Report generation components
│   │   └── ui/          # UI component library
│   ├── lib/             # Core utilities
│   │   ├── api.ts       # API client (TypeScript)
│   │   ├── shortcuts.ts # Keyboard shortcuts (TypeScript)
│   │   ├── shortcuts-init.js # Shortcut initialization
│   │   ├── cache.ts     # Client-side caching
│   │   └── init.ts      # App initialization
│   ├── types/           # TypeScript definitions
│   │   └── index.ts     # All type definitions
│   ├── app.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── eslint.config.js     # ESLint configuration
└── package.json         # Dependencies and scripts
```

## API Integration

The frontend connects to the GuestPulse API backend. All API calls are made through the typed client in `src/lib/api.ts`.

### API Namespaces

```javascript
// Authentication
window.PulseAPI.Auth.login({ email, password })
window.PulseAPI.Auth.logout()
window.PulseAPI.Auth.me()

// Issues
window.PulseAPI.Issues.list(filters)
window.PulseAPI.Issues.get(id)
window.PulseAPI.Issues.create(data)
window.PulseAPI.Issues.update(id, data)
window.PulseAPI.Issues.close(id)
window.PulseAPI.Issues.reopen(id)

// Users & Roles
window.PulseAPI.Users.list()
window.PulseAPI.Roles.list()

// Statistics
window.PulseAPI.Stats.dashboard()
window.PulseAPI.Stats.trends({ period, limit })
```

### Authentication

1. User logs in with email and password
2. API returns JWT token
3. Token stored in `localStorage` as `gp_token`
4. All subsequent requests include `Authorization: Bearer {token}` header

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` / `Ctrl+K` | Open global search |
| `/` | Show keyboard shortcuts help |
| `⌘Shift+D` / `CtrlShift+D` | Go to dashboard |
| `⌘Shift+I` / `CtrlShift+I` | Create new issue |
| `Escape` | Close modal/drawer/search |
| `J` | Next issue (in issues list) |
| `K` | Previous issue (in issues list) |
| `Enter` | Open selected issue |

## Permission System

GuestPulse uses a granular permission system with dot notation:

- `issues.view` - View issues list
- `issues.create` - Create new issues
- `issues.update` - Edit issues
- `issues.delete` - Delete issues
- `admin.users.view` - View user management
- `admin.roles.view` - View role management
- `reports.view` - Access reports
- etc.

### Checking Permissions

```javascript
// In components
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

// Usage
if (can(user, "admin.users.view")) {
  // Show admin users section
}
```

## Routing

The app uses hash-based routing for better compatibility:

```javascript
const path = useHashRoute();      // Get current path (without #)
navigate('/issues');               // Navigate to route
matchPath('/issues/:id', path);    // Extract route params
```

### Available Routes

| Route | Page | Permission Required |
|-------|------|---------------------|
| `/` | Dashboard | - |
| `/issues` | Issues Inbox | - |
| `/issues/new` | New Issue | `issues.create` |
| `/issues/:id` | Issue Detail | - |
| `/issues/:id/edit` | Edit Issue | `issues.update` |
| `/reports` | Reports | `reports.view` |
| `/reports/builder` | Report Builder | `reports.view` |
| `/admin/users` | User Management | `admin.users.view` |
| `/admin/roles` | Role Management | `admin.roles.view` |
| `/admin/departments` | Department Management | `admin.departments.view` |
| `/admin/issue-types` | Issue Types | `admin.issue-types.view` |

## Development

### Adding a New Page

1. Create component in `src/components/pages/YourPage.jsx`
2. Import in `src/main.jsx`
3. Add route in `src/app.jsx`
4. Add permission check if needed
5. Add sidebar link in `src/components/layout/Layout.jsx`

### Adding API Endpoint

1. Add type definition in `src/types/index.ts`
2. Add API method in `src/lib/api.ts`
3. Export via `window.PulseAPI`
4. Use in components with error handling

### TypeScript Path Aliases

```javascript
// Configured in tsconfig.json
import { User } from '@/types';
import { API } from '@/lib/api';
import { Button } from '@/components/ui/UIPrimitives';
```

## Deployment

### Build for Production

```bash
npm run build
# Output: dist/ directory
```

### Deploy to Vercel

```bash
vercel deploy
```

Configuration in `vercel.json`:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## License

Proprietary - Copyright © 2026 Anvaya Bali

## Support

For issues or questions, contact the development team.
