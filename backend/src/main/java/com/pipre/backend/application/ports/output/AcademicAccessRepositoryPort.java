package com.pipre.backend.application.ports.output;

import java.util.Set;

public interface AcademicAccessRepositoryPort {
    Set<String> teacherCourses(String teacherId);
    Set<String> teacherGroups(String teacherId);
    Set<String> studentGroups(String studentId);
    boolean sharesClassroom(String teacherId,String studentId);
    String activityCourse(String activityId);
    String lessonCourse(String lessonId);
    String moduleCourse(String moduleId);
    String studentRankingVisibility();
}
