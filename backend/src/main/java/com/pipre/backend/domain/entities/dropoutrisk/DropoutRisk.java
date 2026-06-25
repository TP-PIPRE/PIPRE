package com.pipre.backend.domain.entities.dropoutrisk;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.time.LocalDateTime;

public class DropoutRisk {

    private final String idRisk;
    private final Integer daysInactive;
    private final String performance;
    private final String riskLevel;
    private final String motivationLevel;
    private final LocalDateTime analysisDate;
    private final String idStudent;

    DropoutRisk(String idRisk, Integer daysInactive, String performance, String riskLevel, String motivationLevel, LocalDateTime analysisDate, String idStudent) {
        if (idRisk == null || idRisk.isBlank()) {
            throw new BusinessException("El ID del riesgo de deserción es obligatorio.");
        }
        if (idStudent == null || idStudent.isBlank()) {
            throw new BusinessException("El ID del estudiante es obligatorio.");
        }
        if (riskLevel == null || riskLevel.isBlank()) {
            throw new BusinessException("El nivel de riesgo es obligatorio.");
        }
        if (analysisDate == null) {
            throw new BusinessException("La fecha de análisis es obligatoria.");
        }
        if (daysInactive != null && daysInactive < 0) {
            throw new BusinessException("Los días de inactividad no pueden ser negativos.");
        }
        this.idRisk = idRisk;
        this.daysInactive = daysInactive != null ? daysInactive : 0;
        this.performance = performance;
        this.riskLevel = riskLevel;
        this.motivationLevel = motivationLevel;
        this.analysisDate = analysisDate;
        this.idStudent = idStudent;
    }

    public static DropoutRiskBuilder builder() {
        return new DropoutRiskBuilder();
    }

    public String getIdRisk() {
        return this.idRisk;
    }

    public Integer getDaysInactive() {
        return this.daysInactive;
    }

    public String getPerformance() {
        return this.performance;
    }

    public String getRiskLevel() {
        return this.riskLevel;
    }

    public String getMotivationLevel() {
        return this.motivationLevel;
    }

    public LocalDateTime getAnalysisDate() {
        return this.analysisDate;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public static class DropoutRiskBuilder {
        private String idRisk;
        private Integer daysInactive;
        private String performance;
        private String riskLevel;
        private String motivationLevel;
        private LocalDateTime analysisDate;
        private String idStudent;

        DropoutRiskBuilder() {
        }

        public DropoutRiskBuilder idRisk(String idRisk) {
            this.idRisk = idRisk;
            return this;
        }

        public DropoutRiskBuilder daysInactive(Integer daysInactive) {
            this.daysInactive = daysInactive;
            return this;
        }

        public DropoutRiskBuilder performance(String performance) {
            this.performance = performance;
            return this;
        }

        public DropoutRiskBuilder riskLevel(String riskLevel) {
            this.riskLevel = riskLevel;
            return this;
        }

        public DropoutRiskBuilder motivationLevel(String motivationLevel) {
            this.motivationLevel = motivationLevel;
            return this;
        }

        public DropoutRiskBuilder analysisDate(LocalDateTime analysisDate) {
            this.analysisDate = analysisDate;
            return this;
        }

        public DropoutRiskBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public DropoutRisk build() {
            return new DropoutRisk(this.idRisk, this.daysInactive, this.performance, this.riskLevel, this.motivationLevel, this.analysisDate, this.idStudent);
        }

        public String toString() {
            return "DropoutRisk.DropoutRiskBuilder(idRisk=" + this.idRisk + ", daysInactive=" + this.daysInactive + ", performance=" + this.performance + ", riskLevel=" + this.riskLevel + ", motivationLevel=" + this.motivationLevel + ", analysisDate=" + this.analysisDate + ", idStudent=" + this.idStudent + ")";
        }
    }
}
