package com.pipre.backend.application.commands;

import com.pipre.backend.application.dto.MissionDTO;
import com.pipre.backend.application.dto.PositionDTO;
import java.util.List;

public record CreateSimulationCommand(
        String result,
        String idStudent,
        String idActivity,
        String blocklyCode,
        String pseudocode,
        String pseintDiagram,
        Integer blocksUsage,
        Integer codeUsage,
        Double sensorError,
        Integer resolutionTime,
        String environment,
        List<MissionDTO> missions,
        PositionDTO startingPosition,
        PositionDTO targetPosition
) {}
