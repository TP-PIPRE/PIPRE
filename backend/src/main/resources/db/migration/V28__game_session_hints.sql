CREATE TABLE game_session_hints (
    hint_id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    request_id VARCHAR(36) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    diagnosis_key VARCHAR(80) NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 0),
    locale VARCHAR(10) NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('RULE_BASED','GENERATIVE','STATIC')),
    hint_level INTEGER NOT NULL CHECK (hint_level BETWEEN 1 AND 3),
    hint_type VARCHAR(40) NOT NULL,
    message TEXT NOT NULL,
    target_x INTEGER,
    target_y INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    consumed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (session_id, request_id)
);
CREATE INDEX idx_game_session_hints_consumed ON game_session_hints(session_id, consumed_at);
