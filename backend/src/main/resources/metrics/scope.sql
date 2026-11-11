WITH visible_groups AS (
    SELECT g.id_group, g.group_name FROM groups g
    WHERE :admin OR EXISTS (
        SELECT 1 FROM teacher_groups tg WHERE tg.id_teacher = :actor AND tg.id_group = g.id_group
    )
), memberships AS (
    SELECT DISTINCT gs.id_student, gs.id_group FROM group_students gs
    JOIN visible_groups g USING (id_group)
), roster AS (
    SELECT u.id_user AS student_id, concat_ws(' ', u.first_name, u.last_name) AS name,
           coalesce(nullif(trim(u.grade), ''), '') AS grade
    FROM users u
    WHERE u.is_active = TRUE
      AND (:admin OR EXISTS (SELECT 1 FROM memberships m WHERE m.id_student = u.id_user))
      AND EXISTS (SELECT 1 FROM user_role ur JOIN roles r USING (id_role)
                  WHERE ur.id_user = u.id_user AND r.name = 'STUDENT')
      AND NOT EXISTS (SELECT 1 FROM user_role ur JOIN roles r USING (id_role)
                      WHERE ur.id_user = u.id_user AND r.name IN ('TEACHER','ADMIN'))
)
