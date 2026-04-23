CREATE TABLE help_requests (
    id_help_request UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_student UUID,
    times_requested INTEGER DEFAULT 0,
    ai_interactions INTEGER DEFAULT 0,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_help_request_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE
);

CREATE TABLE dropout_risks (
    id_risk UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_student UUID REFERENCES users(id_user),
    days_inactive INT,
    performance VARCHAR(50),
    risk_level VARCHAR(50),
    motivation_level VARCHAR(50),
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_risk_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE
);