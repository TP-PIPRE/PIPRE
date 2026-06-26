package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.gamification.Achievement;
import java.util.UUID;

public class AchievementFactory {
    public static Achievement createAchievement(String code, String name, String description, String icon, String category, int xpReward, boolean hidden) {
        return Achievement.builder()
                .idAchievement(UUID.randomUUID().toString())
                .code(code)
                .name(name)
                .description(description)
                .icon(icon)
                .category(category)
                .xpReward(xpReward)
                .hidden(hidden)
                .build();
    }
}
