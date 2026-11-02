-- Read-only thesis export. Run with an authorized database account.
-- psql parameters: -v student_id=ID -v from_date=2026-11-01 -v to_date=2026-11-16
-- Dates are inclusive calendar dates in America/Lima, not UTC dates.
-- Prefer the authenticated profile/{student}/achievements/export endpoint for application use.
BEGIN TRANSACTION READ ONLY;

WITH window_dates AS (
    SELECT :'from_date'::date AS date_from, :'to_date'::date AS date_to
), limits AS (
    SELECT date_from::timestamp AT TIME ZONE 'America/Lima' AS lower_bound,
           (date_to + 1)::timestamp AT TIME ZONE 'America/Lima' AS upper_bound
    FROM window_dates WHERE date_from <= date_to
)
SELECT a.code, a.name,
       CASE WHEN p.id_player_achievement IS NULL THEN 0 ELSE 1 END AS unlocked_current,
       CASE WHEN p.unlocked_at_verified >= l.lower_bound
                  AND p.unlocked_at_verified < l.upper_bound THEN 1 ELSE 0 END AS unlocked_in_period,
       p.unlocked_at_verified AS verified_unlocked_at,
       count(p.id_player_achievement) OVER () AS unlocked_total,
       sum(CASE WHEN p.unlocked_at_verified >= l.lower_bound
                     AND p.unlocked_at_verified < l.upper_bound THEN 1 ELSE 0 END) OVER () AS new_in_period
FROM achievements a CROSS JOIN limits l
LEFT JOIN player_achievements p ON p.id_achievement = a.id_achievement AND p.id_student = :'student_id'
WHERE a.active AND a.code ~ '^L(0[1-9]|[12][0-9]|3[0-5])$'
ORDER BY a.code;

COMMIT;
