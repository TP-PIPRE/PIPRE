package com.pipre.backend.domain.entities.course;

public enum CourseLevel {
    LOW,
    MEDIUM,
    HIGH;

    public static CourseLevel fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("El nivel del curso no puede ser nulo o vacío");
        }
        try {
            return CourseLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Nivel de curso inválido. Valores permitidos: low, medium, high");
        }
    }
}
