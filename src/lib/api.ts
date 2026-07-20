// ============================================================================
// API client — Real Pulse API implementation with TypeScript
// Connects to Pulse API at https://pulse.anvayabali.com/api
// ============================================================================

import type {
  ApiResponse,
  LoginResponse,
  User,
  Issue,
  Comment,
  Department,
  IssueType,
  IssueCategory,
  Role,
  Permission,
  DashboardStats,
  TrendsStats,
  DepartmentStats,
  UserStats,
  MonthReport,
  YearReport,
  ActivityLog,
  IssueFilters,
  IssueFormData,
  ErrorResponse
} from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('gp_token');
};

/**
 * Make authenticated API calls with proper error handling
 */
const fetchAPI = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json().catch(() => ({ message: 'Network error' }));
      throw { status: response.status, ...error };
    }

    return await response.json();
  } catch (error) {
    // Only log unexpected errors, not 404s which are expected for unimplemented endpoints
    if ((error as ErrorResponse).status !== 404) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// ============================================================================
// Authentication API
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export const AuthAPI = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    return fetchAPI<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI('/logout', { method: 'POST' });
  },

  /**
   * Get current user information
   */
  async me(): Promise<ApiResponse<{ user: User }>> {
    return fetchAPI('/me');
  },
};

// ============================================================================
// Issues API
// ============================================================================

