package com.pipre.backend.application.dto;

import com.pipre.backend.domain.entities.activity.Activity;
import com.pipre.backend.domain.entities.activity.ActivityLevel;
import com.pipre.backend.domain.entities.activity.Mission;

import java.util.List;
import java.util.stream.Collectors;

public class ActivityDtoMapper {

    public static ActivityDTO toDTO(Activity activity) {
        if (activity == null) {
            return null;
        }

        PositionDTO startingPosition = null;
        if (activity.getStartX() != null || activity.getStartZ() != null) {
            startingPosition = new PositionDTO(activity.getStartX(), activity.getStartZ());
        }

        PositionDTO targetPosition = null;
        if (activity.getTargetX() != null || activity.getTargetZ() != null) {
            targetPosition = new PositionDTO(activity.getTargetX(), activity.getTargetZ());
        }

        List<MissionDTO> missions = null;
        if (activity.getMissions() != null) {
            missions = activity.getMissions().stream()
                    .map(ActivityDtoMapper::toMissionDTO)
                    .collect(Collectors.toList());
        }

        return new ActivityDTO(
                activity.getIdActivity(),
                activity.getName(),
                activity.getIdLesson(),
                activity.getComplexity(),
                activity.getDifficulty(),
                logicLevelToInt(activity.getLogicLevel()),
                activity.getType(),
                activity.getEnvironment(),
                startingPosition,
                targetPosition,
                missions
        );
    }

    public static MissionDTO toMissionDTO(Mission mission) {
        if (mission == null) {
            return null;
        }
        return new MissionDTO(
                mission.getId(),
                mission.getTitle(),
                mission.getObjective(),
                mission.getMaxBlocks()
        );
    }

    public static Mission toMissionDomain(MissionDTO dto) {
        if (dto == null) {
            return null;
        }
        return Mission.builder()
                .id(dto.id())
                .title(dto.title())
                .objective(dto.objective())
                .maxBlocks(dto.maxBlocks())
                .build();
    }

    public static ActivityLevel intToLogicLevel(Integer val) {
        if (val == null) {
            return ActivityLevel.MEDIUM;
        }
        return switch (val) {
            case 1 -> ActivityLevel.LOW;
            case 2 -> ActivityLevel.MEDIUM;
            case 3 -> ActivityLevel.HIGH;
            default -> ActivityLevel.MEDIUM;
        };
    }

    public static Integer logicLevelToInt(ActivityLevel level) {
        if (level == null) {
            return 2;
        }
        return switch (level) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
        };
    }
}
