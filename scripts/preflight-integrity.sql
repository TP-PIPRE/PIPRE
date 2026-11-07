-- Read-only preflight. Both queries must return zero rows before applying V25.
-- If duplicates exist, export/backup and agree their reconciliation. Do not auto-delete history.
SELECT id_group,id_student,COUNT(*) AS duplicate_count
FROM group_students WHERE id_group IS NOT NULL AND id_student IS NOT NULL
GROUP BY id_group,id_student HAVING COUNT(*)>1;
SELECT id_student,id_module,COUNT(*) AS duplicate_count
FROM module_progress WHERE id_student IS NOT NULL AND id_module IS NOT NULL
GROUP BY id_student,id_module HAVING COUNT(*)>1;
