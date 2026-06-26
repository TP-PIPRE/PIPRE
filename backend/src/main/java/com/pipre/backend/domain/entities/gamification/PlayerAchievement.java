package com.pipre.backend.domain.entities.gamification;

import com.pipre.backend.domain.exceptions.BusinessException;
import java.time.LocalDateTime;

public class PlayerAchievement {
    private final String idPlayerAchievement;
    private final String idStudent;
    private final String idAchievement;
    private final LocalDateTime unlockedAt;

    PlayerAchievement(String idPlayerAchievement, String idStudent, String idAchievement, LocalDateTime unlockedAt) {
        if (idPlayerAchievement == null || idPlayerAchievement.isBlank()) throw new BusinessException("El ID del logro de jugador es obligatorio.");
        if (idStudent == null || idStudent.isBlank()) throw new BusinessException("El ID del estudiante es obligatorio.");
        if (idAchievement == null || idAchievement.isBlank()) throw new BusinessException("El ID del logro es obligatorio.");
        this.idPlayerAchievement = idPlayerAchievement;
        this.idStudent = idStudent;
        this.idAchievement = idAchievement;
        this.unlockedAt = unlockedAt != null ? unlockedAt : LocalDateTime.now();
    }

    public static PlayerAchievementBuilder builder() { return new PlayerAchievementBuilder(); }

    public String getIdPlayerAchievement() { return idPlayerAchievement; }
    public String getIdStudent() { return idStudent; }
    public String getIdAchievement() { return idAchievement; }
    public LocalDateTime getUnlockedAt() { return unlockedAt; }

    public static class PlayerAchievementBuilder {
        private String idPlayerAchievement;
        private String idStudent;
        private String idAchievement;
        private LocalDateTime unlockedAt;

        PlayerAchievementBuilder() {}

        public PlayerAchievementBuilder idPlayerAchievement(String idPlayerAchievement) { this.idPlayerAchievement = idPlayerAchievement; return this; }
        public PlayerAchievementBuilder idStudent(String idStudent) { this.idStudent = idStudent; return this; }
        public PlayerAchievementBuilder idAchievement(String idAchievement) { this.idAchievement = idAchievement; return this; }
        public PlayerAchievementBuilder unlockedAt(LocalDateTime unlockedAt) { this.unlockedAt = unlockedAt; return this; }
        public PlayerAchievement build() { return new PlayerAchievement(idPlayerAchievement, idStudent, idAchievement, unlockedAt); }
    }
}
