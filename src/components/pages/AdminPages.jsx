import { useState, useEffect, useMemo } from 'react'
// ============================================================================
// Admin pages — Users, Roles, Departments, Issue Types
// Profile page
// ============================================================================

const safeWindow = () => ({
  UI: typeof window !== 'undefined' && window.PulseUI || { Icon: () => null, Avatar: () => null, Pill: () => null, Button: () => null, Card: () => null, Skeleton: () => null, TOKENS: {} },
  Form: typeof window !== 'undefined' && window.PulseForm || { Field: () => null, Input: () => null, Textarea: () => null, Select: () => null, Checkbox: () => null, Toggle: () => null },
  Overlay: typeof window !== 'undefined' && window.PulseOverlay || { Drawer: () => null, Dropdown: () => null, DropdownItem: () => null, DropdownDivider: () => null, ConfirmDialog: () => null },
  Layout: typeof window !== 'undefined' && window.PulseLayout || { PageHeader: () => null, Tabs: () => null }
});

const w = safeWindow();
const IA = w.UI.Icon; const AvA = w.UI.Avatar; const PA = w.UI.Pill; const BA = w.UI.Button; const CA = w.UI.Card; const SA = w.UI.Skeleton; const TA = w.UI.TOKENS;
const FA = w.Form.Field; const InA = w.Form.Input; const TaA = w.Form.Textarea; const SeA = w.Form.Select; const CbA = w.Form.Checkbox; const TgA = w.Form.Toggle;
const DrA = w.Overlay.Drawer; const DdA = w.Overlay.Dropdown; const DiA = w.Overlay.DropdownItem; const DdvA = w.Overlay.DropdownDivider; const CnA = w.Overlay.ConfirmDialog;
const PhA = w.Layout.PageHeader; const TbA = w.Layout.Tabs;

