, selection AS (
    SELECT CAST(:startAt AS timestamptz) AS start_at, CAST(:endAt AS timestamptz) AS end_at,
           CAST(:fromDay AS date) AS from_day, CAST(:toDay AS date) AS to_day,
           CAST(:bucket AS text) AS bucket,
           (:group = '' OR EXISTS (SELECT 1 FROM visible_groups WHERE id_group = :group))
           AND (:student = '' OR EXISTS (SELECT 1 FROM roster WHERE student_id = :student)) AS allowed
), cohort AS (
    SELECT r.* FROM roster r CROSS JOIN selection p
    WHERE p.allowed AND (:student = '' OR r.student_id = :student) AND (:grade = '' OR r.grade = :grade)
      AND (:group = '' OR EXISTS (SELECT 1 FROM memberships m WHERE m.id_student = r.student_id AND m.id_group = :group))
), window_sessions AS (
    SELECT s.session_id, s.student_id, s.game, s.level_number, s.level_template, s.daily_challenge_id,
           s.started_at, s.started_order, s.completed_at, p.start_at, p.end_at
    FROM game_sessions s JOIN cohort c USING (student_id) CROSS JOIN selection p
    WHERE s.started_at < p.end_at AND (s.completed_at IS NULL OR s.completed_at >= p.start_at)
      AND (:game = '' OR s.game = :game)
), started AS (
    SELECT s.*, CASE WHEN s.daily_challenge_id IS NULL THEN 'level:' || s.level_number
                     ELSE 'daily:' || s.daily_challenge_id END AS exercise,
           v.stars, extract(epoch FROM (v.completed_at - s.started_at)) AS solved_seconds,
           CASE WHEN s.completed_at < s.end_at THEN extract(epoch FROM (s.completed_at - s.started_at)) END AS closed_seconds,
           date_trunc(p.bucket, s.started_at AT TIME ZONE 'America/Lima')::date AS day
    FROM window_sessions s CROSS JOIN selection p
    LEFT JOIN verified_game_victories v ON v.session_id = s.session_id AND v.completed_at < s.end_at
    WHERE s.started_at >= s.start_at
), ranked AS (
    SELECT s.*, row_number() OVER (PARTITION BY student_id, game, exercise ORDER BY started_order) AS attempt
    FROM started s
), exercises AS (
    SELECT student_id, game, exercise, min(attempt) FILTER (WHERE stars IS NOT NULL) AS attempts_to_solve
    FROM ranked GROUP BY student_id, game, exercise
), exercise_counts AS (
    SELECT student_id, game, count(*) AS initiated, count(attempts_to_solve) AS completed,
           sum(attempts_to_solve) AS attempts_to_solve
    FROM exercises GROUP BY student_id, game
), session_counts AS (
    SELECT student_id, game, count(*) AS sessions, count(stars) AS successful_sessions,
           count(closed_seconds) AS closed_sessions, sum(closed_seconds) AS closed_seconds
    FROM started GROUP BY student_id, game
), actions AS (
    SELECT s.student_id, s.game, a.session_id, a.received_at, a.payload->>'type' AS action_type,
           a.payload->>'source' AS action_source, a.payload->>'hintId' AS hint_id,
           a.response->'state'->>'lastActionRejected' AS rejected
    FROM window_sessions s JOIN game_session_actions a USING (session_id)
    WHERE a.received_at >= s.start_at AND a.received_at < s.end_at
), activity_days AS (
    SELECT student_id, game, (started_at AT TIME ZONE 'America/Lima')::date AS day FROM started
    UNION
    SELECT student_id, game, (received_at AT TIME ZONE 'America/Lima')::date FROM actions
    UNION
    SELECT s.student_id, s.game, (v.completed_at AT TIME ZONE 'America/Lima')::date
    FROM window_sessions s JOIN verified_game_victories v USING (session_id)
    WHERE v.completed_at >= s.start_at AND v.completed_at < s.end_at
), student_days AS (
    SELECT student_id, count(DISTINCT day) AS days FROM activity_days GROUP BY student_id
), verified_levels AS (
    SELECT v.student_id, v.game, v.level_number, max(v.stars) FILTER (WHERE v.completed_at >= p.start_at) AS period_stars
    FROM verified_game_victories v JOIN cohort c USING (student_id) CROSS JOIN selection p
    WHERE v.completed_at < p.end_at AND coalesce(length(v.daily_challenge_id), 0) <> 36
      AND (:game = '' OR v.game = :game)
    GROUP BY v.student_id, v.game, v.level_number
), level_counts AS (
    SELECT student_id, game, count(*) AS levels, count(period_stars) AS period_levels, sum(period_stars) AS stars
    FROM verified_levels GROUP BY student_id, game
), achievements AS (
    SELECT l.student_id, count(*) AS unlocked FROM achievement_xp_ledger l
    JOIN cohort c USING (student_id) CROSS JOIN selection p
    WHERE l.awarded_at >= p.start_at AND l.awarded_at < p.end_at GROUP BY l.student_id
), help_events AS (
    SELECT s.student_id, h.session_id, h.source, h.delivered_ordinal > 8 AS extra
    FROM window_sessions s JOIN neonflow_tutor_requests h USING (session_id)
    WHERE h.status = 'DELIVERED' AND h.finished_at >= s.start_at AND h.finished_at < s.end_at
    UNION ALL
    SELECT s.student_id, h.session_id, h.source, FALSE
    FROM window_sessions s JOIN game_session_hints h USING (session_id)
    WHERE h.consumed_at >= s.start_at AND h.consumed_at < s.end_at
    UNION ALL
    SELECT student_id, session_id, coalesce(action_source, 'UNCLASSIFIED'), FALSE FROM actions
    WHERE action_type = 'HELP' AND hint_id IS NULL AND rejected = 'false'
), student_help AS (
    SELECT student_id, count(*) AS total,
           count(*) FILTER (WHERE source = 'STATIC') AS fixed,
           count(*) FILTER (WHERE source = 'GENERATIVE') AS generated,
           count(*) FILTER (WHERE source = 'RULE_BASED') AS contextual,
           count(*) FILTER (WHERE source NOT IN ('STATIC','GENERATIVE','RULE_BASED')) AS unclassified,
           count(*) FILTER (WHERE extra) AS extra
    FROM help_events GROUP BY student_id
), game_catalog(game, name) AS (
    VALUES ('neonflow','Neon Flow'), ('tetrilogic','TetriLogic')
), selected_games AS (
    SELECT * FROM game_catalog WHERE :game = '' OR game = :game
), per_game AS (
    SELECT c.student_id, g.game, g.name AS course,
           coalesce(s.sessions, 0) AS sessions, coalesce(s.closed_sessions, 0) AS closed_sessions,
           coalesce(s.closed_seconds, 0) AS closed_seconds, coalesce(s.successful_sessions, 0) AS successful_sessions,
           coalesce(e.initiated, 0) AS initiated, coalesce(e.completed, 0) AS completed,
           coalesce(e.attempts_to_solve, 0) AS attempts_to_solve,
           coalesce(l.levels, 0) AS levels, coalesce(l.period_levels, 0) AS period_levels, coalesce(l.stars, 0) AS stars
    FROM cohort c CROSS JOIN selected_games g
    LEFT JOIN session_counts s ON s.student_id = c.student_id AND s.game = g.game
    LEFT JOIN exercise_counts e ON e.student_id = c.student_id AND e.game = g.game
    LEFT JOIN level_counts l ON l.student_id = c.student_id AND l.game = g.game
), student_totals AS (
    SELECT student_id, sum(sessions) AS sessions, sum(closed_sessions) AS closed_sessions,
           sum(closed_seconds) AS closed_seconds, sum(successful_sessions) AS successful_sessions,
           sum(initiated) AS initiated, sum(completed) AS completed, sum(attempts_to_solve) AS attempts_to_solve,
           sum(levels) AS levels, sum(period_levels) AS period_levels, sum(stars) AS stars,
           coalesce(max(levels) FILTER (WHERE game = 'neonflow'), 0) AS neonflow_levels,
           coalesce(max(levels) FILTER (WHERE game = 'tetrilogic'), 0) AS tetrilogic_levels
    FROM per_game GROUP BY student_id
), student_rows AS (
    SELECT t.*, c.name, c.grade, coalesce(d.days, 0) AS days, coalesce(a.unlocked, 0) AS unlocked,
           coalesce(h.total, 0) AS advice, coalesce(h.generated, 0) AS generated,
           coalesce(h.fixed, 0) AS fixed, coalesce(h.extra, 0) AS extra,
           coalesce(h.contextual, 0) AS contextual, coalesce(h.unclassified, 0) AS unclassified
    FROM student_totals t JOIN cohort c USING (student_id)
    LEFT JOIN student_days d USING (student_id) LEFT JOIN achievements a USING (student_id)
    LEFT JOIN student_help h USING (student_id)
), comparison_members AS (
    SELECT 'classroom' AS kind, m.id_group AS id, g.group_name AS name, r.days, r.stars, r.unlocked, r.completed, r.initiated
    FROM student_rows r JOIN memberships m ON m.id_student = r.student_id JOIN visible_groups g USING (id_group)
    WHERE :group = '' OR m.id_group = :group
    UNION ALL
    SELECT 'grade', r.grade, coalesce(nullif(r.grade,''), 'Sin grado registrado'), r.days, r.stars, r.unlocked, r.completed, r.initiated
    FROM student_rows r
), comparisons AS (
    SELECT kind, id, name, count(*) AS students, count(*) FILTER (WHERE days > 0) AS active,
           sum(stars) AS stars, avg(stars) AS average_stars, sum(unlocked) AS achievements,
           avg(unlocked) AS average_achievements, sum(completed) AS completed, sum(initiated) AS initiated,
           100.0 * sum(completed) / nullif(sum(initiated), 0) AS completion_rate
    FROM comparison_members GROUP BY kind, id, name
), by_course AS (
    SELECT g.game, g.name, coalesce(sum(s.sessions), 0) AS sessions,
           coalesce(sum(s.initiated), 0) AS initiated, coalesce(sum(s.completed), 0) AS completed,
           count(*) FILTER (WHERE s.levels > 0) AS students_with_progress,
           count(*) FILTER (WHERE a.student_id IS NOT NULL) AS active,
           100.0 * sum(s.levels) / nullif(30 * count(s.student_id), 0) AS progress
    FROM selected_games g LEFT JOIN per_game s USING (game)
    LEFT JOIN (SELECT DISTINCT student_id, game FROM activity_days) a ON a.student_id = s.student_id AND a.game = g.game
    GROUP BY g.game, g.name
), period_starts AS (
    SELECT day, game, count(*) AS sessions, count(stars) AS solved FROM started GROUP BY day, game
), period_active AS (
    SELECT date_trunc(p.bucket, day::timestamp)::date AS day, game, count(DISTINCT student_id) AS active
    FROM activity_days CROSS JOIN selection p GROUP BY 1, game
), timeline AS (
    SELECT coalesce(s.day, a.day) AS day, coalesce(s.game, a.game) AS game,
           coalesce(s.sessions, 0) AS sessions, coalesce(s.solved, 0) AS solved, coalesce(a.active, 0) AS active
    FROM period_starts s FULL JOIN period_active a USING (day, game)
), classified AS (
    SELECT s.*, coalesce(t.config->>'cognitiveDimension', n.config->>'cognitiveDimension') AS dimension
    FROM started s LEFT JOIN tetrilogic_templates t ON t.template_id = s.level_template
    LEFT JOIN neonflow_templates n ON n.template_id = s.level_template
    WHERE s.daily_challenge_id IS NULL
), dimensions(dimension) AS (
    VALUES ('Análisis lógico'), ('Resolución de problemas'), ('Reconocimiento de patrones')
), dimension_attempts AS (
    SELECT s.*, row_number() OVER (PARTITION BY student_id, game, exercise, dimension ORDER BY started_order) AS attempt
    FROM classified s JOIN dimensions USING (dimension)
), dimension_exercises AS (
    SELECT dimension, student_id, game, exercise, min(attempt) FILTER (WHERE stars IS NOT NULL) AS attempts_to_solve,
           max(stars) AS best_stars
    FROM dimension_attempts GROUP BY dimension, student_id, game, exercise
), dimension_durations AS (
    SELECT dimension, avg(solved_seconds) AS average_seconds FROM dimension_attempts GROUP BY dimension
), dimension_summary AS (
    SELECT d.dimension, count(e.student_id) AS initiated, count(e.attempts_to_solve) AS solved,
           100.0 * count(e.attempts_to_solve) / nullif(count(e.student_id), 0) AS completion_rate,
           avg(e.attempts_to_solve) AS average_attempts, avg(e.best_stars) AS average_stars,
           1.0 * count(e.attempts_to_solve) / nullif(count(DISTINCT e.student_id), 0) AS solved_per_student,
           max(t.average_seconds) AS average_seconds
    FROM dimensions d LEFT JOIN dimension_exercises e USING (dimension)
    LEFT JOIN dimension_durations t USING (dimension) GROUP BY d.dimension
), dimension_timeline AS (
    SELECT dimension, day, count(*) AS sessions, count(stars) AS solved,
           100.0 * count(stars) / count(*) AS completion_rate
    FROM dimension_attempts GROUP BY dimension, day
), dimension_members AS (
    SELECT 'classroom' AS kind, g.id_group AS id, g.group_name AS name, e.dimension, e.attempts_to_solve, e.best_stars
    FROM dimension_exercises e JOIN memberships m ON m.id_student = e.student_id JOIN visible_groups g USING (id_group)
    WHERE :group = '' OR m.id_group = :group
    UNION ALL
    SELECT 'grade', c.grade, coalesce(nullif(c.grade,''), 'Sin grado registrado'), e.dimension, e.attempts_to_solve, e.best_stars
    FROM dimension_exercises e JOIN cohort c USING (student_id)
), dimension_comparisons AS (
    SELECT kind, id, name, dimension, count(*) AS initiated, count(attempts_to_solve) AS solved,
           100.0 * count(attempts_to_solve) / count(*) AS completion_rate,
           avg(attempts_to_solve) AS average_attempts, avg(best_stars) AS average_stars
    FROM dimension_members GROUP BY kind, id, name, dimension
), victory_help AS (
    SELECT (h.session_id IS NOT NULL) AS with_advice, count(*) AS victories, avg(v.stars) AS average_stars
    FROM window_sessions s JOIN verified_game_victories v USING (session_id)
    LEFT JOIN (SELECT DISTINCT session_id FROM help_events) h USING (session_id)
    WHERE v.completed_at >= s.start_at AND v.completed_at < s.end_at GROUP BY 1
)
SELECT jsonb_build_object('allowed', p.allowed, 'report', jsonb_build_object(
    'from', p.from_day, 'to', p.to_day, 'bucket', p.bucket,
    'summary', (SELECT jsonb_build_object(
        'students', count(*), 'active', count(*) FILTER (WHERE days > 0),
        'stars', coalesce(sum(stars),0), 'averageStars', avg(stars),
        'achievements', coalesce(sum(unlocked),0), 'averageAchievements', avg(unlocked),
        'initiated', coalesce(sum(initiated),0), 'completed', coalesce(sum(completed),0),
        'completionRate', 100.0 * sum(completed) / nullif(sum(initiated),0),
        'averageAttempts', sum(attempts_to_solve) / nullif(sum(completed),0),
        'sessions', coalesce(sum(sessions),0), 'successfulSessions', coalesce(sum(successful_sessions),0),
        'averageSessionSeconds', sum(closed_seconds) / nullif(sum(closed_sessions),0),
        'studentsWithProgress', count(*) FILTER (WHERE levels > 0),
        'studentsCompletingInPeriod', count(*) FILTER (WHERE period_levels > 0),
        'completedStudentRate', 100.0 * count(*) FILTER (WHERE period_levels > 0) / nullif(count(*),0),
        'averageActiveDays', avg(days)
    ) FROM student_rows),
    'students', coalesce((SELECT jsonb_agg(jsonb_build_object(
        'id', student_id, 'name', name, 'grade', grade, 'days', days, 'stars', stars, 'achievements', unlocked,
        'sessions', sessions, 'initiated', initiated, 'completed', completed, 'advice', advice,
        'completionRate', 100.0 * completed / nullif(initiated,0),
        'averageAttempts', attempts_to_solve / nullif(completed,0),
        'averageSessionSeconds', closed_seconds / nullif(closed_sessions,0),
        'neonflowLevels', neonflow_levels, 'tetrilogicLevels', tetrilogic_levels
    ) ORDER BY name, student_id) FROM student_rows), '[]'),
    'comparisons', coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY kind, name, id) FROM comparisons c), '[]'),
    'courses', coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY game) FROM by_course c), '[]'),
    'timeline', coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY day, game) FROM timeline t), '[]'),
    'dimensions', (SELECT jsonb_agg(to_jsonb(d) || jsonb_build_object('timeline', coalesce((
        SELECT jsonb_agg(to_jsonb(t) - 'dimension' ORDER BY day) FROM dimension_timeline t WHERE t.dimension = d.dimension
    ), '[]'), 'comparisons', coalesce((SELECT jsonb_agg(to_jsonb(c) - 'dimension' ORDER BY kind, name, id)
        FROM dimension_comparisons c WHERE c.dimension = d.dimension), '[]')) ORDER BY dimension) FROM dimension_summary d),
    'unclassifiedAttempts', (SELECT count(*) FROM classified c WHERE NOT EXISTS (SELECT 1 FROM dimensions d WHERE d.dimension = c.dimension)),
    'tutor', (SELECT jsonb_build_object(
        'total', coalesce(sum(advice),0), 'average', avg(advice), 'fixed', coalesce(sum(fixed),0),
        'generated', coalesce(sum(generated),0), 'contextual', coalesce(sum(contextual),0),
        'unclassified', coalesce(sum(unclassified),0), 'extra', coalesce(sum(extra),0),
        'studentsUsingAi', count(*) FILTER (WHERE generated > 0),
        'aiStudentRate', 100.0 * count(*) FILTER (WHERE generated > 0) / nullif(count(*),0),
        'studentsOverFreeLimit', count(*) FILTER (WHERE extra > 0),
        'victories', coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY with_advice) FROM victory_help v), '[]')
    ) FROM student_rows),
    'starDistribution', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY stars) FROM (
        SELECT period_stars AS stars, count(*) AS count FROM verified_levels WHERE period_stars IS NOT NULL GROUP BY period_stars
    ) d), '[]'),
    'achievementDistribution', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY achievements) FROM (
        SELECT unlocked AS achievements, count(*) AS count FROM student_rows GROUP BY unlocked
    ) d), '[]')
)) FROM selection p
