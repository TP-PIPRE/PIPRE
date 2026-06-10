package com.pipre.backend.domain.entities.simulation;

import com.pipre.backend.domain.exceptions.BusinessException;

public class Simulation {

    private final String idSimulation;
    private final SimulationResult result;
    private final String idStudent;
    private final String idActivity;

    Simulation(String idSimulation, SimulationResult result, String idStudent, String idActivity) {
        if (idSimulation == null || idSimulation.isBlank()) {
            throw new BusinessException("El ID de simulación es obligatorio.");
        }
        if (result == null) {
            throw new BusinessException("El resultado de la simulación es obligatorio.");
        }
        if (idStudent == null || idStudent.isBlank()) {
            throw new BusinessException("El ID de estudiante es obligatorio.");
        }
        if (idActivity == null || idActivity.isBlank()) {
            throw new BusinessException("El ID de actividad es obligatorio.");
        }
        this.idSimulation = idSimulation;
        this.result = result;
        this.idStudent = idStudent;
        this.idActivity = idActivity;
    }

    public static SimulationBuilder builder() {
        return new SimulationBuilder();
    }

    public String getIdSimulation() {
        return this.idSimulation;
    }

    public SimulationResult getResult() {
        return this.result;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public String getIdActivity() {
        return this.idActivity;
    }

    public static class SimulationBuilder {
        private String idSimulation;
        private SimulationResult result;
        private String idStudent;
        private String idActivity;

        SimulationBuilder() {
        }

        public SimulationBuilder idSimulation(String idSimulation) {
            this.idSimulation = idSimulation;
            return this;
        }

        public SimulationBuilder result(SimulationResult result) {
            this.result = result;
            return this;
        }

        public SimulationBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public SimulationBuilder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public Simulation build() {
            return new Simulation(this.idSimulation, this.result, this.idStudent, this.idActivity);
        }

        public String toString() {
            return "Simulation.SimulationBuilder(idSimulation=" + this.idSimulation + ", result=" + this.result + ", idStudent=" + this.idStudent + ", idActivity=" + this.idActivity + ")";
        }
    }
}
