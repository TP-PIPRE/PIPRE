package com.pipre.backend.application.dto;

import java.util.List;

public record ActivityDTO(
        String idActivity,
        String name,
        String idLesson,
        String complexity,
        String difficulty,
        Integer logicLevel,
        String type,
        String environment,
        PositionDTO startingPosition,
        PositionDTO targetPosition,
        List<MissionDTO> missions
) {
}
