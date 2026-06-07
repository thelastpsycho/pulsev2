// ============================================================================
// Mobile Issue Form Page
// Create and edit issues with full-width form inputs
// ============================================================================

import React from 'react';

const { useState, useEffect } = React;

// Helper to safely access window components
const getPulseUI = () => {
  if (typeof window !== 'undefined' && window.PulseUI) {
    return window.PulseUI;
  }
  return {
    Icon: () => null,
    Button: () => null,
    IconButton: () => null,
    Card: () => null,
    CardHeader: () => null,
    Skeleton: () => null,
    TOKENS: {},
    cx: (...xs) => xs.filter(Boolean).join(" ")
  };
};

const getPulseForm = () => {
  if (typeof window !== 'undefined' && window.PulseForm) {
    return window.PulseForm;
  }
  return {
    Field: ({ children }) => children,
    Input: () => null,
    Textarea: () => null,
    Select: () => null,
  };
};

const Icon = getPulseUI().Icon;
const Button = getPulseUI().Button;
const IconButton = getPulseUI().IconButton;
const Card = getPulseUI().Card;
const CardHeader = getPulseUI().CardHeader;
const Skeleton = getPulseUI().Skeleton;
const TOKENS = getPulseUI().TOKENS || {};
const cx = getPulseUI().cx || ((...xs) => xs.filter(Boolean).join(" "));

const Field = getPulseForm().Field;
const Input = getPulseForm().Input;
const Textarea = getPulseForm().Textarea;
const Select = getPulseForm().Select;

