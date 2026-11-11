CREATE TABLE neonflow_tutor_requests (
    session_id VARCHAR(36) NOT NULL REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    request_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    template_id VARCHAR(40) NOT NULL,
    ordinal INTEGER NOT NULL CHECK (ordinal > 0),
    revision INTEGER NOT NULL CHECK (revision >= 0),
    accepted_penalty BOOLEAN NOT NULL,
    source VARCHAR(10) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL CHECK (expires_at >= started_at),
    status VARCHAR(10) NOT NULL,
    message TEXT,
    finished_at TIMESTAMP WITH TIME ZONE,
    pending_slot BOOLEAN,
    delivered_ordinal INTEGER,
    PRIMARY KEY (session_id, request_id),
    UNIQUE (student_id, template_id, pending_slot),
    UNIQUE (student_id, template_id, delivered_ordinal),
    CHECK ((ordinal <= 5 AND source = 'STATIC') OR (ordinal > 5 AND source = 'GENERATIVE')),
    CHECK (source = 'STATIC' OR expires_at > started_at),
    CHECK (accepted_penalty = (ordinal > 8)),
    CHECK (finished_at IS NULL OR finished_at >= started_at),
    CHECK (
        (status = 'PENDING' AND pending_slot IS NOT NULL AND pending_slot = TRUE
            AND delivered_ordinal IS NULL AND finished_at IS NULL AND message IS NULL)
        OR (status = 'DELIVERED' AND pending_slot IS NULL
            AND delivered_ordinal IS NOT NULL AND delivered_ordinal = ordinal
            AND finished_at IS NOT NULL AND message IS NOT NULL AND LENGTH(TRIM(message)) > 0)
        OR (status = 'FAILED' AND pending_slot IS NULL
            AND delivered_ordinal IS NULL AND finished_at IS NOT NULL AND message IS NULL)
    )
);
