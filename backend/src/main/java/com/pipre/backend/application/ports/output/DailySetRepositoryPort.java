package com.pipre.backend.application.ports.output;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;

public interface DailySetRepositoryPort {
    record Challenge(String id, String studentId, LocalDate date, int slot, String game, int levelNumber,
                     String levelTemplate, String difficulty, JsonNode config, Instant completedAt, int bestStars, Instant startedAt) {
        @com.fasterxml.jackson.annotation.JsonProperty("status") public String status() {
            return completedAt!=null?"COMPLETED":startedAt!=null?"IN_PROGRESS":"PENDING";
        }
    }
    List<Challenge> find(String studentId, LocalDate date);
    Optional<Challenge> findById(String id);
    void save(String studentId, LocalDate date, List<Challenge> challenges);
    void complete(String id, String sessionId, Instant at, int stars);
    void start(String id, Instant at);
}
