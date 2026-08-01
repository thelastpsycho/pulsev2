# AI Chat permission — SQL setup

Idempotent — safe to run even if already applied. Run on the shared server's
production database (phpMyAdmin, Adminer, or `mysql` CLI).

```sql
-- 1. Create the permission if it doesn't already exist
INSERT INTO permissions (name, description, created_at, updated_at)
SELECT 'ai.chat.view', 'Access AI chat assistant', NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM permissions WHERE name = 'ai.chat.view'
);

-- 2. Grant it to SuperAdmin (skips if already granted)
INSERT INTO permission_role (permission_id, role_id, created_at, updated_at)
SELECT p.id, r.id, NOW(), NOW()
FROM permissions p
JOIN roles r ON r.name = 'SuperAdmin'
WHERE p.name = 'ai.chat.view'
  AND NOT EXISTS (
      SELECT 1 FROM permission_role pr
      WHERE pr.permission_id = p.id AND pr.role_id = r.id
  );
```

To grant other roles (Duty Manager, Supervisor, FOM, Basic) later, use the
app's `/admin/roles` screen instead of SQL — it needs the `admin.roles.update`
permission and updates the same `permission_role` table.
