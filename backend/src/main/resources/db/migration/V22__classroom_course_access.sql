-- Explicit assignments only: never infer ownership from old rankings or seed users.
CREATE TABLE teacher_groups (
    id_teacher VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    id_group VARCHAR(36) NOT NULL REFERENCES groups(id_group) ON DELETE CASCADE,
    PRIMARY KEY (id_teacher,id_group)
);
CREATE INDEX idx_teacher_groups_group ON teacher_groups(id_group);
CREATE TABLE teacher_courses (
    id_teacher VARCHAR(36) NOT NULL REFERENCES users(id_user) ON DELETE CASCADE,
    id_course VARCHAR(36) NOT NULL REFERENCES courses(id_course) ON DELETE CASCADE,
    PRIMARY KEY (id_teacher,id_course)
);
CREATE INDEX idx_teacher_courses_course ON teacher_courses(id_course);
CREATE TABLE group_courses (
    id_group VARCHAR(36) NOT NULL REFERENCES groups(id_group) ON DELETE CASCADE,
    id_course VARCHAR(36) NOT NULL REFERENCES courses(id_course) ON DELETE CASCADE,
    PRIMARY KEY (id_group,id_course)
);
CREATE INDEX idx_group_courses_course ON group_courses(id_course);
CREATE TABLE group_activities (
    id_group VARCHAR(36) NOT NULL REFERENCES groups(id_group) ON DELETE CASCADE,
    id_activity VARCHAR(36) NOT NULL REFERENCES activities(id_activity) ON DELETE CASCADE,
    PRIMARY KEY (id_group,id_activity)
);
CREATE INDEX idx_group_activities_activity ON group_activities(id_activity);
CREATE TABLE ranking_settings (
    setting_id INTEGER PRIMARY KEY CHECK (setting_id=1),
    student_visibility VARCHAR(20) NOT NULL CHECK (student_visibility IN ('HIDDEN','CLASSROOM','GLOBAL'))
);
INSERT INTO ranking_settings(setting_id,student_visibility) VALUES (1,'CLASSROOM');
