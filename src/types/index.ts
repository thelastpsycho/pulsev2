// ============================================================================
// Type Definitions for GuestPulse Application
// ============================================================================

// ============================================================================
// Core Types
// ============================================================================

export interface User {
  id: number;
  name: string;
  email: string;
  roles?: Role[];
  department?: string;
  is_active: boolean;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
  is_active?: boolean;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface Department {
  id: number;
  name: string;
  code?: string;
  is_active: boolean;
}

export interface IssueType {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  category_id?: number;
}

export interface IssueCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

// ============================================================================
// Issue Types
// ============================================================================

export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'closed' | 'verified';

export interface Issue {
  id: number;
  title: string;
  description?: string;
  name?: string; // Guest name
  room_number?: string;
  location?: string;
  nationality?: string;
  contact?: string;
  source?: string;
  checkin_date?: string;
  checkout_date?: string;
  issue_date?: string;
  priority: IssuePriority;
  status: IssueStatus;
  departments?: Department[];
  issueTypes?: IssueType[];
  assigned_to_user_id?: number;
  assignedTo?: User;
  createdBy?: User;
  closedBy?: User;
  verifiedBy?: User;
  recovery?: string;
  recovery_cost?: number;
  comments?: Comment[];
  created_at: string;
  updated_at: string;
  closed_at?: string;
  verified_at?: string;
}

export interface Comment {
  id: number;
  issue_id: number;
  body: string;
  user: User;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface DashboardStats {
  summary: {
    open_issues: number;
    urgent_issues: number;
    closed_issues: number;
    avg_resolution_hours: number;
  };
  by_priority: {
    priority: IssuePriority;
    count: number;
  }[];
  by_status: {
    status: IssueStatus;
    count: number;
  }[];
}

export interface TrendData {
  period: string;
  count: number;
}

export interface TrendsStats {
  created_trend: TrendData[];
  closed_trend: TrendData[];
  period: string;
  limit: number;
}

export interface DepartmentStats {
  departments: {
    id: number;
    name: string;
    total_issues: number;
    open_issues: number;
    closed_issues: number;
  }[];
  summary: {
    total_open_issues: number;
    total_departments: number;
  };
}

export interface UserStats {
  users: {
    id: number;
    name: string;
    department?: string;
    total_assigned: number;
    total_closed: number;
  }[];
}

// ============================================================================
// Report Types
// ============================================================================

export interface MonthReport {
  year: number;
  month: number;
  total_issues: number;
  by_priority: Record<string, number>;
  by_department: Record<string, number>;
  resolution_times: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
}

export interface YearReport {
  year: number;
  months: MonthReport[];
  total_issues: number;
  trends: {
    monthly_totals: number[];
  };
}

// ============================================================================
// Activity Types
// ============================================================================

export interface ActivityLog {
  id: number;
  subject_type: string;
  subject_id: number;
  actor: User;
  description: string;
  created_at: string;
}

// ============================================================================
// Form Types
// ============================================================================

export interface IssueFormData {
  title: string;
  description?: string;
  location?: string;
  name?: string;
  room_number?: string;
  checkin_date?: string;
  checkout_date?: string;
  issue_date?: string;
  source?: string;
  nationality?: string;
  contact?: string;
  priority: IssuePriority;
  department_ids?: number[];
  issue_type_ids?: number[];
  assigned_to_user_id?: number;
}

export interface UserFormData {
  name: string;
  email: string;
  role_id?: number;
  department?: string;
  is_active?: boolean;
  password?: string;
}

export interface DepartmentFormData {
  name: string;
  code?: string;
  is_active?: boolean;
}

export interface IssueTypeFormData {
  name: string;
  description?: string;
  category_id?: number;
  is_active?: boolean;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface IssueFilters {
  status?: IssueStatus | '';
  priority?: IssuePriority;
  department_id?: number;
  issue_type_id?: number;
  assigned_to_user_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ============================================================================
// UI Component Types
// ============================================================================

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export type IconName =
  | 'pulse' | 'dashboard' | 'inbox' | 'bell' | 'search' | 'plus' | 'filter'
  | 'sort' | 'check' | 'check-circle' | 'x' | 'x-circle' | 'chevron-down'
  | 'chevron-up' | 'chevron-left' | 'chevron-right' | 'arrow-up' | 'arrow-down'
  | 'arrow-right' | 'arrow-left' | 'phone' | 'message' | 'mail' | 'user' | 'users'
  | 'key' | 'clock' | 'star' | 'alert' | 'info' | 'tag' | 'gift' | 'more'
  | 'more-vertical' | 'logout' | 'settings' | 'edit' | 'trash' | 'send'
  | 'calendar' | 'building' | 'tags' | 'shield' | 'report' | 'chart-bar'
  | 'chart-line' | 'chart-pie' | 'book' | 'external' | 'download' | 'upload'
  | 'file' | 'image' | 'paperclip' | 'globe' | 'home' | 'moon' | 'sun'
  | 'refresh' | 'eye' | 'eye-off' | 'kanban' | 'list' | 'grid' | 'menu' | 'crown';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'danger-solid' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  className?: string;
  fullWidth?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: number | string;
  hover?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Search Types
// ============================================================================

export type SearchResultType = 'issue' | 'user' | 'route' | 'recent' | 'type' | 'category';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  route?: string;
  icon?: IconName;
  meta?: Record<string, any>;
}

export interface SearchIndex {
  issues: Issue[];
  users: User[];
  routes: RouteDefinition[];
  recent: RecentItem[];
  issueTypes: IssueType[];
  categories: IssueCategory[];
}

export interface RouteDefinition {
  path: string;
  label: string;
  icon?: IconName;
  permission?: string;
}

export interface RecentItem {
  id: string;
  type: 'issue';
  title: string;
  timestamp: number;
  route: string;
}

// ============================================================================
// Keyboard Shortcuts Types
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category?: 'navigation' | 'actions' | 'bulk' | 'global';
  condition?: () => boolean;
}

export interface ShortcutMap {
  [key: string]: KeyboardShortcut;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  persist?: boolean; // Whether to persist in localStorage
  key: string; // Cache key
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color: string;
}

export interface PeriodComparison {
  current: ChartDataPoint[];
  previous: ChartDataPoint[];
  period: string;
  change_percent?: number;
}

// ============================================================================
// Report Builder Types
// ============================================================================

export interface ReportField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  options?: { label: string; value: string }[];
  required?: boolean;
}

export interface ReportConfig {
  name: string;
  description?: string;
  fields: ReportField[];
  filters: IssueFilters;
  group_by?: string;
  sort_by?: string;
  chart_type?: 'line' | 'bar' | 'pie' | 'table';
}

export interface ExportConfig {
  format: 'pdf' | 'excel' | 'csv';
  include_charts?: boolean;
  branding?: {
    logo?: string;
    hotel_name: string;
    address?: string;
    phone?: string;
  };
  date_range?: {
    from: string;
    to: string;
  };
}

// ============================================================================
// Network Status Types
// ============================================================================

export type NetworkStatus = 'online' | 'offline' | 'connecting';

export interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit;
  timestamp: number;
  retries: number;
}

