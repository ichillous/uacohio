# Portal Database Schema

The active local schema is Cloudflare D1/SQLite and is defined in `src/db/schema.ts`. Generated forward migrations live in `drizzle-d1/`.

The original MySQL migration under `drizzle/` is frozen historical evidence. It is not an input to the D1 migrator, and `pnpm check:migration-history` detects accidental edits.

## Domain ownership

| Domain             | Tables                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity           | `users`, `auth_identities`, `sessions`, `staff_profiles`, `guardian_accounts`, `roles`, `permissions`, `role_permissions`, `user_role_assignments`                                                                              |
| Admissions         | `families`, `guardians`, `prospective_students`, `leads`, `lead_stage_history`, `lead_activities`, `follow_up_tasks`, `visit_requests`, `applications`, `guardian_application_links`, `consent_records`, `duplicate_candidates` |
| Student operations | `school_years`, `terms`, `students`, `guardian_student_links`, `enrollments`, `student_attributes`, `attendance_daily`, `seat_capacity`, `student_documents`, `document_shares`, `guardian_profile_update_requests`             |
| Notifications      | `message_threads`, `thread_participants`, `messages`, `announcements`, `announcement_targets`, `notification_intents`, `notification_attempts`, `outbox_jobs`                                                                   |
| Governance         | `audit_events`, `system_metadata`                                                                                                                                                                                               |

## Identifier and authorization rules

- `students.id` is an internal application key. `emis_student_id`, `local_use_id`, and `ssid` remain distinct.
- Guardian access is granted through verified `guardian_accounts` plus active, effective-dated `guardian_student_links` or `guardian_application_links`.
- Household membership alone never grants access to student or application records.
- Portal authorization is enforced by server-side scoped queries. D1 does not provide application-aware database row-level security.
- Sensitive history is archived/revoked rather than cascade-deleted unless the schema explicitly owns a child record.

## Attendance representation

`attendance_daily` stores the local workflow status plus attended and absent minutes. Later EMIS export maps those minutes to detailed FM rows. An export using FM must set FS320/FS330/FS340 attendance totals to zero for the same submission.

The additive `0001_validate_portal_codes.sql` migration installs D1 triggers that reject attendance values outside the approved local vocabulary and require nine-character EMIS linkage, local-use, and SSID values. The local verifier checks both persisted values and trigger rejection behavior.

## Local migration commands

```bash
pnpm db:generate
pnpm db:migrate:local
```

Both commands operate on the local repository. `db:migrate:local` includes Wrangler's explicit `--local` flag and never mutates a remote D1 database.
