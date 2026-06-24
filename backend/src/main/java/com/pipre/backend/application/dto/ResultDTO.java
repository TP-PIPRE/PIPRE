package com.pipre.backend.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ResultDTO(
        String idResult,
        String idStudent,
        String idActivity,
        BigDecimal score,
        Integer attempts,
        LocalDateTime date
) {}
