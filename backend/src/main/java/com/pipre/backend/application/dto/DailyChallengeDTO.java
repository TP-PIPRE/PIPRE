package com.pipre.backend.application.dto;

public record DailyChallengeDTO(String id, String date, String timeZone, String game,
        int levelNumber, String levelTemplate, boolean completed, int currentStreak, int bestStreak) {}
