package com.pipre.backend.application.ports.input;

import com.pipre.backend.application.dto.DailyChallengeDTO;

public interface DailyChallengeUseCase {
    DailyChallengeDTO today(String studentId);
    void validate(String studentId, String dailyId, String game, String templateId);
}
