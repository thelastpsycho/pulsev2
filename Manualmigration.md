# Manual Migration Guide - Verified Status Feature

## 📋 Overview
This guide provides step-by-step instructions to manually migrate the verified status feature to a shared server without artisan command access.

## ⚠️ Pre-Migration Checklist
- [ ] **Backup Database** - Create a full database backup before proceeding
- [ ] **Verify PHP Files** - Ensure all updated files are uploaded to server
- [ ] **Check Table Names** - Confirm your exact table names (may have prefixes)
- [ ] **Test Environment** - Test in staging environment first if available

---

## 🗄️ Database Migration Steps

### Step 1: Add Verified Columns to Issues Table

**SQL Command:**
```sql
-- Add verified_by_user_id column with foreign key constraint
ALTER TABLE `issues`
ADD COLUMN `verified_by_user_id` INT UNSIGNED NULL AFTER `closed_by_user_id`;

-- Add foreign key constraint separately (more reliable)
ALTER TABLE `issues`
ADD CONSTRAINT `issues_verified_by_user_id_foreign`
FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add verified_at timestamp column
ALTER TABLE `issues`
ADD COLUMN `verified_at` TIMESTAMP NULL AFTER `verified_by_user_id`;

-- Add index for performance (matches closed_at pattern)
ALTER TABLE `issues`
ADD INDEX `issues_verified_at_index` (`verified_at`);
```

**Expected Result:**
- Two new columns added: `verified_by_user_id`, `verified_at`
- Foreign key constraint linking to users table
- Index on `verified_at` for query performance

---

### Step 2: Add Permission to Permissions Table

**SQL Command:**
```sql
-- Add the new issues.verify permission
INSERT INTO `permissions` (`name`, `description`, `created_at`, `updated_at`)
VALUES ('issues.verify', 'Verify closed issues', NOW(), NOW());
```

**Expected Result:**
- New row in `permissions` table with `name = 'issues.verify'`

---

### Step 3: Assign Permission to Roles

**Method 1: Direct ID Assignment (Recommended)**
```sql
-- Get the permission ID first
SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify';
-- Note the returned ID, then use it in commands below

-- Replace {PERMISSION_ID} with the actual ID from above
-- Assign to SuperAdmin role
INSERT INTO `permission_role` (`permission_id`, `role_id`)
VALUES ({PERMISSION_ID}, (SELECT `id` FROM `roles` WHERE `name` = 'SuperAdmin' LIMIT 1));

-- Assign to Admin role
INSERT INTO `permission_role` (`permission_id`, `role_id`)
VALUES ({PERMISSION_ID}, (SELECT `id` FROM `roles` WHERE `name` = 'Admin' LIMIT 1));
```

**Method 2: Using Subquery (Alternative)**
```sql
-- Single command approach (if your MySQL version supports it)
INSERT INTO `permission_role` (`permission_id`, `role_id`)
SELECT p.id, r.id
FROM `permissions` p, `roles` r
WHERE p.name = 'issues.verify'
AND r.name IN ('SuperAdmin', 'Admin');
```

**Expected Result:**
- Two new rows in `permission_role` table linking the permission to SuperAdmin and Admin roles
- Staff role should NOT get this permission

---

## 🔍 Verification Queries

Run these after migration to verify success:

### 1. Check Issues Table Structure
```sql
DESCRIBE `issues`;
```
**Expected Output:** Should show `verified_by_user_id` and `verified_at` columns

### 2. Check Permission Creation
```sql
SELECT * FROM `permissions` WHERE `name` = 'issues.verify';
```
**Expected Output:** One row with the permission details

### 3. Check Permission Assignments
```sql
SELECT
    r.name as role_name,
    p.name as permission_name,
    p.description
FROM `permission_role` pr
JOIN `roles` r ON pr.role_id = r.id
JOIN `permissions` p ON pr.permission_id = p.id
WHERE p.name = 'issues.verify';
```
**Expected Output:** Two rows - one for SuperAdmin, one for Admin

### 4. Test Foreign Key Constraint
```sql
-- Test that foreign key works (should not error)
SELECT * FROM `issues` i
LEFT JOIN `users` u ON i.verified_by_user_id = u.id
LIMIT 1;
```

---

## 📁 Updated PHP Files Checklist

These files should already be uploaded to your server:

### Core Application Files
- [ ] `app/Models/Issue.php` - Added verified methods and relationships
- [ ] `app/Http/Controllers/Api/IssueController.php` - Added verify() endpoint
- [ ] `app/Policies/IssuePolicy.php` - Added verify authorization logic
- [ ] `app/Services/IssueService.php` - Added verify() method with activity logging
- [ ] `app/Http/Requests/Api/Issue/UpdateIssueRequest.php` - Updated status validation

