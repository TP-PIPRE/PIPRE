package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.Simulation;

import java.util.UUID;

public class SimulationFactory {
    public static Simulation createNewSimulation(
            String result,
            String idStudent,
            String idActivity
    ) {
        return Simulation.builder()
                .idSimulation(UUID.randomUUID().toString())
                .result(result)
                .idStudent(idStudent)
                .idActivity(idActivity)
                .build();
    }
}
