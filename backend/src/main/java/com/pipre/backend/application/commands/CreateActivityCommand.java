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
        PositionDTO targetPosition
) {
}
