package com.pipre.backend.application.dto;

import java.util.List;

public record VictoryAwardsDTO(int bestStars, List<AchievementDTO> newAchievements, DailyChallengeDTO daily) {}
