CREATE INDEX IF NOT EXISTS idx_game_session_hints_pending_revision
    ON game_session_hints(session_id, revision, consumed_at, created_at);
