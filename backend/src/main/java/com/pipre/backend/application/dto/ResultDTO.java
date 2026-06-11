package com.pipre.backend.application.dto;

import java.math.BigDecimal;

public record ResultDTO(
        String idActivity,
        BigDecimal score
) {}
