package com.pipre.backend.adapters.in.web.dto;

import java.math.BigDecimal;

public record RankingResponseDTO(
        String idStudent,
        BigDecimal totalPoints,
        Integer position
) {
}
