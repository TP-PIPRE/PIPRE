CREATE TABLE groups (
    id_group VARCHAR(36) PRIMARY KEY,
    id_teacher VARCHAR(36),
    group_name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    section VARCHAR(50),

    CONSTRAINT fk_groups_teacher FOREIGN KEY (id_teacher)
        REFERENCES users(id_user)
        ON DELETE SET NULL
);

CREATE TABLE group_students (
    id_ranking VARCHAR(36) PRIMARY KEY,
    id_group VARCHAR(36),
    id_student VARCHAR(36),
    total_points INTEGER,
    position INTEGER,

    CONSTRAINT fk_group_students_group FOREIGN KEY (id_group)
        REFERENCES groups(id_group)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_students_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE
);