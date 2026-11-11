package com.pipre.backend.application.commands;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonInclude;

/** Absolute committed coordinates/rotation; draft rotations do not mutate committed pieces. */
public record GameSessionAction(@Min(1) int sequence, @NotBlank String type, String pieceId,
        Integer x, Integer y, Integer rotation, String component, String color, String source,
        @JsonInclude(JsonInclude.Include.NON_NULL) String hintId) {
    public GameSessionAction(int sequence, String type, String pieceId, Integer x, Integer y,
                             Integer rotation, String component, String color, String source) {
        this(sequence, type, pieceId, x, y, rotation, component, color, source, null);
    }
}
