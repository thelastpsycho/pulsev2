-- ============================================================================
-- GuestPulse Verified Status Feature - Manual Migration Script
-- ============================================================================
-- Run this script step by step on your shared server database
-- VERSION: 1.0
-- DATE: 2025-06-29
-- ============================================================================

-- ============================================================================
-- STEP 1: Add verified columns to issues table
-- ============================================================================

-- Add verified_by_user_id column
ALTER TABLE `issues`
ADD COLUMN `verified_by_user_id` INT UNSIGNED NULL AFTER `closed_by_user_id`;

-- Add foreign key constraint
ALTER TABLE `issues`
ADD CONSTRAINT `issues_verified_by_user_id_foreign`
FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;

-- Add verified_at timestamp column
ALTER TABLE `issues`
ADD COLUMN `verified_at` TIMESTAMP NULL AFTER `verified_by_user_id`;

-- Add index for performance
ALTER TABLE `issues`
ADD INDEX `issues_verified_at_index` (`verified_at`);

-- ============================================================================
-- STEP 2: Add permission to permissions table
-- ============================================================================

INSERT INTO `permissions` (`name`, `description`, `created_at`, `updated_at`)
VALUES ('issues.verify', 'Verify closed issues', NOW(), NOW());

-- ============================================================================
-- STEP 3: Assign permission to SuperAdmin and Admin roles
-- ============================================================================

-- Method: Get the permission ID and assign to roles
-- This approach works across most MySQL versions

-- First, note the permission ID from this query:
SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify';

-- Then use that ID (replace {PERMISSION_ID} below):
-- Assign to SuperAdmin
INSERT INTO `permission_role` (`permission_id`, `role_id`)
SELECT (SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify' LIMIT 1),
       (SELECT `id` FROM `roles` WHERE `name` = 'SuperAdmin' LIMIT 1);

-- Assign to Admin
INSERT INTO `permission_role` (`permission_id`, `role_id`)
SELECT (SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify' LIMIT 1),
       (SELECT `id` FROM `roles` WHERE `name` = 'Admin' LIMIT 1);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check issues table structure
DESCRIBE `issues`;

-- Check permission exists
SELECT * FROM `permissions` WHERE `name` = 'issues.verify';

-- Check role assignments
SELECT
    r.name as role_name,
    p.name as permission_name,
    p.description
FROM `permission_role` pr
JOIN `roles` r ON pr.role_id = r.id
JOIN `permissions` p ON pr.permission_id = p.id
WHERE p.name = 'issues.verify';

-- ============================================================================
-- ROLLBACK COMMANDS (use only if needed)
-- ============================================================================

-- DELETE FROM `permission_role` WHERE `permission_id` = (SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify');
-- DELETE FROM `permissions` WHERE `name` = 'issues.verify';
-- ALTER TABLE `issues` DROP INDEX `issues_verified_at_index`;
-- ALTER TABLE `issues` DROP FOREIGN KEY `issues_verified_by_user_id_foreign`;
-- ALTER TABLE `issues` DROP COLUMN `verified_by_user_id`;
-- ALTER TABLE `issues` DROP COLUMN `verified_at`;
