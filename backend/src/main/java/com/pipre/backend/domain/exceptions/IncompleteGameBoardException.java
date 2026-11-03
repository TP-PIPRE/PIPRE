package com.pipre.backend.domain.exceptions;

/** A failed completion probe commits only its server-side failed-check counter, never progress. */
public class IncompleteGameBoardException extends BusinessException {
    public IncompleteGameBoardException() { super("El tablero todavía no cumple la solución del reto."); }
}
