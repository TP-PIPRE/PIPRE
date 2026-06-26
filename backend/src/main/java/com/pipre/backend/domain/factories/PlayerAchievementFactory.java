package com.pipre.backend.domain.factories;

import com.pipre.backend.domain.entities.gamification.PlayerAchievement;
import java.util.UUID;

public class PlayerAchievementFactory {
    public static PlayerAchievement createPlayerAchievement(String idStudent, String idAchievement) {
        return PlayerAchievement.builder()
                .idPlayerAchievement(UUID.randomUUID().toString())
                .idStudent(idStudent)
                .idAchievement(idAchievement)
                .build();
    }
}
