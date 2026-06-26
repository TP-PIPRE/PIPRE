package com.pipre.backend.domain.entities.gamification;

import com.pipre.backend.domain.exceptions.BusinessException;

public class Achievement {
    private final String idAchievement;
    private final String code;
    private final String name;
    private final String description;
    private final String icon;
    private final String category;
    private final int xpReward;
    private final boolean hidden;

    Achievement(String idAchievement, String code, String name, String description, String icon, String category, int xpReward, boolean hidden) {
        if (idAchievement == null || idAchievement.isBlank()) throw new BusinessException("El ID del logro es obligatorio.");
        if (code == null || code.isBlank()) throw new BusinessException("El código del logro es obligatorio.");
        if (name == null || name.isBlank()) throw new BusinessException("El nombre del logro es obligatorio.");
        if (xpReward < 0) throw new BusinessException("La recompensa de XP no puede ser negativa.");
        this.idAchievement = idAchievement;
        this.code = code;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.category = category;
        this.xpReward = xpReward;
        this.hidden = hidden;
    }

    public static AchievementBuilder builder() { return new AchievementBuilder(); }

    public String getIdAchievement() { return idAchievement; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }
    public String getCategory() { return category; }
    public int getXpReward() { return xpReward; }
    public boolean isHidden() { return hidden; }

    public static class AchievementBuilder {
        private String idAchievement;
        private String code;
        private String name;
        private String description;
        private String icon;
        private String category;
        private int xpReward;
        private boolean hidden;

        AchievementBuilder() {}

        public AchievementBuilder idAchievement(String idAchievement) { this.idAchievement = idAchievement; return this; }
        public AchievementBuilder code(String code) { this.code = code; return this; }
        public AchievementBuilder name(String name) { this.name = name; return this; }
        public AchievementBuilder description(String description) { this.description = description; return this; }
        public AchievementBuilder icon(String icon) { this.icon = icon; return this; }
        public AchievementBuilder category(String category) { this.category = category; return this; }
        public AchievementBuilder xpReward(int xpReward) { this.xpReward = xpReward; return this; }
        public AchievementBuilder hidden(boolean hidden) { this.hidden = hidden; return this; }
        public Achievement build() { return new Achievement(idAchievement, code, name, description, icon, category, xpReward, hidden); }
    }
}
