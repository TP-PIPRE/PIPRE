package com.pipre.backend.application.commands;

import com.pipre.backend.application.dto.MissionDTO;
import com.pipre.backend.application.dto.PositionDTO;
import java.util.List;

public record CreateActivityCommand(
        String idLesson,
        String name,
        String complexity,
        String difficulty,
        Integer logicLevel,
        String type,
        String environment,
        List<MissionDTO> missions,
        PositionDTO startingPosition,
        PositionDTO targetPosition,
        String description,
        Integer displayOrder,
        String levelTemplate
) {
    // Compatibility for callers of the original application contract.
    public CreateActivityCommand(String idLesson, String name, String complexity, String difficulty,
            Integer logicLevel, String type, String environment, List<MissionDTO> missions,
            PositionDTO startingPosition, PositionDTO targetPosition) {
        this(idLesson, name, complexity, difficulty, logicLevel, type, environment, missions,
                startingPosition, targetPosition, null, null, null);
    }
}
