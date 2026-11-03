package com.pipre.backend.application.commands;

import java.time.Instant;

/** Internal command emitted only by the server's verified game-session service. */
public record VerifiedVictory(String studentId, String sessionId, String game, int levelNumber,
        String levelTemplate, String activityId, Instant startedAt, Instant completedAt,
        int stars, String dailyChallengeId, long startedOrder) {}
