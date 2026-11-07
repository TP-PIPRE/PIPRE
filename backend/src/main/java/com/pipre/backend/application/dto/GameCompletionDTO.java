package com.pipre.backend.application.dto;

import java.util.List;

public record GameCompletionDTO(String sessionId, String game, int levelNumber, int stars,
        int bestStars, String completedAt, long durationMs, List<AchievementDTO> newAchievements,
        DailyChallengeDTO daily,GameScoreDTO score) {
    public GameCompletionDTO(String sessionId,String game,int levelNumber,int stars,int bestStars,String completedAt,
            long durationMs,List<AchievementDTO> newAchievements,DailyChallengeDTO daily) {
        this(sessionId,game,levelNumber,stars,bestStars,completedAt,durationMs,newAchievements,daily,null);
    }
}
