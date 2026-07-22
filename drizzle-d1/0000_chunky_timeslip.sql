CREATE TABLE `announcement_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`announcement_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text,
	FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `announcement_targets_lookup_idx` ON `announcement_targets` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`author_user_id` text,
	`translation_group_id` text NOT NULL,
	`locale` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`prospective_student_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_at` text,
	`external_reference` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`prospective_student_id`) REFERENCES `prospective_students`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_lead_unique` ON `applications` (`lead_id`);--> statement-breakpoint
CREATE TABLE `attendance_daily` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`attendance_date` text NOT NULL,
	`status` text NOT NULL,
	`absence_type` text DEFAULT 'none' NOT NULL,
	`attended_minutes` integer NOT NULL,
	`absent_minutes` integer NOT NULL,
	`safe_note` text,
	`marked_by_user_id` text,
	`source` text DEFAULT 'local' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`marked_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "attendance_daily_minutes_check" CHECK("attendance_daily"."attended_minutes" >= 0 and "attendance_daily"."absent_minutes" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attendance_daily_student_date_unique` ON `attendance_daily` (`student_id`,`attendance_date`);--> statement-breakpoint
CREATE INDEX `attendance_daily_date_status_idx` ON `attendance_daily` (`attendance_date`,`status`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`actor_audience` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`correlation_id` text NOT NULL,
	`outcome` text NOT NULL,
	`changed_fields` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_events_target_idx` ON `audit_events` (`target_type`,`target_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_idx` ON `audit_events` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `auth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_subject` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_identities_provider_subject_unique` ON `auth_identities` (`provider`,`provider_subject`);--> statement-breakpoint
CREATE INDEX `auth_identities_user_idx` ON `auth_identities` (`user_id`);--> statement-breakpoint
CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`policy_version` text NOT NULL,
	`purpose` text NOT NULL,
	`choice` text NOT NULL,
	`locale` text NOT NULL,
	`request_context` text NOT NULL,
	`consented_at` text NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `consent_records_lead_idx` ON `consent_records` (`lead_id`);--> statement-breakpoint
CREATE TABLE `document_shares` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`guardian_id` text NOT NULL,
	`shared_by_user_id` text,
	`shared_at` text NOT NULL,
	`revoked_at` text,
	FOREIGN KEY (`document_id`) REFERENCES `student_documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `document_shares_guardian_document_unique` ON `document_shares` (`document_id`,`guardian_id`);--> statement-breakpoint
CREATE TABLE `duplicate_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`candidate_lead_id` text NOT NULL,
	`signals` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`reviewer_user_id` text,
	`reviewed_at` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`candidate_lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `duplicate_candidates_pair_unique` ON `duplicate_candidates` (`lead_id`,`candidate_lead_id`);--> statement-breakpoint
CREATE INDEX `duplicate_candidates_state_idx` ON `duplicate_candidates` (`state`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`term_id` text NOT NULL,
	`admission_date` text NOT NULL,
	`admission_reason_code` text NOT NULL,
	`admitted_from_irn` text,
	`effective_start` text NOT NULL,
	`effective_end` text,
	`legal_district_of_residence` text NOT NULL,
	`attending_building_irn` text NOT NULL,
	`assigned_building_area_irn` text,
	`district_relationship_code` text NOT NULL,
	`percent_of_time` integer DEFAULT 100 NOT NULL,
	`grade_level_code` text NOT NULL,
	`withdrawal_reason_code` text,
	`withdrawn_to_irn` text,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "enrollments_percent_of_time_check" CHECK("enrollments"."percent_of_time" between 0 and 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_student_term_start_unique` ON `enrollments` (`student_id`,`term_id`,`effective_start`);--> statement-breakpoint
CREATE INDEX `enrollments_term_status_idx` ON `enrollments` (`term_id`,`status`);--> statement-breakpoint
CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`preferred_locale` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `follow_up_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`owner_user_id` text,
	`due_at` text NOT NULL,
	`completed_at` text,
	`outcome` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `follow_up_tasks_owner_due_idx` ON `follow_up_tasks` (`owner_user_id`,`due_at`);--> statement-breakpoint
CREATE TABLE `guardian_accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`guardian_id` text NOT NULL,
	`verified_link_state` text DEFAULT 'verified' NOT NULL,
	`verified_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_accounts_guardian_unique` ON `guardian_accounts` (`guardian_id`);--> statement-breakpoint
CREATE TABLE `guardian_application_links` (
	`id` text PRIMARY KEY NOT NULL,
	`guardian_id` text NOT NULL,
	`application_id` text NOT NULL,
	`relationship` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`effective_start` text NOT NULL,
	`effective_end` text,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_application_links_effective_unique` ON `guardian_application_links` (`guardian_id`,`application_id`,`effective_start`);--> statement-breakpoint
CREATE INDEX `guardian_application_links_application_idx` ON `guardian_application_links` (`application_id`,`status`);--> statement-breakpoint
CREATE TABLE `guardian_profile_update_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`guardian_id` text NOT NULL,
	`requested_changes` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`reviewer_user_id` text,
	`decision_note` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`decided_at` text,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `guardian_profile_requests_state_idx` ON `guardian_profile_update_requests` (`state`);--> statement-breakpoint
CREATE TABLE `guardian_student_links` (
	`id` text PRIMARY KEY NOT NULL,
	`guardian_id` text NOT NULL,
	`student_id` text NOT NULL,
	`relationship` text NOT NULL,
	`custody` integer DEFAULT false NOT NULL,
	`receives_contact` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`effective_start` text NOT NULL,
	`effective_end` text,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guardian_student_links_effective_unique` ON `guardian_student_links` (`guardian_id`,`student_id`,`effective_start`);--> statement-breakpoint
CREATE INDEX `guardian_student_links_student_idx` ON `guardian_student_links` (`student_id`,`status`);--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`normalized_email` text,
	`normalized_phone` text,
	`contact_preference` text,
	`preferred_language` text DEFAULT 'en' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `guardians_family_idx` ON `guardians` (`family_id`);--> statement-breakpoint
CREATE TABLE `lead_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`type` text NOT NULL,
	`outcome` text,
	`safe_note` text,
	`actor_user_id` text,
	`next_action_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `lead_activities_lead_idx` ON `lead_activities` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `lead_stage_history` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`actor_user_id` text,
	`reason` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `lead_stage_history_lead_idx` ON `lead_stage_history` (`lead_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`prospective_student_id` text NOT NULL,
	`stage` text DEFAULT 'inquiry' NOT NULL,
	`owner_user_id` text,
	`source` text NOT NULL,
	`campaign` text,
	`preferred_locale` text NOT NULL,
	`due_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`closed_outcome` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`prospective_student_id`) REFERENCES `prospective_students`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `leads_stage_due_idx` ON `leads` (`stage`,`due_at`);--> statement-breakpoint
CREATE INDEX `leads_owner_idx` ON `leads` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `leads_source_campaign_idx` ON `leads` (`source`,`campaign`);--> statement-breakpoint
CREATE TABLE `message_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`student_id` text,
	`lead_id` text,
	`subject` text NOT NULL,
	`state` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `message_threads_family_idx` ON `message_threads` (`family_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`original_body` text NOT NULL,
	`original_locale` text NOT NULL,
	`reviewed_translation` text,
	`translated_locale` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `message_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `messages_thread_created_idx` ON `messages` (`thread_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `notification_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`intent_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`provider` text DEFAULT 'fake' NOT NULL,
	`result` text NOT NULL,
	`attempted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`intent_id`) REFERENCES `notification_intents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_attempts_number_unique` ON `notification_attempts` (`intent_id`,`attempt_number`);--> statement-breakpoint
CREATE TABLE `notification_intents` (
	`id` text PRIMARY KEY NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`template_version` text NOT NULL,
	`locale` text NOT NULL,
	`channel` text NOT NULL,
	`recipient_reference` text NOT NULL,
	`state` text DEFAULT 'queued' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notification_intents_aggregate_idx` ON `notification_intents` (`aggregate_type`,`aggregate_id`);--> statement-breakpoint
CREATE TABLE `outbox_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`payload_reference` text NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`available_at` text NOT NULL,
	`locked_at` text,
	`idempotency_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `outbox_jobs_idempotency_unique` ON `outbox_jobs` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `outbox_jobs_claim_idx` ON `outbox_jobs` (`state`,`available_at`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`key` text PRIMARY KEY NOT NULL,
	`module` text NOT NULL,
	`action` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prospective_students` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text,
	`grade_interest` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `prospective_students_family_idx` ON `prospective_students` (`family_id`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_key` text NOT NULL,
	`permission_key` text NOT NULL,
	FOREIGN KEY (`role_key`) REFERENCES `roles`(`key`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_key`) REFERENCES `permissions`(`key`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_pair_unique` ON `role_permissions` (`role_key`,`permission_key`);--> statement-breakpoint
CREATE INDEX `role_permissions_permission_idx` ON `role_permissions` (`permission_key`);--> statement-breakpoint
CREATE TABLE `roles` (
	`key` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `school_years` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`current` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `seat_capacity` (
	`id` text PRIMARY KEY NOT NULL,
	`school_year_id` text NOT NULL,
	`grade_level_code` text NOT NULL,
	`capacity` integer NOT NULL,
	`source` text NOT NULL,
	`approved_owner` text NOT NULL,
	`refreshed_at` text NOT NULL,
	FOREIGN KEY (`school_year_id`) REFERENCES `school_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `seat_capacity_year_grade_unique` ON `seat_capacity` (`school_year_id`,`grade_level_code`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`provider` text NOT NULL,
	`expires_at` text NOT NULL,
	`revoked_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_expiry_idx` ON `sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `staff_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`title` text,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `student_attributes` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`effective_start` text NOT NULL,
	`effective_end` text,
	`grade_level_code` text NOT NULL,
	`attendance_pattern_code` text NOT NULL,
	`english_learner_code` text NOT NULL,
	`disability_condition_code` text DEFAULT '**' NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_attributes_effective_unique` ON `student_attributes` (`student_id`,`effective_start`);--> statement-breakpoint
CREATE TABLE `student_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`type` text NOT NULL,
	`object_key` text NOT NULL,
	`original_filename` text NOT NULL,
	`media_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`checksum` text NOT NULL,
	`uploaded_by_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `student_documents_object_key_unique` ON `student_documents` (`object_key`);--> statement-breakpoint
CREATE INDEX `student_documents_student_idx` ON `student_documents` (`student_id`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`prospective_student_id` text,
	`emis_student_id` text NOT NULL,
	`local_use_id` text,
	`ssid` text,
	`legal_first_name` text NOT NULL,
	`legal_middle_name` text,
	`legal_last_name` text NOT NULL,
	`birth_date` text NOT NULL,
	`gender_code` text NOT NULL,
	`race_ethnicity_code` text NOT NULL,
	`native_language_code` text NOT NULL,
	`home_language_code` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`prospective_student_id`) REFERENCES `prospective_students`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_emis_student_id_unique` ON `students` (`emis_student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_local_use_id_unique` ON `students` (`local_use_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_ssid_unique` ON `students` (`ssid`);--> statement-breakpoint
CREATE INDEX `students_status_name_idx` ON `students` (`status`,`legal_last_name`,`legal_first_name`);--> statement-breakpoint
CREATE TABLE `system_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `terms` (
	`id` text PRIMARY KEY NOT NULL,
	`school_year_id` text NOT NULL,
	`name` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	FOREIGN KEY (`school_year_id`) REFERENCES `school_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `terms_year_name_unique` ON `terms` (`school_year_id`,`name`);--> statement-breakpoint
CREATE TABLE `thread_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`staff_user_id` text,
	`guardian_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`last_read_at` text,
	FOREIGN KEY (`thread_id`) REFERENCES `message_threads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`staff_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guardian_id`) REFERENCES `guardians`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `thread_participants_thread_idx` ON `thread_participants` (`thread_id`,`status`);--> statement-breakpoint
CREATE TABLE `user_role_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role_key` text NOT NULL,
	`assigned_by_user_id` text,
	`effective_start` text NOT NULL,
	`effective_end` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_key`) REFERENCES `roles`(`key`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_role_assignments_effective_unique` ON `user_role_assignments` (`user_id`,`role_key`,`effective_start`);--> statement-breakpoint
CREATE INDEX `user_role_assignments_active_idx` ON `user_role_assignments` (`user_id`,`effective_end`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`audience` text NOT NULL,
	`display_name` text NOT NULL,
	`normalized_email` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_audience_check" CHECK("users"."audience" in ('staff', 'guardian'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_normalized_email_unique` ON `users` (`normalized_email`);--> statement-breakpoint
CREATE INDEX `users_audience_status_idx` ON `users` (`audience`,`status`);--> statement-breakpoint
CREATE TABLE `visit_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`requested_at` text NOT NULL,
	`status` text DEFAULT 'requested' NOT NULL,
	`safe_note` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `visit_requests_lead_idx` ON `visit_requests` (`lead_id`);