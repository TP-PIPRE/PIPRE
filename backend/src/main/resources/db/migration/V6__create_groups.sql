CREATE TABLE groups (
    id_group UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_teacher UUID,
    group_name VARCHAR(255) NOT NULL,
    grade VARCHAR(50),
    section VARCHAR(50),

    CONSTRAINT fk_groups_teacher FOREIGN KEY (id_teacher)
        REFERENCES users(id_user)
        ON DELETE SET NULL
);

CREATE TABLE group_students (
    id_ranking UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_group UUID,
    id_student UUID,
    total_points INTEGER DEFAULT 0,
    position INTEGER,

    CONSTRAINT fk_group_students_group FOREIGN KEY (id_group)
        REFERENCES groups(id_group)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_students_student FOREIGN KEY (id_student)
        REFERENCES users(id_user)
        ON DELETE CASCADE
);