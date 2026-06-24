package com.pipre.backend.domain.entities.simulation;

import com.pipre.backend.domain.exceptions.BusinessException;

public class Simulation {

    private final String idSimulation;
    private final SimulationResult result;
    private final String idStudent;
    private final String idActivity;
    private final String blocklyCode;
    private final String pseudocode;
    private final String pseintDiagram;
    private final Integer blocksUsage;
    private final Integer codeUsage;
    private final Double sensorError;
    private final Integer resolutionTime;
    private final Integer predictedScore;

    Simulation(String idSimulation, SimulationResult result, String idStudent, String idActivity,
               String blocklyCode, String pseudocode, String pseintDiagram, Integer blocksUsage,
               Integer codeUsage, Double sensorError, Integer resolutionTime, Integer predictedScore) {
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
        if (blocksUsage != null && blocksUsage < 0) {
            throw new BusinessException("El uso de bloques no puede ser negativo.");
        }
        if (codeUsage != null && codeUsage < 0) {
            throw new BusinessException("El uso de código no puede ser negativo.");
        }
        if (sensorError != null && sensorError < 0) {
            throw new BusinessException("El error de sensor no puede ser negativo.");
        }
        if (resolutionTime != null && resolutionTime < 0) {
            throw new BusinessException("El tiempo de resolución no puede ser negativo.");
        }
        if (predictedScore != null && (predictedScore < 0 || predictedScore > 100)) {
            throw new BusinessException("El puntaje predicho debe estar entre 0 y 100.");
        }

        this.idSimulation = idSimulation;
        this.result = result;
        this.idStudent = idStudent;
        this.idActivity = idActivity;
        this.blocklyCode = blocklyCode;
        this.pseudocode = pseudocode;
        this.pseintDiagram = pseintDiagram;
        this.blocksUsage = blocksUsage;
        this.codeUsage = codeUsage;
        this.sensorError = sensorError;
        this.resolutionTime = resolutionTime;
        this.predictedScore = predictedScore;
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

    public String getBlocklyCode() {
        return this.blocklyCode;
    }

    public String getPseudocode() {
        return this.pseudocode;
    }

    public String getPseintDiagram() {
        return this.pseintDiagram;
    }

    public Integer getBlocksUsage() {
        return this.blocksUsage;
    }

    public Integer getCodeUsage() {
        return this.codeUsage;
    }

    public Double getSensorError() {
        return this.sensorError;
    }

    public Integer getResolutionTime() {
        return this.resolutionTime;
    }

    public Integer getPredictedScore() {
        return this.predictedScore;
    }

    public static class SimulationBuilder {
        private String idSimulation;
        private SimulationResult result;
        private String idStudent;
        private String idActivity;
        private String blocklyCode;
        private String pseudocode;
        private String pseintDiagram;
        private Integer blocksUsage;
        private Integer codeUsage;
        private Double sensorError;
        private Integer resolutionTime;
        private Integer predictedScore;

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

        public SimulationBuilder blocklyCode(String blocklyCode) {
            this.blocklyCode = blocklyCode;
            return this;
        }

        public SimulationBuilder pseudocode(String pseudocode) {
            this.pseudocode = pseudocode;
            return this;
        }

        public SimulationBuilder pseintDiagram(String pseintDiagram) {
            this.pseintDiagram = pseintDiagram;
            return this;
        }

        public SimulationBuilder blocksUsage(Integer blocksUsage) {
            this.blocksUsage = blocksUsage;
            return this;
        }

        public SimulationBuilder codeUsage(Integer codeUsage) {
            this.codeUsage = codeUsage;
            return this;
        }

        public SimulationBuilder sensorError(Double sensorError) {
            this.sensorError = sensorError;
            return this;
        }

        public SimulationBuilder resolutionTime(Integer resolutionTime) {
            this.resolutionTime = resolutionTime;
            return this;
        }

        public SimulationBuilder predictedScore(Integer predictedScore) {
            this.predictedScore = predictedScore;
            return this;
        }

        public Simulation build() {
            return new Simulation(this.idSimulation, this.result, this.idStudent, this.idActivity,
                    this.blocklyCode, this.pseudocode, this.pseintDiagram, this.blocksUsage,
                    this.codeUsage, this.sensorError, this.resolutionTime, this.predictedScore);
        }

        public String toString() {
            return "Simulation.SimulationBuilder(idSimulation=" + this.idSimulation + ", result=" + this.result + ", idStudent=" + this.idStudent + ", idActivity=" + this.idActivity + ")";
        }
    }
}
