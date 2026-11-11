package com.pipre.backend.domain.exceptions;

public class HintConfirmationRequiredException extends RuntimeException {
    public HintConfirmationRequiredException() {
        super("Confirma que deseas recibir una ayuda que puede reducir tus estrellas.");
    }
}
