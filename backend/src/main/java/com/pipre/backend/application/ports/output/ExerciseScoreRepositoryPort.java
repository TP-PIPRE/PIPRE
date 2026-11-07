package com.pipre.backend.application.ports.output;

import com.pipre.backend.application.dto.GameScoreDTO;
import com.pipre.backend.domain.entities.game.GameSession;
import java.time.LocalDate;
import java.util.Optional;

public interface ExerciseScoreRepositoryPort {
    Optional<GameScoreDTO> receipt(String sessionId);
    int best(String studentId,String exerciseKey);
    void improve(GameSession session,String exerciseKey,int points);
    long total(String studentId);
    int creditDailyXp(GameSession session,LocalDate date);
    void saveReceipt(GameSession session,GameScoreDTO score,long durationMs,int moves,int referenceMoves);
}
