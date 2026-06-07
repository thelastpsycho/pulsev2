# Mobile Layout Plan - GuestPulse Frontend

## Context
Create a dedicated mobile layout with bottom navigation, completely separate from the desktop layout. Desktop remains unchanged. Mobile gets a native app-like experience with issue CRUD functionality.

**Design**: Same Apple-minimal aesthetic as desktop (same colors, tokens, components)

---

## Files to Create

### 1. `src/components/pages/MobileLayout.jsx` - Mobile app shell

```jsx
// Mobile app wrapper with bottom navigation
function MobileLayout() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto pb-16">
        {activeTab === 'dashboard' && <MobileDashboardPage />}
        {activeTab === 'issues' && <MobileIssuesListPage />}
        {activeTab === 'profile' && <MobileProfilePage />}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-black/[.06] z-40">
        <BottomNav items={[
          { id: 'dashboard', icon: 'home', label: 'Home' },
          { id: 'issues', icon: 'inbox', label: 'Issues' },
          { id: 'profile', icon: 'user', label: 'Profile' },
        ]} active={activeTab} onChange={setActiveTab} />
      </nav>
    </div>
  );
}
```

### 2. `src/components/ui/MobileBottomNav.jsx` - Bottom navigation component

```jsx
function BottomNav({ items, active, onChange }) {
  const { Icon, cx } = window.PulseUI;
  const TOKENS = window.PulseUI.TOKENS;

  return (
    <div className="flex justify-around items-center h-16 px-safe">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cx(
            "flex flex-col items-center justify-center w-full h-full transition-colors",
            active === item.id ? "text-accent" : "text-muted-light"
          )}
        >
          <Icon name={item.icon} size={24} />
          <span className="text-[11px] mt-1 font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
```

### 3. `src/components/pages/mobile/MobileIssuesListPage.jsx` - Issue list

- Full-width issue cards (same card style as desktop, but full width)
- Filter button at top (opens filter sheet/modal)
- Search bar at top
- Floating action button (+) for new issue
- Tap card to open detail

### 4. `src/components/pages/mobile/MobileIssueDetailPage.jsx` - Issue detail

- Full-screen layout with back button header
- Guest info card
- Issue details (title, description, priority, status)
- Comments timeline
- Action buttons: Close/Reopen, Edit, Delete
- Add comment input at bottom

### 5. `src/components/pages/mobile/MobileIssueFormPage.jsx` - New/Edit form

- Full-width form with large touch targets
- Fields: guest name, room/location, title, description, priority, issue type, department, assignee
- Sticky submit button at bottom
- Validation errors inline

### 6. `src/components/pages/mobile/MobileDashboardPage.jsx` - Dashboard

- Stats cards (open issues, closed today, etc.)
- Recent issues list
- Quick action buttons

### 7. `src/components/pages/mobile/MobileProfilePage.jsx` - Profile

- User info card
- Logout button
- Settings (if any)

---

## Files to Modify

### 1. `src/app.jsx` - Add mobile routes

Add after existing routes:
```jsx
// Mobile routes
{path === "/mobile" && <window.MobileLayout />}
{path === "/mobile/issues" && <window.MobileIssuesListPage />}
{path.match(/^\/mobile\/issues\/\d+$/) && <window.MobileIssueDetailPage />}
{path === "/mobile/issues/new" && <window.MobileIssueFormPage mode="new" />}
{path.match(/^\/mobile\/issues\/\d+\/edit$/) && <window.MobileIssueFormPage mode="edit" />}
```

### 2. `src/main.jsx` - Register mobile components

```jsx
// Register mobile components
window.MobileLayout = MobileLayout;
window.MobileDashboardPage = MobileDashboardPage;
window.MobileIssuesListPage = MobileIssuesListPage;
window.MobileIssueDetailPage = MobileIssueDetailPage;
window.MobileIssueFormPage = MobileIssueFormPage;
window.MobileProfilePage = MobileProfilePage;
```

### 3. `src/components/layout/Sidebar.jsx` (or Layout.jsx) - Add "Mobile View" link

Add in sidebar user section or bottom:
```jsx
<Link to="/mobile" className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-black/4 text-sm">
  <Icon name="smartphone" size={18} />
  <span>Mobile View</span>
</Link>
```

---

## Mobile Navigation Structure

```
/mobile
├── Dashboard (default tab)
│   └── Stats, quick actions
├── Issues (tab)
│   ├── List view
│   ├── /new (create form)
│   ├── :id (detail view)
│   └── /:id/edit (edit form)
└── Profile (tab)
    └── User info, logout
```

---

## Design Specifications (Same as Desktop)

### Colors (from existing TOKENS)
- Accent: `#007aff`
- Text: `#1d1d1f`
- Text Secondary: `#3a3a3c`
- Muted: `#6e6e73`
- Muted Light: `#86868b`
- Border: `rgba(0,0,0,0.08)`
- Background: `#f5f5f7`
- Surface: `#ffffff`

### Typography
- Headers: `font-semibold tracking-[-0.02em]`
- Body: `text-[15px] leading-[1.45]`
- Small: `text-[13.5px]`
- Tiny: `text-[11.5px]`

### Components (reuse existing PulseUI)
- Card, CardHeader
- Button, IconButton
- Icon, Avatar
- Pill, PriorityPill, StatusPill
- Input, Textarea, Select
- Modal, Drawer

### Touch Targets
- Minimum 44px for all interactive elements
- Extra padding for inputs and buttons

---

## Implementation Order

1. **MobileLayout.jsx + MobileBottomNav.jsx** - Basic shell
2. **MobileIssuesListPage.jsx** - Issue list with filters
3. **MobileIssueDetailPage.jsx** - Full CRUD detail view
4. **MobileIssueFormPage.jsx** - Create/edit form
5. **MobileDashboardPage.jsx** - Simple stats view
6. **MobileProfilePage.jsx** - User info
7. **Route integration** - Add routes to app.jsx
8. **Sidebar link** - Add "Mobile View" navigation link

---

## Verification

1. **Desktop unchanged**: All desktop routes work exactly as before
2. **Mobile routes work**:
   - Navigate to `#/mobile` - see mobile layout
   - Bottom nav switches between tabs
   - Issue list displays full-width cards
   - Issue detail shows all CRUD options (view, edit, close, reopen, delete, comment)
   - Form works for create/edit
3. **Navigation**: "Mobile View" link in sidebar works
4. **Touch**: All buttons have 44px+ touch targets
5. **Design**: Matches desktop theme (colors, typography, components)
