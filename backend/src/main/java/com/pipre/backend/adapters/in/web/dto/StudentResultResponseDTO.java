package com.pipre.backend.adapters.in.web.dto;

import java.math.BigDecimal;

public record StudentResultResponseDTO(
        String idActivity,
        BigDecimal score
) {
}
