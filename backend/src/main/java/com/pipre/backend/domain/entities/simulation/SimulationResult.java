package com.pipre.backend.domain.entities.simulation;

import com.pipre.backend.domain.exceptions.BusinessException;

public enum SimulationResult {
    SUCCESS,
    FAILURE;

    public static SimulationResult fromString(String value) {
        if (value == null || value.isBlank()) {
            throw new BusinessException("El resultado de la simulación es obligatorio.");
        }
        try {
            return SimulationResult.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Resultado de simulación no válido. Debe ser SUCCESS o FAILURE.");
        }
    }
}
