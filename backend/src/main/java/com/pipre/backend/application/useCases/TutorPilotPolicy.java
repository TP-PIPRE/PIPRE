package com.pipre.backend.application.useCases;

import com.pipre.backend.application.ports.output.AcademicAccessRepositoryPort;
import com.pipre.backend.application.ports.output.ActivityRepositoryPort;
import com.pipre.backend.application.ports.output.TutorPilotAccessPort;
import com.pipre.backend.domain.entities.game.BoardRules;
import com.pipre.backend.domain.entities.game.GameSession;
import com.pipre.backend.domain.exceptions.BusinessException;
import com.pipre.backend.infrastructure.configuration.TutorPilotProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class TutorPilotPolicy {
    private final TutorPilotProperties properties;
    private final ActivityRepositoryPort activities;
    private final AcademicAccessRepositoryPort academicAccess;
    private final TutorPilotAccessPort access;

    Set<String> allowedGroups(GameSession session) {
        String activityId = session.activityId();
        if (activityId == null || session.dailyChallengeId() != null) return Set.of();

        Set<String> groups;
        String courseId;
        switch (session.game()) {
            case "neonflow" -> {
                if (!properties.isEnabled() || !properties.getAllowedActivityIds().contains(activityId)) return Set.of();
                groups = Set.copyOf(properties.getAllowedGroupIds());
                courseId = "c001";
            }
            case "tetrilogic" -> {
                var pilot = properties.getTetrilogic();
                if (!pilot.isEnabled() || !pilot.getAllowedActivityIds().contains(activityId)
                        || !activityId.equals("act-c002-" + session.levelNumber())
                        || !session.levelTemplate().equals("tetrilogic-v2-" + session.levelNumber())) return Set.of();
                groups = Set.copyOf(pilot.getAllowedGroupIds());
                courseId = "c002";
            }
            default -> { return Set.of(); }
        }
        if (groups.isEmpty() || !courseId.equals(academicAccess.activityCourse(activityId))) return Set.of();
        var activity = activities.findById(activityId).orElse(null);
        if (activity == null || !session.game().equals(activity.getEnvironment())) return Set.of();
        try {
            if (!session.levelTemplate().equals(BoardRules.canonicalTemplate(session.game(), activity.getLevelTemplate()))) return Set.of();
        } catch (BusinessException ignored) {
            return Set.of();
        }
        return access.isStudentAssignedToActivity(session.studentId(), activityId, groups) ? groups : Set.of();
    }
}
