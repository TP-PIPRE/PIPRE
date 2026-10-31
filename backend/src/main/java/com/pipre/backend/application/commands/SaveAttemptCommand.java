package com.pipre.backend.application.commands;

public record SaveAttemptCommand(
        String studentId,
        String game,
        String result,
        Integer tiempoResolucion,
        Integer movimientos,
        Integer reinicios,
        Integer pistasIa,
        String completedAt,
        com.fasterxml.jackson.databind.JsonNode trace) {
    public SaveAttemptCommand(String studentId, String game, String result, Integer tiempoResolucion, Integer movimientos, Integer reinicios, Integer pistasIa, String completedAt) {
        this(studentId, game, result, tiempoResolucion, movimientos, reinicios, pistasIa, completedAt, null);
    }
}
