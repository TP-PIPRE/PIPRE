CREATE TABLE activity_results (
    id_result UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_student UUID,
    id_activity UUID,
    attempts INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    done_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_results_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_results_activity FOREIGN KEY (id_activity)
        REFERENCES activities(id_activity)
        ON DELETE CASCADE
);

CREATE TABLE module_progress (
    id_progress UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_student UUID,
    id_module UUID,
    percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_progress_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_progress_module FOREIGN KEY (id_module)
        REFERENCES modules(id_module)
        ON DELETE CASCADE
);