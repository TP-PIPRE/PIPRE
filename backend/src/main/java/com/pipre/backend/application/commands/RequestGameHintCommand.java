package com.pipre.backend.application.commands;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RequestGameHintCommand(
        @NotBlank String requestId,
        @Min(0) int revision,
        @NotBlank String locale) {
}
