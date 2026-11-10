package com.pipre.backend.application.commands;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RequestGameHintCommand(
        @NotBlank String requestId,
        @NotNull @Min(0) Integer revision,
        @NotBlank String locale) {
}
