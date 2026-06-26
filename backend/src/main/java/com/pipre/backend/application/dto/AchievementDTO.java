package com.pipre.backend.application.dto;

public record AchievementDTO(
        String idAchievement,
        String code,
        String name,
        String description,
        String icon,
        String category,
        Integer xpReward,
        boolean hidden,
        boolean unlocked,
        String unlockedAt
) {}
