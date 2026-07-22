CREATE UNIQUE INDEX `user_role_assignments_one_open_per_user`
ON `user_role_assignments` (`user_id`)
WHERE `effective_end` IS NULL;--> statement-breakpoint

CREATE TRIGGER `user_role_assignments_keep_last_admin_on_close`
BEFORE UPDATE OF `effective_end` ON `user_role_assignments`
FOR EACH ROW
WHEN OLD.`role_key` = 'system_administrator'
  AND OLD.`effective_end` IS NULL
  AND NEW.`effective_end` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `user_role_assignments` AS remaining_assignment
    INNER JOIN `users` AS remaining_user
      ON remaining_user.`id` = remaining_assignment.`user_id`
     AND remaining_user.`audience` = 'staff'
     AND remaining_user.`status` = 'active'
    INNER JOIN `staff_profiles` AS remaining_profile
      ON remaining_profile.`user_id` = remaining_assignment.`user_id`
     AND remaining_profile.`active` = 1
    WHERE remaining_assignment.`id` <> OLD.`id`
      AND remaining_assignment.`role_key` = 'system_administrator'
      AND remaining_assignment.`effective_end` IS NULL
  )
BEGIN
  SELECT RAISE(ABORT, 'last active system administrator required');
END;--> statement-breakpoint

CREATE TRIGGER `user_role_assignments_keep_last_admin_on_role_change`
BEFORE UPDATE OF `role_key` ON `user_role_assignments`
FOR EACH ROW
WHEN OLD.`role_key` = 'system_administrator'
  AND NEW.`role_key` <> 'system_administrator'
  AND OLD.`effective_end` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `user_role_assignments` AS remaining_assignment
    INNER JOIN `users` AS remaining_user
      ON remaining_user.`id` = remaining_assignment.`user_id`
     AND remaining_user.`audience` = 'staff'
     AND remaining_user.`status` = 'active'
    INNER JOIN `staff_profiles` AS remaining_profile
      ON remaining_profile.`user_id` = remaining_assignment.`user_id`
     AND remaining_profile.`active` = 1
    WHERE remaining_assignment.`id` <> OLD.`id`
      AND remaining_assignment.`role_key` = 'system_administrator'
      AND remaining_assignment.`effective_end` IS NULL
  )
BEGIN
  SELECT RAISE(ABORT, 'last active system administrator required');
END;--> statement-breakpoint

CREATE TRIGGER `user_role_assignments_keep_last_admin_on_delete`
BEFORE DELETE ON `user_role_assignments`
FOR EACH ROW
WHEN OLD.`role_key` = 'system_administrator'
  AND OLD.`effective_end` IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM `user_role_assignments` AS remaining_assignment
    INNER JOIN `users` AS remaining_user
      ON remaining_user.`id` = remaining_assignment.`user_id`
     AND remaining_user.`audience` = 'staff'
     AND remaining_user.`status` = 'active'
    INNER JOIN `staff_profiles` AS remaining_profile
      ON remaining_profile.`user_id` = remaining_assignment.`user_id`
     AND remaining_profile.`active` = 1
    WHERE remaining_assignment.`id` <> OLD.`id`
      AND remaining_assignment.`role_key` = 'system_administrator'
      AND remaining_assignment.`effective_end` IS NULL
  )
BEGIN
  SELECT RAISE(ABORT, 'last active system administrator required');
END;
