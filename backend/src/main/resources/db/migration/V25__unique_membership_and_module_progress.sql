-- Stop on historical duplicates; never choose a winner or delete/regrade history.
-- Run scripts/preflight-integrity.sql before upgrading an existing installation.
ALTER TABLE group_students ADD CONSTRAINT uk_group_student UNIQUE (id_group,id_student);
ALTER TABLE module_progress ADD CONSTRAINT uk_student_module_progress UNIQUE (id_student,id_module);
