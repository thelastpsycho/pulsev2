// ============================================================================
// API client — Real Pulse API implementation
// Connects to Pulse API at https://pulse.anvayabali.com/api
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('gp_token');

// Helper to make authenticated API calls
const fetchAPI = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw { status: response.status, ...error };
    }

    return await response.json();
  } catch (error) {
    // Only log unexpected errors, not 404s which are expected for unimplemented endpoints
    if (error.status !== 404) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// ---- Auth ------------------------------------------------------------------
const AuthAPI = {
  async login({ email, password }) {
    return fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  async logout() {
    return fetchAPI('/logout', { method: 'POST' });
  },
  async me() {
    return fetchAPI('/me');
  },
};

// ---- Issues ----------------------------------------------------------------
const IssuesAPI = {
  async list({ status, priority, department_id, issue_type_id, assigned_to_user_id, search, date_from, date_to, sort_by = "created_at", sort_order = "desc", page = 1, per_page = 15 } = {}) {
    const params = new URLSearchParams({
      page, per_page, sort_by, sort_order,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(department_id && { department_id }),
      ...(issue_type_id && { issue_type_id }),
      ...(assigned_to_user_id && { assigned_to_user_id }),
      ...(search && { search }),
      ...(date_from && { date_from }),
      ...(date_to && { date_to })
    });

    return fetchAPI(`/issues?${params}`);
  },
  async get(id) {
    return fetchAPI(`/issues/${id}`);
  },
  async create(payload) {
    return fetchAPI('/issues', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return fetchAPI(`/issues/${id}`, {
      method: 'PUT' ,
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    return fetchAPI(`/issues/${id}`, { method: 'DELETE' });
  },
  async close(id) {
    return fetchAPI(`/issues/${id}/close`, { method: 'POST' });
  },
  async verify(id) {
    return fetchAPI(`/issues/${id}/verify`, { method: 'POST' });
  },
  async reopen(id) {
    return fetchAPI(`/issues/${id}/reopen`, { method: 'POST' });
  },
};

// ---- Comments --------------------------------------------------------------
const CommentsAPI = {
  async listForIssue(issueId) {
    return fetchAPI(`/issues/${issueId}/comments`);
  },
  async create({ issue_id, body }) {
    return fetchAPI('/issue-comments', {
      method: 'POST',
      body: JSON.stringify({ issue_id, body })
    });
  },
  async destroy(id) {
    return fetchAPI(`/issue-comments/${id}`, { method: 'DELETE' });
  },
};

// ---- Departments -----------------------------------------------------------
const DepartmentsAPI = {
  async list() {
    return fetchAPI('/departments');
  },
  async create(payload) {
    return fetchAPI('/departments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return fetchAPI(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    return fetchAPI(`/departments/${id}`, { method: 'DELETE' });
  },
};

// ---- Issue Types & Categories ---------------------------------------------
const IssueTypesAPI = {
  async list() {
    return fetchAPI('/issue-types');
  },
  async create(payload) {
    return fetchAPI('/issue-types', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return fetchAPI(`/issue-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    return fetchAPI(`/issue-types/${id}`, { method: 'DELETE' });
  },
};
const CategoriesAPI = {
  async list() {
    return fetchAPI('/issue-categories');
  }
};

// ---- Users & Roles ---------------------------------------------------------
const UsersAPI = {
  async list() {
    return fetchAPI('/users');
  },
  async get(id) {
    return fetchAPI(`/users/${id}`);
  },
  async create(payload) {
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async activate(id) {
    return fetchAPI(`/users/${id}/activate`, { method: 'POST' });
  },
  async deactivate(id) {
    return fetchAPI(`/users/${id}/deactivate`, { method: 'POST' });
  },
  async destroy(id) {
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
  },
};
const RolesAPI = {
  async list() {
    return fetchAPI('/roles');
  },
  async create(payload) {
    return fetchAPI('/roles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return fetchAPI(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    return fetchAPI(`/roles/${id}`, { method: 'DELETE' });
  },
};
const PermissionsAPI = {
  async list() {
    return fetchAPI('/permissions');
  }
};

// ---- Statistics ------------------------------------------------------------
const StatsAPI = {
  async dashboard() {
    return fetchAPI('/statistics/dashboard');
  },
  async byDepartment() {
    return fetchAPI('/statistics/by-department');
  },
  async byUser({ limit = 20 } = {}) {
    return fetchAPI(`/statistics/by-user?limit=${limit}`);
  },
  async trends({ period = "daily", limit = 30 } = {}) {
    return fetchAPI(`/statistics/trends?period=${period}&limit=${limit}`);
  },
};

// ---- Reports ---------------------------------------------------------------
const ReportsAPI = {
  async month({ year = 2026, month = 5 } = {}) {
    return fetchAPI(`/reports/month?year=${year}&month=${month}`);
  },
  async year({ year = 2026 } = {}) {
    return fetchAPI(`/reports/year?year=${year}`);
  },
};

// ---- Activity Log ----------------------------------------------------------
const ActivityAPI = {
  async list({ page = 1, per_page = 20 } = {}) {
    return fetchAPI(`/activity?page=${page}&per_page=${per_page}`);
  },
};

window.PulseAPI = {
  Auth: AuthAPI, Issues: IssuesAPI, Comments: CommentsAPI,
  Departments: DepartmentsAPI, IssueTypes: IssueTypesAPI, Categories: CategoriesAPI,
  Users: UsersAPI, Roles: RolesAPI, Permissions: PermissionsAPI,
  Stats: StatsAPI, Reports: ReportsAPI, Activity: ActivityAPI,
};
