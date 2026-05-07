package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Simulation;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class SimulationFactory {
    public static Simulation createNewSimulation(
            Boolean isRandom,
            Integer blocksUsage,
            Integer codeUsage,
            BigDecimal sensorError,
            String blocklyCode,
            String pythonCode,
            Integer resolutionTime,
            String result,
            String idStudent,
            String idActivity
    ) {
        return new Simulation.Builder()
                .idSimulation(UUID.randomUUID().toString())
                .isRandom(isRandom)
                .blocksUsage(blocksUsage)
                .codeUsage(codeUsage)
                .sensorError(sensorError)
                .blocklyCode(blocklyCode)
                .pythonCode(pythonCode)
                .resolutionTime(resolutionTime)
                .result(result)
                .date(LocalDateTime.now())
                .idStudent(idStudent)
                .idActivity(idActivity)
                .build();
    }
}
