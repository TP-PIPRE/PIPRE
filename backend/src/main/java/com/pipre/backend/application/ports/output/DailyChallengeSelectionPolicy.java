package com.pipre.backend.application.ports.output;

import java.time.LocalDate;
import java.util.List;

/** Future adaptive selectors supply specifications; they never bypass generation or validation. */
public interface DailyChallengeSelectionPolicy {
    record Specification(String game, int level, int left, int top, int right, int bottom) {}
    List<Specification> select(String studentId, LocalDate date);
}
