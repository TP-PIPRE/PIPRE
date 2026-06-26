package com.pipre.backend.application.dto;

import java.math.BigDecimal;

public record RankingDTO(
        String idStudent,
        String studentName,
        BigDecimal totalPoints,
        Integer position,
        Integer level,
        Integer xpTotal,
        Integer totalStars,
        Integer currentStreak,
        Integer maxStreak
) {}
