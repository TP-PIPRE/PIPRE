package com.pipre.backend.adapters.out.persistence;

import com.pipre.backend.application.dto.GroupDTO;
import com.pipre.backend.application.ports.output.AcademicAdministrationPort;
import com.pipre.backend.domain.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
@RequiredArgsConstructor
public class AcademicAdministrationAdapter implements AcademicAdministrationPort {
    private final JdbcTemplate jdbc;
    public List<Assignment> assignments() {
        var result=new ArrayList<>(jdbc.query("SELECT id_teacher,id_group FROM teacher_groups",(rs,row)->new Assignment(rs.getString(1),rs.getString(2),null)));
        result.addAll(jdbc.query("SELECT id_teacher,id_course FROM teacher_courses",(rs,row)->new Assignment(rs.getString(1),null,rs.getString(2))));
        result.addAll(jdbc.query("SELECT id_group,id_course FROM group_courses",(rs,row)->new Assignment(null,rs.getString(1),rs.getString(2))));return List.copyOf(result);
    }
    public void teacherGroup(String teacher,String group,boolean assigned) {lockGroup(group);bind("teacher_groups","id_teacher",teacher,"id_group",group,assigned);}
    public void teacherCourse(String teacher,String course,boolean assigned) {lockCourse(course);bind("teacher_courses","id_teacher",teacher,"id_course",course,assigned);}
    public void groupCourse(String group,String course,boolean assigned) {
        lockGroup(group);
        if(!assigned)jdbc.update("DELETE FROM group_activities WHERE id_group=? AND id_activity IN (SELECT a.id_activity FROM activities a JOIN lessons l ON l.id_lesson=a.id_lesson JOIN modules m ON m.id_module=l.id_module WHERE m.id_course=?)",group,course);
        bind("group_courses","id_group",group,"id_course",course,assigned);
    }
    public void groupActivity(String group,String activity,boolean assigned) {lockGroup(group);bind("group_activities","id_group",group,"id_activity",activity,assigned);}
    public List<String> groupCourses(String group) {return jdbc.queryForList("SELECT id_course FROM group_courses WHERE id_group=? ORDER BY id_course",String.class,group);}
    public List<String> groupActivities(String group) {return jdbc.queryForList("SELECT id_activity FROM group_activities WHERE id_group=? ORDER BY id_activity",String.class,group);}
    public GroupDTO createGroup(String name,String description) {
        String id=UUID.randomUUID().toString();jdbc.update("INSERT INTO groups(id_group,group_name,description) VALUES (?,?,?)",id,name,description);return new GroupDTO(id,name,description);
    }
    public void rankingVisibility(String visibility) {jdbc.update("UPDATE ranking_settings SET student_visibility=? WHERE setting_id=1",visibility);}
    public void lockGroup(String group) {if(jdbc.queryForList("SELECT id_group FROM groups WHERE id_group=? FOR UPDATE",String.class,group).isEmpty())throw new ResourceNotFoundException("El aula no existe.");}
    private void lockCourse(String course) {if(jdbc.queryForList("SELECT id_course FROM courses WHERE id_course=? FOR UPDATE",String.class,course).isEmpty())throw new ResourceNotFoundException("El curso no existe.");}
    private void bind(String table,String left,String a,String right,String b,boolean assigned) {
        // Identifiers are constants in the four methods above; all user values are parameters.
        if(!assigned){jdbc.update("DELETE FROM "+table+" WHERE "+left+"=? AND "+right+"=?",a,b);return;}
        if(jdbc.queryForObject("SELECT COUNT(*) FROM "+table+" WHERE "+left+"=? AND "+right+"=?",Integer.class,a,b)==0)
            jdbc.update("INSERT INTO "+table+"("+left+","+right+") VALUES (?,?)",a,b);
    }
}
