UPDATE `attendance_daily`
SET `status` = CASE
    WHEN `status` = 'absent' THEN 'absent_excused'
    WHEN `status` = 'tardy' THEN 'tardy_unexcused'
    ELSE `status`
  END,
  `absence_type` = CASE
    WHEN `status` = 'absent' THEN 'excused'
    WHEN `status` = 'tardy' THEN 'unexcused'
    ELSE `absence_type`
  END;
--> statement-breakpoint

UPDATE `students`
SET `emis_student_id` = printf('%09d', 100000000 + CAST(substr(`id`, -3) AS integer)),
  `local_use_id` = 'L' || printf('%08d', CAST(substr(`id`, -3) AS integer)),
  `ssid` = printf('%09d', 200000000 + CAST(substr(`id`, -3) AS integer))
WHERE length(`emis_student_id`) <> 9
  OR (`local_use_id` IS NOT NULL AND length(`local_use_id`) <> 9)
  OR (`ssid` IS NOT NULL AND length(`ssid`) <> 9);
--> statement-breakpoint

CREATE TRIGGER `students_identifier_width_insert`
BEFORE INSERT ON `students`
WHEN length(NEW.`emis_student_id`) <> 9
  OR (NEW.`local_use_id` IS NOT NULL AND length(NEW.`local_use_id`) <> 9)
  OR (NEW.`ssid` IS NOT NULL AND length(NEW.`ssid`) <> 9)
BEGIN
  SELECT RAISE(ABORT, 'student identifiers must be nine characters');
END;
--> statement-breakpoint

CREATE TRIGGER `students_identifier_width_update`
BEFORE UPDATE OF `emis_student_id`, `local_use_id`, `ssid` ON `students`
WHEN length(NEW.`emis_student_id`) <> 9
  OR (NEW.`local_use_id` IS NOT NULL AND length(NEW.`local_use_id`) <> 9)
  OR (NEW.`ssid` IS NOT NULL AND length(NEW.`ssid`) <> 9)
BEGIN
  SELECT RAISE(ABORT, 'student identifiers must be nine characters');
END;
--> statement-breakpoint

CREATE TRIGGER `attendance_vocabulary_insert`
BEFORE INSERT ON `attendance_daily`
WHEN NEW.`status` NOT IN (
    'present',
    'absent_excused',
    'absent_unexcused',
    'tardy_excused',
    'tardy_unexcused',
    'partial'
  )
  OR NEW.`absence_type` NOT IN ('none', 'excused', 'unexcused')
BEGIN
  SELECT RAISE(ABORT, 'invalid attendance vocabulary');
END;
--> statement-breakpoint

CREATE TRIGGER `attendance_vocabulary_update`
BEFORE UPDATE OF `status`, `absence_type` ON `attendance_daily`
WHEN NEW.`status` NOT IN (
    'present',
    'absent_excused',
    'absent_unexcused',
    'tardy_excused',
    'tardy_unexcused',
    'partial'
  )
  OR NEW.`absence_type` NOT IN ('none', 'excused', 'unexcused')
BEGIN
  SELECT RAISE(ABORT, 'invalid attendance vocabulary');
END;
