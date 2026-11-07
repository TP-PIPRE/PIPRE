package com.pipre.backend.application.ports.output;

import com.pipre.backend.application.dto.GroupDTO;
import java.util.List;

public interface AcademicAdministrationPort {
    record Assignment(String teacherId,String groupId,String courseId) {}
    List<Assignment> assignments();
    void lockGroup(String groupId);
    void teacherGroup(String teacherId,String groupId,boolean assigned);
    void teacherCourse(String teacherId,String courseId,boolean assigned);
    void groupCourse(String groupId,String courseId,boolean assigned);
    void groupActivity(String groupId,String activityId,boolean assigned);
    List<String> groupCourses(String groupId);
    List<String> groupActivities(String groupId);
    GroupDTO createGroup(String name,String description);
    void rankingVisibility(String visibility);
}
