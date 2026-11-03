-- PostgreSQL: inspection only. No names, emails, passwords or raw student IDs.
-- This is an audit sample, not a validated ML dataset or a mastery measure.
BEGIN TRANSACTION READ ONLY;

-- Keep legacy observations separate; NULL context cannot be reconstructed.
SELECT game, result, (trace_context IS NOT NULL) AS has_context, count(*) AS attempts
FROM telemetry_attempts GROUP BY game, result, has_context ORDER BY game, result, has_context;

-- Quality flags must accompany any future export. Missing activity is valid in standalone practice.
SELECT game, count(*) AS traced_attempts,
       count(*) FILTER (WHERE id_activity IS NULL) AS without_current_activity,
       count(*) FILTER (WHERE coalesce((trace_context->>'droppedEvents')::int,0)>0) AS truncated_attempts,
       count(*) FILTER (WHERE received_at IS NULL OR request_hash IS NULL) AS missing_receipt,
       count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id_user=t.id_student)) AS orphan_students
FROM telemetry_attempts t WHERE trace_context IS NOT NULL GROUP BY game;

-- Inspect action order/time and typed board changes. Outcomes deliberately omitted.
-- To build early predictors, retain only elapsedMs <= the prediction cutoff BEFORE aggregation.
SELECT t.id_attempt, t.game, t.trace_context->>'levelTemplate' AS template_id,
       t.trace_context->>'templateVersion' AS template_version,
       t.trace_context->>'ruleset' AS ruleset,
       e.value->>'sequence' AS sequence, e.value->>'elapsedMs' AS elapsed_ms,
       e.value->>'type' AS action, e.value->'data' AS action_data
FROM telemetry_attempts t
CROSS JOIN LATERAL jsonb_array_elements(t.trace_context->'events') AS e(value)
WHERE t.trace_context IS NOT NULL AND (t.trace_context->>'droppedEvents')::int=0
ORDER BY t.id_attempt, (e.value->>'sequence')::int LIMIT 100;

COMMIT;
