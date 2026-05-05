CREATE TABLE help_requests (
    id_help_request VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36),
    times_requested INTEGER,
    ai_interactions INTEGER,
    requested_at TIMESTAMP,

    CONSTRAINT fk_help_request_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE
);

CREATE TABLE dropout_risks (
    id_risk VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36) REFERENCES users(id_user),
    days_inactive INT,
    performance VARCHAR(50),
    risk_level VARCHAR(50),
    motivation_level VARCHAR(50),
    analysis_date TIMESTAMP,

    CONSTRAINT fk_risk_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE
);