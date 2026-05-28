CREATE TABLE activity_results (
    id_result VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36),
    id_activity VARCHAR(36),
    attempts INTEGER,
    errors INTEGER,
    score DECIMAL(10,2),
    result_simulation VARCHAR(50),
    dateAttempted TIMESTAMP,

    CONSTRAINT fk_results_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_results_activity FOREIGN KEY (id_activity)
        REFERENCES activities(id_activity)
        ON DELETE CASCADE
);

CREATE TABLE module_progress (
    id_progress VARCHAR(36) PRIMARY KEY,
    id_student VARCHAR(36),
    id_module VARCHAR(36),
    percentage DECIMAL(5,2),
    status VARCHAR(50),
    updated_at TIMESTAMP,

    CONSTRAINT fk_progress_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE,

    CONSTRAINT fk_progress_module FOREIGN KEY (id_module)
        REFERENCES modules(id_module)
        ON DELETE CASCADE
);