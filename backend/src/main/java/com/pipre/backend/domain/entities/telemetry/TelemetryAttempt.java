package com.pipre.backend.domain.entities.telemetry;

import com.pipre.backend.domain.exceptions.BusinessException;

import java.time.LocalDateTime;

public class TelemetryAttempt {

    private final String idAttempt;
    private final String studentId;
    private final String game;
    private final String result;
    private final Integer tiempoResolucion;
    private final Integer movimientos;
    private final Integer reinicios;
    private final Integer pistasIa;
    private final LocalDateTime completedAt;

    TelemetryAttempt(String idAttempt, String studentId, String game, String result,
                     Integer tiempoResolucion, Integer movimientos, Integer reinicios,
                     Integer pistasIa, LocalDateTime completedAt) {
        if (idAttempt == null || idAttempt.isBlank()) {
            throw new BusinessException("El ID del intento es obligatorio.");
        }
        if (studentId == null || studentId.isBlank()) {
            throw new BusinessException("El ID del estudiante es obligatorio.");
        }
        if (game == null || game.isBlank()) {
            throw new BusinessException("El juego es obligatorio.");
        }
        if (result == null || result.isBlank()) {
            throw new BusinessException("El resultado es obligatorio.");
        }
        if (tiempoResolucion != null && tiempoResolucion < 0) {
            throw new BusinessException("El tiempo de resolución no puede ser negativo.");
        }
        if (movimientos != null && movimientos < 0) {
            throw new BusinessException("Los movimientos no pueden ser negativos.");
        }
        if (reinicios != null && reinicios < 0) {
            throw new BusinessException("Los reinicios no pueden ser negativos.");
        }
        if (pistasIa != null && pistasIa < 0) {
            throw new BusinessException("Las pistas no pueden ser negativas.");
        }

        this.idAttempt = idAttempt;
        this.studentId = studentId;
        this.game = game;
        this.result = result;
        this.tiempoResolucion = tiempoResolucion;
        this.movimientos = movimientos;
        this.reinicios = reinicios;
        this.pistasIa = pistasIa;
        this.completedAt = completedAt != null ? completedAt : LocalDateTime.now();
    }

    public static TelemetryAttemptBuilder builder() {
        return new TelemetryAttemptBuilder();
    }

    public String getIdAttempt() {
        return this.idAttempt;
    }

    public String getStudentId() {
        return this.studentId;
    }

    public String getGame() {
        return this.game;
    }

    public String getResult() {
        return this.result;
    }

    public Integer getTiempoResolucion() {
        return this.tiempoResolucion;
    }

    public Integer getMovimientos() {
        return this.movimientos;
    }

    public Integer getReinicios() {
        return this.reinicios;
    }

    public Integer getPistasIa() {
        return this.pistasIa;
    }

    public LocalDateTime getCompletedAt() {
        return this.completedAt;
    }

    public static class TelemetryAttemptBuilder {
        private String idAttempt;
        private String studentId;
        private String game;
        private String result;
        private Integer tiempoResolucion;
        private Integer movimientos;
        private Integer reinicios;
        private Integer pistasIa;
        private LocalDateTime completedAt;

        TelemetryAttemptBuilder() {
        }

        public TelemetryAttemptBuilder idAttempt(String idAttempt) {
            this.idAttempt = idAttempt;
            return this;
        }

        public TelemetryAttemptBuilder studentId(String studentId) {
            this.studentId = studentId;
            return this;
        }

        public TelemetryAttemptBuilder game(String game) {
            this.game = game;
            return this;
        }

        public TelemetryAttemptBuilder result(String result) {
            this.result = result;
            return this;
        }

        public TelemetryAttemptBuilder tiempoResolucion(Integer tiempoResolucion) {
            this.tiempoResolucion = tiempoResolucion;
            return this;
        }

        public TelemetryAttemptBuilder movimientos(Integer movimientos) {
            this.movimientos = movimientos;
            return this;
        }

        public TelemetryAttemptBuilder reinicios(Integer reinicios) {
            this.reinicios = reinicios;
            return this;
        }

        public TelemetryAttemptBuilder pistasIa(Integer pistasIa) {
            this.pistasIa = pistasIa;
            return this;
        }

        public TelemetryAttemptBuilder completedAt(LocalDateTime completedAt) {
            this.completedAt = completedAt;
            return this;
        }

        public TelemetryAttempt build() {
            return new TelemetryAttempt(this.idAttempt, this.studentId, this.game, this.result,
                    this.tiempoResolucion, this.movimientos, this.reinicios,
                    this.pistasIa, this.completedAt);
        }
    }
}
