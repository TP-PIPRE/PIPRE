package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.telemetry.TelemetryAttempt;

import java.time.LocalDateTime;
import java.util.UUID;

public class TelemetryAttemptFactory {
    public static TelemetryAttempt createNewAttempt(
            String studentId,
            String game,
            String result,
            Integer tiempoResolucion,
            Integer movimientos,
            Integer reinicios,
            Integer pistasIa,
            LocalDateTime completedAt
    ) {
        return TelemetryAttempt.builder()
                .idAttempt(UUID.randomUUID().toString())
                .studentId(studentId)
                .game(game)
                .result(result)
                .tiempoResolucion(tiempoResolucion)
                .movimientos(movimientos)
                .reinicios(reinicios)
                .pistasIa(pistasIa)
                .completedAt(completedAt)
                .build();
    }
}
