package com.pipre.backend.application.ports.output;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProgressiveTutorRepositoryPort {
    Optional<Request> find(String sessionId, String requestId);
    Optional<Request> pending(String studentId, String templateId);
    Optional<Request> lastDelivered(String studentId, String templateId);
    List<String> recentMessages(String studentId, String templateId);

    // Reserve or deliver while holding the student and session locks.
    void save(Request request);
    void finish(String sessionId, String requestId, String message, Instant finishedAt);

    long penaltyCount(String sessionId);
    long pausedMillis(String sessionId, Instant completedAt);

    record Request(String sessionId, String requestId, String studentId, String templateId, int ordinal, int revision,
                   boolean acceptedPenalty, String source, Instant startedAt, Instant expiresAt, String status,
                   String message) {}
}
