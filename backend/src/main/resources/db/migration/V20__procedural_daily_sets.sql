ALTER TABLE verified_game_victories ALTER COLUMN daily_challenge_id TYPE VARCHAR(36);

CREATE TABLE procedural_daily_sets (
    student_id VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    local_date DATE NOT NULL,
    generator_version VARCHAR(40) NOT NULL,
    PRIMARY KEY (student_id, local_date)
);
CREATE TABLE procedural_daily_challenges (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    local_date DATE NOT NULL,
    slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 5),
    game VARCHAR(20) NOT NULL CHECK (game IN ('neonflow','tetrilogic')),
    level_number INTEGER NOT NULL CHECK (level_number BETWEEN 1 AND 30),
    level_template VARCHAR(40) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    config TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    session_id VARCHAR(36),
    best_stars INTEGER NOT NULL DEFAULT 0 CHECK (best_stars BETWEEN 0 AND 3),
    UNIQUE(student_id, local_date, slot),
    FOREIGN KEY(student_id, local_date) REFERENCES procedural_daily_sets(student_id, local_date) ON DELETE CASCADE
);
