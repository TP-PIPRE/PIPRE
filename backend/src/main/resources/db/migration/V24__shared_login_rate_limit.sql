CREATE TABLE login_attempt_windows (
    key_hash VARCHAR(64) PRIMARY KEY,
    attempt_times TEXT NOT NULL,
    updated_at_ms BIGINT NOT NULL
);
CREATE INDEX idx_login_attempt_windows_expiry ON login_attempt_windows(updated_at_ms);
