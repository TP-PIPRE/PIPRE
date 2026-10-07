package com.pipre.backend.application.commands;

public record SaveAttemptCommand(
        String studentId,
        String game,
        String result,
        Integer tiempoResolucion,
        Integer movimientos,
        Integer reinicios,
        Integer pistasIa,
        String completedAt) {
}
