package com.pipre.backend.application.dto;

import java.util.List;

public record GameProgressDTO(List<Level> levels, int completedLevels, int totalLevels,
        int totalStars, int currentStreak, int bestStreak) {
    public record Level(String game, int levelNumber, boolean completed, int bestStars,
            String firstCompletedAt, String lastCompletedAt) {}
}
