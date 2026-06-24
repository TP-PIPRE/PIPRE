package com.pipre.backend.domain.entities.moduleprogress;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ModuleProgress {

    private final String idProgress;
    private final BigDecimal percentage;
    private final String status;
    private final LocalDateTime updatedAt;
    private final String idStudent;
    private final String idModule;

    ModuleProgress(String idProgress, BigDecimal percentage, String status, LocalDateTime updatedAt, String idStudent, String idModule) {
        if (idProgress == null || idProgress.isBlank()) {
            throw new BusinessException("El ID del progreso de módulo es obligatorio.");
        }
        if (idStudent == null || idStudent.isBlank()) {
            throw new BusinessException("El ID del estudiante es obligatorio.");
        }
        if (idModule == null || idModule.isBlank()) {
            throw new BusinessException("El ID del módulo es obligatorio.");
        }
        if (percentage != null && (percentage.compareTo(BigDecimal.ZERO) < 0 || percentage.compareTo(BigDecimal.valueOf(100.0)) > 0)) {
            throw new BusinessException("El porcentaje de progreso debe estar entre 0 y 100.");
        }
        if (updatedAt == null) {
            throw new BusinessException("La fecha de actualización es obligatoria.");
        }
        this.idProgress = idProgress;
        this.percentage = percentage != null ? percentage : BigDecimal.ZERO;
        this.status = status != null ? status : "IN_PROGRESS";
        this.updatedAt = updatedAt;
        this.idStudent = idStudent;
        this.idModule = idModule;
    }

    public static ModuleProgressBuilder builder() {
        return new ModuleProgressBuilder();
    }

    public String getIdProgress() {
        return this.idProgress;
    }

    public BigDecimal getPercentage() {
        return this.percentage;
    }

    public String getStatus() {
        return this.status;
    }

    public LocalDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    public String getIdStudent() {
        return this.idStudent;
    }

    public String getIdModule() {
        return this.idModule;
    }

    public static class ModuleProgressBuilder {
        private String idProgress;
        private BigDecimal percentage;
        private String status;
        private LocalDateTime updatedAt;
        private String idStudent;
        private String idModule;

        ModuleProgressBuilder() {
        }

        public ModuleProgressBuilder idProgress(String idProgress) {
            this.idProgress = idProgress;
            return this;
        }

        public ModuleProgressBuilder percentage(BigDecimal percentage) {
            this.percentage = percentage;
            return this;
        }

        public ModuleProgressBuilder status(String status) {
            this.status = status;
            return this;
        }

        public ModuleProgressBuilder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public ModuleProgressBuilder idStudent(String idStudent) {
            this.idStudent = idStudent;
            return this;
        }

        public ModuleProgressBuilder idModule(String idModule) {
            this.idModule = idModule;
            return this;
        }

        public ModuleProgress build() {
            return new ModuleProgress(this.idProgress, this.percentage, this.status, this.updatedAt, this.idStudent, this.idModule);
        }

        public String toString() {
            return "ModuleProgress.ModuleProgressBuilder(idProgress=" + this.idProgress + ", percentage=" + this.percentage + ", status=" + this.status + ", updatedAt=" + this.updatedAt + ", idStudent=" + this.idStudent + ", idModule=" + this.idModule + ")";
        }
    }
}
