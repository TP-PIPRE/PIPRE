package com.pipre.backend.application.ports.output;

import com.fasterxml.jackson.databind.JsonNode;
import com.pipre.backend.domain.entities.game.GameSession;
import java.time.Instant;
import java.util.Optional;

public interface GameSessionRepositoryPort {
    void lockStudent(String studentId);
    Optional<GameSession> findByClientId(String studentId, String clientSessionId);
    Optional<GameSession> active(String studentId);
    Optional<GameSession> lockSession(String sessionId);
    void abandonActive(String studentId, Instant now);
    GameSession insert(GameSession session);
    void update(GameSession session);
    Optional<ActionReceipt> findAction(String sessionId, int sequence);
    void saveAction(String sessionId, int sequence, String hash, JsonNode payload, Instant receivedAt, JsonNode response);
    record ActionReceipt(String hash, JsonNode response) {}
}
