package com.pipre.backend.domain.entities.game;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record GameSession(String sessionId, String clientSessionId, String studentId,
        String game, int levelNumber, String levelTemplate, String activityId, String dailyChallengeId,
        Instant startedAt, Instant completedAt, String status, JsonNode state, int revision,
        long startedOrder, Integer stars, JsonNode completionResponse) {
    public GameSession change(JsonNode state, int revision, String status, Instant completedAt, Integer stars, JsonNode response) {
        return new GameSession(sessionId,clientSessionId,studentId,game,levelNumber,levelTemplate,activityId,dailyChallengeId,
                startedAt,completedAt,status,state,revision,startedOrder,stars,response);
    }
}
