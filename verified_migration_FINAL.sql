-- ============================================================================
-- GuestPulse Verified Status Feature - Migration Script
-- ============================================================================

-- Add verified_by_user_id column
ALTER TABLE `issues`
ADD COLUMN `verified_by_user_id` BIGINT UNSIGNED NULL AFTER `closed_by_user_id`;

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

-- Add permission
INSERT INTO `permissions` (`name`, `description`, `created_at`, `updated_at`)
VALUES ('issues.verify', 'Verify closed issues', NOW(), NOW());

-- Assign to SuperAdmin ONLY
INSERT INTO `permission_role` (`permission_id`, `role_id`, `created_at`, `updated_at`)
SELECT
    (SELECT `id` FROM `permissions` WHERE `name` = 'issues.verify' LIMIT 1),
    (SELECT `id` FROM `roles` WHERE `name` = 'SuperAdmin' LIMIT 1),
    NOW(),
    NOW();