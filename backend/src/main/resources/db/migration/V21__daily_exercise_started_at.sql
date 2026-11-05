ALTER TABLE procedural_daily_challenges ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
UPDATE procedural_daily_challenges c SET started_at=(
    SELECT MIN(s.started_at) FROM game_sessions s
    WHERE s.daily_challenge_id=c.id AND s.student_id=c.student_id
);
