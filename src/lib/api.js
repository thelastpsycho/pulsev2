// ============================================================================
// API client — Real Pulse API implementation
// Connects to Pulse API at https://pulse.anvayabali.com/api
// ============================================================================

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

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
    console.error('API Error:', error);
    throw error;
  }
};

// ---- Auth ------------------------------------------------------------------
const AuthAPI = {
  async login({ email, password }) {
    if (USE_MOCK) {
      // Mock login - accept any password for demo users
      const user = window.PULSE_MOCK.USERS.find(u => u.email === email);
      if (user) {
        return {
          token: 'mock_token_' + user.id,
          user: {
            ...user,
            permissions: window.PULSE_MOCK.getPermissionsForUser(user)
          }
        };
      }
      throw { status: 401, message: 'Invalid credentials' };
    }
    return fetchAPI('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  async logout() {
    if (USE_MOCK) {
      return { success: true };
    }
    return fetchAPI('/logout', { method: 'POST' });
  },
  async me() {
    if (USE_MOCK) {
      // Extract user ID from token and return corresponding user
      const token = localStorage.getItem('gp_token');
      if (token && token.startsWith('mock_token_')) {
        const userId = parseInt(token.replace('mock_token_', ''));
        const user = window.PULSE_MOCK.USERS.find(u => u.id === userId);

        if (user) {
          return {
            user: {
              ...user,
              permissions: window.PULSE_MOCK.getPermissionsForUser(user)
            }
          };
        }
      }

      // Fallback to first user if no valid token
      const user = window.PULSE_MOCK.USERS[0];
      return {
        user: {
          ...user,
          permissions: window.PULSE_MOCK.getPermissionsForUser(user)
        }
      };
    }
    return fetchAPI('/me');
  },
};

// ---- Issues ----------------------------------------------------------------
const IssuesAPI = {
  async list({ status, priority, department_id, issue_type_id, assigned_to_user_id, search, date_from, date_to, sort_by = "created_at", sort_order = "desc", page = 1, per_page = 15 } = {}) {
    if (USE_MOCK) {
      let issues = [...window.PULSE_MOCK.ISSUES];

      // Apply filters
      if (status) {
        issues = issues.filter(i => i.status === status);
      }
      if (priority) {
        issues = issues.filter(i => i.priority === priority);
      }
      if (search) {
        const searchLower = search.toLowerCase();
        issues = issues.filter(i =>
          i.title.toLowerCase().includes(searchLower) ||
          i.name.toLowerCase().includes(searchLower) ||
          i.room_number.toLowerCase().includes(searchLower) ||
          i.id.toString().includes(searchLower)
        );
      }

      // Sort issues
      issues.sort((a, b) => {
        const dateA = new Date(a[sort_by]);
        const dateB = new Date(b[sort_by]);
        return sort_order === 'desc' ? dateB - dateA : dateA - dateB;
      });

      // Pagination
      const total = issues.length;
      const start = (page - 1) * per_page;
      const paginatedIssues = issues.slice(start, start + per_page);

      return {
        data: paginatedIssues,
        meta: {
          current_page: page,
          per_page: per_page,
          total: total,
          last_page: Math.ceil(total / per_page)
        }
      };
    }

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
    if (USE_MOCK) {
      const issue = window.PULSE_MOCK.ISSUES.find(i => i.id === id);
      if (!issue) throw { status: 404, message: 'Issue not found' };

      // Get comments for this issue
      const comments = window.PULSE_MOCK.ISSUE_COMMENTS[id] || [];

      return {
        data: {
          ...issue,
          comments
        }
      };
    }
    return fetchAPI(`/issues/${id}`);
  },
  async create(payload) {
    if (USE_MOCK) {
      const newIssue = {
        id: Math.max(...window.PULSE_MOCK.ISSUES.map(i => i.id)) + 1,
        title: payload.title,
        description: payload.description,
        location: payload.location,
        name: payload.name,
        room_number: payload.room_number,
        checkin_date: payload.checkin_date,
        checkout_date: payload.checkout_date,
        issue_date: new Date().toISOString().split('T')[0],
        source: payload.source || "App",
        nationality: payload.nationality,
        contact: payload.contact,
        priority: payload.priority,
        status: "open",
        created_by: 1,
        assigned_to_user_id: payload.assigned_to_user_id || null,
        closed_at: null,
        closed_by_user_id: null,
        issue_type_id: payload.issue_type_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        departments: [window.PULSE_MOCK.DEPARTMENTS.find(d => d.id === payload.department_id)],
        issueTypes: [window.PULSE_MOCK.ISSUE_TYPES.find(t => t.id === payload.issue_type_id)],
        createdBy: window.PULSE_MOCK.USERS[0],
        assignedTo: payload.assigned_to_user_id ? window.PULSE_MOCK.USERS.find(u => u.id === payload.assigned_to_user_id) : null,
        closedBy: null,
        recovery: null,
        recovery_cost: 0
      };
      window.PULSE_MOCK.ISSUES.unshift(newIssue);
      return { data: newIssue };
    }
    return fetchAPI('/issues', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    if (USE_MOCK) {
      const issueIndex = window.PULSE_MOCK.ISSUES.findIndex(i => i.id === id);
      if (issueIndex === -1) throw { status: 404, message: 'Issue not found' };

      const updatedIssue = {
        ...window.PULSE_MOCK.ISSUES[issueIndex],
        ...payload,
        updated_at: new Date().toISOString()
      };

      window.PULSE_MOCK.ISSUES[issueIndex] = updatedIssue;
      return { data: updatedIssue };
    }
    return fetchAPI(`/issues/${id}`, {
      method: 'PUT' ,
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    if (USE_MOCK) {
      const issueIndex = window.PULSE_MOCK.ISSUES.findIndex(i => i.id === id);
      if (issueIndex === -1) throw { status: 404, message: 'Issue not found' };

      window.PULSE_MOCK.ISSUES.splice(issueIndex, 1);
      return { success: true };
    }
    return fetchAPI(`/issues/${id}`, { method: 'DELETE' });
  },
  async close(id) {
    if (USE_MOCK) {
      const issue = window.PULSE_MOCK.ISSUES.find(i => i.id === id);
      if (!issue) throw { status: 404, message: 'Issue not found' };

      issue.status = 'closed';
      issue.closed_at = new Date().toISOString();
      issue.closed_by_user_id = 1;
      issue.updated_at = new Date().toISOString();

      return { data: issue };
    }
    return fetchAPI(`/issues/${id}/close`, { method: 'POST' });
  },
  async reopen(id) {
    if (USE_MOCK) {
      const issue = window.PULSE_MOCK.ISSUES.find(i => i.id === id);
      if (!issue) throw { status: 404, message: 'Issue not found' };

      issue.status = 'open';
      issue.closed_at = null;
      issue.closed_by_user_id = null;
      issue.updated_at = new Date().toISOString();

      return { data: issue };
    }
    return fetchAPI(`/issues/${id}/reopen`, { method: 'POST' });
  },
};

// ---- Comments --------------------------------------------------------------
const CommentsAPI = {
  async listForIssue(issueId) {
    if (USE_MOCK) {
      const comments = window.PULSE_MOCK.ISSUE_COMMENTS[issueId] || [];
      return { data: comments };
    }
    return fetchAPI(`/issues/${issueId}/comments`);
  },
  async create({ issue_id, body }) {
    if (USE_MOCK) {
      const newComment = {
        id: Date.now(),
        issue_id,
        body,
        user: window.PULSE_MOCK.USERS[0],
        created_at: new Date().toISOString()
      };

      if (!window.PULSE_MOCK.ISSUE_COMMENTS[issue_id]) {
        window.PULSE_MOCK.ISSUE_COMMENTS[issue_id] = [];
      }
      window.PULSE_MOCK.ISSUE_COMMENTS[issue_id].push(newComment);

      return { data: newComment };
    }
    return fetchAPI('/comments', {
      method: 'POST',
      body: JSON.stringify({ issue_id, body })
    });
  },
  async destroy(id) {
    if (USE_MOCK) {
      // Find and remove comment from all issue comment arrays
      for (const issueId in window.PULSE_MOCK.ISSUE_COMMENTS) {
        const comments = window.PULSE_MOCK.ISSUE_COMMENTS[issueId];
        const index = comments.findIndex(c => c.id === id);
        if (index !== -1) {
          comments.splice(index, 1);
          break;
        }
      }
      return { success: true };
    }
    return fetchAPI(`/comments/${id}`, { method: 'DELETE' });
  },
};

// ---- Departments -----------------------------------------------------------
const DepartmentsAPI = {
  async list() {
    if (USE_MOCK) return { data: window.PULSE_MOCK.DEPARTMENTS };
    return fetchAPI('/departments');
  },
  async create(payload) {
    if (USE_MOCK) {
      const newDept = {
        id: window.PULSE_MOCK.DEPARTMENTS.length + 1,
        name: payload.name,
        code: payload.code || '',
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        issues_count: 0,
        open_issues: 0,
        closed_issues: 0
      };
      window.PULSE_MOCK.DEPARTMENTS.push(newDept);
      return { data: newDept };
    }
    return fetchAPI('/departments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    if (USE_MOCK) {
      const deptIndex = window.PULSE_MOCK.DEPARTMENTS.findIndex(d => d.id === id);
      if (deptIndex !== -1) {
        window.PULSE_MOCK.DEPARTMENTS[deptIndex] = { ...window.PULSE_MOCK.DEPARTMENTS[deptIndex], ...payload };
        return { data: window.PULSE_MOCK.DEPARTMENTS[deptIndex] };
      }
      throw { status: 404, message: 'Department not found' };
    }
    return fetchAPI(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    if (USE_MOCK) {
      const deptIndex = window.PULSE_MOCK.DEPARTMENTS.findIndex(d => d.id === id);
      if (deptIndex !== -1) {
        window.PULSE_MOCK.DEPARTMENTS.splice(deptIndex, 1);
        return { success: true };
      }
      throw { status: 404, message: 'Department not found' };
    }
    return fetchAPI(`/departments/${id}`, { method: 'DELETE' });
  },
};

// ---- Issue Types & Categories ---------------------------------------------
const IssueTypesAPI = {
  async list() {
    if (USE_MOCK) {
      return { data: window.PULSE_MOCK.ISSUE_TYPES };
    }
    return fetchAPI('/issue-types');
  },
  async create(payload) {
    if (USE_MOCK) {
      const newType = {
        id: Math.max(...window.PULSE_MOCK.ISSUE_TYPES.map(t => t.id)) + 1,
        issue_category_id: payload.issue_category_id,
        name: payload.name,
        default_severity: payload.default_severity || 'medium',
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        issues_count: 0,
        issue_category: window.PULSE_MOCK.ISSUE_CATEGORIES.find(c => c.id === payload.issue_category_id)
      };
      window.PULSE_MOCK.ISSUE_TYPES.push(newType);
      return { data: newType };
    }
    return fetchAPI('/issue-types', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    if (USE_MOCK) {
      const typeIndex = window.PULSE_MOCK.ISSUE_TYPES.findIndex(t => t.id === id);
      if (typeIndex !== -1) {
        window.PULSE_MOCK.ISSUE_TYPES[typeIndex] = { ...window.PULSE_MOCK.ISSUE_TYPES[typeIndex], ...payload };
        return { data: window.PULSE_MOCK.ISSUE_TYPES[typeIndex] };
      }
      throw { status: 404, message: 'Issue type not found' };
    }
    return fetchAPI(`/issue-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    if (USE_MOCK) {
      const typeIndex = window.PULSE_MOCK.ISSUE_TYPES.findIndex(t => t.id === id);
      if (typeIndex !== -1) {
        window.PULSE_MOCK.ISSUE_TYPES.splice(typeIndex, 1);
        return { success: true };
      }
      throw { status: 404, message: 'Issue type not found' };
    }
    return fetchAPI(`/issue-types/${id}`, { method: 'DELETE' });
  },
};
const CategoriesAPI = {
  async list() {
    if (USE_MOCK) {
      return { data: window.PULSE_MOCK.ISSUE_CATEGORIES };
    }
    return fetchAPI('/issue-categories');
  }
};

// ---- Users & Roles ---------------------------------------------------------
const UsersAPI = {
  async list() {
    if (USE_MOCK) return { data: window.PULSE_MOCK.USERS };
    return fetchAPI('/users');
  },
  async get(id) {
    if (USE_MOCK) return { data: window.PULSE_MOCK.USERS.find(u => u.id === id) };
    return fetchAPI(`/users/${id}`);
  },
  async create(payload) {
    if (USE_MOCK) {
      const newUser = {
        id: window.PULSE_MOCK.USERS.length + 1,
        name: payload.name,
        email: payload.email,
        department: payload.department || null,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
        last_login_at: null,
        roles: payload.roles || [],
        created_at: new Date().toISOString()
      };
      window.PULSE_MOCK.USERS.push(newUser);
      return { data: newUser };
    }
    return fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    if (USE_MOCK) {
      const userIndex = window.PULSE_MOCK.USERS.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        window.PULSE_MOCK.USERS[userIndex] = { ...window.PULSE_MOCK.USERS[userIndex], ...payload };
        return { data: window.PULSE_MOCK.USERS[userIndex] };
      }
      throw { status: 404, message: 'User not found' };
    }
    return fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async activate(id) {
    if (USE_MOCK) {
      const user = window.PULSE_MOCK.USERS.find(u => u.id === id);
      if (user) {
        user.is_active = true;
        return { data: user };
      }
      throw { status: 404, message: 'User not found' };
    }
    return fetchAPI(`/users/${id}/activate`, { method: 'POST' });
  },
  async deactivate(id) {
    if (USE_MOCK) {
      const user = window.PULSE_MOCK.USERS.find(u => u.id === id);
      if (user) {
        user.is_active = false;
        return { data: user };
      }
      throw { status: 404, message: 'User not found' };
    }
    return fetchAPI(`/users/${id}/deactivate`, { method: 'POST' });
  },
  async destroy(id) {
    if (USE_MOCK) {
      const userIndex = window.PULSE_MOCK.USERS.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        window.PULSE_MOCK.USERS.splice(userIndex, 1);
        return { success: true };
      }
      throw { status: 404, message: 'User not found' };
    }
    return fetchAPI(`/users/${id}`, { method: 'DELETE' });
  },
};
const RolesAPI = {
  async list() {
    if (USE_MOCK) return { data: window.PULSE_MOCK.ROLES };
    return fetchAPI('/roles');
  },
  async create(payload) {
    if (USE_MOCK) {
      const newRole = {
        id: window.PULSE_MOCK.ROLES.length + 1,
        name: payload.name,
        description: payload.description || '',
        permissions: payload.permissions || [],
        users_count: 0
      };
      window.PULSE_MOCK.ROLES.push(newRole);
      return { data: newRole };
    }
    return fetchAPI('/roles', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    if (USE_MOCK) {
      const roleIndex = window.PULSE_MOCK.ROLES.findIndex(r => r.id === id);
      if (roleIndex !== -1) {
        window.PULSE_MOCK.ROLES[roleIndex] = { ...window.PULSE_MOCK.ROLES[roleIndex], ...payload };
        return { data: window.PULSE_MOCK.ROLES[roleIndex] };
      }
      throw { status: 404, message: 'Role not found' };
    }
    return fetchAPI(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async destroy(id) {
    if (USE_MOCK) {
      const roleIndex = window.PULSE_MOCK.ROLES.findIndex(r => r.id === id);
      if (roleIndex !== -1) {
        window.PULSE_MOCK.ROLES.splice(roleIndex, 1);
        return { success: true };
      }
      throw { status: 404, message: 'Role not found' };
    }
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
    if (USE_MOCK) {
      const issues = window.PULSE_MOCK.ISSUES;
      return {
        summary: {
          total_issues: issues.length,
          open_issues: issues.filter(i => i.status === 'open').length,
          closed_issues: issues.filter(i => i.status === 'closed').length,
          urgent_issues: issues.filter(i => i.priority === 'urgent').length,
          high_priority_issues: issues.filter(i => i.priority === 'high').length,
          avg_resolution_hours: 2.4, // Mock value in hours
          issues_this_week: 12,
          issues_this_month: 47,
          total_open_issues: issues.filter(i => i.status === 'open').length
        },
        by_priority: {
          urgent: issues.filter(i => i.priority === 'urgent' && i.status === 'open').length,
          high: issues.filter(i => i.priority === 'high' && i.status === 'open').length,
          medium: issues.filter(i => i.priority === 'medium' && i.status === 'open').length,
          low: issues.filter(i => i.priority === 'low' && i.status === 'open').length
        },
        by_status: {
          open: issues.filter(i => i.status === 'open').length,
          closed: issues.filter(i => i.status === 'closed').length
        },
        recent_activity: window.PULSE_MOCK.ACTIVITY_LOG.slice(0, 5)
      };
    }
    return fetchAPI('/statistics/dashboard');
  },
  async byDepartment() {
    if (USE_MOCK) {
      const departments = window.PULSE_MOCK.DEPARTMENTS.map(dept => {
        const deptIssues = window.PULSE_MOCK.ISSUES.filter(i =>
          i.departments && i.departments.some(d => d.id === dept.id)
        );
        const openIssues = deptIssues.filter(i => i.status === 'open').length;
        const closedIssues = deptIssues.filter(i => i.status === 'closed').length;
        const totalIssues = deptIssues.length;
        const closureRate = totalIssues > 0 ? Math.round((closedIssues / totalIssues) * 100) : 0;

        return {
          id: dept.id,
          name: dept.name,
          open_issues: openIssues,
          closed_issues: closedIssues,
          total_issues: totalIssues,
          closure_rate: closureRate
        };
      });

      return {
        departments
      };
    }
    return fetchAPI('/statistics/by-department');
  },
  async byUser({ limit = 20 } = {}) {
    if (USE_MOCK) {
      const users = window.PULSE_MOCK.USERS.slice(0, limit).map(user => {
        const assignedOpen = window.PULSE_MOCK.ISSUES.filter(i =>
          i.assigned_to_user_id === user.id && i.status === 'open'
        ).length;
        const assignedClosed = window.PULSE_MOCK.ISSUES.filter(i =>
          i.assigned_to_user_id === user.id && i.status === 'closed'
        ).length;
        const createdCount = window.PULSE_MOCK.ISSUES.filter(i =>
          i.created_by === user.id
        ).length;
        const totalAssigned = assignedOpen + assignedClosed;
        const completionRate = totalAssigned > 0 ? Math.round((assignedClosed / totalAssigned) * 100) : 0;

        return {
          id: user.id,
          name: user.name,
          roles: user.roles.map(r => r.name),
          assigned_open: assignedOpen,
          assigned_closed: assignedClosed,
          created_count: createdCount,
          total_assigned: totalAssigned,
          completion_rate: completionRate
        };
      });

      return {
        users
      };
    }
    return fetchAPI(`/statistics/by-user?limit=${limit}`);
  },
  async trends({ period = "daily", limit = 30 } = {}) {
    if (USE_MOCK) {
      // Generate mock trend data
      const trendData = [];
      for (let i = 0; i < limit; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (limit - i - 1));

        trendData.push({
          date: date.toISOString().split('T')[0],
          created: Math.floor(Math.random() * 8) + 1,
          closed: Math.floor(Math.random() * 7) + 1
        });
      }

      return {
        created_trend: trendData.map(d => ({ date: d.date, value: d.created })),
        closed_trend: trendData.map(d => ({ date: d.date, value: d.closed }))
      };
    }
    return fetchAPI(`/statistics/trends?period=${period}&limit=${limit}`);
  },
};

// ---- Reports ---------------------------------------------------------------
const ReportsAPI = {
  async month({ year = 2026, month = 5 } = {}) {
    if (USE_MOCK) {
      // Generate daily data for the requested month
      const daysInMonth = new Date(year, month, 0).getDate();
      const dailyData = [];

      for (let day = 1; day <= daysInMonth; day++) {
        dailyData.push({
          date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          created: Math.floor(Math.random() * 8) + 1,
          closed: Math.floor(Math.random() * 7) + 1
        });
      }

      return {
        data: dailyData
      };
    }
    return fetchAPI(`/reports/month?year=${year}&month=${month}`);
  },
  async year({ year = 2026 } = {}) {
    if (USE_MOCK) {
      // Generate monthly data for the requested year
      const monthlyData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => ({
        date: `${year}-${month.toString().padStart(2, '0')}-01`,
        created: Math.floor(Math.random() * 60) + 20,
        closed: Math.floor(Math.random() * 55) + 15
      }));

      return {
        data: monthlyData
      };
    }
    return fetchAPI(`/reports/year?year=${year}`);
  },
};

// ---- Activity Log ----------------------------------------------------------
const ActivityAPI = {
  async list({ page = 1, per_page = 20 } = {}) {
    if (USE_MOCK) {
      return {
        data: window.PULSE_MOCK.ACTIVITY_LOG.slice((page - 1) * per_page, page * per_page),
        meta: {
          current_page: page,
          per_page: per_page,
          total: window.PULSE_MOCK.ACTIVITY_LOG.length
        }
      };
    }
    return fetchAPI(`/activity?page=${page}&per_page=${per_page}`);
  },
};

window.PulseAPI = {
  Auth: AuthAPI, Issues: IssuesAPI, Comments: CommentsAPI,
  Departments: DepartmentsAPI, IssueTypes: IssueTypesAPI, Categories: CategoriesAPI,
  Users: UsersAPI, Roles: RolesAPI, Permissions: PermissionsAPI,
  Stats: StatsAPI, Reports: ReportsAPI, Activity: ActivityAPI,
};
