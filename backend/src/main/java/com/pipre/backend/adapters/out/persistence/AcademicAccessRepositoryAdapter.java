package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.ports.output.AcademicAccessRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class AcademicAccessRepositoryAdapter implements AcademicAccessRepositoryPort {
    private final JdbcTemplate jdbc;
    public Set<String> teacherCourses(String teacher) {
        return new HashSet<>(jdbc.queryForList("SELECT id_course FROM teacher_courses WHERE id_teacher=? UNION SELECT gc.id_course FROM group_courses gc JOIN teacher_groups tg ON gc.id_group=tg.id_group WHERE tg.id_teacher=?",String.class,teacher,teacher));
    }
    public Set<String> teacherGroups(String teacher) {return new HashSet<>(jdbc.queryForList("SELECT id_group FROM teacher_groups WHERE id_teacher=?",String.class,teacher));}
    public Set<String> studentGroups(String student) {return new HashSet<>(jdbc.queryForList("SELECT id_group FROM group_students WHERE id_student=?",String.class,student));}
    public boolean sharesClassroom(String teacher,String student) {
        return Boolean.TRUE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM teacher_groups tg JOIN group_students gs ON tg.id_group=gs.id_group WHERE tg.id_teacher=? AND gs.id_student=? AND EXISTS(SELECT 1 FROM user_role ur JOIN roles r ON r.id_role=ur.id_role WHERE ur.id_user=gs.id_student AND r.name='STUDENT') AND NOT EXISTS(SELECT 1 FROM user_role ur JOIN roles r ON r.id_role=ur.id_role WHERE ur.id_user=gs.id_student AND r.name IN ('ADMIN','TEACHER')))",Boolean.class,teacher,student));
    }
    public String activityCourse(String activity) {return one("SELECT m.id_course FROM activities a JOIN lessons l ON a.id_lesson=l.id_lesson JOIN modules m ON l.id_module=m.id_module WHERE a.id_activity=?",activity);}
    public String lessonCourse(String lesson) {return one("SELECT m.id_course FROM lessons l JOIN modules m ON l.id_module=m.id_module WHERE l.id_lesson=?",lesson);}
    public String moduleCourse(String module) {return one("SELECT id_course FROM modules WHERE id_module=?",module);}
    public String studentRankingVisibility() {return jdbc.queryForObject("SELECT student_visibility FROM ranking_settings WHERE setting_id=1",String.class);}
    private String one(String sql,String id) {return id==null?null:jdbc.queryForList(sql,String.class,id).stream().findFirst().orElse(null);}
}