### Configuration Files
- [ ] `routes/api.php` - Added `/issues/{issue}/verify` route

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Foreign Key Constraint Fails
**Error:** "Cannot add foreign key constraint"
**Solution:**
```sql
-- Check if users table exists and has id column
DESCRIBE `users`;

-- Check engine types match
SELECT TABLE_NAME, ENGINE
FROM information_schema.TABLES
WHERE TABLE_NAME IN ('issues', 'users');
```

#### Issue 2: Permission Table Structure Different
**Error:** "Column count doesn't match value count"
**Solution:**
```sql
-- Check your permissions table structure first
DESCRIBE `permissions`;

-- Adjust INSERT statement based on actual columns
-- Example: if you have extra columns, modify accordingly
```

#### Issue 3: Role Names Don't Match
**Error:** "No rows found" when assigning permissions
**Solution:**
```sql
-- Check your actual role names
SELECT `name`, `id` FROM `roles`;

-- Update the assignment commands with correct role names
```

#### Issue 4: permission_role Table Different
**Error:** "Table 'permission_role' doesn't exist"
**Solution:**
```sql
-- Check your actual pivot table name
SHOW TABLES LIKE '%permission%';
SHOW TABLES LIKE '%role%';

-- It might be named differently, e.g., role_permission, permission_role, etc.
```

---

## 🚀 Post-Migration Testing

### Manual Testing Steps

1. **Test API Endpoint:**
   ```bash
   # Login to get token
   curl -X POST https://your-domain.com/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'

   # Test verify endpoint (replace ISSUE_ID and TOKEN)
   curl -X POST https://your-domain.com/api/issues/ISSUE_ID/verify \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json"
   ```

2. **Test Frontend Integration:**
   - Log in as SuperAdmin or Admin user
   - Create a test issue
   - Close the issue
   - Verify the "Verify" button appears
   - Click "Verify" and check status changes to "Verified"
   - Verify the issue can be reopened

3. **Test Activity Logging:**
   ```sql
   -- Check if verification is logged
   SELECT * FROM `activity_logs`
   WHERE `action` = 'verified'
   ORDER BY `created_at` DESC
   LIMIT 5;
   ```

---

## 📊 Rollback Plan (If Needed)

If migration fails, use these commands to rollback:

```sql
-- Rollback permission assignments
DELETE FROM `permission_role`
WHERE `permission_id` = (SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify');

-- Rollback permission creation
DELETE FROM `permissions` WHERE `name` = 'issues.verify';

-- Rollback table changes (in reverse order)
ALTER TABLE `issues` DROP INDEX `issues_verified_at_index`;
ALTER TABLE `issues` DROP FOREIGN KEY `issues_verified_by_user_id_foreign`;
ALTER TABLE `issues` DROP COLUMN `verified_by_user_id`;
ALTER TABLE `issues` DROP COLUMN `verified_at`;
```

---

## 📝 Additional Notes

### Table Prefixes
If your tables use prefixes (e.g., `gp_issues`, `gp_users`), update all table names:
- `issues` → `yourprefix_issues`
- `users` → `yourprefix_users`
- `permissions` → `yourprefix_permissions`
- `roles` → `yourprefix_roles`
- `permission_role` → `yourprefix_permission_role`

### Custom Table Structures
If your database structure differs significantly from standard Laravel:
1. Run `DESCRIBE` commands on each table first
2. Adjust column names and types accordingly
3. Test each command individually
4. Verify foreign key relationships match your setup

### Permission System Variations
If your permission system works differently:
- Check how permissions are stored (JSON, separate table, etc.)
- Check how role-permission relationships work
- Adjust the permission assignment logic accordingly

---

## ✅ Success Criteria

Migration is successful when:
- ✅ New columns exist in issues table
- ✅ Permission exists in permissions table
- ✅ SuperAdmin and Admin have the permission
- ✅ Foreign key constraints work properly
- ✅ API endpoint responds correctly
- ✅ Frontend integration works
- ✅ Activity logging functions properly

---

## 🆘 Support

If you encounter issues:
1. Check the exact error message
2. Run verification queries to identify the problem
3. Use the troubleshooting section above
4. Test each SQL command individually
5. Verify your database structure matches assumptions

---

**Migration Version:** 1.0
**Date:** 2025-06-29
**Compatible with:** GuestPulse Issue Tracking System
**Risk Level:** Medium (backup required)