// ============================================================================
// Window Global Types
// ============================================================================

declare global {
  interface Window {
    PulseAPI: {
      Auth: typeof import('@/lib/api').AuthAPI;
      Issues: typeof import('@/lib/api').IssuesAPI;
      Comments: typeof import('@/lib/api').CommentsAPI;
      Departments: typeof import('@/lib/api').DepartmentsAPI;
      IssueTypes: typeof import('@/lib/api').IssueTypesAPI;
      Categories: typeof import('@/lib/api').CategoriesAPI;
      Users: typeof import('@/lib/api').UsersAPI;
      Roles: typeof import('@/lib/api').RolesAPI;
      Permissions: typeof import('@/lib/api').PermissionsAPI;
      Stats: typeof import('@/lib/api').StatsAPI;
      Reports: typeof import('@/lib/api').ReportsAPI;
      Activity: typeof import('@/lib/api').ActivityAPI;
      Chat: typeof import('@/lib/api').ChatAPI;
    };
    PulseUI: {
      TOKENS: typeof import('@/components/ui/UIPrimitives').TOKENS;
      Icon: React.ComponentType<import('@/components/ui/UIPrimitives').IconProps>;
      Avatar: React.ComponentType<{ name: string; size?: number; className?: string }>;
      Pill: React.ComponentType<any>;
      PriorityPill: React.ComponentType<{ value: IssuePriority }>;
      StatusPill: React.ComponentType<{ value: IssueStatus }>;
      Button: React.ComponentType<ButtonProps>;
      IconButton: React.ComponentType<any>;
      Card: React.ComponentType<CardProps>;
      CardHeader: React.ComponentType<any>;
      Skeleton: React.ComponentType<any>;
      EmptyState: React.ComponentType<any>;
      Kbd: React.ComponentType<any>;
      cx: (...classes: (string | boolean | undefined)[]) => string;
    };
    PulseForm: {
      Field: React.ComponentType<any>;
      Input: React.ComponentType<any>;
      Textarea: React.ComponentType<any>;
      Select: React.ComponentType<any>;
      MultiSelect: React.ComponentType<any>;
      SearchableSelect: React.ComponentType<any>;
      Checkbox: React.ComponentType<any>;
      Toggle: React.ComponentType<any>;
      Segmented: React.ComponentType<any>;
    };
    PulseOverlay: {
      Modal: React.ComponentType<any>;
      Drawer: React.ComponentType<any>;
      Dropdown: React.ComponentType<any>;
      DropdownItem: React.ComponentType<any>;
      DropdownDivider: React.ComponentType<{}>;
      ConfirmDialog: React.ComponentType<any>;
      ToastHost: React.ComponentType<{}>;
    };
    PulseLayout: {
      useHashRoute: () => string;
      navigate: (to: string) => void;
      Link: React.ComponentType<any>;
      matchPath: (pattern: string, path: string) => Record<string, string> | null;
      AppLayout: React.ComponentType<any>;
      Sidebar: React.ComponentType<any>;
      Topbar: React.ComponentType<any>;
      PageHeader: React.ComponentType<any>;
      Tabs: React.ComponentType<any>;
      can: (user: User | null, permission: string) => boolean;
    };
    PageLogin: React.ComponentType<{ onLogin: (response: LoginResponse) => void }>;
    PageDashboard: React.ComponentType<{ user: User }>;
    PageIssuesInbox: React.ComponentType<{ selectedId?: number }>;
    PageIssuesList: React.ComponentType;
    PageIssueDetail: React.ComponentType<{ id: number; user: User }>;
    PageIssueForm: React.ComponentType<{ id?: number }>;
    PageReports: React.ComponentType<{ tab?: string }>;
    PageStatistics: React.ComponentType;
    PageGraphs: React.ComponentType;
    PageAdminUsers: React.ComponentType;
    PageAdminRoles: React.ComponentType;
    PageAdminDepartments: React.ComponentType;
    PageAdminIssueTypes: React.ComponentType;
    PageProfile: React.ComponentType<{ user: User }>;
    toast: {
      success: (message: string) => void;
      error: (message: string) => void;
      info: (message: string) => void;
    };
  }
}

export {};