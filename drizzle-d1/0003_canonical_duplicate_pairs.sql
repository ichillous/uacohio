CREATE UNIQUE INDEX `duplicate_candidates_canonical_pair_unique`
ON `duplicate_candidates` (
  CASE
    WHEN `lead_id` < `candidate_lead_id` THEN `lead_id`
    ELSE `candidate_lead_id`
  END,
  CASE
    WHEN `lead_id` < `candidate_lead_id` THEN `candidate_lead_id`
    ELSE `lead_id`
  END
);