// =====================================================================
// USERS
// =====================================================================
function AdminUsersPage() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null); // user being edited or 'new'
  useEffect(() => { window.PulseAPI.Users.list().then(r => setUsers(r.data)); }, []);

  const filtered = users?.filter(u => !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));

  const save = async (data) => {
    if (editing === "new") {
      const r = await window.PulseAPI.Users.create(data);
      setUsers(us => [...us, r.data]);
      window.toast.success(`${r.data.name} created`);
    } else {
      const r = await window.PulseAPI.Users.update(editing.id, data);
      setUsers(us => us.map(u => u.id === r.data.id ? r.data : u));
      window.toast.success(`${r.data.name} updated`);
    }
    setEditing(null);
  };
  const toggleActive = async (u) => {
    const r = u.is_active ? await window.PulseAPI.Users.deactivate(u.id) : await window.PulseAPI.Users.activate(u.id);
    setUsers(us => us.map(x => x.id === u.id ? r.data : x));
    window.toast.success(`${u.name} ${r.data.is_active ? "activated" : "deactivated"}`);
  };
  const deleteUser = async (u) => {
    if (confirm(`Are you sure you want to delete ${u.name}? This action cannot be undone.`)) {
      await window.PulseAPI.Users.destroy(u.id);
      setUsers(us => us.filter(x => x.id !== u.id));
      window.toast.success(`${u.name} deleted`);
    }
  };

  return (
    <div>
      <PhA title="Users" subtitle={users ? `${users.length} total · ${users.filter(u => u.is_active).length} active` : "—"}
        actions={<BA icon="plus" onClick={() => setEditing("new")}>New user</BA>}/>
      <div className="px-7 pb-[60px] max-w-[1200px]">
        <div className="pt-4 pb-3 flex gap-2 items-center">
          <div className="flex-[0_0_320px]"><InA value={q} onChange={setQ} icon="search" placeholder="Search users…"/></div>
        </div>
        <CA>
          {!users ? <div className="p-5"><SA height={48}/></div> : (
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="border-b border-black/6">
                  <th className={thAClass}>User</th>
                  <th className={thAClass}>Role</th>
                  <th className={thAClass}>Department</th>
                  <th className={thAClass}>Last seen</th>
                  <th className={`${thAClass} text-right pr-5.5`}>Status</th>
                  <th className={`${thAClass} w-[50px]`}></th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map(u => (
                  <tr key={u.id} className="border-b border-black/4">
                    <td className={`${tdAClass} pl-5.5`}>
                      <div className="flex items-center gap-2.5">
                        <AvA name={u.name} size={32}/>
                        <div>
                          <div className="font-medium text-text">{u.name}</div>
                          <div className="text-[12px] text-muted-light">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={tdAClass}><PA color={TA.purple}>{u.roles && u.roles.length > 0 ? u.roles[0].name : "—"}</PA></td>
                    <td className={`${tdAClass} text-muted`}>{u.department || "—"}</td>
                    <td className={`${tdAClass} text-muted-light text-[12.5px]`}>{u.last_login_at ? timeAgoA(u.last_login_at) : "Never"}</td>
                    <td className={`${tdAClass} text-right pr-5.5`}>
                      {u.is_active ? <PA color={TA.success} dot>Active</PA> : <PA color={TA.mutedLight}>Inactive</PA>}
                    </td>
                    <td className={tdAClass}>
                      <DdA trigger={<button className="bg-none border-none p-1 cursor-pointer"><IA name="more" size={15} color={TA.mutedLight}/></button>}>
                        <DiA icon="edit" label="Edit" onClick={() => setEditing(u)}/>
                        <DiA icon="key" label="Change password"/>
                        <DiA icon={u.is_active ? "x-circle" : "check-circle"} label={u.is_active ? "Deactivate" : "Activate"} onClick={() => toggleActive(u)}/>
                        <DdvA/>
                        <DiA icon="trash" label="Delete" danger onClick={() => deleteUser(u)}/>
                      </DdA>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CA>
      </div>
      {editing && <UserFormDrawer user={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save}/>}
    </div>
  );
}

function UserFormDrawer({ user, onClose, onSave }) {
  const isNew = !user;
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(user ? { ...user, role_ids: user.roles && user.roles.length ? user.roles.map(r => r.id) : [] } : { name: "", email: "", department: "", role_ids: [], is_active: true, temporary_password: "" });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    window.PulseAPI.Roles.list().then(r => setRoles(r.data));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = "Name is required";
    if (!form.email?.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email format";
    if (isNew && !form.role_ids?.length) newErrors.role = "Role is required";
    if (isNew && !form.temporary_password?.trim()) newErrors.temporary_password = "Temporary password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const roleIds = form.role_ids || [];
    const roleObjects = roleIds.map(id => {
      const role = roles.find(r => r.id === id);
      return role ? { id: role.id, name: role.name } : null;
    }).filter(Boolean);

    // Transform data for API - rename temporary_password to password for new users
    const apiData = { ...form, roles: roleObjects };
    if (isNew) {
      apiData.password = apiData.temporary_password;
      delete apiData.temporary_password;
    }

    onSave(apiData);
  };

  const isValid = form.name?.trim() && form.email?.trim() && /\S+@\S+\.\S+/.test(form.email) && (isNew ? form.role_ids?.length && form.temporary_password?.trim() : true);

  return (
    <DrA open={true} onClose={onClose} title={isNew ? "New user" : `Edit ${user.name}`} width={420} footer={
      <>
        <BA variant="ghost" onClick={onClose}>Cancel</BA>
        <BA icon="check" onClick={handleSubmit} disabled={!isValid}>{isNew ? "Create" : "Save"}</BA>
      </>
    }>
      <FA label="Name" required error={errors.name}>
        <InA value={form.name} onChange={v => set("name", v)} autoFocus error={!!errors.name}/>
      </FA>
      <FA label="Email" required error={errors.email}>
        <InA value={form.email} onChange={v => set("email", v)} icon="mail" type="email" error={!!errors.email}/>
      </FA>
      <FA label="Department">
        <InA value={form.department || ""} onChange={v => set("department", v)} placeholder="e.g. Engineering"/>
      </FA>
      <FA label="Role" required={isNew} error={errors.role}>
        <SeA value={form.role_ids?.[0] || ""} onChange={v => set("role_ids", v ? [Number(v)] : [])} options={roles.map(r => ({ value: r.id, label: r.name }))} error={!!errors.role}/>
      </FA>
      {isNew && <FA label="Temporary password" hint="User must change on first login." error={errors.temporary_password}><InA type="password" value={form.temporary_password} onChange={v => set("temporary_password", v)} placeholder="••••••••" error={!!errors.temporary_password}/></FA>}
      <FA label="Status"><TgA checked={form.is_active} onChange={v => set("is_active", v)} label={form.is_active ? "Active" : "Inactive"}/></FA>
    </DrA>
  );
}

// =====================================================================
// ROLES
// =====================================================================
function AdminRolesPage() {
  const [roles, setRoles] = useState(null);
  const [editing, setEditing] = useState(null);
  const [permissions, setPermissions] = useState([]);
  useEffect(() => { window.PulseAPI.Roles.list().then(r => setRoles(r.data)); }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await window.PulseAPI.Permissions.list();
        setPermissions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
      }
    };

    fetchPermissions();
  }, []);

  const save = async (data) => {
    try {
      if (editing === "new") { const r = await window.PulseAPI.Roles.create(data); setRoles(rs => [...rs, r.data]); window.toast.success(`${r.data.name} role created`); }
      else { const r = await window.PulseAPI.Roles.update(editing.id, data); setRoles(rs => rs.map(x => x.id === r.data.id ? r.data : x)); window.toast.success(`${r.data.name} role updated`); }
      setEditing(null);
    } catch (err) {
      console.error('Failed to save role:', err);
      window.toast.error(err.message || 'Failed to save role');
    }
  };

  return (
    <div>
      <PhA title="Roles" subtitle="Permission groups for user accounts"
        actions={<BA icon="plus" onClick={() => setEditing("new")}>New role</BA>}/>
      <div className="px-7 pb-[60px] pt-4 max-w-[1100px]">
        <div className="grid grid-cols-2 gap-3">
          {roles?.map(r => (
            <CA key={r.id}>
              <div className="p-4.5">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-purple/10 text-purple grid place-items-center">
                      <IA name="shield" size={16}/>
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold tracking-tight">{r.name}</div>
                      <div className="text-[12.5px] text-muted-light mt-0.5">{r.users_count} users</div>
                    </div>
                  </div>
                  <DdA trigger={<button className="bg-none border-none p-1 cursor-pointer"><IA name="more" size={15} color={TA.mutedLight}/></button>}>
                    <DiA icon="edit" label="Edit permissions" onClick={() => setEditing(r)}/>
                    <DiA icon="users" label="View members"/>
                    <DdvA/>
                    <DiA icon="trash" label="Delete" danger/>
                  </DdA>
                </div>
                <div className="text-[13px] text-muted mb-3.5 min-h-9">{r.description}</div>
                {r.permissions && r.permissions.length > 0 && (
                  <>
                    <div className="text-[11.5px] text-muted-light font-semibold uppercase tracking-wider mb-1.5">{r.permissions.length} permissions</div>
                    <div className="flex flex-wrap gap-1">
                      {r.permissions.slice(0, 6).map(pid => {
                        const p = permissions.find(x => x.id === pid);
                        return p && <PA key={pid} color={TA.muted} className="text-[10.5px]">{p.name}</PA>;
                      })}
                      {r.permissions.length > 6 && <PA color={TA.mutedLight} className="text-[10.5px]">+{r.permissions.length - 6} more</PA>}
                    </div>
                  </>
                )}
                {(!r.permissions || r.permissions.length === 0) && (
                  <div className="text-[11.5px] text-muted-light italic">No permissions assigned</div>
                )}
              </div>
            </CA>
          ))}
        </div>
      </div>
      {editing && <RoleFormDrawer role={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save}/>}
    </div>
  );
}

