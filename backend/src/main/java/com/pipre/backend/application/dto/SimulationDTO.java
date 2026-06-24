package com.pipre.backend.application.dto;

import java.util.List;

public record SimulationDTO(
        String idSimulation,
        UserDTO student,
        ActivitySummaryDTO activity,
        String environment,
        List<MissionDTO> missions,
        PositionDTO startingPosition,
        PositionDTO targetPosition,
        String result,
        Integer predictedScore
) {}
