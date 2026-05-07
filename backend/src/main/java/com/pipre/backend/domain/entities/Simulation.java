package com.pipre.backend.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Simulation {

    private final String idSimulation;
    private final Boolean isRandom;
    private final Integer blocksUsage;
    private final Integer codeUsage;
    private final BigDecimal sensorError;
    private final String blocklyCode;
    private final String pythonCode;
    private final Integer resolutionTime;
    private final String result;
    private final LocalDateTime date;
    private final String idStudent;
    private final String idActivity;

    public Simulation(Builder builder) {
        this.idSimulation = builder.idSimulation;
        this.isRandom = builder.isRandom;
        this.blocksUsage = builder.blocksUsage;
        this.codeUsage = builder.codeUsage;
        this.sensorError = builder.sensorError;
        this.blocklyCode = builder.blocklyCode;
        this.pythonCode = builder.pythonCode;
        this.resolutionTime = builder.resolutionTime;
        this.result = builder.result;
        this.date = builder.date;
        this.idStudent = builder.idStudent;
        this.idActivity = builder.idActivity;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getIdSimulation() {
        return this.idSimulation;
    }

    public Boolean getIsRandom() {
        return this.isRandom;
    }

    public Integer getBlocksUsage() {
        return this.blocksUsage;
    }

    public Integer getCodeUsage() {
        return this.codeUsage;
    }

    public BigDecimal getSensorError() {
        return this.sensorError;
    }

    public String getBlocklyCode() {
        return this.blocklyCode;
    }

    public String getPythonCode() {
        return this.pythonCode;
    }

    public Integer getResolutionTime() {
        return this.resolutionTime;
    }

    public String getResult() {
        return this.result;
    }

    public LocalDateTime getDate() {
        return this.date;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public String getIdActivity() {
        return this.idActivity;
    }

    public static class Builder {
        private String idSimulation;
        private Boolean isRandom;
        private Integer blocksUsage;
        private Integer codeUsage;
        private BigDecimal sensorError;
        private String blocklyCode;
        private String pythonCode;
        private Integer resolutionTime;
        private String result;
        private LocalDateTime date;
        private String idStudent;
        private String idActivity;

        public Builder() {
        }

        public Builder idSimulation(String idSimulation) {
            this.idSimulation = idSimulation;
            return this;
        }

        public Builder isRandom(Boolean isRandom) {
            this.isRandom = isRandom;
            return this;
        }

        public Builder blocksUsage(Integer blocksUsage) {
            this.blocksUsage = blocksUsage;
            return this;
        }

        public Builder codeUsage(Integer codeUsage) {
            this.codeUsage = codeUsage;
            return this;
        }

        public Builder sensorError(BigDecimal sensorError) {
            this.sensorError = sensorError;
            return this;
        }

        public Builder blocklyCode(String blocklyCode) {
            this.blocklyCode = blocklyCode;
            return this;
        }

        public Builder pythonCode(String pythonCode) {
            this.pythonCode = pythonCode;
            return this;
        }

        public Builder resolutionTime(Integer resolutionTime) {
            this.resolutionTime = resolutionTime;
            return this;
        }

        public Builder result(String result) {
            this.result = result;
            return this;
        }

        public Builder date(LocalDateTime date) {
            this.date = date;
            return this;
        }

        public Builder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public Builder idActivity(String idActivity) {
            this.idActivity = idActivity;
            return this;
        }

        public Simulation build() {
            return new Simulation(this);
        }

    }
}
