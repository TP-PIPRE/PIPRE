package com.pipre.backend.application.ports.output;

import java.util.Set;

public interface TutorPilotAccessPort {
    boolean isStudentAssignedToActivity(String studentId, String activityId, Set<String> allowedGroupIds);
}
