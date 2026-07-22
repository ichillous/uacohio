CREATE TRIGGER `leads_stage_version_insert`
BEFORE INSERT ON `leads`
WHEN NEW.`stage` NOT IN (
    'inquiry',
    'contacted',
    'toured',
    'applied',
    'enrolled',
    'closed_not_proceeding'
  )
  OR NEW.`version` < 1
BEGIN
  SELECT RAISE(ABORT, 'invalid lead stage or version');
END;
--> statement-breakpoint

CREATE TRIGGER `leads_stage_version_update`
BEFORE UPDATE OF `stage`, `version` ON `leads`
WHEN NEW.`stage` NOT IN (
    'inquiry',
    'contacted',
    'toured',
    'applied',
    'enrolled',
    'closed_not_proceeding'
  )
  OR NEW.`version` < 1
BEGIN
  SELECT RAISE(ABORT, 'invalid lead stage or version');
END;
--> statement-breakpoint

CREATE TRIGGER `lead_stage_history_vocabulary_insert`
BEFORE INSERT ON `lead_stage_history`
WHEN NEW.`to_stage` NOT IN (
    'inquiry',
    'contacted',
    'toured',
    'applied',
    'enrolled',
    'closed_not_proceeding'
  )
  OR (
    NEW.`from_stage` IS NOT NULL
    AND NEW.`from_stage` NOT IN (
      'inquiry',
      'contacted',
      'toured',
      'applied',
      'enrolled',
      'closed_not_proceeding'
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'invalid lead stage history');
END;
--> statement-breakpoint

CREATE TRIGGER `duplicate_candidates_distinct_leads_insert`
BEFORE INSERT ON `duplicate_candidates`
WHEN NEW.`lead_id` = NEW.`candidate_lead_id`
BEGIN
  SELECT RAISE(ABORT, 'duplicate candidate leads must be distinct');
END;
--> statement-breakpoint

CREATE TRIGGER `thread_participants_identity_insert`
BEFORE INSERT ON `thread_participants`
WHEN (NEW.`staff_user_id` IS NULL) = (NEW.`guardian_id` IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'thread participant must have exactly one identity');
END;
--> statement-breakpoint

CREATE TRIGGER `thread_participants_identity_update`
BEFORE UPDATE OF `staff_user_id`, `guardian_id` ON `thread_participants`
WHEN (NEW.`staff_user_id` IS NULL) = (NEW.`guardian_id` IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'thread participant must have exactly one identity');
END;
--> statement-breakpoint

CREATE TRIGGER `user_role_assignments_staff_insert`
BEFORE INSERT ON `user_role_assignments`
WHEN NOT EXISTS (
  SELECT 1
  FROM `users`
  WHERE `users`.`id` = NEW.`user_id`
    AND `users`.`audience` = 'staff'
    AND `users`.`status` = 'active'
)
BEGIN
  SELECT RAISE(ABORT, 'role assignments require an active staff user');
END;
--> statement-breakpoint

CREATE TRIGGER `user_role_assignments_staff_update`
BEFORE UPDATE OF `user_id`, `role_key` ON `user_role_assignments`
WHEN NOT EXISTS (
  SELECT 1
  FROM `users`
  WHERE `users`.`id` = NEW.`user_id`
    AND `users`.`audience` = 'staff'
    AND `users`.`status` = 'active'
)
BEGIN
  SELECT RAISE(ABORT, 'role assignments require an active staff user');
END;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS `audit_events_module_created_idx`
ON `audit_events` (`target_type`, `created_at`);
