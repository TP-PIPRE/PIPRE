package com.pipre.backend.application.commands;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** Absolute committed coordinates/rotation; draft rotations do not mutate committed pieces. */
public record GameSessionAction(@Min(1) int sequence, @NotBlank String type, String pieceId,
        Integer x, Integer y, Integer rotation, String component, String color, String source) {}
