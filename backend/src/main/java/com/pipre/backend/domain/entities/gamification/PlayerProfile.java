package com.pipre.backend.domain.entities.gamification;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PlayerProfile {
    private final String idRanking;
    private final String idStudent;
    private final String studentName;
    private final BigDecimal totalPoints;
    private final Integer position;
    private final Integer level;
    private final Integer xpTotal;
    private final Integer totalStars;
    private final Integer currentStreak;
    private final Integer maxStreak;
    private final LocalDateTime updatedAt;

    PlayerProfile(String idRanking, String idStudent, String studentName, BigDecimal totalPoints, Integer position,
                  Integer level, Integer xpTotal, Integer totalStars, Integer currentStreak, Integer maxStreak, LocalDateTime updatedAt) {
        this.idRanking = idRanking;
        this.idStudent = idStudent;
        this.studentName = studentName;
        this.totalPoints = totalPoints;
        this.position = position;
        this.level = level != null ? level : 1;
        this.xpTotal = xpTotal != null ? xpTotal : 0;
        this.totalStars = totalStars != null ? totalStars : 0;
        this.currentStreak = currentStreak != null ? currentStreak : 0;
        this.maxStreak = maxStreak != null ? maxStreak : 0;
        this.updatedAt = updatedAt;
    }

    public static PlayerProfileBuilder builder() { return new PlayerProfileBuilder(); }

    public String getIdRanking() { return idRanking; }
    public String getIdStudent() { return idStudent; }
    public String getStudentName() { return studentName; }
    public BigDecimal getTotalPoints() { return totalPoints; }
    public Integer getPosition() { return position; }
    public Integer getLevel() { return level; }
    public Integer getXpTotal() { return xpTotal; }
    public Integer getTotalStars() { return totalStars; }
    public Integer getCurrentStreak() { return currentStreak; }
    public Integer getMaxStreak() { return maxStreak; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public static class PlayerProfileBuilder {
        private String idRanking;
        private String idStudent;
        private String studentName;
        private BigDecimal totalPoints;
        private Integer position;
        private Integer level;
        private Integer xpTotal;
        private Integer totalStars;
        private Integer currentStreak;
        private Integer maxStreak;
        private LocalDateTime updatedAt;

        PlayerProfileBuilder() {}

        public PlayerProfileBuilder idRanking(String idRanking) { this.idRanking = idRanking; return this; }
        public PlayerProfileBuilder idStudent(String idStudent) { this.idStudent = idStudent; return this; }
        public PlayerProfileBuilder studentName(String studentName) { this.studentName = studentName; return this; }
        public PlayerProfileBuilder totalPoints(BigDecimal totalPoints) { this.totalPoints = totalPoints; return this; }
        public PlayerProfileBuilder position(Integer position) { this.position = position; return this; }
        public PlayerProfileBuilder level(Integer level) { this.level = level; return this; }
        public PlayerProfileBuilder xpTotal(Integer xpTotal) { this.xpTotal = xpTotal; return this; }
        public PlayerProfileBuilder totalStars(Integer totalStars) { this.totalStars = totalStars; return this; }
        public PlayerProfileBuilder currentStreak(Integer currentStreak) { this.currentStreak = currentStreak; return this; }
        public PlayerProfileBuilder maxStreak(Integer maxStreak) { this.maxStreak = maxStreak; return this; }
        public PlayerProfileBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public PlayerProfile build() { return new PlayerProfile(idRanking, idStudent, studentName, totalPoints, position, level, xpTotal, totalStars, currentStreak, maxStreak, updatedAt); }
    }
}
