package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.simulation.Simulation;
import com.pipre.backend.domain.entities.simulation.SimulationResult;

import java.util.UUID;

public class SimulationFactory {
    public static Simulation createNewSimulation(
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
            Integer predictedScore
    ) {
        return Simulation.builder()
                .idSimulation(UUID.randomUUID().toString())
                .result(SimulationResult.fromString(result))
                .idStudent(idStudent)
                .idActivity(idActivity)
                .blocklyCode(blocklyCode)
                .pseudocode(pseudocode)
                .pseintDiagram(pseintDiagram)
                .blocksUsage(blocksUsage)
                .codeUsage(codeUsage)
                .sensorError(sensorError)
                .resolutionTime(resolutionTime)
                .predictedScore(predictedScore)
                .build();
    }
}
