package com.pipre.backend.adapters.in.web.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveAttemptRequestDTO(
        @Schema(example = "USR-001")
        @NotBlank(message = "El studentId no puede estar vacío")
        String studentId,
        @Schema(example = "tetrilogic")
        @NotBlank(message = "El juego no puede estar vacío")
        String game,
        @Schema(example = "SUCCESS")
        @NotBlank(message = "El resultado no puede estar vacío")
        String result,
        @Schema(example = "45")
        @NotNull(message = "El tiempo de resolución no puede ser nulo")
        @Min(value = 0, message = "El tiempo de resolución no puede ser negativo")
        Integer tiempoResolucion,
        @Schema(example = "12")
        @NotNull(message = "Los movimientos no pueden ser nulos")
        @Min(value = 0, message = "Los movimientos no pueden ser negativos")
        Integer movimientos,
        @Schema(example = "0")
        @NotNull(message = "Los reinicios no pueden ser nulos")
        @Min(value = 0, message = "Los reinicios no pueden ser negativos")
        Integer reinicios,
        @Schema(example = "1")
        @NotNull(message = "Las pistas no pueden ser nulas")
        @Min(value = 0, message = "Las pistas no pueden ser negativas")
        Integer pistasIa,
        @Schema(example = "2026-10-07T15:00:00Z")
        @NotBlank(message = "La fecha de finalización no puede estar vacía")
        String completedAt) {
}
