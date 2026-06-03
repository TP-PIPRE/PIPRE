package com.pipre.backend.domain.entities;

public class Simulation {

    private final String idSimulation;
    private final String result;
    private final String idStudent;
    private final String idActivity;

    Simulation(String idSimulation, String result, String idStudent, String idActivity) {
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

    public String getResult() {
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
        private String result;
        private String idStudent;
        private String idActivity;

        SimulationBuilder() {
        }

        public SimulationBuilder idSimulation(String idSimulation) {
            this.idSimulation = idSimulation;
            return this;
        }

        public SimulationBuilder result(String result) {
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
