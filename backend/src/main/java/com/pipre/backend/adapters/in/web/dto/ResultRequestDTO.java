package com.pipre.backend.adapters.in.web.dto;

import java.math.BigDecimal;

public record ResultRequestDTO(
        String idStudent,
        String idActivity,
        BigDecimal score,
        Integer attempts
) {
}