export const IssuesAPI = {
  /**
   * List issues with optional filters
   */
  async list(filters: IssueFilters = {}): Promise<ApiResponse<Issue[]>> {
    const params = new URLSearchParams({
      page: String(filters.page || 1),
      per_page: String(filters.per_page || 15),
      sort_by: filters.sort_by || 'created_at',
      sort_order: filters.sort_order || 'desc',
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.department_id && { department_id: String(filters.department_id) }),
      ...(filters.issue_type_id && { issue_type_id: String(filters.issue_type_id) }),
      ...(filters.assigned_to_user_id && { assigned_to_user_id: String(filters.assigned_to_user_id) }),
      ...(filters.search && { search: filters.search }),
      ...(filters.date_from && { date_from: filters.date_from }),
      ...(filters.date_to && { date_to: filters.date_to }),
    });

    return fetchAPI(`/issues?${params}`);
  },

  /**
   * Get single issue by ID
   */
  async get(id: number): Promise<ApiResponse<Issue>> {
    return fetchAPI(`/issues/${id}`);
  },

  /**
   * Create new issue
   */
  async create(data: IssueFormData): Promise<ApiResponse<Issue>> {
    return fetchAPI('/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing issue
   */
  async update(id: number, data: Partial<IssueFormData>): Promise<ApiResponse<Issue>> {
    return fetchAPI(`/issues/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete issue
   */
  async destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI(`/issues/${id}`, { method: 'DELETE' });
  },

  /**
   * Close issue
   */
  async close(id: number): Promise<ApiResponse<Issue>> {
    return fetchAPI(`/issues/${id}/close`, { method: 'POST' });
  },

  /**
   * Verify closed issue
   */
  async verify(id: number): Promise<ApiResponse<Issue>> {
    return fetchAPI(`/issues/${id}/verify`, { method: 'POST' });
  },

  /**
   * Reopen closed issue
   */
  async reopen(id: number): Promise<ApiResponse<Issue>> {
    return fetchAPI(`/issues/${id}/reopen`, { method: 'POST' });
  },
};

// ============================================================================
// Comments API
// ============================================================================

export const CommentsAPI = {
  /**
   * List comments for an issue
   */
  async listForIssue(issueId: number): Promise<ApiResponse<Comment[]>> {
    return fetchAPI(`/issues/${issueId}/comments`);
  },

  /**
   * Create new comment
   */
  async create(data: { issue_id: number; body: string }): Promise<ApiResponse<Comment>> {
    return fetchAPI('/issue-comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete comment
   */
  async destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI(`/issue-comments/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Departments API
// ============================================================================

export interface DepartmentData {
  name: string;
  code?: string;
  is_active?: boolean;
}

export const DepartmentsAPI = {
  /**
   * List all departments
   */
  async list(): Promise<ApiResponse<Department[]>> {
    return fetchAPI('/departments?per_page=200');
  },

  /**
   * Create new department
   */
  async create(data: DepartmentData): Promise<ApiResponse<Department>> {
    return fetchAPI('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update department
   */
  async update(id: number, data: DepartmentData): Promise<ApiResponse<Department>> {
    return fetchAPI(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete department
   */
  async destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI(`/departments/${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// Issue Types & Categories API
// ============================================================================

export interface IssueTypeData {
  name: string;
  description?: string;
  category_id?: number;
  is_active?: boolean;
}

export const IssueTypesAPI = {
  /**
   * List all issue types
   */
  async list(): Promise<ApiResponse<IssueType[]>> {
    return fetchAPI('/issue-types?per_page=200');
  },

  /**
   * Create new issue type
   */
  async create(data: IssueTypeData): Promise<ApiResponse<IssueType>> {
    return fetchAPI('/issue-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update issue type
   */
  async update(id: number, data: IssueTypeData): Promise<ApiResponse<IssueType>> {
    return fetchAPI(`/issue-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete issue type
   */
  async destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI(`/issue-types/${id}`, { method: 'DELETE' });
  },
};

export const CategoriesAPI = {
  /**
   * List all issue categories
   */
  async list(): Promise<ApiResponse<IssueCategory[]>> {
    return fetchAPI('/issue-categories?per_page=200');
  },
};

// ============================================================================
// Users & Roles API
// ============================================================================

export interface UserData {
  name: string;
  email: string;
  role_id?: number;
  department?: string;
  is_active?: boolean;
  password?: string;
}

export const UsersAPI = {
  /**
   * List all users
   */
  async list(): Promise<ApiResponse<User[]>> {
    return fetchAPI('/users?per_page=200');
  },

  /**
   * Get single user
   */
  async get(id: number): Promise<ApiResponse<User>> {
    return fetchAPI(`/users/${id}`);
  },

  /**
   * Create new user
   */
  async create(data: UserData): Promise<ApiResponse<User>> {
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update user
   */
  async update(id: number, data: UserData): Promise<ApiResponse<User>> {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Activate user
   */
  async activate(id: number): Promise<ApiResponse<User>> {
    return fetchAPI(`/users/${id}/activate`, { method: 'POST' });
  },

  /**
   * Deactivate user
   */
  async deactivate(id: number): Promise<ApiResponse<User>> {
    return fetchAPI(`/users/${id}/deactivate`, { method: 'POST' });
  },

  /**
   * Delete user
   */
  async destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
  },
};

export interface RoleData {
  name: string;
  description?: string;
  permission_ids?: number[];
}

export const RolesAPI = {
  /**
   * List all roles
   */
  async list(): Promise<ApiResponse<Role[]>> {
    return fetchAPI('/roles');
  },

  /**
   * Create new role
   */
  async create(data: RoleData): Promise<ApiResponse<Role>> {
    return fetchAPI('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update role
   */
  async update(id: number, data: RoleData): Promise<ApiResponse<Role>> {
    return fetchAPI(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete role
   */
  async destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return fetchAPI(`/roles/${id}`, { method: 'DELETE' });
  },
};

export const PermissionsAPI = {
  /**
   * List all permissions
   */
  async list(): Promise<ApiResponse<Permission[]>> {
    return fetchAPI('/permissions');
  },
};

// ============================================================================
// Statistics API
// ============================================================================

export const StatsAPI = {
  /**
   * Get dashboard statistics
   */
  async dashboard(): Promise<ApiResponse<DashboardStats>> {
    return fetchAPI('/statistics/dashboard');
  },

  /**
   * Get statistics by department
   */
  async byDepartment(): Promise<ApiResponse<DepartmentStats>> {
    return fetchAPI('/statistics/by-department');
  },

  /**
   * Get statistics by user
   */
  async byUser({ limit = 20 }: { limit?: number } = {}): Promise<ApiResponse<UserStats>> {
    return fetchAPI(`/statistics/by-user?limit=${limit}`);
  },

  /**
   * Get trend statistics
   */
  async trends({ period = 'daily', limit = 30 }: { period?: string; limit?: number } = {}): Promise<ApiResponse<TrendsStats>> {
    return fetchAPI(`/statistics/trends?period=${period}&limit=${limit}`);
  },
};

// ============================================================================
// Reports API
// ============================================================================

export const ReportsAPI = {
  /**
   * Get month report
   */
  async month({ year = 2026, month = 5 }: { year?: number; month?: number } = {}): Promise<ApiResponse<MonthReport>> {
    return fetchAPI(`/reports/month?year=${year}&month=${month}`);
  },

  /**
   * Get year report
   */
  async year({ year = 2026 }: { year?: number } = {}): Promise<ApiResponse<YearReport>> {
    return fetchAPI(`/reports/year?year=${year}`);
  },
};

// ============================================================================
// Activity Log API
// ============================================================================

export const ActivityAPI = {
  /**
   * List activity logs
   */
  async list({ page = 1, per_page = 20 }: { page?: number; per_page?: number } = {}): Promise<ApiResponse<ActivityLog[]>> {
    return fetchAPI(`/activity?page=${page}&per_page=${per_page}`);
  },
};

// ============================================================================
// Window API Export
// ============================================================================

// Export for window global
if (typeof window !== 'undefined') {
  window.PulseAPI = {
    Auth: AuthAPI,
    Issues: IssuesAPI,
    Comments: CommentsAPI,
    Departments: DepartmentsAPI,
    IssueTypes: IssueTypesAPI,
    Categories: CategoriesAPI,
    Users: UsersAPI,
    Roles: RolesAPI,
    Permissions: PermissionsAPI,
    Stats: StatsAPI,
    Reports: ReportsAPI,
    Activity: ActivityAPI,
  };
}