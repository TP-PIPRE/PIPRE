-- Scores are new server-verified results. Do not reinterpret historical client scores or old XP.
CREATE TABLE game_best_scores (
    student_id VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    exercise_key VARCHAR(80) NOT NULL,
    game VARCHAR(20) NOT NULL CHECK (game IN ('neonflow','tetrilogic')),
    level_template VARCHAR(40) NOT NULL,
    daily_challenge_id VARCHAR(36),
    best_points INTEGER NOT NULL CHECK (best_points BETWEEN 50 AND 100),
    session_id VARCHAR(36) NOT NULL REFERENCES verified_game_victories(session_id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(student_id,exercise_key)
);
CREATE TABLE game_score_receipts (
    session_id VARCHAR(36) PRIMARY KEY REFERENCES verified_game_victories(session_id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points BETWEEN 50 AND 100),
    best_points INTEGER NOT NULL CHECK (best_points BETWEEN 50 AND 100),
    points_gained INTEGER NOT NULL CHECK (points_gained BETWEEN 0 AND 100),
    total_points BIGINT NOT NULL CHECK (total_points>=0),
    daily_xp_awarded INTEGER NOT NULL CHECK (daily_xp_awarded IN (0,50)),
    duration_ms BIGINT NOT NULL CHECK (duration_ms>=0),
    moves INTEGER NOT NULL CHECK (moves>=0),
    reference_moves INTEGER NOT NULL CHECK (reference_moves>0),
    score_version VARCHAR(30) NOT NULL
);
CREATE TABLE daily_xp_ledger (
    student_id VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    local_date DATE NOT NULL,
    session_id VARCHAR(36) NOT NULL REFERENCES verified_game_victories(session_id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount=50),
    awarded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY(student_id,local_date),
    CONSTRAINT fk_daily_xp_completion FOREIGN KEY(student_id,local_date) REFERENCES daily_challenge_completions(student_id,local_date) ON DELETE CASCADE
);
