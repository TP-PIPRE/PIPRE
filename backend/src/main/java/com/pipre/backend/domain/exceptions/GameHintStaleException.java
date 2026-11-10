package com.pipre.backend.domain.exceptions;

public class GameHintStaleException extends RuntimeException {
    private final int requestedRevision;
    private final int currentRevision;

    public GameHintStaleException(int requestedRevision, int currentRevision) {
        super("La revisión de la partida está obsoleta.");
        this.requestedRevision = requestedRevision;
        this.currentRevision = currentRevision;
    }

    public int getRequestedRevision() {
        return requestedRevision;
    }

    public int getCurrentRevision() {
        return currentRevision;
    }
}
