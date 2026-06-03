package com.pipre.backend.adapters.in.web.dto;

import java.math.BigDecimal;

public record RatingResponseDTO(
        String result,
        BigDecimal accuracy,
        BigDecimal precision
) {
}
