package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.ports.output.TutorPilotAccessPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class TutorPilotAccessAdapter implements TutorPilotAccessPort {
    private final JdbcTemplate jdbc;

    @Override
    public boolean isStudentAssignedToActivity(String studentId, String activityId, Set<String> allowedGroupIds) {
        StringBuilder sql = new StringBuilder("""
                SELECT EXISTS(
                    SELECT 1
                    FROM group_students gs
                    JOIN group_courses gc ON gc.id_group=gs.id_group
                    JOIN group_activities ga ON ga.id_group=gs.id_group AND ga.id_activity=?
                    JOIN activities a ON a.id_activity=ga.id_activity
                    JOIN lessons l ON l.id_lesson=a.id_lesson
                    JOIN modules m ON m.id_module=l.id_module AND m.id_course=gc.id_course
                    WHERE gs.id_student=?
                """);
        ArrayList<Object> args = new ArrayList<>(List.of(activityId, studentId));
        if (!allowedGroupIds.isEmpty()) {
            sql.append(" AND gc.id_group IN (")
                    .append(allowedGroupIds.stream().map(value -> "?").collect(Collectors.joining(",")))
                    .append(")");
            args.addAll(allowedGroupIds);
        }
        sql.append(")");
        Boolean result = jdbc.queryForObject(sql.toString(), Boolean.class, args.toArray());
        return Boolean.TRUE.equals(result);
    }
}
