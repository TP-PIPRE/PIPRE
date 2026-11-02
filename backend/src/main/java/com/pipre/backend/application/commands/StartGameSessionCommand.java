package com.pipre.backend.application.commands;

import jakarta.validation.constraints.NotBlank;

public record StartGameSessionCommand(@NotBlank String studentId, @NotBlank String clientSessionId,
        @NotBlank String game, @NotBlank String levelTemplate, String activityId, String dailyChallengeId) {}
