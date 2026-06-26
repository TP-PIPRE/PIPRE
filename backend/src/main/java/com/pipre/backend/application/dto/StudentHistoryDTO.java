package com.pipre.backend.application.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StudentHistoryDTO(
        String idResult,
        String idActivity,
        String activityName,
        BigDecimal score,
        Integer stars,
        Integer xpEarned,
        Double efficiency,
        LocalDateTime dateAttempted
) {}
