SELECT jsonb_build_object(
    'institution', CAST(:admin AS boolean),
    'groups', coalesce((SELECT jsonb_agg(jsonb_build_object('id', id_group, 'name', group_name) ORDER BY group_name, id_group)
                        FROM visible_groups), '[]'),
    'students', coalesce((SELECT jsonb_agg(jsonb_build_object('id', s.student_id, 'name', s.name, 'grade', s.grade,
                              'groups', coalesce((SELECT jsonb_agg(m.id_group ORDER BY m.id_group)
                                                  FROM memberships m WHERE m.id_student = s.student_id), '[]'))
                              ORDER BY s.name, s.student_id) FROM roster s), '[]')
)
