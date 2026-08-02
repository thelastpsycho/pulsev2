// ============================================================================
// Safe accessors for the window.Pulse* globals (PulseUI, PulseForm,
// PulseOverlay, PulseLayout). Components render before main.jsx has
// necessarily attached these globals, so every consumer needs a fallback -
// this centralizes that fallback instead of each component redefining it.
// ============================================================================

const noop = () => {};
const NullComponent = () => null;

const FALLBACK_TOKENS = {
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
  urgent: "#ff3b30",
  high: "#ff9500",
  medium: "#ffb800",
  low: "#34c759",
  purple: "#8e5cf2",
  gold: "#b8860b",
};

export function getPulseUI() {
  if (typeof window !== 'undefined' && window.PulseUI) return window.PulseUI;
  return {
    Button: NullComponent,
    IconButton: NullComponent,
    Card: NullComponent,
    CardHeader: NullComponent,
    Icon: NullComponent,
    Avatar: NullComponent,
    Pill: NullComponent,
    PriorityPill: NullComponent,
    StatusPill: NullComponent,
    Skeleton: NullComponent,
    EmptyState: NullComponent,
    Kbd: NullComponent,
    cx: (...xs) => xs.filter(Boolean).join(' '),
    TOKENS: FALLBACK_TOKENS,
  };
}

export function getPulseForm() {
  if (typeof window !== 'undefined' && window.PulseForm) return window.PulseForm;
  return {
    Field: NullComponent,
    Input: NullComponent,
    Textarea: NullComponent,
    Select: NullComponent,
    MultiSelect: NullComponent,
    SearchableSelect: NullComponent,
    Checkbox: NullComponent,
    Toggle: NullComponent,
    Segmented: NullComponent,
  };
}

export function getPulseOverlay() {
  if (typeof window !== 'undefined' && window.PulseOverlay) return window.PulseOverlay;
  return {
    Modal: NullComponent,
    Drawer: NullComponent,
    Dropdown: NullComponent,
    DropdownItem: NullComponent,
    DropdownDivider: NullComponent,
    ConfirmDialog: NullComponent,
    ToastHost: NullComponent,
  };
}

export function getPulseLayout() {
  if (typeof window !== 'undefined' && window.PulseLayout) return window.PulseLayout;
  return {
    useHashRoute: () => '',
    navigate: noop,
    Link: NullComponent,
    matchPath: () => null,
    AppLayout: NullComponent,
    Sidebar: NullComponent,
    Topbar: NullComponent,
    PageHeader: NullComponent,
    Tabs: NullComponent,
  };
}
