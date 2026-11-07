package com.pipre.backend.infrastructure.security;

import com.pipre.backend.application.ports.output.AcademicAccessRepositoryPort;
import com.pipre.backend.application.ports.output.UserRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import java.util.Set;

/** Role claims select the operation; persisted assignments select its resources. */
@Component("academicAccess")
@RequiredArgsConstructor
public class AcademicAccessPolicy {
    private final AcademicAccessRepositoryPort assignments;
    private final UserRepositoryPort users;
    public boolean role(String name) {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        return auth!=null&&auth.isAuthenticated()&&auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_"+name));
    }
    public String currentId() {
        var auth=SecurityContextHolder.getContext().getAuthentication();
        return auth==null?null:users.findByEmail(auth.getName()).map(u->u.getIdUser()).orElse(null);
    }
    /** Null means unrestricted catalog reading; an empty set grants no teacher courses. */
    public Set<String> visibleCourses() {
        if(role("ADMIN")||studentPlayer())return null;
        String id=currentId();return role("TEACHER")&&id!=null?assignments.teacherCourses(id):Set.of();
    }
    public boolean studentPlayer() {return role("STUDENT")&&!role("TEACHER")&&!role("ADMIN");}
    public boolean readCourse(String course) {return role("ADMIN")||studentPlayer()||manageCourse(course);}
    public boolean manageCourse(String course) {
        if(role("ADMIN"))return true;
        String id=currentId();return course!=null&&role("TEACHER")&&id!=null&&assignments.teacherCourses(id).contains(course);
    }
    public boolean readGroup(String group) {
        if(role("ADMIN"))return true;
        String id=currentId();
        return id!=null&&(role("TEACHER")&&assignments.teacherGroups(id).contains(group)||studentPlayer()&&assignments.studentGroups(id).contains(group));
    }
    public Set<String> visibleGroups() {
        if(role("ADMIN"))return null;
        String id=currentId();if(id==null)return Set.of();
        return role("TEACHER")?assignments.teacherGroups(id):studentPlayer()?assignments.studentGroups(id):Set.of();
    }
    public boolean globalRanking() {return role("ADMIN")||studentPlayer()&&"GLOBAL".equals(assignments.studentRankingVisibility());}
    public boolean readStudent(String student) {
        if(role("ADMIN"))return true;
        String id=currentId();return id!=null&&(id.equals(student)||role("TEACHER")&&assignments.sharesClassroom(id,student));
    }
    public boolean readActivity(String activity) {return readCourse(assignments.activityCourse(activity));}
    public boolean readLesson(String lesson) {return readCourse(assignments.lessonCourse(lesson));}
    public boolean readModule(String module) {return readCourse(assignments.moduleCourse(module));}
    public boolean manageActivity(String activity) {return manageCourse(assignments.activityCourse(activity));}
    public boolean manageLesson(String lesson) {return manageCourse(assignments.lessonCourse(lesson));}
    public boolean manageModule(String module) {return manageCourse(assignments.moduleCourse(module));}
    public boolean rankGroup(String group) {
        if(role("ADMIN")||role("TEACHER"))return readGroup(group);
        return studentPlayer()&&!"HIDDEN".equals(assignments.studentRankingVisibility())
            &&readGroup(group);
    }
    public boolean rankCourse(String course) {return role("ADMIN")||role("TEACHER")&&manageCourse(course);}
}
