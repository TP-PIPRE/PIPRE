package com.pipre.backend.domain.exceptions;

public class ProgressiveHintUnavailableException extends RuntimeException {
    public ProgressiveHintUnavailableException() {
        super("La ayuda personalizada no está disponible en este momento. Inténtalo de nuevo.");
    }
}