function RoleFormDrawer({ role, onClose, onSave }) {
  const isNew = !role;
  const [permissions, setPermissions] = useState([]);
  const [form, setForm] = useState(role ? { name: role.name, description: role.description, permission_ids: role.permissions?.map(p => typeof p === 'object' ? p.id : p) || [] } : { name: "", description: "", permission_ids: [] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const togglePerm = (id) => set("permission_ids", form.permission_ids.includes(id) ? form.permission_ids.filter(p => p !== id) : [...form.permission_ids, id]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await window.PulseAPI.Permissions.list();
        setPermissions(response.data || []);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
        setPermissions([]);
      }
    };

    fetchPermissions();
  }, []);

  // group permissions by prefix
  const groups = {};
  permissions.forEach(p => { const g = p.name.split(".")[0]; (groups[g] = groups[g] || []).push(p); });

  return (
    <DrA open={true} onClose={onClose} title={isNew ? "New role" : `Edit ${role.name}`} width={480} footer={
      <>
        <BA variant="ghost" onClick={onClose}>Cancel</BA>
        <BA icon="check" onClick={() => onSave(form)}>{isNew ? "Create" : "Save"}</BA>
      </>
    }>
      <FA label="Name" required><InA value={form.name} onChange={v => set("name", v)} autoFocus/></FA>
      <FA label="Description"><TaA value={form.description} onChange={v => set("description", v)} rows={2}/></FA>
      <div className="text-[12.5px] text-muted-light font-semibold uppercase tracking-[0.04em] mt-4.5 mb-2.5">Permissions</div>
      {Object.entries(groups).map(([g, perms]) => (
        <div key={g} className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-[12.5px] font-semibold text-text capitalize">{g}</div>
            <button onClick={() => {
              const allOn = perms.every(p => form.permission_ids.includes(p.id));
              if (allOn) set("permission_ids", form.permission_ids.filter(id => !perms.find(p => p.id === id)));
              else set("permission_ids", [...new Set([...form.permission_ids, ...perms.map(p => p.id)])]);
            }} className="bg-none border-none text-accent text-[12px] cursor-pointer font-medium">
              Toggle all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {perms.map(p => (
              <CbA key={p.id} checked={form.permission_ids.includes(p.id)} onChange={() => togglePerm(p.id)} label={p.name.split(".").slice(1).join(".")}/>
            ))}
          </div>
        </div>
      ))}
    </DrA>
  );
}

