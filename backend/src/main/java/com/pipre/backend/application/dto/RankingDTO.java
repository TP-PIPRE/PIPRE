package com.pipre.backend.application.dto;

import java.math.BigDecimal;

public record RankingDTO(
        String idStudent,
        BigDecimal totalPoints,
        Integer position
) {}
