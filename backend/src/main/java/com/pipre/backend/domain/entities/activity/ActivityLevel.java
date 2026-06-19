package com.pipre.backend.domain.entities.activity;

public enum ActivityLevel {
    LOW,
    MEDIUM,
    HIGH;

    public static ActivityLevel fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return ActivityLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Nivel de lógica de actividad inválido. Valores permitidos: low, medium, high");
        }
    }
}
