package com.pipre.backend.application.ports.output;

import java.time.Instant;
import java.util.Optional;

public interface GameSessionHintRepositoryPort {
    Optional<HintReceipt> findByRequest(String sessionId, String requestId);
    Optional<HintReceipt> findById(String hintId);
    long countConsumed(String sessionId);
    long countConsumedForDiagnosis(String sessionId, String diagnosisKey);
    long countPendingSince(String sessionId, Instant since);
    void purgePendingBefore(Instant before);
    boolean consume(String hintId, String sessionId, int revision, int maxHints, Instant consumedAt);
    void save(HintReceipt receipt);

    record HintReceipt(String hintId, String sessionId, String requestId, String requestHash,
                       String diagnosisKey, int revision, String locale, String source,
                       int hintLevel, String type, String message, Integer targetX,
                       Integer targetY, Instant createdAt, Instant consumedAt) {}
}