// =====================================================================
// DEPARTMENTS
// =====================================================================
function AdminDepartmentsPage() {
  const [depts, setDepts] = useState(null);
  const [editing, setEditing] = useState(null);
  useEffect(() => { window.PulseAPI.Departments.list().then(r => setDepts(r.data)); }, []);
  const save = async (data) => {
    if (editing === "new") { const r = await window.PulseAPI.Departments.create(data); setDepts(ds => [...ds, r.data]); }
    else { const r = await window.PulseAPI.Departments.update(editing.id, data); setDepts(ds => ds.map(x => x.id === r.data.id ? r.data : x)); }
    setEditing(null);
  };
  return (
    <div>
      <PhA title="Departments" subtitle="Organizational units for issue routing"
        actions={<BA icon="plus" onClick={() => setEditing("new")}>New department</BA>}/>
      <div className="px-7 pb-[60px] pt-4 max-w-[1000px]">
        <CA>
          {!depts ? <div className="p-5"><SA height={48}/></div> : (
            <table className="w-full border-collapse text-[13.5px]">
              <thead><tr className="border-b border-black/6">
                <th className={thAClass}>Department</th>
                <th className={thAClass}>Code</th>
                <th className={`${thAClass} text-right`}>Open</th>
                <th className={`${thAClass} text-right`}>Closed</th>
                <th className={`${thAClass} text-right pr-5.5`}>Status</th>
                <th className={`${thAClass} w-[50px]`}></th>
              </tr></thead>
              <tbody>
                {depts.map(d => (
                  <tr key={d.id} className="border-b border-black/4">
                    <td style={{ ...tdA, paddingLeft: 22, fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,0.04)", display: "grid", placeItems: "center" }}><IA name="building" size={14} color={TA.muted}/></div>
                        {d.name}
                      </div>
                    </td>
                    <td style={{ ...tdA, color: TA.muted, fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}>{d.code || "—"}</td>
                    <td style={{ ...tdA, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.open_issues}</td>
                    <td style={{ ...tdA, textAlign: "right", fontVariantNumeric: "tabular-nums", color: TA.muted }}>{d.closed_issues}</td>
                    <td style={{ ...tdA, textAlign: "right", paddingRight: 22 }}>{d.is_active ? <PA color={TA.success} dot>Active</PA> : <PA color={TA.mutedLight}>Inactive</PA>}</td>
                    <td style={tdA}>
                      <DdA trigger={<button style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}><IA name="more" size={15} color={TA.mutedLight}/></button>}>
                        <DiA icon="edit" label="Edit" onClick={() => setEditing(d)}/>
                        <DiA icon="inbox" label="View issues"/>
                        <DdvA/>
                        <DiA icon="trash" label="Delete" danger/>
                      </DdA>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CA>
      </div>
      {editing && <DepartmentDrawer dept={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save}/>}
    </div>
  );
}

function DepartmentDrawer({ dept, onClose, onSave }) {
  const isNew = !dept;
  const [form, setForm] = useState(dept || { name: "", code: "", is_active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <DrA open={true} onClose={onClose} title={isNew ? "New department" : `Edit ${dept.name}`} width={380} footer={
      <><BA variant="ghost" onClick={onClose}>Cancel</BA><BA icon="check" onClick={() => onSave(form)}>{isNew ? "Create" : "Save"}</BA></>
    }>
      <FA label="Name" required><InA value={form.name} onChange={v => set("name", v)} autoFocus/></FA>
      <FA label="Code" hint="Short code for filters and tags"><InA value={form.code} onChange={v => set("code", v.toUpperCase())} placeholder="ENG"/></FA>
      <FA label="Status"><TgA checked={form.is_active} onChange={v => set("is_active", v)} label={form.is_active ? "Active" : "Inactive"}/></FA>
    </DrA>
  );
}

// =====================================================================
// ISSUE TYPES
// =====================================================================
function AdminIssueTypesPage() {
  const [types, setTypes] = useState(null);
  const [editing, setEditing] = useState(null);
  useEffect(() => { window.PulseAPI.IssueTypes.list().then(r => setTypes(r.data)); }, []);
  const save = async (data) => {
    if (editing === "new") { const r = await window.PulseAPI.IssueTypes.create(data); setTypes(ts => [...ts, r.data]); }
    else { const r = await window.PulseAPI.IssueTypes.update(editing.id, data); setTypes(ts => ts.map(x => x.id === r.data.id ? r.data : x)); }
    setEditing(null);
  };
  const grouped = useMemo(() => {
    if (!types) return {};
    const g = {};
    types.forEach(t => { const k = t.issue_category?.name || "Uncategorized"; (g[k] = g[k] || []).push(t); });
    return g;
  }, [types]);
  return (
    <div>
      <PhA title="Issue Types" subtitle="Categorize incoming issues"
        actions={<BA icon="plus" onClick={() => setEditing("new")}>New type</BA>}/>
      <div style={{ padding: "16px 28px 60px", maxWidth: 1000 }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11.5, color: TA.mutedLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, padding: "0 4px" }}>{cat}</div>
            <CA>
              {items.map((t, i) => (
                <div key={t.id} style={{
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  borderTop: i > 0 ? "1px solid rgba(0,0,0,0.04)" : "none",
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,0,0,0.04)", display: "grid", placeItems: "center" }}><IA name="tag" size={14} color={TA.muted}/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.name}</div>
                    {t.description && <div style={{ fontSize: 12, color: TA.muted, marginTop: 1 }}>{t.description}</div>}
                  </div>
                  <PA color={TA.muted} style={{ fontVariantNumeric: "tabular-nums" }}>{t.issues_count} issues</PA>
                  {t.default_severity && <window.PulseUI.PriorityPill value={t.default_severity}/>}
                  <DdA trigger={<button style={{ background: "none", border: "none", padding: 4, cursor: "pointer" }}><IA name="more" size={15} color={TA.mutedLight}/></button>}>
                    <DiA icon="edit" label="Edit" onClick={() => setEditing(t)}/>
                    <DdvA/>
                    <DiA icon="trash" label="Delete" danger/>
                  </DdA>
                </div>
              ))}
            </CA>
          </div>
        ))}
      </div>
      {editing && <TypeDrawer type={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSave={save}/>}
    </div>
  );
}

function TypeDrawer({ type, onClose, onSave }) {
  const isNew = !type;
  const [form, setForm] = useState(type ? { ...type, issue_category_id: type.issue_category?.id } : { name: "", description: "", issue_category_id: 1, default_severity: "medium", is_active: true });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <DrA open={true} onClose={onClose} title={isNew ? "New issue type" : `Edit ${type.name}`} width={400} footer={
      <><BA variant="ghost" onClick={onClose}>Cancel</BA><BA icon="check" onClick={() => onSave(form)}>{isNew ? "Create" : "Save"}</BA></>
    }>
      <FA label="Name" required><InA value={form.name} onChange={v => set("name", v)} autoFocus/></FA>
      <FA label="Category"><SeA value={form.issue_category_id} onChange={v => set("issue_category_id", Number(v))} options={form.categories || []} placeholder=""/></FA>
      <FA label="Default severity"><SeA value={form.default_severity} onChange={v => set("default_severity", v)} options={["urgent","high","medium","low"]} placeholder=""/></FA>
      <FA label="Description"><TaA value={form.description} onChange={v => set("description", v)} rows={2}/></FA>
      <FA label="Status"><TgA checked={form.is_active} onChange={v => set("is_active", v)} label={form.is_active ? "Active" : "Inactive"}/></FA>
    </DrA>
  );
}

// =====================================================================
// PROFILE
// =====================================================================
function ProfilePage({ user }) {
  const [tab, setTab] = useState("profile");
  return (
    <div>
      <PhA title="Profile" subtitle="Your account settings"
        tabs={<TbA value={tab} onChange={setTab} items={[
          { value: "profile", label: "Profile" },
          { value: "password", label: "Password" },
          { value: "notifications", label: "Notifications" },
          { value: "danger", label: "Danger zone" },
        ]}/>}/>
      <div style={{ padding: "20px 28px 60px", maxWidth: 720 }}>
        {tab === "profile" && <ProfileForm user={user}/>}
        {tab === "password" && <PasswordForm/>}
        {tab === "notifications" && <NotificationsForm/>}
        {tab === "danger" && <DangerZone/>}
      </div>
    </div>
  );
}

function ProfileForm({ user }) {
  const [name, setName] = useState(user?.name);
  const [email, setEmail] = useState(user?.email);
  return (
    <CA>
      <div style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <AvA name={name} size={56}/>
          <div>
            <BA variant="outline" size="sm" icon="image">Upload photo</BA>
            <div style={{ fontSize: 11.5, color: TA.mutedLight, marginTop: 6 }}>JPG or PNG. Max 2 MB.</div>
          </div>
        </div>
        <FA label="Name" required><InA value={name} onChange={setName}/></FA>
        <FA label="Email" required><InA value={email} onChange={setEmail} icon="mail" type="email"/></FA>
        <FA label="Role" hint="Contact your General Manager to change."><InA value={user?.roles?.[0]?.name || ""} disabled/></FA>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <BA icon="check" onClick={() => window.toast.success("Profile updated")}>Save changes</BA>
        </div>
      </div>
    </CA>
  );
}

function PasswordForm() {
  return (
    <CA>
      <div style={{ padding: 22 }}>
        <FA label="Current password" required><InA type="password" icon="key" placeholder="••••••••"/></FA>
        <FA label="New password" required hint="At least 12 characters, with letters and numbers."><InA type="password" icon="key" placeholder="••••••••"/></FA>
        <FA label="Confirm new password" required><InA type="password" icon="key" placeholder="••••••••"/></FA>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <BA icon="key" onClick={() => window.toast.success("Password updated")}>Update password</BA>
        </div>
      </div>
    </CA>
  );
}

function NotificationsForm() {
  return (
    <CA>
      <div style={{ padding: 22 }}>
        {[
          ["Email: new issue assigned to me", true],
          ["Email: comment on my issue", true],
          ["Email: daily digest (07:00)", false],
          ["In-app: urgent issues", true],
          ["In-app: SLA breach approaching", true],
          ["In-app: closed issues from my team", false],
        ].map(([label, def]) => (
          <NotifRow key={label} label={label} def={def}/>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <BA icon="check" onClick={() => window.toast.success("Preferences saved")}>Save preferences</BA>
        </div>
      </div>
    </CA>
  );
}

function NotifRow({ label, def }) {
  const [on, setOn] = useState(def);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <span style={{ fontSize: 13.5 }}>{label}</span>
      <TgA checked={on} onChange={setOn}/>
    </div>
  );
}

function DangerZone() {
  const [open, setOpen] = useState(false);
  return (
    <CA style={{ borderColor: "rgba(255,59,48,0.20)" }}>
      <div style={{ padding: 22 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: TA.danger, marginBottom: 6 }}>Delete account</div>
        <div style={{ fontSize: 13, color: TA.muted, marginBottom: 14, lineHeight: 1.55 }}>
          Permanently delete your account. Issues and comments you created will remain visible to your team but will be attributed to "Deleted user".
        </div>
        <BA variant="danger" icon="trash" onClick={() => setOpen(true)}>Delete my account</BA>
      </div>
      <CnA open={open} title="Delete your account?" message="This action cannot be undone." confirmLabel="Yes, delete" danger
        onClose={() => setOpen(false)} onConfirm={() => window.toast.error("Account deletion requested")}/>
    </CA>
  );
}

// helpers
function timeAgoA(iso) {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s/60)}m ago`;
  if (s < 86400) return `${Math.round(s/3600)}h ago`;
  return `${Math.round(s/86400)}d ago`;
}

const tdA = { padding: "12px 8px", color: TA.text };

// Tailwind class equivalents for table styles
const thAClass = "px-2 py-2.5 text-left text-[11.5px] font-semibold text-muted-light uppercase tracking-[0.04em] pl-5.5";
const tdAClass = "px-2 py-3 text-text";

window.PageAdminUsers = AdminUsersPage;
window.PageAdminRoles = AdminRolesPage;
window.PageAdminDepartments = AdminDepartmentsPage;
window.PageAdminIssueTypes = AdminIssueTypesPage;
window.PageProfile = ProfilePage;