function MobileIssueFormPage({ mode, issueId }) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issueTypes, setIssueTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    guest_name: '',
    room_number: '',
    location: '',
    title: '',
    description: '',
    priority: 'medium',
    issue_type_ids: [],
    department_ids: [],
    assigned_to_user_id: '',
    contact: '',
    nationality: '',
    checkin_date: '',
    checkout_date: '',
  });
  const [errors, setErrors] = useState({});

  // Get mode and ID from URL if not provided
  const formMode = mode || (() => {
    const hash = window.location.hash;
    if (hash.includes('/new')) return 'new';
    if (hash.includes('/edit')) return 'edit';
    return 'new';
  })();

  const id = issueId || (() => {
    const match = window.location.hash.match(/^#\/mobile\/issues\/(\d+)\/?edit$/);
    return match ? Number(match[1]) : null;
  })();

  useEffect(() => {
    fetchIssueTypes();
    fetchDepartments();
    fetchUsers();

    if (formMode === 'edit' && id) {
      fetchIssue();
    }
  }, [formMode, id]);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      const response = await window.PulseAPI.Issues.get(id);
      const issue = response.data;
      setFormData({
        guest_name: issue.name || '',
        room_number: issue.room_number || '',
        location: issue.location || '',
        title: issue.title || '',
        description: issue.description || '',
        priority: issue.priority || 'medium',
        issue_type_ids: (issue.issueTypes || []).map(t => t.id),
        department_ids: (issue.departments || []).map(d => d.id),
        assigned_to_user_id: issue.assigned_to_user_id || '',
        contact: issue.contact || '',
        nationality: issue.nationality || '',
        checkin_date: issue.checkin_date || '',
        checkout_date: issue.checkout_date || '',
      });
    } catch (error) {
      console.error('Failed to fetch issue:', error);
      window.toast.error('Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueTypes = async () => {
    try {
      const response = await window.PulseAPI.IssueTypes.list();
      setIssueTypes(response.data.filter(t => t.is_active));
    } catch (error) {
      console.error('Failed to fetch issue types:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await window.PulseAPI.Departments.list();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await window.PulseAPI.Users.list();
      setUsers(response.data.filter(u => u.is_active));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.guest_name.trim()) newErrors.guest_name = 'Guest name is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.guest_name.trim(),
        room_number: formData.room_number.trim(),
        location: formData.location.trim(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        issue_type_ids: formData.issue_type_ids,
        department_ids: formData.department_ids,
        assigned_to_user_id: formData.assigned_to_user_id || null,
        contact: formData.contact.trim(),
        nationality: formData.nationality.trim(),
        checkin_date: formData.checkin_date || null,
        checkout_date: formData.checkout_date || null,
      };

      if (formMode === 'new') {
        await window.PulseAPI.Issues.create(payload);
        window.toast.success('Issue created');
      } else {
        await window.PulseAPI.Issues.update(id, payload);
        window.toast.success('Issue updated');
      }

      // Navigate back to issues list or detail
      if (formMode === 'new') {
        navigate('/mobile');
      } else {
        navigate(`/mobile/issues/${id}`);
      }
    } catch (error) {
      console.error('Failed to save issue:', error);
      window.toast.error('Failed to save issue');
    } finally {
      setSubmitting(false);
    }
  };

  const navigate = (to) => {
    window.location.hash = '#' + to;
  };

  const setField = (field, value) => {
    setFormData(f => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors(e => ({ ...e, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton width="40%" height={24} />
        <Skeleton width="100%" height={48} />
        <Skeleton width="100%" height={48} />
        <Skeleton width="100%" height={120} />
      </div>
    );
  }

  const title = formMode === 'new' ? 'New Issue' : 'Edit Issue';

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-black/[.06] z-10 px-4 py-3 flex items-center gap-3">
        <IconButton icon="arrow-left" onClick={() => navigate(formMode === 'new' ? '/mobile' : `/mobile/issues/${id}`)} size={36} title="Back" />
        <h1 className="text-[16px] font-semibold m-0">{title}</h1>
      </header>

      {/* Form */}
      <div className="p-4 space-y-4 pb-24">
        {/* Guest Information */}
        <Card>
          <CardHeader title="Guest Information" />
          <div className="p-4 space-y-3">
            <Field label="Guest Name" required error={errors.guest_name}>
              <Input
                value={formData.guest_name}
                onChange={v => setField('guest_name', v)}
                placeholder="Guest name"
                error={!!errors.guest_name}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Room Number">
                <Input
                  value={formData.room_number}
                  onChange={v => setField('room_number', v)}
                  placeholder="Room"
                />
              </Field>
              <Field label="Location">
                <Input
                  value={formData.location}
                  onChange={v => setField('location', v)}
                  placeholder="Location"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Check-in Date">
                <Input
                  type="date"
                  value={formData.checkin_date}
                  onChange={v => setField('checkin_date', v)}
                />
              </Field>
              <Field label="Check-out Date">
                <Input
                  type="date"
                  value={formData.checkout_date}
                  onChange={v => setField('checkout_date', v)}
                />
              </Field>
            </div>

            <Field label="Nationality">
              <Input
                value={formData.nationality}
                onChange={v => setField('nationality', v)}
                placeholder="Nationality"
              />
            </Field>

            <Field label="Contact (Email/Phone)">
              <Input
                value={formData.contact}
                onChange={v => setField('contact', v)}
                placeholder="Email or phone number"
              />
            </Field>
          </div>
        </Card>

        {/* Issue Details */}
        <Card>
          <CardHeader title="Issue Details" />
          <div className="p-4 space-y-3">
            <Field label="Title" required error={errors.title}>
              <Input
                value={formData.title}
                onChange={v => setField('title', v)}
                placeholder="Brief summary of the issue"
                error={!!errors.title}
              />
            </Field>

            <Field label="Description" required error={errors.description}>
              <Textarea
                value={formData.description}
                onChange={v => setField('description', v)}
                placeholder="Detailed description of the issue"
                rows={5}
                error={!!errors.description}
              />
            </Field>

            <Field label="Priority">
              <Select
                value={formData.priority}
                onChange={v => setField('priority', v)}
                options={[
                  { value: 'urgent', label: '🔴 Urgent' },
                  { value: 'high', label: '🟠 High' },
                  { value: 'medium', label: '🟡 Medium' },
                  { value: 'low', label: '🟢 Low' },
                ]}
              />
            </Field>

            <Field label="Issue Types">
              <Select
                value={formData.issue_type_ids[0] || ''}
                onChange={v => setField('issue_type_ids', v ? [Number(v)] : [])}
                placeholder="Select issue type"
                options={[
                  { value: '', label: 'None' },
                  ...issueTypes.map(t => ({ value: t.id, label: t.name }))
                ]}
              />
            </Field>

            <Field label="Departments">
              <Select
                value={formData.department_ids[0] || ''}
                onChange={v => setField('department_ids', v ? [Number(v)] : [])}
                placeholder="Select department"
                options={[
                  { value: '', label: 'None' },
                  ...departments.map(d => ({ value: d.id, label: d.name }))
                ]}
              />
            </Field>

            <Field label="Assign To">
              <Select
                value={formData.assigned_to_user_id}
                onChange={v => setField('assigned_to_user_id', v)}
                placeholder="Unassigned"
                options={[
                  { value: '', label: 'Unassigned' },
                  ...users.map(u => ({ value: u.id, label: u.name }))
                ]}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Sticky submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-black/[.06]">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={submitting}
        >
          {formMode === 'new' ? 'Create Issue' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}

window.MobileIssueFormPage = MobileIssueFormPage;
