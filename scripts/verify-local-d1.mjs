import { spawnSync } from "node:child_process";

function executeLocalQuery(query) {
  const result = spawnSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "uacohio-local", "--local", "--command", query, "--json"],
    { encoding: "utf8" },
  );

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    throw new Error(`Local D1 verification failed with status ${result.status ?? "unknown"}.`);
  }

  return JSON.parse(result.stdout);
}

const query = `SELECT
  (SELECT COUNT(*) FROM students) AS students,
  (SELECT COUNT(*) FROM attendance_daily) AS attendance,
  (SELECT COUNT(*) FROM roles) AS roles,
  (SELECT COUNT(*) FROM leads) AS leads,
  (SELECT COUNT(DISTINCT stage) FROM leads) AS lead_stages,
  (SELECT COUNT(*) FROM lead_activities) AS lead_activities,
  (SELECT COUNT(*) FROM follow_up_tasks WHERE completed_at IS NULL) AS open_follow_ups,
  (SELECT COUNT(*) FROM duplicate_candidates WHERE state = 'pending') AS pending_duplicates,
  (SELECT COUNT(*) FROM seat_capacity) AS seat_capacities,
  (SELECT COUNT(*) FROM auth_identities WHERE provider = 'dev') AS dev_identities,
  (SELECT COUNT(*) FROM user_role_assignments WHERE effective_end IS NULL) AS active_staff_roles,
  (SELECT COUNT(*) FROM attendance_daily WHERE status NOT IN ('present', 'absent_excused', 'absent_unexcused', 'tardy_excused', 'tardy_unexcused', 'partial')) AS invalid_attendance_statuses,
  (SELECT COUNT(*) FROM students WHERE length(emis_student_id) <> 9 OR length(local_use_id) <> 9 OR length(ssid) <> 9) AS invalid_student_identifiers,
  (SELECT COUNT(*) FROM (
    SELECT guardian_id FROM guardian_student_links
    WHERE status = 'active'
    GROUP BY guardian_id HAVING COUNT(*) > 1
  )) AS multi_child_guardians;`;

const payload = executeLocalQuery(query);
const counts = payload[0]?.results?.[0];
const expected = {
  active_staff_roles: 6,
  attendance: 9000,
  dev_identities: 10,
  invalid_attendance_statuses: 0,
  invalid_student_identifiers: 0,
  lead_activities: 30,
  lead_stages: 6,
  leads: 30,
  multi_child_guardians: 1,
  open_follow_ups: 24,
  pending_duplicates: 1,
  roles: 6,
  seat_capacities: 9,
  students: 200,
};

for (const [key, value] of Object.entries(expected)) {
  if (counts?.[key] !== value) {
    throw new Error(`Expected ${key}=${value}, received ${counts?.[key] ?? "missing"}.`);
  }
}

const foreignKeyViolations = executeLocalQuery("PRAGMA foreign_key_check;")[0]?.results ?? [];
if (foreignKeyViolations.length > 0) {
  throw new Error(`Local D1 contains ${foreignKeyViolations.length} foreign-key violation(s).`);
}

console.log("Local D1 seed verification passed:", counts);
