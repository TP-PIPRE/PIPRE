package com.pipre.backend.adapters.in.web.dto;

import java.math.BigDecimal;

public record RIA01ResponseDTO(
        String result,
        BigDecimal accuracy,
        BigDecimal precision
) {
}
