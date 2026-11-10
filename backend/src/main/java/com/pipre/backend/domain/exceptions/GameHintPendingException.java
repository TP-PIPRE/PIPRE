package com.pipre.backend.domain.exceptions;

public class GameHintPendingException extends RuntimeException {
    public GameHintPendingException() {
        super("Ya existe una solicitud de pista en curso.");
    }
}
